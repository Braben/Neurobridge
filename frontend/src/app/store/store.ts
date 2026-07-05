// Redux store configuration
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import childReducer from "./slices/childSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    child: childReducer,
    // session: sessionReducer,
    // message: messageReducer,
  },
});

// Infer the RootState and AppDispatch types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
