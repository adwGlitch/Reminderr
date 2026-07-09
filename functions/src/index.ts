import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";

initializeApp();

const db = getFirestore();
const auth = getAuth();

// 1. Trigger: onUserCreate
export const onUserCreate = onDocumentCreated("users/{userId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  logger.info(`New user document created: ${event.params.userId}`, { data });
});

// 2. Trigger: onReminderUpdate (Checks recurrence on completion)
export const onReminderUpdate = onDocumentUpdated("reminders/{reminderId}", async (event) => {
  const change = event.data;
  if (!change) return;

  const beforeData = change.before.data();
  const afterData = change.after.data();

  // Check if status changed from pending to completed
  if (beforeData.status === "pending" && afterData.status === "completed") {
    logger.info(`Reminder ${event.params.reminderId} marked completed.`);

    // If recurrence rule is set, create the next instance
    if (afterData.recurrence && afterData.recurrence !== "none") {
      const currentDate = new Date(afterData.dueDate);
      let nextDate = new Date(currentDate);

      if (afterData.recurrence === "daily") {
        nextDate.setDate(currentDate.getDate() + 1);
      } else if (afterData.recurrence === "weekly") {
        nextDate.setDate(currentDate.getDate() + 7);
      } else if (afterData.recurrence === "monthly") {
        nextDate.setMonth(currentDate.getMonth() + 1);
      }

      const nextDateStr = nextDate.toISOString().split("T")[0];

      // Create new instance in reminders collection
      const nextReminder = {
        title: afterData.title,
        description: afterData.description,
        dueDate: nextDateStr,
        dueTime: afterData.dueTime,
        priority: afterData.priority,
        status: "pending",
        recurrence: afterData.recurrence,
        ownerId: afterData.ownerId,
        groupId: afterData.groupId,
        assignedTo: afterData.assignedTo,
        visibilityRestriction: afterData.visibilityRestriction,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };

      await db.collection("reminders").add(nextReminder);
      logger.info(`Recurring instance generated for ${afterData.title} on ${nextDateStr}`);
    }

    // Log Activity
    await db.collection("activityLogs").add({
      groupId: afterData.groupId,
      userId: afterData.ownerId,
      action: "completed_reminder",
      details: { title: afterData.title },
      createdAt: new Date().toISOString(),
    });
  }
});

// 3. Trigger: onReminderAssigned
export const onReminderAssigned = onDocumentCreated("reminders/{reminderId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();

  // If reminder is shared in a group and assigned to a member
  if (data.groupId && data.assignedTo && data.assignedTo !== data.ownerId) {
    const groupSnap = await db.collection("groups").doc(data.groupId).get();
    const groupName = groupSnap.exists ? groupSnap.data()?.name : "Shared Group";

    // Write a notification for the assignee
    await db.collection("notifications").add({
      userId: data.assignedTo,
      type: "assigned",
      title: "New Task Assigned",
      body: `You have been assigned '${data.title}' in the group '${groupName}'`,
      link: `/groups/${data.groupId}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    logger.info(`Notification generated for assignee: ${data.assignedTo}`);
  }
});

// 4. Trigger: onMemberInvited
export const onMemberInvited = onDocumentCreated("invitations/{inviteId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();

  logger.info(`Invitation sent to: ${data.email} for group ${data.groupId}`);

  // In a production app, we would send a SendGrid or NodeMailer transactional email here
});

// 5. Scheduler: checkDueReminders (Runs every 15 minutes)
export const checkDueReminders = onSchedule("*/15 * * * *", async (event) => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  logger.info(`Running checkDueReminders scheduler at: ${todayStr} ${now.toISOString()}`);

  // Query pending reminders due today
  const snapshot = await db
    .collection("reminders")
    .where("status", "==", "pending")
    .where("dueDate", "==", todayStr)
    .get();

  const promises: Promise<any>[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();

    // Check if reminder has a dueTime that falls within the current ±15 minute window.
    // Exact-match comparison is fragile because scheduler fires may be off by seconds.
    if (data.dueTime) {
      const [dueHour, dueMinute] = data.dueTime.split(":").map(Number);
      const dueMinutesFromMidnight = dueHour * 60 + dueMinute;
      const nowMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
      const diff = Math.abs(nowMinutesFromMidnight - dueMinutesFromMidnight);

      // Only notify if the due time is within a 15-minute window of now
      if (diff > 15) return;

      // Notify owner
      const p1 = db.collection("notifications").add({
        userId: data.ownerId,
        type: "due",
        title: "Reminder Due",
        body: `Reminder '${data.title}' is due now!`,
        link: data.groupId ? `/groups/${data.groupId}` : "/dashboard",
        read: false,
        createdAt: new Date().toISOString(),
      });
      promises.push(p1);

      // Notify assignee if different from owner
      if (data.assignedTo && data.assignedTo !== data.ownerId) {
        const p2 = db.collection("notifications").add({
          userId: data.assignedTo,
          type: "due",
          title: "Assigned Task Due",
          body: `Assigned task '${data.title}' is due now!`,
          link: `/groups/${data.groupId}`,
          read: false,
          createdAt: new Date().toISOString(),
        });
        promises.push(p2);
      }
    }
  });

  await Promise.all(promises);
  logger.info(`Due reminder checks completed. Processed ${promises.length} notifications.`);
});

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
