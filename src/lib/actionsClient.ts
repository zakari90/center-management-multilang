/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { jwtVerify, SignJWT } from "jose";
import Cookies from 'js-cookie';
import { loginAdmin, loginManager } from "./actions";
import { Role, localDb } from "./dexie/dbSchema";
import { userActions } from "./dexie/dexieActions";
import { isOnline } from "./utils/network";


const secretKey = "secret";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(key);
}
export async function decrypt(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}
export async function getSession() {
  const session =Cookies.get("session");
  if (!session) return null;
  return await decrypt(session);
}

// Combined login action that routes based on role and returns role info
export async function loginWithRole(state: unknown, formData: FormData) {
  const submittedRole = (formData.get("role") as string) === "manager" ? "manager" : "admin"

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  
try {
  // Validate inputs
  if (!email || !password) {
    return {
      error: { message: "Email and password are required." },
      success: false,
      role: submittedRole,
      data: undefined,
    }
  }

  // ✅ Check if getLocalByEmail is available
  if (!userActions.getLocalByEmail) {
    console.error("getLocalByEmail is not available on userActions")
    return {
      error: { message: "Database not initialized. Please refresh the page." },
      success: false,
      role: submittedRole,
      data: undefined,
    }
  }

  // ✅ Ensure database is open (Dexie handles already-open gracefully)
  try {
    await localDb.open();
  } catch (dbError: any) {
    // Dexie.open() is idempotent - it won't error if already open
    // If we get an error, it's a real problem
    console.error("Database open error:", dbError);
    return {
      error: { message: `Database error: ${dbError?.message || 'Please refresh the page.'}` },
      success: false,
      role: submittedRole,
      data: undefined,
    }
  }

  // ✅ First, check if user exists in local DB
  let localUser;
  try {
    localUser = await userActions.getLocalByEmail(email);
  } catch (queryError) {
    console.error("Error querying user from local DB:", queryError);
    return {
      error: { message: `Database query error: ${queryError instanceof Error ? queryError.message : 'Please try again.'}` },
      success: false,
      role: submittedRole,
      data: undefined,
    }
  }
  
  if (!localUser) {
    return {
      error: { email: "User not found." },
      success: false,
      role: submittedRole,
      data: undefined,
    }
  }

  // ✅ Verify password (stored as plain text in local DB for now)
  if (localUser.password !== password) {
    return {
      error: { password: "Incorrect password." },
      success: false,
      role: submittedRole,
      data: undefined,
    }
  }

  // ✅ Check role matches
  const expectedRole = submittedRole === "manager" ? Role.MANAGER : Role.ADMIN;
  if (localUser.role !== expectedRole) {
    return {
      error: { message: `Invalid role. Expected ${expectedRole}, got ${localUser.role}` },
      success: false,
      role: submittedRole,
      data: undefined,
    }
  }

  // ✅ Create session with user data
  const userForSession = {
    id: localUser.id,
    name: localUser.name,
    email: localUser.email,
    role: localUser.role,
  }
  
  // ✅ Encrypt session token
  let session: string;
  try {
    session = await encrypt({ user: userForSession });
  } catch (encryptError) {
    console.error("Session encryption error:", encryptError);
    return {
      error: { message: "Failed to create session. Please try again." },
      success: false,
      role: submittedRole,
      data: undefined,
    }
  }

  // ✅ Set cookie with proper attributes (client-side only - httpOnly cannot be set from JS)
  Cookies.set('session', session, { 
    expires: 7, // 7 days
    sameSite: 'lax', // Allow server to read it
    path: '/', // Available site-wide
    secure: process.env.NODE_ENV === 'production', // Only send in HTTPS (if available)
  })

  // ✅ Try online login/sync if available (wrapped in try-catch to not break offline login)
  if(isOnline()){
    try {
      const result = submittedRole === "manager"
        ? await loginManager(state, formData)
        : await loginAdmin(state, formData)
      
      if(result.success){
        // ✅ Update local user with server data if sync succeeds
        try {
          await userActions.putLocal({
            ...localUser,
            ...(result.data?.user && {
              id: result.data.user.id,
              name: result.data.user.name,
              email: result.data.user.email,
              role: result.data.user.role,
            }),
            status: '1' as const, // Mark as synced
            updatedAt: Date.now(),
          })
        } catch (updateError) {
          console.error("Failed to update local user after sync:", updateError);
          // Continue with login even if update fails
        }
        
        return {
          ...result,
          role: submittedRole,
        }
      }
      // ✅ If online login fails but user exists locally, still allow offline login
      // (This handles the case where user exists locally but not on server yet)
    } catch (onlineError) {
      console.error("Online login/sync error (falling back to offline):", onlineError);
      // Continue with offline login - don't break the flow
    }
  }

  // ✅ Return success with local user data
  return {
    data: { user: userForSession },
    success: true,
    role: submittedRole,
  }
} catch (error) {
  console.error("Error in loginWithRole:", error);
  
  // Provide more specific error messages
  const errorMessage = error instanceof Error 
    ? error.message 
    : "Internal server error. Please check the console for details.";
  
  return {
    error: { message: errorMessage },
    success: false,
    role: submittedRole,
    data: undefined,
  }
}

}

