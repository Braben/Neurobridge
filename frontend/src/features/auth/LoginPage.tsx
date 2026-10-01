"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/hooks/useRedux";
import { loginUser, clearError, sendOtp, setRequiresOtp } from "@/app/store/slices/authSlice";
import Link from "next/link";
import AppButton from "@/components/ui/AppButton";
import AuthFrame from "@/components/layouts/AuthFrame";
import { FormField } from "@/components/ui/FormField";
import Image from "next/image"; // Render original Figma icons at their native 24px size.
import styles from "./LoginPage.module.css"; // Keep signin geometry isolated from the other authentication forms.
import { readPendingVerification } from "./pendingVerification"; // Resume a same-tab therapist verification handoff without confusing it with approval.

export default function LoginPage({ audience }: { audience?: "PARENT" | "THERAPIST" | "ADMIN" }) { // Use route intent for presentation only; the backend determines the authenticated role.
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Keep the form locked through both login and any subsequent OTP delivery.
  const busy = isLoading || isSubmitting; // Combine session hydration with the complete signin workflow.
  const ready = Boolean(identifier.trim() && password); // Match the disabled empty state without inventing stricter login password rules.
  const greeting = audience === "PARENT" ? ", dear parent" : audience === "THERAPIST" ? ", dear therapist" : audience === "ADMIN" ? ", Admin" : ""; // Match the requested role frame while retaining a neutral shared URL.
  const signupHref = audience === "ADMIN" ? "/register/admin" : audience ? `/register?role=${audience}` : "/register"; // Preserve the selected audience when moving to registration.
  const passwordIcon = showPassword ? "password-visible.svg" : password ? "password-hidden.svg" : "password-hidden-empty.svg"; // Select the original Figma empty, hidden, or visible glyph.

  const handleSubmit = async (e: React.FormEvent) => {
    // Stop the browser from submitting the form with a full page reload.
    e.preventDefault();
    if (busy || !ready) return; // Reject duplicate submissions and whitespace-only account identifiers.
    setIsSubmitting(true); // Cover the full asynchronous handoff rather than just the credentials request.
    try { // Restore editability after either a rejected request or a completed handoff.
      dispatch(clearError()); // Clear stale API feedback before retrying.
      const trimmedIdentifier = identifier.trim(); // Keep request and OTP routing targets consistent.
      const isEmail = trimmedIdentifier.includes("@"); // Preserve the backend's email-or-phone discriminator.
      const payload = isEmail ? { email: trimmedIdentifier, password } : { phone: trimmedIdentifier, password }; // Send only the supported login fields.
      const result = await dispatch(loginUser(payload)); // Let Redux retain the server-issued user and token.
      if (!loginUser.fulfilled.match(result)) return; // Remain on signin when credentials are rejected.
      const user = result.payload.user; // Trust the server response, not the presentation role query.
      const needsAccountVerification = Boolean(readPendingVerification(user.id)) || (!user.isApproved && user.role !== "THERAPIST"); // Preserve pending therapist OTP separately from administrative approval.
      if (needsAccountVerification) { // Save the handoff before requesting delivery or navigating.
        dispatch(setRequiresOtp({ requiresOtp: true, identifier: trimmedIdentifier, email: isEmail ? trimmedIdentifier : undefined, channel: isEmail ? "EMAIL" : "SMS" })); // Preserve the same target and channel throughout verification.
        await dispatch(sendOtp({ identifier: trimmedIdentifier, channel: isEmail ? "EMAIL" : "SMS" })); // Keep controls locked while a fresh code is requested.
        router.push("/verify-otp"); // Let verification display delivery feedback and handle retry.
        return; // Do not route an unverified account to the dashboard.
      } // Finish pending-account handling.
      router.push("/dashboard"); // Route approved users and pending therapists to their normal workspace.
    } finally { // Clear the workflow lock regardless of the request outcome.
      setIsSubmitting(false); // Allow correction and retry after failed authentication.
    } // Finish the complete login-to-OTP transaction.
  };

  return (
    <AuthFrame contentAlignment="rail"> {/* Reuse the same x603 content rail as the inspected signin frames. */}
      <div className={styles.content}> {/* Allow the heading to extend beyond the narrow form, as it does in Figma. */}
        {error && ( // Preserve actual API feedback without misdiagnosing every failure as incorrect credentials.
          <div role="alert" className={styles.feedback}> {/* Use Figma's desktop warning and reserve inline mobile space to avoid overlapping text. */}
            <Image src="/design-assets/icons/auth-warning.svg" alt="" width={24} height={24} unoptimized /> {/* Keep the exported warning glyph unmodified. */}
            <span>{error}</span> {/* Display the actionable server message. */}
          </div> // Finish the signin-only feedback surface.
        )} {/* Keep notification layout inside the form's responsive content stack. */}
        <div className={styles.heading}> {/* Preserve the 16px heading gap and 40px separation from fields. */}
          <p className={styles.welcome}> {/* Use the reference 24px/30px medium welcome line. */}
            Welcome back to <span className={styles.accent}>Neuro Bridge Africa</span> {/* Keep the product name in source teal. */}
          </p> {/* Finish the welcome line. */}
          <h1 className={styles.title}>Login to your account{greeting}</h1> {/* Select the role-specific Figma heading without changing it as users type. */}
        </div> {/* Finish the wide heading block. */}

        <form onSubmit={handleSubmit} className={styles.form} aria-busy={busy}> {/* Keep controls in the reference 361px column and expose pending state. */}
          <FormField
            label="Email / Phone Number"
            name="identifier"
            type="text"
            required
            autoComplete="username" // Allow account autofill without requiring an email-only input type.
            disabled={busy} // Prevent credentials changing during an in-flight request.
            className={identifier ? styles.filled : undefined} // Retain the active field appearance after focus leaves a populated control.
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); if (error) dispatch(clearError()); }} // Clear stale rejection feedback when the account is corrected.
            placeholder="Your registered email or Phone number"
          />

          <div className={styles.passwordArea}> {/* Keep the recovery link eight pixels below the password field. */}
          <FormField
            label="Your Password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password" // Keep password managers on the signin rather than new-password workflow.
            disabled={busy} // Lock password editing and visibility while credentials are being submitted.
            className={password ? styles.filled : undefined} // Match the filled-state border even after the toggle receives focus.
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (error) dispatch(clearError()); }} // Preserve the new input while removing obsolete server feedback.
            placeholder="Enter your password"
            rightIcon={<Image src={`/design-assets/icons/${passwordIcon}`} alt="" width={24} height={24} unoptimized />} // Use the Figma asset rather than a hand-drawn substitute.
            rightIconLabel={showPassword ? "Hide password" : "Show password"}
            onRightIconClick={() => setShowPassword((visible) => !visible)}
          />

            <Link href="/forgot-password" className={styles.recovery}> {/* Preserve the reference right-aligned 12px recovery link. */}
              Forgot Password?
            </Link>
          </div> {/* Finish the combined password and recovery component. */}

          <AppButton
            type="submit"
            disabled={!ready || busy} // Match the pale-blue empty state and block duplicate login requests.
            loading={busy} // Announce the pending state through the shared control.
            rightIcon={busy ? <Image src="/design-assets/icons/auth-loading.svg" alt="" width={24} height={24} unoptimized className={styles.spinner} /> : undefined} // Animate the original loading-loop asset without altering its dimensions.
            fullWidth
            variant="primary"
            size="lg"
          >
            {busy ? "Loading" : "Login"} {/* Preserve Figma's loading label across the full OTP handoff. */}
          </AppButton>
        </form>

        <p className={styles.signup}> {/* Use the source 16px button-to-signup gap. */}
          Don&apos;t have an account?{" "}
          <Link href={signupHref} className={styles.signupLink}> {/* Keep the source teal underline and the selected registration route. */}
            Sign Up
          </Link>
        </p>
      </div>
    </AuthFrame>
  );
}
