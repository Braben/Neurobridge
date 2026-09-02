// Auth slice — manages authentication state (user, tokens, loading, errors)
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../services/api";

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
  }) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data: { email?: string; phone?: string; password: string }) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await api.post("/auth/logout");
});

export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (payload: { identifier: string; channel?: "EMAIL" | "SMS" }) => {
  const response = await api.post("/auth/send-otp", payload);
  return response.data;
});

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (data: { identifier: string; channel?: "EMAIL" | "SMS"; code: string }) => {
    const response = await api.post("/auth/verify-otp", data);
    return response.data;
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
      state.requiresOtp = action.payload.requiresOtp;
      state.otpEmail = action.payload.email || (action.payload.channel === "EMAIL" ? action.payload.identifier : null);
      state.otpIdentifier = action.payload.identifier;
      state.otpChannel = action.payload.channel || (action.payload.email ? "EMAIL" : null);
    },
    clearOtpState: (state) => {
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
      if (action.payload.accessToken) {
        localStorage.setItem("accessToken", action.payload.accessToken);
      }
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || "Registration failed";
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
      localStorage.setItem("accessToken", action.payload.accessToken);
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || "Login failed";
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      resetAuthState(state);
    });

    // Verify OTP
    builder.addCase(verifyOtp.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.requiresOtp = false;
      state.otpEmail = null;
      state.otpIdentifier = null;
      state.otpChannel = null;
      if (state.user) {
        state.user.isApproved = action.payload.isApproved;
      }
    });
    builder.addCase(verifyOtp.rejected, (state, action) => {
      state.error = action.error.message || "OTP verification failed";
    });

    // Fetch profile
    builder.addCase(fetchProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
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
