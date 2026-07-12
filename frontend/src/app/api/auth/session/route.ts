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

    const response = NextResponse.json({ success: true });
    
    if (result.cookieValue && result.maxAge) {
      response.cookies.set("remindsync_session", result.cookieValue, {
        maxAge: result.maxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
      });
    }

    return response;
  } catch (error: any) {
    console.error("Session API Error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await deleteSession();
    const response = NextResponse.json({ success: true });
    response.cookies.delete("remindsync_session");
    return response;
  } catch (error) {
    console.error("Session DELETE API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
