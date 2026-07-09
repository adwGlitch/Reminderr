"use server";

import { getSession } from "@/lib/session";
import { getAdminAuth, getAdminDb } from "@/firebase/admin";
import { revalidatePath } from "next/cache";

// Middleware verification helper
async function verifyAdmin() {
  const session = await getSession();
  if (!session || !session.superAdmin) {
    throw new Error("Forbidden: Super Admin access required.");
  }
}

export async function toggleUserStatus(uid: string, disabled: boolean) {
  await verifyAdmin();

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // 1. Update user state in Firebase Authentication
    await adminAuth.updateUser(uid, { disabled });

    // 2. Sync state in Firestore user document
    await adminDb.collection("users").doc(uid).update({
      disabled,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling user status:", error);
    throw new Error(error.message || "Failed to update user status");
  }
}

export async function deleteGroup(groupId: string) {
  await verifyAdmin();

  try {
    const adminDb = getAdminDb();
    const batch = adminDb.batch();

    // 1. Delete group document
    const groupRef = adminDb.collection("groups").doc(groupId);
    batch.delete(groupRef);

    // 2. Query and delete all group memberships
    const membersSnap = await adminDb
      .collection("groupMembers")
      .where("groupId", "==", groupId)
      .get();
    
    membersSnap.forEach((doc: any) => {
      batch.delete(doc.ref);
    });

    // 3. Query and delete all group reminders
    const remindersSnap = await adminDb
      .collection("reminders")
      .where("groupId", "==", groupId)
      .get();

    remindersSnap.forEach((doc: any) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting group:", error);
    throw new Error(error.message || "Failed to delete group");
  }
}

export async function getAdminStats() {
  await verifyAdmin();

  try {
    const adminDb = getAdminDb();
    const usersSnap = await adminDb.collection("users").get();
    const groupsSnap = await adminDb.collection("groups").get();
    const remindersSnap = await adminDb.collection("reminders").get();

    const totalUsers = usersSnap.size;
    const activeUsers = usersSnap.docs.filter((d: any) => !d.data().disabled).length;
    const totalGroups = groupsSnap.size;
    
    let completedReminders = 0;
    let pendingReminders = 0;
    let overdueReminders = 0;
    const today = new Date().toISOString().split("T")[0];

    remindersSnap.forEach((doc: any) => {
      const data = doc.data();
      if (data.status === "completed") {
        completedReminders++;
      } else {
        pendingReminders++;
        if (data.dueDate < today) {
          overdueReminders++;
        }
      }
    });

    return {
      totalUsers,
      activeUsers,
      totalGroups,
      totalReminders: remindersSnap.size,
      completedReminders,
      pendingReminders,
      overdueReminders,
    };
  } catch (error: any) {
    console.error("Error fetching admin stats:", error);
    throw new Error("Failed to fetch administrative metrics");
  }
}
