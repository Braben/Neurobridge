"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "../../hooks/useRedux";
import { therapistsApi, TherapistProfile } from "../../services/therapists";
import { DashboardPanel, EmptyState, FilterPanel, LoadingState, ScreenHeader, StatCard } from "../../components/ui/DashboardCards";
import { FormField } from "../../components/ui/FormField";

export default function TherapistsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!user) return;
    therapistsApi
      .list()
      .then((d) => setTherapists(d.therapists))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  if (!user) return null;

  const assignedChildrenCount = therapists.reduce((sum, therapist) => sum + (therapist.childCount || 0), 0);
  const loggedSessionsCount = therapists.reduce((sum, therapist) => sum + (therapist.sessionCount || 0), 0);

  const filtered = therapists.filter(
    (therapist) =>
      !search ||
      therapist.firstName.toLowerCase().includes(search.toLowerCase()) ||
      therapist.lastName.toLowerCase().includes(search.toLowerCase()) ||
      (therapist.areaofexpertise && therapist.areaofexpertise.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Care team"
        title="Therapists"
        description="Browse approved therapist accounts and review their caseloads, sessions, and specialisms from the backend therapist directory."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard value={therapists.length} label="Approved therapists" />
        <StatCard value={assignedChildrenCount} label="Assigned children" accent="teal" />
        <StatCard value={loggedSessionsCount} label="Logged sessions" accent="green" />
      </div>

      <FilterPanel>
        <div className="w-full max-w-xl">
          <FormField
            label="Search"
            name="therapistSearch"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or expertise"
            className="h-12 rounded-xl"
          />
        </div>
      </FilterPanel>

      <DashboardPanel title="Therapist Accounts" description={`${filtered.length} result${filtered.length === 1 ? "" : "s"}`}>
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={therapists.length === 0 ? "No therapists found" : "No matching therapists"}
            message="Approved therapists will appear here once their accounts are active."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((therapist) => (
              <Link
                key={therapist.id}
                href={`/therapists/${therapist.id}`}
                className="rounded-md border border-[#d7e6f2] bg-white p-5 shadow-sm transition hover:border-[#9dcefb] hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  {therapist.avatar ? (
                    <Image src={therapist.avatar} alt="" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf6fb] text-sm font-bold text-[#073f63]">
                      {therapist.firstName[0]}{therapist.lastName[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[#111827]">{therapist.firstName} {therapist.lastName}</p>
                    <p className="text-xs text-[#536471]">{therapist.areaofexpertise || "Therapy specialist"}</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-[#f6fbfd] p-3">
                    <p className="font-bold text-[#073f63]">{therapist.childCount}</p>
                    <p className="text-xs text-[#536471]">Children</p>
                  </div>
                  <div className="rounded-md bg-[#f6fbfd] p-3">
                    <p className="font-bold text-[#073f63]">{therapist.sessionCount || 0}</p>
                    <p className="text-xs text-[#536471]">Sessions</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
