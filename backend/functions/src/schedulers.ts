import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { db } from "./config";

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
