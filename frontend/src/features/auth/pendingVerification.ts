type PendingVerification = { userId: string; identifier: string; channel: "EMAIL" | "SMS" }; // Store routing context only, never OTP codes or credentials.
const storageKey = "neurobridge.pendingVerification"; // Isolate pending verification from password recovery data.

export function readPendingVerification(userId: string): PendingVerification | null { // Restore only the current account's pending workflow.
  if (typeof window === "undefined") return null; // Keep server rendering independent of browser storage.
  try { // Treat blocked or corrupt browser storage as unavailable.
    const raw = window.sessionStorage.getItem(storageKey); // Keep this temporary handoff scoped to the browser tab.
    if (!raw) return null; // No stored handoff exists for this tab.
    const value: unknown = JSON.parse(raw); // Parse stored data without assuming its structure.
    if (!value || typeof value !== "object") return null; // Reject non-object persisted values.
    const record = value as Record<string, unknown>; // Narrow each field before returning the record.
    if (record.userId !== userId || typeof record.identifier !== "string" || !record.identifier.trim() || (record.channel !== "EMAIL" && record.channel !== "SMS")) return null; // Prevent another account's target from leaking into this workflow.
    return { userId, identifier: record.identifier, channel: record.channel }; // Return validated routing metadata, not an authorization decision.
  } catch { return null; } // Fall back to in-memory state when storage is unavailable.
} // Finish safe handoff restoration.

export function savePendingVerification(value: PendingVerification) { // Persist only a backend-issued pending verification target.
  if (typeof window === "undefined") return; // Avoid accessing browser storage during server rendering.
  try { window.sessionStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* In-memory OTP state still supports the current navigation. */ } // Do not break signup when browser storage is blocked.
} // Finish tab-scoped persistence.

export function clearPendingVerification() { // Remove obsolete handoff data after verification or session cleanup.
  if (typeof window === "undefined") return; // Keep cleanup safe during server execution.
  try { window.sessionStorage.removeItem(storageKey); } catch { /* Storage may be disabled by browser policy. */ } // Cleanup must not prevent successful verification or logout.
} // Finish pending workflow cleanup.
