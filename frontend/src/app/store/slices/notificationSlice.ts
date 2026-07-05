// Notification Redux slice — manages the in-memory notification list and
// unread count that powers the Navbar badge and the notifications page.
// The SocketManager pushes new notifications via addNotification();
// the notifications page fetches the full list via setNotifications();
// markAllRead() is called both from the UI and after the API confirms.
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    /** Pushes a single new notification (from socket) to the front and bumps count. */
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    /** Replaces the full list (from API response) and recalculates unread count. */
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.isRead).length;
    },
    /** Optimistically marks all notifications read (UI + confirmed by API). */
    markAllRead: (state) => {
      state.notifications.forEach((n) => { n.isRead = true; });
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, setNotifications, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
