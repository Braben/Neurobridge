"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../hooks/useRedux";
import { childrenApi, Child } from "../services/children";
import { reportsApi } from "../services/reports";

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!user) return;

    childrenApi.list()
      .then((d) => setChildren(d.children))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const handleGenerate = async (childId: string, childName: string) => {
    setGenerating(childId);
    setError("");
    try {
      const blob = await reportsApi.downloadReport(childId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${childName.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate report");
    } finally {
      setGenerating(null);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Therapy Reports</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : children.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-gray-500">No children found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map((child) => (
            <div key={child.id} className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {child.firstName} {child.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {child.diagnosis || "No diagnosis"} · {new Date(child.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleGenerate(child.id, `${child.firstName}-${child.lastName}`)}
                disabled={generating === child.id}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {generating === child.id ? "Generating..." : "Download PDF"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
