"use server"
import axios from "axios";
import { cookies } from "next/headers";
import { z } from "zod";
import { encrypt } from "./authentication";
import { BASE_URL } from "@/types/types";


const registrationSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be less than 20 characters" }),
    email: z.email({ message: "Invalid email address" }),
    password: z
    .string()
    .min(2, { message: "Password must be at least 2 characters" })
    .max(20, { message: "Password must be less than 20 characters" }),
  confirmPassword: z
    .string()
    .min(2, { message: "Password must be at least 2 characters" })
    .max(20, { message: "Password must be less than 20 characters" }),
}) .superRefine((data, ctx) => {
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
})

export async function register(state: unknown, formData: FormData) {

    try {
        const data = {
            username: formData.get("username"),
            email: formData.get("email"),
            password: formData.get("password"),
            confirmPassword: formData.get("confirmPassword"),
          };    
        const result = registrationSchema.safeParse(data);
        console.log(result);
        
        if (!result.success) {
            return{
                error: result.error.flatten().fieldErrors,
            };
        }

        const response = await axios.post(BASE_URL+
            "/auth/register", 
            data
        , { headers: { 
            "Content-Type": "application/json", }, }
        );       
        const user = response.data.user
        const session = await encrypt({ user });
        (await cookies()).set("session", session, { httpOnly: true });
        console.log("************************************************");
        console.log( response.data);
        
        return response.data;
    } catch (error) {
        console.log(error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.data || error.message);
          }
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
        console.log(result);
        
        if (!result.success) {
            return{
                error: result.error.flatten().fieldErrors,
            };
        }

        const response = await axios.post(BASE_URL+ "/manager/register", 
            data
        , 
        { headers: { 
            "Content-Type": "application/json", }, }
        );       
    return {
      success: true,
      data: response.data,
    };
    } catch (error) {
        console.log(error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.data || error.message);
          }
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

        const response = await axios.post(BASE_URL+
            "/manager/"+data.userId, 
            data
        , { headers: { 
            "Content-Type": "application/json", }, }
        );       
    return {
      success: true,
      data: response.data,
    };
    } catch (error) {
        console.log(error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.data || error.message);
          }
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
            return{
                error: result.error.flatten().fieldErrors,
            };
        }

        const response = await axios.post(
            BASE_URL + "/auth/login", 
            data
        , { headers: { 
            "Content-Type": "application/json", }, }
        );               
        const user = response.data.user
        const session = await encrypt({ user });
        (await cookies()).set("session", session, { httpOnly: true });
       
    return {
        success: true,
        data: response.data,
        };
    } catch (error) {
        console.log(error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.data || error.message);
          }
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
            return{
                error: result.error.flatten().fieldErrors,
            };
        }

        const response = await axios.post(BASE_URL+
            "/manager/login", 
            data
        , { headers: { 
            "Content-Type": "application/json", }, }
        );               
        const user = response.data.user
        const session = await encrypt({ user });
        (await cookies()).set("session", session, { httpOnly: true });
       
    return {
        success: true,
        data: response.data};
    } catch (error) {
        console.log(error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.data || error.message);
          }
    }
}


export async function createCenterAction(state: unknown, formData: FormData) {
  try {
    const name = formData.get('name') as string
    console.log(
        name
    );
    
    } catch (error) {
        console.log(error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', error.response?.data || error.message);
          }
    }
}

export async function logout() {    
 (await cookies()).set("session", "", { expires: new Date(0) });
}