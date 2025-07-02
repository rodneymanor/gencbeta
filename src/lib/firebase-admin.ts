import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
let adminApp: any;
let adminDb: any;
let adminAuth: any;

try {
  // Check if we have the required environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.warn("⚠️ Firebase Admin SDK not configured - missing environment variables");
    console.warn("Required: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL");
  } else {
    // Initialize Admin SDK if not already initialized
    if (getApps().length === 0) {
      const serviceAccount: ServiceAccount = {
        projectId,
        privateKey,
        clientEmail,
      };

      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });

      console.log("✅ Firebase Admin SDK initialized successfully");
    } else {
      adminApp = getApps()[0];
    }

    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error);
}

export const getAdminDb = () => adminDb;
export const getAdminAuth = () => adminAuth;
export const isAdminInitialized = !!(adminDb && adminAuth);

// Export direct references for backward compatibility
export { adminDb, adminAuth };
