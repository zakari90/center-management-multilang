"use server"

import axios from "axios";
import { getTranslations } from "next-intl/server"; // Import for server-side translations
import { cookies } from "next/headers";
import { z } from "zod";
import { encrypt } from "./authentication";
import { generateObjectId } from "./utils/generateObjectId";


const apiUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000") + "/api"
// Zod schemas with dynamic translations
const createRegistrationSchema = (t: Awaited<ReturnType<typeof getTranslations>>) =>
  z.object({
    username: z
      .string()
      .min(3, { message: t('validation.usernameMin') }),
    email: z.email({ message: t('validation.invalidEmail') }),
    password: z
      .string()
      .min(4, { message: t('validation.passwordMin') }),
    confirmPassword: z
      .string()
      .min(4, { message: t('validation.passwordMin') }),
  }).superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: t('validation.passwordMismatch'),
        path: ["confirmPassword"],
      })
    }
  })

const createLoginSchema = (t: Awaited<ReturnType<typeof getTranslations>>) =>
  z.object({
    email: z.email({ message: t('validation.invalidEmail') })
      .nonempty({ message: t('validation.emailRequired') }),
    password: z
      .string()
      .min(1, { message: t('validation.passwordRequired') })
      .nonempty({ message: t('validation.passwordRequired') }),
  })

// Register Action
export async function register(state: unknown, formData: FormData) {
  try {
    // Get translations for validation messages
    const t = await getTranslations('auth')

    const data = {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    }
    
    const registrationSchema = createRegistrationSchema(t)
    const result = registrationSchema.safeParse(data)
    
    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
      }
    }

    // Use relative URL for server actions (runs on same server)
    // src/app/api/admin/users/route.ts
    const response = await axios.post(
      `${apiUrl}/admin/users`,
      data,
      { headers: { "Content-Type": "application/json" } }
    )
    
    // const user = response.data.user
    // const session = await encrypt({ user })
    // ;(await cookies()).set("session", session, { httpOnly: true })
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error("Registration error:", error)
    const t = await getTranslations('auth')
    
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: t('errors.registrationFailed') },
      }
    }
    return {
      error: { message: t('errors.unexpectedError') },
    }
  }
}

// Create Manager Action
export async function createManager(state: unknown, formData: FormData) {
  try {
    const t = await getTranslations('auth')
    
    const data = {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    }
    
    const registrationSchema = createRegistrationSchema(t)
    const result = registrationSchema.safeParse(data)
    
    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
      }
    }

    // Note: This is a server action, so we can't directly access Dexie
    // The client-side code that calls this should save to localDb after success
    // or we handle it on the client side after receiving the response
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 6524}/api`}/manager/register`,
      data,
      { headers: { "Content-Type": "application/json" } }
    )
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error("Create manager error:", error)
    const t = await getTranslations('auth')
    
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: t('errors.createManagerFailed') },
      }
    }
    return {
      error: { message: t('errors.unexpectedError') },
    }
  }
}

// Update Manager Action
export async function updateManager(state: unknown, formData: FormData) {
  try {
    const t = await getTranslations('auth')
    
    const data = {
      userId: formData.get("userId"),
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
    }

    if (!data.userId) {
      return {
        error: { message: t('errors.userIdRequired') },
      }
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 6524}/api`}/manager/${data.userId}`,
      data,
      { headers: { "Content-Type": "application/json" } }
    )
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error("Update manager error:", error)
    const t = await getTranslations('auth')
    
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: t('errors.updateManagerFailed') },
      }
    }
    return {
      error: { message: t('errors.unexpectedError') },
    }
  }
}

export async function loginAdmin(
  state: unknown,
  formData: FormData
){
  try {
    const t = await getTranslations('auth');

    const data = {
      id: formData.get("id") || generateObjectId() || "1",
      email: formData.get("email"),
      password: formData.get("password"),
    };
    
    const loginSchema = createLoginSchema(t)
    const result = loginSchema.safeParse(data)
    
    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
      }
    }

    // Use relative URL for server actions (runs on same server)
    const response = await axios.post(
      `${apiUrl}/admin/users`,
      data,
      { headers: { "Content-Type": "application/json" } }
    )
    
    const user = response.data.user
    const session = await encrypt({ user })
    ;(await cookies()).set("session", session, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    })
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error("Admin login error:", error)
    const t = await getTranslations('auth')
    
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: t('errors.loginFailed') },
      }
    }
    return {
      error: { message: t('errors.unexpectedError') },
    }
  }
}

// Login Manager Action
export async function loginManager(state: unknown, formData: FormData) {
  try {
    const t = await getTranslations('auth')
    
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    }
    
    const loginSchema = createLoginSchema(t)
    const result = loginSchema.safeParse(data)
    
    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
      }
    }

    const response = await axios.post(
      `${apiUrl}/manager/login`,
      data,
      { headers: { "Content-Type": "application/json" } }
    )
    
    const user = response.data.user
    const session = await encrypt({ user })
    ;(await cookies()).set("session", session, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    })
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error("Manager login error:", error)
    const t = await getTranslations('auth')
    
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: t('errors.loginFailed') },
      }
    }
    return {
      error: { message: t('errors.unexpectedError') },
    }
  }
}

// Create Center Action
export async function createCenterAction(state: unknown, formData: FormData) {
  try {
    const t = await getTranslations('center')
    
    const name = formData.get("name") as string
    const address = formData.get("address") as string
    const phone = formData.get("phone") as string
    const classrooms = formData.getAll("classrooms") as string[]
    const workingDays = formData.getAll("workingDays") as string[]

    if (!name) {
      return {
        error: { message: t('errors.nameRequired') },
      }
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 6524}/api`}/centers`,
      { name, address, phone, classrooms, workingDays },
      { headers: { "Content-Type": "application/json" } }
    )
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error("Create center error:", error)
    const t = await getTranslations('center')
    
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: t('errors.createFailed') },
      }
    }
    return {
      error: { message: t('errors.unexpectedError') },
    }
  }
}

// Combined login action that routes based on role and returns role info
export async function loginWithRole(state: unknown, formData: FormData) {
  const submittedRole = (formData.get("role") as string) === "manager" ? "manager" : "admin"
  const result = submittedRole === "manager"
    ? await loginManager(state, formData)
    : await loginAdmin(state, formData)

  return {
    ...result,
    role: submittedRole,
  }
}

// export async function logout() {
//   ;(await cookies()).set("session", "", { expires: new Date(0) })
// }
