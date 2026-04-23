/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { jwtVerify, SignJWT } from "jose";
import Cookies from "js-cookie";
import { Role, getDb } from "./dexie/dbSchema";
import { userActions } from "./dexie/freedexieaction";

const secretKey = "secret";
const key = new TextEncoder().encode(secretKey);

// Client-side translation helper
async function getClientTranslations(namespace: string) {
  const locale = Cookies.get("NEXT_LOCALE") || "ar";
  const messages = await import(`../../dictionary/${locale}.json`);
  const namespaceMessages = messages.default[namespace] || {};

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
    getDb().open(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("IndexedDB open timeout")), timeoutMs),
    ),
  ]);
}

// Consistent error type
type LoginError = {
  error: { field: string; message: string };
  success: false;
  role: string;
  data: undefined;
};

export async function loginWithRole(
  state: unknown,
  formData: FormData,
): Promise<
  | LoginError
  | {
      data: { user: any };
      success: true;
      role: string;
    }
> {
  const submittedRole = "admin";
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

    // Local-only login
    let localUser: any = await userActions.getLocalByEmail?.(email);

    if (localUser) {
      if (localUser.password !== password) {
        return {
          error: { field: "password", message: t("errors.loginFailed") },
          success: false,
          role: submittedRole,
          data: undefined,
        };
      }

      if (localUser.role !== Role.ADMIN) {
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

      // Set session cookie client-side for compatibility
      const session = await encrypt({ user: userForSession });
      Cookies.set("session", session, {
        expires: 7,
        path: "/",
        sameSite: "lax",
        secure: window.location.protocol === "https:",
      });

      return {
        data: { user: userForSession },
        success: true,
        role: submittedRole,
      };
    }

    return {
      error: { field: "email", message: t("errors.loginFailed") },
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
