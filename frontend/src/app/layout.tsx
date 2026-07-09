import type { Metadata } from "next";
import { Inter, Black_Ops_One } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const blackOpsOne = Black_Ops_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-black-ops-one",
});

export const metadata: Metadata = {
  title: "RemindSync | Enterprise Collaborative Reminder Platform",
  description: "Manage personal reminders and shared group tasks in real-time with enterprise-grade security, instant synchronization, and elegant calendar views.",
  keywords: ["reminders", "collaboration", "shared tasks", "calendar", "SaaS", "RemindSync"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${blackOpsOne.variable} h-full antialiased`}
      style={{ colorScheme: "dark light" }}
    >
      <body className="min-h-full flex flex-col font-sans bg-neutral-950 text-neutral-100">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

