/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { jwtVerify, SignJWT } from "jose";
import { loginAdmin, loginManager } from "./actions"
import { userActions } from "./dexie/dexieActions";
import { generateObjectId } from "./utils/generateObjectId";
import { isOnline } from "./utils/network";
import Cookies from 'js-cookie'
import { Role } from "./dexie/dbSchema";


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
  const id = generateObjectId();

  
try {
  await userActions.putLocal({
    id,
    email,
    password,
    name:email.split('@')[0],
    role: submittedRole === "manager" ? Role.MANAGER : Role.ADMIN,
    createdAt:  Date.now(),
    updatedAt:  Date.now(),
    status: '0',
  })
  const localResult = await userActions.getLocalByEmail?.(email);  
  const session = await encrypt({ user: localResult })

  // ✅ Set cookie with proper attributes so server can read it
  Cookies.set('session', session, { 
    expires: 7, // 7 days
    sameSite: 'lax', // Allow server to read it
    path: '/', // Available site-wide
    secure: process.env.NODE_ENV === 'production', // Only send in HTTPS
    httpOnly: true, // Prevent client-side JavaScript access
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined, // Set domain for production
    sameParty: process.env.NODE_ENV === 'production', // Only send in same party
    priority: 'high', // Set priority
    partition: 'session', // Set partition
    size: 1024, // Set size
  })

  if(isOnline()){
     const result = submittedRole === "manager"
    ? await loginManager(state, formData)
    : await loginAdmin(state, formData)
    if(result.success){
      await userActions.markSynced(id)
      return {
        ...result,
        role: submittedRole,
      }
    }
    // ✅ Return error if online login fails
    if(result.error){
      return {
        ...result,
        success: false,
      }
    }
  }
return {
  data: localResult,
  success: true,
}
} catch (error) {
  console.log("Error in loginWithRole", error);
  
  return {
    error: { message: "Internal server error" },
    success: false,
  }
}

}

