"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppButton from "../../components/ui/AppButton";
import { DashboardPanel, EmptyState, LoadingState, ScreenHeader } from "../../components/ui/DashboardCards";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { notificationsApi } from "../../services/notifications";
import { setNotifications, markAllRead } from "../../store/slices/notificationSlice";

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const storeNotifications = useAppSelector((state) => state.notification.notifications);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    notificationsApi
      .list()
      .then((d) => dispatch(setNotifications(d.notifications)))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router, dispatch]);

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllAsRead();
    dispatch(markAllRead());
  };

  const handleMarkRead = async (id: string) => {
    await notificationsApi.markAsRead(id);
    dispatch(setNotifications(storeNotifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))));
  };

  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Alerts"
        title="Notifications"
        description="System reminders, account events, and care updates from the notifications API."
        action={
          <AppButton onClick={handleMarkAllRead} variant="secondary">
            Mark All Read
          </AppButton>
        }
      />

      <DashboardPanel title="Notification Center" description={`${storeNotifications.length} notification${storeNotifications.length === 1 ? "" : "s"}`}>
        <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
          {loading ? (
            <LoadingState />
          ) : storeNotifications.length === 0 ? (
            <EmptyState title="No notifications yet" message="New updates will appear here." />
          ) : (
            <div className="divide-y divide-[#edf4f8]">
              {storeNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                  className={`flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f8fbfd] ${
                    notification.isRead ? "bg-white" : "bg-[#eaf6fb]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm text-[#111827] ${notification.isRead ? "font-medium" : "font-bold"}`}>
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-[#536471]">{notification.body}</p>
                    <p className="mt-2 text-xs text-[#536471]">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                  {!notification.isRead && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0078d4]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}
