"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { registerUser, clearError } from "../../store/slices/authSlice";
import Link from "next/link";
import AppButton from "../../components/ui/AppButton";
import AuthFrame from "../../components/ui/AuthFrame";
import { FormField } from "../../components/ui/FormField";
import GlobalMessage from "../../components/ui/GlobalMessage";

type RegisterRole = "ADMIN" | "PARENT" | "THERAPIST";

const roleLabels: Record<RegisterRole, string> = {
  ADMIN: "administrator",
  PARENT: "Parent",
  THERAPIST: "Therapist",
};

export default function RegisterPage({
  initialRole = "PARENT",
}: {
  initialRole?: RegisterRole;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: initialRole,
    otherNames: "",
    areaofexpertise: "",
    adminInviteCode: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }
    if (formData.role === "THERAPIST" && !formData.areaofexpertise) {
      setValidationError("Therapists must provide an area of expertise");
      return;
    }
    if (formData.role === "ADMIN" && !formData.adminInviteCode.trim()) {
      setValidationError("Administrators must provide an invite code");
      return;
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
      ...(formData.role === "THERAPIST" && { areaofexpertise: formData.areaofexpertise }),
      ...(formData.role === "ADMIN" && { adminInviteCode: formData.adminInviteCode }),
    };

    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      // Registration succeeded — user will be redirected to OTP verification
      router.push("/verify-otp");
    }
  };

  return (
    <AuthFrame footerMinimal>
      {(validationError || error) && (
        <GlobalMessage variant="error">
          Please ensure that all fields are filled correctly
        </GlobalMessage>
      )}

      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#171f27]">
            Sign Up as a {roleLabels[formData.role]} to{" "}
            <span className="text-[#009cae]">Neuro Bridge Africa</span>
          </h1>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 rounded-md bg-[#eef8fc] p-1.5">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: "PARENT" })}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              formData.role === "PARENT" ? "bg-white text-[#073f63] shadow-sm" : "text-[#4e7b93]"
            }`}
          >
            Parent
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: "THERAPIST" })}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              formData.role === "THERAPIST" ? "bg-white text-[#073f63] shadow-sm" : "text-[#4e7b93]"
            }`}
          >
            Therapist
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, role: "ADMIN" })}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              formData.role === "ADMIN" ? "bg-white text-[#073f63] shadow-sm" : "text-[#4e7b93]"
            }`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
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

          <div className="grid gap-5 sm:grid-cols-2">
            {formData.role === "ADMIN" && (
              <FormField
                label="Other Name(s)"
                name="otherNames"
                type="text"
                value={formData.otherNames}
                onChange={handleChange}
                placeholder="Enter any other names you have"
              />
            )}
            <FormField
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
            />
            <FormField
              label="Phone Number"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>

          {formData.role === "THERAPIST" && (
            <FormField
              label="Area of Expertise"
              name="areaofexpertise"
              type="text"
              required
              value={formData.areaofexpertise}
              onChange={handleChange}
              placeholder="Speech therapy, Occupational therapy"
            />
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Create Your Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              error={validationError?.toLowerCase().includes("password") ? validationError : undefined}
            />
            <FormField
              label="Confirm Your Password"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              status={
                formData.confirmPassword && formData.password === formData.confirmPassword
                  ? "success"
                  : validationError?.toLowerCase().includes("password")
                    ? "error"
                    : "default"
              }
              helpText={
                formData.confirmPassword && formData.password === formData.confirmPassword
                  ? "Password matches"
                  : undefined
              }
            />
          </div>

          {formData.role === "ADMIN" && (
            <FormField
              label="Admin Invite Code"
              name="adminInviteCode"
              type="text"
              required
              value={formData.adminInviteCode}
              onChange={handleChange}
              placeholder="Enter your admin invite code"
              error={
                validationError?.toLowerCase().includes("invite") ? validationError : undefined
              }
              className="text-center"
            />
          )}

          <AppButton
            type="submit"
            disabled={isLoading}
            className="mx-auto flex min-w-44"
            variant="secondary"
          >
            {isLoading ? "Loading" : "Sign Up"}
          </AppButton>
        </form>

        <p className="mt-5 text-center text-xs font-semibold text-[#1d2b36]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#009cae] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </AuthFrame>
  );
}
