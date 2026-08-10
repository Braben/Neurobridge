"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { loginUser, clearError } from "../../store/slices/authSlice";
import Link from "next/link";
import AppButton from "../../components/ui/AppButton";
import AuthFrame from "../../components/ui/AuthFrame";
import { FormField } from "../../components/ui/FormField";
import GlobalMessage from "../../components/ui/GlobalMessage";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    // Determine whether the identifier is an email or phone
    const isEmail = identifier.includes("@");
    const payload = isEmail
      ? { email: identifier, password }
      : { phone: identifier, password };

    const result = await dispatch(loginUser(payload));
    if (loginUser.fulfilled.match(result)) {
      router.push("/dashboard");
    }
  };

  return (
    <AuthFrame>
      {error && (
        <GlobalMessage variant="error">
          Please ensure that all fields are filled correctly
        </GlobalMessage>
      )}

      <div className="mx-auto w-full max-w-[430px]">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#1c2730]">
            Welcome back to <span className="text-[#009cae]">Neuro Bridge Africa</span>
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#171f27]">Login to your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            error={error ? "Password incorrect" : undefined}
            rightIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            }
          />

          <div className="-mt-3 text-right">
            <Link href="/forgot-password" className="text-[11px] font-semibold text-[#0b4a6f] hover:underline">
              Forgot Password?
            </Link>
          </div>

          <AppButton
            type="submit"
            disabled={isLoading}
            fullWidth
            variant="secondary"
          >
            {isLoading ? "Loading" : "Login"}
          </AppButton>
        </form>

        <p className="mt-5 text-center text-xs font-semibold text-[#1d2b36]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#009cae] hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </AuthFrame>
  );
}
