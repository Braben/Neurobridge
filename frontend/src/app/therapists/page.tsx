"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "../hooks/useRedux";
import { therapistsApi, TherapistProfile } from "../services/therapists";

export default function TherapistsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!user) return;
    therapistsApi.list()
      .then((d) => setTherapists(d.therapists))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  if (!user) return null;

  const filtered = therapists.filter(
    (t) =>
      !search ||
      t.firstName.toLowerCase().includes(search.toLowerCase()) ||
      t.lastName.toLowerCase().includes(search.toLowerCase()) ||
      (t.areaofexpertise && t.areaofexpertise.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Therapists</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or expertise..."
        className="mb-4 w-full rounded-lg border px-4 py-2 text-sm"
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-gray-500">{therapists.length === 0 ? "No therapists found." : "No results match your search."}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/therapists/${t.id}`}
              className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                  {t.firstName[0]}{t.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.firstName} {t.lastName}</p>
                  {t.areaofexpertise && (
                    <p className="text-xs text-gray-500">{t.areaofexpertise}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>{t.childCount} children</span>
                <span>{t.sessionCount} sessions</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
