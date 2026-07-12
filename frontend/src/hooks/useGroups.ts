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
  getDocs,
  doc,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuthStore } from "@/store/useAuthStore";
import { Group, GroupMember, GroupInvitation } from "@/types";

export function useGroups() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<GroupMember[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to memberships and groups
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setMemberships([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 1. Listen to memberships where userId == user.uid
    const qMemberships = query(
      collection(db, "groupMembers"),
      where("userId", "==", user.uid)
    );

    const unsubscribeMemberships = onSnapshot(
      qMemberships,
      async (snapshot) => {
        const membershipList: GroupMember[] = [];
        const groupPromises: Promise<Group | null>[] = [];

        snapshot.forEach((memberDoc) => {
          const mData = memberDoc.data();
          const membership: GroupMember = {
            id: memberDoc.id,
            groupId: mData.groupId,
            userId: mData.userId,
            role: mData.role,
            joinedAt: mData.joinedAt,
          };
          membershipList.push(membership);

          // Queue group fetch
          const groupRef = doc(db, "groups", mData.groupId);
          const getGroupPromise = getDoc(groupRef).then((gSnap) => {
            if (gSnap.exists()) {
              return { id: gSnap.id, ...gSnap.data() } as Group;
            }
            return null;
          });
          groupPromises.push(getGroupPromise);
        });

        const fetchedGroups = (await Promise.all(groupPromises)).filter(
          (g) => g !== null
        ) as Group[];

        setMemberships(membershipList);
        setGroups(fetchedGroups);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching memberships:", error);
        setIsLoading(false);
      }
    );

    // 2. Listen to pending invitations matching user email
    const qInvitations = query(
      collection(db, "invitations"),
      where("email", "==", user.email || ""),
      where("status", "==", "pending")
    );

    const unsubscribeInvitations = onSnapshot(
      qInvitations,
      (snapshot) => {
        const inviteList: GroupInvitation[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          inviteList.push({
            id: doc.id,
            groupId: data.groupId,
            groupName: data.groupName || "Shared Group",
            email: data.email,
            invitedBy: data.invitedBy,
            invitedByName: data.invitedByName || "Someone",
            status: data.status,
            createdAt: data.createdAt,
          });
        });
        setInvitations(inviteList);
      },
      (error) => {
        console.error("Error fetching invitations:", error);
      }
    );

    return () => {
      unsubscribeMemberships();
      unsubscribeInvitations();
    };
  }, [user]);

  // Create group as owner
  const createGroup = async (name: string, description: string) => {
    if (!user) throw new Error("Unauthenticated");

    const batch = writeBatch(db);

    // 1. Create group document
    const groupRef = doc(collection(db, "groups"));
    const groupData = {
      name,
      description,
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    batch.set(groupRef, groupData);

    // 2. Create groupMember owner relationship
    // Doc ID is groupId_userId
    const memberRef = doc(db, "groupMembers", `${groupRef.id}_${user.uid}`);
    const memberData = {
      groupId: groupRef.id,
      userId: user.uid,
      role: "owner",
      joinedAt: new Date().toISOString(),
    };
    batch.set(memberRef, memberData);

    await batch.commit();
    return groupRef.id;
  };

  // Invite user to group (adds to invitations collection)
  const inviteUser = async (groupId: string, groupName: string, inviteeEmail: string) => {
    if (!user) throw new Error("Unauthenticated");

    const inviteData = {
      groupId,
      groupName,
      email: inviteeEmail.trim().toLowerCase(),
      invitedBy: user.uid,
      invitedByName: user.displayName,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    return await addDoc(collection(db, "invitations"), inviteData);
  };

  // Accept group invitation
  const acceptInvitation = async (inviteId: string, groupId: string) => {
    if (!user) throw new Error("Unauthenticated");

    const batch = writeBatch(db);

    // 1. Update invitation status to accepted
    const inviteRef = doc(db, "invitations", inviteId);
    batch.update(inviteRef, { status: "accepted" });

    // 2. Add member to groupMembers
    const memberRef = doc(db, "groupMembers", `${groupId}_${user.uid}`);
    const memberData = {
      groupId,
      userId: user.uid,
      role: "member",
      joinedAt: new Date().toISOString(),
    };
    batch.set(memberRef, memberData);

    await batch.commit();
  };

  // Decline group invitation
  const declineInvitation = async (inviteId: string) => {
    const inviteRef = doc(db, "invitations", inviteId);
    await updateDoc(inviteRef, { status: "declined" });
  };

  // Leave group
  const leaveGroup = async (groupId: string) => {
    if (!user) throw new Error("Unauthenticated");

    const memberDocId = `${groupId}_${user.uid}`;
    const memberRef = doc(db, "groupMembers", memberDocId);
    
    // Check role first
    const mSnap = await getDoc(memberRef);
    if (mSnap.exists() && mSnap.data().role === "owner") {
      throw new Error("Group owner cannot leave group. Transfer ownership or delete the group instead.");
    }

    await deleteDoc(memberRef);
  };

  // Delete group (Owner only)
  const deleteGroup = async (groupId: string) => {
    if (!user) throw new Error("Unauthenticated");

    const batch = writeBatch(db);

    // 1. Mark group document for deletion
    const groupRef = doc(db, "groups", groupId);
    batch.delete(groupRef);

    // 2. Query and delete all groupMember records for this group
    const membersSnap = await getDocs(
      query(collection(db, "groupMembers"), where("groupId", "==", groupId))
    );
    membersSnap.forEach((memberDoc) => batch.delete(memberDoc.ref));

    // 3. Query and delete all reminders belonging to this group
    const remindersSnap = await getDocs(
      query(collection(db, "reminders"), where("groupId", "==", groupId))
    );
    remindersSnap.forEach((reminderDoc) => batch.delete(reminderDoc.ref));

    await batch.commit();
  };

  return {
    groups,
    memberships,
    invitations,
    isLoading,
    createGroup,
    inviteUser,
    acceptInvitation,
    declineInvitation,
    leaveGroup,
    deleteGroup,
  };
}
