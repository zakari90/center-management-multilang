/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { jwtVerify, SignJWT } from "jose";
import Cookies from "js-cookie";
import { loginAdmin, loginManager } from "./actions";
import { Role, localDb } from "./dexie/dbSchema";
import { userActions } from "./dexie/dexieActions";
import { isOnline } from "./utils/network";

const secretKey = "secret";
const key = new TextEncoder().encode(secretKey);

// Client-side translation helper
async function getClientTranslations(namespace: string) {
  // Get locale from cookie or default to 'ar'
  const locale = Cookies.get("NEXT_LOCALE") || "ar";

  // Dynamically import the dictionary file
  const messages = await import(`../../dictionary/${locale}.json`);

  // Get the namespace (e.g., 'auth')
  const namespaceMessages = messages.default[namespace] || {};

  // Return a translation function
  return (key: string): string => {
    const keys = key.split(".");
    let value: any = namespaceMessages;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    return typeof value === "string" ? value : key;
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
    return null;
  }
  try {
    const decoded = await decrypt(session);

    return decoded;
  } catch (error) {
    console.error("[getSession] failed to decrypt session cookie", error);
    Cookies.remove("session", { path: "/" });
    return null;
  }
}

async function openLocalDbWithTimeout(timeoutMs = 2500) {
  await Promise.race([
    localDb.open(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("IndexedDB open timeout")), timeoutMs),
    ),
  ]);
}

// Consistent error type
type LoginError = {
  error: {
    field: "email" | "password" | "role" | "db" | "general";
    message: string;
  };
  success: false;
  role: string;
  data: undefined;
};

export async function loginWithRole(
  state: unknown,
  formData: FormData,
): Promise<LoginError | { data: { user: any }; success: true; role: string }> {
  const submittedRole =
    (formData.get("role") as string) === "manager" ? "manager" : "admin";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const t = await getClientTranslations("auth");

    // Validate inputs
    if (!email || !password) {
      return {
        error: {
          field: "general",
          message:
            t("validation.emailRequired") +
            " " +
            t("validation.passwordRequired"),
        },
        success: false,
        role: submittedRole,
        data: undefined,
      };
    }

    if (!userActions.getLocalByEmail) {
      return {
        error: { field: "db", message: t("errors.unexpectedError") },
        success: false,
        role: submittedRole,
        data: undefined,
      };
    }

    // 100% client-side: try online login first to cache user, then fall back to local
    if (isOnline()) {
      try {
        const result =
          submittedRole === "manager"
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
              status: "1" as const,
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
        error: { field: "db", message: t("errors.unexpectedError") },
        success: false,
        role: submittedRole,
        data: undefined,
      };
    }

    // If online, verify account status before allowing local login
    if (isOnline()) {
      try {
        const statusRes = await fetch("/api/auth/check-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const statusData = await statusRes.json();

        // If account doesn't exist or is inactive, revoke access
        if (!statusData.exists || !statusData.isActive) {
          // Import dynamically to avoid circular dependencies
          const { clearAllLocalData } = await import("./dexie/clearLocalData");
          await clearAllLocalData();

          return {
            error: {
              field: "email",
              message:
                t("errors.accountRevoked") ||
                "Your account has been revoked by the administrator.",
            },
            success: false,
            role: submittedRole,
            data: undefined,
          };
        }
      } catch (checkError) {
        // If the check fails, allow fallback to local login
        console.warn(
          "[loginWithRole] Account status check failed:",
          checkError,
        );
      }
    }

    let localUser: any = await userActions.getLocalByEmail(email);

    if (localUser) {
      if (localUser.password !== password) {
        return {
          error: { field: "password", message: t("errors.loginFailed") },
          success: false,
          role: submittedRole,
          data: undefined,
        };
      }

      const expectedRole =
        submittedRole === "manager" ? Role.MANAGER : Role.ADMIN;
      if (localUser.role !== expectedRole) {
        return {
          error: { field: "role", message: t("errors.unexpectedError") },
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

    // No user found - return error

    const tNotFound = await getClientTranslations("auth");
    return {
      error: { field: "email", message: tNotFound("errors.loginFailed") },
      success: false,
      role: submittedRole,
      data: undefined,
    };
  } catch (error) {
    const t = await getClientTranslations("auth");
    const errorMessage =
      error instanceof Error ? error.message : t("errors.unexpectedError");
    return {
      error: { field: "general", message: errorMessage },
      success: false,
      role: submittedRole,
      data: undefined,
    };
  }
}
