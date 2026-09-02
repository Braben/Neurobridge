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
import { BellIcon, CediIcon, ChevronDownIcon, MenuIcon, MessageCircleIcon, PlusIcon, TableIcon, XIcon } from "./ui/Icons";

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
  const menuRef = useRef<HTMLDivElement>(null);

  // Must be before the early return so hook order is consistent on every render
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const authPages = ["/", "/login", "/register", "/register/admin", "/verify-otp", "/forgot-password"];
  if (!isAuthenticated || !user || authPages.includes(pathname)) return null;
  if ((pathname === "/dashboard" && user.role !== "ADMIN") || pathname.startsWith("/children/add")) return null;

  const messagesPath = user.role === "ADMIN" ? "/admin/messages" : "/messages";
  const notificationsPath = user.role === "ADMIN" ? "/admin/notifications" : "/notifications";

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

  const notificationButton = (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setBellOpen(!bellOpen)}
        aria-label="Open notifications"
        className="relative rounded-full p-2 text-[#073f63] hover:bg-[#eaf6fb]"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

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
                  href={notificationsPath}
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
              href={notificationsPath}
              onClick={() => setBellOpen(false)}
              className="block border-t border-[#edf4f8] px-4 py-2 text-center text-xs font-semibold text-[#0078d4] hover:underline"
            >
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );

  if (user.role === "ADMIN") {
    const navLinks = [
      { href: "/dashboard", label: "Overview", active: pathname === "/dashboard" },
      { href: "/about", label: "About Us", active: pathname === "/about" },
      { href: "/admin/content", label: "Our Services", active: pathname.startsWith("/admin/content") },
      { href: messagesPath, label: "Contact Us", active: pathname.startsWith(messagesPath) },
    ];

    return (
      <nav className="border-b border-[#9dc7df] bg-white">
        <div className="mx-auto flex min-h-[104px] max-w-[1500px] flex-col justify-center gap-4 px-4 py-4 sm:px-8 lg:px-14">
          <div className="flex items-start justify-between gap-4">
            <Link href="/dashboard" aria-label="Neuro Bridge Africa dashboard">
              <BrandLogo compact className="w-40 sm:w-56" />
            </Link>

            <div className="flex items-center gap-3">
              <Image
                src={user.avatar || "/design-assets/child-portrait.jpg"}
                alt=""
                width={52}
                height={52}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="hidden sm:block">
                <div className="flex items-center gap-1 text-sm font-semibold text-[#111827]">
                  <span>Welcome, {user.firstName || "User"}</span>
                  <ChevronDownIcon className="h-4 w-4 text-[#8abbd7]" />
                </div>
                <span className="mt-1 inline-flex rounded-full bg-[#40e0d0] px-3 py-1 text-[11px] font-semibold text-white">
                  Super Admin
                </span>
              </div>
              <Link href={messagesPath} aria-label="Open messages" className="hidden rounded-full p-2 text-[#073f63] hover:bg-[#eaf6fb] sm:inline-flex">
                <MessageCircleIcon className="h-5 w-5" />
              </Link>
              {notificationButton}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 sm:gap-7">
            <div className="hidden items-center gap-7 text-base font-medium text-[#073f63] md:flex">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  className={item.active ? "font-bold underline decoration-2 underline-offset-4" : "hover:text-[#0078d4]"}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Open admin menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#d9edf8] text-[#073f63] hover:bg-[#c7e4f4]"
              >
                {menuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-md border border-[#d7e6f2] bg-white text-sm font-semibold text-[#073f63] shadow-lg">
                  <Link href="/admin/add-admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 border-b border-[#edf4f8] px-4 py-3 hover:bg-[#f6fbfd]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#8ec1e7]">
                      <PlusIcon className="h-3.5 w-3.5" />
                    </span>
                    Add New Admin
                  </Link>
                  <Link href="/admin/revenue?edit=session-fee" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 border-b border-[#edf4f8] px-4 py-3 hover:bg-[#f6fbfd]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#8ec1e7]">
                      <CediIcon className="h-3.5 w-3.5" />
                    </span>
                    <span>Edit Payment Amount per therapy session for parents</span>
                  </Link>
                  <Link href="/admin/users" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 border-b border-[#edf4f8] px-4 py-3 hover:bg-[#f6fbfd]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-[#8ec1e7]">
                      <TableIcon className="h-3.5 w-3.5" />
                    </span>
                    See All Platform Users
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[#bd302d] hover:bg-[#fff0f0] disabled:opacity-70"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-[#ffb4b4]">
                      <XIcon className="h-3.5 w-3.5" />
                    </span>
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                  <div className="border-t border-[#edf4f8] p-3 md:hidden">
                    {navLinks.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block rounded-md px-3 py-2 hover:bg-[#f6fbfd]">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

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
              <BellIcon className="h-5 w-5" />
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
          {menuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
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
