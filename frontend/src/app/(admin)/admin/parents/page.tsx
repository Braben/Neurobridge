"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminControls,
  AdminTable,
  AdminTitle,
  EditIcon,
  IconButton,
  SelectCell,
  StatusPill,
  TrashIcon,
} from "../../../components/admin/AdminChrome";
import { LoadingState } from "../../../components/ui/DashboardCards";
import GlobalMessage from "../../../components/ui/GlobalMessage";
import { adminApi, AdminParent } from "../../../services/admin";

function formatDate(value: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-GB").replace(/\//g, "-");
}

function statusTone(status?: string): "green" | "gold" | "red" {
  if (status === "ACTIVE") return "green";
  if (status === "DORMANT") return "gold";
  return "red";
}

export default function AdminParentsPage() {
  const [parents, setParents] = useState<AdminParent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ variant: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    adminApi
      .parents()
      .then((data) => setParents(data.parents))
      .catch(() => setMessage({ variant: "error", text: "Unable to load parent accounts." }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return parents;
    return parents.filter((parent) => {
      const children = parent.children.map((child) => `${child.firstName} ${child.lastName}`).join(" ");
      return [parent.fullName, parent.email, parent.phone, children].filter(Boolean).join(" ").toLowerCase().includes(query);
    });
  }, [parents, search]);

  const handleDelete = async (parent: AdminParent) => {
    if (!window.confirm(`Delete ${parent.fullName}? This will deactivate the account.`)) return;
    try {
      await adminApi.deleteUser(parent.id);
      setParents((items) => items.filter((item) => item.id !== parent.id));
      setMessage({ variant: "success", text: "Parent account deleted." });
    } catch {
      setMessage({ variant: "error", text: "Unable to delete this parent account." });
    }
  };

  return (
    <div className="space-y-8">
      <AdminTitle>Parents&apos; Accounts</AdminTitle>
      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}
      <AdminControls search={search} setSearch={setSearch} verb="Sort by" />

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable minWidth="1120px">
          <thead className="bg-[#f6fbfd] text-[#111827]">
            <tr>
              <th className="w-14 px-4 py-4"><SelectCell /></th>
              <th className="w-48 px-4 py-4">Parent&apos;s Full Name</th>
              <th className="w-44 px-4 py-4">Date of Birth & Age</th>
              <th className="w-64 px-4 py-4">Email / Phone Number</th>
              <th className="px-4 py-4">Children&apos;s Name(s)</th>
              <th className="w-40 px-4 py-4 text-center">Account Status</th>
              <th className="w-20 px-4 py-4 text-center">Edit</th>
              <th className="w-20 px-4 py-4 text-center">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b5d3ee]">
            {filtered.map((parent, index) => (
              <tr key={parent.id} className={index === 1 ? "bg-[#f0f3f5]" : "hover:bg-[#f8fbfd]"}>
                <td className="px-4 py-4"><SelectCell checked={index === 1} /></td>
                <td className="px-4 py-4 font-medium text-[#111827]">{parent.fullName}</td>
                <td className="px-4 py-4">
                  <p>{formatDate(parent.dateOfBirth)}</p>
                  <p className="text-xs text-[#707070]">{parent.age ?? "N/A"} years old</p>
                </td>
                <td className="px-4 py-4">{parent.email || parent.phone || "N/A"}</td>
                <td className="px-4 py-4">
                  {parent.children.length
                    ? parent.children.map((child) => `${child.firstName} ${child.lastName}`).join(", ")
                    : "No child profiles"}
                </td>
                <td className="px-4 py-4 text-center">
                  <StatusPill tone={statusTone(parent.accountStatus)}>{parent.accountStatus || "INACTIVE"}</StatusPill>
                </td>
                <td className="px-4 py-4 text-center">
                  <IconButton label={`Edit ${parent.fullName}`}>
                    <EditIcon />
                  </IconButton>
                </td>
                <td className="px-4 py-4 text-center">
                  <IconButton label={`Delete ${parent.fullName}`} tone="danger" onClick={() => handleDelete(parent)}>
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
