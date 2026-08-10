"use client";

import { usePathname } from "next/navigation";
import { useAppSelector } from "../hooks/useRedux";
import Sidebar from "./Sidebar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const authPages = ["/login", "/register", "/verify-otp"];

  if (!isAuthenticated || authPages.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[calc(100vh-77px)] bg-[#f8fbfd]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-7">{children}</main>
    </div>
  );
}
