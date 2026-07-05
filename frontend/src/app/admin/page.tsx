"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "../hooks/useRedux";
import { api } from "../services/api";

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isApproved: boolean;
  areaofexpertise: string | null;
  createdAt: string;
}

interface Stats {
  totalChildren: number;
  totalParents: number;
  totalTherapists: number;
  pendingTherapists: number;
  totalSessions: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && user.role !== "ADMIN") { router.push("/dashboard"); return; }
    loadData();
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    setLoading(true);
    const [usersRes, statsRes] = await Promise.all([
      api.get<{ users: UserRow[] }>("/admin/users"),
      api.get<{ stats: Stats }>("/admin/stats"),
    ]);
    setUsers(usersRes.data.users);
    setStats(statsRes.data.stats);
    setLoading(false);
  };

  const handleApprove = async (userId: string) => {
    await api.patch(`/admin/users/${userId}/approve`);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isApproved: true } : u));
    loadData();
  };

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  if (user?.role !== "ADMIN") return <div className="flex min-h-screen items-center justify-center text-gray-500">Access denied.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-500">&larr; Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-5">
            <div className="rounded-xl bg-white p-4 shadow"><p className="text-xs text-gray-500">Children</p><p className="text-xl font-bold">{stats.totalChildren}</p></div>
            <div className="rounded-xl bg-white p-4 shadow"><p className="text-xs text-gray-500">Parents</p><p className="text-xl font-bold">{stats.totalParents}</p></div>
            <div className="rounded-xl bg-white p-4 shadow"><p className="text-xs text-gray-500">Therapists</p><p className="text-xl font-bold">{stats.totalTherapists}</p></div>
            <div className="rounded-xl bg-white p-4 shadow"><p className="text-xs text-gray-500">Pending Approval</p><p className="text-xl font-bold text-yellow-600">{stats.pendingTherapists}</p></div>
            <div className="rounded-xl bg-white p-4 shadow"><p className="text-xs text-gray-500">Sessions</p><p className="text-xl font-bold">{stats.totalSessions}</p></div>
          </div>
        )}

        {/* Users table */}
        <div className="rounded-xl bg-white shadow">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="PARENT">Parent</option>
              <option value="THERAPIST">Therapist</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Email</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Role</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                          u.role === "THERAPIST" ? "bg-blue-100 text-blue-700" :
                          "bg-green-100 text-green-700"
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isApproved ? (
                          <span className="text-green-600">Approved</span>
                        ) : (
                          <span className="text-yellow-600">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!u.isApproved && u.role === "THERAPIST" && (
                          <button onClick={() => handleApprove(u.id)}
                            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
