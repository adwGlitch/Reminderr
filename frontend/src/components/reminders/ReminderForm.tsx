"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reminderSchema } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Reminder } from "@/types";
import { z } from "zod";
import { X } from "lucide-react";

type ReminderFormValues = z.input<typeof reminderSchema>;

interface ReminderFormProps {
  initialValues?: Partial<Reminder>;
  onSubmit: (values: any) => Promise<void>;
  onClose: () => void;
  title: string;
  groupMembers?: { userId: string; displayName: string }[]; // Available if group context
}

export function ReminderForm({
  initialValues,
  onSubmit,
  onClose,
  title,
  groupMembers = [],
}: ReminderFormProps) {
  // Format dates for input (YYYY-MM-DD)
  const getTodayString = () => new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: initialValues?.title || "",
      description: initialValues?.description || "",
      dueDate: initialValues?.dueDate || getTodayString(),
      dueTime: initialValues?.dueTime || "",
      priority: initialValues?.priority || "medium",
      recurrence: initialValues?.recurrence || "none",
      assignedTo: initialValues?.assignedTo || "",
      visibilityRestriction: initialValues?.visibilityRestriction || false,
    },
  });

  const handleFormSubmit = async (values: ReminderFormValues) => {
    // If dueTime is blank, normalize it to null
    const normalizedValues = {
      ...values,
      dueTime: values.dueTime === "" ? null : values.dueTime,
      assignedTo: values.assignedTo === "" ? null : values.assignedTo,
    };
    await onSubmit(normalizedValues);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg glass rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] z-10 border border-border">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input
            label="Title *"
            placeholder="Buy groceries..."
            error={errors.title?.message}
            {...register("title")}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-400 select-none">
              Description
            </label>
            <textarea
              placeholder="Add details..."
              rows={3}
              className="w-full rounded-lg border border-border bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              {...register("description")}
            />
            {errors.description?.message && (
              <span className="text-xs text-priority-high">{errors.description.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date *"
              type="date"
              error={errors.dueDate?.message}
              {...register("dueDate")}
            />

            <Input
              label="Due Time"
              type="time"
              error={errors.dueTime?.message}
              {...register("dueTime")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-400 select-none">
                Priority
              </label>
              <select
                className="w-full rounded-lg border border-border bg-neutral-950 px-3 py-2 text-sm text-neutral-100 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                {...register("priority")}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-400 select-none">
                Recurrence
              </label>
              <select
                className="w-full rounded-lg border border-border bg-neutral-950 px-3 py-2 text-sm text-neutral-100 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                {...register("recurrence")}
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Group member assignment (Only visible if members are loaded, i.e. group context) */}
          {groupMembers.length > 0 && (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-400 select-none">
                  Assign To Member
                </label>
                <select
                  className="w-full rounded-lg border border-border bg-neutral-950 px-3 py-2 text-sm text-neutral-100 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  {...register("assignedTo")}
                >
                  <option value="">Unassigned</option>
                  {groupMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="visibilityRestriction"
                  className="rounded border-border bg-neutral-950 text-primary focus:ring-primary"
                  {...register("visibilityRestriction")}
                />
                <label
                  htmlFor="visibilityRestriction"
                  className="text-xs text-neutral-400 select-none"
                >
                  Restrict visibility to assignee & group admins only
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
