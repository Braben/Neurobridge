"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppButton from "../../../components/ui/AppButton";
import {
  AdminControls,
  AdminDetailRow,
  AdminFilterSelect,
  AdminModal,
  AdminTable,
  AdminTitle,
  EditIcon,
  IconButton,
  InitialAvatar,
  SelectCell,
  StatusPill,
  TrashIcon,
} from "../../../components/admin/AdminChrome";
import { LoadingState } from "../../../components/ui/DashboardCards";
import GlobalMessage from "../../../components/ui/GlobalMessage";
import { adminApi, AdminTherapist } from "../../../services/admin";

function formatDate(value: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-GB").replace(/\//g, "-");
}

function therapistAvatar(src: string | null) {
  if (!src) return "";
  return src.startsWith("/") || src.startsWith("https://res.cloudinary.com") ? src : "";
}

function selectedCountLabel(count: number) {
  return `${count} therapist account${count === 1 ? "" : "s"} selected`;
}

function TherapistIdentity({ therapist }: { therapist: AdminTherapist }) {
  const avatar = therapistAvatar(therapist.avatar);

  return (
    <div className="flex items-center gap-3">
      {avatar ? (
        <Image src={avatar} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <InitialAvatar name={therapist.fullName} />
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-[#111827]">{therapist.fullName}</p>
        <p className="truncate text-xs text-[#707070]">{therapist.areaofexpertise || "Therapist"}</p>
      </div>
    </div>
  );
}

function AssignedChildrenCell({ onView, therapist }: { onView: () => void; therapist: AdminTherapist }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="line-clamp-1">
        {therapist.assignedChildren.length
          ? therapist.assignedChildren.map((child) => `${child.firstName} ${child.lastName}`).join(", ")
          : "No assigned children"}
      </span>
      <button
        type="button"
        onClick={onView}
        aria-label={`View assigned children for ${therapist.fullName}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#707070] hover:bg-[#eaf6fb] focus:outline-none focus:ring-2 focus:ring-[#0071d7]/30"
      >
        <EditIcon />
      </button>
    </div>
  );
}

function AssignedChildrenModal({ onClose, therapist }: { onClose: () => void; therapist: AdminTherapist }) {
  return (
    <AdminModal label={`${therapist.fullName} assigned children`} onClose={onClose} maxWidth="max-w-[640px]">
      <h2 className="text-2xl font-semibold tracking-normal text-[#111827]">Assigned Children</h2>
      <p className="mt-2 text-sm text-[#536471]">{therapist.fullName}</p>
      <div className="mt-6 border border-[#b5d3ee]">
        {therapist.assignedChildren.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#536471]">No children are currently assigned to this therapist.</p>
        ) : (
          <dl>
            {therapist.assignedChildren.map((child) => (
              <AdminDetailRow
                key={child.id}
                label={`${child.firstName} ${child.lastName}`}
                value={(
                  <Link href={`/admin/children/${child.id}`} className="font-semibold text-[#0078d4] hover:underline">
                    View full child profile
                  </Link>
                )}
              />
            ))}
          </dl>
        )}
      </div>
      <div className="mt-6 flex justify-end">
        <AppButton href="/admin/children" variant="secondary" size="sm">
          Manage Assignments
        </AppButton>
      </div>
    </AdminModal>
  );
}

function SelectionToolbar({
  count,
  onApprove,
  onClear,
  onDelete,
}: {
  count: number;
  onApprove: () => void;
  onClear: () => void;
  onDelete: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-[#b5d3ee] bg-[#f6fbfd] px-4 py-3">
      <p className="text-sm font-semibold text-[#0a3d62]">{selectedCountLabel(count)}</p>
      <div className="flex flex-wrap gap-2">
        <AppButton size="sm" variant="secondary" onClick={onApprove}>Approve Selected</AppButton>
        <AppButton size="sm" variant="danger" onClick={onDelete}>Delete Selected</AppButton>
        <AppButton size="sm" variant="ghost" onClick={onClear}>Clear</AppButton>
      </div>
    </div>
  );
}

function TherapistAccountRow({
  isSelected,
  onApprove,
  onDelete,
  onToggle,
  onViewChildren,
  therapist,
}: {
  isSelected: boolean;
  onApprove: (therapist: AdminTherapist) => void;
  onDelete: (therapist: AdminTherapist) => void;
  onToggle: (id: string) => void;
  onViewChildren: (therapist: AdminTherapist) => void;
  therapist: AdminTherapist;
}) {
  return (
    <tr className={isSelected ? "bg-[#f0f3f5]" : "hover:bg-[#f8fbfd]"}>
      <td className="px-4 py-4">
        <SelectCell checked={isSelected} label={`Select ${therapist.fullName}`} onChange={() => onToggle(therapist.id)} />
      </td>
      <td className="px-4 py-4">
        <TherapistIdentity therapist={therapist} />
      </td>
      <td className="px-4 py-4">
        <p>{formatDate(therapist.dateOfBirth)}</p>
        <p className="text-xs text-[#707070]">{therapist.age ?? "N/A"} years old</p>
      </td>
      <td className="px-4 py-4">{therapist.email || therapist.phone || "N/A"}</td>
      <td className="px-4 py-4">
        <AssignedChildrenCell therapist={therapist} onView={() => onViewChildren(therapist)} />
      </td>
      <td className="px-4 py-4">{therapist.assignedChildrenCount}</td>
      <td className="px-4 py-4">{therapist.bookingsCount}</td>
      <td className="px-4 py-4 text-center">
        {therapist.isApproved ? (
          <StatusPill tone="green">Approved</StatusPill>
        ) : (
          <AppButton size="sm" variant="secondary" onClick={() => onApprove(therapist)}>
            Approve
          </AppButton>
        )}
      </td>
      <td className="px-4 py-4 text-center">
        <IconButton label={`Delete ${therapist.fullName}`} tone="danger" onClick={() => onDelete(therapist)}>
          <TrashIcon />
        </IconButton>
      </td>
    </tr>
  );
}

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<AdminTherapist[]>([]);
  const [search, setSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState("ALL");
  const [selectedTherapistIds, setSelectedTherapistIds] = useState<string[]>([]);
  const [viewingChildrenFor, setViewingChildrenFor] = useState<AdminTherapist | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ variant: "error" | "success"; text: string } | null>(null);

  const loadTherapists = (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    adminApi
      .therapists()
      .then((data) => {
        setTherapists(data.therapists);
        setMessage(null);
      })
      .catch(() => setMessage({ variant: "error", text: "Unable to load therapist accounts." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    adminApi
      .therapists()
      .then((data) => {
        if (!active) return;
        setTherapists(data.therapists);
        setMessage(null);
      })
      .catch(() => {
        if (active) setMessage({ variant: "error", text: "Unable to load therapist accounts." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return therapists.filter((therapist) => {
      const children = therapist.assignedChildren.map((child) => `${child.firstName} ${child.lastName}`).join(" ");
      return (
        (approvalFilter === "ALL" || (approvalFilter === "APPROVED" ? therapist.isApproved : !therapist.isApproved)) &&
        (assignmentFilter === "ALL" || (assignmentFilter === "ASSIGNED" ? therapist.assignedChildrenCount > 0 : therapist.assignedChildrenCount === 0)) &&
        (!query || [therapist.fullName, therapist.email, therapist.phone, therapist.areaofexpertise, children]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query))
      );
    });
  }, [approvalFilter, assignmentFilter, therapists, search]);

  const visibleTherapistIds = useMemo(() => filtered.map((therapist) => therapist.id), [filtered]);
  const selectedVisibleCount = visibleTherapistIds.filter((id) => selectedTherapistIds.includes(id)).length;
  const allVisibleSelected = visibleTherapistIds.length > 0 && selectedVisibleCount === visibleTherapistIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  const toggleAllVisible = () => {
    setSelectedTherapistIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleTherapistIds.includes(id));
      return Array.from(new Set([...current, ...visibleTherapistIds]));
    });
  };

  const toggleTherapist = (id: string) => {
    setSelectedTherapistIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const handleApprove = async (therapist: AdminTherapist) => {
    try {
      await adminApi.approveTherapist(therapist.id);
      setMessage({ variant: "success", text: "Therapist approved." });
      loadTherapists();
    } catch {
      setMessage({ variant: "error", text: "Unable to approve this therapist." });
    }
  };

  const selectedTherapists = useMemo(
    () => therapists.filter((therapist) => selectedTherapistIds.includes(therapist.id)),
    [selectedTherapistIds, therapists],
  );

  const handleApproveSelected = async () => {
    const pending = selectedTherapists.filter((therapist) => !therapist.isApproved);
    if (pending.length === 0) {
      setMessage({ variant: "success", text: "Selected therapists are already approved." });
      return;
    }

    try {
      await Promise.all(pending.map((therapist) => adminApi.approveTherapist(therapist.id)));
      setMessage({ variant: "success", text: `${pending.length} therapist account(s) approved.` });
      setSelectedTherapistIds([]);
      loadTherapists();
    } catch {
      setMessage({ variant: "error", text: "Unable to approve the selected therapist accounts." });
    }
  };

  const handleDelete = async (therapist: AdminTherapist) => {
    if (!window.confirm(`Delete ${therapist.fullName}? This will deactivate the account.`)) return;
    try {
      await adminApi.deleteUser(therapist.id);
      setTherapists((items) => items.filter((item) => item.id !== therapist.id));
      setMessage({ variant: "success", text: "Therapist account deleted." });
    } catch {
      setMessage({ variant: "error", text: "Unable to delete this therapist account." });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTherapists.length === 0) return;
    if (!window.confirm(`Delete ${selectedTherapists.length} selected therapist account(s)? This will deactivate those accounts.`)) return;
    try {
      await Promise.all(selectedTherapists.map((therapist) => adminApi.deleteUser(therapist.id)));
      setTherapists((items) => items.filter((item) => !selectedTherapistIds.includes(item.id)));
      setSelectedTherapistIds([]);
      setMessage({ variant: "success", text: "Selected therapist accounts deleted." });
    } catch {
      setMessage({ variant: "error", text: "Unable to delete the selected therapist accounts." });
    }
  };

  return (
    <div className="space-y-8">
      <AdminTitle>Therapists Accounts</AdminTitle>
      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}
      {viewingChildrenFor && (
        <AssignedChildrenModal therapist={viewingChildrenFor} onClose={() => setViewingChildrenFor(null)} />
      )}
      <AdminControls search={search} setSearch={setSearch} verb="Filter by">
        <AdminFilterSelect
          label="Filter therapists by approval"
          value={approvalFilter}
          onChange={setApprovalFilter}
          options={[
            { label: "All Approval", value: "ALL" },
            { label: "Approved", value: "APPROVED" },
            { label: "Pending", value: "PENDING" },
          ]}
        />
        <AdminFilterSelect
          label="Filter therapists by assignment"
          value={assignmentFilter}
          onChange={setAssignmentFilter}
          options={[
            { label: "All Assignments", value: "ALL" },
            { label: "Assigned", value: "ASSIGNED" },
            { label: "Unassigned", value: "UNASSIGNED" },
          ]}
        />
      </AdminControls>
      <SelectionToolbar
        count={selectedTherapistIds.length}
        onApprove={handleApproveSelected}
        onClear={() => setSelectedTherapistIds([])}
        onDelete={handleDeleteSelected}
      />

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable minWidth="1180px">
          <thead className="bg-[#f6fbfd] text-[#111827]">
            <tr>
              <th className="w-14 px-4 py-4">
                <SelectCell
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  label="Select all visible therapist accounts"
                  onChange={toggleAllVisible}
                />
              </th>
              <th className="w-64 px-4 py-4">Therapist&apos;s Full Name & Image</th>
              <th className="w-44 px-4 py-4">Date of Birth & Age</th>
              <th className="w-64 px-4 py-4">Email / Phone Number</th>
              <th className="px-4 py-4">Assigned Child(ren)&apos;s Name(s)</th>
              <th className="w-44 px-4 py-4">No of Assigned Children</th>
              <th className="w-40 px-4 py-4">Number of Bookings</th>
              <th className="w-36 px-4 py-4 text-center">Approval</th>
              <th className="w-20 px-4 py-4 text-center">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b5d3ee]">
            {filtered.map((therapist) => (
              <TherapistAccountRow
                key={therapist.id}
                isSelected={selectedTherapistIds.includes(therapist.id)}
                onApprove={handleApprove}
                onDelete={handleDelete}
                onToggle={toggleTherapist}
                onViewChildren={setViewingChildrenFor}
                therapist={therapist}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-[#536471]" colSpan={9}>
                  No therapist accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
