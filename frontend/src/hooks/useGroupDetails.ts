"use client";

import { useEffect, useState } from "react";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuthStore } from "@/store/useAuthStore";
import { Group, GroupMember, UserProfile, GroupRole } from "@/types";

export function useGroupDetails(groupId: string) {
  const { user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [myRole, setMyRole] = useState<GroupRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !groupId) return;

    setIsLoading(true);

    // 1. Subscribe to group document
    const unsubscribeGroup = onSnapshot(doc(db, "groups", groupId), (snapshot) => {
      if (snapshot.exists()) {
        setGroup({ id: snapshot.id, ...snapshot.data() } as Group);
      } else {
        setGroup(null);
      }
    });

    // 2. Subscribe to members listing
    const qMembers = query(collection(db, "groupMembers"), where("groupId", "==", groupId));
    const unsubscribeMembers = onSnapshot(
      qMembers,
      async (snapshot) => {
        const memberList: GroupMember[] = [];
        const profilePromises: Promise<UserProfile | null>[] = [];

        snapshot.forEach((mDoc) => {
          const mData = mDoc.data();
          const userId = mData.userId;
          const role = mData.role as GroupRole;

          if (userId === user.uid) {
            setMyRole(role);
          }

          // Fetch user profile info
          const profilePromise = getDoc(doc(db, "users", userId)).then((uSnap) => {
            if (uSnap.exists()) {
              return { uid: userId, ...uSnap.data() } as UserProfile;
            }
            return null;
          });

          profilePromises.push(profilePromise);
          memberList.push({
            id: mDoc.id,
            groupId: mData.groupId,
            userId,
            role,
            joinedAt: mData.joinedAt,
          });
        });

        const profiles = await Promise.all(profilePromises);

        // Map profiles back to memberships
        const mappedMembers = memberList.map((member, idx) => {
          const profile = profiles[idx];
          return {
            ...member,
            userProfile: profile || undefined,
          };
        });

        setMembers(mappedMembers);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching group members:", error);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribeGroup();
      unsubscribeMembers();
    };
  }, [groupId, user]);

  const updateGroup = async (name: string, description: string) => {
    if (myRole !== "owner" && myRole !== "admin") throw new Error("Unauthorized");
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, { name, description, updatedAt: new Date().toISOString() });
  };

  const inviteMember = async (email: string) => {
    if (myRole !== "owner" && myRole !== "admin") throw new Error("Unauthorized");
    if (!user || !group) return;

    // Create invitation
    await addDoc(collection(db, "invitations"), {
      groupId,
      groupName: group.name,
      email: email.trim().toLowerCase(),
      invitedBy: user.uid,
      invitedByName: user.displayName,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  };

  const changeMemberRole = async (userId: string, newRole: GroupRole) => {
    if (myRole !== "owner") throw new Error("Only group owner can edit member roles");
    const memberDocId = `${groupId}_${userId}`;
    const memberRef = doc(db, "groupMembers", memberDocId);
    await updateDoc(memberRef, { role: newRole });
  };

  const removeMember = async (userId: string) => {
    if (myRole !== "owner" && myRole !== "admin") throw new Error("Unauthorized");
    
    // Check if trying to remove owner
    const memberDocId = `${groupId}_${userId}`;
    const memberRef = doc(db, "groupMembers", memberDocId);
    const mSnap = await getDoc(memberRef);
    if (mSnap.exists() && mSnap.data().role === "owner") {
      throw new Error("Cannot remove the group owner");
    }

    await deleteDoc(memberRef);
  };

  const deleteGroup = async () => {
    if (myRole !== "owner") throw new Error("Only the group owner can delete this group.");

    const batch = writeBatch(db);

    // Delete group document
    batch.delete(doc(db, "groups", groupId));

    // Delete all groupMember records
    const membersSnap = await getDocs(
      query(collection(db, "groupMembers"), where("groupId", "==", groupId))
    );
    membersSnap.forEach((m) => batch.delete(m.ref));

    // Delete all reminders belonging to this group
    const remindersSnap = await getDocs(
      query(collection(db, "reminders"), where("groupId", "==", groupId))
    );
    remindersSnap.forEach((r) => batch.delete(r.ref));

    await batch.commit();
  };

  return {
    group,
    members,
    myRole,
    isLoading,
    updateGroup,
    inviteMember,
    changeMemberRole,
    removeMember,
    deleteGroup,
  };
}
