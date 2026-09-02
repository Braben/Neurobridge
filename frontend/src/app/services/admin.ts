import { api } from "./api";

export type AccountStatus = "ACTIVE" | "DORMANT" | "INACTIVE";
export type PaymentState = "PAID" | "PENDING" | "UNPAID";

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  age: number | null;
  role: "ADMIN" | "PARENT" | "THERAPIST";
  isApproved: boolean;
  areaofexpertise: string | null;
  avatar: string | null;
  accountStatus?: AccountStatus;
  createdAt: string;
}

export interface AdminParent extends AdminUser {
  children: { id: string; firstName: string; lastName: string }[];
}

export interface AdminTherapist extends AdminUser {
  assignedChildren: { id: string; firstName: string; lastName: string }[];
  assignedChildrenCount: number;
  bookingsCount: number;
}

export interface AdminChild {
  id: string;
  shortId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  age: number | null;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  diagnosis: string | null;
  coExistingConditions: string | null;
  currentMedications: string | null;
  developmentalHistorySummary: string | null;
  parents: AdminUser[];
  therapists: AdminUser[];
}

export interface AdminTherapySession {
  id: string;
  bookingId: string;
  child: { id: string; firstName: string; lastName: string; fullName: string; age: number | null };
  therapist: AdminUser;
  sessionDate: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  bookingStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  paymentStatus: PaymentState;
  notePreview: string | null;
}

export interface AdminOverview {
  stats: {
    totalChildren: number;
    totalParents: number;
    totalTherapists: number;
    pendingTherapists: number;
    totalSessions: number;
    totalUsers: number;
  };
  changes: {
    usersToday: number;
    sessionsThisWeek: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
  };
  userGrowth: { label: string; parents: number; therapists: number; children: number }[];
  bookingTrend: { label: string; bookings: number }[];
  revenueTrend: { label: string; revenue: number }[];
  revenue: { total: number };
}

export const adminApi = {
  overview: () => api.get<AdminOverview>("/admin/overview").then((r) => r.data),
  users: (params?: { role?: "ADMIN" | "PARENT" | "THERAPIST"; isApproved?: boolean }) =>
    api.get<{ users: AdminUser[] }>("/admin/users", { params }).then((r) => r.data),
  parents: () => api.get<{ parents: AdminParent[] }>("/admin/parents").then((r) => r.data),
  therapists: () => api.get<{ therapists: AdminTherapist[] }>("/admin/therapists").then((r) => r.data),
  children: () => api.get<{ children: AdminChild[] }>("/admin/children").then((r) => r.data),
  sessions: () => api.get<{ sessions: AdminTherapySession[] }>("/admin/sessions").then((r) => r.data),
  approveTherapist: (id: string) =>
    api.patch<{ message: string; user: AdminUser }>(`/admin/users/${id}/approve`).then((r) => r.data),
  updateUser: (id: string, data: Partial<Pick<AdminUser, "firstName" | "lastName" | "email" | "phone" | "dateOfBirth" | "areaofexpertise" | "isApproved">>) =>
    api.patch<{ message: string; user: AdminUser }>(`/admin/users/${id}`, data).then((r) => r.data),
  inviteAdmin: (email: string) =>
    api.post<{ message: string }>("/admin/admin-invites", { email }).then((r) => r.data),
  getSessionFee: () =>
    api.get<{ amount: number }>("/admin/settings/session-fee").then((r) => r.data),
  updateSessionFee: (amount: number) =>
    api.patch<{ message: string; amount: number }>("/admin/settings/session-fee", { amount }).then((r) => r.data),
  deleteUser: (id: string) => api.delete<{ message: string }>(`/admin/users/${id}`).then((r) => r.data),
  rescheduleBooking: (id: string, data: { specificDate: string; startTime: string; endTime: string }) =>
    api.patch<{ message: string }>(`/admin/bookings/${id}/reschedule`, data).then((r) => r.data),
};
