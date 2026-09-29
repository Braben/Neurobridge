"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/hooks/useRedux";
import { loginUser, clearError, sendOtp, setRequiresOtp } from "@/app/store/slices/authSlice";
import Link from "next/link";
import AppButton from "@/components/ui/AppButton";
import AuthFrame from "@/components/layouts/AuthFrame";
import { FormField } from "@/components/ui/FormField";
import GlobalMessage from "@/app/components/ui/GlobalMessage";
import { readPendingVerification } from "./pendingVerification"; // Resume a same-tab therapist verification handoff without confusing it with approval.

function EyeIcon({ hidden }: { hidden: boolean }) {
  // Keep the visibility glyph at the Figma 24px icon size.
  return hidden ? (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.2 5.4A9.7 9.7 0 0 1 12 5c6 0 9.75 7 9.75 7a17 17 0 0 1-2.5 3.3M6.5 6.9C3.8 8.6 2.25 12 2.25 12s3.75 7 9.75 7c1.5 0 2.9-.4 4.1-1" />
    </svg>
  ) : (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    // Stop the browser from submitting the form with a full page reload.
    e.preventDefault();

    // Clear stale API errors before starting a new login attempt.
    dispatch(clearError());

    // Normalize the identifier once so routing and API payloads agree.
    const trimmedIdentifier = identifier.trim();

    // Treat identifiers containing @ as email addresses.
    const isEmail = trimmedIdentifier.includes("@");

    // Build the backend payload using the identifier type the API expects.
    const payload = isEmail
      ? { email: trimmedIdentifier, password }
      : { phone: trimmedIdentifier, password };

    // Dispatch login so Redux can store the returned user/token on success.
    const result = await dispatch(loginUser(payload));

    // Stop here when the backend rejected the login attempt.
    if (loginUser.fulfilled.match(result)) {
      // Read the logged-in user from the fulfilled payload for flow decisions.
      const user = result.payload.user;

      // Parent/admin users who are not approved still need OTP verification.
      const needsAccountVerification = Boolean(readPendingVerification(user.id)) || (!user.isApproved && user.role !== "THERAPIST"); // Retain an unfinished signup verification when the same user signs in again.

      // Send unverified parent/admin users into the OTP flow before dashboard access.
      if (needsAccountVerification) {
        // Keep the OTP target in Redux for the verification screen.
        dispatch(
          setRequiresOtp({
            requiresOtp: true,
            identifier: trimmedIdentifier,
            email: isEmail ? trimmedIdentifier : undefined,
            channel: isEmail ? "EMAIL" : "SMS",
          }),
        );

        // Ask the backend to send a fresh OTP because the old one may have expired.
        await dispatch(sendOtp({ identifier: trimmedIdentifier, channel: isEmail ? "EMAIL" : "SMS" }));

        // Route to the OTP page after the target has been stored.
        router.push("/verify-otp");

        // End the login handler because verification is the next required step.
        return;
      }

      // Route approved users and pending therapists to their normal workspace.
      router.push("/dashboard");
    }
  };

  return (
    <AuthFrame>
      {error && (
        <GlobalMessage variant="error">
          {error}
        </GlobalMessage>
      )}

      {/* Keep the auth content at the Figma large-control width of 361px. */}
      <div className="mx-auto w-full max-w-[361px]">
        <div className="mb-10">
          <p className="text-2xl font-medium leading-[30px] text-[#111111]">
            Welcome back to <span className="text-[#008080]">Neuro Bridge Africa</span>
          </p>
          <h1 className="mt-4 text-[32px] font-medium leading-[38px] text-[#111111]">Login to your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Email / Phone Number"
            name="identifier"
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Your registered email or Phone number"
            error={error ? "Email / Phone number must be valid" : undefined}
          />

          <FormField
            label="Your Password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            error={error ? "Password incorrect" : undefined}
            rightIcon={<EyeIcon hidden={!showPassword} />}
            rightIconLabel={showPassword ? "Hide password" : "Show password"}
            onRightIconClick={() => setShowPassword((visible) => !visible)}
          />

          <div className="-mt-3 text-right">
            <Link href="/forgot-password" className="text-xs font-normal leading-4 text-[#111111] hover:underline">
              Forgot Password?
            </Link>
          </div>

          <AppButton
            type="submit"
            disabled={isLoading}
            fullWidth
            variant="primary"
            size="lg"
          >
            {isLoading ? "Loading" : "Login"}
          </AppButton>
        </form>

        <p className="mt-5 text-base font-medium leading-6 text-[#111111]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#009cae] hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </AuthFrame>
  );
}
