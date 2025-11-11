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
      
      try {
        // For MongoDB without replica set, Prisma might try to use transactions
        // This will fail if MongoDB is not configured as a replica set
        // We catch the error and provide a helpful message
        user = await db.user.create({
          data: {
            id: id || undefined, // Let MongoDB generate ID if not provided
            email: adminEmail,
            password: hashedPassword,
            name: adminUsername,
            role: "ADMIN",
          },
        });
      } catch (createError: any) {
        // Handle MongoDB replica set error
        if (createError.code === 'P2031') {
          console.error('MongoDB replica set error. To fix: Configure MongoDB as a replica set or use MongoDB Atlas.');
          // Try to find the user in case it was created by another request
          user = await db.user.findUnique({ where: { email: adminEmail } });
          if (!user) {
            // If user doesn't exist, return a helpful error
            return NextResponse.json(
              { 
                error: { 
                  message: "Database configuration error: MongoDB must be configured as a replica set for transactions. Please configure MongoDB as a replica set or use MongoDB Atlas." 
                } 
              },
              { status: 500 }
            );
          }
        } 
        // Handle duplicate key error (race condition)
        else if (createError.code === 'P2002' || createError.message?.includes('duplicate')) {
          user = await db.user.findUnique({ where: { email: adminEmail } });
          if (!user) {
            throw createError; // Re-throw if it's a different error
          }
        } else {
          throw createError;
        }
      }

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
