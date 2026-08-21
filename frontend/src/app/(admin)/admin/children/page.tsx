"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AdminControls,
  AdminTable,
  AdminTitle,
  EditIcon,
  InitialAvatar,
  SelectCell,
  ViewIcon,
} from "../../../components/admin/AdminChrome";
import { LoadingState } from "../../../components/ui/DashboardCards";
import GlobalMessage from "../../../components/ui/GlobalMessage";
import { adminApi, AdminChild } from "../../../services/admin";

function textOrNA(value: string | null | undefined) {
  return value?.trim() || "N/A";
}

export default function AdminChildrenDatabasePage() {
  const [children, setChildren] = useState<AdminChild[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .children()
      .then((data) => setChildren(data.children))
      .catch(() => setError("Unable to load the children database."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return children;
    return children.filter((child) => {
      const parents = child.parents.map((parent) => parent.fullName).join(" ");
      const therapists = child.therapists.map((therapist) => therapist.fullName).join(" ");
      return [
        child.shortId,
        child.fullName,
        parents,
        therapists,
        child.diagnosis,
        child.coExistingConditions,
        child.currentMedications,
        child.developmentalHistorySummary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [children, search]);

  return (
    <div className="space-y-8">
      <AdminTitle>All Children&apos;s Data on NeuroBridge</AdminTitle>
      {error && <GlobalMessage variant="error">{error}</GlobalMessage>}
      <AdminControls search={search} setSearch={setSearch} />

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable minWidth="1440px">
          <thead className="bg-[#f6fbfd] text-[#111827]">
            <tr>
              <th className="w-14 px-4 py-4"><SelectCell /></th>
              <th className="w-20 px-4 py-4">ID</th>
              <th className="w-64 px-4 py-4">Child&apos;s Name and Age</th>
              <th className="w-56 px-4 py-4">Parent&apos;s Name</th>
              <th className="w-44 px-4 py-4">Main Diagnosis</th>
              <th className="w-56 px-4 py-4">Co-Existing Conditions</th>
              <th className="w-52 px-4 py-4">Current Medications</th>
              <th className="w-80 px-4 py-4">Developmental History Summary</th>
              <th className="w-36 px-4 py-4 text-center">View Full Profile</th>
              <th className="w-64 px-4 py-4">Assigned Therapist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b5d3ee]">
            {filtered.map((child, index) => (
              <tr key={child.id} className={index === 1 ? "bg-[#d9d9d9]" : "hover:bg-[#f8fbfd]"}>
                <td className="px-4 py-4"><SelectCell checked={index === 1} /></td>
                <td className="px-4 py-4">{child.shortId}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <InitialAvatar name={child.fullName} />
                    <div>
                      <p className="font-medium text-[#111827]">{child.fullName}</p>
                      <p className="text-xs text-[#707070]">{child.age ?? "N/A"} years old</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">{child.parents.map((parent) => parent.fullName).join(", ") || "Unassigned"}</td>
                <td className="px-4 py-4">{textOrNA(child.diagnosis)}</td>
                <td className="px-4 py-4">{textOrNA(child.coExistingConditions)}</td>
                <td className="px-4 py-4">{textOrNA(child.currentMedications)}</td>
                <td className="px-4 py-4">
                  <span className="line-clamp-2">{textOrNA(child.developmentalHistorySummary)}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <Link href={`/children/${child.id}`} aria-label={`View ${child.fullName}`}>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#707070] hover:bg-[#eaf6fb] hover:text-[#0078d4]">
                      <ViewIcon />
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="line-clamp-1">
                      {child.therapists.map((therapist) => therapist.fullName).join(", ") || "Unassigned"}
                    </span>
                    <Link href={`/children/${child.id}`} aria-label={`Edit assignments for ${child.fullName}`}>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#707070] hover:bg-[#eaf6fb]">
                        <EditIcon />
                      </span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
