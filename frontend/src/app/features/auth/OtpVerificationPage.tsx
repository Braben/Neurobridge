"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { verifyOtp, sendOtp, clearError } from "../../store/slices/authSlice";

export default function OtpVerificationPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { otpEmail, isLoading, error } = useAppSelector((state) => state.auth);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);

  // Redirect if no OTP email is set (user navigated here directly)
  useEffect(() => {
    if (!otpEmail) {
      router.push("/register");
    }
  }, [otpEmail, router]);

  // Resend countdown timer
  useEffect(() => {
    if (!resendDisabled) return;
    if (resendCountdown <= 0) {
      setResendDisabled(false);
      return;
    }
    const timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendDisabled, resendCountdown]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Move back on backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    const otpCode = code.join("");
    if (otpCode.length !== 6) {
      return;
    }

    if (!otpEmail) return;

    const result = await dispatch(verifyOtp({ email: otpEmail, code: otpCode }));
    if (verifyOtp.fulfilled.match(result)) {
      router.push("/dashboard");
    }
  };

  const handleResend = async () => {
    if (!otpEmail || resendDisabled) return;
    setResendDisabled(true);
    setResendCountdown(30);
    await dispatch(sendOtp(otpEmail));
  };

  if (!otpEmail) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
          <p className="mt-1 text-sm text-gray-500">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-gray-700">{otpEmail}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-center text-sm font-medium text-gray-700 mb-3">
              Enter verification code
            </label>
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="h-12 w-10 rounded-lg border border-gray-300 text-center text-lg font-semibold shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || code.join("").length !== 6}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify email"}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled}
            className="text-sm text-blue-600 hover:text-blue-500 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {resendDisabled ? `Resend code in ${resendCountdown}s` : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}
