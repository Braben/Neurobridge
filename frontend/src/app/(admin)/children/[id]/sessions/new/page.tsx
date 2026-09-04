"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "../../../../../hooks/useRedux";
import { sessionsApi } from "../../../../../services/sessions";

export default function NewSessionPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const editSessionId = searchParams.get("edit");

  const [form, setForm] = useState({
    sessionDate: "",
    duration: "",
    goalsWorkedOn: "",
    observations: "",
    recommendations: "",
    extraNotes: "",
  });
  const [loadingSession, setLoadingSession] = useState(Boolean(editSessionId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const sessionsPath = pathname.startsWith("/admin/")
    ? `/admin/children/${id}/sessions`
    : `/children/${id}/sessions`;

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !editSessionId) return;
    let active = true;
    sessionsApi.get(editSessionId)
      .then(({ session }) => {
        if (!active) return;
        setForm({
          sessionDate: session.sessionDate ? session.sessionDate.slice(0, 10) : "",
          duration: session.duration ? String(session.duration) : "",
          goalsWorkedOn: session.note?.goalsWorkedOn || "",
          observations: session.note?.observations || "",
          recommendations: session.note?.recommendations || "",
          extraNotes: session.note?.extraNotes || "",
        });
        setError("");
      })
      .catch(() => {
        if (active) setError("Unable to load this session for editing.");
      })
      .finally(() => {
        if (active) setLoadingSession(false);
      });
    return () => {
      active = false;
    };
  }, [editSessionId, isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.sessionDate) { setError("Session date is required"); return; }
    setSubmitting(true);

    try {
      const noteData = {
        goalsWorkedOn: form.goalsWorkedOn,
        observations: form.observations,
        recommendations: form.recommendations,
        extraNotes: form.extraNotes || null,
      };
      if (!noteData.goalsWorkedOn || !noteData.observations || !noteData.recommendations) {
        setError("Goals worked on, observations, and recommendations are required.");
        setSubmitting(false);
        return;
      }

      if (editSessionId) {
        await sessionsApi.update(editSessionId, {
          sessionDate: new Date(form.sessionDate).toISOString(),
          duration: form.duration ? parseInt(form.duration) : null,
        });
        await sessionsApi.upsertNote(editSessionId, noteData);
      } else {
        const res = await sessionsApi.create({
          childId: id,
          sessionDate: new Date(form.sessionDate).toISOString(),
          duration: form.duration ? parseInt(form.duration) : null,
        });
        await sessionsApi.upsertNote(res.session.id, noteData);
      }
      router.push(sessionsPath);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== "THERAPIST" && user?.role !== "ADMIN") {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Access denied.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-4">
          <Link href={sessionsPath} className="text-sm text-blue-600 hover:text-blue-500">&larr; Sessions</Link>
          <h1 className="ml-4 text-xl font-bold text-gray-900">{editSessionId ? "Edit Session Notes" : "New Session"}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {loadingSession && <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Loading session details...</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Session Date *</label>
              <input name="sessionDate" type="date" value={form.sessionDate} onChange={handleChange} required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input name="duration" type="number" min="1" value={form.duration} onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Goals Worked On</label>
            <textarea name="goalsWorkedOn" value={form.goalsWorkedOn} onChange={handleChange} rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Observations</label>
            <textarea name="observations" value={form.observations} onChange={handleChange} rows={4}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Recommendations</label>
            <textarea name="recommendations" value={form.recommendations} onChange={handleChange} rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Extra Notes</label>
            <textarea name="extraNotes" value={form.extraNotes} onChange={handleChange} rows={4} maxLength={5000}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting || loadingSession}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? "Saving..." : editSessionId ? "Update Session Notes" : "Save Session"}
            </button>
            <Link href={sessionsPath}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
