"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/config";
import { forgotPasswordSchema } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { z } from "zod";
import { motion } from "framer-motion";

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await sendPasswordResetEmail(auth, values.email);

      setSuccess(
        "If an account exists with that email, a password reset link has been sent."
      );
    } catch (err: any) {
      console.error("Password reset error:", err);
      let message = "Failed to send password reset email. Please try again.";
      if (err.code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (err.code === "auth/user-not-found") {
        // Obfuscate for security, but we'll show success anyway
        setSuccess(
          "If an account exists with that email, a password reset link has been sent."
        );
        return;
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 glass p-8 rounded-2xl shadow-2xl"
      >
        <div className="text-center">
          <h1 className="text-4xl font-heading tracking-tight bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent">
            RemindSync
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Reset your password
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-sm text-priority-high"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg bg-green-950/50 border border-green-500/30 p-3 text-sm text-priority-low"
          >
            {success}
          </motion.div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send Reset Link
          </Button>
        </form>

        <div className="text-center mt-4">
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:text-blue-400 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
