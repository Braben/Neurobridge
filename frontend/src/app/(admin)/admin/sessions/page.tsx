"use client";

import { useEffect, useMemo, useState } from "react";
import AppButton from "../../../components/ui/AppButton";
import {
  AdminControls,
  AdminTable,
  AdminTitle,
  IconButton,
  InitialAvatar,
  SelectCell,
  StatusPill,
  ViewIcon,
} from "../../../components/admin/AdminChrome";
import { LoadingState } from "../../../components/ui/DashboardCards";
import { FormField } from "../../../components/ui/FormField";
import GlobalMessage from "../../../components/ui/GlobalMessage";
import { adminApi, AdminTherapySession, PaymentState } from "../../../services/admin";
import { bookingsApi } from "../../../services/bookings";

function formatSessionDate(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-GB").replace(/\//g, "-"),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

function paymentTone(status: PaymentState): "green" | "gold" | "red" {
  if (status === "PAID") return "green";
  if (status === "PENDING") return "gold";
  return "red";
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<AdminTherapySession[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<AdminTherapySession | null>(null);
  const [specificDate, setSpecificDate] = useState("");
  const [startTime, setStartTime] = useState("15:00");
  const [endTime, setEndTime] = useState("16:00");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ variant: "error" | "success"; text: string } | null>(null);

  const loadSessions = (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    adminApi
      .sessions()
      .then((data) => setSessions(data.sessions))
      .catch(() => setMessage({ variant: "error", text: "Unable to load therapy sessions." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    adminApi
      .sessions()
      .then((data) => {
        if (active) setSessions(data.sessions);
      })
      .catch(() => {
        if (active) setMessage({ variant: "error", text: "Unable to load therapy sessions." });
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
    if (!query) return sessions;
    return sessions.filter((session) =>
      [
        session.child.fullName,
        session.therapist.fullName,
        session.sessionType,
        session.paymentStatus,
        session.bookingStatus,
        session.notePreview,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [sessions, search]);

  const openReschedule = (session: AdminTherapySession) => {
    const date = new Date(session.sessionDate).toISOString().slice(0, 10);
    setActiveSession(session);
    setSpecificDate(date);
    setStartTime(session.startTime || "15:00");
    setEndTime(session.endTime || "16:00");
  };

  const handleReschedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeSession) return;
    setSaving(true);
    try {
      await adminApi.rescheduleBooking(activeSession.bookingId, {
        specificDate: `${specificDate}T00:00:00.000Z`,
        startTime,
        endTime,
      });
      setMessage({ variant: "success", text: "Session rescheduled." });
      setActiveSession(null);
      loadSessions();
    } catch {
      setMessage({ variant: "error", text: "Unable to reschedule this session." });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (session: AdminTherapySession) => {
    if (!window.confirm(`Cancel the session for ${session.child.fullName}?`)) return;
    try {
      await bookingsApi.updateStatus(session.bookingId, "CANCELLED");
      setMessage({ variant: "success", text: "Session cancelled." });
      loadSessions();
    } catch {
      setMessage({ variant: "error", text: "Unable to cancel this session." });
    }
  };

  return (
    <div className="space-y-8">
      <AdminTitle>Therapy & Session Management</AdminTitle>
      {message && <GlobalMessage variant={message.variant}>{message.text}</GlobalMessage>}

      {activeSession && (
        <form onSubmit={handleReschedule} className="grid gap-4 rounded-md border border-[#b5d3ee] bg-white p-5 shadow-sm md:grid-cols-[1fr_160px_160px_auto] md:items-end">
          <FormField label="New Session Date" name="specificDate" type="date" required value={specificDate} onChange={(event) => setSpecificDate(event.target.value)} />
          <FormField label="Start Time" name="startTime" type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          <FormField label="End Time" name="endTime" type="time" required value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          <div className="flex gap-2">
            <AppButton type="submit" disabled={saving}>{saving ? "Saving" : "Save"}</AppButton>
            <AppButton variant="ghost" onClick={() => setActiveSession(null)}>Cancel</AppButton>
          </div>
        </form>
      )}

      <AdminControls search={search} setSearch={setSearch} />

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable minWidth="1280px">
          <thead className="bg-[#f6fbfd] text-[#111827]">
            <tr>
              <th className="w-14 px-4 py-4"><SelectCell /></th>
              <th className="w-64 px-4 py-4">Child&apos;s Name and Age</th>
              <th className="w-56 px-4 py-4">Assigned Therapist</th>
              <th className="w-56 px-4 py-4">Session Date & Time</th>
              <th className="w-44 px-4 py-4">Session Type</th>
              <th className="w-40 px-4 py-4 text-center">Payment Status</th>
              <th className="px-4 py-4">Session Notes Left by Therapist</th>
              <th className="w-36 px-4 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#b5d3ee]">
            {filtered.map((session, index) => {
              const dateParts = formatSessionDate(session.sessionDate);
              return (
                <tr key={session.id} className={index === 1 ? "bg-[#d9d9d9]" : "hover:bg-[#f8fbfd]"}>
                  <td className="px-4 py-4"><SelectCell checked={index === 1} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <InitialAvatar name={session.child.fullName} />
                      <div>
                        <p className="font-medium text-[#111827]">{session.child.fullName}</p>
                        <p className="text-xs text-[#707070]">{session.child.age ?? "N/A"} years old</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{session.therapist.fullName}</td>
                  <td className="px-4 py-4">
                    <p>{dateParts.date}</p>
                    <p className="text-xs text-[#707070]">{session.startTime || dateParts.time}</p>
                  </td>
                  <td className="px-4 py-4">{session.sessionType}</td>
                  <td className="px-4 py-4 text-center">
                    <StatusPill tone={paymentTone(session.paymentStatus)}>{session.paymentStatus}</StatusPill>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="line-clamp-1">{session.notePreview || "No note recorded yet"}</span>
                      <IconButton label={`View note for ${session.child.fullName}`}>
                        <ViewIcon />
                      </IconButton>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-1">
                      <AppButton size="sm" variant="ghost" onClick={() => openReschedule(session)} disabled={session.bookingStatus === "CANCELLED" || session.bookingStatus === "COMPLETED"}>
                        Reschedule
                      </AppButton>
                      <AppButton size="sm" variant="danger" onClick={() => handleCancel(session)} disabled={session.bookingStatus === "CANCELLED" || session.bookingStatus === "COMPLETED"}>
                        Cancel
                      </AppButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
