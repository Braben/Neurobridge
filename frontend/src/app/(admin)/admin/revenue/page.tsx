"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "../../../hooks/useRedux";
import { AdminControls, AdminFilterSelect } from "../../../components/admin/AdminChrome";
import { adminApi } from "../../../services/admin";
import { paymentsApi, Transaction } from "../../../services/payments";

interface RevenueData {
  revenue: { total: number; monthly: number };
  activeSubscriptions: number;
  totalUsers: number;
  recentTransactions: (Transaction & { user: { id: string; firstName: string; lastName: string; email: string } })[];
}

export default function RevenuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [data, setData] = useState<RevenueData | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sessionFee, setSessionFee] = useState<number | null>(null);
  const [sessionFeeDraft, setSessionFeeDraft] = useState("");
  const [editSessionFee, setEditSessionFee] = useState(false);
  const [savingSessionFee, setSavingSessionFee] = useState(false);
  const [sessionFeeMessage, setSessionFeeMessage] = useState<{ variant: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const shouldEditSessionFee = editSessionFee || searchParams.get("edit") === "session-fee";

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!user) return;
    if (user && user.role !== "ADMIN") { router.push("/dashboard"); return; }

    paymentsApi.revenueDashboard()
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    adminApi
      .getSessionFee()
      .then((response) => {
        setSessionFee(response.amount);
        setSessionFeeDraft((response.amount / 100).toFixed(2));
      })
      .catch(() => setSessionFeeMessage({ variant: "error", text: "Unable to load therapy session fee." }));
  }, [user?.role]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.recentTransactions || []).filter((tx) =>
      (statusFilter === "ALL" || tx.status === statusFilter) &&
      (!query || [
        tx.user.firstName,
        tx.user.lastName,
        tx.user.email,
        tx.email,
        tx.reference,
        tx.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      .includes(query)),
    );
  }, [data?.recentTransactions, search, statusFilter]);

  if (!user) return null;

  const formatGHS = (pesewas: number) => `GHS ${(pesewas / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const handleSaveSessionFee = async () => {
    const amount = Math.round(Number(sessionFeeDraft) * 100);
    if (!Number.isInteger(amount) || amount < 100) {
      setSessionFeeMessage({ variant: "error", text: "Enter a session fee of at least GHS 1.00." });
      return;
    }

    setSavingSessionFee(true);
    setSessionFeeMessage(null);
    try {
      const response = await adminApi.updateSessionFee(amount);
      setSessionFee(response.amount);
      setSessionFeeDraft((response.amount / 100).toFixed(2));
      setSessionFeeMessage({ variant: "success", text: response.message });
      setEditSessionFee(false);
      router.replace("/admin/revenue");
    } catch {
      setSessionFeeMessage({ variant: "error", text: "Unable to update therapy session fee." });
    } finally {
      setSavingSessionFee(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Revenue Income History</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : data ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">{formatGHS(data.revenue.total)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">This Month</p>
              <p className="text-xl font-bold text-blue-600">{formatGHS(data.revenue.monthly)}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Active Subscriptions</p>
              <p className="text-xl font-bold text-green-600">{data.activeSubscriptions}</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Total Users</p>
              <p className="text-xl font-bold text-purple-600">{data.totalUsers}</p>
            </div>
            <div className={`rounded-xl border bg-white p-4 shadow-sm ${shouldEditSessionFee ? "ring-2 ring-[#0071d7]/30" : ""}`}>
              <p className="text-xs text-gray-500">Session Fee</p>
              {shouldEditSessionFee ? (
                <div className="mt-2 space-y-2">
                  <label className="sr-only" htmlFor="session-fee">Therapy session fee</label>
                  <input
                    id="session-fee"
                    type="number"
                    min="1"
                    step="0.01"
                    value={sessionFeeDraft}
                    onChange={(event) => setSessionFeeDraft(event.target.value)}
                    className="h-9 w-full rounded-md border border-[#b5d3ee] px-3 text-sm outline-none focus:border-[#0071d7]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSessionFee}
                    disabled={savingSessionFee}
                    className="w-full rounded-md bg-[#0a3d62] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {savingSessionFee ? "Saving..." : "Save Amount"}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setEditSessionFee(true)} className="mt-1 text-left text-xl font-bold text-[#0a3d62]">
                  {sessionFee ? formatGHS(sessionFee) : "Loading..."}
                </button>
              )}
            </div>
          </div>
          {sessionFeeMessage && (
            <p className={`mb-4 text-sm font-semibold ${sessionFeeMessage.variant === "success" ? "text-green-700" : "text-red-600"}`}>
              {sessionFeeMessage.text}
            </p>
          )}

          <div className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Recent Transactions</h2>
            </div>
            <div className="border-b px-4 py-4">
              <AdminControls search={search} setSearch={setSearch} verb="Filter by">
                <AdminFilterSelect
                  label="Filter transactions by status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { label: "All Status", value: "ALL" },
                    { label: "Success", value: "SUCCESS" },
                    { label: "Pending", value: "PENDING" },
                    { label: "Failed", value: "FAILED" },
                  ]}
                />
              </AdminControls>
            </div>
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No transactions yet.</div>
            ) : (
              <div className="divide-y">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {tx.user.firstName} {tx.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tx.reference.slice(0, 16)}… · {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatGHS(tx.amount)}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        tx.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                        tx.status === "FAILED" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-gray-500">Failed to load revenue data.</p>
        </div>
      )}
    </div>
  );
}
