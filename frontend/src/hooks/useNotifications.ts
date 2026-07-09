"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuthStore } from "@/store/useAuthStore";
import { NotificationType } from "@/types";

export function useNotifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: NotificationType[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            userId: data.userId,
            type: data.type,
            title: data.title,
            body: data.body,
            link: data.link,
            read: data.read,
            createdAt: data.createdAt,
          });
        });
        setNotifications(list);
        setIsLoading(false);
      },
      (error) => {
        console.error("Notifications fetch error:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    const ref = doc(db, "notifications", notificationId);
    await updateDoc(ref, { read: true });
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    const unreadNotifications = notifications.filter((n) => !n.read);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifications.forEach((n) => {
      const ref = doc(db, "notifications", n.id!);
      batch.update(ref, { read: true });
    });

    await batch.commit();
  };

  return {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
}
