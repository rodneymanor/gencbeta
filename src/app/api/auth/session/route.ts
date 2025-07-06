import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { authAdmin } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: "ID token is required" }, { status: 400 });
  }

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });
    cookies().set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 });
  }
}
