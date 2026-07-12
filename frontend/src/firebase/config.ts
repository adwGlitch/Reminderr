import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key-for-build",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log("[FIREBASE CONFIG DEBUG] API Key:", firebaseConfig.apiKey);

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// Use Emulators only if explicitly configured
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  const authEmulatorHost = "http://127.0.0.1:9099";
  const firestoreEmulatorHost = "127.0.0.1";
  const firestoreEmulatorPort = 8080;
  
  if (!(auth as any)._emulatorConfigured) {
    (auth as any)._emulatorConfigured = true;
    connectAuthEmulator(auth, authEmulatorHost);
    connectFirestoreEmulator(db, firestoreEmulatorHost, firestoreEmulatorPort);
  }
}

// Messaging is only supported in browser environments
const messaging = async () => {
  if (typeof window !== "undefined" && await isSupported()) {
    return getMessaging(app);
  }
  return null;
};

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export { app, auth, db, messaging, vapidKey };
