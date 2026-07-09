import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { db } from "./config";

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
