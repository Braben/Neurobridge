"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../hooks/useRedux";
import { bookingsApi, Booking, BookingStatus } from "../../services/bookings";
import {
  AdminControls,
  AdminFilterSelect,
  AdminFooter,
  AdminTable,
  AdminTitle,
} from "../../components/admin/AdminChrome";
import AppButton from "../../components/ui/AppButton";
import { DashboardPanel, EmptyState, FilterPanel, LoadingState, ScreenHeader, StatusBadge } from "../../components/ui/DashboardCards";
import { FormField, SelectField } from "../../components/ui/FormField";

const STATUS_TONES: Record<BookingStatus, "gold" | "green" | "red" | "blue"> = {
  PENDING: "gold",
  CONFIRMED: "green",
  CANCELLED: "red",
  COMPLETED: "blue",
};

const dayName = (day: number | null) =>
  day !== null ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day] : "";

function fullName(person?: { firstName?: string; lastName?: string }) {
  return `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || "N/A";
}

function formatBookingSlot(booking: Booking) {
  const date = booking.slot?.specificDate
    ? new Date(booking.slot.specificDate).toLocaleDateString("en-GB").replace(/\//g, "-")
    : dayName(booking.slot?.dayOfWeek ?? null);
  const time = [booking.slot?.startTime, booking.slot?.endTime].filter(Boolean).join(" - ");
  return [date, time].filter(Boolean).join(" • ") || "Not scheduled";
}

function childNameAge(booking: Booking) {
  return fullName(booking.child);
}

const bookingStatusOptions = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function BookingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) =>
      (!statusFilter || booking.status === statusFilter) &&
      (!query || [
        booking.child ? `${booking.child.firstName} ${booking.child.lastName}` : "",
        booking.therapist ? `${booking.therapist.firstName} ${booking.therapist.lastName}` : "",
        booking.parent ? `${booking.parent.firstName} ${booking.parent.lastName}` : "",
        booking.therapist?.areaofexpertise,
        booking.status,
        booking.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)),
    );
  }, [bookings, search, statusFilter]);

  if (!user) return null;

  if (user.role === "THERAPIST") {
    return (
      <div className="mx-auto w-full max-w-[1500px] space-y-10">
        <AdminTitle backHref="/dashboard">Your Bookings</AdminTitle>

        <AdminControls search={search} setSearch={setSearch} verb="Sort by">
          <AdminFilterSelect
            label="Booking status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={bookingStatusOptions}
          />
        </AdminControls>

        {loading ? (
          <div className="border border-[#b5d3ee] bg-white">
            <LoadingState />
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            title={bookings.length === 0 ? "No bookings yet" : "No matching bookings"}
            message={bookings.length === 0 ? "Parent booking requests will appear here." : "Try another search term or status filter."}
          />
        ) : (
          <AdminTable minWidth="1080px">
            <thead className="bg-[#f8fbfd] text-xs uppercase text-[#536471]">
              <tr>
                <th className="px-5 py-4">Parent&apos;s Name</th>
                <th className="px-5 py-4">Child&apos;s Name &amp; Age</th>
                <th className="px-5 py-4">Booking Date</th>
                <th className="px-5 py-4">Payment Status</th>
                <th className="px-5 py-4">Meeting Link</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-[#b5d3ee] hover:bg-[#f8fbfd]">
                  <td className="px-5 py-4 font-medium text-[#111]">{fullName(booking.parent)}</td>
                  <td className="px-5 py-4 text-[#111]">{childNameAge(booking)}</td>
                  <td className="px-5 py-4 font-semibold text-[#0071d7]">{formatBookingSlot(booking)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone={STATUS_TONES[booking.status]}>{booking.status}</StatusBadge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {booking.status === "PENDING" && (
                        <>
                          <AppButton onClick={() => handleStatus(booking.id, "CONFIRMED")} size="sm" variant="secondary">
                            Confirm
                          </AppButton>
                          <AppButton onClick={() => handleStatus(booking.id, "CANCELLED")} size="sm" variant="danger">
                            Cancel
                          </AppButton>
                        </>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <AppButton onClick={() => handleStatus(booking.id, "COMPLETED")} size="sm">
                          Complete
                        </AppButton>
                      )}
                      {booking.status !== "PENDING" && booking.status !== "CONFIRMED" && (
                        <Link href="/dashboard#bookings" className="text-sm font-semibold text-[#0071d7] hover:underline">
                          Open
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}

        <AdminFooter />
      </div>
    );
  }

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

      <FilterPanel>
        <div className="w-full max-w-xl">
          <FormField
            label="Search"
            name="bookingSearch"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search child, therapist, parent, or notes"
            className="h-12 rounded-xl"
          />
        </div>
        <div className="w-full sm:w-52">
          <SelectField
            label="Status"
            name="bookingStatus"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-12 rounded-xl"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </SelectField>
        </div>
      </FilterPanel>

      <DashboardPanel title="Booking History" description={`${filteredBookings.length} booking${filteredBookings.length === 1 ? "" : "s"} shown`}>
        <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
          {loading ? (
            <LoadingState />
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              title={bookings.length === 0 ? "No bookings yet" : "No matching bookings"}
              message={bookings.length === 0 ? (user.role === "PARENT" ? "Book a therapy session to get started." : "Booking requests will appear here.") : "Try another search term or status filter."}
              action={user.role === "PARENT" && <AppButton href="/bookings/new">Book a Session</AppButton>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-data-table w-full min-w-[900px] text-left text-sm">
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
                  {filteredBookings.map((booking) => (
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
