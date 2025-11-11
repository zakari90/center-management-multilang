import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const adminUsername = "admin";
const adminPassword = "admin";
const adminEmail = "admin@admin.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {id, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: { message: "Email and password are required." } },
        { status: 400 }
      );
    }

    let user = await db.user.findUnique({ where: { email } });

    // Create admin account if it doesn't exist and credentials match
    if (!user && email === adminEmail && password === adminPassword) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      user = await db.user.create({
        data: {
          id: id,
          email: adminEmail,
          password: hashedPassword,
          name: adminUsername,
          role: "ADMIN",
        },
      });

      const response = NextResponse.json(
        {
          message: "Admin user created and logged in successfully.",
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
    }

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: { email: "User not found." } },
        { status: 404 }
      );
    }

    // Verify password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: { password: "Incorrect password." } },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      {
        message: "Login successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
