"use client";

import { useState } from "react";
import AppButton from "../components/ui/AppButton";
import AuthFrame from "../components/ui/AuthFrame";
import { FormField } from "../components/ui/FormField";
import GlobalMessage from "../components/ui/GlobalMessage";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <AuthFrame footerMinimal>
      {submitted && (
        <GlobalMessage variant="success">
          If an account exists, password reset instructions will be sent shortly.
        </GlobalMessage>
      )}
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#171f27]">Forgot password</h1>
          <p className="mt-2 text-sm text-[#536471]">
            Enter your account email or phone number to request password reset help.
          </p>
        </div>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <FormField
            label="Email / Phone Number"
            name="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your registered email or phone number"
          />
          <AppButton type="submit" fullWidth variant="secondary">
            Submit
          </AppButton>
        </form>
      </div>
    </AuthFrame>
  );
}
