"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AdminControls,
  AdminFooter,
  AdminFilterSelect,
  AdminTable,
  AdminTitle,
  EditIcon,
  InitialAvatar,
  SelectCell,
  ViewIcon,
} from "../../../components/admin/AdminChrome";
import { LoadingState } from "../../../components/ui/DashboardCards";
import GlobalMessage from "../../../components/ui/GlobalMessage";
import { PlusIcon } from "../../../components/ui/Icons";
import { adminApi, AdminChild, AdminTherapist } from "../../../services/admin";
import { childrenApi } from "../../../services/children";

function textOrNA(value: string | null | undefined) {
  return value?.trim() || "N/A";
}

function therapistLabel(child: AdminChild) {
  return child.therapists.map((therapist) => therapist.fullName).join(", ") || "null";
}

export default function AdminChildrenDatabasePage() {
  const [children, setChildren] = useState<AdminChild[]>([]);
  const [therapists, setTherapists] = useState<AdminTherapist[]>([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState("ALL");
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [activeAssignmentChildId, setActiveAssignmentChildId] = useState<string | null>(null);
  const [selectedTherapistId, setSelectedTherapistId] = useState("");
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [assigningChildId, setAssigningChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ variant: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    adminApi
      .children()
      .then((data) => {
        if (!active) return;
        setChildren(data.children);
        setMessage(null);
      })
      .catch(() => {
        if (active) setMessage({ variant: "error", text: "Unable to load the children database." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshChildren = async () => {
    const data = await adminApi.children();
    setChildren(data.children);
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return children.filter((child) => {
      const parents = child.parents.map((parent) => parent.fullName).join(" ");
      const therapists = child.therapists.map((therapist) => therapist.fullName).join(" ");
      return (
        (genderFilter === "ALL" || child.gender === genderFilter) &&
        (assignmentFilter === "ALL" || (assignmentFilter === "ASSIGNED" ? child.therapists.length > 0 : child.therapists.length === 0)) &&
        (!query || [
          child.shortId,
          child.fullName,
          parents,
          therapists,
          child.gender,
          child.diagnosis,
          child.coExistingConditions,
          child.currentMedications,
          child.developmentalHistorySummary,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query))
      );
    });
  }, [assignmentFilter, children, genderFilter, search]);

  const visibleChildIds = useMemo(() => filtered.map((child) => child.id), [filtered]);
  const selectedVisibleCount = visibleChildIds.filter((id) => selectedChildIds.includes(id)).length;
  const allVisibleSelected = visibleChildIds.length > 0 && selectedVisibleCount === visibleChildIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  const toggleAllVisible = () => {
    setSelectedChildIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleChildIds.includes(id));
      return Array.from(new Set([...current, ...visibleChildIds]));
    });
  };

  const toggleChild = (id: string) => {
    setSelectedChildIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const approvedTherapists = useMemo(() => therapists.filter((therapist) => therapist.isApproved), [therapists]);

  const loadTherapists = async () => {
    if (therapists.length > 0 || loadingTherapists) return;
    setLoadingTherapists(true);
    try {
      const data = await adminApi.therapists();
      setTherapists(data.therapists);
    } catch {
      setMessage({ variant: "error", text: "Unable to load therapists for assignment." });
    } finally {
      setLoadingTherapists(false);
    }
  };

  const openAssignmentPicker = async (child: AdminChild) => {
    const currentTherapistId = child.therapists[0]?.id || "";
    setActiveAssignmentChildId((current) => current === child.id ? null : child.id);
    setSelectedTherapistId(currentTherapistId);
    await loadTherapists();
  };

  const assignTherapist = async (child: AdminChild) => {
    if (!selectedTherapistId) {
      setMessage({ variant: "error", text: "Select a therapist before saving the assignment." });
      return;
    }

    const therapist = approvedTherapists.find((item) => item.id === selectedTherapistId);
    if (!therapist) {
      setMessage({ variant: "error", text: "Select an approved therapist before saving the assignment." });
      return;
    }

    setAssigningChildId(child.id);
    try {
      await childrenApi.assignTherapist(child.id, selectedTherapistId);
      setActiveAssignmentChildId(null);
      setSelectedTherapistId("");
      setMessage({ variant: "success", text: `${therapist.fullName} has been assigned to ${child.fullName}.` });
      await refreshChildren();
    } catch {
      setMessage({ variant: "error", text: "Unable to save this therapist assignment." });
    } finally {
      setAssigningChildId(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminTitle>All Children&apos;s Data on NeuroBridge</AdminTitle>
      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}
      <AdminControls search={search} setSearch={setSearch}>
        <AdminFilterSelect
          label="Filter children by gender"
          value={genderFilter}
          onChange={setGenderFilter}
          options={[
            { label: "All Genders", value: "ALL" },
            { label: "Male", value: "MALE" },
            { label: "Female", value: "FEMALE" },
            { label: "Other", value: "OTHER" },
          ]}
        />
        <AdminFilterSelect
          label="Filter children by therapist assignment"
          value={assignmentFilter}
          onChange={setAssignmentFilter}
          options={[
            { label: "All Assignments", value: "ALL" },
            { label: "Assigned", value: "ASSIGNED" },
            { label: "Unassigned", value: "UNASSIGNED" },
          ]}
        />
      </AdminControls>
      <div aria-live="polite" className="min-h-5 text-sm font-semibold text-[#0a3d62]">
        {selectedChildIds.length > 0 ? `${selectedChildIds.length} child profile(s) selected` : null}
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable minWidth="1450px">
          <thead className="bg-white text-[#111827]">
            <tr>
              <th className="w-12 px-3 py-4">
                <SelectCell
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  label="Select all visible child profiles"
                  onChange={toggleAllVisible}
                />
              </th>
              <th className="w-16 px-4 py-4">ID</th>
              <th className="w-48 px-4 py-4">Child&apos;s Name and Age</th>
              <th className="w-48 px-4 py-4">Parent&apos;s Name</th>
              <th className="w-36 px-4 py-4">Main Diagnosis</th>
              <th className="w-44 px-4 py-4">Co-Existing Conditions</th>
              <th className="w-44 px-4 py-4">Current Medications</th>
              <th className="w-64 px-4 py-4">Developmental History Summary</th>
              <th className="w-36 px-4 py-4 text-center">View Full Profile</th>
              <th className="w-60 px-4 py-4">Assigned Therapist</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((child, index) => {
              const selected = selectedChildIds.includes(child.id);
              const rowClassName = selected ? "bg-[#e0e0e0]" : index === 0 ? "bg-[#e0f4ff]" : "bg-white hover:bg-[#f8fbfd]";
              return (
              <tr key={child.id} className={rowClassName}>
                <td className="px-3 py-3">
                  <SelectCell checked={selected} label={`Select ${child.fullName}`} onChange={() => toggleChild(child.id)} />
                </td>
                <td className="px-4 py-3">{child.shortId}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <InitialAvatar name={child.fullName} />
                    <div>
                      <p className="font-medium text-[#111827]">{child.fullName}</p>
                      <p className="text-xs text-[#707070]">{child.age ?? "N/A"} years old</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{child.parents.map((parent) => parent.fullName).join(", ") || "N/A"}</td>
                <td className="px-4 py-3">{textOrNA(child.diagnosis)}</td>
                <td className="px-4 py-3">{textOrNA(child.coExistingConditions)}</td>
                <td className="px-4 py-3">{textOrNA(child.currentMedications)}</td>
                <td className="px-4 py-3">
                  <span className="line-clamp-1">{textOrNA(child.developmentalHistorySummary)}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Link href={`/admin/children/${child.id}`} aria-label={`View ${child.fullName}`}>
                    <span className="inline-flex h-6 w-6 items-center justify-center text-[#707070] hover:text-[#0078d4]">
                      <ViewIcon />
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="relative flex items-center justify-between gap-3">
                    <span className="line-clamp-1">{therapistLabel(child)}</span>
                    <button
                      type="button"
                      aria-label={`${child.therapists.length ? "Change" : "Assign"} therapist for ${child.fullName}`}
                      onClick={() => openAssignmentPicker(child)}
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#0078d4]/30 ${
                        child.therapists.length
                          ? "text-[#707070] hover:text-[#0078d4]"
                          : "bg-[#0078d4] text-white hover:bg-[#005faa]"
                      }`}
                    >
                      {child.therapists.length ? <EditIcon /> : <PlusIcon className="h-4 w-4" />}
                    </button>
                  </div>
                  {activeAssignmentChildId === child.id && (
                    <div className="mt-3 border border-[#b5d3ee] bg-white p-3 shadow-sm">
                      <label className="block text-xs font-semibold text-[#0a3d62]">
                        Therapist
                        <select
                          value={selectedTherapistId}
                          onChange={(event) => setSelectedTherapistId(event.target.value)}
                          className="mt-2 h-10 w-full rounded-md border border-[#b5d3ee] bg-white px-3 text-sm text-[#111827] outline-none focus:border-[#0071d7] focus:ring-4 focus:ring-[#0071d7]/15"
                          disabled={loadingTherapists || assigningChildId === child.id}
                        >
                          <option value="">{loadingTherapists ? "Loading therapists..." : "Select therapist"}</option>
                          {approvedTherapists.map((therapist) => (
                            <option key={therapist.id} value={therapist.id}>
                              {therapist.fullName}
                            </option>
                          ))}
                        </select>
                      </label>
                      {!loadingTherapists && approvedTherapists.length === 0 && (
                        <p className="mt-2 text-xs text-[#bd302d]">No approved therapists available.</p>
                      )}
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveAssignmentChildId(null)}
                          className="h-9 px-3 text-sm font-semibold text-[#536471] hover:text-[#111827]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!selectedTherapistId || assigningChildId === child.id}
                          onClick={() => assignTherapist(child)}
                          className="h-9 rounded-md bg-[#0a3d62] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#b5d3ee]"
                        >
                          {assigningChildId === child.id ? "Saving..." : child.therapists.length ? "Change" : "Assign"}
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-[#536471]">No child profiles found.</td>
              </tr>
            )}
          </tbody>
        </AdminTable>
      )}
      <AdminFooter />
    </div>
  );
}
