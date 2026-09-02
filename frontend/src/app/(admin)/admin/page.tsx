"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "../../components/admin/AdminChrome";
import AppButton from "../../components/ui/AppButton";
import { LoadingState } from "../../components/ui/DashboardCards";
import GlobalMessage from "../../components/ui/GlobalMessage";
import { adminApi, AdminUser } from "../../services/admin";

function formatDate(value: string | null) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-GB").replace(/\//g, "-");
}

function statusTone(user: AdminUser): "green" | "gold" | "red" | "blue" {
  if (user.accountStatus === "INACTIVE") return "red";
  if (user.accountStatus === "DORMANT") return "gold";
  if (user.role === "ADMIN") return "blue";
  return user.isApproved ? "green" : "gold";
}

function userStatusLabel(user: AdminUser) {
  if (user.accountStatus) return user.accountStatus;
  return user.role === "ADMIN" || user.isApproved ? "ACTIVE" : "PENDING";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
}

function AdminInviteModal({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await adminApi.inviteAdmin(email);
      onInvited(response.message);
      onClose();
    } catch (inviteError) {
      setError(getErrorMessage(inviteError, "Unable to send admin invite."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#152c47]/40 px-4 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-[444px] rounded-3xl bg-white p-7 shadow-2xl sm:p-10">
        <div className="mb-7 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invite modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e57373] text-[#e53935] hover:bg-[#fff0f0]"
          >
            X
          </button>
        </div>
        <h2 className="text-2xl font-semibold tracking-normal text-[#111827]">Invite a New Admin</h2>
        <div className="mt-7 space-y-6">
          <label className="block">
            <span className="text-sm font-medium text-[#111827]">Invitee&apos;s Email <span className="text-[#e53935]">*</span></span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@email.com"
              className="mt-3 h-[60px] w-full rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-base outline-none focus:border-[#0071d7] focus:ring-4 focus:ring-[#0071d7]/15"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#111827]">Special Admin Code <em className="font-normal">(Not Editable)</em></span>
            <input
              value="Sent securely by email"
              disabled
              className="mt-3 h-[60px] w-full rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-base text-[#707070]"
            />
          </label>
        </div>
        {error && <p className="mt-4 text-sm font-semibold text-[#bd302d]">{error}</p>}
        <AppButton type="submit" disabled={submitting} className="mt-7 h-[60px] w-full justify-center rounded-2xl">
          {submitting ? "Sending..." : "Send Invite Email"}
        </AppButton>
      </form>
    </div>
  );
}

type UserEditForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  areaofexpertise: string;
  isApproved: boolean;
};

function userToEditForm(user: AdminUser): UserEditForm {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email || "",
    phone: user.phone || "",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    areaofexpertise: user.areaofexpertise || "",
    isApproved: user.isApproved,
  };
}

function UserDetailsModal({ onClose, user }: { onClose: () => void; user: AdminUser }) {
  return (
    <AdminModal label={`${user.fullName} details`} onClose={onClose}>
      <h2 className="text-2xl font-semibold tracking-normal text-[#111827]">{user.fullName}</h2>
      <dl className="mt-5">
        <AdminDetailRow label="Role" value={<span className="capitalize">{user.role.toLowerCase()}</span>} />
        <AdminDetailRow label="Email / Phone" value={user.email || user.phone || "N/A"} />
        <AdminDetailRow label="Date of Birth" value={formatDate(user.dateOfBirth)} />
        <AdminDetailRow label="Age" value={user.age ? `${user.age} years old` : "N/A"} />
        <AdminDetailRow label="Status" value={<StatusPill tone={statusTone(user)}>{userStatusLabel(user)}</StatusPill>} />
        <AdminDetailRow label="Area of Expertise" value={user.areaofexpertise || "N/A"} />
        <AdminDetailRow label="Created" value={formatDate(user.createdAt)} />
      </dl>
    </AdminModal>
  );
}

function UserEditModal({
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  saving,
  user,
}: {
  error: string | null;
  form: UserEditForm;
  onChange: (field: keyof UserEditForm, value: string | boolean) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
  user: AdminUser;
}) {
  return (
    <AdminModal label={`Edit ${user.fullName}`} onClose={onClose}>
      <h2 className="text-2xl font-semibold tracking-normal text-[#111827]">Edit Platform User</h2>
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
        {user.role === "THERAPIST" && (
          <label className="block text-sm font-semibold text-[#111827]">
            Area of Expertise
            <input value={form.areaofexpertise} onChange={(event) => onChange("areaofexpertise", event.target.value)} className="mt-2 h-11 w-full border border-[#b5d3ee] px-3 font-normal outline-none focus:border-[#0071d7]" />
          </label>
        )}
        {user.role !== "ADMIN" && (
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#111827]">
            <input type="checkbox" checked={form.isApproved} onChange={(event) => onChange("isApproved", event.target.checked)} className="h-5 w-5 accent-[#0078d4]" />
            Mark account approved
          </label>
        )}
        {error && <p className="text-sm font-semibold text-[#bd302d]">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <AppButton type="button" variant="ghost" onClick={onClose}>Cancel</AppButton>
          <AppButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</AppButton>
        </div>
      </form>
    </AdminModal>
  );
}

function DeactivateUserModal({
  onClose,
  onConfirm,
  saving,
  user,
}: {
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
  user: AdminUser;
}) {
  return (
    <AdminModal label={`Deactivate ${user.fullName}`} onClose={onClose} maxWidth="max-w-[460px]">
      <h2 className="text-2xl font-semibold tracking-normal text-[#111827]">Deactivate Account</h2>
      <p className="mt-4 text-sm leading-6 text-[#536471]">
        This will deactivate {user.fullName}&apos;s account and prevent access until an administrator restores access from the backend.
      </p>
      <div className="mt-7 flex justify-end gap-3">
        <AppButton type="button" variant="ghost" onClick={onClose}>Cancel</AppButton>
        <AppButton type="button" variant="danger" disabled={saving} onClick={onConfirm}>
          {saving ? "Deactivating..." : "Deactivate"}
        </AppButton>
      </div>
    </AdminModal>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<UserEditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ variant: "error" | "success"; text: string } | null>(null);
  const showInviteModal = searchParams.get("invite") === "admin";

  useEffect(() => {
    adminApi
      .users()
      .then((data) => setUsers(data.users.map((user) => ({ ...user, fullName: `${user.firstName} ${user.lastName}` }))))
      .catch(() => setMessage({ variant: "error", text: "Unable to load platform users." }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) =>
      (roleFilter === "ALL" || user.role === roleFilter) &&
      (statusFilter === "ALL" || (statusFilter === "ACTIVE" ? user.role === "ADMIN" || user.isApproved : user.role !== "ADMIN" && !user.isApproved)) &&
      (!query || [user.fullName, user.email, user.phone, user.role, user.areaofexpertise]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)),
    );
  }, [roleFilter, search, statusFilter, users]);

  const visibleUserIds = useMemo(() => filtered.map((user) => user.id), [filtered]);
  const selectedVisibleCount = visibleUserIds.filter((id) => selectedUserIds.includes(id)).length;
  const allVisibleSelected = visibleUserIds.length > 0 && selectedVisibleCount === visibleUserIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  const toggleAllVisible = () => {
    setSelectedUserIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleUserIds.includes(id));
      return Array.from(new Set([...current, ...visibleUserIds]));
    });
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm(userToEditForm(user));
    setEditError(null);
  };

  const updateEditForm = (field: keyof UserEditForm, value: string | boolean) => {
    setEditForm((current) => current ? { ...current, [field]: value } : current);
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser || !editForm) return;

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

    setSavingUser(true);
    setEditError(null);
    try {
      const response = await adminApi.updateUser(editingUser.id, {
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        dateOfBirth: editForm.dateOfBirth || undefined,
        areaofexpertise: editingUser.role === "THERAPIST" ? editForm.areaofexpertise.trim() : undefined,
        isApproved: editingUser.role === "ADMIN" ? undefined : editForm.isApproved,
      });
      setUsers((items) =>
        items.map((item) =>
          item.id === editingUser.id
            ? { ...item, ...response.user, fullName: `${response.user.firstName} ${response.user.lastName}` }
            : item,
        ),
      );
      setMessage({ variant: "success", text: "Platform user updated." });
      setEditingUser(null);
      setEditForm(null);
    } catch (saveError) {
      setEditError(getErrorMessage(saveError, "Unable to update this platform user."));
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingUser) return;
    setSavingUser(true);
    try {
      await adminApi.deleteUser(deactivatingUser.id);
      setUsers((items) => items.filter((item) => item.id !== deactivatingUser.id));
      setSelectedUserIds((items) => items.filter((id) => id !== deactivatingUser.id));
      setMessage({ variant: "success", text: "User account deactivated." });
      setDeactivatingUser(null);
    } catch {
      setMessage({ variant: "error", text: "Unable to deactivate this user account." });
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <div className="space-y-8">
      <AdminTitle
        action={(
          <AppButton href="/admin/add-admin" variant="secondary" size="sm">
            Add New Admin
          </AppButton>
        )}
      >
        All Platform Users (Excluding Children)
      </AdminTitle>

      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}
      {showInviteModal && (
        <AdminInviteModal
          onClose={() => {
            router.replace("/admin/users");
          }}
          onInvited={(text) => setMessage({ variant: "success", text })}
        />
      )}
      {viewingUser && <UserDetailsModal user={viewingUser} onClose={() => setViewingUser(null)} />}
      {editingUser && editForm && (
        <UserEditModal
          error={editError}
          form={editForm}
          onChange={updateEditForm}
          onClose={() => {
            setEditingUser(null);
            setEditForm(null);
            setEditError(null);
          }}
          onSubmit={saveUser}
          saving={savingUser}
          user={editingUser}
        />
      )}
      {deactivatingUser && (
        <DeactivateUserModal
          onClose={() => setDeactivatingUser(null)}
          onConfirm={handleDeactivate}
          saving={savingUser}
          user={deactivatingUser}
        />
      )}
      <AdminControls search={search} setSearch={setSearch}>
        <AdminFilterSelect
          label="Filter users by role"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { label: "All Roles", value: "ALL" },
            { label: "Admins", value: "ADMIN" },
            { label: "Parents", value: "PARENT" },
            { label: "Therapists", value: "THERAPIST" },
          ]}
        />
        <AdminFilterSelect
          label="Filter users by status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "All Status", value: "ALL" },
            { label: "Active", value: "ACTIVE" },
            { label: "Pending", value: "PENDING" },
          ]}
        />
      </AdminControls>
      {selectedUserIds.length > 0 && (
        <p className="text-sm font-semibold text-[#0a3d62]">{selectedUserIds.length} platform user(s) selected</p>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable minWidth="1080px">
          <thead className="bg-[#f6fbfd] text-[#111827]">
            <tr>
              <th className="w-14 px-4 py-4">
                <SelectCell
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  label="Select all visible platform users"
                  onChange={toggleAllVisible}
                />
              </th>
              <th className="w-64 px-4 py-4">Full Name</th>
              <th className="w-64 px-4 py-4">Email / Phone Number</th>
              <th className="w-44 px-4 py-4">Date of Birth & Age</th>
              <th className="w-36 px-4 py-4">Role</th>
              <th className="w-36 px-4 py-4">Status</th>
              <th className="w-20 px-4 py-4 text-center">View</th>
              <th className="w-20 px-4 py-4 text-center">Edit</th>
              <th className="w-24 px-4 py-4 text-center">Deactivate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b5d3ee]">
            {filtered.map((user) => {
              const selected = selectedUserIds.includes(user.id);
              return (
              <tr key={user.id} className={selected ? "bg-[#f0f3f5]" : "hover:bg-[#f8fbfd]"}>
                <td className="px-4 py-4">
                  <SelectCell checked={selected} label={`Select ${user.fullName}`} onChange={() => toggleUser(user.id)} />
                </td>
                <td className="px-4 py-4 font-medium text-[#111827]">{user.fullName}</td>
                <td className="px-4 py-4">{user.email || user.phone || "N/A"}</td>
                <td className="px-4 py-4">
                  <p>{formatDate(user.dateOfBirth)}</p>
                  <p className="text-xs text-[#707070]">{user.age ?? "N/A"} years old</p>
                </td>
                <td className="px-4 py-4 capitalize">{user.role.toLowerCase()}</td>
                <td className="px-4 py-4">
                  <StatusPill tone={statusTone(user)}>{userStatusLabel(user)}</StatusPill>
                </td>
                <td className="px-4 py-4 text-center">
                  <IconButton label={`View ${user.fullName}`} onClick={() => setViewingUser(user)}>
                    <ViewIcon />
                  </IconButton>
                </td>
                <td className="px-4 py-4 text-center">
                  <IconButton label={`Edit ${user.fullName}`} onClick={() => openEditModal(user)}>
                    <EditIcon />
                  </IconButton>
                </td>
                <td className="px-4 py-4 text-center">
                  <IconButton label={`Deactivate ${user.fullName}`} tone="danger" onClick={() => setDeactivatingUser(user)}>
                    <TrashIcon />
                  </IconButton>
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[#536471]">No platform users found.</td>
              </tr>
            )}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
