import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { generateObjectId } from "@/lib/utils/generateObjectId";

/**
 * POST /api/admin/register-admin
 * Register the first and only admin account
 * Public endpoint - but only works if no admin exists
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate password length
    if (password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters long" },
        { status: 400 },
      );
    }

    // Check if an admin already exists
    const existingAdminCount = await db.user.count({
      where: {
        role: "ADMIN",
      },
    });

    if (existingAdminCount > 0) {
      return NextResponse.json(
        {
          error: "An admin account already exists. Only one admin is allowed.",
        },
        { status: 409 },
      );
    }

    // Check if email is already taken
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 },
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user
    const admin = await db.user.create({
      data: {
        id: generateObjectId(),
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    // Return success (without password)
    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Failed to register admin:", error);
    return NextResponse.json(
      { error: "Failed to register admin account" },
      { status: 500 },
    );
  }
}
