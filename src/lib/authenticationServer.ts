/* eslint-disable @typescript-eslint/no-explicit-any */
import { SignJWT, jwtVerify } from "jose";

const secretKey = "secret";
const key = new TextEncoder().encode(secretKey);

/**
 * Server-side JWT encryption
 * Use this in server actions and API routes
 */
export async function encryptServer(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

/**
 * Server-side JWT decryption
 * Use this in server actions and API routes
 */
export async function decryptServer(input: string) {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.error('[decryptServer] Failed to decrypt token:', error);
    return null;
  }
}
