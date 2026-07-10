"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../hooks/useRedux";
import { therapistsApi, TherapistProfile } from "../../services/therapists";
import { availabilityApi, AvailabilitySlot } from "../../services/availability";
import { bookingsApi } from "../../services/bookings";
import { childrenApi, Child } from "../../services/children";

type Step = "therapist" | "slot" | "child" | "confirm";

export default function NewBookingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [step, setStep] = useState<Step>("therapist");
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "PARENT") { router.push("/dashboard"); return; }
    Promise.all([
      therapistsApi.list(),
      childrenApi.list(),
    ]).then(([tData, cData]) => {
      setTherapists(tData.therapists);
      setChildren(cData.children);
    }).finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const handleSelectTherapist = async (t: TherapistProfile) => {
    setSelectedTherapist(t);
    setStep("slot");
    const data = await availabilityApi.list({ therapistId: t.id });
    setSlots(data.slots);
  };

  const handleSelectSlot = (s: AvailabilitySlot) => {
    setSelectedSlot(s);
    setStep("child");
  };

  const handleSelectChild = (c: Child) => {
    setSelectedChild(c);
    setStep("confirm");
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !selectedChild || !selectedTherapist) return;
    setSubmitting(true);
    setError("");
    try {
      await bookingsApi.create({
        slotId: selectedSlot.id,
        childId: selectedChild.id,
        therapistId: selectedTherapist.id,
        notes: notes || undefined,
      });
      router.push("/bookings");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create booking";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <span className={step === "therapist" ? "font-semibold text-blue-600" : ""}>Therapist</span>
        <span>→</span>
        <span className={step === "slot" ? "font-semibold text-blue-600" : ""}>Time</span>
        <span>→</span>
        <span className={step === "child" ? "font-semibold text-blue-600" : ""}>Child</span>
        <span>→</span>
        <span className={step === "confirm" ? "font-semibold text-blue-600" : ""}>Confirm</span>
      </div>

      {step === "therapist" && (
        <div>
          <h1 className="mb-4 text-xl font-bold text-gray-900">Select a Therapist</h1>
          <div className="space-y-2">
            {therapists.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTherapist(t)}
                className="flex w-full items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-sm hover:border-blue-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                  {t.firstName[0]}{t.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.firstName} {t.lastName}</p>
                  <p className="text-xs text-gray-500">{t.areaofexpertise || "Therapist"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "slot" && selectedTherapist && (
        <div>
          <h1 className="mb-4 text-xl font-bold text-gray-900">
            Pick a time with {selectedTherapist.firstName}
          </h1>
          {slots.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <p className="text-gray-500">No available slots.</p>
              <button onClick={() => setStep("therapist")} className="mt-2 text-sm text-blue-600 hover:text-blue-500">
                Choose another therapist
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {[0,1,2,3,4,5,6].map((day) => {
                const daySlots = slots.filter((s) => s.dayOfWeek === day);
                if (daySlots.length === 0) return null;
                return (
                  <div key={day} className="rounded-xl border bg-white p-4 shadow-sm">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">{DAYS[day]}</h3>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectSlot(s)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
                        >
                          {s.startTime} — {s.endTime}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === "child" && (
        <div>
          <h1 className="mb-4 text-xl font-bold text-gray-900">Select a Child</h1>
          <div className="space-y-2">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectChild(c)}
                className="flex w-full items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-sm hover:border-blue-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">
                  {c.firstName[0]}{c.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-gray-500">{c.diagnosis || "No diagnosis"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "confirm" && selectedSlot && selectedChild && selectedTherapist && (
        <div>
          <h1 className="mb-4 text-xl font-bold text-gray-900">Confirm Booking</h1>
          <div className="space-y-3 rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Therapist</span>
              <span className="text-sm font-medium text-gray-900">{selectedTherapist.firstName} {selectedTherapist.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Child</span>
              <span className="text-sm font-medium text-gray-900">{selectedChild.firstName} {selectedChild.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Day</span>
              <span className="text-sm font-medium text-gray-900">{DAYS[selectedSlot.dayOfWeek ?? 0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Time</span>
              <span className="text-sm font-medium text-gray-900">{selectedSlot.startTime} — {selectedSlot.endTime}</span>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                rows={2}
                placeholder="Any concerns or requests..."
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep("child")} className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Back
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50">
                {submitting ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
