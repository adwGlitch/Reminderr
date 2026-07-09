import { NextRequest, NextResponse } from "next/server";
import { createSession, deleteSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const result = await createSession(idToken);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to create session" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Session API Error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session DELETE API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
