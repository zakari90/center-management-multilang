import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "secret";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function getSession(req: any): Promise<any> {
  const session = req.cookies?.session;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch {
    return null;
  }
}

export function setSession(res: any, payload: any) {
  encrypt(payload).then((token) => {
    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  });
}

export function clearSession(res: any) {
  res.clearCookie("session");
}

