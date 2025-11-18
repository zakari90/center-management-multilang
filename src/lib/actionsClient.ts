/* eslint-disable prefer-const */
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
  const session = Cookies.get("session");
  if (!session) return null;
  return await decrypt(session);
}

// Combined login logic
export async function loginWithRole(state: unknown, formData: FormData) {
  const submittedRole =
    (formData.get("role") as string) === "manager" ? "manager" : "admin";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const ADMIN_EMAIL = "admin@admin.com";
  const ADMIN_PASSWORD = "your_admin_password"; // Replace with your strong password

  try {
    // Validate inputs
    if (!email || !password) {
      return {
        error: { message: "Email and password are required." },
        success: false,
        role: submittedRole,
        data: undefined,
      };
    }

    if (!userActions.getLocalByEmail) {
      return {
        error: { message: "Database not initialized. Please refresh the page." },
        success: false,
        role: submittedRole,
        data: undefined,
      };
    }

    try {
      await localDb.open();
    } catch (dbError: any) {
      return {
        error: { message: `Database error: ${dbError?.message || "Please refresh the page."}` },
        success: false,
        role: submittedRole,
        data: undefined,
      };
    }

    // First, check if user exists locally
    let localUser: any = await userActions.getLocalByEmail(email);

    // If user found locally, authenticate and return
    if (localUser) {
      if (localUser.password !== password) {
        return {
          error: { password: "Incorrect password." },
          success: false,
          role: submittedRole,
          data: undefined,
        };
      }

      const expectedRole = submittedRole === "manager" ? Role.MANAGER : Role.ADMIN;
      if (localUser.role !== expectedRole) {
        return {
          error: { message: `Invalid role. Expected ${expectedRole}, got ${localUser.role}` },
          success: false,
          role: submittedRole,
          data: undefined,
        };
      }

      // Set session
      const userForSession = {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role,
      };
      const session = await encrypt({ user: userForSession });
      Cookies.set("session", session, {
        expires: 7,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      });

      // Try online login if online
      if (isOnline()) {
        try {
          const result = submittedRole === "manager"
            ? await loginManager(state, formData)
            : await loginAdmin(state, formData);
          if (result.success) {
            try {
              await userActions.putLocal({
                ...localUser,
                ...(result.data?.user && {
                  ...result.data.user
                }),
                status: '1' as const,
                updatedAt: Date.now(),
              });
            } catch {
              // Ignore sync update error
            }
            return {
              ...result,
              role: submittedRole,
            };
          }
        } catch {
          // Ignore online login error, fallback to offline
        }
      }
      // Local user success
      return {
        data: { user: userForSession },
        success: true,
        role: submittedRole,
      };
    }

    // User not found locally — only admin fallback allowed
    if (submittedRole === "admin" && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = {
        id: "admin",
        name: "Admin",
        email: ADMIN_EMAIL,
        role: Role.ADMIN,
      };
      const session = await encrypt({ user: adminUser });
      Cookies.set("session", session, {
        expires: 7,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      });
      return {
        data: { user: adminUser },
        success: true,
        role: submittedRole,
      };
    }

    // If not admin, return not found
    return {
      error: { message: "User not found." },
      success: false,
      role: submittedRole,
      data: undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Internal server error. Please check the console for details.";
    return {
      error: { message: errorMessage },
      success: false,
      role: submittedRole,
      data: undefined,
    };
  }
}
