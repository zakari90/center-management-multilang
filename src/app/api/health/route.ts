import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return new NextResponse(
    JSON.stringify({ status: "ok", timestamp: Date.now() }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
