import { NextRequest, NextResponse } from "next/server";
import { ApiKeyAuthService } from "./lib/api-key-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply API key authentication to specific API routes
  const apiKeyProtectedRoutes = [
    "/api/collections",
    "/api/add-video-to-collection",
    "/api/video/process-and-add",
  ];

  const isApiKeyProtected = apiKeyProtectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isApiKeyProtected) {
    console.log("🔐 [Middleware] Checking API key authentication for:", pathname);

    // Extract API key from headers
    const apiKey = ApiKeyAuthService.extractApiKey(request);
    
    if (!apiKey) {
      console.log("❌ [Middleware] No API key provided");
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "API key required. Provide via x-api-key header or Authorization: Bearer header." 
        }, 
        { status: 401 }
      );
    }

    // Validate API key and get user context
    const authResult = await ApiKeyAuthService.validateApiKey(apiKey);
    
    if (!authResult) {
      console.log("❌ [Middleware] Invalid API key");
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "Invalid API key" 
        }, 
        { status: 401 }
      );
    }

    // Check rate limiting
    if (!authResult.rateLimitResult.allowed) {
      console.log("🚫 [Middleware] Request blocked by rate limiting");
      
      const status = authResult.rateLimitResult.resetTime ? 429 : 429;
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: authResult.rateLimitResult.reason,
          rateLimitInfo: {
            resetTime: authResult.rateLimitResult.resetTime,
            violationsCount: authResult.rateLimitResult.violationsCount,
            requestsPerMinute: 50,
            maxViolations: 2,
          }
        },
        { status }
      );
    }

    // Add user context to request headers for downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", authResult.user.uid);
    requestHeaders.set("x-user-email", authResult.user.email);
    requestHeaders.set("x-user-role", authResult.user.role);
    
    console.log("✅ [Middleware] API key authenticated for user:", authResult.user.email);

    // Continue with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // For non-API-key-protected routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/collections/:path*",
    "/api/add-video-to-collection/:path*", 
    "/api/video/process-and-add/:path*",
  ],
};
