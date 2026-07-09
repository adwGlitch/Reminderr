import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { db, auth } from "./config";

// Helper: split an array into chunks of `size`
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Helper validation for admin callables — typed for v2 CallableRequest
const assertAdmin = (request: CallableRequest) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  if (request.auth.token.superAdmin !== true) {
    throw new HttpsError("permission-denied", "Super Admin claims required");
  }
};

// 6. Callable: getAdminStats
export const getAdminStatsCallable = onCall(async (request) => {
  assertAdmin(request);

  const usersSnap = await db.collection("users").get();
  const groupsSnap = await db.collection("groups").get();
  const remindersSnap = await db.collection("reminders").get();

  const totalUsers = usersSnap.size;
  const activeUsers = usersSnap.docs.filter((d) => !d.data().disabled).length;
  const totalGroups = groupsSnap.size;

  let completedReminders = 0;
  let pendingReminders = 0;
  let overdueReminders = 0;
  const today = new Date().toISOString().split("T")[0];

  remindersSnap.forEach((doc) => {
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
});

// 7. Callable: disableUser
export const disableUserCallable = onCall(async (request) => {
  assertAdmin(request);

  const { uid, disabled } = request.data;
  if (!uid) {
    throw new HttpsError("invalid-argument", "Missing user uid");
  }

  // Disable in Auth
  await auth.updateUser(uid, { disabled });

  // Sync in Firestore user doc
  await db.collection("users").doc(uid).update({
    disabled,
    updatedAt: new Date().toISOString(),
  });

  return { success: true };
});

// 8. Callable: deleteGroup
// Uses chunked batches to handle groups with > 500 members/reminders (Firestore batch limit)
export const deleteGroupCallable = onCall(async (request) => {
  assertAdmin(request);

  const { groupId } = request.data;
  if (!groupId) {
    throw new HttpsError("invalid-argument", "Missing group ID");
  }

  const BATCH_LIMIT = 499;

  // 1. Collect all docs to delete
  const [membersSnap, remindersSnap] = await Promise.all([
    db.collection("groupMembers").where("groupId", "==", groupId).get(),
    db.collection("reminders").where("groupId", "==", groupId).get(),
  ]);

  // Build a flat list of all refs to delete (group doc + members + reminders)
  const groupRef = db.collection("groups").doc(groupId);
  const allRefs = [
    groupRef,
    ...membersSnap.docs.map((d) => d.ref),
    ...remindersSnap.docs.map((d) => d.ref),
  ];

  // 2. Split into chunks of BATCH_LIMIT and commit each chunk
  const chunks = chunkArray(allRefs, BATCH_LIMIT);
  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  return { success: true };
});
