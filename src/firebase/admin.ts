import admin from "firebase-admin";

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    // Strip surrounding quotes if present (which happens if pasted with quotes on Vercel)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

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
    const app = admin.initializeApp({
      credential: admin.credential.cert({
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

  return admin.initializeApp({ projectId });
};

const adminApp = initializeFirebaseAdmin();
const adminAuth = admin.auth(adminApp);
const adminDb = admin.firestore(adminApp);

export { adminApp, adminAuth, adminDb };
