"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../hooks/useRedux";
import { availabilityApi, AvailabilitySlot } from "../services/availability";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AvailabilityPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const fetchSlots = useCallback(async () => {
    if (!user) return;
    const data = await availabilityApi.list({ therapistId: user.id });
    setSlots(data.slots);
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "THERAPIST") { router.push("/dashboard"); return; }
    fetchSlots().finally(() => setLoading(false));
  }, [isAuthenticated, user, router, fetchSlots]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await availabilityApi.create({
      dayOfWeek: parseInt(day),
      startTime,
      endTime,
      isRecurring: true,
    });
    setDay("1");
    setStartTime("09:00");
    setEndTime("10:00");
    await fetchSlots();
  };

  const handleDelete = async (id: string) => {
    await availabilityApi.delete(id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  if (!user) return null;

  const grouped = DAYS.map((_, i) => ({
    day: DAYS[i],
    daySlots: slots.filter((s) => s.dayOfWeek === i && s.isRecurring),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Manage Availability</h1>

      <form onSubmit={handleCreate} className="mb-8 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Add Recurring Slot</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Day</label>
            <select value={day} onChange={(e) => setDay(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Start</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">End</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">
            Add Slot
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {grouped.map(({ day, daySlots }) =>
          daySlots.length > 0 ? (
            <div key={day} className="rounded-xl border bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{day}</h3>
              <div className="space-y-2">
                {daySlots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-900">{slot.startTime} — {slot.endTime}</span>
                    <button onClick={() => handleDelete(slot.id)} className="text-sm text-red-600 hover:text-red-500">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        )}
        {slots.length === 0 && <p className="text-center text-sm text-gray-400">No availability slots set up yet.</p>}
      </div>
    </div>
  );
}
