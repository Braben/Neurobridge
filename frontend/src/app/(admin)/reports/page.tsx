"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "../../components/ui/AppButton";
import { DashboardPanel, EmptyState, LoadingState, ScreenHeader } from "../../components/ui/DashboardCards";
import GlobalMessage from "../../components/ui/GlobalMessage";
import { useAppSelector } from "../../hooks/useRedux";
import { childrenApi, Child } from "../../services/children";
import { reportsApi } from "../../services/reports";

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!user) return;

    childrenApi
      .list()
      .then((d) => setChildren(d.children))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const handleGenerate = async (childId: string, childName: string) => {
    setGenerating(childId);
    setError("");
    try {
      const blob = await reportsApi.downloadReport(childId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `report-${childName.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate report");
    } finally {
      setGenerating(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Documentation"
        title="Therapy Reports"
        description="Generate PDF reports from child profile, goal, behaviour, and session data."
      />

      {error && <GlobalMessage variant="error">{error}</GlobalMessage>}

      <DashboardPanel title="Children" description="Select a child to download a backend-generated report.">
        <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
          {loading ? (
            <LoadingState />
          ) : children.length === 0 ? (
            <EmptyState title="No children found" message="Reports become available once child profiles are visible to your account." />
          ) : (
            <div className="divide-y divide-[#edf4f8]">
              {children.map((child) => (
                <div key={child.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-semibold text-[#111827]">{child.firstName} {child.lastName}</p>
                    <p className="mt-1 text-xs text-[#536471]">
                      {child.diagnosis || "No diagnosis"} | {new Date(child.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  <AppButton
                    onClick={() => handleGenerate(child.id, `${child.firstName}-${child.lastName}`)}
                    disabled={generating === child.id}
                    size="sm"
                  >
                    {generating === child.id ? "Generating..." : "Download PDF"}
                  </AppButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}
