import { initializeApp, getApps, cert, App, ServiceAccount } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

interface AdminInstances {
  app: App;
  auth: Auth;
  db: Firestore;
}

let instances: AdminInstances | null = null;

function initializeAdminApp(): AdminInstances {
  if (instances) {
    return instances;
  }

  const apps = getApps();
  if (apps.length > 0) {
    const app = apps[0];
    instances = {
      app,
      auth: getAuth(app),
      db: getFirestore(app),
    };
    return instances;
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

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
    
    console.log("✅ Firebase Admin SDK initialized successfully");

    instances = {
      app,
      auth: getAuth(app),
      db: getFirestore(app),
    };
    
    return instances;

  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    throw new Error("Could not initialize Firebase Admin SDK. Check server logs for details.");
  }
}

export function getAdminAuth(): Auth {
  return initializeAdminApp().auth;
}

export function getAdminDb(): Firestore {
  return initializeAdminApp().db;
}

export function getAdminApp(): App {
    return initializeAdminApp().app;
}
