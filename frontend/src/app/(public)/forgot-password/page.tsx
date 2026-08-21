"use client";

import { useState } from "react";
import Link from "next/link";
import AppButton from "../../components/ui/AppButton";
import AuthFrame from "../../components/ui/AuthFrame";
import { FormField } from "../../components/ui/FormField";
import { api } from "../../services/api";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.2 5.4A9.7 9.7 0 0 1 12 5c6 0 9.75 7 9.75 7a17 17 0 0 1-2.5 3.3M6.5 6.9C3.8 8.6 2.25 12 2.25 12s3.75 7 9.75 7c1.5 0 2.9-.4 4.1-1" />
    </svg>
  ) : (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function LoadingMark() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

function ResetToast({ children }: { children: string }) {
  return (
    <div
      role="status"
      className="fixed left-1/2 top-8 z-50 flex w-[calc(100vw-2rem)] max-w-[620px] -translate-x-1/2 items-center gap-3 rounded-[10px] bg-[#2e7d32] px-4 py-4 text-sm font-medium leading-5 text-white shadow-lg lg:left-[calc(483px+(100vw-483px)/2)]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] bg-white text-[#2e7d32]">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
        </svg>
      </span>
      <span>{children}</span>
    </div>
  );
}

function FormIntro({
  title,
  description,
  className = "",
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={["mb-10 text-left", className].filter(Boolean).join(" ")}>
      <h1 className="text-[32px] font-medium leading-[38px] text-[#111111]">{title}</h1>
      <p className="mt-7 text-base font-medium leading-6 text-[#111111]">{description}</p>
    </div>
  );
}

const resetSuccessMessage =
  "A New link has been sent to your email / phone number to guide you in resetting your password";

const controlClassName =
  "rounded-[10px] bg-[#f5f5f5] text-[#0a3d62] placeholder:font-normal placeholder:text-[#757575]";

const buttonClassName =
  "h-[60px] rounded-[10px] text-base font-semibold disabled:opacity-100";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [resetError, setResetError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequestError("");
    setResetError("");
    setSuccess("");
    setIsSending(true);

    try {
      const response = await api.post<{ message: string; resetEmail?: string }>("/auth/request-password-reset", {
        identifier,
      });
      setResetEmail(response.data.resetEmail || (identifier.includes("@") ? identifier : ""));
      setSubmitted(true);
      setSuccess(resetSuccessMessage);
    } catch (requestError: unknown) {
      const message =
        typeof requestError === "object" &&
        requestError !== null &&
        "response" in requestError &&
        typeof requestError.response === "object" &&
        requestError.response !== null &&
        "data" in requestError.response &&
        typeof requestError.response.data === "object" &&
        requestError.response.data !== null &&
        "message" in requestError.response.data &&
        typeof requestError.response.data.message === "string"
          ? requestError.response.data.message
          : "Phone Number / Email not found in our system. Try again";
      setRequestError(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequestError("");
    setResetError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setResetError("Password doesn't match");
      return;
    }

    setIsResetting(true);
    try {
      await api.post<{ message: string }>("/auth/reset-password", {
        email: resetEmail,
        code,
        password,
      });
      setSuccess("");
      setResetComplete(true);
      setCode("");
      setPassword("");
      setConfirmPassword("");
    } catch (resetError: unknown) {
      const message =
        typeof resetError === "object" &&
        resetError !== null &&
        "response" in resetError &&
        typeof resetError.response === "object" &&
        resetError.response !== null &&
        "data" in resetError.response &&
        typeof resetError.response.data === "object" &&
        resetError.response.data !== null &&
        "message" in resetError.response.data &&
        typeof resetError.response.data.message === "string"
          ? resetError.response.data.message
          : "Unable to reset password. Please check the code and try again.";
      setResetError(message);
    } finally {
      setIsResetting(false);
    }
  };

  const passwordMismatch = Boolean(confirmPassword && password !== confirmPassword);
  const passwordMatches = Boolean(confirmPassword && password === confirmPassword);
  const canRequestReset = Boolean(identifier.trim()) && !isSending;
  const canSubmitNewPassword =
    Boolean(resetEmail.trim()) &&
    code.length === 6 &&
    password.length >= 6 &&
    passwordMatches &&
    !isResetting;

  return (
    <AuthFrame footerMinimal>
      {success && <ResetToast>{success}</ResetToast>}
      <div className="mx-auto w-full max-w-[430px]">
        {resetComplete ? (
          <div className="space-y-10 text-center">
            <div>
              <h1 className="text-[32px] font-medium leading-[38px] text-[#111111]">Password Reset Successful.</h1>
              <p className="mt-7 text-base font-medium leading-6 text-[#111111]">
                Login with your username and new password to access your account.
              </p>
            </div>
            <AppButton href="/login" fullWidth size="lg" className={buttonClassName}>
              Login
            </AppButton>
          </div>
        ) : !submitted ? (
          <>
            <FormIntro
              title="Forgot Password"
              description="Enter your email or phone number to get a code to reset your password"
            />
            <form className="space-y-6" onSubmit={handleRequestReset}>
              <FormField
                label="Email / Phone Number"
                name="identifier"
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Your registered email / Phone number"
                error={requestError || undefined}
                className={controlClassName}
              />
              <AppButton
                type="submit"
                fullWidth
                size="lg"
                className={buttonClassName}
                disabled={!canRequestReset}
                rightIcon={isSending ? <LoadingMark /> : undefined}
              >
                {isSending ? "Loading" : "Get Password Reset Code"}
              </AppButton>
            </form>

            <div className="mt-7 space-y-8 text-center text-sm font-semibold leading-5">
              <Link href="/privacy#contact" className="text-[#008080] underline underline-offset-2">
                Lost access to your email and phone number?
              </Link>
              <p className="text-[#111111]">
                <Link href="/privacy#contact" className="text-[#008080] underline underline-offset-2">
                  Contact Admin
                </Link>{" "}
                for Your Account Problems
              </p>
            </div>
          </>
        ) : (
          <>
            <FormIntro
              title="Create New Password"
              description="Create your new password so you can use it to access your account"
            />
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <FormField
                label="Account Email"
                name="resetEmail"
                required
                type="email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                placeholder="name@example.com"
                className={controlClassName}
                helpText={!resetEmail ? "Enter the email address connected to this account." : undefined}
              />
              <FormField
                label="Reset Code"
                name="code"
                required
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
                className={controlClassName}
              />
              <FormField
                label="New Password"
                name="password"
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a new password"
                className={controlClassName}
                rightIcon={<EyeIcon hidden={!showPassword} />}
                rightIconLabel={showPassword ? "Hide password" : "Show password"}
                onRightIconClick={() => setShowPassword((visible) => !visible)}
              />
              <FormField
                label="Confirm New Password"
                name="confirmPassword"
                required
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter a new password"
                className={controlClassName}
                status={passwordMatches ? "success" : undefined}
                error={passwordMismatch ? "Password doesn't match" : undefined}
                helpText={passwordMatches ? "Password matches" : "Ensure it matches with the new password entered above"}
                rightIcon={<EyeIcon hidden={!showPassword} />}
                rightIconLabel={showPassword ? "Hide password" : "Show password"}
                onRightIconClick={() => setShowPassword((visible) => !visible)}
              />
              {resetError && !passwordMismatch && (
                <p className="text-center text-xs font-medium leading-5 text-[#e53935]">{resetError}</p>
              )}
              <AppButton
                type="submit"
                fullWidth
                size="lg"
                className={buttonClassName}
                disabled={!canSubmitNewPassword}
                rightIcon={isResetting ? <LoadingMark /> : undefined}
              >
                {isResetting ? "Loading" : "Submit"}
              </AppButton>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setSuccess("");
                    setRequestError("");
                    setResetError("");
                  }}
                  className="text-[#008080] underline underline-offset-2"
                >
                  Use a different account
                </button>
                <Link href="/login" className="text-[#008080] underline underline-offset-2">
                  Back to login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </AuthFrame>
  );
}
