"use client";

// Import React state so the form can track submission and validation feedback.
import { useState } from "react";
import Image from "next/image"; // Reuse the original warning and pending icons.
import styles from "./RecoveryPage.module.css"; // Match the measured recovery composition.
// Import Link so secondary auth navigation stays client-side.
import Link from "next/link";
// Import the router so a successful request can move to the reset route.
import { useRouter } from "next/navigation";
// Import the shared button component used by the auth screens.
import AppButton from "@/components/ui/AppButton";
// Import the auth frame so spacing and branding match the other public auth pages.
import AuthFrame from "@/components/layouts/AuthFrame";
// Import the shared field component so input sizing follows the existing Figma-matched controls.
import { FormField } from "@/components/ui/FormField";
// Import the global message component for backend and validation errors.
// Import the API client configured with the deployment base URL.
import { api } from "@/app/services/api";
// Import the API error helper so backend messages are shown instead of generic Axios text.
import { apiErrorMessage } from "@/app/utils/apiError";
// Import reset-target helpers shared with the reset password page.
import {
  inferPasswordResetChannel,
  normalizePasswordResetIdentifier,
  savePasswordResetTarget,
  type PasswordResetChannel,
} from "@/app/utils/passwordResetTarget";

// Describe the password reset request response returned by the backend.
type RequestPasswordResetResponse = {
  // Keep the message available for future UI copy even though this page routes immediately.
  message: string;
  // Store the backend-normalized identifier when it is returned.
  resetIdentifier?: string;
  // Store the backend-selected channel when it is returned.
  resetChannel?: PasswordResetChannel;
};

// Keep recovery fields at the Figma 16px radius and neutral fill.
const controlClassName =
  "rounded-[16px] bg-[#f5f5f5] text-[#0a3d62] placeholder:font-normal placeholder:text-[#757575]";

// Keep recovery actions at the Figma 60px height, 16px radius, and 18px label size.
const buttonClassName = "h-[60px] rounded-[16px] text-lg font-medium disabled:opacity-100";

// Render the password reset code request page.
export default function ForgotPasswordPage() {
  // Create a router instance for the reset-page transition.
  const router = useRouter();

  // Track the email address or phone number typed by the user.
  const [identifier, setIdentifier] = useState("");

  // Track a user-facing error from local validation or the backend.
  const [error, setError] = useState("");

  // Track the network state so the button cannot submit twice.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enable the button only when an identifier exists and no request is in flight.
  const canSubmit = Boolean(identifier.trim()) && !isSubmitting;

  // Request a reset code and hand off the target to the next page.
  const handleSubmit = async (event: React.FormEvent) => {
    // Prevent the browser from reloading the route.
    event.preventDefault();
    if (isSubmitting) return; // Do not overlap reset-code requests.

    // Clear stale errors before validating the latest input.
    setError("");

    // Normalize the identifier before validation and submission.
    const trimmedIdentifier = normalizePasswordResetIdentifier(identifier);

    // Block empty submissions before calling the backend.
    if (!trimmedIdentifier) {
      // Show a direct validation message for the missing target.
      setError("Enter your email or phone number to receive a reset code.");

      // Stop because the API requires an identifier.
      return;
    }

    // Mark the request as loading after the client-side validation passes.
    setIsSubmitting(true);

    // Send the request to the backend password reset endpoint.
    try {
      // Ask the API to generate and deliver a password reset code.
      const response = await api.post<RequestPasswordResetResponse>("/auth/request-password-reset", {
        // Send the normalized identifier so email and phone lookup is consistent.
        identifier: trimmedIdentifier,
      });

      // Prefer the backend-normalized identifier when it is present.
      const resetIdentifier = response.data.resetIdentifier || trimmedIdentifier;

      // Prefer the backend channel and infer only when the API omits it.
      const resetChannel = response.data.resetChannel || inferPasswordResetChannel(resetIdentifier);

      // Save the reset target so the reset page can prefill the account field.
      savePasswordResetTarget({ identifier: resetIdentifier, channel: resetChannel });

      // Move the user to the page that accepts the reset code and new password.
      router.push("/reset-password");
    } catch (requestError) {
      // Show the backend error when available, otherwise use a clear fallback.
      setError(apiErrorMessage(requestError, "Unable to send a reset code. Please try again."));
    } finally {
      // Re-enable the button after success or failure finishes.
      setIsSubmitting(false);
    }
  };

  // Render the code request form in the shared auth frame.
  return (
    <AuthFrame footerMinimal contentAlignment="rail"> {/* Match the source x603 alignment. */}
      {/* Show errors above the form so the layout does not jump inside the field. */}

      {/* Keep the form width aligned with the existing auth page design. */}
      {/* Keep the recovery form at the Figma large-control width of 361px. */}
      <div className={styles.content}> {/* Let the heading use the wider source rail. */}
        {error && <div role="alert" className={styles.feedback}><Image src="/design-assets/icons/auth-warning.svg" alt="" width={24} height={24} />{error}</div>} {/* Reserve real space for backend failure feedback. */}
        {/* Keep the heading and description visually consistent with the Figma auth board. */}
        <div className="mb-10 text-left">
          <h1 className={styles.recoveryTitle}>Forgot Password</h1> {/* Match source 24px semibold typography. */}
          <p className={styles.description}> {/* Preserve the source 16px heading gap and 18px body text. */}
            Enter your email or phone number to get a code to reset your password
          </p>
        </div>

        {/* Submit the account identifier to request a reset code. */}
        <form className={styles.form} onSubmit={handleSubmit} aria-busy={isSubmitting}> {/* Keep controls at 361px independently of the wider heading. */}
          {/* Capture either email or phone because the backend accepts one identifier field. */}
          <FormField
            label="Email / Phone Number"
            name="identifier"
            required
            value={identifier}
            onChange={(event) => { setIdentifier(event.target.value); setError(""); }} // Clear stale feedback during correction.
            disabled={isSubmitting} // Preserve the submitted target while the API responds.
            autoComplete="username" // Allow the browser to suggest the user's saved identifier.
            placeholder="Your registered email / phone number"
            className={controlClassName}
          />

          {/* Send the reset code request and then route to the reset-password page. */}
          <AppButton
            type="submit"
            fullWidth
            size="lg"
            className={buttonClassName}
            disabled={!canSubmit}
            loading={isSubmitting} // Announce pending state and block duplicate activation.
            leftIcon={isSubmitting ? <Image className={styles.spinner} src="/design-assets/icons/auth-loading.svg" alt="" width={24} height={24} /> : undefined} // Use the original pending asset.
          >
            {isSubmitting ? "Sending" : "Get Password Reset Code"}
          </AppButton>
        </form>

        {/* Keep account-recovery support links from the previous design. */}
        <div className={styles.support}> {/* Match the source 16px link gap and left alignment. */}
          <Link href="/contact?subject=Account%20recovery" className="text-[#008080] underline underline-offset-2"> {/* Route lost-access requests to the real administrator contact workflow. */}
            Lost access to your email and phone number?
          </Link>
        </div>
      </div>
    </AuthFrame>
  );
}
