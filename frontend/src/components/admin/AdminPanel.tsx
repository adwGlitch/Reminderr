"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { getAdminStats, toggleUserStatus, deleteGroup } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import {
  Users as UsersIcon,
  FolderOpen,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Search,
  Trash2,
  UserCheck,
  UserX,
  RefreshCw,
  BarChart3,
} from "lucide-react";


export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"users" | "groups" | "reminders" | "analytics">("analytics");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch Stats helper
  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Setup real-time subscribers for lists
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const uList: any[] = [];
      snap.forEach((doc) => uList.push({ uid: doc.id, ...doc.data() }));
      setUsers(uList);
    });

    const unsubGroups = onSnapshot(collection(db, "groups"), (snap) => {
      const gList: any[] = [];
      snap.forEach((doc) => gList.push({ id: doc.id, ...doc.data() }));
      setGroups(gList);
    });

    const unsubReminders = onSnapshot(collection(db, "reminders"), (snap) => {
      const rList: any[] = [];
      snap.forEach((doc) => rList.push({ id: doc.id, ...doc.data() }));
      setReminders(rList);
    });

    return () => {
      unsubUsers();
      unsubGroups();
      unsubReminders();
    };
  }, []);

  const handleToggleUser = async (uid: string, currentDisabled: boolean) => {
    try {
      setActionLoading(uid);
      await toggleUserStatus(uid, !currentDisabled);
      await fetchStats();
    } catch (err: any) {
      alert(err.message || "Failed to update user.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm("Are you sure you want to delete this group? This will delete all members and reminders within it.")) {
      try {
        setActionLoading(groupId);
        await deleteGroup(groupId);
        await fetchStats();
      } catch (err: any) {
        alert(err.message || "Failed to delete group.");
      } finally {
        setActionLoading(null);
      }
    }
  };

  // Filter listings based on search query
  const filteredUsers = users.filter((u) =>
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((g) =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReminders = reminders.filter((r) =>
    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const analyticsItems = stats ? [
    { name: "Total Users", value: stats.totalUsers, icon: UsersIcon, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
    { name: "Active Users", value: stats.activeUsers, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
    { name: "Total Groups", value: stats.totalGroups, icon: FolderOpen, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
    { name: "Total Reminders", value: stats.totalReminders, icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { name: "Completed Tasks", value: stats.completedReminders, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { name: "Pending Tasks", value: stats.pendingReminders, icon: RefreshCw, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
    { name: "Overdue Reminders", value: stats.overdueReminders, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-border/80 text-sm overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-5 py-2.5 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "analytics" ? "border-primary text-primary font-bold" : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Analytics
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-5 py-2.5 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "users" ? "border-primary text-primary font-bold" : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <UsersIcon className="w-4 h-4" /> Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`px-5 py-2.5 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "groups" ? "border-primary text-primary font-bold" : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <FolderOpen className="w-4 h-4" /> Groups ({groups.length})
        </button>
        <button
          onClick={() => setActiveTab("reminders")}
          className={`px-5 py-2.5 font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "reminders" ? "border-primary text-primary font-bold" : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Calendar className="w-4 h-4" /> Reminders ({reminders.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-neutral-200 text-lg">System Metrics</h3>
              <Button onClick={fetchStats} isLoading={isLoadingStats} variant="secondary" className="text-xs h-8">
                Refresh
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {analyticsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className={`glass rounded-2xl p-4 border flex items-center justify-between gap-4 ${item.bg}`}>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{item.name}</p>
                      <h3 className={`text-2xl font-extrabold mt-1 ${item.color}`}>{item.value}</h3>
                    </div>
                    <div className="p-2 bg-neutral-950/40 rounded-xl border border-border/50">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab !== "analytics" && (
          <div className="space-y-6">
            {/* Search filter */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-neutral-950 pl-9 pr-4 py-2 text-sm text-neutral-100 placeholder-neutral-600 transition-all focus:border-primary focus:outline-none"
              />
            </div>

            {/* Users listing */}
            {activeTab === "users" && (
              <div className="glass border-border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-900/40 text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-border">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} className="hover:bg-neutral-900/10">
                        <td className="px-6 py-4 font-semibold text-neutral-200">{user.displayName || "User"}</td>
                        <td className="px-6 py-4 text-neutral-400">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            user.disabled
                              ? "bg-red-500/10 border-red-500/20 text-red-500"
                              : "bg-green-500/10 border-green-500/20 text-green-500"
                          }`}>
                            {user.disabled ? "Disabled" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant={user.disabled ? "primary" : "danger"}
                            onClick={() => handleToggleUser(user.uid, !!user.disabled)}
                            isLoading={actionLoading === user.uid}
                            className="text-xs h-8 px-3 rounded-lg"
                          >
                            {user.disabled ? <UserCheck className="w-3.5 h-3.5 mr-1" /> : <UserX className="w-3.5 h-3.5 mr-1" />}
                            {user.disabled ? "Enable" : "Disable"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Groups listing */}
            {activeTab === "groups" && (
              <div className="glass border-border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-900/40 text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Group Name</th>
                      <th className="px-6 py-4">Owner ID</th>
                      <th className="px-6 py-4">Created At</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredGroups.map((group) => (
                      <tr key={group.id} className="hover:bg-neutral-900/10">
                        <td className="px-6 py-4 font-semibold text-neutral-200">{group.name}</td>
                        <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{group.ownerId}</td>
                        <td className="px-6 py-4 text-neutral-400">{new Date(group.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteGroup(group.id)}
                            isLoading={actionLoading === group.id}
                            className="text-xs h-8 px-3 rounded-lg flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Reminders listing */}
            {activeTab === "reminders" && (
              <div className="glass border-border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-900/40 text-xs font-bold uppercase tracking-wider text-neutral-400 border-b border-border">
                    <tr>
                      <th className="px-6 py-4">Reminder</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredReminders.map((reminder) => (
                      <tr key={reminder.id} className="hover:bg-neutral-900/10">
                        <td className="px-6 py-4 font-semibold text-neutral-200">{reminder.title}</td>
                        <td className="px-6 py-4 text-neutral-400">{reminder.dueDate}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            reminder.status === "completed"
                              ? "bg-green-500/10 border-green-500/20 text-green-500"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          }`}>
                            {reminder.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-neutral-400 text-xs">
                          {reminder.groupId ? `Group ID: ${reminder.groupId}` : "Personal"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
