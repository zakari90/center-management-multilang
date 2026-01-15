/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/server-auth";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session :any = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    const body = await req.json();
    const { email, password, username, id } = body;

    if (!email || !password || !username ) {
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

    // ✅ Check manager limit (max 3 managers per center)
    const center = await db.center.findFirst({
      where: { adminId: session.user.id }
    });

    if (center && center.managers && center.managers.length >= 3) {
      return NextResponse.json(
        { error: { message: "Maximum number of managers (3) reached for this center." } },
        { status: 400 }
      );
    }

    // Check if ID is provided and if it already exists
    if (id) {
      const existingById = await db.user.findUnique({
        where: { id }
      });
      
      if (existingById) {
        return NextResponse.json(
          { error: { message: "User with this ID already exists." } },
          { status: 409 }
        );
      }
    }

    const user = await db.user.create({
      data: {
        ...(id && { id }), // Use client-provided ID if available
        email,
        password: await bcrypt.hash(password, 10), // ✅ Hash password before saving
        name: username,
        role: "MANAGER",
      },
    });


    // ✅ Link manager to the Admin's center (reuse center from limit check)
    if (center) {
      await db.center.update({
        where: { id: center.id },
        data: {
          managers: { push: user.id }
        }
      });
    } else {
      console.warn(`[REGISTER] Admin ${session.user.id} created manager ${user.id} but has no center to assign them to.`);
    }
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
