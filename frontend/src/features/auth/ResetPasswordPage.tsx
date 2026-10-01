"use client";

// Import React effects so saved reset targets can hydrate the form after mount.
import { useEffect, useState } from "react";
import Image from "next/image"; // Use original Figma password and pending assets.
import OtpInput from "@/components/ui/OtpInput"; // Reuse the accessible six-cell code entry.
import styles from "./RecoveryPage.module.css"; // Share the measured recovery rail and control column.
// Import Link so auth navigation remains client-side.
import Link from "next/link";
// Import the shared button component used across auth screens.
import AppButton from "@/components/ui/AppButton";
// Import the auth frame so the reset page matches the signin/signup layout.
import AuthFrame from "@/components/layouts/AuthFrame";
// Import the shared field component so all auth inputs keep the same dimensions.
import { FormField } from "@/components/ui/FormField";
// Import the global message component for backend errors and success messages.
// Import the API client configured for local and hosted deployments.
import { api } from "@/app/services/api";
// Import API error normalization so backend messages reach the user.
import { apiErrorMessage } from "@/app/utils/apiError";
// Import password validation helpers shared by signup and reset flows.
import { passwordError } from "@/app/utils/validation"; // Retain the backend-equivalent password policy.
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
  const [codeDigits, setCodeDigits] = useState(() => Array.from({ length: 6 }, () => "")); // Preserve empty OTP positions during deletion and keyboard editing.
  const code = codeDigits.join(""); // Submit the six-digit string only once every cell is populated.

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
  const [step, setStep] = useState<"code" | "password">("code"); // Collect the reset code before showing the source two-password screen.
  const [showPassword, setShowPassword] = useState(false); // Reveal the new password only on explicit action.
  const [showConfirmation, setShowConfirmation] = useState(false); // Toggle confirmation independently.

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

  // Submit the reset code and new password to the backend.
  const handleSubmit = async (event: React.FormEvent) => {
    // Prevent the browser from reloading the page.
    event.preventDefault();
    if (isSubmitting || success) return; // Reject duplicate or already-completed reset submissions.

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
    if (step === "code") { // Code entry is not proof of verification until the final API transaction succeeds.
      setStep("password"); // Present the exact two-field new-password composition.
      return; // Keep code and target only in component memory until final submission.
    } // Finish the local step transition.

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
      setCodeDigits(Array.from({ length: 6 }, () => "")); // Clear every sensitive code cell after success.

      // Remove the new password from the browser state.
      setPassword("");

      // Remove the confirmation password from the browser state.
      setConfirmPassword("");

      // Show the backend success message or a stable fallback.
      setSuccess(response.data.message || "Password reset successfully. You can now sign in.");
    } catch (resetError) {
      // Show the backend validation message when available.
      setError(apiErrorMessage(resetError, "Unable to reset password. Please check the code and try again."));
      setStep("code"); // Make the target and code editable after a rejected reset transaction.
    } finally {
      // Re-enable the form after success or failure finishes.
      setIsSubmitting(false);
    }
  };

  // Render the reset form and success state in the shared auth frame.
  return (
    <AuthFrame footerMinimal contentAlignment="rail"> {/* Align both recovery steps to the Figma content rail. */}
      {/* Show backend and validation errors above the reset form. */}

      {/* Show success feedback after the password changes. */}

      {/* Keep the reset form width aligned with the existing auth screens. */}
      {/* Keep the reset form at the Figma large-control width of 361px. */}
      <div className={styles.content}> {/* Separate heading width from the 361px controls. */}
        {error && <div role="alert" className={styles.feedback}><Image src="/design-assets/icons/auth-warning.svg" alt="" width={24} height={24} />{error}</div>} {/* Reserve space for real failures on narrow screens. */}
        {success && <p role="status" className="mb-6 text-[#008080]">{success}</p>} {/* Announce the backend-confirmed password change. */}
        {/* Keep the title and copy aligned with the existing Figma auth proportions. */}
        <div className="mb-10 text-left">
          <h1 className={styles.resetTitle}>{success ? "Password Reset Successfully" : step === "code" ? "Enter Your Reset Code" : "Create New Password"}</h1> {/* Name the current step without implying an unverified code is valid. */}
          {!success && <p className={styles.description}>{step === "code" ? "Enter the code sent to your email or phone number" : "Create your new password so you can use it to access your account"}</p>} {/* Preserve source copy on the password screen. */}
        </div>

        {/* Submit the reset code and replacement password. */}
        {!success && <form className={styles.form} onSubmit={handleSubmit} aria-busy={isSubmitting}> {/* Stop rendering sensitive fields after a completed reset. */}
          {step === "code" ? <> {/* Keep transport fields on the code-entry step only. */}
          {/* Capture the account target so direct route visits still work. */}
          <FormField
            label="Account Email / Phone Number"
            name="identifier"
            required
            disabled={isSubmitting} // Freeze the target while the backend verifies the transaction.
            value={identifier}
            onChange={handleIdentifierChange}
            placeholder="name@example.com / +233..."
            className={controlClassName}
            helpText={!identifier ? "Enter the account that received the reset code." : undefined}
          />

          {/* Capture the reset code sent by email or SMS. */}
          <OtpInput label="Reset Code" value={codeDigits} onChange={(digits) => { setCodeDigits(digits); setError(""); }} disabled={isSubmitting} /> {/* Retain numeric paste, keyboard navigation, and one-time-code autofill. */}
          </> : <> {/* Render only the two source password fields in the next step. */}

          {/* Capture the new password using the shared password rules. */}
          <FormField
            label="New Password"
            name="password"
            aria-required="true" // Preserve required semantics without adding an asterisk absent from the source.
            type={showPassword ? "text" : "password"} // Reveal only when requested.
            disabled={isSubmitting} // Keep the submitted password immutable while pending.
            autoComplete="new-password" // Support password-manager generation.
            value={password}
            onChange={(event) => { setPassword(event.target.value); setError(""); }} // Clear obsolete request feedback during correction.
            placeholder="Enter a new password"
            className={controlClassName}
            error={password && passwordValidationError ? passwordValidationError : undefined}
            rightIcon={<Image src={`/design-assets/icons/password-${showPassword ? "visible" : password ? "hidden" : "hidden-empty"}.svg`} alt="" width={24} height={24} />} // Keep the original password state glyph.
            rightIconLabel={showPassword ? "Hide password" : "Show password"} // Name the visibility action.
            onRightIconClick={() => setShowPassword((visible) => !visible)} // Preserve the value when toggling visibility.
          />

          {/* Confirm the new password so users catch typos before submission. */}
          <FormField
            label="Confirm New Password"
            name="confirmPassword"
            aria-required="true" // Match source labels while retaining accessible requirements.
            type={showConfirmation ? "text" : "password"} // Keep confirmation visibility independent.
            disabled={isSubmitting} // Lock confirmation with the submitted password.
            autoComplete="new-password" // Support password-manager confirmation.
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter a new password" // Match the source confirmation copy.
            className={controlClassName}
            status={passwordMatches ? "success" : passwordMismatch ? "error" : "default"}
            error={passwordMismatch ? "Password doesn't match." : undefined}
            helpText={passwordMatches ? "Password matches" : "Ensure it matches with the new password entered above"} // Retain the source guidance in the empty state.
            rightIcon={<Image src={`/design-assets/icons/password-${showConfirmation ? "visible" : confirmPassword ? "hidden" : "hidden-empty"}.svg`} alt="" width={24} height={24} />} // Use the original confirmation visibility glyph.
            rightIconLabel={showConfirmation ? "Hide confirmation password" : "Show confirmation password"} // Distinguish both visibility controls.
            onRightIconClick={() => setShowConfirmation((visible) => !visible)} // Toggle without modifying the password.
          />
          </>} {/* Finish the current step's input group. */}

          {/* Submit the completed reset form. */}
          <AppButton
            type="submit"
            fullWidth
            size="lg"
            className={buttonClassName}
            disabled={step === "code" ? !trimmedIdentifier || !codeIsComplete || isSubmitting : !canSubmit} // Validate only the fields required by the current step.
            loading={isSubmitting} // Announce the pending backend transaction.
            leftIcon={isSubmitting ? <Image className={styles.spinner} src="/design-assets/icons/auth-loading.svg" alt="" width={24} height={24} /> : undefined} // Preserve the source loading icon.
          >
            {isSubmitting ? "Submitting" : step === "code" ? "Continue" : "Submit"} {/* Do not label local code entry as server verification. */}
          </AppButton>
        </form>} {/* Finish the active recovery form. */}

        {/* Keep recovery navigation visible after direct visits or successful resets. */}
        <div className={`${styles.support} ${step === "password" && !success ? styles.resetSupport : ""} flex flex-wrap gap-3`}> {/* Keep supplementary navigation outside the source's measured password composition. */}
          {step === "password" && !success && <button type="button" disabled={isSubmitting} onClick={() => setStep("code")} className="text-[#008080] underline">Edit reset code</button>} {/* Allow correction before a failed backend request. */}
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
