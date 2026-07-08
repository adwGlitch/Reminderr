import { cookies } from "next/headers";
import { adminAuth } from "@/firebase/admin";

export interface SessionPayload {
  uid: string;
  email: string;
  role?: string;
  superAdmin?: boolean;
}

const SESSION_COOKIE_NAME = "remindsync_session";
// Session expires in 5 days
const EXPIRES_IN = 60 * 60 * 24 * 5 * 1000;

/**
 * Creates a Firebase Admin session cookie from a client-side ID token.
 * Includes a retry with a 1.5s delay to handle Firebase token propagation
 * latency for newly created accounts.
 */
export async function createSession(idToken: string): Promise<boolean> {
  const attempt = async (isRetry = false): Promise<string> => {
    if (isRetry) {
      console.log("[Session] Retrying createSessionCookie after propagation delay...");
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    return adminAuth.createSessionCookie(idToken, { expiresIn: EXPIRES_IN });
  };

  try {
    let sessionCookie: string;

    try {
      console.log("[Session] Attempting to create session cookie...");
      sessionCookie = await attempt();
    } catch (firstError: any) {
      // Firebase can return auth/argument-error or auth/invalid-id-token for
      // brand-new accounts due to token propagation delay (~1-2s). Retry once.
      console.warn(
        "[Session] First attempt failed:",
        firstError?.code || firstError?.message,
        "— retrying..."
      );
      sessionCookie = await attempt(true);
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: EXPIRES_IN / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    console.log("[Session] Session cookie set successfully ✓");
    return true;
  } catch (error: any) {
    console.error(
      "[Session] Failed to create session cookie after retry.",
      "\n  Code:", error?.code,
      "\n  Message:", error?.message
    );
    return false;
  }
}

/**
 * Reads and verifies the session cookie. Returns the decoded session payload
 * or null if the cookie is missing or invalid.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      superAdmin: decodedToken.superAdmin === true,
    };
  } catch (error: any) {
    console.error(
      "[Session] Failed to verify session cookie:",
      error?.code || error?.message
    );
    return null;
  }
}

/**
 * Deletes the session cookie, effectively logging the user out server-side.
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
