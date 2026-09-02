"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AdminControls,
  AdminFilterSelect,
  AdminTable,
  AdminTitle,
  SelectCell,
  ViewIcon,
} from "../../../components/admin/AdminChrome";
import { LoadingState } from "../../../components/ui/DashboardCards";
import GlobalMessage from "../../../components/ui/GlobalMessage";
import { MessageCircleIcon } from "../../../components/ui/Icons";
import { useAppSelector } from "../../../hooks/useRedux";
import { Conversation, messagesApi } from "../../../services/messages";

type ComplaintRow = {
  id: string;
  fullName: string;
  contact: string;
  message: string;
  role: string;
  senderId: string;
};

function roleBadgeClass(role: string) {
  if (role === "ADMIN") return "bg-[#99d6d5] text-[#111827]";
  if (role === "THERAPIST") return "bg-[#69b5ff] text-[#111827]";
  return "bg-[#b0bec5] text-[#111827]";
}

function conversationToComplaint(conversation: Conversation, currentUserId?: string): ComplaintRow {
  const lastMessage = conversation.messages[0];
  const senderParticipant = conversation.participants.find((participant) => participant.user.id === lastMessage?.senderId);
  const fallbackParticipant = conversation.participants.find((participant) => participant.user.id !== currentUserId);
  const sender = senderParticipant?.user || fallbackParticipant?.user || conversation.participants[0]?.user;

  return {
    id: conversation.id,
    fullName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown user",
    contact: sender?.email || sender?.phone || "N/A",
    message: lastMessage?.content || "No message preview available.",
    role: sender?.role || "PARENT",
    senderId: sender?.id || conversation.id,
  };
}

export default function AdminComplaintsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedComplaintIds, setSelectedComplaintIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ variant: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    messagesApi
      .listConversations()
      .then((data) => setConversations(data.conversations))
      .catch(() => setMessage({ variant: "error", text: "Unable to load user complaints." }))
      .finally(() => setLoading(false));
  }, []);

  const complaints = useMemo(
    () => conversations.map((conversation) => conversationToComplaint(conversation, user?.id)),
    [conversations, user?.id],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return complaints.filter((complaint) =>
      (roleFilter === "ALL" || complaint.role === roleFilter) &&
      (!query || [complaint.fullName, complaint.contact, complaint.role, complaint.message]
        .join(" ")
        .toLowerCase()
        .includes(query)),
    );
  }, [complaints, roleFilter, search]);

  const visibleComplaintIds = useMemo(() => filtered.map((complaint) => complaint.id), [filtered]);
  const selectedVisibleCount = visibleComplaintIds.filter((id) => selectedComplaintIds.includes(id)).length;
  const allVisibleSelected = visibleComplaintIds.length > 0 && selectedVisibleCount === visibleComplaintIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  const toggleAllVisible = () => {
    setSelectedComplaintIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleComplaintIds.includes(id));
      return Array.from(new Set([...current, ...visibleComplaintIds]));
    });
  };

  const toggleComplaint = (id: string) => {
    setSelectedComplaintIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <div className="space-y-8">
      <AdminTitle>User Complaints</AdminTitle>
      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}
      <AdminControls search={search} setSearch={setSearch} verb="Sort by">
        <AdminFilterSelect
          label="Filter complaints by platform role"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { label: "All Roles", value: "ALL" },
            { label: "Parents", value: "PARENT" },
            { label: "Therapists", value: "THERAPIST" },
            { label: "Admins", value: "ADMIN" },
          ]}
        />
      </AdminControls>
      {selectedComplaintIds.length > 0 && (
        <p className="text-sm font-semibold text-[#0a3d62]">{selectedComplaintIds.length} complaint(s) selected</p>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable minWidth="1120px">
          <thead className="bg-white text-[#111827]">
            <tr>
              <th className="w-14 px-4 py-4">
                <SelectCell
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected}
                  label="Select all visible complaints"
                  onChange={toggleAllVisible}
                />
              </th>
              <th className="w-56 px-4 py-4">Full Name</th>
              <th className="w-72 px-4 py-4">Sender Email</th>
              <th className="w-44 px-4 py-4 text-center">Platform Role</th>
              <th className="px-4 py-4">Message</th>
              <th className="w-24 px-4 py-4 text-center">View</th>
              <th className="w-24 px-4 py-4 text-center">Reply</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((complaint) => {
              const selected = selectedComplaintIds.includes(complaint.id);
              return (
                <tr key={complaint.id} className={selected ? "bg-[#e0e0e0]" : "hover:bg-[#f8fbfd]"}>
                  <td className="px-4 py-3">
                    <SelectCell checked={selected} label={`Select complaint from ${complaint.fullName}`} onChange={() => toggleComplaint(complaint.id)} />
                  </td>
                  <td className="px-4 py-3 font-medium text-[#111827]">{complaint.fullName}</td>
                  <td className="px-4 py-3">{complaint.contact}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-xl px-2 py-1 text-xs ${roleBadgeClass(complaint.role)}`}>
                      {complaint.role.charAt(0) + complaint.role.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="line-clamp-1">{complaint.message}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/admin/messages/${complaint.id}`} aria-label={`View complaint from ${complaint.fullName}`}>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#707070] hover:bg-[#eaf6fb]">
                        <ViewIcon />
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/admin/messages/${complaint.id}`} aria-label={`Reply to ${complaint.fullName}`}>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#0071d7] hover:bg-[#eaf6fb]">
                        <MessageCircleIcon className="h-5 w-5" />
                      </span>
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#536471]">No user complaints found.</td>
              </tr>
            )}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
