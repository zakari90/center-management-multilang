/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/users/route.ts
import { getSession } from "@/lib/server-auth";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session: any = await getSession();

    // Check if user is authenticated and is an ADMIN
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        createdAt: true,
        _count: {
          select: {
            administeredCenters: true,
            managedStudents: true,
            managedTeachers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to match component interface
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password,
      createdAt: user.createdAt.toISOString(),
      stats: {
        centers: user._count.administeredCenters,
        students: user._count.managedStudents,
        teachers: user._count.managedTeachers,
      },
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

const adminUsername = "admin";
const adminPassword = "admin";
const adminEmail = "admin@admin.com";

// ✅ Create a new user (Manager or Admin)
export async function POST(req: NextRequest) {
  try {
    const session: any = await getSession();

    // Check if user is authenticated and is an ADMIN
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, role, id } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 },
      );
    }

    // Validate ID if provided
    if (id && !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with unique dataEpoch
    const newUser = await db.user.create({
      data: {
        ...(id && { id }), // Use provided ID or auto-generate
        name,
        email,
        password: hashedPassword,
        role,
        dataEpoch: crypto.randomUUID().slice(0, 8), // Unique epoch for sync tracking
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // ✅ Link manager to the Admin's center if applicable
    if (role === "MANAGER") {
      const center = await db.center.findFirst({
        where: { adminId: session.user.id },
      });

      if (center) {
        await db.center.update({
          where: { id: center.id },
          data: {
            managers: { push: newUser.id },
          },
        });
      }
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Check for MongoDB duplicate key error (code 11000)
    if (error.code === 11000 || error.codeName === "DuplicateKey") {
      return NextResponse.json(
        { error: "User with this ID or Email already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
