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
  if (!session) {
    console.log('[getSession] no session cookie found');
    return null;
  }
  try {
    const decoded = await decrypt(session);
    console.log('[getSession] session decoded', { hasUser: !!(decoded as any)?.user });
    return decoded;
  } catch (error) {
    console.error('[getSession] failed to decrypt session cookie', error);
    Cookies.remove('session', { path: '/' });
    return null;
  }
}

async function openLocalDbWithTimeout(timeoutMs = 2500) {
  await Promise.race([
    localDb.open(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("IndexedDB open timeout")), timeoutMs)
    ),
  ]);
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

    // 100% client-side: try online login first to cache user, then fall back to local
    if (isOnline()) {
      try {
        const result = submittedRole === "manager"
          ? await loginManager(state, formData)
          : await loginAdmin(state, formData);

        if (result?.success && (result as any)?.data?.user) {
          const serverUser = (result as any).data.user;
          // Cache to Dexie for future offline use
          try {
            await openLocalDbWithTimeout();
            await userActions.putLocal({
              id: serverUser.id,
              name: serverUser.name,
              email: serverUser.email,
              role: serverUser.role,
              password,
              status: '1' as const,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          } catch {
            // Ignore local caching failures
          }

          // No session cookie; just return user
          return {
            data: { user: serverUser },
            success: true,
            role: submittedRole,
          };
        }
      } catch {
        // If online login fails, fall back to local/offline flow
      }
    }

    // Local/offline flow
    try {
      await openLocalDbWithTimeout();
    } catch {
      return {
        error: { field: "db", message: t('errors.unexpectedError') },
        success: false,
        role: submittedRole,
        data: undefined,
      };
    }

    let localUser: any = await userActions.getLocalByEmail(email);

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

      const userForSession = {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role,
      };

      // No session cookie; just return user
      return {
        data: { user: userForSession },
        success: true,
        role: submittedRole,
      };
    }

    // Admin fallback (hardcoded)
    const checkPassword = await bcrypt.compare(password, hashedAdminPassword);
    if (submittedRole === "admin" && email === ADMIN_EMAIL && checkPassword) {
      const adminUser = {
        id: "admin",
        name: "Admin",
        email: ADMIN_EMAIL,
        role: Role.ADMIN,
      };
      // No session cookie
      return {
        data: { user: adminUser },
        success: true,
        role: submittedRole,
      };
    }

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
