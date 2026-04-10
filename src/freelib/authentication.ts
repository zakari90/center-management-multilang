/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { SignJWT, jwtVerify } from "jose";
import Cookies from 'js-cookie';

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
  try {
    return await decrypt(session);
  } catch (error) {
    console.error('[getSession] failed to decrypt session cookie', error);
    Cookies.remove("session", { path: "/" });
    return null;
  }
}

export async function updateSession() {
  const session = Cookies.get("session");
  if (!session) return;

  try {
    const parsed = await decrypt(session);
    Cookies.set("session", await encrypt(parsed), {
      expires: 7,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production"
    });
  } catch (error) {
    console.error('[updateSession] failed to update session', error);
    Cookies.remove("session", { path: "/" });
  }
}

// Optional: helper to clear session (logout)
export function clearSession() {
  Cookies.remove("session", { path: "/" });
}
