// Field IDs must remain stable across server rendering, hydration, and repeated forms.
"use client";
// Reuse React's native control props, including React 19 refs for form libraries.
import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
// Isolate component geometry from the individual screens that use it.
import styles from "./FormField.module.css";
import { useHydrated } from "@/lib/use-hydrated"; // Prevent controlled fields from discarding edits entered before their handlers attach.

// Preserve the validation states supported by existing callers.
export type FieldStatus = "default" | "error" | "success";
// Shared field metadata stays separate from native input, select, and textarea props.
type FieldProps = {
  error?: string; // Visible error text also becomes the accessible description.
  helpText?: string; // Optional guidance uses the same description relationship.
  label: string; // Every field has a persistent accessible label.
  name: string; // Preserve the form's submitted field name.
  status?: FieldStatus; // Allow explicit success/error presentation.
};
// Inputs may include an existing password-visibility or information icon.
export type InputProps = FieldProps & ComponentPropsWithRef<"input"> & {
  rightIcon?: ReactNode; // Use an exported Figma icon or an already matching project glyph.
  onRightIconClick?: () => void; // An optional action converts the icon into a button.
  rightIconLabel?: string; // Label the action independently from its visual glyph.
};
// Select and textarea props retain their native events and refs.
export type SelectProps = FieldProps & ComponentPropsWithRef<"select">;
export type TextAreaProps = FieldProps & ComponentPropsWithRef<"textarea">;

// Share the Figma label/control/message spacing without owning field value state.
function FieldChrome({ children, label, controlId, error, helpText, required, status }: FieldProps & { children: ReactNode; controlId: string; required?: boolean }) {
  const message = error || helpText; // Prioritize validation feedback when both messages exist.
  return (
    <div className={styles.field} data-status={status}> {/* Keep field status available to scoped styles. */}
      <label htmlFor={controlId} className={styles.label}>{label}{required && <span className={styles.required}> *</span>}</label> {/* Associate the label with the actual, possibly custom, ID. */}
      {children} {/* Keep the control inside the same vertical field stack. */}
      {message && <p id={`${controlId}-message`} className={styles.message} role={error ? "alert" : undefined}>{message}</p>} {/* Announce new errors and expose helper text to assistive technology. */}
    </div>
  );
}

// Combine a caller's existing description with this component's feedback ID.
function descriptionIds(existing: string | undefined, controlId: string, hasMessage: boolean) {
  return [existing, hasMessage ? `${controlId}-message` : undefined].filter(Boolean).join(" ") || undefined; // Avoid dangling references when no message is rendered.
}

// Render the shared input without interfering with controlled or uncontrolled form values.
export function FormField({ error, helpText, label, name, id, rightIcon, onRightIconClick, rightIconLabel, status = "default", className = "", required, ...props }: InputProps) {
  const disabled = !useHydrated() || props.disabled; // Preserve caller locks and defer editing until React can retain input.
  const generatedId = useId(); // Disambiguate repeated field names in dialogs and page forms.
  const controlId = id ?? `${name}-${generatedId}`; // Respect explicit IDs used by external labels or tests.
  const effectiveStatus = error ? "error" : status; // A real error always overrides decorative success state.
  return (
    <FieldChrome name={name} label={label} controlId={controlId} error={error} helpText={helpText} required={required} status={effectiveStatus}> {/* Reuse the label and feedback structure. */}
      <div className={styles.controlWrap}> {/* Anchor a right-hand icon inside the control height. */}
        <input {...props} disabled={disabled} id={controlId} name={name} required={required} aria-invalid={effectiveStatus === "error" || props["aria-invalid"] || undefined} aria-describedby={descriptionIds(props["aria-describedby"], controlId, Boolean(error || helpText))} className={[styles.control, rightIcon ? styles.withIcon : "", className].filter(Boolean).join(" ")} /> {/* Forward refs and native events while enforcing readiness and label/error relationships. */}
        {rightIcon && (onRightIconClick ? <button type="button" disabled={disabled} aria-label={rightIconLabel ?? `${label} options`} onClick={onRightIconClick} className={styles.iconAction}>{rightIcon}</button> : <span className={styles.icon} aria-hidden="true">{rightIcon}</span>)} {/* Keep icon actions out of submission and honor the field's readiness and disabled state. */}
      </div>
    </FieldChrome>
  );
}

// Use a native select for reliable keyboard support with the exact exported Figma caret.
export function SelectField({ error, helpText, label, name, id, status = "default", className = "", required, children, ...props }: SelectProps) {
  const disabled = !useHydrated() || props.disabled; // Do not accept a selection before its change handler can retain it.
  const generatedId = useId(); // Avoid duplicate IDs across repeated filter panels.
  const controlId = id ?? `${name}-${generatedId}`; // Honor a caller's explicit label target.
  const effectiveStatus = error ? "error" : status; // Keep validation and visual state consistent.
  return (
    <FieldChrome name={name} label={label} controlId={controlId} error={error} helpText={helpText} required={required} status={effectiveStatus}> {/* Apply the same label and message spacing as text fields. */}
      <select {...props} disabled={disabled} id={controlId} name={name} required={required} aria-invalid={effectiveStatus === "error" || props["aria-invalid"] || undefined} aria-describedby={descriptionIds(props["aria-describedby"], controlId, Boolean(error || helpText))} className={[styles.control, styles.select, className].filter(Boolean).join(" ")}>{children}</select> {/* Retain real options, native events, and form-library refs after hydration. */}
    </FieldChrome>
  );
}

// Render the multiline component with the Figma reference height and native resizing.
export function TextAreaField({ error, helpText, label, name, id, status = "default", className = "", required, ...props }: TextAreaProps) {
  const disabled = !useHydrated() || props.disabled; // Protect multiline edits from the same pre-hydration value reset.
  const generatedId = useId(); // Support more than one message form on a screen.
  const controlId = id ?? `${name}-${generatedId}`; // Keep caller IDs stable when explicitly supplied.
  const effectiveStatus = error ? "error" : status; // Give validation feedback priority.
  return (
    <FieldChrome name={name} label={label} controlId={controlId} error={error} helpText={helpText} required={required} status={effectiveStatus}> {/* Share field semantics with the single-line controls. */}
      <textarea {...props} disabled={disabled} id={controlId} name={name} required={required} aria-invalid={effectiveStatus === "error" || props["aria-invalid"] || undefined} aria-describedby={descriptionIds(props["aria-describedby"], controlId, Boolean(error || helpText))} className={[styles.control, styles.textarea, className].filter(Boolean).join(" ")} /> {/* Preserve feature values, limits, and handlers while enforcing readiness. */}
    </FieldChrome>
  );
}
