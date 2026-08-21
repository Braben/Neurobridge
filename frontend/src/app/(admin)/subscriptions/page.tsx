"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "../../components/ui/AppButton";
import { DashboardPanel, EmptyState, LoadingState, ScreenHeader, StatusBadge } from "../../components/ui/DashboardCards";
import GlobalMessage from "../../components/ui/GlobalMessage";
import { useAppSelector } from "../../hooks/useRedux";
import { subscriptionsApi, SubscriptionPlan, UserSubscription } from "../../services/subscriptions";

export default function SubscriptionsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySub, setMySub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [renderTime] = useState(() => Date.now());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!user) return;

    Promise.all([subscriptionsApi.listPlans(), subscriptionsApi.mySubscription()])
      .then(([planData, subscriptionData]) => {
        setPlans(planData.plans);
        setMySub(subscriptionData.subscription);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    setError("");
    try {
      const res = await subscriptionsApi.subscribe(planId);
      window.location.assign(res.authorizationUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Subscription failed");
      setSubscribing(null);
    }
  };

  if (!user) return null;

  const daysLeft = mySub
    ? Math.max(0, Math.floor((new Date(mySub.endDate).getTime() - renderTime) / 86400000))
    : 0;

  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Billing"
        title="Subscriptions"
        description="Select a care plan and hand payment initiation to the backend subscription and payments flow."
      />

      {mySub && (
        <div className="rounded-md border border-[#bfe8c8] bg-[#f0fbf3] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone="green">Active</StatusBadge>
            <p className="text-sm font-semibold text-[#111827]">{mySub.plan.name}</p>
          </div>
          <p className="mt-2 text-sm text-[#536471]">
            {daysLeft} days remaining. Expires {new Date(mySub.endDate).toLocaleDateString()}.
          </p>
        </div>
      )}

      {error && <GlobalMessage variant="error">{error}</GlobalMessage>}

      <DashboardPanel title="Plans" description="Plan data is loaded from /subscriptions/plans.">
        {loading ? (
          <LoadingState />
        ) : plans.length === 0 ? (
          <EmptyState title="No plans available" message="Subscription plans will appear here once they are created." />
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = mySub?.planId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-md border bg-white p-6 shadow-sm ${
                    isCurrent ? "border-[#0078d4] ring-2 ring-[#9dcefb]" : "border-[#d7e6f2]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold text-[#111827]">{plan.name}</h2>
                    {isCurrent && <StatusBadge tone="blue">Current</StatusBadge>}
                  </div>
                  <p className="mt-2 min-h-12 text-sm text-[#536471]">{plan.description}</p>
                  <p className="mt-5 text-3xl font-bold text-[#073f63]">
                    GHS {plan.price / 100}
                    <span className="text-sm font-medium text-[#536471]">/month</span>
                  </p>
                  <ul className="mt-5 space-y-2">
                    {(plan.features as string[]).map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-[#536471]">
                        <span className="mt-1 h-2 w-2 rounded-full bg-[#0bd3df]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <AppButton
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!subscribing || isCurrent}
                    className="mt-6"
                    fullWidth
                  >
                    {subscribing === plan.id ? "Redirecting..." : isCurrent ? "Current Plan" : "Subscribe"}
                  </AppButton>
                </div>
              );
            })}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
