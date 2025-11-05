/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Server-side user authentication actions
 * Used for admin login from client components
 */
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/**
 * Login admin user (client-side callable)
 */
export async function loginAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/login`,
      { email, password },
      { 
        headers: { "Content-Type": "application/json" },
        withCredentials: true 
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Admin login error:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || { message: "Login failed" },
      };
    }

    return {
      success: false,
      error: { message: "An unexpected error occurred" },
    };
  }
}

/**
 * Login manager user (client-side callable)
 */
export async function loginManagerUser(
  email: string,
  password: string
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/manager/login`,
      { email, password },
      { 
        headers: { "Content-Type": "application/json" },
        withCredentials: true 
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Manager login error:", error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || { message: "Login failed" },
      };
    }

    return {
      success: false,
      error: { message: "An unexpected error occurred" },
    };
  }
}

