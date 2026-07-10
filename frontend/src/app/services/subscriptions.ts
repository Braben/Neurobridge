import { api } from "./api";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: string;
  autoRenew: boolean;
  plan: SubscriptionPlan;
}

export const subscriptionsApi = {
  listPlans: () =>
    api.get<{ plans: SubscriptionPlan[] }>("/subscriptions/plans").then((r) => r.data),

  subscribe: (planId: string) =>
    api.post<{ authorizationUrl: string; reference: string }>("/subscriptions/subscribe", { planId }).then((r) => r.data),

  mySubscription: () =>
    api.get<{ subscription: UserSubscription | null }>("/subscriptions/my").then((r) => r.data),
};
