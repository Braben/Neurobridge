"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/ui/AppButton";
import { DashboardPanel, LoadingState, StatCard, StatusBadge } from "../../components/ui/DashboardCards";
import GlobalMessage from "../../components/ui/GlobalMessage";
import { adminApi, AdminOverview, AdminTherapist } from "../../services/admin";

const adminSections = [
  {
    href: "/admin/parents",
    title: "Parents' Accounts",
    description: "Review parent contact details, child links, and account status.",
  },
  {
    href: "/admin/therapists",
    title: "Therapists Accounts",
    description: "Approve therapists and monitor assigned children and booking volume.",
  },
  {
    href: "/admin/children",
    title: "Children Database",
    description: "Inspect child profiles, diagnosis fields, medications, intake summaries, and assigned therapists.",
  },
  {
    href: "/admin/sessions",
    title: "Therapy & Session Management",
    description: "Track booked sessions, payment status, notes, cancellations, and reschedules.",
  },
  {
    href: "/admin/content",
    title: "Content Management",
    description: "Publish and maintain caregiver resources with thumbnails and content categories.",
  },
  {
    href: "/admin/revenue",
    title: "Revenue",
    description: "View verified payments, monthly revenue, subscribers, and transaction history.",
  },
];

export default function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [therapists, setTherapists] = useState<AdminTherapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ variant: "error" | "success"; text: string } | null>(null);

  const loadData = (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    Promise.all([adminApi.overview(), adminApi.therapists()])
      .then(([overviewData, therapistData]) => {
        setOverview(overviewData);
        setTherapists(therapistData.therapists);
        setMessage(null);
      })
      .catch(() => setMessage({ variant: "error", text: "Unable to load admin data." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.all([adminApi.overview(), adminApi.therapists()])
      .then(([overviewData, therapistData]) => {
        if (!active) return;
        setOverview(overviewData);
        setTherapists(therapistData.therapists);
        setMessage(null);
      })
      .catch(() => {
        if (active) setMessage({ variant: "error", text: "Unable to load admin data." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const pendingTherapists = useMemo(() => therapists.filter((therapist) => !therapist.isApproved), [therapists]);

  const handleApprove = async (therapist: AdminTherapist) => {
    try {
      await adminApi.approveTherapist(therapist.id);
      setMessage({ variant: "success", text: "Therapist approved." });
      loadData();
    } catch {
      setMessage({ variant: "error", text: "Unable to approve this therapist." });
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-normal text-[#111827] sm:text-4xl">Admin Control Center</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#536471]">
          Manage the Figma-defined admin surfaces for users, children, therapy sessions, content, and revenue.
        </p>
      </section>

      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard value={overview?.stats.totalUsers || 0} label="Users registered" />
            <StatCard value={overview?.stats.totalChildren || 0} label="Children" accent="teal" />
            <StatCard value={overview?.stats.totalTherapists || 0} label="Therapists" accent="green" />
            <StatCard value={overview?.stats.pendingTherapists || 0} label="Pending Approval" accent="gold" />
            <StatCard value={overview?.stats.totalSessions || 0} label="Sessions" />
          </div>

          <DashboardPanel title="Admin Pages" description="Open the role and operations pages represented in the Figma design.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {adminSections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="rounded-md border border-[#b5d3ee] bg-white p-5 shadow-sm transition hover:border-[#0078d4] hover:shadow-md"
                >
                  <h2 className="text-xl font-bold text-[#073f63]">{section.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#536471]">{section.description}</p>
                </Link>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Pending Therapist Approvals" description="Therapists must be approved before they can fully participate.">
            {pendingTherapists.length === 0 ? (
              <div className="rounded-md border border-[#d7e6f2] bg-white p-6 text-sm text-[#536471] shadow-sm">
                No therapist accounts are waiting for approval.
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-[#f6fbfd] text-xs uppercase text-[#536471]">
                    <tr>
                      <th className="px-5 py-3">Therapist</th>
                      <th className="px-5 py-3">Expertise</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf4f8]">
                    {pendingTherapists.map((therapist) => (
                      <tr key={therapist.id}>
                        <td className="px-5 py-4 font-semibold text-[#111827]">{therapist.fullName}</td>
                        <td className="px-5 py-4 text-[#536471]">{therapist.areaofexpertise || "Not provided"}</td>
                        <td className="px-5 py-4"><StatusBadge tone="gold">Pending</StatusBadge></td>
                        <td className="px-5 py-4">
                          <AppButton size="sm" variant="secondary" onClick={() => handleApprove(therapist)}>
                            Approve
                          </AppButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardPanel>
        </>
      )}
    </div>
  );
}
