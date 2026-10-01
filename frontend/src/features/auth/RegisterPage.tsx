"use client";

import { useRef, useState } from "react"; // Guard repeat submissions while retaining form state.
import Image from "next/image"; // Render original Figma assets unchanged.
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/hooks/useRedux";
import { registerUser, clearError } from "@/app/store/slices/authSlice";
import Link from "next/link";
import AppButton from "@/components/ui/AppButton";
import AuthFrame from "@/components/layouts/AuthFrame";
import { FormField, SelectField } from "@/components/ui/FormField";
import { passwordError, validateAdultDateOfBirth } from "@/app/utils/validation"; // Reuse backend-equivalent validation.
import styles from "./RegisterPage.module.css"; // Keep signup geometry scoped to this feature.

type RegisterRole = "PARENT" | "THERAPIST";

const roleLabels: Record<RegisterRole, string> = {
  PARENT: "Parent",
  THERAPIST: "Therapist",
};

const expertiseOptions = [
  "ADHD Therapy",
  "Speech Therapy",
  "Occupational Therapy",
  "Behavioural Therapy",
  "Special Education",
  "Child Psychology",
  "Developmental Therapy",
];

function EyeIcon({ hidden, filled }: { hidden: boolean; filled: boolean }) { // Select the matching empty, filled, or visible Figma state.
  return <Image src={`/design-assets/icons/password-${!hidden ? "visible" : filled ? "hidden" : "hidden-empty"}.svg`} alt="" width={24} height={24} />; // Keep the original glyph at its native size.
} // Finish the password asset selector.

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || parts[0] || "",
  };
}

export default function RegisterPage({
  initialRole = "PARENT",
}: {
  initialRole?: RegisterRole;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: "",
    firstName: "",
    lastName: "",
    identifier: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
    role: initialRole,
    areaofexpertise: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false); // Preserve the request lock through successful navigation.
  const submitLock = useRef(false); // Prevent duplicate submissions before React repaints.
  const busy = isLoading || submitting; // Combine store and local request state.

  const selectedRole = formData.role;
  const passwordMatches = Boolean(formData.confirmPassword) && formData.password === formData.confirmPassword;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target; // Capture event data before the state callback runs.
    setFormData((current) => ({ ...current, [name]: value })); // Preserve other edits without a stale closure.
    setValidationError(null); // Clear stale validation when the user corrects a value.
    if (error) dispatch(clearError()); // Clear an earlier API rejection on correction.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current || busy) return; // Ignore repeated activation during an outstanding request.
    dispatch(clearError());
    setValidationError(null);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }
    const passwordValidationError = passwordError(formData.password);
    if (passwordValidationError) {
      setValidationError(passwordValidationError);
      return;
    }
    if (!formData.dateOfBirth) {
      setValidationError("Date of birth is required");
      return;
    }
    const dateValidationError = validateAdultDateOfBirth(formData.dateOfBirth);
    if (dateValidationError) {
      setValidationError(dateValidationError);
      return;
    }
    if (!formData.identifier.trim()) {
      setValidationError("Email or phone number is required");
      return;
    }
    if (formData.role === "THERAPIST" && !formData.areaofexpertise) {
      setValidationError("Therapists must provide an area of expertise");
      return;
    }

    const names = formData.role === "THERAPIST"
      ? splitFullName(formData.fullName)
      : {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
        };

    if (!names.firstName || !names.lastName) {
      setValidationError(formData.role === "THERAPIST" ? "Full name is required" : "First and last name are required");
      return;
    }

    const identifier = formData.identifier.trim();
    const identifierPayload = identifier.includes("@")
      ? { email: identifier }
      : { phone: identifier };

    const payload = {
      firstName: names.firstName,
      lastName: names.lastName,
      identifier,
      ...identifierPayload,
      dateOfBirth: formData.dateOfBirth,
      password: formData.password,
      role: formData.role,
      ...(formData.role === "THERAPIST" && {
        areaofexpertise: formData.areaofexpertise,
      }),
    };

    submitLock.current = true; // Acquire the synchronous submission lock.
    setSubmitting(true); // Lock fields while the account is being created.
    const result = await dispatch(registerUser(payload)); // Retain the existing registration and OTP persistence contract.
    if (registerUser.fulfilled.match(result)) {
      router.push(result.payload.requiresOtp ? "/verify-otp" : "/dashboard");
    } else { // Leave successful requests locked until navigation finishes.
      submitLock.current = false; // Permit an intentional retry after rejection.
      setSubmitting(false); // Re-enable the fields without discarding values.
    }
  };

  return (
    <AuthFrame footerMinimal contentAlignment="rail"> {/* Match the source x603 form origin. */}
      <div className={styles.content}> {/* Preserve the 746px reference width. */}
        {(validationError || error) && <div role="alert" className={styles.feedback}><Image src="/design-assets/icons/auth-warning.svg" alt="" width={24} height={24} />{validationError || error}</div>} {/* Show actual failures without covering narrow-screen fields. */}
        <div className="mb-10"> {/* Keep the source 40px heading gap. */}
          <h1 className={styles.title}> {/* Use fixed typography with responsive wrapping. */}
            Sign Up as a {roleLabels[selectedRole]} to{" "}
            <span className="text-[#008080]">Neuro Bridge Africa</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} aria-busy={busy}> {/* Expose request state to assistive technology. */}
          <fieldset disabled={busy} className={styles.fields}> {/* Freeze every field and visibility control while submitting. */}
          {selectedRole === "THERAPIST" ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                label="Full Name"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
              <div className={styles.dateField} data-empty={!formData.dateOfBirth}> {/* Decorate the native date input with the source calendar and placeholder. */}
              <FormField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              </div> {/* Keep the native picker and label together. */}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                label="First Name"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
              />
              <FormField
                label="Last Name"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
              />
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className={selectedRole === "PARENT" ? styles.dateField : undefined} data-empty={!formData.dateOfBirth}> {/* Apply date decoration only to the parent's birth-date slot. */}
            <FormField
              label={selectedRole === "THERAPIST" ? "Email or Phone Number" : "Date of Birth"}
              name={selectedRole === "THERAPIST" ? "identifier" : "dateOfBirth"}
              type={selectedRole === "THERAPIST" ? "text" : "date"}
              required
              value={selectedRole === "THERAPIST" ? formData.identifier : formData.dateOfBirth}
              onChange={handleChange}
              placeholder={selectedRole === "THERAPIST" ? "Enter your email or phone number" : undefined}
            />
            </div> {/* Preserve the field's grid cell across role variants. */}
            {selectedRole === "THERAPIST" ? (
              <SelectField
                label="Area of Expertise"
                name="areaofexpertise"
                required
                value={formData.areaofexpertise}
                onChange={handleChange}
              >
                <option value="">What&apos;s your area of expertise</option>
                {expertiseOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectField>
            ) : (
              <FormField
                label="Email or Phone Number"
                name="identifier"
                type="text"
                required
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Enter your email or phone number"
              />
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              label="Create Your Password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              rightIcon={<EyeIcon hidden={!showPassword} filled={Boolean(formData.password)} />} // Use the original Figma visibility state.
              rightIconLabel={showPassword ? "Hide password" : "Show password"}
              onRightIconClick={() => setShowPassword((visible) => !visible)}
              error={
                validationError?.toLowerCase().includes("password")
                  ? validationError
                  : undefined
              }
            />
            <FormField
              label="Confirm Your Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password" // Preserve the source placeholder copy.
              status={
                passwordMatches
                  ? "success"
                  : formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? "error"
                    : "default"
              }
              error={
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? "Password doesn't match"
                  : undefined
              }
              helpText={
                passwordMatches
                  ? "Password matches"
                  : undefined
              }
              rightIcon={<EyeIcon hidden={!showConfirmPassword} filled={Boolean(formData.confirmPassword)} />} // Preserve independent confirmation visibility.
              rightIconLabel={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} // Give the second visibility action a distinct accessible name.
              onRightIconClick={() => setShowConfirmPassword((visible) => !visible)}
            />
          </div>

          </fieldset> {/* End the request-locked input group. */}
          <div className="flex w-full justify-center"> {/* Keep the source 24px field-to-button gap. */}
            <AppButton
              type="submit"
              loading={busy} // Prevent repeat submissions through the shared button.
              leftIcon={busy ? <Image className={styles.spinner} src="/design-assets/icons/auth-loading.svg" alt="" width={24} height={24} /> : undefined} // Use the exported loading glyph.
              className="mx-auto w-full max-w-[361px] cursor-pointer"
              variant="primary"
              size="lg"
            >
              {busy ? "Loading" : "Sign Up"} {/* Preserve the pending label during navigation. */}
            </AppButton>
          </div>
        </form>

        <p className="mt-4 text-center text-base font-medium leading-6 text-[#111111]"> {/* Match the source 16px action-to-link gap. */}
          Already have an account?{" "}
          <Link href={`/login?role=${selectedRole}`} className="text-[#008080] underline"> {/* Keep the selected audience across auth routes. */}
            Login
          </Link>
        </p>
      </div>
    </AuthFrame>
  );
}
