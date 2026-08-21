// Navbar — app-wide navigation bar with role-aware links, notification bell
// dropdown, user info, and logout. Hidden on auth pages (login, register, OTP).
// The notification bell shows the live unread count from Redux (fed by the
// SocketManager's socket listener) and a dropdown with the 10 most recent
// notifications for quick scanning.
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { logoutUser } from "../store/slices/authSlice";
import { markAllRead } from "../store/slices/notificationSlice";
import { notificationsApi } from "../services/notifications";
import { useState, useRef, useEffect } from "react";
import AppButton from "./ui/AppButton";
import BrandLogo from "./ui/BrandLogo";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { notifications, unreadCount } = useAppSelector((state) => state.notification);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Must be before the early return so hook order is consistent on every render
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const authPages = ["/", "/login", "/register", "/register/admin", "/verify-otp", "/forgot-password"];
  if (!isAuthenticated || !user || authPages.includes(pathname)) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await dispatch(logoutUser());
    router.push("/login");
  };

  /** Marks all notifications read via API, then optimistically updates Redux. */
  const handleMarkAllRead = async () => {
    await notificationsApi.markAllAsRead();
    dispatch(markAllRead());
  };

  return (
    <nav className="border-b border-[#d7e6f2] bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/dashboard" aria-label="Neuro Bridge Africa dashboard">
          <BrandLogo compact className="w-36 sm:w-44" />
        </Link>

        <div className="hidden items-center gap-7 text-base font-semibold text-[#073f63] lg:flex">
          <Link className={pathname === "/dashboard" ? "underline decoration-2 underline-offset-4" : "hover:text-[#0078d4]"} href="/dashboard">
            Overview
          </Link>
          <Link className="hover:text-[#0078d4]" href="/about">
            About Us
          </Link>
          <Link className="hover:text-[#0078d4]" href="/resources">
            Our Services
          </Link>
          <Link className="hover:text-[#0078d4]" href="/messages">
            Contact Us
          </Link>
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen(!bellOpen)}
              aria-label="Open notifications"
              className="relative rounded-full p-2 text-[#073f63] hover:bg-[#eaf6fb]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Bell dropdown — shows up to 10 recent notifications */}
            {bellOpen && (
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-md border border-[#d7e6f2] bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-[#edf4f8] px-4 py-3">
                  <span className="text-sm font-semibold text-[#111827]">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-semibold text-[#0078d4] hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-[#536471]">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <Link
                        key={n.id}
                        href="/notifications"
                        onClick={() => setBellOpen(false)}
                        className={`block border-b border-[#edf4f8] px-4 py-3 transition-colors hover:bg-[#f6fbfd] ${
                          !n.isRead ? "bg-[#eaf6fb]" : ""
                        }`}
                      >
                        <p className={`text-sm ${!n.isRead ? "font-semibold" : ""} text-[#111827]`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-[#536471]">{n.body}</p>
                      </Link>
                    ))
                  )}
                </div>
                {notifications.length > 10 && (
                  <Link
                    href="/notifications"
                    onClick={() => setBellOpen(false)}
                    className="block border-t border-[#edf4f8] px-4 py-2 text-center text-xs font-semibold text-[#0078d4] hover:underline"
                  >
                    View all notifications
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Image
              src={user.avatar || "/design-assets/child-portrait.jpg"}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
            />
            <div className="hidden xl:block">
              <p className="text-sm font-semibold text-[#111827]">
                Welcome, {user.firstName || "User"}
              </p>
              <p className="text-xs text-[#536471]">{user.role}</p>
            </div>
          </div>
          <AppButton onClick={handleLogout} disabled={isLoggingOut} variant="ghost" size="sm">
            {isLoggingOut ? "..." : "Logout"}
          </AppButton>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
          className="rounded-md bg-[#d9edf8] p-2 text-[#073f63] hover:bg-[#c7e4f4] sm:hidden"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[#d7e6f2] px-4 py-4 sm:hidden">
          <p className="text-sm font-semibold text-[#111827]">{user.email}</p>
          <AppButton onClick={handleLogout} disabled={isLoggingOut} className="mt-3" fullWidth variant="danger">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </AppButton>
        </div>
      )}
    </nav>
  );
}
