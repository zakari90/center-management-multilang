/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/server-auth";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session: any = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const managers = await db.user.findMany({
      where: { role: "MANAGER" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        password: true,
        role: true,
      },
    });

    return NextResponse.json(managers, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch managers",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session: any = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();

    const { id, name, email, role, password } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const updatedManager = await db.user.update({
      where: { id },
      data: { name, email, role, password },
    });

    return NextResponse.json(updatedManager, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update manager" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session: any = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing manager ID" },
        { status: 400 },
      );
    }

    const deletedManager = await db.user.delete({
      where: { id },
    });

    return NextResponse.json(deletedManager, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete manager" },
      { status: 500 },
    );
  }
}
