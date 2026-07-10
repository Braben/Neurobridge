"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchChildren } from "../store/slices/childSlice";

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { children, isLoading: childrenLoading } = useAppSelector((state) => state.child);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    dispatch(fetchChildren());
  }, [isAuthenticated, router, dispatch]);

  if (!user) return null;

  const unapprovedCount = children.filter((c) => !c.diagnosis).length;

  return (
    <div className="space-y-6">
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
    </div>
  );
}
