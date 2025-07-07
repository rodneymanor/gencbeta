import "server-only";

import { cookies } from "next/headers";
import { getAdminAuth } from "./firebase-admin";

export async function getCurrentUser() {
  console.log("🔍 [getCurrentUser] Function called");
  
  try {
    const adminAuth = getAdminAuth();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    
    console.log("🔍 [getCurrentUser] Session cookie exists:", !!sessionCookie);
    console.log("🔍 [getCurrentUser] Session cookie length:", sessionCookie?.length ?? 0);

    if (!sessionCookie) {
      console.log("❌ [getCurrentUser] No session cookie found");
      return null;
    }

    // Verify the session cookie. In this case an additional check is added to detect
    // if the user's Firebase session was revoked, user deleted/disabled, etc.
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
    console.log("✅ [getCurrentUser] Session verified for user:", decodedClaims.uid);
    return decodedClaims;
  } catch (error) {
    // Session cookie is invalid or expired.
    console.error("❌ [getCurrentUser] Error verifying session cookie:", error);
    return null;
  }
}
