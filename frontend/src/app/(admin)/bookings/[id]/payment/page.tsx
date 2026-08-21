"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "../../../../hooks/useRedux";
import { bookingsApi, Booking } from "../../../../services/bookings";
import { paymentsApi } from "../../../../services/payments";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const bookingId = params.id as string;
  const reference = searchParams.get("reference");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(Boolean(reference));
  const [error, setError] = useState("");
  const [message, setMessage] = useState(reference ? "Verifying payment..." : "");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!user) return;

    bookingsApi.get(bookingId)
      .then((d) => setBooking(d.booking))
      .catch(() => router.push("/bookings"))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, bookingId, router]);

  useEffect(() => {
    if (reference && bookingId) {
      paymentsApi.verify(reference)
        .then((res) => {
          if (res.status === "success") {
            setMessage("Payment successful! Redirecting...");
            setTimeout(() => router.push("/bookings"), 2000);
          } else {
            setError("Payment verification failed. Please try again.");
          }
        })
        .catch(() => setError("Failed to verify payment"))
        .finally(() => setProcessing(false));
    }
  }, [reference, bookingId, router]);

  const handlePay = async () => {
    setProcessing(true);
    setError("");
    try {
      const res = await paymentsApi.initialize({
        amount: 15000,
        bookingId,
      });
      window.location.href = res.authorizationUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment initialization failed");
      setProcessing(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-gray-500">Booking not found.</p>
      </div>
    );
  }

  if (message) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="rounded-xl bg-white p-8 shadow">
          <div className="mb-4 text-lg text-green-600">{message}</div>
          {processing && <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Complete Payment</h1>

      <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Session with</span>
            <span className="text-sm font-medium text-gray-900">
              {booking.therapist?.firstName} {booking.therapist?.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Child</span>
            <span className="text-sm font-medium text-gray-900">
              {booking.child?.firstName} {booking.child?.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Time</span>
            <span className="text-sm font-medium text-gray-900">
              {booking.slot?.startTime} — {booking.slot?.endTime}
            </span>
          </div>
          <hr />
          <div className="flex justify-between text-base">
            <span className="font-semibold text-gray-700">Session Fee</span>
            <span className="font-bold text-gray-900">GHS 150.00</span>
          </div>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={handlePay}
        disabled={processing || booking.status !== "PENDING"}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {processing ? "Processing..." : `Pay GHS 150.00 with Paystack`}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        Secure payment via Paystack. Supports card and mobile money.
      </p>
    </div>
  );
}
