"use server"
import { BASE_URL } from "@/types/types";
import axios from "axios";
import { cookies } from "next/headers";
import { z } from "zod";
import { encrypt } from "./authentication";

const registrationSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" }),
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(2, { message: "Password must be at least 2 characters" }),
  confirmPassword: z
    .string()
    .min(2, { message: "Password must be at least 2 characters" }),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
});

const loginSchema = z.object({
  email: z.email({ message: "Invalid email address" })
    .nonempty({ message: "Email is required" }),
  password: z
    .string()
    .min(1, { message: "Password must be at least 1 characters" })
    .nonempty({ message: "Password is required" }),
});

export async function register(state: unknown, formData: FormData) {
  try {
    const data = {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };
    
    const result = registrationSchema.safeParse(data);
    
    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
      };
    }

    const response = await axios.post(
      `${BASE_URL}/api/auth/register`,
      data,
      { headers: { "Content-Type": "application/json" } }
    );
    
    const user = response.data.user;
    const session = await encrypt({ user });
    (await cookies()).set("session", session, { httpOnly: true });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Registration error:", error);
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: "Registration failed" },
      };
    }
    return {
      error: { message: "An unexpected error occurred" },
    };
  }
}

export async function createManager(state: unknown, formData: FormData) {
  try {
    const data = {
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };
    
    const result = registrationSchema.safeParse(data);
    
    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
      };
    }

    const response = await axios.post(
      `${BASE_URL}/api/manager/register`,
      data,
      { headers: { "Content-Type": "application/json" } }
    );
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Create manager error:", error);
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: "Failed to create manager" },
      };
    }
    return {
      error: { message: "An unexpected error occurred" },
    };
  }
}

export async function updateManager(state: unknown, formData: FormData) {
  try {
    const data = {
      userId: formData.get("userId"),
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    if (!data.userId) {
      return {
        error: { message: "User ID is required" },
      };
    }

    const response = await axios.post(
      `${BASE_URL}/api/manager/${data.userId}`,
      data,
      { headers: { "Content-Type": "application/json" } }
    );
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Update manager error:", error);
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: "Failed to update manager" },
      };
    }
    return {
      error: { message: "An unexpected error occurred" },
    };
  }
}

export async function loginAdmin(state: unknown, formData: FormData) {
  try {
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };
    
    const result = loginSchema.safeParse(data);

    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
      };
    }

    const response = await axios.post(
      `${BASE_URL}/api/auth/login`,
      data,
      { headers: { "Content-Type": "application/json" } }
    );
    
    const user = response.data.user;
    const session = await encrypt({ user });
    (await cookies()).set("session", session, { httpOnly: true });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Login error:", error);
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: "Login failed" },
      };
    }
    return {
      error: { message: "An unexpected error occurred" },
    };
  }
}

export async function loginManager(state: unknown, formData: FormData) {
  try {
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };
    
    const result = loginSchema.safeParse(data);
    
    if (!result.success) {
      return {
        error: result.error.flatten().fieldErrors,
      };
    }

    const response = await axios.post(
      `${BASE_URL}/api/manager/login`,
      data,
      { headers: { "Content-Type": "application/json" } }
    );
    
    const user = response.data.user;
    const session = await encrypt({ user });
    (await cookies()).set("session", session, { httpOnly: true });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Manager login error:", error);
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: "Login failed" },
      };
    }
    return {
      error: { message: "An unexpected error occurred" },
    };
  }
}

export async function createCenterAction(state: unknown, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;
    const classrooms = formData.getAll("classrooms") as string[];
    const workingDays = formData.getAll("workingDays") as string[];

    if (!name) {
      return {
        error: { message: "Center name is required" },
      };
    }

    const response = await axios.post(
      `${BASE_URL}/api/centers`,
      { name, address, phone, classrooms, workingDays },
      { headers: { "Content-Type": "application/json" } }
    );
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Create center error:", error);
    if (axios.isAxiosError(error)) {
      return {
        error: error.response?.data?.error || { message: "Failed to create center" },
      };
    }
    return {
      error: { message: "An unexpected error occurred" },
    };
  }
}

export async function logout() {
  (await cookies()).set("session", "", { expires: new Date(0) });
}