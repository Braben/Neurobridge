import { api } from "./api";

export interface Transaction {
  id: string;
  userId: string;
  email: string;
  amount: number;
  currency: string;
  reference: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  metadata: Record<string, unknown> | null;
  bookingId: string | null;
  subscriptionId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export const paymentsApi = {
  initialize: (data: { amount: number; bookingId?: string }) =>
    api.post<{ authorizationUrl: string; reference: string }>("/payments/initialize", data).then((r) => r.data),

  verify: (reference: string) =>
    api.get<{ status: string; transaction: Record<string, unknown> }>(`/payments/verify/${reference}`).then((r) => r.data),

  listTransactions: () =>
    api.get<{ transactions: Transaction[] }>("/payments/transactions").then((r) => r.data),

  revenueDashboard: () =>
    api.get<{
      revenue: { total: number; monthly: number };
      activeSubscriptions: number;
      totalUsers: number;
      recentTransactions: (Transaction & { user: { id: string; firstName: string; lastName: string; email: string } })[];
    }>("/payments/revenue").then((r) => r.data),
};
