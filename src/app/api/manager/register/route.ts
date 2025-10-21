/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/authentication";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session :any = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    const body = await req.json();
    const { email, password, username } = body;

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

    const user = await db.user.create({
      data: {
        email,
        password,
        name: username,
        role: "MANAGER",
      },
    });


   await db.center.update({
      where: { id: session.user.id },
      data: {
        managers: { push: user.id }
      }
    })    
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
