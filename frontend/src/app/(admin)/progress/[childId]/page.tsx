"use client";

// Progress Page — visual dashboard showing a child's therapy progress over time
// Uses Recharts to render three types of charts:
//   - Bar chart: session duration over time
//   - Pie chart: goal status distribution (not started / in progress / achieved / archived)
//   - Line charts: per-behaviour frequency trends
// All data is fetched in a single request from GET /api/v1/progress/:childId.
// The page is rendered client-side because chart libraries require the DOM.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAppSelector } from "../../../hooks/useRedux";
import { progressApi, ChildProgress } from "../../../services/progress";

// Colour palette shared across pie chart segments and line strokes
const COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#6B7280"];

export default function ProgressPage() {
  const { childId } = useParams<{ childId: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [data, setData] = useState<ChildProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated users; fetch progress data on mount
  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    progressApi.getChildProgress(childId).then(setData).finally(() => setLoading(false));
  }, [isAuthenticated, childId, router]);

  // Loading spinner while data is being fetched
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );

  // Error state if the API call failed
  if (!data) return <p className="p-6 text-gray-500">Failed to load progress data.</p>;

  // Transform raw data into chart-friendly formats
  const goalPie = Object.entries(data.summary.goalCounts).map(([name, value]) => ({ name, value }));
  const sessionChart = data.sessions.map((s) => ({ date: new Date(s.date).toLocaleDateString(), duration: s.duration || 0 }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      {/* Back navigation + child name header */}
      <div className="flex items-center gap-3">
        <Link href={`/children/${childId}`} className="text-sm text-blue-600 hover:text-blue-500">&larr; Back</Link>
        <h1 className="text-xl font-bold text-gray-900">
          {data.child.firstName} {data.child.lastName} — Progress
        </h1>
      </div>

      {/* Summary stat cards — high-level KPIs at a glance */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data.summary.totalSessions}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total Duration</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data.summary.totalDuration} min</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Goals Achieved</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{data.summary.goalCounts.ACHIEVED}</p>
        </div>
      </div>

      {/* Charts grid — two columns on large screens, stacked on mobile */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar chart: session duration per date */}
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Session Duration</h2>
          {sessionChart.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No sessions recorded.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sessionChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Bar dataKey="duration" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart: goal status breakdown */}
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Goal Status</h2>
          {goalPie.every((g) => g.value === 0) ? (
            <p className="py-8 text-center text-sm text-gray-400">No goals created.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={goalPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {goalPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line charts: one per tracked behaviour showing frequency over time */}
        {data.behaviourTrends.map((b) => (
          <div key={b.name} className="rounded-xl bg-white p-5 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{b.name}</h2>
            {b.logs.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No behaviour logs.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={b.logs.map((l) => ({ date: new Date(l.date).toLocaleDateString(), frequency: l.frequency }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="frequency" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
