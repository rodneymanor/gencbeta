import { NextResponse } from "next/server";

interface AuthenticatedUser {
  uid: string;
  email: string;
  role: string;
  displayName?: string;
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  resetTime?: string;
  requestCount?: number;
  violationsCount?: number;
}

/**
 * Helper function to verify Firebase token and get user data
 */
export async function verifyFirebaseToken(token: string) {
  const { getAuth } = await import("firebase-admin/auth");
  const { getAdminDb } = await import("./firebase-admin");

  const decodedToken = await getAuth().verifyIdToken(token);
  console.log("✅ [Auth] Firebase token verified for user:", decodedToken.uid);

  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error("Admin database not available");
  }

  const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
  if (!userDoc.exists) {
    throw new Error("User profile not found");
  }

  return { decodedToken, userData: userDoc.data() };
}

/**
 * Helper function to authenticate via Firebase Auth token
 */
export async function authenticateWithFirebaseToken(
  token: string,
): Promise<{ user: AuthenticatedUser; rateLimitResult: RateLimitResult } | NextResponse> {
  console.log("🔥 [Auth] Attempting Firebase Auth token authentication");

  const { isAdminInitialized } = await import("./firebase-admin");

  if (!isAdminInitialized) {
    console.error("❌ [Auth] Firebase Admin SDK not initialized");
    return NextResponse.json(
      {
        success: false,
        error: "Authentication service unavailable",
      },
      { status: 500 },
    );
  }

  try {
    const { decodedToken, userData } = await verifyFirebaseToken(token);

    const user: AuthenticatedUser = {
      uid: decodedToken.uid,
      email: decodedToken.email ?? userData?.email ?? "unknown",
      role: userData?.role ?? "creator",
      displayName: decodedToken.name ?? userData?.displayName,
    };

    // For Firebase Auth, we don't apply rate limiting (internal use)
    const rateLimitResult: RateLimitResult = {
      allowed: true,
      requestCount: 0,
      violationsCount: 0,
    };

    console.log("✅ [Auth] Firebase Auth authenticated successfully for user:", user.email);
    return { user, rateLimitResult };
  } catch (firebaseError) {
    console.log("❌ [Auth] Invalid Firebase token:", firebaseError);
    return NextResponse.json(
      {
        success: false,
        error: "Invalid authentication token",
      },
      { status: 401 },
    );
  }
}
