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
import { passwordError, passwordRuleMessage } from "../../utils/validation";

export default function AdminRegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    otherNames: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    adminInviteCode: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);

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
    if (!formData.adminInviteCode.trim()) {
      setValidationError("Administrators must provide an invite code");
      return;
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: "ADMIN" as const,
      otherNames: formData.otherNames,
      adminInviteCode: formData.adminInviteCode,
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
          {validationError || error || "Please ensure that all fields are filled correctly"}
        </GlobalMessage>
      )}

      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#171f27]">
            Sign Up as an administrator to{" "}
            <span className="text-[#009cae]">Neuro Bridge Africa</span>
          </h1>
          <p className="mt-2 text-sm text-[#4b5b66]">
            Create an administrator account. You will need a valid admin invite
            code to complete registration.
          </p>
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

          <FormField
            label="Other Name(s)"
            name="otherNames"
            type="text"
            value={formData.otherNames}
            onChange={handleChange}
            placeholder="Enter any other names you have"
          />

          <div className="grid gap-5 sm:grid-cols-2">
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

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Create Your Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
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
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              status={
                formData.confirmPassword &&
                formData.password === formData.confirmPassword
                  ? "success"
                  : validationError?.toLowerCase().includes("password")
                    ? "error"
                    : "default"
              }
              helpText={
                formData.confirmPassword &&
                formData.password === formData.confirmPassword
                  ? "Password matches"
                  : undefined
              }
            />
          </div>

          <FormField
            label="Admin Invite Code"
            name="adminInviteCode"
            type="text"
            required
            value={formData.adminInviteCode}
            onChange={handleChange}
            placeholder="Enter your admin invite code"
            error={
              validationError?.toLowerCase().includes("invite")
                ? validationError
                : undefined
            }
            className="text-center"
          />

          <div className="flex justify-center w-full">
            <AppButton
              type="submit"
              disabled={isLoading}
              className="mx-auto block min-w-64 cursor-pointer"
              variant="secondary"
            >
              {isLoading ? "Loading" : "Sign Up"}
            </AppButton>
          </div>
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
