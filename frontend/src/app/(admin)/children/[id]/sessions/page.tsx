"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "../../../../hooks/useRedux";
import { sessionsApi, Session } from "../../../../services/sessions";

export default function SessionsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    sessionsApi.list(id).then((d) => setSessions(d.sessions)).finally(() => setLoading(false));
  }, [isAuthenticated, id, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/children/${id}`} className="text-sm text-blue-600 hover:text-blue-500">&larr; Child</Link>
            <h1 className="text-xl font-bold text-gray-900">Sessions</h1>
          </div>
          {(user.role === "THERAPIST" || user.role === "ADMIN") && (
            <Link href={`/children/${id}/sessions/new`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              + New Session
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow">
            <p className="text-gray-500">No sessions recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <div key={s.id} className="rounded-xl bg-white p-5 shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(s.sessionDate).toLocaleDateString("en-US", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-500">by {s.therapist.firstName} {s.therapist.lastName}</p>
                  </div>
                  {s.duration && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {s.duration} min
                    </span>
                  )}
                </div>

                {s.note ? (
                  <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-3">
                    <div><p className="text-xs font-medium text-gray-500">Goals Worked On</p><p className="text-sm text-gray-900">{s.note.goalsWorkedOn}</p></div>
                    <div><p className="text-xs font-medium text-gray-500">Observations</p><p className="text-sm text-gray-900">{s.note.observations}</p></div>
                    <div><p className="text-xs font-medium text-gray-500">Recommendations</p><p className="text-sm text-gray-900">{s.note.recommendations}</p></div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-400 italic">No session notes yet.</p>
                )}

                {user.role === "THERAPIST" && (
                  <div className="mt-3 flex gap-2">
                    <Link href={`/children/${id}/sessions/new?edit=${s.id}`}
                      className="text-xs text-blue-600 hover:text-blue-500">
                      {s.note ? "Edit Notes" : "Add Notes"}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
