"use client";

import { useEffect, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import { useAuthStore } from "@/store/useAuthStore";
import { UserProfile } from "@/types";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider syncs the Firebase Auth state into the Zustand store.
 *
 * IMPORTANT: This component intentionally does NOT manage session cookies.
 * Session cookie creation/deletion is handled by the login, register, and
 * logout flows directly. Doing it here caused a race condition where two
 * competing POSTs to /api/auth/session fired simultaneously.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        console.log("[AuthProvider] Auth state changed:", firebaseUser?.uid ?? "signed out");

        if (firebaseUser) {
          // Fetch custom claims to check superAdmin status
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const superAdmin = idTokenResult.claims.superAdmin === true;

          // Fetch additional profile data from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userSnapshot = await getDoc(userDocRef);

          let profileData: UserProfile;

          if (userSnapshot.exists()) {
            const data = userSnapshot.data();
            profileData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: data.displayName || firebaseUser.displayName || "User",
              avatarUrl: data.avatarUrl || firebaseUser.photoURL || null,
              joinedDate: data.joinedDate || new Date().toISOString(),
              stats: data.stats,
              disabled: data.disabled || false,
              superAdmin,
            };
          } else {
            // Fallback profile if Firestore doc hasn't been created yet
            profileData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "User",
              avatarUrl: firebaseUser.photoURL || null,
              joinedDate: new Date().toISOString(),
              stats: { total: 0, completed: 0, pending: 0, overdue: 0 },
              disabled: false,
              superAdmin,
            };
          }

          if (profileData.disabled) {
            console.warn("[AuthProvider] User is disabled — signing out.");
            // Sign out client-side and clear server-side session cookie
            await auth.signOut();
            await fetch("/api/auth/session", { method: "DELETE" });
            setUser(null);
            return;
          }

          console.log("[AuthProvider] User profile loaded ✓", profileData.uid);
          setUser(profileData);
        } else {
          console.log("[AuthProvider] No user — clearing store.");
          setUser(null);
        }
      } catch (error) {
        console.error("[AuthProvider] Auth state synchronization error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
