// Notifications page — full list of the user's notifications fetched from the
// API on mount. Supports marking individual notifications as read (by clicking)
// or marking all as read at once. The unread count and list in Redux are kept
// in sync with the server so the Navbar badge stays accurate.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { notificationsApi, Notification } from "../services/notifications";
import { setNotifications, markAllRead } from "../store/slices/notificationSlice";

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const storeNotifications = useAppSelector((state) => state.notification.notifications);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from API and sync into Redux
  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    notificationsApi.list().then((d) => {
      dispatch(setNotifications(d.notifications));
    }).finally(() => setLoading(false));
  }, [isAuthenticated, router, dispatch]);

  /** Marks all notifications as read via API, then updates Redux optimistically. */
  const handleMarkAllRead = async () => {
    await notificationsApi.markAllAsRead();
    dispatch(markAllRead());
  };

  /** Marks a single notification as read by ID, then patches it in Redux. */
  const handleMarkRead = async (id: string) => {
    await notificationsApi.markAsRead(id);
    dispatch(setNotifications(
      storeNotifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
    ));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={handleMarkAllRead}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Mark all as read
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : storeNotifications.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {storeNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                n.isRead
                  ? "border-transparent bg-white"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.isRead ? "text-gray-900" : "font-semibold text-gray-900"}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">{n.body}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
