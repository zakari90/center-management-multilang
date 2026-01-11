/* eslint-disable @typescript-eslint/no-explicit-any */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    
    console.log("[getSession] 🔍 Cookie check:", {
      hasSessionCookie: !!sessionCookie,
      cookieValueLength: sessionCookie?.value?.length || 0,
      allCookieNames: cookieStore.getAll().map(c => c.name),
    });
    
    if (!sessionCookie?.value) {
      console.log("[getSession] ❌ No session cookie found");
      return null;
    }
    
    const decrypted = await decrypt(sessionCookie.value);
    console.log("[getSession] ✅ Session decrypted:", {
      hasUser: !!(decrypted as any)?.user,
      userId: (decrypted as any)?.user?.id || 'N/A',
      role: (decrypted as any)?.user?.role || 'N/A',
    });
    
    return decrypted;
  } catch (error) {
    console.error('[getSession] ❌ Failed to get/decrypt session:', error);
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  try {
    const parsed = await decrypt(session);
    const res = NextResponse.next();
    res.cookies.set({
      name: "session",
      value: await encrypt(parsed),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (error) {
    console.error('[updateSession] failed to update session', error);
    return NextResponse.next();
  }
}
