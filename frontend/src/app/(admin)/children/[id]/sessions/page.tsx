"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AdminControls,
  AdminFilterSelect,
  AdminFooter,
  AdminTable,
  AdminTitle,
} from "../../../../components/admin/AdminChrome";
import AppButton from "../../../../components/ui/AppButton";
import { EmptyState, LoadingState } from "../../../../components/ui/DashboardCards";
import { XIcon } from "../../../../components/ui/Icons";
import { useAppSelector } from "../../../../hooks/useRedux";
import { childrenApi, ChildDetail } from "../../../../services/children";
import { sessionsApi, Session } from "../../../../services/sessions";

function fullName(person?: { firstName?: string; lastName?: string }) {
  return `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || "N/A";
}

function formatSessionDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date).replace(/\//g, "-");
}

function childAge(child?: ChildDetail | Session["child"] | null) {
  if (!child || !("dateOfBirth" in child)) return "Age unavailable";
  const dob = new Date(child.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age -= 1;
  return Number.isFinite(age) ? `${age} years` : "Age unavailable";
}

function parentName(child: ChildDetail | null) {
  const parent = child?.parents?.[0]?.parent;
  return fullName(parent);
}

function notePreview(value?: string | null) {
  if (!value) return "No notes yet";
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

function SessionNoteModal({
  child,
  onClose,
  session,
}: {
  child: ChildDetail | null;
  onClose: () => void;
  session: Session;
}) {
  const note = session.note;
  const paragraphs = [
    note?.goalsWorkedOn && `Goals worked on: ${note.goalsWorkedOn}`,
    note?.observations && `Observations: ${note.observations}`,
    note?.recommendations && `Recommendations: ${note.recommendations}`,
    note?.extraNotes && `Extra notes: ${note.extraNotes}`,
  ].filter((paragraph): paragraph is string => Boolean(paragraph));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111]/55 px-4" role="dialog" aria-modal="true" aria-label="Session note">
      <section className="w-full max-w-[626px] bg-[#f5f5f5] px-8 py-8 shadow-2xl sm:px-[60px] sm:py-10">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold tracking-normal text-[#111]">Add Session Note</h2>
            <p className="mt-1 text-xs text-[#536471]">
              {fullName(session.child)} • {childAge(child)} • {formatSessionDate(session.sessionDate)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close session note"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-[#e57373] text-[#bd302d] hover:bg-[#fff0f0]"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="my-6 h-px bg-[#b5d3ee]" />
        <div className="max-h-[360px] space-y-4 overflow-y-auto text-sm leading-7 text-[#111]">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
          ) : (
            <p>No session notes have been added yet for {fullName(session.child)}.</p>
          )}
          <p className="text-xs font-semibold text-[#536471]">Parent: {parentName(child)} · Therapist: {fullName(session.therapist)}</p>
        </div>
      </section>
    </div>
  );
}

export default function SessionsPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [child, setChild] = useState<ChildDetail | null>(null);
  const [search, setSearch] = useState("");
  const [noteFilter, setNoteFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const childPath = pathname.startsWith("/admin/")
    ? `/admin/children/${id}`
    : `/children/${id}`;
  const newSessionPath = pathname.startsWith("/admin/")
    ? `/admin/children/${id}/sessions/new`
    : `/children/${id}/sessions/new`;

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    let active = true;
    Promise.all([sessionsApi.list(id), childrenApi.get(id)])
      .then(([sessionResult, childResult]) => {
        if (!active) return;
        setSessions(sessionResult.sessions);
        setChild(childResult.child);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load session notes for this child.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, id, router]);

  const canWrite = user?.role === "THERAPIST" || user?.role === "ADMIN";
  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sessions.filter((session) => {
      const hasNote = Boolean(session.note);
      if (noteFilter === "with-note" && !hasNote) return false;
      if (noteFilter === "without-note" && hasNote) return false;
      if (!query) return true;
      return [
        parentName(child),
        fullName(session.child),
        fullName(session.therapist),
        session.note?.goalsWorkedOn,
        session.note?.observations,
        session.note?.recommendations,
        session.note?.extraNotes,
      ].filter(Boolean).join(" ").toLowerCase().includes(query);
    });
  }, [child, noteFilter, search, sessions]);

  const noteFilterOptions = [
    { label: "All Notes", value: "" },
    { label: "With Notes", value: "with-note" },
    { label: "Without Notes", value: "without-note" },
  ];

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-10">
      <AdminTitle
        backHref={childPath}
        action={canWrite && (
          <AppButton href={newSessionPath} size="sm" variant="secondary">
            Add Session Notes
          </AppButton>
        )}
      >
        Session Notes
      </AdminTitle>

      <AdminControls search={search} setSearch={setSearch} verb="Sort by">
        <AdminFilterSelect
          label="Note status"
          value={noteFilter}
          onChange={setNoteFilter}
          options={noteFilterOptions}
        />
      </AdminControls>

      {error && <div className="border border-[#ffd7de] bg-[#fff5f7] px-4 py-3 text-sm font-semibold text-[#bd302d]">{error}</div>}

      <main>
        {loading ? (
          <div className="border border-[#b5d3ee] bg-white">
            <LoadingState />
          </div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            title={sessions.length === 0 ? "No sessions recorded yet" : "No matching session notes"}
            message={sessions.length === 0 ? "Session notes will appear after therapy sessions are logged." : "Try a different search term or filter."}
            action={canWrite && <AppButton href={newSessionPath}>Add Session Notes</AppButton>}
          />
        ) : (
          <AdminTable minWidth="1360px">
            <thead className="bg-[#f8fbfd] text-xs uppercase text-[#536471]">
              <tr>
                <th className="px-5 py-4">Parent&apos;s Name</th>
                <th className="px-5 py-4">Child&apos;s Name &amp; Age</th>
                <th className="px-5 py-4">Goals Worked On</th>
                <th className="px-5 py-4">Observations</th>
                <th className="px-5 py-4">Recommendations</th>
                <th className="px-5 py-4">Extra Notes</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id} className="border-t border-[#b5d3ee] align-top hover:bg-[#f8fbfd]">
                  <td className="px-5 py-4 font-medium text-[#111]">{parentName(child)}</td>
                  <td className="px-5 py-4 text-[#111]">
                    <span className="block font-medium">{fullName(session.child)}</span>
                    <span className="text-xs text-[#536471]">{childAge(child)}</span>
                  </td>
                  <td className="px-5 py-4 text-[#111]">{notePreview(session.note?.goalsWorkedOn)}</td>
                  <td className="px-5 py-4 text-[#111]">{notePreview(session.note?.observations)}</td>
                  <td className="px-5 py-4 text-[#111]">{notePreview(session.note?.recommendations)}</td>
                  <td className="px-5 py-4 text-[#111]">{notePreview(session.note?.extraNotes)}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSession(session)}
                        className="text-sm font-semibold text-[#0071d7] hover:underline"
                      >
                        View
                      </button>
                      {canWrite && (
                        <Link href={`${newSessionPath}?edit=${session.id}`} className="text-sm font-semibold text-[#0a3d62] hover:underline">
                          {session.note ? "Edit" : "Add"}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </main>
      <AdminFooter />
      {selectedSession && <SessionNoteModal child={child} session={selectedSession} onClose={() => setSelectedSession(null)} />}
    </div>
  );
}
