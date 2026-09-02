"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminControls,
  AdminDetailRow,
  AdminFilterSelect,
  AdminModal,
  AdminTable,
  AdminTitle,
  EditIcon,
  IconButton,
  SelectCell,
  StatusPill,
  TrashIcon,
  ViewIcon,
} from "../../../components/admin/AdminChrome";
import AppButton from "../../../components/ui/AppButton";
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

type ParentEditForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
};

function parentToForm(parent: AdminParent): ParentEditForm {
  return {
    firstName: parent.firstName,
    lastName: parent.lastName,
    email: parent.email || "",
    phone: parent.phone || "",
    dateOfBirth: parent.dateOfBirth ? parent.dateOfBirth.slice(0, 10) : "",
  };
}

function ParentDetailsModal({ onClose, parent }: { onClose: () => void; parent: AdminParent }) {
  return (
    <AdminModal label={`${parent.fullName} details`} onClose={onClose}>
      <h2 className="text-2xl font-semibold tracking-normal text-[#111827]">{parent.fullName}</h2>
      <dl className="mt-5">
        <AdminDetailRow label="Email / Phone" value={parent.email || parent.phone || "N/A"} />
        <AdminDetailRow label="Date of Birth" value={formatDate(parent.dateOfBirth)} />
        <AdminDetailRow label="Age" value={parent.age ? `${parent.age} years old` : "N/A"} />
        <AdminDetailRow label="Account Status" value={<StatusPill tone={statusTone(parent.accountStatus)}>{parent.accountStatus || "INACTIVE"}</StatusPill>} />
        <AdminDetailRow
          label="Children"
          value={parent.children.length ? parent.children.map((child) => `${child.firstName} ${child.lastName}`).join(", ") : "No child profiles"}
        />
      </dl>
    </AdminModal>
  );
}

function ParentEditModal({
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  saving,
  parent,
}: {
  error: string | null;
  form: ParentEditForm;
  onChange: (field: keyof ParentEditForm, value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
  parent: AdminParent;
}) {
  return (
    <AdminModal label={`Edit ${parent.fullName}`} onClose={onClose}>
      <h2 className="text-2xl font-semibold tracking-normal text-[#111827]">Edit Parent Account</h2>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[#111827]">
            First Name
            <input value={form.firstName} onChange={(event) => onChange("firstName", event.target.value)} required minLength={2} className="mt-2 h-11 w-full border border-[#b5d3ee] px-3 font-normal outline-none focus:border-[#0071d7]" />
          </label>
          <label className="block text-sm font-semibold text-[#111827]">
            Last Name
            <input value={form.lastName} onChange={(event) => onChange("lastName", event.target.value)} required minLength={2} className="mt-2 h-11 w-full border border-[#b5d3ee] px-3 font-normal outline-none focus:border-[#0071d7]" />
          </label>
        </div>
        <label className="block text-sm font-semibold text-[#111827]">
          Email
          <input type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} className="mt-2 h-11 w-full border border-[#b5d3ee] px-3 font-normal outline-none focus:border-[#0071d7]" />
        </label>
        <label className="block text-sm font-semibold text-[#111827]">
          Phone
          <input value={form.phone} onChange={(event) => onChange("phone", event.target.value)} className="mt-2 h-11 w-full border border-[#b5d3ee] px-3 font-normal outline-none focus:border-[#0071d7]" />
        </label>
        <label className="block text-sm font-semibold text-[#111827]">
          Date of Birth
          <input type="date" value={form.dateOfBirth} onChange={(event) => onChange("dateOfBirth", event.target.value)} className="mt-2 h-11 w-full border border-[#b5d3ee] px-3 font-normal outline-none focus:border-[#0071d7]" />
        </label>
        {error && <p className="text-sm font-semibold text-[#bd302d]">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <AppButton type="button" variant="ghost" onClick={onClose}>Cancel</AppButton>
          <AppButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</AppButton>
        </div>
      </form>
    </AdminModal>
  );
}

function ParentDeactivateModal({
  onClose,
  onConfirm,
  saving,
  parent,
}: {
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
  parent: AdminParent;
}) {
  return (
    <AdminModal label={`Deactivate ${parent.fullName}`} onClose={onClose} maxWidth="max-w-[460px]">
      <h2 className="text-2xl font-semibold tracking-normal text-[#111827]">Deactivate Parent Account</h2>
      <p className="mt-4 text-sm leading-6 text-[#536471]">
        This will deactivate {parent.fullName}&apos;s account and block parent access to child records until restored by an administrator.
      </p>
      <div className="mt-7 flex justify-end gap-3">
        <AppButton type="button" variant="ghost" onClick={onClose}>Cancel</AppButton>
        <AppButton type="button" variant="danger" disabled={saving} onClick={onConfirm}>{saving ? "Deactivating..." : "Deactivate"}</AppButton>
      </div>
    </AdminModal>
  );
}

export default function AdminParentsPage() {
  const [parents, setParents] = useState<AdminParent[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [childFilter, setChildFilter] = useState("ALL");
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [viewingParent, setViewingParent] = useState<AdminParent | null>(null);
  const [editingParent, setEditingParent] = useState<AdminParent | null>(null);
  const [deactivatingParent, setDeactivatingParent] = useState<AdminParent | null>(null);
  const [editForm, setEditForm] = useState<ParentEditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingParent, setSavingParent] = useState(false);
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
    return parents.filter((parent) => {
      const children = parent.children.map((child) => `${child.firstName} ${child.lastName}`).join(" ");
      return (
        (statusFilter === "ALL" || parent.accountStatus === statusFilter) &&
        (childFilter === "ALL" || (childFilter === "HAS_CHILDREN" ? parent.children.length > 0 : parent.children.length === 0)) &&
        (!query || [parent.fullName, parent.email, parent.phone, children].filter(Boolean).join(" ").toLowerCase().includes(query))
      );
    });
  }, [childFilter, parents, search, statusFilter]);

  const visibleParentIds = useMemo(() => filtered.map((parent) => parent.id), [filtered]);
  const selectedVisibleCount = visibleParentIds.filter((id) => selectedParentIds.includes(id)).length;
  const allVisibleSelected = visibleParentIds.length > 0 && selectedVisibleCount === visibleParentIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  const toggleAllVisible = () => {
    setSelectedParentIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleParentIds.includes(id));
      return Array.from(new Set([...current, ...visibleParentIds]));
    });
  };

  const toggleParent = (id: string) => {
    setSelectedParentIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const openEditParent = (parent: AdminParent) => {
    setEditingParent(parent);
    setEditForm(parentToForm(parent));
    setEditError(null);
  };

  const updateEditForm = (field: keyof ParentEditForm, value: string) => {
    setEditForm((current) => current ? { ...current, [field]: value } : current);
  };

  const saveParent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingParent || !editForm) return;
    const firstName = editForm.firstName.trim();
    const lastName = editForm.lastName.trim();
    const email = editForm.email.trim();
    const phone = editForm.phone.trim();

    if (firstName.length < 2 || lastName.length < 2) {
      setEditError("First name and last name must be at least 2 characters.");
      return;
    }
    if (!email && !phone) {
      setEditError("Provide either an email address or phone number.");
      return;
    }

    setSavingParent(true);
    setEditError(null);
    try {
      const response = await adminApi.updateUser(editingParent.id, {
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        dateOfBirth: editForm.dateOfBirth || undefined,
      });
      setParents((items) =>
        items.map((item) =>
          item.id === editingParent.id
            ? { ...item, ...response.user, fullName: `${response.user.firstName} ${response.user.lastName}` }
            : item,
        ),
      );
      setMessage({ variant: "success", text: "Parent account updated." });
      setEditingParent(null);
      setEditForm(null);
    } catch {
      setEditError("Unable to update this parent account.");
    } finally {
      setSavingParent(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingParent) return;
    setSavingParent(true);
    try {
      await adminApi.deleteUser(deactivatingParent.id);
      setParents((items) => items.filter((item) => item.id !== deactivatingParent.id));
      setSelectedParentIds((items) => items.filter((id) => id !== deactivatingParent.id));
      setMessage({ variant: "success", text: "Parent account deactivated." });
      setDeactivatingParent(null);
    } catch {
      setMessage({ variant: "error", text: "Unable to deactivate this parent account." });
    } finally {
      setSavingParent(false);
    }
  };

  return (
    <div className="space-y-8">
      <AdminTitle>Parents&apos; Accounts</AdminTitle>
      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}
      {viewingParent && <ParentDetailsModal parent={viewingParent} onClose={() => setViewingParent(null)} />}
      {editingParent && editForm && (
        <ParentEditModal
          error={editError}
          form={editForm}
          onChange={updateEditForm}
          onClose={() => {
            setEditingParent(null);
            setEditForm(null);
            setEditError(null);
          }}
          onSubmit={saveParent}
          parent={editingParent}
          saving={savingParent}
        />
      )}
      {deactivatingParent && (
        <ParentDeactivateModal
          onClose={() => setDeactivatingParent(null)}
          onConfirm={handleDeactivate}
          parent={deactivatingParent}
          saving={savingParent}
        />
      )}
      <AdminControls search={search} setSearch={setSearch} verb="Filter by">
        <AdminFilterSelect
          label="Filter parents by account status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "All Status", value: "ALL" },
            { label: "Active", value: "ACTIVE" },
            { label: "Dormant", value: "DORMANT" },
            { label: "Inactive", value: "INACTIVE" },
          ]}
        />
        <AdminFilterSelect
          label="Filter parents by child profiles"
          value={childFilter}
          onChange={setChildFilter}
          options={[
            { label: "All Profiles", value: "ALL" },
            { label: "Has Children", value: "HAS_CHILDREN" },
            { label: "No Children", value: "NO_CHILDREN" },
          ]}
        />
      </AdminControls>
      {selectedParentIds.length > 0 && (
        <p className="text-sm font-semibold text-[#0a3d62]">{selectedParentIds.length} parent account(s) selected</p>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable minWidth="1120px">
          <thead className="bg-[#f6fbfd] text-[#111827]">
            <tr>
              <th className="w-14 px-4 py-4">
                <SelectCell
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  label="Select all visible parent accounts"
                  onChange={toggleAllVisible}
                />
              </th>
              <th className="w-48 px-4 py-4">Parent&apos;s Full Name</th>
              <th className="w-44 px-4 py-4">Date of Birth & Age</th>
              <th className="w-64 px-4 py-4">Email / Phone Number</th>
              <th className="px-4 py-4">Children&apos;s Name(s)</th>
              <th className="w-40 px-4 py-4 text-center">Account Status</th>
              <th className="w-20 px-4 py-4 text-center">View</th>
              <th className="w-20 px-4 py-4 text-center">Edit</th>
              <th className="w-24 px-4 py-4 text-center">Deactivate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b5d3ee]">
            {filtered.map((parent) => {
              const selected = selectedParentIds.includes(parent.id);
              return (
              <tr key={parent.id} className={selected ? "bg-[#f0f3f5]" : "hover:bg-[#f8fbfd]"}>
                <td className="px-4 py-4">
                  <SelectCell checked={selected} label={`Select ${parent.fullName}`} onChange={() => toggleParent(parent.id)} />
                </td>
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
                  <IconButton label={`View ${parent.fullName}`} onClick={() => setViewingParent(parent)}>
                    <ViewIcon />
                  </IconButton>
                </td>
                <td className="px-4 py-4 text-center">
                  <IconButton label={`Edit ${parent.fullName}`} onClick={() => openEditParent(parent)}>
                    <EditIcon />
                  </IconButton>
                </td>
                <td className="px-4 py-4 text-center">
                  <IconButton label={`Deactivate ${parent.fullName}`} tone="danger" onClick={() => setDeactivatingParent(parent)}>
                    <TrashIcon />
                  </IconButton>
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[#536471]">No parent accounts found.</td>
              </tr>
            )}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
