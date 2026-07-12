"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/firebase/config";
import {
  Bell,
  Menu,
  X,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Users,
  Settings,
  Shield,
  LogOut,
  User,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  usePushNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

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

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Calendar", href: "/calendar", icon: CalendarIcon },
    { name: "Groups", href: "/groups", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // If user is super admin, show admin link
  if (user?.superAdmin) {
    navItems.push({ name: "Admin Panel", href: "/admin", icon: Shield });
  }

  // Active check helper
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Loading session...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="group hidden md:flex flex-col w-16 hover:w-64 border-r border-border bg-neutral-900/50 backdrop-blur-md transition-[width] duration-300 ease-in-out z-30 flex-shrink-0 overflow-hidden">
        <div className="h-16 flex items-center px-4 border-b border-border overflow-hidden flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold font-heading text-xs">RS</span>
            </div>
            <span className="font-heading text-xl tracking-tight bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              RemindSync
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all-fast relative group/item ${
                  active
                    ? "bg-neutral-800 text-white font-semibold"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
                title={item.name}
              >
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 ml-0.5 ${active ? "text-primary" : "text-neutral-400 group-hover/item:text-white"}`} />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-3 border-t border-border flex items-center justify-between overflow-hidden flex-shrink-0">
          <Link href="/settings" className="flex items-center gap-3 group/profile">
            <div className="w-9 h-9 rounded-full bg-neutral-800 border border-border flex items-center justify-center overflow-hidden flex-shrink-0 ml-0.5">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-neutral-500" />
              )}
            </div>
            <div className="max-w-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <p className="text-xs font-semibold text-neutral-200 truncate group-hover/profile:text-white transition-colors">
                {user.displayName}
              </p>
              <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer opacity-0 group-hover:opacity-100 flex-shrink-0 mr-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-border bg-neutral-900/50 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 relative z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 md:hidden hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block text-sm text-neutral-400 font-medium">
              Welcome back, <span className="text-neutral-200 font-bold">{user.displayName}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-priority-high rounded-full ring-2 ring-neutral-950 animate-pulse" />
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="fixed sm:absolute top-[60px] right-4 sm:top-auto sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-neutral-900 rounded-xl shadow-2xl z-50 py-2 border border-border"
                    >
                      <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                        <span className="font-bold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary hover:underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-neutral-500">No new notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markAsRead(n.id!)}
                              className={`px-4 py-3 border-b border-border/50 text-xs hover:bg-neutral-900 transition-colors cursor-pointer ${
                                !n.read ? "bg-blue-950/20 font-semibold text-neutral-100" : "text-neutral-400"
                              }`}
                            >
                              <p className="text-neutral-200">{n.title}</p>
                              <p className="mt-0.5 text-[10px] leading-relaxed">{n.body}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Menu Dropdown (Mobile) */}
            <div className="md:hidden relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-8 h-8 rounded-full bg-neutral-800 border border-border flex items-center justify-center overflow-hidden"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-neutral-500" />
                )}
              </button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-neutral-900 rounded-xl shadow-2xl z-50 py-1 border border-border"
                    >
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300 text-left"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Scrollable Children container */}
        <main className="flex-1 overflow-y-auto focus:outline-none relative">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-neutral-900 border-r border-border z-50 flex flex-col md:hidden"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                <span className="font-heading text-xl tracking-tight bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 bg-clip-text text-transparent">
                  RemindSync
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active ? "bg-neutral-800 text-white font-semibold" : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-neutral-400"}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-800 border border-border flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-neutral-500" />
                    )}
                  </div>
                  <div className="max-w-[120px]">
                    <p className="text-xs font-semibold text-neutral-200 truncate">{user.displayName}</p>
                    <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
