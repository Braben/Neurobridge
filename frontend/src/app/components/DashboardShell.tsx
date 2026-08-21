"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "../hooks/useRedux";
import Sidebar from "./Sidebar";

type UserRole = "ADMIN" | "PARENT" | "THERAPIST";

const roleRoutes: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/availability", roles: ["THERAPIST"] },
  { prefix: "/children/add", roles: ["PARENT"] },
  { prefix: "/subscriptions", roles: ["PARENT"] },
  { prefix: "/therapists", roles: ["ADMIN", "PARENT"] },
  { prefix: "/resources/new", roles: ["ADMIN", "THERAPIST"] },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const authPages = ["/", "/login", "/register", "/register/admin", "/verify-otp", "/forgot-password"];
  const routeRule = roleRoutes.find((route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`));
  const hasRouteAccess = !routeRule || Boolean(user && routeRule.roles.includes(user.role));

  useEffect(() => {
    if (isAuthenticated && user && !hasRouteAccess) {
      router.replace("/dashboard");
    }
  }, [hasRouteAccess, isAuthenticated, router, user]);

  if (!isAuthenticated || authPages.includes(pathname)) {
    return <>{children}</>;
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
