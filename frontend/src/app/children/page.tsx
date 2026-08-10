"use client";

import Image from "next/image";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { fetchChildren, deleteChild } from "../store/slices/childSlice";
import AppButton from "../components/ui/AppButton";
import { DashboardPanel, EmptyState } from "../components/ui/DashboardCards";
import GlobalMessage from "../components/ui/GlobalMessage";

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

  const title = user.role === "THERAPIST" ? "Assigned Children" : "My Children";

  return (
    <div className="space-y-7">
      {error && <GlobalMessage variant="error">{error}</GlobalMessage>}

      <DashboardPanel
        title={title}
        description="Review child profiles, intake status, and therapy records."
        action={
          user.role !== "THERAPIST" && (
            <AppButton href="/children/add" variant="secondary">
              Add Child
            </AppButton>
          )
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0078d4] border-t-transparent" />
          </div>
        ) : children.length === 0 ? (
          <EmptyState
            title="No children registered yet"
            message="Child profiles will appear here once they are added to the platform."
            action={
              user.role !== "THERAPIST" && (
                <AppButton href="/children/add" variant="secondary">
                  Add Your First Child
                </AppButton>
              )
            }
          />
        ) : (
          <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-[#f6fbfd] text-xs uppercase text-[#536471]">
                  <tr>
                    <th className="px-6 py-3">Child</th>
                    <th className="px-6 py-3">Date of Birth</th>
                    <th className="px-6 py-3">Gender</th>
                    <th className="px-6 py-3">Diagnosis</th>
                    <th className="px-6 py-3">School</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf4f8]">
                  {children.map((child) => (
                    <tr key={child.id} className="hover:bg-[#f8fbfd]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Image src="/design-assets/child-portrait.jpg" alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                          <div>
                            <p className="font-semibold text-[#111827]">{child.firstName} {child.lastName}</p>
                            <p className="text-xs text-[#536471]">Profile ID: {child.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#536471]">{new Date(child.dateOfBirth).toLocaleDateString()}</td>
                      <td className="px-6 py-4 capitalize text-[#536471]">{child.gender.toLowerCase()}</td>
                      <td className="px-6 py-4 text-[#536471]">{child.diagnosis || "Pending"}</td>
                      <td className="px-6 py-4 text-[#536471]">{child.school || "Not provided"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <AppButton href={`/children/${child.id}`} size="sm" variant="outline">
                            View
                          </AppButton>
                          {user.role !== "THERAPIST" && (
                            <>
                              <AppButton href={`/children/${child.id}/edit`} size="sm" variant="ghost">
                                Edit
                              </AppButton>
                              <AppButton
                                onClick={() => handleDelete(child.id, `${child.firstName} ${child.lastName}`)}
                                size="sm"
                                variant="danger"
                              >
                                Delete
                              </AppButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DashboardPanel>

      <Link href="/dashboard" className="inline-flex text-sm font-semibold text-[#0078d4] hover:underline">
        &larr; Dashboard
      </Link>
    </div>
  );
}
