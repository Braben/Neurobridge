// Notification API service — typed wrapper around axios calls to the
// /api/v1/notifications endpoints. Every request automatically includes
// the JWT via the api interceptor defined in api.ts.
import { api } from "./api";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  /** Fetches the 50 most recent notifications for the current user. */
  list: () =>
    api.get<{ notifications: Notification[]; unreadCount: number }>("/notifications").then((r) => r.data),

  /** Lightweight endpoint — just the unread count for the Navbar badge. */
  unreadCount: () =>
    api.get<{ unreadCount: number }>("/notifications/unread-count").then((r) => r.data),

  /** Marks a single notification as read by its ID. */
  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),

  /** Marks every unread notification as read for the current user. */
  markAllAsRead: () =>
    api.patch("/notifications/read-all").then((r) => r.data),
};
