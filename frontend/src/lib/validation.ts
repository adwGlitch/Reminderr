import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
});

export const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").trim(),
  avatarUrl: z.string().url("Please enter a valid URL").or(z.literal("")).nullable(),
});

export const reminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long").trim(),
  description: z.string().max(500, "Description is too long").trim().default(""),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)").nullable().or(z.literal("")),
  priority: z.enum(["low", "medium", "high"]),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]),
  assignedTo: z.string().nullable().optional(),
  visibilityRestriction: z.boolean().default(false),
});
