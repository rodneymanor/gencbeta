import { randomBytes, createHash } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { getAuth } from "firebase-admin/auth";

import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { UserManagementAdminService } from "@/lib/user-management-admin";

interface ApiKeyDocument {
  createdAt: string;
  status: "active" | "disabled";
  lastUsed?: string;
  requestCount: number;
  violations: number;
  lockoutUntil?: string;
}

/**
 * POST /api/keys
 * Generate a new API key for the authenticated user
 *
 * Headers:
 * - Authorization: Bearer <firebase-id-token>
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔑 [API Keys] Generate key request received");

    // Extract Firebase ID token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header required", message: "Please provide Firebase ID token" },
        { status: 401 },
      );
    }

    const idToken = authHeader.substring(7);

    if (!isAdminInitialized) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Verify Firebase ID token
    const auth = getAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
      console.log("✅ [API Keys] Firebase token verified for user:", decodedToken.email);
    } catch (error) {
      console.error("❌ [API Keys] Token verification failed:", error);
      return NextResponse.json({ error: "Invalid Firebase token", message: "Authentication failed" }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Get user profile to include role information
    const userProfile = await UserManagementAdminService.getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found", message: "User registration incomplete" },
        { status: 404 },
      );
    }

    console.log(`🔍 [API Keys] Generating key for ${userProfile.role}: ${userEmail}`);

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Check if user already has an active API key (enforce single key policy)
    const existingKeysQuery = await adminDb
      .collection("users")
      .doc(userId)
      .collection("apiKeys")
      .where("status", "==", "active")
      .get();

    if (!existingKeysQuery.empty) {
      console.log("⚠️ [API Keys] User already has an active API key");
      return NextResponse.json(
        {
          error: "API key already exists",
          message: "You can only have one active API key. Please revoke your existing key first.",
          hasExistingKey: true,
        },
        { status: 409 },
      );
    }

    // Generate secure API key
    console.log("🔐 [API Keys] Generating secure API key...");
    const rawKey = randomBytes(32).toString("base64url"); // 43-char URL-safe base64 string
    const apiKey = `gencbeta_${rawKey}`; // Prefix for easy identification

    // Hash for storage (SHA-256)
    const hash = createHash("sha256").update(apiKey).digest("hex"); // 64 chars

    // Store API key metadata using hash as document ID
    const keyMetadata: ApiKeyDocument = {
      createdAt: new Date().toISOString(),
      status: "active",
      requestCount: 0,
      violations: 0,
    };

    await adminDb.collection("users").doc(userId).collection("apiKeys").doc(hash).create(keyMetadata);

    console.log("✅ [API Keys] API key generated and stored successfully");

    // Return the cleartext key only once (Stripe-style)
    return NextResponse.json({
      success: true,
      apiKey: apiKey,
      message: "API key generated successfully",
      warning: "This key will only be shown once. Please store it securely.",
      user: {
        id: userId,
        email: userEmail,
        role: userProfile.role,
      },
      metadata: {
        keyId: hash.substring(0, 8), // First 8 chars for identification
        createdAt: keyMetadata.createdAt,
        rateLimit: "50 requests per minute",
        violations: "2 violations = 1 hour lockout",
      },
    });
  } catch (error) {
    console.error("❌ [API Keys] Critical error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate API key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/keys
 * Revoke the user's active API key
 *
 * Headers:
 * - Authorization: Bearer <firebase-id-token>
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ [API Keys] Revoke key request received");

    // Extract Firebase ID token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
    }

    const idToken = authHeader.substring(7);

    if (!isAdminInitialized) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Verify Firebase ID token
    const auth = getAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Invalid Firebase token" }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    console.log(`🔍 [API Keys] Revoking key for user: ${userEmail}`);

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Find and revoke active API keys
    const activeKeysQuery = await adminDb
      .collection("users")
      .doc(userId)
      .collection("apiKeys")
      .where("status", "==", "active")
      .get();

    if (activeKeysQuery.empty) {
      return NextResponse.json(
        {
          error: "No active API key found",
          message: "You don't have any active API keys to revoke",
        },
        { status: 404 },
      );
    }

    // Revoke all active keys (should only be one due to single key policy)
    const batch = adminDb.batch();
    let revokedCount = 0;

    activeKeysQuery.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "disabled",
        revokedAt: new Date().toISOString(),
      });
      revokedCount++;
    });

    await batch.commit();

    console.log(`✅ [API Keys] Revoked ${revokedCount} API key(s) for user: ${userEmail}`);

    return NextResponse.json({
      success: true,
      message: `Successfully revoked ${revokedCount} API key(s)`,
      user: {
        email: userEmail,
      },
      revokedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [API Keys] Error revoking key:", error);
    return NextResponse.json(
      {
        error: "Failed to revoke API key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/keys
 * Get information about the user's API key status
 *
 * Headers:
 * - Authorization: Bearer <firebase-id-token>
 */
export async function GET(request: NextRequest) {
  try {
    console.log("📋 [API Keys] Key status request received");

    // Extract Firebase ID token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
    }

    const idToken = authHeader.substring(7);

    if (!isAdminInitialized) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Verify Firebase ID token
    const auth = getAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Invalid Firebase token" }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Get all API keys for the user
    const allKeysQuery = await adminDb
      .collection("users")
      .doc(userId)
      .collection("apiKeys")
      .orderBy("createdAt", "desc")
      .get();

    const apiKeys = allKeysQuery.docs.map((doc) => {
      const data = doc.data();
      return {
        keyId: doc.id.substring(0, 8), // First 8 chars of hash for identification
        status: data.status,
        createdAt: data.createdAt,
        lastUsed: data.lastUsed,
        requestCount: data.requestCount,
        violations: data.violations,
        lockoutUntil: data.lockoutUntil,
        revokedAt: data.revokedAt,
      };
    });

    const activeKey = apiKeys.find((key) => key.status === "active");

    return NextResponse.json({
      success: true,
      user: {
        email: userEmail,
      },
      hasActiveKey: !!activeKey,
      activeKey: activeKey ?? null,
      keyHistory: apiKeys,
      limits: {
        requestsPerMinute: 50,
        violationLockoutHours: 1,
        maxViolationsBeforeLockout: 2,
      },
    });
  } catch (error) {
    console.error("❌ [API Keys] Error getting key status:", error);
    return NextResponse.json(
      {
        error: "Failed to get API key status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
