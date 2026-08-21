"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../../../hooks/useRedux";
import { createChild } from "../../../store/slices/childSlice";

export default function AddChildPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "MALE" as "MALE" | "FEMALE" | "OTHER",
    diagnosis: "",
    coExistingConditions: "",
    currentMedications: "",
    school: "",
    notes: "",
  });
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth) {
      setError("First name, last name, and date of birth are required.");
      return;
    }

    setIsSubmitting(true);
    const result = await dispatch(
      createChild({
        ...form,
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
        diagnosis: form.diagnosis || undefined,
        coExistingConditions: form.coExistingConditions || undefined,
        currentMedications: form.currentMedications || undefined,
        school: form.school || undefined,
        notes: form.notes || undefined,
      }),
    );
    setIsSubmitting(false);

    if (createChild.fulfilled.match(result)) {
      router.push("/dashboard");
    } else {
      setError(result.error?.message || "Failed to create child");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-[#0071d7] hover:underline">&larr; Dashboard</Link>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-[#111]">Add Your Child&apos;s Profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#536471]">
            Complete the child profile so Neuro Bridge admins can match your family with the right therapist.
          </p>
        </div>
        <div className="flex rounded-2xl border border-[#b5d3ee] bg-white p-1 text-sm font-semibold">
          <button type="button" onClick={() => setStep(1)} className={`rounded-xl px-4 py-2 ${step === 1 ? "bg-[#0a3d62] text-white" : "text-[#0a3d62]"}`}>Step 1</button>
          <button type="button" onClick={() => setStep(2)} className={`rounded-xl px-4 py-2 ${step === 2 ? "bg-[#0a3d62] text-white" : "text-[#0a3d62]"}`}>Step 2</button>
        </div>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[#b5d3ee] bg-white p-6 shadow-sm">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {step === 1 && (
            <section className="space-y-5">
              <div>
                <p className="text-2xl font-semibold text-[#111]">Basic Information</p>
                <p className="mt-1 text-sm text-[#536471]">These details identify the child profile across parent, therapist, and admin dashboards.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-[#111]">First Name *</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                    className="mt-2 block h-12 w-full rounded-xl border border-[#b5d3ee] px-3 text-sm shadow-sm focus:border-[#0071d7] focus:outline-none"
              />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111]">Last Name *</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                    className="mt-2 block h-12 w-full rounded-xl border border-[#b5d3ee] px-3 text-sm shadow-sm focus:border-[#0071d7] focus:outline-none"
              />
                </div>
            </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-[#111]">Date of Birth *</label>
              <input
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                required
                    className="mt-2 block h-12 w-full rounded-xl border border-[#b5d3ee] px-3 text-sm shadow-sm focus:border-[#0071d7] focus:outline-none"
              />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111]">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                    className="mt-2 block h-12 w-full rounded-xl border border-[#b5d3ee] px-3 text-sm shadow-sm focus:border-[#0071d7] focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
                </div>
            </div>
              <div>
                <label className="block text-sm font-semibold text-[#111]">School</label>
                <input
                  name="school"
                  value={form.school}
                  onChange={handleChange}
                  placeholder="School name"
                  className="mt-2 block h-12 w-full rounded-xl border border-[#b5d3ee] px-3 text-sm shadow-sm focus:border-[#0071d7] focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setStep(2)} className="h-12 rounded-2xl bg-[#0a3d62] px-6 font-semibold text-white">Continue</button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5">
              <div>
                <p className="text-2xl font-semibold text-[#111]">Therapy Support Details</p>
                <p className="mt-1 text-sm text-[#536471]">These fields appear in the therapist dashboard and help guide assignment and session planning.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111]">Main Diagnosis</label>
                <input name="diagnosis" value={form.diagnosis} onChange={handleChange} placeholder="e.g. ADHD" className="mt-2 block h-12 w-full rounded-xl border border-[#b5d3ee] px-3 text-sm shadow-sm focus:border-[#0071d7] focus:outline-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-[#111]">Co-existing Conditions</label>
                  <input name="coExistingConditions" value={form.coExistingConditions} onChange={handleChange} placeholder="None, anxiety, speech delay..." className="mt-2 block h-12 w-full rounded-xl border border-[#b5d3ee] px-3 text-sm shadow-sm focus:border-[#0071d7] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#111]">Current Medications</label>
                  <input name="currentMedications" value={form.currentMedications} onChange={handleChange} placeholder="None or medication summary" className="mt-2 block h-12 w-full rounded-xl border border-[#b5d3ee] px-3 text-sm shadow-sm focus:border-[#0071d7] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111]">Developmental History Summary</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={5} placeholder="Behaviour concerns, parent goals, school context, and developmental notes..." className="mt-2 block w-full rounded-xl border border-[#b5d3ee] px-3 py-3 text-sm shadow-sm focus:border-[#0071d7] focus:outline-none" />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={isSubmitting} className="h-12 rounded-2xl bg-[#0a3d62] px-6 text-sm font-semibold text-white hover:bg-[#0071d7] disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Submit Child Profile"}
                </button>
                <button type="button" onClick={() => setStep(1)} className="h-12 rounded-2xl border border-[#0a3d62] px-6 text-sm font-semibold text-[#0a3d62]">Back</button>
                <Link href="/dashboard" className="inline-flex h-12 items-center rounded-2xl px-6 text-sm font-semibold text-[#536471] hover:bg-[#f5f5f5]">
                  Cancel
                </Link>
              </div>
            </section>
          )}
        </form>
      </main>
    </div>
  );
}
