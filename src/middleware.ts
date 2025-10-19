/* eslint-disable @typescript-eslint/no-explicit-any */
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/authentication';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const publicRoutes = ["/", "/login", "/register", "/loginmanager"];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session
  const session:any = await getSession();
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // Redirect authenticated users from home page based on role
  if (pathname === '/' && session?.user) {
    if (session.user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    
    if (session.user.role === 'MANAGER') {
      return NextResponse.redirect(new URL('/manager', request.url));
    }
  }
  
  // Redirect authenticated users away from auth pages
  if (session?.user && (pathname === '/login' || pathname === '/register' || pathname === '/loginmanager')) {
    if (session.user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    
    if (session.user.role === 'MANAGER') {
      return NextResponse.redirect(new URL('/manager', request.url));
    }
  }
  
  // Protect admin routes
  if (pathname.startsWith('/admin') && session?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Protect manager routes
  if (pathname.startsWith('/manager') && session?.user?.role !== 'MANAGER') {
    return NextResponse.redirect(new URL('/loginmanager', request.url));
  }
  
  // Redirect unauthenticated users from protected routes
  if (!session?.user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Continue with internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for API routes and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};