"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../hooks/useRedux";
import { bookingsApi, Booking, BookingStatus } from "../../services/bookings";
import AppButton from "../../components/ui/AppButton";
import { DashboardPanel, EmptyState, LoadingState, ScreenHeader, StatusBadge } from "../../components/ui/DashboardCards";

const STATUS_TONES: Record<BookingStatus, "gold" | "green" | "red" | "blue"> = {
  PENDING: "gold",
  CONFIRMED: "green",
  CANCELLED: "red",
  COMPLETED: "blue",
};

const dayName = (day: number | null) =>
  day !== null ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day] : "";

export default function BookingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    bookingsApi
      .list()
      .then((d) => setBookings(d.bookings))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const handleStatus = async (id: string, status: BookingStatus) => {
    await bookingsApi.updateStatus(id, status);
    setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, status } : booking)));
  };

  if (!user) return null;

  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Scheduling"
        title="Bookings"
        description="Review therapy session booking requests, confirmations, and payment handoff states."
        action={
          user.role === "PARENT" && (
            <AppButton href="/bookings/new" variant="secondary">
              New Booking
            </AppButton>
          )
        }
      />

      <DashboardPanel title="Booking History" description={`${bookings.length} booking${bookings.length === 1 ? "" : "s"} from the backend`}>
        <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
          {loading ? (
            <LoadingState />
          ) : bookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              message={user.role === "PARENT" ? "Book a therapy session to get started." : "Booking requests will appear here."}
              action={user.role === "PARENT" && <AppButton href="/bookings/new">Book a Session</AppButton>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#f6fbfd] text-xs uppercase text-[#536471]">
                  <tr>
                    <th className="px-6 py-3">Child</th>
                    <th className="px-6 py-3">Therapist</th>
                    <th className="px-6 py-3">Slot</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf4f8]">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-[#f8fbfd]">
                      <td className="px-6 py-4 font-semibold text-[#111827]">
                        {booking.child?.firstName} {booking.child?.lastName}
                      </td>
                      <td className="px-6 py-4 text-[#536471]">
                        {booking.therapist?.firstName} {booking.therapist?.lastName}
                      </td>
                      <td className="px-6 py-4 text-[#536471]">
                        {booking.slot?.specificDate ? new Date(booking.slot.specificDate).toLocaleDateString() : dayName(booking.slot?.dayOfWeek ?? null)}{" "}
                        {booking.slot?.startTime} - {booking.slot?.endTime}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge tone={STATUS_TONES[booking.status]}>{booking.status}</StatusBadge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.role === "THERAPIST" && booking.status === "PENDING" && (
                            <>
                              <AppButton onClick={() => handleStatus(booking.id, "CONFIRMED")} size="sm" variant="secondary">
                                Confirm
                              </AppButton>
                              <AppButton onClick={() => handleStatus(booking.id, "CANCELLED")} size="sm" variant="danger">
                                Cancel
                              </AppButton>
                            </>
                          )}
                          {user.role === "THERAPIST" && booking.status === "CONFIRMED" && (
                            <AppButton onClick={() => handleStatus(booking.id, "COMPLETED")} size="sm">
                              Complete
                            </AppButton>
                          )}
                          {user.role === "PARENT" && booking.status === "PENDING" && (
                            <>
                              <AppButton href={`/bookings/${booking.id}/payment`} size="sm">
                                Pay
                              </AppButton>
                              <AppButton onClick={() => handleStatus(booking.id, "CANCELLED")} size="sm" variant="danger">
                                Cancel
                              </AppButton>
                            </>
                          )}
                          {booking.status !== "PENDING" && booking.status !== "CONFIRMED" && (
                            <span className="text-xs font-semibold text-[#536471]">No action</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}
