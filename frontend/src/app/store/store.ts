// Redux store configuration
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import childReducer from "./slices/childSlice";
import notificationReducer from "./slices/notificationSlice";
import messageReducer from "./slices/messageSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    child: childReducer,
    notification: notificationReducer,
    message: messageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
