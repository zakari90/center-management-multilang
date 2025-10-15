import { logout } from "@/lib/actions";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await logout()

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}