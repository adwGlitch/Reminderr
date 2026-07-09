import { cookies } from "next/headers";
import { getAdminAuth } from "@/firebase/admin";

export interface SessionPayload {
  uid: string;
  email: string;
  role?: string;
  superAdmin?: boolean;
}

// Internal shape stored in the cookie
interface CookieData {
  uid: string;
  email: string;
  superAdmin: boolean;
  // Unix timestamp (seconds) when this session expires
  exp: number;
}

const SESSION_COOKIE_NAME = "remindsync_session";
// Session lasts 5 days
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 5;

/**
 * Creates a server-side session after verifying the Firebase ID token.
 */
export async function createSession(idToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[Session] Verifying ID token with Admin SDK...");
    const adminAuth = getAdminAuth();

    // verifyIdToken: local crypto check using cached Google public keys.
    // Only makes a network call once to fetch public keys, then caches them.
    const decoded = await adminAuth.verifyIdToken(idToken);
    console.log("[Session] Token verified ✓ uid:", decoded.uid);

    const cookieData: CookieData = {
      uid: decoded.uid,
      email: decoded.email || "",
      superAdmin: decoded.superAdmin === true,
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    };

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(cookieData), {
      maxAge: SESSION_DURATION_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    console.log("[Session] Session cookie set successfully ✓ (expires in 5 days)");
    return { success: true };
  } catch (error: any) {
    console.error(
      "[Session] Failed to create session.",
      "\n  Code:", error?.code,
      "\n  Message:", error?.message
    );
    return { success: false, error: error?.message || "Verification failed" };
  }
}

/**
 * Reads and parses the session cookie.
 * The cookie was set by our own server after token verification,
 * so we trust its contents (httpOnly — cannot be set or read by client JS).
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!raw) {
      return null;
    }

    const data: CookieData = JSON.parse(raw);

    // Check session expiry
    if (data.exp < Math.floor(Date.now() / 1000)) {
      console.warn("[Session] Session cookie has expired.");
      return null;
    }

    return {
      uid: data.uid,
      email: data.email,
      superAdmin: data.superAdmin,
    };
  } catch (error: any) {
    console.error("[Session] Failed to parse session cookie:", error?.message);
    return null;
  }
}

/**
 * Deletes the session cookie, logging the user out server-side.
 */
export async function deleteSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    console.log("[Session] Session cookie deleted ✓");
    return true;
  } catch (error: any) {
    console.error("[Session] Failed to delete session cookie:", error?.message);
    return false;
  }
}
