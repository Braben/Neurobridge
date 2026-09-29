// The local showcase exercises interaction states as well as static design geometry.
"use client";
// Keep demo form state isolated from real authentication and backend data.
import { useEffect, useRef, useState, type FormEvent } from "react";
// Render the same components that production features consume.
import AppButton, { type ButtonSize } from "@/components/ui/AppButton";
// Exercise the shared field semantics and native browser controls.
import { FormField, SelectField, TextAreaField } from "@/components/ui/FormField";

// Show only values already inspected in the Figma palette and component families.
const swatches = [
  ["Primary", "--nba-blue-primary", "#0A3D62"], // Primary component fill.
  ["Focused", "--nba-blue-focused", "#0071D7"], // Bound pressed/focused state.
  ["Disabled", "--nba-blue-disabled", "#B5D3EE"], // Primary disabled fill and field border.
  ["Bright Blue", "--nba-bright-blue-400", "#1E90FF"], // Palette accent.
  ["Teal", "--nba-teal", "#008080"], // Secondary semantic color.
  ["Turquoise", "--nba-teal-200", "#40E0D0"], // Secondary accent.
  ["Gold", "--nba-gold-500", "#FFD700"], // Actual gold swatch, despite the palette label typo.
  ["Danger", "--nba-danger", "#E53935"], // Validation feedback.
  ["Success", "--nba-success", "#2E7D32"], // Success feedback.
  ["Neutral", "--nba-neutral", "#757575"], // Placeholder and secondary disabled text.
  ["White", "--nba-white", "#FAFAFA"], // Neutral canvas and primary button text.
  ["Black", "--nba-black", "#111111"], // Default text.
] as const; // Preserve stable token names and labels.
// Match the ordering of the Figma button-family reference screenshot.
const sizes: ButtonSize[] = ["lg", "sm", "md"];

// Provide an isolated review surface for geometry, colors, keyboard states, and form behavior.
export default function DesignSystemShowcase() {
  const reviewRoot = useRef<HTMLElement>(null); // Expose hydration readiness before screenshot tooling touches native controls.
  useEffect(() => { reviewRoot.current?.setAttribute("data-hydrated", "true"); }, []); // A post-hydration marker prevents screenshot caret injection from racing React.
  const [submitted, setSubmitted] = useState(false); // Show real submission feedback in the demo only.
  const [emailError, setEmailError] = useState<string>(); // Exercise component error-state transitions.
  const [actionCount, setActionCount] = useState(0); // Detect accidental activation of unavailable controls.
  const emailRef = useRef<HTMLInputElement>(null); // Verify native refs remain available to form libraries.
  function submitExample(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Keep the demo fully local and avoid creating real records.
    const email = new FormData(event.currentTarget).get("reviewEmail"); // Read the browser's native submitted values.
    if (!email) { setEmailError("Enter your email address."); emailRef.current?.focus(); return; } // Expose validation and move focus to the invalid field.
    setEmailError(undefined); // Clear the previous error once the field is present.
    setSubmitted(true); // Confirm that the controls participated in form submission.
  }
  return (
    <main ref={reviewRoot} className="mx-auto w-full max-w-[1440px] px-5 py-10 text-ink-900 sm:px-10"> {/* Match the desktop reference canvas while allowing narrow viewports. */}
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-ink-300 pb-6"> {/* Keep internal review navigation compact. */}
        <h1 className="text-2xl font-semibold">Neuro Bridge / Design System</h1> {/* Identify the local review surface. */}
        <a href="https://www.figma.com/design/FdXaHn8UCA6N8I9yLqZ5fE/NEURO-BRIDGE?node-id=0-1" className="text-brand-900 underline">Figma reference</a> {/* Link the review directly to its design source. */}
      </header>
      <section aria-labelledby="palette-heading" className="border-b border-ink-300 pb-10"> {/* Keep color inspection in one unframed band. */}
        <h2 id="palette-heading" className="mb-6 text-xl font-semibold">Palette</h2> {/* Give the swatch group an accessible title. */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 xl:grid-cols-6"> {/* Keep swatches readable across desktop and mobile. */}
          {swatches.map(([label, token, hex]) => <div key={token}><div className="mb-3 h-20 border border-ink-300" style={{ backgroundColor: `var(${token})` }} /><p className="font-medium">{label}</p><p className="text-sm text-ink-700">{hex}</p></div>)} {/* Render the actual shared tokens, not duplicate sample colors. */}
        </div>
      </section>
      {(["primary", "secondary"] as const).map((variant) => (
        <section key={variant} aria-labelledby={`${variant}-heading`} className="border-b border-ink-300 py-10"> {/* Review each verified button family independently. */}
          <h2 id={`${variant}-heading`} className="mb-6 text-xl font-semibold capitalize">{variant} Buttons</h2> {/* Label the family without adding product-facing documentation. */}
          <div className="flex flex-wrap items-start gap-10"> {/* Preserve exact button widths without forcing horizontal mobile overflow. */}
            {sizes.map((size) => (
              <div key={size} className="flex max-w-full flex-col gap-10"> {/* Match the Figma family columns and spacing. */}
                <AppButton variant={variant} size={size} data-testid={`${variant}-${size}`} onClick={() => setActionCount((count) => count + 1)}>{size === "lg" ? `${variant === "primary" ? "Primary" : "Secondary"} Button` : size === "sm" ? "Small" : "Medium"}</AppButton> {/* Review default, hover, pressed, and keyboard focus states on the same real control. */}
                <AppButton variant={variant} size={size} disabled data-testid={`${variant}-${size}-disabled`} onClick={() => setActionCount((count) => count + 1)}>Disabled</AppButton> {/* Disabled controls must retain their reference color and reject activation. */}
              </div>
            ))}
          </div>
        </section>
      ))}
      <section aria-labelledby="fields-heading" className="border-b border-ink-300 py-10"> {/* Place field variants side by side at their reference widths. */}
        <h2 id="fields-heading" className="mb-6 text-xl font-semibold">Fields</h2> {/* Label the native control reference group. */}
        <div className="grid gap-10 lg:grid-cols-[361px_361px]"> {/* Keep desktop field widths exact and mobile columns fluid. */}
          <div className="flex min-w-0 flex-col gap-8"> {/* Group default and focused field examples. */}
            <FormField name="defaultEmail" label="Text field - Default" placeholder="Enter a registered email" /> {/* Show the verified default border and fill. */}
            <FormField name="filledEmail" label="Text field - Active" defaultValue="parent@example.com" /> {/* Allow keyboard focus to activate the real field state. */}
            <SelectField name="role" label="Text field - Dropdown" defaultValue=""><option value="" disabled>Select role</option><option value="PARENT">Parent</option><option value="THERAPIST">Therapist</option></SelectField> {/* Test the exported caret and native option selection. */}
          </div>
          <div className="flex min-w-0 flex-col gap-8"> {/* Keep validation and multiline samples separate from editable defaults. */}
            <FormField name="invalidEmail" id="invalid-email" label="Text field - Error" defaultValue="incorrect" error="Email address is invalid." /> {/* Verify custom IDs and error associations. */}
            <FormField name="disabledEmail" label="Text field - Disabled" defaultValue="parent@example.com" disabled /> {/* Preserve native disabled semantics. */}
            <TextAreaField name="notes" label="Message" placeholder="Maximum of 1000 characters" maxLength={1000} /> {/* Match the multiline reference height and character limit. */}
          </div>
        </div>
      </section>
      <section aria-labelledby="interaction-heading" className="py-10"> {/* Keep interaction checks separate from the visual reference groups. */}
        <h2 id="interaction-heading" className="mb-6 text-xl font-semibold">Interaction States</h2> {/* Identify the form and navigation examples. */}
        <div className="flex flex-wrap items-start gap-10"> {/* Allow the example form and button column to stack on mobile. */}
          <form onSubmit={submitExample} noValidate className="flex w-[361px] max-w-full flex-col gap-6"> {/* Exercise native form submission without backend dependencies. */}
            <FormField ref={emailRef} name="reviewEmail" label="Review Email" type="email" error={emailError} helpText="Use a test address." required /> {/* Verify ref forwarding, validation, and helper text. */}
            <AppButton type="submit" fullWidth>Submit example</AppButton> {/* Confirm full-width controls honor their form column. */}
            {submitted && <p role="status">Example submitted.</p>} {/* Expose observable local submission feedback. */}
          </form>
          <div className="flex max-w-full flex-col gap-6"> {/* Group loading, disabled navigation, and enabled navigation examples. */}
            <AppButton loading onClick={() => setActionCount((count) => count + 1)}>Saving</AppButton> {/* Pending actions retain geometry and reject duplicate clicks. */}
            <AppButton href="/login" disabled>Disabled navigation</AppButton> {/* This must render without a navigable URL. */}
            <AppButton href="/login" variant="secondary">Login</AppButton> {/* Verify that available links keep their destination. */}
            <output aria-label="Action count">{actionCount}</output> {/* Make activation behavior observable in automated tests. */}
          </div>
        </div>
      </section>
    </main>
  );
}
