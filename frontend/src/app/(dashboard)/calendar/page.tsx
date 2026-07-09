"use client";

import { useState } from "react";
import { useReminders } from "@/hooks/useReminders";
import { ReminderCard } from "@/components/reminders/ReminderCard";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { Reminder, Priority } from "@/types";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CalendarPage() {
  const { reminders, toggleReminderStatus, updateReminder, deleteReminder } = useReminders(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toISOString().split("T")[0]
  );
  
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Month navigation handlers
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Day of the week of first day (0-6)
    const firstDayIndex = firstDay.getDay();
    
    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Total days in previous month
    const totalPrevDays = new Date(year, month, 0).getDate();

    const daysArray = [];

    // Fill days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, totalPrevDays - i);
      daysArray.push({
        dateStr: prevDate.toISOString().split("T")[0],
        dayNum: totalPrevDays - i,
        isCurrentMonth: false,
      });
    }

    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i);
      daysArray.push({
        dateStr: currDate.toISOString().split("T")[0],
        dayNum: i,
        isCurrentMonth: true,
      });
    }

    // Fill next month days to complete grid (multiples of 7)
    const remainingDays = 42 - daysArray.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      daysArray.push({
        dateStr: nextDate.toISOString().split("T")[0],
        dayNum: i,
        isCurrentMonth: false,
      });
    }

    return daysArray;
  };

  const days = getDaysInMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Map reminders to date strings
  const remindersMap: Record<string, Reminder[]> = {};
  reminders.forEach((r) => {
    if (!remindersMap[r.dueDate]) {
      remindersMap[r.dueDate] = [];
    }
    remindersMap[r.dueDate].push(r);
  });

  const selectedDayReminders = selectedDate ? remindersMap[selectedDate] || [] : [];

  const priorityColors: Record<Priority, string> = {
    low: "bg-green-500",
    medium: "bg-amber-500",
    high: "bg-red-500",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Interactive Calendar</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Review personal and collaborative reminders in a month-based planner format.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass border-border p-6 rounded-2xl space-y-6">
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-200">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-neutral-800 rounded-lg border border-border text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-xs border border-border hover:bg-neutral-800 rounded-lg text-neutral-300 transition-all cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-neutral-800 rounded-lg border border-border text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-neutral-500 select-none uppercase tracking-wider">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const dayReminders = remindersMap[day.dateStr] || [];
              const isSelected = selectedDate === day.dateStr;
              const isToday = new Date().toISOString().split("T")[0] === day.dateStr;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`min-h-[72px] p-1.5 border rounded-xl flex flex-col justify-between transition-all cursor-pointer select-none ${
                    day.isCurrentMonth ? "bg-neutral-900/10" : "opacity-35"
                  } ${
                    isSelected
                      ? "border-primary bg-blue-950/10 shadow-inner"
                      : isToday
                      ? "border-blue-500/50 bg-neutral-900/60"
                      : "border-border/60 hover:bg-neutral-900/20"
                  }`}
                >
                  <span className={`text-xs font-bold self-end ${isToday ? "text-primary font-extrabold" : "text-neutral-400"}`}>
                    {day.dayNum}
                  </span>

                  {/* Priority dots mapping */}
                  <div className="flex flex-wrap gap-1 mt-1 justify-start">
                    {dayReminders.slice(0, 3).map((r) => (
                      <span
                        key={r.id}
                        className={`w-1.5 h-1.5 rounded-full ${priorityColors[r.priority]}`}
                        title={r.title}
                      />
                    ))}
                    {dayReminders.length > 3 && (
                      <span className="text-[8px] font-bold text-neutral-500 shrink-0 leading-none">
                        +{dayReminders.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Reminders Sidebar */}
        <div className="glass border-border p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-2 text-neutral-300 font-bold border-b border-border/85 pb-4">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h3>
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Select a date"}
            </h3>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {selectedDayReminders.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs">
                <Clock className="w-6 h-6 mx-auto mb-2 text-neutral-600" />
                No reminders due for this day.
              </div>
            ) : (
              selectedDayReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onToggleStatus={() => toggleReminderStatus(reminder.id!, reminder.status)}
                  onEdit={() => setEditingReminder(reminder)}
                  onDelete={() => deleteReminder(reminder.id!)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Editing Form Overlay */}
      <AnimatePresence>
        {editingReminder && (
          <ReminderForm
            title="Edit Reminder"
            initialValues={editingReminder}
            onSubmit={async (values) => {
              await updateReminder(editingReminder.id!, values);
              setEditingReminder(null);
            }}
            onClose={() => setEditingReminder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
