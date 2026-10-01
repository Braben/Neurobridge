"use client"; // Digit focus and paste handling require a client component.
import { useId, useRef, type KeyboardEvent } from "react"; // Keep focus scoped to this control instance.
import styles from "./OtpInput.module.css"; // Apply the verified Figma OTP geometry.
import { useHydrated } from "@/lib/use-hydrated"; // Avoid losing OTP input entered before React attaches its distribution handler.

export const OTP_LENGTH = 6; // Match the backend's six-digit code contract.
type OtpInputProps = { // Keep validation and submission ownership with the feature.
  value: string[]; // Preserve empty positions when a middle digit is deleted.
  onChange: (digits: string[]) => void; // Return all six positions to the parent.
  error?: string; // Associate the server or local error with every digit.
  disabled?: boolean; // Lock editing while verification is pending.
  label?: string; // Distinguish account verification from password recovery for assistive technology.
}; // Complete the shared control contract.

export default function OtpInput({ value, onChange, error, disabled = false, label = "Verification code" }: OtpInputProps) { // Render one accessible code group with a feature-specific name.
  const hydrated = useHydrated(); // Enable the six controlled digits only when input can be retained.
  const id = useId(); // Avoid ID collisions between separate OTP forms.
  const inputs = useRef<Array<HTMLInputElement | null>>([]); // Hold only this group's native inputs.
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] || ""); // Always render six stable slots.
  function focus(index: number) { // Select the destination digit for immediate replacement.
    const input = inputs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]; // Bound keyboard navigation to the group.
    input?.focus(); // Keep native keyboard focus visible.
    input?.select(); // Typing over a populated cell replaces its digit.
  } // Finish scoped focus handling.
  function update(index: number, raw: string) { // Accept typing, pasted codes, and browser autofill.
    if (disabled) return; // Ignore synthetic edits while the request is pending.
    const incoming = raw.replace(/\D/g, "").slice(0, OTP_LENGTH); // Keep leading zeroes and strip separators.
    if (raw && !incoming) return; // Leave existing digits intact for non-numeric input.
    const start = incoming.length === OTP_LENGTH ? 0 : index; // A complete code replaces the entire group from any slot.
    const next = [...digits]; // Preserve untouched cells for partial paste and single-digit editing.
    if (!incoming) next[index] = ""; // Native deletion clears only the current cell.
    else [...incoming].slice(0, OTP_LENGTH - start).forEach((digit, offset) => { next[start + offset] = digit; }); // Distribute digits without exceeding the code length.
    onChange(next); // Update the feature's controlled value once per edit.
    if (incoming) focus(start + incoming.length); // Advance to the next cell or select the last one.
  } // Finish multi-source input handling.
  function keyDown(index: number, event: KeyboardEvent<HTMLInputElement>) { // Preserve predictable keyboard editing.
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { // Navigate between digits with arrow keys.
      event.preventDefault(); // Avoid native caret movement competing with cell navigation.
      focus(index + (event.key === "ArrowLeft" ? -1 : 1)); // Select the adjacent digit.
    } // End arrow navigation.
    if (event.key === "Backspace" && !digits[index] && index > 0) { // Delete the preceding digit from an empty slot.
      event.preventDefault(); // Apply one controlled deletion rather than two native changes.
      const next = [...digits]; // Preserve the remaining code positions.
      next[index - 1] = ""; // Clear the digit the user is moving back to.
      onChange(next); // Notify the feature that the code is incomplete again.
      focus(index - 1); // Place focus where the replacement digit belongs.
    } // End backward deletion.
  } // Finish keyboard handling.
  return ( // Use a fieldset to expose the six inputs as one logical code.
    <fieldset className={styles.group} disabled={!hydrated || disabled} data-invalid={Boolean(error)}> {/* Keep reference dimensions while protecting input during hydration and requests. */}
      <legend className={styles.visuallyHidden}>{label}</legend> {/* Name the group without adding text absent from Figma. */}
      <div className={styles.row}> {/* Shrink equal tracks only when the viewport cannot fit six reference cells. */}
        {digits.map((digit, index) => ( // Keep keys stable across edits and validation states.
          <input // Render a native text input so mobile one-time-code autofill remains available.
            key={index} // Preserve each input's identity and focus.
            ref={(element) => { inputs.current[index] = element; }} // Register this slot for scoped focus changes.
            className={styles.digit} // Use shared Figma colors, typography, and dimensions.
            type="text" // Preserve leading zeroes rather than parsing numbers.
            inputMode="numeric" // Request the mobile numeric keyboard.
            autoComplete={index === 0 ? "one-time-code" : "off"} // Offer full-code autofill on the first slot.
            maxLength={OTP_LENGTH} // Let complete browser autofill reach the distribution handler.
            aria-label={`Verification digit ${index + 1} of ${OTP_LENGTH}`} // Give every input a distinct accessible name.
            aria-invalid={Boolean(error)} // Convey failed verification without relying on red alone.
            aria-describedby={error ? `${id}-error` : undefined} // Associate the same validation explanation with each slot.
            placeholder="X" // Match the default Figma OTP cell content.
            value={digit} // Display exactly one controlled digit in each cell.
            onFocus={(event) => event.currentTarget.select()} // Support replacing an existing digit without deleting first.
            onChange={(event) => update(index, event.target.value)} // Handle typed digits and full-code autofill uniformly.
            onKeyDown={(event) => keyDown(index, event)} // Add arrow movement and backward deletion.
            onPaste={(event) => { event.preventDefault(); update(index, event.clipboardData.getData("text")); }} // Distribute pasted codes instead of truncating them.
          /> // Complete one stable OTP input.
        ))} {/* Finish the six-slot row. */}
      </div> {/* Keep error descriptions outside the measured row. */}
      {error && <span id={`${id}-error`} className={styles.visuallyHidden}>{error}</span>} {/* Reuse the feature's visible error message without duplicating it visually. */}
    </fieldset> // Finish the named group.
  ); // Return the shared control.
} // Complete OtpInput.
