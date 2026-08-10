"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "../hooks/useRedux";
import { api } from "../services/api";
import AppButton from "../components/ui/AppButton";
import { DashboardPanel, StatCard } from "../components/ui/DashboardCards";
import GlobalMessage from "../components/ui/GlobalMessage";
import { SelectField } from "../components/ui/FormField";

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
  const [message, setMessage] = useState<{ variant: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadData();
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        api.get<{ users: UserRow[] }>("/admin/users"),
        api.get<{ stats: Stats }>("/admin/stats"),
      ]);
      setUsers(usersRes.data.users);
      setStats(statsRes.data.stats);
      setMessage(null);
    } catch {
      setMessage({ variant: "error", text: "Unable to load admin dashboard information." });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/approve`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isApproved: true } : u)));
      setMessage({ variant: "success", text: "Therapist account approved successfully." });
      loadData();
    } catch {
      setMessage({ variant: "error", text: "Unable to approve this account. Please try again." });
    }
  };

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  if (user?.role !== "ADMIN") {
    return <div className="flex min-h-screen items-center justify-center text-[#536471]">Access denied.</div>;
  }

  return (
    <div className="space-y-8">
      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}

      <section>
        <h1 className="text-3xl font-bold tracking-normal text-[#111827]">Admin Accounts</h1>
        <p className="mt-2 text-sm text-[#536471]">
          Manage parents, therapists, approvals, and platform account status.
        </p>
      </section>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard value={stats.totalChildren} label="Children" accent="teal" />
          <StatCard value={stats.totalParents} label="Parents" />
          <StatCard value={stats.totalTherapists} label="Therapists" />
          <StatCard value={stats.pendingTherapists} label="Pending Approval" accent="gold" />
          <StatCard value={stats.totalSessions} label="Sessions" accent="green" />
        </div>
      )}

      <DashboardPanel
        title="Users"
        description="Full platform account database"
        action={
          <div className="w-48">
            <SelectField
              label="Filter"
              name="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="PARENT">Parent</option>
              <option value="THERAPIST">Therapist</option>
            </SelectField>
          </div>
        }
      >
        <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0078d4] border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-[#f6fbfd] text-xs uppercase text-[#536471]">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf4f8]">
                  {filtered.map((account) => (
                    <tr key={account.id} className="hover:bg-[#f8fbfd]">
                      <td className="px-6 py-4 font-semibold text-[#111827]">
                        {account.firstName} {account.lastName}
                      </td>
                      <td className="px-6 py-4 text-[#536471]">{account.email}</td>
                      <td className="px-6 py-4 text-[#536471]">{account.phone}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-[#eaf6fb] px-3 py-1 text-xs font-semibold text-[#073f63]">
                          {account.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={account.isApproved ? "text-[#2e7d32]" : "text-[#b7791f]"}>
                          {account.isApproved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {!account.isApproved && account.role === "THERAPIST" ? (
                          <AppButton onClick={() => handleApprove(account.id)} size="sm" variant="secondary">
                            Approve
                          </AppButton>
                        ) : (
                          <Link href={`/messages`} className="font-semibold text-[#0078d4] hover:underline">
                            Contact
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}
