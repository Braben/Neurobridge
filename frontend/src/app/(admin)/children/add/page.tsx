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
    school: "",
    notes: "",
  });
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
        school: form.school || undefined,
        notes: form.notes || undefined,
      }),
    );
    setIsSubmitting(false);

    if (createChild.fulfilled.match(result)) {
      router.push("/children");
    } else {
      setError(result.error?.message || "Failed to create child");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-4">
          <Link href="/children" className="text-sm text-blue-600 hover:text-blue-500">&larr; Back to Children</Link>
          <h1 className="ml-4 text-xl font-bold text-gray-900">Add Child</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
              <input
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
            <input
              name="diagnosis"
              value={form.diagnosis}
              onChange={handleChange}
              placeholder="e.g. Autism Spectrum Disorder"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">School</label>
            <input
              name="school"
              value={form.school}
              onChange={handleChange}
              placeholder="School name"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Child"}
            </button>
            <Link
              href="/children"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
