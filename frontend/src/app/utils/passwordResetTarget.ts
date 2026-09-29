// Name the sessionStorage key used to carry the reset target between password pages.
const PASSWORD_RESET_TARGET_KEY = "neurobridge:password-reset-target";

// Limit reset delivery channels to the enum values accepted by the backend.
export type PasswordResetChannel = "EMAIL" | "SMS";

// Describe the reset target that the request page stores for the reset page.
export type PasswordResetTarget = {
  // Store the normalized email address or phone number used for the reset code.
  identifier: string;
  // Store the delivery channel so backend lookup matches the generated code.
  channel: PasswordResetChannel;
};

// Trim an identifier before sending it to the API or saving it locally.
export const normalizePasswordResetIdentifier = (identifier: string) => {
  // Return the browser-entered value without accidental surrounding spaces.
  return identifier.trim();
};

// Infer the reset channel from the identifier when the backend does not echo one.
export const inferPasswordResetChannel = (identifier: string): PasswordResetChannel => {
  // Treat identifiers containing @ as email addresses.
  return identifier.includes("@") ? "EMAIL" : "SMS";
};

// Persist the latest reset target for the next route in the flow.
export const savePasswordResetTarget = (target: PasswordResetTarget) => {
  // Avoid sessionStorage access during server rendering.
  if (typeof window === "undefined") return;

  // Save a compact JSON payload because the reset page needs both fields.
  window.sessionStorage.setItem(PASSWORD_RESET_TARGET_KEY, JSON.stringify(target));
};

// Read the saved reset target when the reset page loads.
export const readPasswordResetTarget = () => {
  // Avoid sessionStorage access during server rendering.
  if (typeof window === "undefined") return null;

  // Read the raw JSON payload from this browser tab's session.
  const storedTarget = window.sessionStorage.getItem(PASSWORD_RESET_TARGET_KEY);

  // Return null when the user opens reset-password directly.
  if (!storedTarget) return null;

  // Parse the saved reset target defensively because storage can be edited.
  try {
    // Parse the stored JSON into a value we can validate by shape.
    const parsedTarget = JSON.parse(storedTarget) as Partial<PasswordResetTarget>;

    // Accept only records with both a string identifier and a known channel.
    if (
      typeof parsedTarget.identifier === "string" &&
      (parsedTarget.channel === "EMAIL" || parsedTarget.channel === "SMS")
    ) {
      // Return the validated reset target to the caller.
      return parsedTarget as PasswordResetTarget;
    }
  } catch {
    // Ignore invalid JSON so a corrupt storage value never breaks the page.
  }

  // Clear invalid storage so future visits start cleanly.
  window.sessionStorage.removeItem(PASSWORD_RESET_TARGET_KEY);

  // Return null because no usable reset target remains.
  return null;
};

// Remove the saved reset target after a successful password change.
export const clearPasswordResetTarget = () => {
  // Avoid sessionStorage access during server rendering.
  if (typeof window === "undefined") return;

  // Delete the flow handoff data because it is no longer needed.
  window.sessionStorage.removeItem(PASSWORD_RESET_TARGET_KEY);
};
