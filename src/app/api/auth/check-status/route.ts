import { NextResponse } from "next/server";
import db from "@/lib/db";
import { z } from "zod";

const RequestSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/auth/check-status
 *
 * Checks if a user account exists on the server.
 * Used by offline clients to verify account status before allowing login.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = RequestSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // If user doesn't exist, they've been deleted
    return NextResponse.json({
      exists: !!user,
      isActive: !!user, // If they exist, they're active
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }
    console.error("[check-status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
