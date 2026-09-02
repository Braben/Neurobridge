"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { SocketManager } from "./services/SocketManager";
import { useAppDispatch, useAppSelector } from "./hooks/useRedux";
import { clearSession, fetchProfile, hydrateStoredSession } from "./store/slices/authSlice";

function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const hydratedRef = useRef(false);
  const requestedProfileRef = useRef(false);
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    dispatch(hydrateStoredSession(window.localStorage.getItem("accessToken")));
  }, [dispatch]);

  useEffect(() => {
    if (!accessToken || isAuthenticated) {
      requestedProfileRef.current = false;
      return;
    }

    if (requestedProfileRef.current) return;

    requestedProfileRef.current = true;
    void dispatch(fetchProfile());
  }, [accessToken, dispatch, isAuthenticated]);

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(clearSession());
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [dispatch]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthBootstrap />
      <SocketManager />
      {children}
    </Provider>
  );
}
