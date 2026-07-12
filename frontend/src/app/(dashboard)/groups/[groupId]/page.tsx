"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useGroupDetails } from "@/hooks/useGroupDetails";
import { ReminderList } from "@/components/reminders/ReminderList";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Users,
  Settings as SettingsIcon,
  CheckSquare,
  Plus,
  ArrowLeft,
  Crown,
  Trash2,
  X,
  UserMinus,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GroupRole } from "@/types";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default function GroupDetailPage({ params }: PageProps) {
  const { groupId } = use(params);
  const router = useRouter();
  const {
    group,
    members,
    myRole,
    isLoading,
    updateGroup,
    inviteMember,
    changeMemberRole,
    removeMember,
    deleteGroup,
  } = useGroupDetails(groupId);

  const [activeTab, setActiveTab] = useState<"reminders" | "members" | "settings">("reminders");
  
  // Invite Member State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Group Details Editing State (Owner/Admin)
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setIsInviting(true);
      await inviteMember(inviteEmail.trim());
      setInviteSuccess(true);
      setInviteEmail("");
      setTimeout(() => {
        setInviteSuccess(false);
        setIsInviteOpen(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      setIsSavingDetails(true);
      await updateGroup(editName.trim(), editDesc.trim());
      alert("Group details updated successfully.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update group.");
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Setup initial edit values once group loads
  const startEditing = () => {
    if (group) {
      setEditName(group.name);
      setEditDesc(group.description);
    }
  };

  const isOwner = myRole === "owner";
  const isAdminOrOwner = myRole === "owner" || myRole === "admin";

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Syncing workspace...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold">Group not found</h2>
        <p className="text-sm text-neutral-400 mt-2">
          This group may have been deleted, or you might not have access.
        </p>
        <Link href="/groups" className="mt-4 inline-flex text-primary hover:underline text-sm gap-2 items-center justify-center">
          <ArrowLeft className="w-4 h-4" /> Back to groups
        </Link>
      </div>
    );
  }

  // Pre-formatted list of members for assignment options
  const formattedMembers = members
    .filter((m) => m.userProfile)
    .map((m) => ({
      userId: m.userId,
      displayName: m.userProfile!.displayName,
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-start border-b border-border/60 pb-6">
        <div className="space-y-2">
          <Link href="/groups" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to groups
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{group.name}</h1>
          {group.description && <p className="text-sm text-neutral-400 max-w-2xl">{group.description}</p>}
        </div>

        <div className="flex items-center gap-2">
          {isAdminOrOwner && (
            <Button onClick={() => setIsInviteOpen(true)} className="flex items-center gap-1.5 text-xs h-9">
              <Plus className="w-4 h-4" /> Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border/80 text-sm overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab("reminders")}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "reminders"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Reminders
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "members"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Users className="w-4 h-4" /> Members ({members.length})
        </button>
        {isAdminOrOwner && (
          <button
            onClick={() => {
              setActiveTab("settings");
              startEditing();
            }}
            className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "settings"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <SettingsIcon className="w-4 h-4" /> Group Settings
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === "reminders" && (
          <ReminderList groupId={groupId} groupMembers={formattedMembers} />
        )}

        {activeTab === "members" && (
          <div className="glass border-border rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-neutral-900/40 text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-border">
                <tr>
                  <th className="px-3 py-3 sm:px-6 sm:py-4">Member</th>
                  <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">Email</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4">Role</th>
                  {isAdminOrOwner && <th className="px-3 py-3 sm:px-6 sm:py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-900/10">
                    <td className="px-3 py-3 sm:px-6 sm:py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-border flex items-center justify-center overflow-hidden">
                        {member.userProfile?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.userProfile.avatarUrl}
                            alt={member.userProfile.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-4 h-4 text-neutral-500" />
                        )}
                      </div>
                      <span className="font-semibold text-neutral-200">
                        {member.userProfile?.displayName || "Loading..."}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4 text-neutral-400">{member.userProfile?.email}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      {isOwner && member.userId !== group.ownerId ? (
                        <select
                          value={member.role}
                          onChange={async (e) => {
                            try {
                              await changeMemberRole(member.userId, e.target.value as GroupRole);
                            } catch (err: any) {
                              alert(err.message || "Failed to update role");
                            }
                          }}
                          className="rounded-lg border border-border bg-neutral-950 px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs">
                          {member.role === "owner" && <Crown className="w-3.5 h-3.5 text-blue-500" />}
                          {member.role === "admin" && <Briefcase className="w-3.5 h-3.5 text-purple-500" />}
                          <span className="capitalize">{member.role}</span>
                        </span>
                      )}
                    </td>
                    {isAdminOrOwner && (
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-right">
                        {member.userId !== group.ownerId && (
                          <button
                            onClick={async () => {
                              if (confirm("Remove this member from the group?")) {
                                try {
                                  await removeMember(member.userId);
                                } catch (err: any) {
                                  alert(err.message || "Failed to remove member");
                                }
                              }
                            }}
                            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                            title="Remove Member"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "settings" && isAdminOrOwner && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 glass border-border p-6 rounded-2xl space-y-6">
              <h3 className="font-bold text-lg">Group Settings</h3>
              <form onSubmit={handleSaveDetails} className="space-y-4">
                <Input
                  label="Group Name"
                  placeholder="Group name..."
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-400">Description</label>
                  <textarea
                    placeholder="Describe group activities..."
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" isLoading={isSavingDetails}>
                    Save Details
                  </Button>
                </div>
              </form>
            </div>

            {isOwner && (
              <div className="glass border-red-500/20 bg-red-950/5 p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-lg text-priority-high flex items-center gap-1.5">
                  <Trash2 className="w-5 h-5" /> Danger Zone
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Deleting this group is permanent and will delete all group reminders, member assignments, and settings.
                </p>
                <Button
                  variant="danger"
                  className="w-full text-xs"
                  onClick={async () => {
                    if (confirm("Are you sure? This will permanently delete the group and all its reminders. This cannot be undone.")) {
                      try {
                        await deleteGroup(groupId);
                        router.push("/groups");
                      } catch (err: any) {
                        alert(err.message || "Failed to delete group.");
                      }
                    }
                  }}
                >
                  Delete Group
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {isInviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={() => setIsInviteOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass rounded-2xl p-6 z-10 border border-border"
            >
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="font-bold text-lg">Invite Member</h3>
                <button onClick={() => setIsInviteOpen(false)} className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {inviteSuccess ? (
                <div className="py-8 text-center text-sm text-green-500 font-semibold">
                  Invitation sent successfully!
                </div>
              ) : (
                <form onSubmit={handleInvite} className="mt-4 space-y-4">
                  <Input
                    label="User Email Address"
                    type="email"
                    placeholder="name@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                    <Button type="button" variant="secondary" onClick={() => setIsInviteOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isInviting}>
                      Send Invite
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
