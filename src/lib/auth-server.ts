import { cookies } from "next/headers";

import { getAuth } from "firebase-admin/auth";

import { getAdminDb } from "./firebase-admin";

interface ServerSession {
  user: {
    uid: string;
    email: string;
    role: string;
  } | null;
}

async function getUserProfile(uid: string) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error("Admin database not available");
    return null;
  }

  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    return null;
  }

  return userDoc.data();
}

export async function getServerSession(): Promise<ServerSession> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return { user: null };
    }

    // Verify the session cookie
    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);

    // Get user profile from Firestore
    const userData = await getUserProfile(decodedClaims.uid);
    if (!userData) {
      return { user: null };
    }

    return {
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email ?? userData.email ?? "unknown",
        role: userData.role ?? "creator",
      },
    };
  } catch (error) {
    console.error("Error getting server session:", error);
    return { user: null };
  }
}
