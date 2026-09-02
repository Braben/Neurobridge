"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "../hooks/useRedux";
import Sidebar from "./Sidebar";

type UserRole = "ADMIN" | "PARENT" | "THERAPIST";

const roleRoutes: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/bookings/new", roles: ["PARENT"] },
  { prefix: "/bookings", roles: ["PARENT", "THERAPIST"] },
  { prefix: "/availability", roles: ["THERAPIST"] },
  { prefix: "/children/add", roles: ["PARENT"] },
  { prefix: "/children", roles: ["PARENT", "THERAPIST"] },
  { prefix: "/messages", roles: ["PARENT", "THERAPIST"] },
  { prefix: "/notifications", roles: ["PARENT", "THERAPIST"] },
  { prefix: "/progress", roles: ["PARENT", "THERAPIST"] },
  { prefix: "/reports", roles: ["ADMIN", "THERAPIST"] },
  { prefix: "/resources/new", roles: ["ADMIN", "THERAPIST"] },
  { prefix: "/resources", roles: ["ADMIN", "PARENT", "THERAPIST"] },
  { prefix: "/subscriptions", roles: ["PARENT"] },
  { prefix: "/therapists", roles: ["ADMIN", "PARENT"] },
];

function fallbackRouteForDeniedAccess(role: UserRole, pathname: string) {
  if (role !== "ADMIN") return "/dashboard";
  if (pathname === "/children" || pathname.startsWith("/children/")) return "/admin/children";
  if (pathname === "/messages" || pathname.startsWith("/messages/")) return "/admin/messages";
  if (pathname === "/notifications" || pathname.startsWith("/notifications/")) return "/admin/notifications";
  if (pathname === "/resources" || pathname.startsWith("/resources/")) return "/admin/content";
  if (pathname === "/bookings" || pathname.startsWith("/bookings/")) return "/admin/sessions";
  return "/dashboard";
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading, user } = useAppSelector((s) => s.auth);

  const publicPages = ["/", "/about", "/privacy", "/login", "/register", "/register/admin", "/verify-otp", "/forgot-password"];
  const isPublicPage = publicPages.includes(pathname);
  const isProtectedPage = !isPublicPage;
  const routeRule = roleRoutes.find((route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`));
  const hasRouteAccess = !routeRule || Boolean(user && routeRule.roles.includes(user.role));

  useEffect(() => {
    if (isProtectedPage && !isAuthenticated && !accessToken && !isLoading) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && user && !hasRouteAccess) {
      router.replace(fallbackRouteForDeniedAccess(user.role, pathname));
    }
  }, [accessToken, hasRouteAccess, isAuthenticated, isLoading, isProtectedPage, pathname, router, user]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-[calc(100vh-77px)] place-items-center bg-[#f8fbfd] px-4">
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-[#0b4f71] shadow-sm">
          Loading your workspace...
        </div>
      </main>
    );
  }

  if ((pathname === "/dashboard" && user?.role !== "ADMIN") || pathname.startsWith("/children/add")) {
    return <>{children}</>;
  }

  if (user?.role === "ADMIN" && (pathname === "/dashboard" || pathname === "/admin" || pathname.startsWith("/admin/"))) {
    return (
      <main className="min-h-[calc(100vh-77px)] bg-white px-4 py-10 sm:px-8 lg:px-14">
        {children}
      </main>
    );
  }

  if (!hasRouteAccess) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-77px)] bg-[#f8fbfd]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-7">{children}</main>
    </div>
  );
}
