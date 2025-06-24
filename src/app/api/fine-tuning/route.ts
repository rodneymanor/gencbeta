import { NextResponse } from "next/server";

export async function POST() {
  // Return a simple response to stop the 404 errors
  // This endpoint is likely being called by a browser extension or dev tool
  return NextResponse.json(
    {
      message: "Fine-tuning endpoint not implemented",
      status: "disabled",
    },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Fine-tuning endpoint not implemented",
      status: "disabled",
    },
    { status: 501 },
  );
}
