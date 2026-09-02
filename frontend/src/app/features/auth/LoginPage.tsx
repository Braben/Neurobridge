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

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          {error}
        </GlobalMessage>
      )}

      <div className="mx-auto w-full max-w-[430px]">
        <div className="mb-10">
          <p className="text-2xl font-medium leading-[30px] text-[#111111]">
            Welcome back to <span className="text-[#008080]">Neuro Bridge Africa</span>
          </p>
          <h1 className="mt-4 text-[32px] font-medium leading-[38px] text-[#111111]">Login to your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            error={error ? "Password incorrect" : undefined}
            rightIcon={<EyeIcon hidden={!showPassword} />}
            rightIconLabel={showPassword ? "Hide password" : "Show password"}
            onRightIconClick={() => setShowPassword((visible) => !visible)}
          />

          <div className="-mt-3 text-right">
            <Link href="/forgot-password" className="text-xs font-normal leading-4 text-[#111111] hover:underline">
              Forgot Password?
            </Link>
          </div>

          <AppButton
            type="submit"
            disabled={isLoading}
            fullWidth
            variant="primary"
            size="lg"
          >
            {isLoading ? "Loading" : "Login"}
          </AppButton>
        </form>

        <p className="mt-5 text-base font-medium leading-6 text-[#111111]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#009cae] hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </AuthFrame>
  );
}
