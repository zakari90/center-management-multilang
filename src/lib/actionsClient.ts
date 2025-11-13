/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { jwtVerify, SignJWT } from "jose";
import { loginAdmin, loginManager } from "./actions"
import { userActions } from "./dexie/dexieActions";
import { generateObjectId } from "./utils/generateObjectId";
import { isOnline } from "./utils/network";
import Cookies from 'js-cookie'
import { Role } from "./dexie/dbSchema";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

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

const createLoginSchema = (t: Awaited<ReturnType<typeof getTranslations>>) =>
  z.object({
    email: z.string()
      .min(1, { message: t('validation.emailRequired') })
      .email({ message: t('validation.invalidEmail') }),
    password: z
      .string()
      .min(1, { message: t('validation.passwordRequired') }),
  })

// Combined login action that routes based on role and returns role info
export async function loginWithRole(state: unknown, formData: FormData) {
  const submittedRole = (formData.get("role") as string) === "manager" ? "manager" : "admin"
  const id = generateObjectId()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const t = await getTranslations('auth')
  const loginSchema = createLoginSchema(t)
  
  // Fixed: Define data object for validation
  const data = { email, password }
  const result = loginSchema.safeParse(data)
  
  if (!result.success) {
    return {
      error: result.error.flatten().fieldErrors,
      success: false,
    }
  }

  try {
    await userActions.putLocal({
      id,
      email,
      password,
      name: email.split('@')[0] || "",
      role: submittedRole === "manager" ? Role.MANAGER : Role.ADMIN,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: '0',
    })
    
    if (isOnline()) {
      // Append id after validation passes
      formData.append("id", id)
      
      const result = submittedRole === "manager"
        ? await loginManager(state, formData)
        : await loginAdmin(state, formData)
        
      if (result.success) {
        await userActions.markSynced(id)
        return {
          ...result,
          role: submittedRole,
        }
      }
    }
    
    const localResult = await userActions.getLocalByEmail?.(email);  
    const session = await encrypt({ user: localResult })

    // Fixed: Add secure cookie options
    Cookies.set('session', session, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      // expires: 7 // todo shurten the expiration time and update the session cookie 
    })
    
    return {
      data: localResult,
      success: true,
      role: submittedRole,
    }
  } catch (error) {
    console.log("Error in loginWithRole", error);
    
    return {
      error: { message: t('errors.internalError') || "Internal server error" },
      success: false,
    }
  }
}
