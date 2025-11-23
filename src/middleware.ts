/* eslint-disable @typescript-eslint/no-explicit-any */
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/authentication';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const publicRoutes = ["/login"];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session
  const session:any = await getSession();
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // Redirect authenticated users away from login page
  if (session?.user && pathname === '/login') {
    if (session.user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    
    if (session.user.role === 'MANAGER') {
      return NextResponse.redirect(new URL('/manager', request.url));
    }
  }
  
  // Protect admin routes - allow client-side authentication
  // Only redirect if we have a session but it's not an admin (server-side check)
  // If no session exists, let client-side auth handle it
  if (pathname.startsWith('/admin')) {
    // If we have a session but user is not an admin, redirect
    if (session?.user?.role && session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // If no session, let it through - client-side auth will handle redirect
    // Continue to intl middleware
  }
  
  // Protect manager routes - allow client-side authentication
  // Only redirect if we have a session but it's not a manager (server-side check)
  // If no session exists, let client-side auth handle it
  if (pathname.startsWith('/manager')) {
    // If we have a session but user is not a manager, redirect to login
    if (session?.user?.role && session.user.role !== 'MANAGER') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // If no session, let it through - client-side auth will handle redirect
    // Continue to intl middleware
  }
  
  // Redirect unauthenticated users from protected routes (except admin/manager routes which use client-side auth)
  if (!session?.user && !isPublicRoute && !pathname.startsWith('/admin') && !pathname.startsWith('/manager')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Continue with internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for API routes and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};