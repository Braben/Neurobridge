"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../hooks/useRedux";
import { subscriptionsApi, SubscriptionPlan, UserSubscription } from "../services/subscriptions";

export default function SubscriptionsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySub, setMySub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!user) return;

    Promise.all([
      subscriptionsApi.listPlans(),
      subscriptionsApi.mySubscription(),
    ])
      .then(([pData, sData]) => {
        setPlans(pData.plans);
        setMySub(sData.subscription);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    setError("");
    try {
      const res = await subscriptionsApi.subscribe(planId);
      window.location.href = res.authorizationUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Subscription failed");
      setSubscribing(null);
    }
  };

  if (!user) return null;

  const daysLeft = mySub
    ? Math.max(0, Math.floor((new Date(mySub.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Subscriptions</h1>

      {mySub && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">
            Active Plan: {mySub.plan.name}
          </p>
          <p className="mt-1 text-xs text-green-600">
            {daysLeft} days remaining (expires {new Date(mySub.endDate).toLocaleDateString()})
          </p>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border bg-white p-6 shadow-sm ${
                mySub?.planId === plan.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <h2 className="mb-1 text-lg font-bold text-gray-900">{plan.name}</h2>
              <p className="mb-4 text-sm text-gray-500">{plan.description}</p>

              <p className="mb-4 text-2xl font-bold text-blue-600">
                GHS {plan.price / 100}
                <span className="text-sm font-normal text-gray-400">/month</span>
              </p>

              <ul className="mb-6 space-y-2">
                {(plan.features as string[]).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={!!subscribing || (!!mySub && mySub.planId === plan.id)}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {subscribing === plan.id
                  ? "Redirecting..."
                  : mySub?.planId === plan.id
                    ? "Current Plan"
                    : "Subscribe"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
