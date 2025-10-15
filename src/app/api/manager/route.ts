import { getSession } from "@/lib/authentication";
import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  console.log("Fetching managers from API route...");
  try {
    const session = await getSession();
    console.log("API Session:", session);
    
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
        password:true,
        role: true
      }
    });

    return NextResponse.json(managers, { status: 200 });
  } catch (error) {
    console.error("[GET_MANAGERS]", error);
    return NextResponse.json({ 
      error: "Failed to fetch managers"
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  console.log("Updating manager from API route...");
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    console.log("Request body:", body.body);

    const { id, name, email, role, password } = body;
    
    if (!id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedManager = await db.user.update({
      where: { id },
      data: { name, email, role , password},
    });
    console.log("Updated manager:", updatedManager);
    

    return NextResponse.json(updatedManager, { status: 200 });
  } catch (error) {
    console.error("[UPDATE_MANAGER]", error);
    return NextResponse.json({ error: "Failed to update manager" }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  console.log("Deleting manager from API route...");
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();    
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing manager ID" }, { status: 400 });
    }

    const deletedManager = await db.user.delete({
      where: { id },
    });

    console.log("Deleted manager:", deletedManager);
    return NextResponse.json(deletedManager, { status: 200 });
  } catch (error) {
    console.error("[DELETE_MANAGER]", error);
    return NextResponse.json({ error: "Failed to delete manager" }, { status: 500 });
  }
}
