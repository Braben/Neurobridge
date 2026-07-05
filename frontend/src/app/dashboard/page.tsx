"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logoutUser } from "../store/slices/authSlice";
import { fetchChildren } from "../store/slices/childSlice";
import { useState } from "react";

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { children, isLoading: childrenLoading } = useAppSelector((state) => state.child);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    dispatch(fetchChildren());
  }, [isAuthenticated, router, dispatch]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await dispatch(logoutUser());
    router.push("/login");
  };

  if (!user) return null;

  const unapprovedCount = children.filter((c) => !c.diagnosis).length;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Neurobridge</h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:inline">{user.email}</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {user.role}
            </span>
            <nav className="flex items-center gap-3">
              <Link href="/children" className="text-sm text-blue-600 hover:text-blue-500">Children</Link>
              <Link href="/messages" className="text-sm text-blue-600 hover:text-blue-500">Messages</Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="text-sm text-purple-600 hover:text-purple-500">Admin</Link>
              )}
            </nav>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4">
        {/* Welcome Banner */}
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

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Registered Children</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {childrenLoading ? "..." : children.length}
            </p>
          </div>
          {user.role === "ADMIN" && (
            <>
              <div className="rounded-xl bg-white p-5 shadow">
                <p className="text-sm text-gray-500">Pending Setup</p>
                <p className="mt-1 text-2xl font-bold text-yellow-600">{unapprovedCount}</p>
              </div>
            </>
          )}
        </div>

        {/* My Children Widget */}
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {user.role === "PARENT" ? "My Children" : "Assigned Children"}
            </h2>
            <Link href="/children" className="text-sm text-blue-600 hover:text-blue-500">View all &rarr;</Link>
          </div>

          {childrenLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : children.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-500">
                {user.role === "PARENT"
                  ? "No children registered yet."
                  : "No children assigned yet."}
              </p>
              {user.role === "PARENT" && (
                <Link
                  href="/children/add"
                  className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Add Your First Child
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {children.slice(0, 5).map((child) => (
                <Link
                  key={child.id}
                  href={`/children/${child.id}`}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{child.firstName} {child.lastName}</p>
                    {child.diagnosis && (
                      <p className="text-xs text-gray-500">{child.diagnosis}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(child.dateOfBirth).toLocaleDateString()}
                  </span>
                </Link>
              ))}
              {children.length > 5 && (
                <Link href="/children" className="block text-center text-sm text-blue-600 hover:text-blue-500">
                  + {children.length - 5} more
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
