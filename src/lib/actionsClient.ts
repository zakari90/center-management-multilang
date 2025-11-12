"use client"

import { loginAdmin, loginManager } from "./actions"
import { encrypt } from "./authentication";
import { userActions } from "./dexie/dexieActions";
import { generateObjectId } from "./utils/generateObjectId";
import { isOnline } from "./utils/network";
import Cookies from 'js-cookie'


// Combined login action that routes based on role and returns role info
export async function loginWithRole(state: unknown, formData: FormData) {
  const submittedRole = (formData.get("role") as string) === "manager" ? "manager" : "admin"
  console.log("***********************************************");
  console.log(submittedRole);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const id = generateObjectId();

try {
  await userActions.putLocal({
    id,
    email,
    password,
    name:email.split('@')[0],
    role: submittedRole,
    createdAt:  Date.now(),
    updatedAt:  Date.now(),
    status: '0',
  })
  if(isOnline()){
     const result = submittedRole === "manager"
    ? await loginManager(state, formData)
    : await loginAdmin(state, formData)
    return {
      ...result,
      role: submittedRole,

    }
  }
  const localResult= await userActions.getLocalByEmail(email);
  const session = await encrypt({ user: localResult })

  Cookies.set('session', session, {  })
return {
  data: localResult,
  success: true,
}
} catch (error) {
  console.log("Error in loginWithRole", error);
  
  return {
    error: { message: "Internal server error" },
    success: false,
  }
}


}

