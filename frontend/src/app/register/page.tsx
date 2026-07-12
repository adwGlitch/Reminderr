"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import { registerSchema } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { z } from "zod";
import { motion } from "framer-motion";

type RegisterFormValues = z.infer<typeof registerSchema>;

/** Maps Firebase Auth error codes to user-friendly messages during registration. */
function getRegisterErrorMessage(code: string): string {
  switch (code) {
    case "auth/configuration-not-found":
      return "Firebase Authentication is not enabled. Please enable it in the Firebase Console.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/invalid-email":
      return "The email address is not valid.";
    case "auth/weak-password":
      return "The password is too weak. Please use at least 8 characters.";
    case "auth/operation-not-allowed":
      return "Email/password registration is not enabled. Please contact support.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    default:
      return "Failed to create your account. Please try again.";
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      console.log("[Register] Starting registration for:", values.email);

      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;
      console.log("[Register] Firebase Auth user created ✓", user.uid);

      // Step 2: Create the Firestore profile document
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        displayName: values.name,
        email: values.email.toLowerCase(),
        avatarUrl: null,
        joinedDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        stats: {
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
        },
        disabled: false,
      });
      console.log("[Register] Firestore user document created ✓");

      // Step 3: Send email verification (non-blocking — don't fail registration if this fails)
      try {
        await sendEmailVerification(user);
        console.log("[Register] Verification email sent ✓");
      } catch (emailErr) {
        console.warn("[Register] Could not send verification email:", emailErr);
      }

      // Step 4: Get fresh ID token and create server-side session cookie.
      // We add a short delay here because Firebase Admin's verifyIdToken() can
      // reject tokens from brand-new accounts due to a ~1-2s propagation delay.
      // The retry logic inside createSession() handles this automatically.
      console.log("[Register] Obtaining ID token for session creation...");
      const idToken = await user.getIdToken(true);

      console.log("[Register] Posting ID token to /api/auth/session...");
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        let body: any = {};
        let rawText = "";
        try {
          rawText = await res.text();
          body = JSON.parse(rawText);
        } catch (e) {
          console.error("Failed to parse response as JSON. Raw text:", rawText);
        }
        console.error("[Register] Session sync failed:", res.status, body);
        throw new Error(body.error || `Failed to synchronize session cookie (HTTP ${res.status}): ${rawText.substring(0, 100)}`);
      }

      console.log("[Register] Session synchronized ✓ — redirecting to dashboard");
      setSuccess(
        "Account created successfully! A verification email has been sent to your inbox."
      );

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2500);
    } catch (err: any) {
      console.warn("[Register] Error:", err?.code, err?.message);

      const message = err?.code
        ? getRegisterErrorMessage(err.code)
        : err?.message || "Failed to create account. Please try again.";

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
            Create an enterprise-grade collaborative reminder account
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

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
            Sign Up
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-blue-400 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
