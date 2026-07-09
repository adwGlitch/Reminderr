"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGroupCallable = exports.disableUserCallable = exports.getAdminStatsCallable = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("./config");
// Helper: split an array into chunks of `size`
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
// Helper validation for admin callables — typed for v2 CallableRequest
const assertAdmin = (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    }
    if (request.auth.token.superAdmin !== true) {
        throw new https_1.HttpsError("permission-denied", "Super Admin claims required");
    }
};
// 6. Callable: getAdminStats
exports.getAdminStatsCallable = (0, https_1.onCall)(async (request) => {
    assertAdmin(request);
    const usersSnap = await config_1.db.collection("users").get();
    const groupsSnap = await config_1.db.collection("groups").get();
    const remindersSnap = await config_1.db.collection("reminders").get();
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
        }
        else {
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
exports.disableUserCallable = (0, https_1.onCall)(async (request) => {
    assertAdmin(request);
    const { uid, disabled } = request.data;
    if (!uid) {
        throw new https_1.HttpsError("invalid-argument", "Missing user uid");
    }
    // Disable in Auth
    await config_1.auth.updateUser(uid, { disabled });
    // Sync in Firestore user doc
    await config_1.db.collection("users").doc(uid).update({
        disabled,
        updatedAt: new Date().toISOString(),
    });
    return { success: true };
});
// 8. Callable: deleteGroup
// Uses chunked batches to handle groups with > 500 members/reminders (Firestore batch limit)
exports.deleteGroupCallable = (0, https_1.onCall)(async (request) => {
    assertAdmin(request);
    const { groupId } = request.data;
    if (!groupId) {
        throw new https_1.HttpsError("invalid-argument", "Missing group ID");
    }
    const BATCH_LIMIT = 499;
    // 1. Collect all docs to delete
    const [membersSnap, remindersSnap] = await Promise.all([
        config_1.db.collection("groupMembers").where("groupId", "==", groupId).get(),
        config_1.db.collection("reminders").where("groupId", "==", groupId).get(),
    ]);
    // Build a flat list of all refs to delete (group doc + members + reminders)
    const groupRef = config_1.db.collection("groups").doc(groupId);
    const allRefs = [
        groupRef,
        ...membersSnap.docs.map((d) => d.ref),
        ...remindersSnap.docs.map((d) => d.ref),
    ];
    // 2. Split into chunks of BATCH_LIMIT and commit each chunk
    const chunks = chunkArray(allRefs, BATCH_LIMIT);
    for (const chunk of chunks) {
        const batch = config_1.db.batch();
        chunk.forEach((ref) => batch.delete(ref));
        await batch.commit();
    }
    return { success: true };
});
//# sourceMappingURL=callables.js.map