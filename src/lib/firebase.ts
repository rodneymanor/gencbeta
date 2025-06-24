// For more information on how to access Firebase in a Next.js app, see:
// https://firebase.google.com/docs/web/setup#access-firebase

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:123456789:web:abcdef123456",
};

// Only initialize Firebase if we have a valid API key (not the demo one)
const hasValidConfig =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key";

const app = hasValidConfig ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]) : null;
const auth = hasValidConfig && app ? getAuth(app) : null;
const db = hasValidConfig && app ? getFirestore(app) : null;

export { auth, db };
