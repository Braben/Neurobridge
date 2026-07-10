import { api } from "./api";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface Booking {
  id: string;
  slotId: string;
  childId: string;
  parentId: string;
  therapistId: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  slot?: { id: string; startTime: string; endTime: string; dayOfWeek: number | null; specificDate: string | null };
  child?: { id: string; firstName: string; lastName: string };
  therapist?: { id: string; firstName: string; lastName: string };
  parent?: { id: string; firstName: string; lastName: string };
}

export const bookingsApi = {
  list: () =>
    api.get<{ bookings: Booking[] }>("/bookings").then((r) => r.data),

  get: (id: string) =>
    api.get<{ booking: Booking }>(`/bookings/${id}`).then((r) => r.data),

  create: (data: { slotId: string; childId: string; therapistId: string; notes?: string }) =>
    api.post<{ message: string; booking: Booking }>("/bookings", data).then((r) => r.data),

  updateStatus: (id: string, status: BookingStatus) =>
    api.patch<{ message: string; booking: Booking }>(`/bookings/${id}/status`, { status }).then((r) => r.data),
};
