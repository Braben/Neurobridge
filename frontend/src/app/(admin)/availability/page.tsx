"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppButton from "../../components/ui/AppButton";
import { DashboardPanel, EmptyState, LoadingState, ScreenHeader } from "../../components/ui/DashboardCards";
import { SelectField } from "../../components/ui/FormField";
import { useAppSelector } from "../../hooks/useRedux";
import { availabilityApi, AvailabilitySlot } from "../../services/availability";

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
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "THERAPIST") {
      router.push("/dashboard");
      return;
    }
    availabilityApi
      .list({ therapistId: user.id })
      .then((data) => setSlots(data.slots))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router, fetchSlots]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    await availabilityApi.create({
      dayOfWeek: parseInt(day, 10),
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
    setSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  if (!user) return null;

  const grouped = DAYS.map((label, index) => ({
    day: label,
    daySlots: slots.filter((slot) => slot.dayOfWeek === index && slot.isRecurring),
  }));

  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Scheduling"
        title="Manage Availability"
        description="Create recurring availability slots so parents can book therapy sessions."
      />

      <DashboardPanel title="Add Recurring Slot" description="New slots are saved through POST /availability.">
        <form onSubmit={handleCreate} className="rounded-md border border-[#d7e6f2] bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
            <SelectField label="Day" name="day" value={day} onChange={(event) => setDay(event.target.value)} className="h-12 rounded-xl">
              {DAYS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </SelectField>
            <label className="block text-base font-normal leading-6 text-[#111111]">
              Start
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-3 h-12 w-full rounded-xl border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-base font-medium text-[#111111] outline-none focus:border-[#0071d7] focus:ring-4 focus:ring-[#0071d7]/20"
              />
            </label>
            <label className="block text-base font-normal leading-6 text-[#111111]">
              End
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-3 h-12 w-full rounded-xl border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-base font-medium text-[#111111] outline-none focus:border-[#0071d7] focus:ring-4 focus:ring-[#0071d7]/20"
              />
            </label>
            <AppButton type="submit" className="md:mb-0">
              Add Slot
            </AppButton>
          </div>
        </form>
      </DashboardPanel>

      <DashboardPanel title="Weekly Schedule" description={`${slots.length} availability slot${slots.length === 1 ? "" : "s"} configured`}>
        {loading ? (
          <LoadingState />
        ) : slots.length === 0 ? (
          <EmptyState title="No availability set" message="Add your first recurring slot so families can book sessions." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {grouped.map(({ day: label, daySlots }) => (
              <div key={label} className="rounded-md border border-[#d7e6f2] bg-white p-5 shadow-sm">
                <h3 className="text-base font-bold text-[#111827]">{label}</h3>
                {daySlots.length === 0 ? (
                  <p className="mt-4 text-sm text-[#536471]">No slots</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between gap-3 rounded-md bg-[#f6fbfd] px-3 py-2">
                        <span className="text-sm font-semibold text-[#073f63]">{slot.startTime} - {slot.endTime}</span>
                        <button onClick={() => handleDelete(slot.id)} className="text-xs font-bold text-[#bd302d] hover:underline">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
