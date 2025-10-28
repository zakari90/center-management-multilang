// src/app/api/auth/register/route.ts
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, username } = body;
  console.log('📝 Registration attempt:', { email, username, timestamp: new Date().toISOString() });
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: { message: "All fields are required." } },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { error: { email: "Email is already in use." } },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: username,
        role: "ADMIN",
      },
    });
    const response = NextResponse.json(
      {
        message: "User registered successfully.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
