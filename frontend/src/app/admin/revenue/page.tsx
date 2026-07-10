"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../hooks/useRedux";
import { paymentsApi, Transaction } from "../../services/payments";

interface RevenueData {
  revenue: { total: number; monthly: number };
  activeSubscriptions: number;
  totalUsers: number;
  recentTransactions: (Transaction & { user: { id: string; firstName: string; lastName: string; email: string } })[];
}

export default function RevenuePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!user) return;
    if (user && user.role !== "ADMIN") { router.push("/dashboard"); return; }

    paymentsApi.revenueDashboard()
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  if (!user) return null;

  const formatGHS = (pesewas: number) => `GHS ${(pesewas / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Revenue Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : data ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-4">
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
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Recent Transactions</h2>
            </div>
            {data.recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No transactions yet.</div>
            ) : (
              <div className="divide-y">
                {data.recentTransactions.map((tx) => (
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
