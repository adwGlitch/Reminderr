"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDueReminders = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_functions_1 = require("firebase-functions");
const config_1 = require("./config");
// 5. Scheduler: checkDueReminders (Runs every 15 minutes)
exports.checkDueReminders = (0, scheduler_1.onSchedule)("*/15 * * * *", async (event) => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    firebase_functions_1.logger.info(`Running checkDueReminders scheduler at: ${todayStr} ${now.toISOString()}`);
    // Query pending reminders due today
    const snapshot = await config_1.db
        .collection("reminders")
        .where("status", "==", "pending")
        .where("dueDate", "==", todayStr)
        .get();
    const promises = [];
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
            if (diff > 15)
                return;
            // Notify owner
            const p1 = config_1.db.collection("notifications").add({
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
                const p2 = config_1.db.collection("notifications").add({
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
    firebase_functions_1.logger.info(`Due reminder checks completed. Processed ${promises.length} notifications.`);
});
//# sourceMappingURL=schedulers.js.map