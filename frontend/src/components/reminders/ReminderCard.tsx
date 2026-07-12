"use client";

import { Reminder } from "@/types";
import { Edit2, Trash2, Calendar, Clock, RefreshCw, EyeOff } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface ReminderCardProps {
  reminder: Reminder;
  onToggleStatus: () => Promise<void>;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function ReminderCard({
  reminder,
  onToggleStatus,
  onEdit,
  onDelete,
}: ReminderCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    try {
      setIsToggling(true);
      await onToggleStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      try {
        setIsDeleting(true);
        await onDelete();
      } catch (err) {
        console.error(err);
        setIsDeleting(false);
      }
    }
  };

  // Priority color/styling mapper
  const priorityInfo = {
    low: { bg: "bg-green-500/10 border-green-500/20 text-green-500", dot: "bg-green-500" },
    medium: { bg: "bg-amber-500/10 border-amber-500/20 text-amber-500", dot: "bg-amber-500" },
    high: { bg: "bg-red-500/10 border-red-500/20 text-red-500", dot: "bg-red-500" },
  };

  const isCompleted = reminder.status === "completed";

  // Check if reminder is overdue (due date is in the past, and status is pending)
  const isOverdue = () => {
    if (isCompleted) return false;
    const today = new Date().toISOString().split("T")[0];
    if (reminder.dueDate < today) return true;
    if (reminder.dueDate === today && reminder.dueTime) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const [dueHours, dueMinutes] = reminder.dueTime.split(":").map(Number);
      if (dueHours < currentHours || (dueHours === currentHours && dueMinutes < currentMinutes)) {
        return true;
      }
    }
    return false;
  };

  const overdue = isOverdue();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`glass rounded-xl p-3 sm:p-4 border transition-all hover:translate-y-[-2px] hover:shadow-lg ${
        isCompleted ? "border-border/40 opacity-60" : overdue ? "border-red-500/30 bg-red-950/5" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion Checkbox */}
        <button
          onClick={handleToggle}
          disabled={isToggling || isDeleting}
          className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
            isCompleted
              ? "bg-primary border-primary text-white"
              : overdue
              ? "border-red-500 hover:border-red-400 bg-red-950/20"
              : "border-neutral-600 hover:border-neutral-400"
          }`}
        >
          {isCompleted && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <h4
              className={`font-semibold text-sm leading-tight truncate ${
                isCompleted ? "line-through text-neutral-500" : "text-neutral-100"
              }`}
            >
              {reminder.title}
            </h4>

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                priorityInfo[reminder.priority].bg
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo[reminder.priority].dot}`} />
              {reminder.priority}
            </span>
          </div>

          {reminder.description && (
            <p className={`text-xs mt-1.5 leading-relaxed line-clamp-2 ${isCompleted ? "text-neutral-600" : "text-neutral-400"}`}>
              {reminder.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[11px] text-neutral-500">
            <span className={`flex items-center gap-1 ${overdue ? "text-red-400 font-medium animate-pulse" : ""}`}>
              <Calendar className="w-3.5 h-3.5" />
              {new Date(reminder.dueDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>

            {reminder.dueTime && (
              <span className={`flex items-center gap-1 ${overdue ? "text-red-400 font-medium animate-pulse" : ""}`}>
                <Clock className="w-3.5 h-3.5" />
                {reminder.dueTime}
              </span>
            )}

            {reminder.recurrence !== "none" && (
              <span className="flex items-center gap-1 text-primary">
                <RefreshCw className="w-3 h-3 animate-spin-slow" />
                {reminder.recurrence}
              </span>
            )}

            {reminder.visibilityRestriction && (
              <span className="flex items-center gap-1 text-amber-500" title="Private to assignee + admins">
                <EyeOff className="w-3 h-3" />
                restricted
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5 self-center">
          <button
            onClick={onEdit}
            disabled={isToggling || isDeleting}
            className="p-1 text-neutral-500 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isToggling || isDeleting}
            className="p-1 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
