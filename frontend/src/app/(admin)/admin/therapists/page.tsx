"use client";

import { useEffect, useMemo, useState } from "react";
import AppButton from "../../../components/ui/AppButton";
import {
  AdminControls,
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

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<AdminTherapist[]>([]);
  const [search, setSearch] = useState("");
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
    if (!query) return therapists;
    return therapists.filter((therapist) => {
      const children = therapist.assignedChildren.map((child) => `${child.firstName} ${child.lastName}`).join(" ");
      return [therapist.fullName, therapist.email, therapist.phone, therapist.areaofexpertise, children]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [therapists, search]);

  const handleApprove = async (therapist: AdminTherapist) => {
    try {
      await adminApi.approveTherapist(therapist.id);
      setMessage({ variant: "success", text: "Therapist approved." });
      loadTherapists();
    } catch {
      setMessage({ variant: "error", text: "Unable to approve this therapist." });
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

  return (
    <div className="space-y-8">
      <AdminTitle>Therapists Accounts</AdminTitle>
      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}
      <AdminControls search={search} setSearch={setSearch} verb="Sort by" />

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable minWidth="1180px">
          <thead className="bg-[#f6fbfd] text-[#111827]">
            <tr>
              <th className="w-14 px-4 py-4"><SelectCell /></th>
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
            {filtered.map((therapist, index) => (
              <tr key={therapist.id} className={index === 1 ? "bg-[#f0f3f5]" : "hover:bg-[#f8fbfd]"}>
                <td className="px-4 py-4"><SelectCell checked={index === 1} /></td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <InitialAvatar name={therapist.fullName} />
                    <div>
                      <p className="font-medium text-[#111827]">{therapist.fullName}</p>
                      <p className="text-xs text-[#707070]">{therapist.areaofexpertise || "Therapist"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p>{formatDate(therapist.dateOfBirth)}</p>
                  <p className="text-xs text-[#707070]">{therapist.age ?? "N/A"} years old</p>
                </td>
                <td className="px-4 py-4">{therapist.email || therapist.phone || "N/A"}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="line-clamp-1">
                      {therapist.assignedChildren.length
                        ? therapist.assignedChildren.map((child) => `${child.firstName} ${child.lastName}`).join(", ")
                        : "No assigned children"}
                    </span>
                    <IconButton label={`Edit assignments for ${therapist.fullName}`}>
                      <EditIcon />
                    </IconButton>
                  </div>
                </td>
                <td className="px-4 py-4">{therapist.assignedChildrenCount}</td>
                <td className="px-4 py-4">{therapist.bookingsCount}</td>
                <td className="px-4 py-4 text-center">
                  {therapist.isApproved ? (
                    <StatusPill tone="green">Approved</StatusPill>
                  ) : (
                    <AppButton size="sm" variant="secondary" onClick={() => handleApprove(therapist)}>
                      Approve
                    </AppButton>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  <IconButton label={`Delete ${therapist.fullName}`} tone="danger" onClick={() => handleDelete(therapist)}>
                    <TrashIcon />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
