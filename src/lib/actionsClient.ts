/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { jwtVerify, SignJWT } from "jose";
import Cookies from 'js-cookie';
import { loginAdmin, loginManager } from "./actions";
import { Role, localDb } from "./dexie/dbSchema";
import { userActions } from "./dexie/dexieActions";
import { isOnline } from "./utils/network";
import bcrypt from "bcryptjs";

const secretKey = "secret";
const key = new TextEncoder().encode(secretKey);

// Client-side translation helper
async function getClientTranslations(namespace: string) {
  // Get locale from cookie or default to 'ar'
  const locale = Cookies.get('NEXT_LOCALE') || 'ar';
  
  // Dynamically import the dictionary file
  const messages = await import(`../../dictionary/${locale}.json`);
  
  // Get the namespace (e.g., 'auth')
  const namespaceMessages = messages.default[namespace] || {};
  
  // Return a translation function
  return (key: string): string => {
    const keys = key.split('.');
    let value: any = namespaceMessages;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    return typeof value === 'string' ? value : key;
  };
}

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

// Consistent error type
type LoginError = {
  error: { field: "email" | "password" | "role" | "db" | "general", message: string },
  success: false,
  role: string,
  data: undefined
}

export async function loginWithRole(state: unknown, formData: FormData): Promise<
  LoginError | { data: { user: any }, success: true, role: string }
> {
  const submittedRole =
    (formData.get("role") as string) === "manager" ? "manager" : "admin";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const ADMIN_EMAIL = "admin@admin.com";
  // const ADMIN_PASSWORD = "admin"; // Replace with your strong password
  const hashedAdminPassword = "$2b$10$08j0woT3eQ021kqX3w4R2.RLntSwjIuPDVVsUVwtqNc546.Bjkemq"
  try {
    const t = await getClientTranslations('auth');
    
    // Validate inputs
    if (!email || !password) {
      return {
        error: { field: "general", message: t('validation.emailRequired') + " " + t('validation.passwordRequired') },
        success: false,
        role: submittedRole,
        data: undefined,
      };
    }

    if (!userActions.getLocalByEmail) {
      return {
        error: { field: "db", message: t('errors.unexpectedError') },
        success: false,
        role: submittedRole,
        data: undefined,
      };
    }

    try {
      await localDb.open();
    } catch {
      return {
        error: { field: "db", message: t('errors.unexpectedError') },
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
          error: { field: "password", message: t('errors.loginFailed') },
          success: false,
          role: submittedRole,
          data: undefined,
        };
      }

      const expectedRole = submittedRole === "manager" ? Role.MANAGER : Role.ADMIN;
      if (localUser.role !== expectedRole) {
        return {
          error: { field: "role", message: t('errors.unexpectedError') },
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
              data: { user: result.data.user },
              success: true,
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
    const checkPassword =  await bcrypt.compare(password, hashedAdminPassword);
    
    if (submittedRole === "admin" && email === ADMIN_EMAIL && checkPassword) {
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
    const tNotFound = await getClientTranslations('auth');
    return {
      error: { field: "email", message: tNotFound('errors.loginFailed') },
      success: false,
      role: submittedRole,
      data: undefined,
    };
  } catch (error) {
    const t = await getClientTranslations('auth');
    const errorMessage =
      error instanceof Error
        ? error.message
        : t('errors.unexpectedError');
    return {
      error: { field: "general", message: errorMessage },
      success: false,
      role: submittedRole,
      data: undefined,
    };
  }
}
