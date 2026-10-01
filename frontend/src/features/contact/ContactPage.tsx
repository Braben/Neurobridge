"use client"; // Manage the interactive public contact form.
import { useRef, useState } from "react"; // Preserve values and prevent duplicate requests.
import Image from "next/image"; // Render original Figma status assets.
import AuthFrame from "@/components/layouts/AuthFrame"; // Reuse the shared source branding and contact-specific photo.
import AppButton from "@/components/ui/AppButton"; // Reuse the 361x60 source action.
import { FormField, TextAreaField } from "@/components/ui/FormField"; // Preserve accessible labels and measured control sizes.
import { contactApi } from "@/app/services/contact"; // Submit through the durable contact endpoint.
import { apiErrorMessage } from "@/app/utils/apiError"; // Display the actual server rejection when available.
import styles from "./ContactPage.module.css"; // Scope the measured contact composition.
export default function ContactPage({ subject = "" }: { subject?: string }) { // Accept an optional recovery topic from the server route.
  const [form, setForm] = useState({ fullName: "", email: "", message: "" }); // Keep the source three-field form.
  const [pending, setPending] = useState(false); // Lock all submitted fields consistently.
  const [error, setError] = useState(""); // Distinguish failed persistence from success.
  const [receipt, setReceipt] = useState(""); // Retain the backend receipt after acceptance.
  const lock = useRef(false); // Prevent synchronous duplicate activation.
  const complete = Boolean(form.fullName.trim() && form.email.trim() && form.message.trim()); // Enable submit only when all meaningful fields are filled.
  function change(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) { // Update the controlled form without a stale closure.
    const { name, value } = event.target; // Capture the DOM event values.
    setForm((current) => ({ ...current, [name]: value })); // Preserve unrelated fields after correction.
    setError(""); // Remove obsolete rejection feedback.
  } // Finish field updates.
  async function submit(event: React.FormEvent) { // Save the inquiry before showing any confirmation.
    event.preventDefault(); // Keep the request on the current page.
    if (lock.current || !complete) return; // Ignore incomplete or duplicate submissions.
    lock.current = true; // Acquire the synchronous request lock.
    setPending(true); // Expose pending state in controls and assistive technology.
    setError(""); // Begin a deliberate retry with clear feedback.
    try { // Retain values if persistence fails.
      const response = await contactApi.submit({ fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), message: form.message.trim(), ...(subject ? { subject } : {}) }); // Preserve the reviewed public API payload.
      setReceipt(response.inquiry.id); // Show success only after receiving the stored inquiry ID.
      setForm({ fullName: "", email: "", message: "" }); // Clear potentially sensitive account-problem details after acceptance.
    } catch (requestError) { // Do not turn network or validation failures into success messages.
      setError(apiErrorMessage(requestError, "Unable to submit your message. Please try again.")); // Preserve actionable server feedback and retry values.
    } finally { // Always release failed or completed requests.
      lock.current = false; // Permit deliberate future attempts.
      setPending(false); // Restore controls after the response settles.
    } // Finish persistence handling.
  } // Finish contact submission.
  return ( // Render the measured contact frame with real request states.
    <AuthFrame contactVariant contentAlignment="rail"> {/* Use the original contact photo crop and no footer. */}
      <section className={styles.content}> {/* Match the source 797px content rail. */}
        {error && <div className={styles.error} role="alert"><Image src="/design-assets/icons/auth-warning.svg" alt="" width={24} height={24} />{error}</div>} {/* Keep genuine failure feedback visible without covering fields. */}
        <header className={styles.heading}> {/* Preserve the source heading and description stack. */}
          <h1>Contact Administrator with Your Account Problems</h1> {/* Retain the board's literal title. */}
          <p>Are you having trouble logging in or accessing your account and have tried to fix it but to no avail? Let our administrator know. <strong>Fill the form below and we&apos;ll reach you via email.</strong></p> {/* Correct the source typo without changing its meaning. */}
        </header> {/* Finish the heading block. */}
        {receipt ? <div className={styles.success} role="status"><p>Your message has been received.</p><AppButton href="/login" size="lg">Back to login</AppButton></div> : <form onSubmit={submit} className={styles.form} aria-busy={pending}> {/* Gate success on a real stored receipt. */}
          <FormField label="Full Name" name="fullName" required maxLength={100} autoComplete="name" value={form.fullName} onChange={change} disabled={pending} placeholder="Your name" /> {/* Match the first 361px field and backend name limit. */}
          <FormField label="Email" name="email" type="email" required maxLength={254} autoComplete="email" value={form.email} onChange={change} disabled={pending} placeholder="Your email address" /> {/* Request a reachable email, not an inaccessible old account identifier. */}
          <div className={styles.message}><TextAreaField label="Message" name="message" maxLength={1000} aria-required="true" value={form.message} onChange={change} disabled={pending} placeholder="Maximum of 1000 characters" /></div> {/* Keep the source 1000-character frontend limit within the backend's 2000-character maximum. */}
          <AppButton type="submit" fullWidth size="lg" disabled={!complete} loading={pending} leftIcon={pending ? <Image src="/design-assets/icons/auth-loading.svg" alt="" width={24} height={24} className={styles.spinner} /> : undefined}>{pending ? "Submitting" : "Submit"}</AppButton> {/* Keep button geometry stable through the request. */}
        </form>} {/* Finish the form or successful receipt state. */}
      </section> {/* Finish the contact content column. */}
    </AuthFrame> // Retain shared source navigation and branding.
  ); // Finish the contact screen.
} // Finish the feature.
