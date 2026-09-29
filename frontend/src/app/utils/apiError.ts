// Import the Axios error type so the helper can safely read API response bodies.
import type { AxiosError } from "axios";

// Describe the backend error shape used by the Express API.
type ApiErrorBody = {
  // Keep the message optional because network errors do not include a response body.
  message?: string;
};

// Convert an unknown thrown value into a user-facing message.
export function apiErrorMessage(error: unknown, fallback: string) {
  // Treat the thrown value as an Axios error only after narrowing its shape.
  const axiosError = error as AxiosError<ApiErrorBody>;

  // Prefer the backend's validation/auth message when the API sent one.
  if (axiosError.response?.data?.message) {
    // Return the API message because it is more specific than Axios' default text.
    return axiosError.response.data.message;
  }

  // Fall back to the native Error message for non-Axios failures.
  if (error instanceof Error && error.message) {
    // Return the runtime message so unexpected failures are still explainable.
    return error.message;
  }

  // Use the caller's fallback when no useful error detail exists.
  return fallback;
}
