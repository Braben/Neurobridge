import { api } from "./api";

export interface AvailabilitySlot {
  id: string;
  therapistId: string;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  createdAt: string;
  therapist?: { id: string; firstName: string; lastName: string };
}

export const availabilityApi = {
  list: (params?: { therapistId?: string; dayOfWeek?: number }) =>
    api.get<{ slots: AvailabilitySlot[] }>("/availability", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<{ slot: AvailabilitySlot }>(`/availability/${id}`).then((r) => r.data),

  create: (data: { dayOfWeek?: number; specificDate?: string; startTime: string; endTime: string; isRecurring?: boolean }) =>
    api.post<{ message: string; slot: AvailabilitySlot }>("/availability", data).then((r) => r.data),

  update: (id: string, data: Partial<AvailabilitySlot>) =>
    api.put<{ message: string; slot: AvailabilitySlot }>(`/availability/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/availability/${id}`).then((r) => r.data),
};
