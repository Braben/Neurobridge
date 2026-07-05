"use client";

import { Provider } from "react-redux";
import { store } from "./store/store";
import { SocketManager } from "./services/SocketManager";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SocketManager />
      {children}
    </Provider>
  );
}
