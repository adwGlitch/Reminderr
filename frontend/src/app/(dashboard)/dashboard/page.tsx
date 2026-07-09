"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useReminders } from "@/hooks/useReminders";
import { ReminderList } from "@/components/reminders/ReminderList";
import { CheckSquare, Clock, AlertTriangle, CalendarDays, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { reminders, isLoading } = useReminders(null); // Personal reminders (groupId is null)

  const getStats = () => {
    const today = new Date().toISOString().split("T")[0];
    
    let pending = 0;
    let completed = 0;
    let overdue = 0;
    let todayCount = 0;

    reminders.forEach((r) => {
      const isCompleted = r.status === "completed";
      if (isCompleted) {
        completed++;
      } else {
        pending++;
        
        // Overdue check
        const isOverdue = () => {
          if (r.dueDate < today) return true;
          if (r.dueDate === today && r.dueTime) {
            const now = new Date();
            const currentHours = now.getHours();
            const currentMinutes = now.getMinutes();
            const [dueHours, dueMinutes] = r.dueTime.split(":").map(Number);
            if (dueHours < currentHours || (dueHours === currentHours && dueMinutes < currentMinutes)) {
              return true;
            }
          }
          return false;
        };

        if (isOverdue()) {
          overdue++;
        }
      }

      if (r.dueDate === today && !isCompleted) {
        todayCount++;
      }
    });

    return { total: reminders.length, pending, completed, overdue, today: todayCount };
  };

  const stats = getStats();

  const statItems = [
    {
      name: "Total Reminders",
      value: stats.total,
      icon: CalendarDays,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      name: "Pending Tasks",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      name: "Completed",
      value: stats.completed,
      icon: CheckSquare,
      color: "text-green-500",
      bg: "bg-green-500/10 border-green-500/20",
    },
    {
      name: "Overdue Reminders",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10 border-red-500/20",
      animate: stats.overdue > 0 ? "animate-pulse" : "",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Personal Workspace</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Manage your personal reminders and keep track of your schedule.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={item.name}
              className={`glass rounded-2xl p-4 border flex items-center justify-between gap-4 ${item.bg}`}
            >
              <div>
                <p className="text-xs font-semibold text-neutral-400 select-none uppercase tracking-wider">
                  {item.name}
                </p>
                <h3 className={`text-2xl font-bold mt-1 ${item.color} ${item.animate || ""}`}>
                  {isLoading ? "..." : item.value}
                </h3>
              </div>
              <div className={`p-2 bg-neutral-950/40 rounded-xl border border-border/55`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Pane */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Left Col: Lists */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl border border-border">
            <h2 className="text-lg font-bold mb-4">My Reminders</h2>
            <ReminderList />
          </div>
        </div>

        {/* Right Col: Quick Widgets */}
        <div className="space-y-6">
          {/* Motivation Widget */}
          <div className="glass p-6 rounded-2xl border border-border flex gap-4 items-start bg-gradient-to-br from-neutral-900/60 to-neutral-950">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-primary">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Task Progress</h3>
              <p className="text-xs text-neutral-400 mt-1">
                {stats.total > 0
                  ? `You have completed ${Math.round((stats.completed / stats.total) * 100)}% of your tasks.`
                  : "Create some reminders to start tracking your daily progress."}
              </p>
            </div>
          </div>

          {/* Today Summary Widget */}
          <div className="glass p-6 rounded-2xl border border-border space-y-4">
            <h3 className="font-bold text-sm text-neutral-300">Today&apos;s Focus</h3>
            <div className="space-y-2.5">
              {isLoading ? (
                <p className="text-xs text-neutral-500">Checking tasks...</p>
              ) : stats.today === 0 ? (
                <p className="text-xs text-neutral-500">No pending reminders due today.</p>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>You have {stats.today} reminders due today! Keep going!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
