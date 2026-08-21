"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { verifyOtp, sendOtp, clearError } from "../../store/slices/authSlice";
import AppButton from "../../components/ui/AppButton";
import AuthFrame from "../../components/ui/AuthFrame";
import GlobalMessage from "../../components/ui/GlobalMessage";

export default function OtpVerificationPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { otpEmail, isLoading, error } = useAppSelector((state) => state.auth);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resendCountdown, setResendCountdown] = useState(0);
  const resendDisabled = resendCountdown > 0;

  // Redirect if no OTP email is set (user navigated here directly)
  useEffect(() => {
    if (!otpEmail) {
      router.push("/register");
    }
  }, [otpEmail, router]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }
    const timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

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
    setResendCountdown(30);
    await dispatch(sendOtp(otpEmail));
  };

  if (!otpEmail) return null;

  return (
    <AuthFrame footerMinimal>
      {error && <GlobalMessage variant="error">{error}</GlobalMessage>}

      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#171f27]">Verify your account</h1>
          <p className="mt-2 text-sm text-[#4b5b66]">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-[#073f63]">{otpEmail}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-3 block text-center text-sm font-semibold text-[#1d2b36]">
              Enter verification code
            </label>
            <div className="flex justify-center gap-2 sm:gap-3">
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
                  className="h-12 w-10 rounded-md border border-[#c7dce9] text-center text-lg font-bold text-[#073f63] shadow-sm outline-none transition focus:border-[#0078d4] focus:ring-4 focus:ring-[#0078d4]/20 sm:w-12"
                />
              ))}
            </div>
          </div>

          <AppButton
            type="submit"
            disabled={isLoading || code.join("").length !== 6}
            fullWidth
            variant="secondary"
          >
            {isLoading ? "Loading" : "Verify Account"}
          </AppButton>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled}
            className="text-sm font-semibold text-[#009cae] hover:underline disabled:cursor-not-allowed disabled:text-[#91a6b4]"
          >
            {resendDisabled ? `Resend code in ${resendCountdown}s` : "Resend code"}
          </button>
        </div>
      </div>
    </AuthFrame>
  );
}
