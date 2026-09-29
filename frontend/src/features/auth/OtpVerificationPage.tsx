"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/hooks/useRedux";
import { verifyOtp, resendOtp, clearError, setRequiresOtp } from "@/app/store/slices/authSlice";
import AppButton from "@/components/ui/AppButton";
import AuthFrame from "@/components/layouts/AuthFrame";
import { FormField } from "@/components/ui/FormField";
// Reuse the Figma OTP cells and their shared six-digit contract.
import OtpInput, { OTP_LENGTH } from "@/components/ui/OtpInput";

// Convert an identifier to the backend OTP channel enum.
const inferOtpChannel = (identifier: string) => {
  // Email identifiers always include an @ symbol.
  return identifier.includes("@") ? "EMAIL" : "SMS";
};

// Create a blank OTP input array with one slot per digit.
const emptyOtpCode = () => Array.from({ length: OTP_LENGTH }, () => "");

export default function OtpVerificationPage() {
  // Use the router to move users after successful verification.
  const router = useRouter();

  // Use Redux dispatch for OTP API calls and auth-state cleanup.
  const dispatch = useAppDispatch();

  // Read OTP metadata that signup/signin stored in the auth slice.
  const { accessToken, otpEmail, otpIdentifier, otpChannel, isLoading, error, user } = useAppSelector((state) => state.auth);

  // Keep an editable target so direct visits can still verify an account.
  const [manualIdentifier, setManualIdentifier] = useState(otpIdentifier || "");

  // Store each digit separately so fixed-size boxes match the Figma OTP board.
  const [code, setCode] = useState(emptyOtpCode);

  // Track local validation that does not need a backend request.
  const [localError, setLocalError] = useState("");

  // Track successful resend feedback separately from Redux errors.
  const [localMessage, setLocalMessage] = useState("");

  // Track a small cooldown so the resend button cannot be spammed.
  const [resendCountdown, setResendCountdown] = useState(otpIdentifier ? 120 : 0); // Match the two-minute Figma timer after an in-session signup/signin handoff.
  const [resendExpiresAt, setResendExpiresAt] = useState(() => otpIdentifier ? Date.now() + 120_000 : 0); // Measure the cooldown against elapsed time, not the number of browser callbacks.
  const [isResending, setIsResending] = useState(false); // Track code delivery separately from account verification.

  // Disable resend while the cooldown is active.
  const resendDisabled = resendCountdown > 0 || isLoading || isResending; // Prevent overlapping delivery and verification requests.
  const countdownLabel = `${Math.floor(resendCountdown / 60)}:${String(resendCountdown % 60).padStart(2, "0")}`; // Present elapsed countdown state as minutes and seconds, as in Figma.

  // Keep the manual field synced when signup/signin later provides an OTP target.
  useEffect(() => {
    // Stop when Redux has no OTP identifier yet.
    if (!otpIdentifier) return;

    // Schedule the state update after effect setup to keep hydration predictable.
    const syncIdentifier = window.setTimeout(() => {
      // Copy the Redux identifier into the editable field.
      setManualIdentifier(otpIdentifier);
    }, 0);

    // Cancel the scheduled sync if the page unmounts immediately.
    return () => window.clearTimeout(syncIdentifier);
  }, [otpIdentifier]);

  useEffect(() => { // Keep the displayed countdown accurate after throttling or a background-tab pause.
    if (!resendExpiresAt) return; // Do not schedule work when no code-delivery cooldown exists.
    const timer = window.setInterval(() => { // Refresh the display without restarting a timer on every React render.
      const remaining = Math.max(0, Math.ceil((resendExpiresAt - Date.now()) / 1000)); // Never extend the waiting period because a callback ran late.
      setResendCountdown(remaining); // Show whole seconds remaining until the original deadline.
      if (remaining === 0) window.clearInterval(timer); // Stop idle updates once the resend action is available.
    }, 1000); // Update the source design's minute-and-second label each second.
    return () => window.clearInterval(timer); // Clean up when the deadline changes or the page unmounts.
  }, [resendExpiresAt]); // Track the request deadline rather than each displayed countdown value.

  const handleCodeChange = (digits: string[]) => { // Keep state ownership here while the shared control owns focus behavior.
    setCode(digits); // Accept single-digit editing, paste, and autofill.
    setLocalError(""); // Remove stale invalid styling when the user corrects the code.
    if (error) dispatch(clearError()); // Allow retry after a rejected verification.
  }; // Complete the feature's code-change handler.

  const handleSubmit = async (e: React.FormEvent) => {
    // Stop the browser from reloading the page on submit.
    e.preventDefault();
    if (isLoading || isResending) return; // Reject submissions while either verification or new-code delivery is pending.

    // Clear stale Redux and local messages before validating.
    dispatch(clearError());

    // Clear any old client-side error before this attempt.
    setLocalError("");

    // Clear old success feedback before this verification attempt.
    setLocalMessage("");

    // Join the visible digit boxes into the backend OTP code.
    const otpCode = code.join("");

    // Normalize the target identifier from Redux or the manual input.
    const targetIdentifier = (otpIdentifier || manualIdentifier).trim();

    // Block submission until an account target is available.
    if (!targetIdentifier) {
      // Explain the missing target without making a backend request.
      setLocalError("Enter the email or phone number connected to this verification code.");

      // End the handler because the request cannot be formed yet.
      return;
    }

    // Block submission until exactly six digits are present.
    if (otpCode.length !== 6) {
      // Explain the incomplete OTP code.
      setLocalError("Enter the full 6-digit verification code.");

      // End the handler because the backend requires six digits.
      return;
    }

    // Infer the channel if Redux did not already store it.
    const targetChannel = otpChannel || inferOtpChannel(targetIdentifier);

    // Keep Redux aligned with manually entered OTP targets.
    dispatch(
      setRequiresOtp({
        requiresOtp: true,
        identifier: targetIdentifier,
        email: targetChannel === "EMAIL" ? targetIdentifier : undefined,
        channel: targetChannel,
      }),
    );

    // Submit the code to the backend verification endpoint.
    const result = await dispatch(verifyOtp({ identifier: targetIdentifier, channel: targetChannel, code: otpCode }));

    // Route the user after successful verification.
    if (verifyOtp.fulfilled.match(result)) {
      // Use dashboard when a token exists in the same browser session.
      if (accessToken || user) {
        // Send authenticated users into the application workspace.
        router.push("/dashboard");

        // End the handler after dashboard routing.
        return;
      }

      // Send direct-navigation verifications to login because no access token exists.
      router.push("/login");
    }
  };

  const handleResend = async () => {
    // Normalize the resend target from Redux or manual input.
    const targetIdentifier = (otpIdentifier || manualIdentifier).trim();

    // Block resend when the target is missing or the cooldown is active.
    if (!targetIdentifier || resendDisabled) return;

    // Clear stale feedback before asking for another code.
    dispatch(clearError());

    // Clear local errors before the resend request.
    setLocalError("");

    // Clear local success feedback before the resend request.
    setLocalMessage("");

    // Infer the channel if Redux did not already store one.
    const targetChannel = otpChannel || inferOtpChannel(targetIdentifier);

    // Save the target in Redux so verification uses the same account.
    dispatch(
      setRequiresOtp({
        requiresOtp: true,
        identifier: targetIdentifier,
        email: targetChannel === "EMAIL" ? targetIdentifier : undefined,
        channel: targetChannel,
      }),
    );

    // Start the cooldown immediately so repeated clicks cannot stack requests.
    setResendCountdown(120); // Use the Figma two-minute resend cooldown.
    setResendExpiresAt(Date.now() + 120_000); // Keep the two-minute deadline stable across delayed rendering.
    setIsResending(true); // Prevent verification of a code while a new one is being issued.

    // Ask the backend to invalidate old OTPs and send a fresh one.
    const result = await dispatch(resendOtp({ identifier: targetIdentifier, channel: targetChannel }));
    setIsResending(false); // Restore controls after delivery settles.

    // Show local success feedback only when the backend accepted the resend.
    if (resendOtp.fulfilled.match(result)) {
      // Confirm that a new code is on the way.
      setLocalMessage("A new verification code has been sent.");
      setCode(emptyOtpCode()); // Discard the invalidated code before the user enters the new one.
    } else { // A failed delivery must not trap the user behind a fresh two-minute wait.
      setResendCountdown(0); // Allow an explicit retry after the backend error is displayed.
      setResendExpiresAt(0); // Cancel the failed request's countdown interval as well as its display.
    }
  };

  // Prefer a friendly email label when one exists.
  const targetLabel = otpEmail || otpIdentifier || manualIdentifier;

  return (
    <AuthFrame contentAlignment="rail"> {/* Use the Figma content rail and full footer for verification screens. */}

      {/* Keep the OTP form aligned to the Figma 361px component width. */}
      <div className="w-full min-w-0"> {/* Let the heading span the available rail while controls retain their 361px width. */}
        <div className="mb-10 space-y-4"> {/* Match the 16px heading gap and 40px form separation. */}
          <h1 className="text-2xl font-medium leading-[30px] text-[var(--nba-black)]"> {/* Match Figma's 24px medium verification heading. */}
            You are one more step away from accessing your account{user?.firstName ? ", " : "."} {/* Keep the source copy meaningful for direct visits without an account name. */}
            {user?.firstName && <span className="text-[var(--nba-teal)] [overflow-wrap:anywhere]">{user.firstName}</span>} {/* Use the actual account name instead of the design's sample identity. */}
          </h1> {/* Finish the personalized heading. */}
          <p className="text-lg font-medium leading-7 text-[var(--nba-black)] [overflow-wrap:anywhere]"> {/* Preserve source typography while allowing long email addresses on mobile. */}
            {targetLabel ? (
              <>
                Enter the OTP sent to{" "} {/* Use the Figma verification prompt. */}
                <span className="text-[var(--nba-teal)]">{targetLabel}</span> {/* Match the highlighted delivery target. */}
              </>
            ) : (
              "Enter your email or phone number and the 6-digit code you received."
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-[361px] space-y-6"> {/* Keep the source field/button column independent of the wider heading. */}
          {!otpIdentifier && (
            <FormField
              label="Email / Phone Number"
              name="manualIdentifier"
              required
              value={manualIdentifier}
              onChange={(event) => setManualIdentifier(event.target.value)}
              placeholder="Your registered email or phone number"
            />
          )}

          {/* Reuse accessible Figma cells with paste, autofill, and responsive sizing. */}
          <OtpInput value={code} onChange={handleCodeChange} error={localError || error || undefined} disabled={isLoading || isResending} /> {/* Lock digits while a new code invalidates the previous one. */}

          <AppButton
            type="submit"
            disabled={isLoading || isResending || code.join("").length !== 6} // Keep verification unavailable during delivery or incomplete entry.
            fullWidth
            variant="primary" // The referenced OTP screen uses a primary action, not an outlined secondary button.
            loading={isLoading} // Expose the pending verification state to assistive technology.
          >
            {isLoading ? "Verifying" : "Verify OTP"} {/* Match the Figma action label and make pending work explicit. */}
          </AppButton>
        </form>

        <div className="mt-4 w-full max-w-[361px] text-center text-base font-medium leading-6"> {/* Match Figma's 16px gap beneath the verification button. */}
          {(localError || error) && <p role="alert" className="text-[var(--nba-danger)]">{localError || error}</p>} {/* Display actionable rejection feedback beside the resend state as designed. */}
          {localMessage && <p role="status" className="text-[var(--nba-teal)]">{localMessage}</p>} {/* Confirm delivery inline without a floating notification obscuring the screen. */}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled || !(otpIdentifier || manualIdentifier).trim()}
            aria-label={resendCountdown > 0 ? `Resend code in ${countdownLabel}` : "Resend code"} // Preserve a clear action name independently of the Figma display copy.
            className="text-[var(--nba-teal)] underline underline-offset-4 disabled:cursor-not-allowed disabled:text-[var(--nba-black)] disabled:no-underline" // Match the source teal resend link and neutral countdown text.
          >
            {isResending ? "Requesting a new code" : resendCountdown > 0 ? <>Request a new one in <span className="text-[var(--nba-teal)]">{countdownLabel}</span></> : "Request a new one"} {/* Use real countdown state rather than a static Figma timestamp. */}
          </button>
        </div>
      </div>
    </AuthFrame>
  );
}
