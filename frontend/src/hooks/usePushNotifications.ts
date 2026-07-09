"use client";

import { useEffect, useState } from "react";
import { getToken } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { messaging as getMessaging, db, vapidKey } from "@/firebase/config";
import { useAuthStore } from "@/store/useAuthStore";

export function usePushNotifications() {
  const { user } = useAuthStore();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const requestPermissionAndGetToken = async () => {
      try {
        // Guard: Notification API is browser-only — skip in SSR / non-browser environments
        if (typeof window === "undefined" || !("Notification" in window)) {
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setPermissionGranted(true);
          
          const messagingParams = await getMessaging();
          if (messagingParams) {
            const token = await getToken(messagingParams, { vapidKey });
            if (token) {
              setFcmToken(token);
              // Save token to Firestore
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(token)
              });
              console.log("FCM Token successfully registered and saved!");
            } else {
              console.log("No registration token available. Request permission to generate one.");
            }
          }
        } else {
          console.log("Notification permission not granted.");
        }
      } catch (error) {
        console.error("Error setting up push notifications:", error);
      }
    };

    requestPermissionAndGetToken();
  }, [user]);

  return { permissionGranted, fcmToken };
}
