"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuthStore } from "@/store/useAuthStore";
import { Reminder, Priority, Recurrence } from "@/types";

export function useReminders(groupId: string | null = null) {
  const { user } = useAuthStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setReminders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Build firestore query based on context
    // If groupId is set, fetch all reminders for that group (security rules govern visibility).
    // Otherwise fetch personal reminders owned by the current user.
    const q = groupId
      ? query(
          collection(db, "reminders"),
          where("groupId", "==", groupId)
        )
      : query(
          collection(db, "reminders"),
          where("ownerId", "==", user.uid),
          where("groupId", "==", null)
        );


    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedReminders: Reminder[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedReminders.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            dueDate: data.dueDate,
            dueTime: data.dueTime,
            priority: data.priority,
            status: data.status,
            recurrence: data.recurrence,
            ownerId: data.ownerId,
            groupId: data.groupId,
            assignedTo: data.assignedTo || null,
            visibilityRestriction: data.visibilityRestriction || false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            completedAt: data.completedAt || null,
          });
        });

        // Client side sorting: due date ASC, then due time ASC, then priority (high > medium > low)
        fetchedReminders.sort((a, b) => {
          const dateA = new Date(`${a.dueDate}T${a.dueTime || "00:00"}`);
          const dateB = new Date(`${b.dueDate}T${b.dueTime || "00:00"}`);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        });

        setReminders(fetchedReminders);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, groupId]);

  const addReminder = async (data: Omit<Reminder, "ownerId" | "createdAt" | "updatedAt" | "completedAt">) => {
    if (!user) throw new Error("Unauthenticated");

    const newReminder = {
      ...data,
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    };

    return await addDoc(collection(db, "reminders"), newReminder);
  };

  const updateReminder = async (reminderId: string, updates: Partial<Reminder>) => {
    if (!user) throw new Error("Unauthenticated");

    const docRef = doc(db, "reminders", reminderId);
    return await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteReminder = async (reminderId: string) => {
    if (!user) throw new Error("Unauthenticated");

    const docRef = doc(db, "reminders", reminderId);
    return await deleteDoc(docRef);
  };

  const toggleReminderStatus = async (reminderId: string, currentStatus: "pending" | "completed") => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    const completedAt = newStatus === "completed" ? new Date().toISOString() : null;
    
    return await updateReminder(reminderId, {
      status: newStatus,
      completedAt,
    });
  };

  return {
    reminders,
    isLoading,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderStatus,
  };
}
