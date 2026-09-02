// Axios instance with JWT interceptors for automatic token management
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api/v1";

const getStoredAccessToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("accessToken");
};

const clearStoredAccessToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("accessToken");
  window.dispatchEvent(new Event("auth:unauthorized"));
};

const redirectToLogin = () => {
  if (typeof window === "undefined" || window.location.pathname === "/login") return;
  window.location.replace("/login");
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for httpOnly refresh token cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attaches the access token to every request
api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — on 401, attempts token refresh before failing
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";
    const isAuthAttempt =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/verify-otp") ||
      requestUrl.includes("/auth/send-otp") ||
      requestUrl.includes("/auth/resend-otp") ||
      requestUrl.includes("/auth/refresh");

    // If 401 and not a refresh request itself, try refreshing
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthAttempt) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = response.data.accessToken;
        if (typeof window !== "undefined") {
          window.localStorage.setItem("accessToken", newToken);
        }
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearStoredAccessToken();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
