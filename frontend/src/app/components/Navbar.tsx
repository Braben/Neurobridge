// Navbar — app-wide navigation bar with role-aware links, notification bell
// dropdown, user info, and logout. Hidden on auth pages (login, register, OTP).
// The notification bell shows the live unread count from Redux (fed by the
// SocketManager's socket listener) and a dropdown with the 10 most recent
// notifications for quick scanning.
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { logoutUser } from "../store/slices/authSlice";
import { markAllRead } from "../store/slices/notificationSlice";
import { notificationsApi } from "../services/notifications";
import { useState, useRef, useEffect } from "react";

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

  const authPages = ["/login", "/register", "/verify-otp"];
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

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/children", label: "Children" },
    { href: "/messages", label: "Messages" },
    { href: "/notifications", label: "Notifications" },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-gray-900">
          Neurobridge
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-6 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop right section: bell, email, role, logout */}
        <div className="hidden items-center gap-3 sm:flex">
          {/* Notification bell with unread badge + dropdown */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
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
              <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <span className="text-sm font-semibold text-gray-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:text-blue-500">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <Link
                        key={n.id}
                        href="/notifications"
                        onClick={() => setBellOpen(false)}
                        className={`block border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50 ${
                          !n.isRead ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <p className={`text-sm ${!n.isRead ? "font-semibold" : ""} text-gray-900`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.body}</p>
                      </Link>
                    ))
                  )}
                </div>
                {notifications.length > 10 && (
                  <Link
                    href="/notifications"
                    onClick={() => setBellOpen(false)}
                    className="block border-t border-gray-100 px-4 py-2 text-center text-xs font-medium text-blue-600 hover:text-blue-500"
                  >
                    View all notifications
                  </Link>
                )}
              </div>
            )}
          </div>

          <span className="text-sm text-gray-500">{user.email}</span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {user.role}
          </span>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoggingOut ? "..." : "Logout"}
          </button>
        </div>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 sm:hidden"
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

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="border-t border-gray-200 px-4 py-3 sm:hidden">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`relative block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {link.label}
                {link.href === "/notifications" && unreadCount > 0 && (
                  <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="px-3 text-sm text-gray-500">{user.email}</p>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-2 w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
