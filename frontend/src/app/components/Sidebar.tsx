"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { logoutUser } from "../store/slices/authSlice";
import BrandLogo from "./ui/BrandLogo";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const icons: Record<string, string> = {
  Dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  Children: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  Messages: "M8 10h.01M12 10h.01M16 10h.01M21 16c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  Resources: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
  Therapists: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  Bookings: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  Availability: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  Plans: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  Reports: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  Notifications: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  Admin: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  Revenue: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  Sessions: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  if (!user) return null;

  // Keep therapist workspace navigation identical to the Figma side-menu frame.
  if (user.role === "THERAPIST") {
    // Point the session-note action at the dashboard section when the dashboard is open.
    const sessionNotesHref = "/dashboard#session-notes"; // Return to the actual note-entry section from every therapist route.

    // Define the board menu order and active routes for therapist screens.
    const therapistMenuItems = [
      { href: sessionNotesHref, label: "Add Session Notes", icon: icons.Sessions },
      { href: "/children", label: "Assigned Children", icon: icons.Children },
      { href: "/dashboard", label: "Welcome", icon: icons.Dashboard },
    ];

    // Keep the side menu's logout action connected to the existing auth flow.
    const handleTherapistLogout = async () => {
      await dispatch(logoutUser());
      router.push("/login");
    };

    // Render the 408px desktop side menu defined by the therapist Figma frame.
    return (
      <aside className="hidden w-[408px] shrink-0 flex-col bg-[#e0ffff] px-10 pb-14 pt-14 lg:flex lg:min-h-screen lg:sticky lg:top-0">
        {/* Push the profile, menu, and board logo to the lower side-menu region. */}
        <div className="flex min-h-0 flex-1 flex-col justify-end">
          {/* Match the board's 86px avatar, 24px profile gap, and role tag treatment. */}
          <div className="flex items-center gap-6 pr-2 py-2">
            <Image
              src={user.avatar || "/design-assets/child-portrait.jpg"}
              alt=""
              width={86}
              height={86}
              className="h-[86px] w-[86px] shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-[22px] text-[#111111]">
                {`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Therapist"}
              </p>
              <p className="truncate text-base font-normal leading-6 text-[#111111]">
                {user.email || user.phone || "No contact"}
              </p>
              <span className="mt-1 inline-flex rounded-[12px] bg-[#69b5ff] px-2 py-1 text-xs leading-4 text-[#111111]">
                Therapist
              </span>
            </div>
          </div>

          {/* Match the board's 266px menu width, 24px item gaps, and active state radius. */}
          <nav className="mt-12 flex w-[266px] flex-col gap-6">
            {/* Keep logout above the separator as shown in the Figma menu. */}
            <button
              type="button"
              onClick={handleTherapistLogout}
              className="flex h-10 w-full items-center gap-2 rounded-[4px] px-3 text-left text-xl font-normal leading-7 text-[#0a3d62] hover:bg-white/60"
            >
              <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4m5-4 3-3m0 0-3-3m3 3H9" />
              </svg>
              Logout
            </button>

            {/* Use the board's separator treatment between logout and workspace sections. */}
            <div className="h-px w-[266px] bg-[#95cad3]" aria-hidden="true" />

            {/* Render the three board-defined therapist destinations. */}
            {therapistMenuItems.map((item) => {
              // Mark the dashboard, children, and session-note destinations active by route.
              const active = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : item.label === "Assigned Children"
                  ? pathname.startsWith("/children")
                  : false;

              // Render a fixed-width board menu item with a 24px icon.
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex min-h-10 w-[266px] items-center gap-2 rounded-[4px] px-3 py-2 text-base font-normal leading-6 text-[#0a3d62] ${active ? "rounded-[12px] bg-[#0a3d62] text-[#fafafa]" : "hover:bg-white/70"}`}
                >
                  <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Keep the board logo slot at its fixed 328px by 87px dimensions. */}
          <div className="mt-12 flex h-[87px] w-[328px] items-center justify-center">
            <BrandLogo compact variant="transparent" className="w-[328px]" />
          </div>
        </div>
      </aside>
    );
  }

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: icons.Dashboard },
    { href: "/children", label: "Children", icon: icons.Children },
    ...(user.role === "ADMIN" || user.role === "PARENT"
      ? [{ href: "/therapists" as const, label: "Therapists" as const, icon: icons.Therapists }]
      : []),
    // Keep the generic sidebar branch limited to parent and admin users after therapist routing returns above.
    ...(user.role === "PARENT" || user.role === "ADMIN"
      ? [{ href: "/bookings" as const, label: "Bookings" as const, icon: icons.Bookings }]
      : []),
    { href: "/messages", label: "Messages", icon: icons.Messages },
    { href: "/resources", label: "Resources", icon: icons.Resources },
    ...(user.role === "PARENT"
      ? [{ href: "/subscriptions" as const, label: "Plans" as const, icon: icons.Plans }]
      : []),
    { href: "/reports", label: "Reports", icon: icons.Reports },
    { href: "/notifications", label: "Notifications", icon: icons.Notifications },
    ...(user.role === "ADMIN"
      ? [
          { href: "/admin" as const, label: "Admin" as const, icon: icons.Admin },
          { href: "/admin/parents" as const, label: "Parent Accounts" as const, icon: icons.Children },
          { href: "/admin/therapists" as const, label: "Therapist Accounts" as const, icon: icons.Therapists },
          { href: "/admin/children" as const, label: "Children Database" as const, icon: icons.Children },
          { href: "/admin/sessions" as const, label: "Admin Sessions" as const, icon: icons.Sessions },
          { href: "/admin/content" as const, label: "Admin Content" as const, icon: icons.Resources },
          { href: "/admin/revenue" as const, label: "Revenue" as const, icon: icons.Revenue },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[#b7eef2] bg-[#dff9f9] sm:flex sm:h-[calc(100vh-77px)] sm:sticky sm:top-[77px]">
      <div className="flex min-h-20 items-center border-b border-[#b7eef2] px-5">
        <Link href="/dashboard" aria-label="Neuro Bridge Africa dashboard">
          <BrandLogo compact className="w-40" />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-[#073f63] shadow-sm"
                    : "text-[#3b647a] hover:bg-white/70 hover:text-[#073f63]"
                }`}
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={active ? 2 : 1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
