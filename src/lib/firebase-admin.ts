import { initializeApp, getApps, cert, App, ServiceAccount } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App;
let auth: Auth;
let db: Firestore;

const initializeAdminApp = () => {
  if (getApps().length > 0) {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    return;
  }

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      throw new Error("Firebase Admin SDK environment variables are not set.");
    }

    const serviceAccount: ServiceAccount = {
      projectId,
      privateKey,
      clientEmail,
    };

    app = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });

    auth = getAuth(app);
    db = getFirestore(app);

    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    // We are not throwing the error here to allow the app to run even if Firebase Admin is not configured.
    // The parts of the app that depend on it will fail gracefully.
  }
};

initializeAdminApp();

// These are now guaranteed to be initialized (or throw an error)
export const adminApp = app;
export const adminAuth = auth;
export const adminDb = db;
