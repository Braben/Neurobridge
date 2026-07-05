"use client";

import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { useRouter } from "next/navigation";
import { logoutUser } from "../store/slices/authSlice";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await dispatch(logoutUser());
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Neurobridge</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.email}</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome, {user.firstName} {user.lastName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {user.role === "PARENT" && "Manage your children and view their therapy progress."}
            {user.role === "THERAPIST" && "View your assigned children and log session notes."}
            {user.role === "ADMIN" && "Manage therapists, children, and platform settings."}
          </p>

          {!user.isApproved && (
            <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              Your account is pending approval. Some features may be limited.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
