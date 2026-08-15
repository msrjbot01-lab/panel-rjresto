// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Mengecek apakah ada cookie bernama 'isAuthenticated'
  const isAuthenticated = request.cookies.get('isAuthenticated');
  const { pathname } = request.nextUrl;

  // Daftar rute yang memerlukan autentikasi (disesuaikan dari /tables ke /meja)
  const protectedRoutes = ['/dashboard', '/kasir', '/menu', '/meja', '/pemesanan', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Jika user belum login dan mencoba mengakses rute yang dilindungi, redirect ke halaman login
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Jika sudah login atau mengakses halaman publik (seperti /login), biarkan lanjut
  return NextResponse.next();
}

// Tentukan rute spesifik yang diawasi oleh middleware
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/kasir/:path*', 
    '/menu/:path*', 
    '/meja/:path*', 
    '/pemesanan/:path*', 
    '/settings/:path*'
  ],
};