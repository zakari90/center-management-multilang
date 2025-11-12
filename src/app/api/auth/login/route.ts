import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const adminUsername = "admin";
const adminPassword = "admin";
const adminEmail = "admin@admin.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, password } = body;

    if (!email || !password || !id) {
      return NextResponse.json(
        { error: { message: "Email, password, and id are required." } },
        { status: 400 }
      );
    }

    let user = await db.user.findUnique({ where: { email } });

    // If user exists, check password
    if (user) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: { message: "Invalid credentials" } },
          { status: 401 }
        );
      }
      // SUCCESS: return user data
      return NextResponse.json(
        {
          message: "User logged in successfully.",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        },
        { status: 200 }
      );
    }

    // If user doesn't exist, check for default admin scenario
    if (email === adminEmail && password === adminPassword) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      user = await db.user.create({
        data: {
          id: id,
          email: adminEmail,
          password: hashedPassword,
          name: adminUsername,
          role: "ADMIN",
        }
      });

      return NextResponse.json(
        {
          message: "Admin user created and logged in successfully.",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        },
        { status: 201 }
      );
    }

    // Else: user doesn't exist and not default admin credentials
    return NextResponse.json(
      { error: { message: "Invalid credentials" } },
      { status: 401 }
    );

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
