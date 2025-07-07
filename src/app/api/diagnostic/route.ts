// Diagnostic endpoint for troubleshooting configuration issues

import { NextResponse } from "next/server";

import { getAdminDb, getAdminAuth, isAdminInitialized } from "@/lib/firebase-admin";

interface DiagnosticResult {
  component: string;
  status: "OK" | "WARNING" | "ERROR";
  message: string;
  details?: Record<string, unknown>;
}

async function checkFirebaseAdminSDK(): Promise<DiagnosticResult> {
  try {
    if (isAdminInitialized && adminDb && adminAuth) {
      return {
        component: "Firebase Admin SDK",
        status: "OK",
        message: "Firebase Admin SDK is properly initialized",
      };
    } else {
      return {
        component: "Firebase Admin SDK",
        status: "ERROR",
        message: "Firebase Admin SDK is not initialized",
        details: {
          adminDb: !!adminDb,
          adminAuth: !!adminAuth,
          isInitialized: isAdminInitialized,
        },
      };
    }
  } catch (error) {
    return {
      component: "Firebase Admin SDK",
      status: "ERROR",
      message: "Firebase Admin SDK initialization failed",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

function checkEnvironmentVariables(): DiagnosticResult {
  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
    "VIDEO_API_KEY",
  ];

  const envStatus: Record<string, boolean> = {};
  let missingEnvVars = 0;

  requiredEnvVars.forEach((varName) => {
    const exists = !!process.env[varName];
    envStatus[varName] = exists;
    if (!exists) missingEnvVars++;
  });

  if (missingEnvVars === 0) {
    return {
      component: "Environment Variables",
      status: "OK",
      message: "All required environment variables are set",
    };
  } else {
    return {
      component: "Environment Variables",
      status: "ERROR",
      message: `${missingEnvVars} required environment variables are missing`,
      details: envStatus,
    };
  }
}

async function checkFirestoreConnection(): Promise<DiagnosticResult | null> {
  if (!isAdminInitialized) {
    return null;
  }

  try {
    // Try to read from collections to test connectivity
    const testQuery = await adminDb.collection("collections").limit(1).get();

    return {
      component: "Firestore Connection",
      status: "OK",
      message: "Successfully connected to Firestore",
      details: {
        collectionsFound: testQuery.size,
      },
    };
  } catch (error) {
    return {
      component: "Firestore Connection",
      status: "ERROR",
      message: "Failed to connect to Firestore",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

async function checkFirebaseAuth(): Promise<DiagnosticResult | null> {
  if (!isAdminInitialized) {
    return null;
  }

  try {
    // Test by trying to get user count (this requires admin privileges)
    const userList = await adminAuth.listUsers(1);

    return {
      component: "Firebase Auth",
      status: "OK",
      message: "Firebase Auth is working correctly",
      details: {
        canListUsers: true,
        sampleUserCount: userList.users.length,
      },
    };
  } catch (error) {
    return {
      component: "Firebase Auth",
      status: "WARNING",
      message: "Firebase Auth initialization succeeded but may have permission issues",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

function checkNextjsEnvironment(): DiagnosticResult {
  return {
    component: "Next.js Environment",
    status: "OK",
    message: "Next.js is running correctly",
    details: {
      nodeVersion: process.version,
      nodeEnv: process.env.NODE_ENV,
      nextjsVersion: process.env.npm_package_version ?? "Unknown",
    },
  };
}

export async function GET() {
  const results: DiagnosticResult[] = [];

  // Check Firebase Admin SDK
  results.push(await checkFirebaseAdminSDK());

  // Check environment variables
  results.push(checkEnvironmentVariables());

  // Check Firestore connection
  const firestoreResult = await checkFirestoreConnection();
  if (firestoreResult) {
    results.push(firestoreResult);
  }

  // Check Firebase Auth
  const authResult = await checkFirebaseAuth();
  if (authResult) {
    results.push(authResult);
  }

  // Check Next.js environment
  results.push(checkNextjsEnvironment());

  // Calculate overall status
  const hasErrors = results.some((r) => r.status === "ERROR");
  const hasWarnings = results.some((r) => r.status === "WARNING");

  const overallStatus = hasErrors ? "ERROR" : hasWarnings ? "WARNING" : "OK";
  const overallMessage = hasErrors
    ? "Critical issues found - video collection system may not work properly"
    : hasWarnings
      ? "Some issues found - video collection system should work with limitations"
      : "All systems operational - video collection system should work correctly";

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overallStatus,
    overallMessage,
    results,
    recommendations: getRecommendations(results),
  });
}

function getRecommendations(results: DiagnosticResult[]): string[] {
  const recommendations: string[] = [];

  const firebaseAdminResult = results.find((r) => r.component === "Firebase Admin SDK");
  if (firebaseAdminResult?.status === "ERROR") {
    recommendations.push(
      "Set up Firebase Admin SDK credentials in your .env.local file. See FIREBASE_ADMIN_SETUP.md for instructions.",
    );
  }

  const envVarsResult = results.find((r) => r.component === "Environment Variables");
  if (envVarsResult?.status === "ERROR") {
    recommendations.push(
      "Add missing environment variables to your .env.local file. Restart your development server after making changes.",
    );
  }

  const firestoreResult = results.find((r) => r.component === "Firestore Connection");
  if (firestoreResult?.status === "ERROR") {
    recommendations.push(
      "Check your Firebase project permissions and ensure the service account has Firestore access.",
    );
  }

  const authResult = results.find((r) => r.component === "Firebase Auth");
  if (authResult?.status === "WARNING") {
    recommendations.push("Verify your Firebase service account has the necessary permissions for user management.");
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "All systems are working correctly. Your video collection functionality should work as expected.",
    );
  }

  return recommendations;
}
