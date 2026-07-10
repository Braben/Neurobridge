"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "../hooks/useRedux";
import { bookingsApi, Booking } from "../services/bookings";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default function BookingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    bookingsApi.list()
      .then((d) => setBookings(d.bookings))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const handleConfirm = async (id: string) => {
    await bookingsApi.updateStatus(id, "CONFIRMED");
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "CONFIRMED" } : b));
  };

  const handleCancel = async (id: string, current: string) => {
    await bookingsApi.updateStatus(id, "CANCELLED");
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "CANCELLED" } : b));
  };

  const handleComplete = async (id: string) => {
    await bookingsApi.updateStatus(id, "COMPLETED");
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "COMPLETED" } : b));
  };

  if (!user) return null;

  const dayName = (d: number | null) =>
    d !== null ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d] : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
        {user?.role === "PARENT" && (
          <Link href="/bookings/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">
            New Booking
          </Link>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-gray-500">No bookings yet.</p>
          {user?.role === "PARENT" && (
            <Link href="/bookings/new" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500">
              Book a session
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {b.child?.firstName} {b.child?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    with {b.therapist?.firstName} {b.therapist?.lastName}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {b.slot?.dayOfWeek !== null ? dayName(b.slot?.dayOfWeek ?? null) : ""}{" "}
                    {b.slot?.startTime} — {b.slot?.endTime}
                    {b.notes && <span className="ml-2 text-gray-300">· {b.notes}</span>}
                  </p>
                </div>
                <span className={`ml-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                  {b.status}
                </span>
              </div>

              {user?.role === "THERAPIST" && b.status === "PENDING" && (
                <div className="mt-3 flex gap-2 border-t pt-3">
                  <button onClick={() => handleConfirm(b.id)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-500">
                    Confirm
                  </button>
                  <button onClick={() => handleCancel(b.id, b.status)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-500">
                    Cancel
                  </button>
                </div>
              )}
              {user?.role === "THERAPIST" && b.status === "CONFIRMED" && (
                <div className="mt-3 flex gap-2 border-t pt-3">
                  <button onClick={() => handleComplete(b.id)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-500">
                    Mark Completed
                  </button>
                </div>
              )}
              {user?.role === "PARENT" && b.status === "PENDING" && (
                <div className="mt-3 flex gap-2 border-t pt-3">
                  <Link
                    href={`/bookings/${b.id}/payment`}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-500"
                  >
                    Pay Now
                  </Link>
                  <button onClick={() => handleCancel(b.id, b.status)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-500">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
