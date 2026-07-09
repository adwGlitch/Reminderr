"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/firebase/config";
import { useAuthStore } from "@/store/useAuthStore";
import { profileSchema } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, User, Mail, Calendar, BarChart2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { motion } from "framer-motion";

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName,
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: values.displayName,
        avatarUrl: values.avatarUrl || null,
        updatedAt: new Date().toISOString(),
      });

      // Update local store
      setUser({
        ...user,
        displayName: values.displayName,
        avatarUrl: values.avatarUrl || null,
      });

      setSuccess("Profile updated successfully.");
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await fetch("/api/auth/session", { method: "DELETE" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-border bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-neutral-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight">Account Settings</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-neutral-800 border border-border flex items-center justify-center overflow-hidden mb-4">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-neutral-500" />
                )}
              </div>
              <h2 className="font-bold text-lg">{user.displayName}</h2>
              <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
              <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5" /> Joined{" "}
                {new Date(user.joinedDate).toLocaleDateString()}
              </p>
            </div>

            {/* Statistics */}
            <div className="glass p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-sm text-neutral-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" /> Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900/50 border border-border rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {user.stats?.total || 0}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">Total</div>
                </div>
                <div className="bg-neutral-900/50 border border-border rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {user.stats?.completed || 0}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">Completed</div>
                </div>
                <div className="bg-neutral-900/50 border border-border rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-amber-500">
                    {user.stats?.pending || 0}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">Pending</div>
                </div>
                <div className="bg-neutral-900/50 border border-border rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {user.stats?.overdue || 0}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">Overdue</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-2xl space-y-6"
            >
              <h3 className="font-bold text-lg">Edit Profile</h3>

              {success && (
                <div className="rounded-lg bg-green-950/50 border border-green-500/30 p-3 text-sm text-priority-low">
                  {success}
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-sm text-priority-high">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Display Name"
                  placeholder="John Doe"
                  error={errors.displayName?.message}
                  {...register("displayName")}
                />

                <Input
                  label="Avatar URL"
                  placeholder="https://example.com/avatar.jpg"
                  error={errors.avatarUrl?.message}
                  {...register("avatarUrl")}
                />

                <div className="pt-4 flex justify-end">
                  <Button type="submit" isLoading={isLoading}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
