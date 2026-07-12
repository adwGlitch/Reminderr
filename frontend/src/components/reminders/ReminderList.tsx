"use client";

import { useState } from "react";
import { useReminders } from "@/hooks/useReminders";
import { ReminderCard } from "./ReminderCard";
import { ReminderForm } from "./ReminderForm";
import { Reminder } from "@/types";
import { Button } from "@/components/ui/Button";
import { Plus, Search, Filter, SortAsc, Calendar } from "lucide-react";
import { AnimatePresence } from "framer-motion";

interface ReminderListProps {
  groupId?: string | null;
  groupMembers?: { userId: string; displayName: string }[];
}

type FilterTab = "today" | "upcoming" | "completed" | "overdue";

export function ReminderList({ groupId = null, groupMembers = [] }: ReminderListProps) {
  const {
    reminders,
    isLoading,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderStatus,
  } = useReminders(groupId);

  const [activeTab, setActiveTab] = useState<FilterTab>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Quick add state
  const [quickTitle, setQuickTitle] = useState("");

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      const todayStr = new Date().toISOString().split("T")[0];
      await addReminder({
        title: quickTitle.trim(),
        description: "",
        dueDate: todayStr,
        dueTime: null,
        priority: "medium",
        status: "pending",
        recurrence: "none",
        groupId,
        assignedTo: null,
        visibilityRestriction: false,
      });
      setQuickTitle("");
    } catch (err) {
      console.error("Quick add failed:", err);
    }
  };

  const getFilteredReminders = () => {
    const today = new Date().toISOString().split("T")[0];
    
    return reminders.filter((r) => {
      // 1. Search Query Filter
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Priority Filter
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;

      // 3. Tab Filter (Status / Due Date)
      const isCompleted = r.status === "completed";
      
      // Overdue check
      const checkOverdue = () => {
        if (isCompleted) return false;
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

      const overdue = checkOverdue();

      if (activeTab === "completed") return isCompleted;
      if (activeTab === "overdue") return overdue;
      
      // If completed or overdue, hide from "today" and "upcoming" tabs
      if (isCompleted || overdue) return false;

      if (activeTab === "today") {
        return r.dueDate === today;
      }
      
      if (activeTab === "upcoming") {
        return r.dueDate > today;
      }

      return true;
    });
  };

  const filteredReminders = getFilteredReminders();

  // Sort logic (if not already sorted by due date in custom hook)
  const sortedReminders = [...filteredReminders].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    // Default is already sorted by date in useReminders hook
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-900/40 p-3 sm:p-4 rounded-2xl border border-border">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-neutral-950 pl-9 pr-4 py-2 text-sm text-neutral-100 placeholder-neutral-600 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-border bg-neutral-950 px-2 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <SortAsc className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-border bg-neutral-950 px-2 py-1.5 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="date">Sort by Date</option>
              <option value="priority">Sort by Priority</option>
            </select>
          </div>

          <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1.5 text-xs h-9">
            <Plus className="w-4 h-4" /> Add Reminder
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/80 text-sm overflow-x-auto select-none">
        {(["today", "upcoming", "overdue", "completed"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 font-medium border-b-2 capitalize transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? "border-primary text-primary font-bold"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Quick Add Bar (only visible on active tabs that allow additions e.g., today/upcoming) */}
      {(activeTab === "today" || activeTab === "upcoming") && (
        <form onSubmit={handleQuickAdd} className="relative flex gap-2 items-center bg-neutral-900/20 p-2 rounded-xl border border-border/60">
          <input
            type="text"
            placeholder="Quick add: title and press enter..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none"
          />
          <Button type="submit" variant="ghost" className="h-8 px-3 rounded-lg text-xs hover:bg-neutral-800 shrink-0 whitespace-nowrap">
            Add
          </Button>
        </form>
      )}

      {/* List Container */}
      <div className="space-y-3 min-h-[200px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-neutral-500 text-sm">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
            Syncing reminders...
          </div>
        ) : sortedReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-2xl text-neutral-500 text-center p-6">
            <Calendar className="w-8 h-8 text-neutral-600 mb-2" />
            <p className="font-semibold text-sm">No reminders found</p>
            <p className="text-xs text-neutral-600 mt-1">Get started by creating a reminder.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {sortedReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onToggleStatus={() => toggleReminderStatus(reminder.id!, reminder.status)}
                  onEdit={() => setEditingReminder(reminder)}
                  onDelete={() => deleteReminder(reminder.id!)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Full Form Modals */}
      <AnimatePresence>
        {isAddOpen && (
          <ReminderForm
            title="Create Reminder"
            onSubmit={async (values) => {
              await addReminder({ ...values, groupId });
              setIsAddOpen(false);
            }}
            onClose={() => setIsAddOpen(false)}
            groupMembers={groupMembers}
          />
        )}

        {editingReminder && (
          <ReminderForm
            title="Edit Reminder"
            initialValues={editingReminder}
            onSubmit={async (values) => {
              await updateReminder(editingReminder.id!, values);
              setEditingReminder(null);
            }}
            onClose={() => setEditingReminder(null)}
            groupMembers={groupMembers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
