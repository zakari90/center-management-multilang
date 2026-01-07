/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
export default function middleware(_request: NextRequest) {
  // Middleware disabled. Routing/auth is handled in layouts/pages.
  return NextResponse.next();
}

export const config = {
  // Never match.
  matcher: ['/__middleware_disabled__']
};