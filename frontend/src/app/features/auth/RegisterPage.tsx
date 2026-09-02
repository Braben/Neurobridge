"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { registerUser, clearError } from "../../store/slices/authSlice";
import Link from "next/link";
import AppButton from "../../components/ui/AppButton";
import AuthFrame from "../../components/ui/AuthFrame";
import { FormField, SelectField } from "../../components/ui/FormField";
import GlobalMessage from "../../components/ui/GlobalMessage";
import { passwordError, passwordRuleMessage, validateAdultDateOfBirth } from "../../utils/validation";

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

  const selectedRole = formData.role;
  const passwordMatches = Boolean(formData.confirmPassword) && formData.password === formData.confirmPassword;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      router.push(result.payload.requiresOtp ? "/verify-otp" : "/dashboard");
    }
  };

  return (
    <AuthFrame footerMinimal>
      {(validationError || error) && (
        <GlobalMessage variant="error">
          {validationError || error || "Please ensure that all fields are filled correctly"}
        </GlobalMessage>
      )}

      <div className="mx-auto w-full max-w-[746px]">
        <div className="mb-8 lg:mb-10">
          <h1 className="text-[clamp(28px,4vw,32px)] font-medium leading-[38px] text-[#111111]">
            Sign Up as a {roleLabels[selectedRole]} to{" "}
            <span className="text-[#008080]">Neuro Bridge Africa</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <FormField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
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
            <FormField
              label={selectedRole === "THERAPIST" ? "Email or Phone Number" : "Date of Birth"}
              name={selectedRole === "THERAPIST" ? "identifier" : "dateOfBirth"}
              type={selectedRole === "THERAPIST" ? "text" : "date"}
              required
              value={selectedRole === "THERAPIST" ? formData.identifier : formData.dateOfBirth}
              onChange={handleChange}
              placeholder={selectedRole === "THERAPIST" ? "Enter your email or phone number" : undefined}
            />
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
              rightIcon={<EyeIcon hidden={!showPassword} />}
              rightIconLabel={showPassword ? "Hide password" : "Show password"}
              onRightIconClick={() => setShowPassword((visible) => !visible)}
              error={
                validationError?.toLowerCase().includes("password")
                  ? validationError
                  : undefined
              }
              helpText={passwordRuleMessage}
            />
            <FormField
              label="Confirm Your Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
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
              rightIcon={<EyeIcon hidden={!showConfirmPassword} />}
              rightIconLabel={showConfirmPassword ? "Hide password" : "Show password"}
              onRightIconClick={() => setShowConfirmPassword((visible) => !visible)}
            />
          </div>

          <div className="flex w-full justify-center pt-1">
            <AppButton
              type="submit"
              disabled={isLoading}
              className="mx-auto w-full max-w-[361px] cursor-pointer"
              variant="primary"
              size="lg"
            >
              {isLoading ? "Loading" : "Sign Up"}
            </AppButton>
          </div>
        </form>

        <p className="mt-5 text-center text-base font-medium leading-6 text-[#111111]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#008080] underline">
            Login
          </Link>
        </p>
      </div>
    </AuthFrame>
  );
}
