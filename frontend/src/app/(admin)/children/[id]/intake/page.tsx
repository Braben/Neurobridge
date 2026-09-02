"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "../../../../hooks/useRedux";
import { intakeApi, IntakeForm } from "../../../../services/intake";

export default function IntakePage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState({ developmentalHistory: "", behaviourConcerns: "", parentGoals: "" });
  const [existing, setExisting] = useState<IntakeForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const childPath = pathname.startsWith("/admin/")
    ? `/admin/children/${id}`
    : `/children/${id}`;

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    intakeApi.get(id).then((d) => {
      if (d.intake) {
        setExisting(d.intake);
        setForm({
          developmentalHistory: d.intake.developmentalHistory,
          behaviourConcerns: d.intake.behaviourConcerns,
          parentGoals: d.intake.parentGoals,
        });
      }
    }).finally(() => setLoading(false));
  }, [isAuthenticated, id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(""); setSaved(false);
    try {
      await intakeApi.upsert(id, form);
      setSaved(true);
      setExisting((prev) => prev ? { ...prev, ...form } : { id: "", childId: id, ...form });
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-4">
          <Link href={childPath} className="text-sm text-blue-600 hover:text-blue-500">&larr; Child</Link>
          <h1 className="ml-4 text-xl font-bold text-gray-900">Intake Form</h1>
          {existing && <span className="ml-3 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Completed</span>}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow">
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {saved && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Intake form saved successfully.</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700">Developmental History</label>
              <p className="mt-1 text-xs text-gray-500">Describe the child&apos;s developmental milestones, delays, and medical history.</p>
              <textarea name="developmentalHistory" value={form.developmentalHistory} onChange={handleChange} rows={5} required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Behaviour Concerns</label>
              <p className="mt-1 text-xs text-gray-500">Describe any behavioural concerns, triggers, and current management strategies.</p>
              <textarea name="behaviourConcerns" value={form.behaviourConcerns} onChange={handleChange} rows={5} required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Goals</label>
              <p className="mt-1 text-xs text-gray-500">What are your primary goals and hopes for your child&apos;s therapy?</p>
              <textarea name="parentGoals" value={form.parentGoals} onChange={handleChange} rows={5} required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {submitting ? "Saving..." : existing ? "Update Intake Form" : "Save Intake Form"}
              </button>
              <Link href={childPath}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
