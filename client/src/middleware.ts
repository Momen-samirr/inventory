import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/register"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Note: We can't access localStorage in middleware, so we rely on client-side checks
  // The middleware will allow the request through, and the client-side auth check in
  // dashboardWrapper will handle redirects based on localStorage token
  
  // If accessing login/register, allow it (client-side will handle redirect if authenticated)
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, allow through - client-side will check auth
  // This is necessary because middleware runs on the server and can't access localStorage
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

