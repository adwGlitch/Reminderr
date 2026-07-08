"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/config";
import { loginSchema } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { z } from "zod";
import { motion } from "framer-motion";

type LoginFormValues = z.infer<typeof loginSchema>;

/** Maps Firebase Auth error codes to user-friendly messages. */
function getAuthErrorMessage(code: string): string {
  switch (code) {
    // Firebase SDK v10+ merges user-not-found + wrong-password into this code
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/invalid-email":
      return "The email address is not valid.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled. Please contact support.";
    default:
      return "Sign in failed. Please try again.";
  }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("[Login] Attempting sign in for:", values.email);

      // Step 1: Sign in with Firebase Client SDK
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      console.log("[Login] Firebase Auth sign in successful ✓", userCredential.user.uid);

      // Step 2: Get fresh ID token
      const idToken = await userCredential.user.getIdToken(true);
      console.log("[Login] ID token obtained ✓");

      // Step 3: Exchange ID token for server-side session cookie
      console.log("[Login] Posting ID token to /api/auth/session...");
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[Login] Session sync failed:", res.status, body);
        throw new Error("Failed to synchronize session. Please try again.");
      }

      console.log("[Login] Session synchronized ✓ — redirecting to", redirectPath);
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      console.error("[Login] Error:", err?.code, err?.message);

      // Firebase errors have an err.code; our thrown errors just have err.message
      const message = err?.code
        ? getAuthErrorMessage(err.code)
        : err?.message || "Sign in failed. Please try again.";

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
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-4xl font-heading tracking-tight bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent"
          >
            RemindSync
          </motion.h1>
          <p className="mt-2 text-sm text-neutral-400">
            Sign in to access your collaborative reminders
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-sm text-priority-high"
          >
            {error}
          </motion.div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:text-blue-400 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:text-blue-400 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
