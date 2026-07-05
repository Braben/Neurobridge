"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { fetchChildren, deleteChild } from "../store/slices/childSlice";

export default function ChildrenPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { children, isLoading, error } = useAppSelector((state) => state.child);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    dispatch(fetchChildren());
  }, [isAuthenticated, router, dispatch]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This action cannot be undone.`)) return;
    await dispatch(deleteChild(id));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-500">&larr; Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900">My Children</h1>
          </div>
          <Link
            href="/children/add"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Child
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : children.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow">
            <p className="text-gray-500">No children registered yet.</p>
            <Link
              href="/children/add"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Your First Child
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <div key={child.id} className="rounded-xl bg-white p-5 shadow transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 capitalize">{child.gender.toLowerCase()}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {new Date(child.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>

                {child.diagnosis && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Diagnosis:</span> {child.diagnosis}
                  </p>
                )}
                {child.school && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">School:</span> {child.school}
</p>
                )}

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/children/${child.id}`}
                    className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                  >
                    View
                  </Link>
                  <Link
                    href={`/children/${child.id}/edit`}
                    className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(child.id, `${child.firstName} ${child.lastName}`)}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
