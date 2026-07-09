"use client";

import { useState } from "react";
import { useGroups } from "@/hooks/useGroups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Users, Mail, ArrowRight, X, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function GroupsPage() {
  const {
    groups,
    memberships,
    invitations,
    isLoading,
    createGroup,
    acceptInvitation,
    declineInvitation,
  } = useGroups();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      setIsSubmitting(true);
      await createGroup(newGroupName.trim(), newGroupDesc.trim());
      setNewGroupName("");
      setNewGroupDesc("");
      setIsCreateOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Roles map for label display
  const roleLabels = {
    owner: { text: "Owner", styles: "bg-blue-500/10 border-blue-500/20 text-blue-500" },
    admin: { text: "Admin", styles: "bg-purple-500/10 border-purple-500/20 text-purple-500" },
    member: { text: "Member", styles: "bg-neutral-500/10 border-neutral-500/20 text-neutral-400" },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Collaborative Groups</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Create groups, invite team members, and manage shared reminders.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Create Group
        </Button>
      </div>

      {/* Invitations Alert Drawer */}
      <AnimatePresence>
        {invitations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-pulse" /> Pending Invitations ({invitations.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invitations.map((invite) => (
                <motion.div
                  key={invite.id}
                  layout
                  className="glass border-amber-500/35 bg-amber-500/5 rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="font-bold text-sm text-neutral-100">{invite.groupName}</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Invited by <span className="text-neutral-300 font-semibold">{invite.invitedByName}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => declineInvitation(invite.id!)}
                      className="text-neutral-400 hover:text-red-400 h-8 px-3 rounded-lg text-xs"
                    >
                      Decline
                    </Button>
                    <Button
                      onClick={() => acceptInvitation(invite.id!, invite.groupId)}
                      className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold h-8 px-3 rounded-lg text-xs"
                    >
                      Accept
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Groups List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">My Groups</h3>
        
        {isLoading ? (
          <div className="flex items-center h-48 text-neutral-500 text-sm">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
            Loading groups...
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-2xl text-neutral-500 text-center p-6">
            <Users className="w-8 h-8 text-neutral-600 mb-2" />
            <p className="font-semibold text-sm">No groups joined</p>
            <p className="text-xs text-neutral-600 mt-1">Get started by creating a group or accepting an invite.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => {
              const membership = memberships.find((m) => m.groupId === group.id);
              const roleInfo = membership ? roleLabels[membership.role] : roleLabels.member;
              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="glass border-border hover:border-primary/45 rounded-2xl p-5 block transition-all hover:translate-y-[-2px] group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-bold text-neutral-100 group-hover:text-primary transition-colors">
                      {group.name}
                    </h4>
                    {membership && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${roleInfo.styles}`}>
                        {roleInfo.text}
                      </span>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>
                  )}
                  <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-neutral-500">
                    <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                      Open Space <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass rounded-2xl p-6 z-10 border border-border"
            >
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="font-bold text-lg">Create Group</h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
                <Input
                  label="Group Name *"
                  placeholder="e.g., Marketing Team"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-400">Description</label>
                  <textarea
                    placeholder="Describe group activities..."
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                  <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    Create
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
