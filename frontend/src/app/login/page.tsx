"use client";

import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
          Loading workspace...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
