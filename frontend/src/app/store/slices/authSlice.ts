// Auth slice — manages authentication state (user, tokens, loading, errors)
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../services/api";

// Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: typeof window !== "undefined" ? localStorage.getItem("accessToken") : null,
  isAuthenticated: false,
  requiresOtp: false,
  otpEmail: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const registerUser = createAsyncThunk(
  "auth/register",
  async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role: string;
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

export const sendOtp = createAsyncThunk("auth/sendOtp", async (email: string) => {
  const response = await api.post("/auth/send-otp", { email });
  return response.data;
});

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (data: { email: string; code: string }) => {
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
    clearError: (state) => {
      state.error = null;
    },
    setRequiresOtp: (state, action: PayloadAction<{ requiresOtp: boolean; email: string }>) => {
      state.requiresOtp = action.payload.requiresOtp;
      state.otpEmail = action.payload.email;
    },
    clearOtpState: (state) => {
      state.requiresOtp = false;
      state.otpEmail = null;
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
      state.requiresOtp = true;
      state.otpEmail = action.payload.user.email;
      localStorage.setItem("accessToken", action.payload.accessToken);
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
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.requiresOtp = false;
      state.otpEmail = null;
      localStorage.removeItem("accessToken");
    });

    // Verify OTP
    builder.addCase(verifyOtp.fulfilled, (state) => {
      state.isAuthenticated = true;
      state.requiresOtp = false;
      state.otpEmail = null;
      if (state.user) {
        state.user.isApproved = true;
      }
    });
    builder.addCase(verifyOtp.rejected, (state, action) => {
      state.error = action.error.message || "OTP verification failed";
    });

    // Fetch profile
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
    });
  },
});

export const { clearError, setRequiresOtp, clearOtpState } = authSlice.actions;
export default authSlice.reducer;
