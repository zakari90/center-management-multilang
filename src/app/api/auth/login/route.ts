import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, password, role } = body; // Added role parameter

    if (!email || !password || !id) {
      return NextResponse.json(
        { error: { message: "Email, password, and id are required." } },
        { status: 400 },
      );
    }

    let user = await db.user.findUnique({ where: { email } });

    // If user exists, check password
    if (user) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: { message: "Invalid credentials" } },
          { status: 401 },
        );
      }

      // Validate role if provided - ensure user has the expected role
      // This prevents managers from logging in on admin tab and vice versa
      if (role) {
        const expectedRole = role === "manager" ? "MANAGER" : "ADMIN";
        if (user.role !== expectedRole) {
          return NextResponse.json(
            { error: { message: `Invalid credentials for ${role} login` } },
            { status: 401 },
          );
        }
      }

      // SUCCESS: return user data with passwordHash for offline storage
      return NextResponse.json(
        {
          message: "User logged in successfully.",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          // Include hash for offline login capability (PWA feature)
          passwordHash: user.password,
          // Include dataEpoch for detecting server data resets
          dataEpoch: (user as any).dataEpoch || "1",
        },
        { status: 200 },
      );
    }

    // User doesn't exist, return error
    return NextResponse.json(
      { error: { message: "Invalid credentials" } },
      { status: 401 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
