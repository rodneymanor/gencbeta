import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Simple route protection - API key authentication will be handled in API routes themselves
  // This middleware now only handles basic routing and redirects

  console.log("🔍 [Middleware] Processing request for:", pathname);

  // For API routes, let them handle their own authentication
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // For other routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
