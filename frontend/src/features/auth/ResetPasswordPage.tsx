"use client";

// Import React effects so saved reset targets can hydrate the form after mount.
import { useEffect, useState } from "react";
// Import Link so auth navigation remains client-side.
import Link from "next/link";
// Import the shared button component used across auth screens.
import AppButton from "@/components/ui/AppButton";
// Import the auth frame so the reset page matches the signin/signup layout.
import AuthFrame from "@/components/layouts/AuthFrame";
// Import the shared field component so all auth inputs keep the same dimensions.
import { FormField } from "@/components/ui/FormField";
// Import the global message component for backend errors and success messages.
import GlobalMessage from "@/app/components/ui/GlobalMessage";
// Import the API client configured for local and hosted deployments.
import { api } from "@/app/services/api";
// Import API error normalization so backend messages reach the user.
import { apiErrorMessage } from "@/app/utils/apiError";
// Import password validation helpers shared by signup and reset flows.
import { passwordError, passwordRuleMessage } from "@/app/utils/validation";
// Import shared reset-target helpers so forgot and reset pages stay in sync.
import {
  clearPasswordResetTarget,
  inferPasswordResetChannel,
  normalizePasswordResetIdentifier,
  readPasswordResetTarget,
  type PasswordResetChannel,
} from "@/app/utils/passwordResetTarget";

// Describe the backend response returned after a successful password reset.
type ResetPasswordResponse = {
  // Keep the success message optional because a fallback copy is available.
  message?: string;
};

// Keep reset fields at the Figma 16px radius and neutral fill.
const controlClassName =
  "rounded-[16px] bg-[#f5f5f5] text-[#0a3d62] placeholder:font-normal placeholder:text-[#757575]";

// Keep the reset action at the Figma 60px height, 16px radius, and 18px label size.
const buttonClassName = "h-[60px] rounded-[16px] text-lg font-medium disabled:opacity-100";

// Render the password reset form that accepts a code and new password.
export default function ResetPasswordPage() {
  // Track the email address or phone number connected to the reset code.
  const [identifier, setIdentifier] = useState("");

  // Track the channel that matches the current identifier.
  const [channel, setChannel] = useState<PasswordResetChannel>("EMAIL");

  // Track the six-digit password reset code.
  const [code, setCode] = useState("");

  // Track the new password entered by the user.
  const [password, setPassword] = useState("");

  // Track the confirmation password used to prevent typos.
  const [confirmPassword, setConfirmPassword] = useState("");

  // Track validation or backend errors shown above the form.
  const [error, setError] = useState("");

  // Track the backend success state after the password has changed.
  const [success, setSuccess] = useState("");

  // Track the network state so the form cannot submit twice.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hydrate the form from the forgot-password page after the first browser paint.
  useEffect(() => {
    // Schedule storage access asynchronously to avoid updating state during effect setup.
    const hydrateResetTarget = window.setTimeout(() => {
      // Read the saved reset target from sessionStorage after the page mounts.
      const savedTarget = readPasswordResetTarget();

      // Leave the manual form empty when the user navigated here directly.
      if (!savedTarget) return;

      // Prefill the account identifier so the user only enters code and password.
      setIdentifier(savedTarget.identifier);

      // Prefill the backend channel so the reset code is checked against the right record.
      setChannel(savedTarget.channel);
    }, 0);

    // Cancel the scheduled hydration if the page unmounts immediately.
    return () => window.clearTimeout(hydrateResetTarget);
  }, []);

  // Normalize the identifier before validation and submission.
  const trimmedIdentifier = normalizePasswordResetIdentifier(identifier);

  // Validate the new password against the shared backend-equivalent rules.
  const passwordValidationError = password ? passwordError(password) : "Enter a new password.";

  // Detect a mismatch only after the user starts typing the confirmation field.
  const passwordMismatch = Boolean(confirmPassword) && password !== confirmPassword;

  // Detect a valid confirmation only when both fields match.
  const passwordMatches = Boolean(confirmPassword) && password === confirmPassword;

  // Validate the reset code as exactly six digits.
  const codeIsComplete = /^\d{6}$/.test(code);

  // Enable submit only when every client-side requirement is satisfied.
  const canSubmit =
    Boolean(trimmedIdentifier) &&
    codeIsComplete &&
    !passwordValidationError &&
    passwordMatches &&
    !isSubmitting;

  // Keep channel in sync when the user edits the account identifier manually.
  const handleIdentifierChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Read the field value from the input event.
    const nextIdentifier = event.target.value;

    // Store the visible identifier in state.
    setIdentifier(nextIdentifier);

    // Update the channel guess so direct-navigation resets work for email and SMS.
    setChannel(inferPasswordResetChannel(nextIdentifier));
  };

  // Keep the reset code numeric and capped at six characters.
  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Strip non-digits and cap the code at the backend-required length.
    const nextCode = event.target.value.replace(/\D/g, "").slice(0, 6);

    // Store the sanitized code in state.
    setCode(nextCode);
  };

  // Submit the reset code and new password to the backend.
  const handleSubmit = async (event: React.FormEvent) => {
    // Prevent the browser from reloading the page.
    event.preventDefault();

    // Clear previous status before validating the latest form values.
    setError("");

    // Clear previous success text before a new reset attempt.
    setSuccess("");

    // Block missing identifiers before calling the backend.
    if (!trimmedIdentifier) {
      // Show the exact missing field message.
      setError("Enter the email or phone number connected to this account.");

      // Stop because the backend requires an account target.
      return;
    }

    // Block incomplete reset codes before calling the backend.
    if (!codeIsComplete) {
      // Show the exact reset code requirement.
      setError("Enter the 6-digit reset code.");

      // Stop because the backend requires a six-character code.
      return;
    }

    // Block weak passwords before calling the backend.
    if (passwordValidationError) {
      // Show the shared password validation message.
      setError(passwordValidationError);

      // Stop because the backend uses the same password policy.
      return;
    }

    // Block confirmation typos before calling the backend.
    if (!passwordMatches) {
      // Show the mismatch message beside the global form status.
      setError("Password doesn't match.");

      // Stop because the user must confirm the new password.
      return;
    }

    // Mark the request as loading after all client-side validation passes.
    setIsSubmitting(true);

    // Submit the reset request to the backend.
    try {
      // Ask the API to verify the code and update the password.
      const response = await api.post<ResetPasswordResponse>("/auth/reset-password", {
        // Send the normalized email or phone number.
        identifier: trimmedIdentifier,
        // Send the selected or inferred channel.
        channel,
        // Send the sanitized six-digit reset code.
        code,
        // Send the new password after client-side validation.
        password,
      });

      // Clear the handoff target after the password has changed successfully.
      clearPasswordResetTarget();

      // Remove sensitive reset fields from the browser state.
      setCode("");

      // Remove the new password from the browser state.
      setPassword("");

      // Remove the confirmation password from the browser state.
      setConfirmPassword("");

      // Show the backend success message or a stable fallback.
      setSuccess(response.data.message || "Password reset successfully. You can now sign in.");
    } catch (resetError) {
      // Show the backend validation message when available.
      setError(apiErrorMessage(resetError, "Unable to reset password. Please check the code and try again."));
    } finally {
      // Re-enable the form after success or failure finishes.
      setIsSubmitting(false);
    }
  };

  // Render the reset form and success state in the shared auth frame.
  return (
    <AuthFrame footerMinimal>
      {/* Show backend and validation errors above the reset form. */}
      {error && <GlobalMessage variant="error">{error}</GlobalMessage>}

      {/* Show success feedback after the password changes. */}
      {success && <GlobalMessage variant="success">{success}</GlobalMessage>}

      {/* Keep the reset form width aligned with the existing auth screens. */}
      {/* Keep the reset form at the Figma large-control width of 361px. */}
      <div className="mx-auto w-full max-w-[361px]">
        {/* Keep the title and copy aligned with the existing Figma auth proportions. */}
        <div className="mb-10 text-left">
          <h1 className="text-[32px] font-medium leading-[38px] text-[#111111]">Create New Password</h1>
          <p className="mt-7 text-base font-medium leading-6 text-[#111111]">
            Enter your reset code and create a new password for your account
          </p>
        </div>

        {/* Submit the reset code and replacement password. */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Capture the account target so direct route visits still work. */}
          <FormField
            label="Account Email / Phone Number"
            name="identifier"
            required
            value={identifier}
            onChange={handleIdentifierChange}
            placeholder="name@example.com / +233..."
            className={controlClassName}
            helpText={!identifier ? "Enter the account that received the reset code." : undefined}
          />

          {/* Capture the reset code sent by email or SMS. */}
          <FormField
            label="Reset Code"
            name="code"
            required
            value={code}
            onChange={handleCodeChange}
            placeholder="6-digit code"
            inputMode="numeric"
            maxLength={6}
            className={controlClassName}
            error={code && !codeIsComplete ? "Reset code must be 6 digits." : undefined}
          />

          {/* Capture the new password using the shared password rules. */}
          <FormField
            label="New Password"
            name="password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter a new password"
            className={controlClassName}
            error={password && passwordValidationError ? passwordValidationError : undefined}
            helpText={!password ? passwordRuleMessage : undefined}
          />

          {/* Confirm the new password so users catch typos before submission. */}
          <FormField
            label="Confirm New Password"
            name="confirmPassword"
            required
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter the new password again"
            className={controlClassName}
            status={passwordMatches ? "success" : passwordMismatch ? "error" : "default"}
            error={passwordMismatch ? "Password doesn't match." : undefined}
            helpText={passwordMatches ? "Password matches" : undefined}
          />

          {/* Submit the completed reset form. */}
          <AppButton
            type="submit"
            fullWidth
            size="lg"
            className={buttonClassName}
            disabled={!canSubmit}
          >
            {isSubmitting ? "Submitting" : "Submit"}
          </AppButton>
        </form>

        {/* Keep recovery navigation visible after direct visits or successful resets. */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <Link href="/forgot-password" className="text-[#008080] underline underline-offset-2">
            Request another code
          </Link>
          <Link href="/login" className="text-[#008080] underline underline-offset-2">
            Back to login
          </Link>
        </div>
      </div>
    </AuthFrame>
  );
}
