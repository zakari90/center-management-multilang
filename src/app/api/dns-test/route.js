import { NextResponse } from "next/server";
import dns from "dns";
import { promisify } from "util";

const resolve4 = promisify(dns.resolve4);

export async function POST() {
  try {
    const host = "ep-sparkling-sunset-a5nm28hu-pooler.us-east-2.aws.neon.tech";

    const addresses = await resolve4(host);

    return NextResponse.json({
      success: true,
      host,
      addresses,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
