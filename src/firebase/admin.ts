import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Replace escaped newlines — critical for Vercel env vars stored as a single line string
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  console.log("[Firebase Admin] Initializing...");
  console.log("[Firebase Admin] projectId:", projectId ? "✓ present" : "✗ MISSING");
  console.log("[Firebase Admin] clientEmail:", clientEmail ? "✓ present" : "✗ MISSING");
  console.log(
    "[Firebase Admin] privateKey:",
    privateKey ? `✓ present (starts with: ${privateKey.slice(0, 30)}...)` : "✗ MISSING"
  );

  if (!projectId) {
    throw new Error(
      "[Firebase Admin] FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID) is not set."
    );
  }

  if (clientEmail && privateKey) {
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log("[Firebase Admin] Initialized with service account credentials ✓");
    return app;
  }

  // Warn loudly — missing credentials will cause session cookie operations to fail
  console.warn(
    "[Firebase Admin] WARNING: FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY is missing. " +
      "Falling back to Application Default Credentials. " +
      "Session cookie operations will likely FAIL unless running on GCP."
  );

  return initializeApp({ projectId });
};

const adminApp = initializeFirebaseAdmin();
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
