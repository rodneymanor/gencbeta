import "server-only";

import { cookies } from "next/headers";

import { adminAuth } from "./firebase-admin";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    // Verify the session cookie. In this case an additional check is added to detect
    // if the user's Firebase session was revoked, user deleted/disabled, etc.
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
    return decodedClaims;
  } catch (error) {
    // Session cookie is invalid or expired.
    console.error("Error verifying session cookie:", error);
    return null;
  }
}
