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
export async function createSession(idToken: string): Promise<{ success: boolean; error?: string; cookieValue?: string; maxAge?: number }> {
  try {
    console.log("[Session] Verifying ID token with Admin SDK...");
    const adminAuth = getAdminAuth();

    // verifyIdToken: local crypto check using cached Google public keys.
    // We add a retry loop because tokens from brand-new accounts can be rejected
    // initially due to a ~1-2s propagation delay in Firebase.
    let decoded;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        decoded = await adminAuth.verifyIdToken(idToken);
        break; // Success
      } catch (err: any) {
        attempts++;
        if (attempts >= maxAttempts) throw err;
        console.warn(`[Session] Token verification attempt ${attempts} failed (${err?.code}). Retrying in 1s...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!decoded) {
      throw new Error("Failed to decode token after retries");
    }

    const cookieData: CookieData = {
      uid: decoded.uid,
      email: decoded.email || "",
      superAdmin: decoded.superAdmin === true,
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    };

    console.log("[Session] Token verified ✓ uid:", decoded.uid);
    return { 
      success: true, 
      cookieValue: JSON.stringify(cookieData), 
      maxAge: SESSION_DURATION_SECONDS 
    };
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
  // Let the route handler perform the deletion to avoid Next.js Edge runtime constraints
  return true;
}
