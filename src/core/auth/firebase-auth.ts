/**
 * Firebase Authentication Service
 * Centralized Firebase auth helpers and JWT validation
 */

import { NextRequest, NextResponse } from "next/server";

import { getAuth } from "firebase-admin/auth";

import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  customClaims?: Record<string, any>;
}

export interface AuthResult {
  user: FirebaseUser;
  token: string;
}

export interface AuthError {
  code: string;
  message: string;
  status: number;
}

/**
 * Validate Firebase JWT token
 */
export async function validateFirebaseToken(token: string): Promise<FirebaseUser | null> {
  if (!isAdminInitialized) {
    console.error("❌ [Firebase Auth] Firebase Admin SDK not initialized");
    return null;
  }

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      emailVerified: decodedToken.email_verified || false,
      customClaims: decodedToken,
    };
  } catch (error) {
    console.error("❌ [Firebase Auth] Token validation failed:", error);
    return null;
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<any | null> {
  if (!isAdminInitialized) {
    console.error("❌ [Firebase Auth] Firebase Admin SDK not initialized");
    return null;
  }

  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Database not available");
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error("❌ [Firebase Auth] Failed to get user profile:", error);
    return null;
  }
}

/**
 * Create custom claims for a user
 */
export async function setCustomClaims(uid: string, claims: Record<string, any>): Promise<boolean> {
  if (!isAdminInitialized) {
    console.error("❌ [Firebase Auth] Firebase Admin SDK not initialized");
    return false;
  }

  try {
    const auth = getAuth();
    await auth.setCustomUserClaims(uid, claims);

    console.log(`✅ [Firebase Auth] Set custom claims for user ${uid}:`, claims);
    return true;
  } catch (error) {
    console.error("❌ [Firebase Auth] Failed to set custom claims:", error);
    return false;
  }
}

/**
 * Get custom claims for a user
 */
export async function getCustomClaims(uid: string): Promise<Record<string, any> | null> {
  if (!isAdminInitialized) {
    console.error("❌ [Firebase Auth] Firebase Admin SDK not initialized");
    return null;
  }

  try {
    const auth = getAuth();
    const userRecord = await auth.getUser(uid);

    return userRecord.customClaims || null;
  } catch (error) {
    console.error("❌ [Firebase Auth] Failed to get custom claims:", error);
    return null;
  }
}

/**
 * Authenticate request with Firebase token
 */
export async function authenticateFirebaseRequest(request: NextRequest): Promise<FirebaseUser | NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const user = await validateFirebaseToken(token);

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  return user;
}

/**
 * Extract user ID from Firebase token
 */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  const user = await validateFirebaseToken(token);
  return user?.uid || null;
}

/**
 * Check if user has specific role
 */
export async function hasRole(uid: string, role: string): Promise<boolean> {
  const claims = await getCustomClaims(uid);
  return claims?.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(uid: string, roles: string[]): Promise<boolean> {
  const claims = await getCustomClaims(uid);
  return roles.includes(claims?.role);
}

/**
 * Get user's role
 */
export async function getUserRole(uid: string): Promise<string | null> {
  const claims = await getCustomClaims(uid);
  return claims?.role || null;
}

/**
 * Create session token for a user
 */
export async function createSessionToken(uid: string, additionalClaims?: Record<string, any>): Promise<string | null> {
  if (!isAdminInitialized) {
    console.error("❌ [Firebase Auth] Firebase Admin SDK not initialized");
    return null;
  }

  try {
    const auth = getAuth();
    const sessionToken = await auth.createSessionCookie(uid, {
      expiresIn: 60 * 60 * 24 * 5 * 1000, // 5 days
    });

    return sessionToken;
  } catch (error) {
    console.error("❌ [Firebase Auth] Failed to create session token:", error);
    return null;
  }
}

/**
 * Verify session token
 */
export async function verifySessionToken(sessionToken: string): Promise<FirebaseUser | null> {
  if (!isAdminInitialized) {
    console.error("❌ [Firebase Auth] Firebase Admin SDK not initialized");
    return null;
  }

  try {
    const auth = getAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionToken, true);

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || "",
      displayName: decodedClaims.name,
      photoURL: decodedClaims.picture,
      emailVerified: decodedClaims.email_verified || false,
      customClaims: decodedClaims,
    };
  } catch (error) {
    console.error("❌ [Firebase Auth] Session token verification failed:", error);
    return null;
  }
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeUserTokens(uid: string): Promise<boolean> {
  if (!isAdminInitialized) {
    console.error("❌ [Firebase Auth] Firebase Admin SDK not initialized");
    return false;
  }

  try {
    const auth = getAuth();
    await auth.revokeRefreshTokens(uid);

    console.log(`✅ [Firebase Auth] Revoked all tokens for user ${uid}`);
    return true;
  } catch (error) {
    console.error("❌ [Firebase Auth] Failed to revoke user tokens:", error);
    return false;
  }
}

/**
 * Delete a user account
 */
export async function deleteUser(uid: string): Promise<boolean> {
  if (!isAdminInitialized) {
    console.error("❌ [Firebase Auth] Firebase Admin SDK not initialized");
    return false;
  }

  try {
    const auth = getAuth();
    await auth.deleteUser(uid);

    console.log(`✅ [Firebase Auth] Deleted user ${uid}`);
    return true;
  } catch (error) {
    console.error("❌ [Firebase Auth] Failed to delete user:", error);
    return false;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  uid: string,
  updates: {
    displayName?: string;
    email?: string;
    photoURL?: string;
    emailVerified?: boolean;
  },
): Promise<boolean> {
  if (!isAdminInitialized) {
    console.error("❌ [Firebase Auth] Firebase Admin SDK not initialized");
    return false;
  }

  try {
    const auth = getAuth();
    await auth.updateUser(uid, updates);

    console.log(`✅ [Firebase Auth] Updated profile for user ${uid}`);
    return true;
  } catch (error) {
    console.error("❌ [Firebase Auth] Failed to update user profile:", error);
    return false;
  }
}
