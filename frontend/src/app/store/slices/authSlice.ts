// Auth slice — manages authentication state (user, tokens, loading, errors)
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../services/api";
import { apiErrorMessage } from "../../utils/apiError";
import { clearPendingVerification, readPendingVerification, savePendingVerification } from "@/features/auth/pendingVerification"; // Keep OTP handoffs separate from therapist approval state.

// Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  areaofexpertise: string | null;
  role: "ADMIN" | "PARENT" | "THERAPIST";
  avatar: string | null;
  isApproved: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  requiresOtp: boolean;
  otpEmail: string | null;
  otpIdentifier: string | null;
  otpChannel: "EMAIL" | "SMS" | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  requiresOtp: false,
  otpEmail: null,
  otpIdentifier: null,
  otpChannel: null,
  isLoading: true,
  error: null,
};

const clearStoredAuth = () => {
  clearPendingVerification(); // Discard the previous account's pending target when its session is cleared.
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("accessToken");
  }
};

const resetAuthState = (state: AuthState) => {
  state.user = null;
  state.accessToken = null;
  state.isAuthenticated = false;
  state.requiresOtp = false;
  state.otpEmail = null;
  state.otpIdentifier = null;
  state.otpChannel = null;
  state.isLoading = false;
  clearStoredAuth();
};

// Async thunks
export const registerUser = createAsyncThunk(
  "auth/register",
  async (data: {
    firstName: string;
    lastName: string;
    identifier?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    password: string;
    role: string;
    adminInviteCode?: string;
    areaofexpertise?: string;
  }, { rejectWithValue }) => {
    // Send the registration payload to the backend auth endpoint.
    try {
      // Await the API response so rejected requests can be normalized below.
      const response = await api.post("/auth/register", data);

      // Return the backend payload to reducers and route handlers.
      return response.data;
    } catch (error) {
      // Preserve the backend validation message instead of Redux's generic rejection text.
      return rejectWithValue(apiErrorMessage(error, "Registration failed"));
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data: { email?: string; phone?: string; password: string }, { rejectWithValue }) => {
    // Send either an email login or phone login to the backend.
    try {
      // Await the login response so the access token and user can be stored.
      const response = await api.post("/auth/login", data);

      // Return the backend payload to the fulfilled reducer.
      return response.data;
    } catch (error) {
      // Preserve precise backend messages like "Invalid credentials".
      return rejectWithValue(apiErrorMessage(error, "Login failed"));
    }
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await api.post("/auth/logout");
});

export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (payload: { identifier: string; channel?: "EMAIL" | "SMS" }, { rejectWithValue }) => {
    // Request a fresh verification code for the current OTP target.
    try {
      // Call the OTP endpoint with the normalized identifier and optional channel.
      const response = await api.post("/auth/send-otp", payload);

      // Return the backend OTP metadata for reducers or callers.
      return response.data;
    } catch (error) {
      // Preserve backend delivery or account lookup errors.
      return rejectWithValue(apiErrorMessage(error, "Unable to send OTP"));
    }
  },
);

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (payload: { identifier: string; channel?: "EMAIL" | "SMS" }, { rejectWithValue }) => {
    // Request another verification code without changing the OTP target.
    try {
      // Use the backend resend endpoint so previous codes are invalidated.
      const response = await api.post("/auth/resend-otp", payload);

      // Return the backend response for any future UI feedback.
      return response.data;
    } catch (error) {
      // Preserve backend resend errors for the OTP screen.
      return rejectWithValue(apiErrorMessage(error, "Unable to resend OTP"));
    }
  },
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (data: { identifier: string; channel?: "EMAIL" | "SMS"; code: string }, { rejectWithValue }) => {
    // Submit the entered six-digit code for account verification.
    try {
      // Call the backend verification endpoint with the saved OTP target.
      const response = await api.post("/auth/verify-otp", data);

      // Return verification metadata such as the approval status.
      return response.data;
    } catch (error) {
      // Preserve messages like "Invalid or expired OTP code".
      return rejectWithValue(apiErrorMessage(error, "OTP verification failed"));
    }
  },
);

export const fetchProfile = createAsyncThunk("auth/fetchProfile", async () => {
  const response = await api.get("/users/me");
  return response.data;
});

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateStoredSession: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
      if (!action.payload) {
        state.isLoading = false;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setRequiresOtp: (
      state,
      action: PayloadAction<{ requiresOtp: boolean; identifier: string; email?: string; channel?: "EMAIL" | "SMS" }>,
    ) => {
      // Store whether the current account must complete verification.
      state.requiresOtp = action.payload.requiresOtp;

      // Keep an email-specific label for older OTP UI paths.
      state.otpEmail = action.payload.email || (action.payload.channel === "EMAIL" ? action.payload.identifier : null);

      // Store the normalized target used by send/resend/verify OTP calls.
      state.otpIdentifier = action.payload.identifier;

      // Store the delivery channel so the backend verifies the right OTP record.
      state.otpChannel = action.payload.channel || (action.payload.email ? "EMAIL" : null);
      if (state.requiresOtp && state.user && state.otpChannel) savePendingVerification({ userId: state.user.id, identifier: state.otpIdentifier, channel: state.otpChannel }); // Preserve authenticated handoffs across profile hydration and reload.
      if (!state.requiresOtp) clearPendingVerification(); // Remove metadata when this action explicitly resolves verification.

      // Do not treat an OTP-pending account as fully authenticated.
      state.isAuthenticated = !action.payload.requiresOtp;
    },
    clearOtpState: (state) => {
      clearPendingVerification(); // Do not restore a deliberately cleared verification flow on reload.
      state.requiresOtp = false;
      state.otpEmail = null;
      state.otpIdentifier = null;
      state.otpChannel = null;
    },
    clearSession: (state) => {
      resetAuthState(state);
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.requiresOtp = Boolean(action.payload.requiresOtp);
      state.otpEmail = action.payload.requiresOtp ? action.payload.user.email : null;
      state.otpIdentifier = action.payload.requiresOtp
        ? action.payload.otpIdentifier || action.payload.user.email || action.payload.user.phone
        : null;
      state.otpChannel = action.payload.requiresOtp
        ? action.payload.otpChannel || (action.payload.user.email ? "EMAIL" : "SMS")
        : null;
      state.isAuthenticated = !action.payload.requiresOtp;
      if (state.requiresOtp && state.user && state.otpIdentifier && state.otpChannel) savePendingVerification({ userId: state.user.id, identifier: state.otpIdentifier, channel: state.otpChannel }); // Persist the signup response before profile hydration can run.
      else clearPendingVerification(); // Avoid retaining another registration's pending target.
      if (action.payload.accessToken) {
        localStorage.setItem("accessToken", action.payload.accessToken);
      }
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string | undefined) || action.error.message || "Registration failed";
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      // Clear stale OTP flags from any previous signup or signin attempt.
      state.requiresOtp = false;
      // Clear the previous OTP email label after a successful login payload arrives.
      state.otpEmail = null;
      // Clear the previous OTP identifier until the login page decides verification is needed.
      state.otpIdentifier = null;
      // Clear the previous OTP channel until the login page decides verification is needed.
      state.otpChannel = null;
      localStorage.setItem("accessToken", action.payload.accessToken);
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string | undefined) || action.error.message || "Login failed";
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      resetAuthState(state);
    });

    // Verify OTP
    builder.addCase(verifyOtp.pending, (state) => { // Track verification so the form cannot submit twice.
      state.isLoading = true; // Disable the code inputs and submit action while awaiting the server.
      state.error = null; // Start each attempt without stale backend feedback.
    }); // Finish pending verification state.
    builder.addCase(verifyOtp.fulfilled, (state, action) => {
      state.isLoading = false; // Unlock the interface before navigating after successful verification.
      clearPendingVerification(); // Verification completes the OTP workflow even when therapist approval remains pending.
      // Treat verification as authenticated only when this browser already has a session token or user.
      state.isAuthenticated = Boolean(state.accessToken || state.user);
      state.requiresOtp = false;
      state.otpEmail = null;
      state.otpIdentifier = null;
      state.otpChannel = null;
      if (state.user) {
        state.user.isApproved = action.payload.isApproved;
      }
    });
    builder.addCase(sendOtp.rejected, (state, action) => {
      state.error = (action.payload as string | undefined) || action.error.message || "Unable to send OTP";
    });

    // Resend OTP
    builder.addCase(resendOtp.rejected, (state, action) => {
      state.error = (action.payload as string | undefined) || action.error.message || "Unable to resend OTP";
    });

    // Verify OTP
    builder.addCase(verifyOtp.rejected, (state, action) => {
      state.isLoading = false; // Allow the user to correct or resend a rejected code.
      state.error = (action.payload as string | undefined) || action.error.message || "OTP verification failed";
    });

    // Fetch profile
    builder.addCase(fetchProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      const inMemoryVerification = state.user && state.user.id === action.payload.user.id && state.requiresOtp && state.otpIdentifier && state.otpChannel ? { userId: state.user.id, identifier: state.otpIdentifier, channel: state.otpChannel } : null; // Keep active handoffs intact even when browser storage is unavailable.
      // Store the current user profile returned by the backend.
      state.user = action.payload.user;

      const pendingVerification = readPendingVerification(action.payload.user.id) || inMemoryVerification; // Restore the backend-issued handoff only for this account.
      const needsAccountVerification = Boolean(pendingVerification) || (!action.payload.user.isApproved && action.payload.user.role !== "THERAPIST"); // Therapist approval alone cannot determine whether signup OTP is complete.

      // Keep OTP metadata available when a stored token belongs to an unverified account.
      state.requiresOtp = needsAccountVerification;

      // Use the user's email or phone as the OTP identifier after profile hydration.
      state.otpIdentifier = needsAccountVerification ? pendingVerification?.identifier || action.payload.user.email || action.payload.user.phone : null; // Preserve the original delivery target instead of preferring email after SMS verification.

      // Preserve the email label when the hydrated account verifies by email.
      state.otpEmail = needsAccountVerification ? (pendingVerification ? pendingVerification.channel === "EMAIL" ? pendingVerification.identifier : null : action.payload.user.email) : null; // Keep the displayed label aligned with the actual channel.

      // Infer the verification channel from whichever identifier exists.
      state.otpChannel = needsAccountVerification ? pendingVerification?.channel || (action.payload.user.email ? "EMAIL" : "SMS") : null; // Restore the same transport used for the pending code.

      // Only mark the app authenticated when no verification step is pending.
      state.isAuthenticated = !needsAccountVerification;

      // Finish the bootstrap loading state after profile hydration completes.
      state.isLoading = false;
    });
    builder.addCase(fetchProfile.rejected, (state, action) => {
      resetAuthState(state);
      state.error = action.error.message || "Session expired";
    });
  },
});

export const { clearError, setRequiresOtp, clearOtpState, clearSession, hydrateStoredSession } = authSlice.actions;
export default authSlice.reducer;
