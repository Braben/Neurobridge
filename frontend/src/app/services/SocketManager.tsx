// SocketManager — invisible React component that lives inside Providers.
// It owns the socket lifecycle (connect on login, disconnect on logout) and
// registers global event listeners that update Redux and show toast alerts.
// Events handled here:
//   - notification:new  → adds to notification slice + toast
//   - message:new       → buffers into message slice + toast (own messages excluded)
//
// Page-level socket listeners (e.g. in conversation page) are registered
// independently via getSocket() and coexist with these global handlers.
"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { connectSocket, disconnectSocket, getSocket } from "./socket";
import { addNotification } from "../store/slices/notificationSlice";
import { addLiveMessage } from "../store/slices/messageSlice";
import toast from "react-hot-toast";

export function SocketManager() {
  const dispatch = useAppDispatch();
  const { accessToken, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const connectedRef = useRef(false);

  // ── Socket connection lifecycle ──
  // Connects when the user logs in and disconnects on logout.
  // The ref prevents duplicate connections on re-render.
  useEffect(() => {
    if (isAuthenticated && accessToken && !connectedRef.current) {
      connectSocket(accessToken);
      connectedRef.current = true;
    }

    if (!isAuthenticated && connectedRef.current) {
      disconnectSocket();
      connectedRef.current = false;
    }

    return () => {
      if (!isAuthenticated) {
        disconnectSocket();
        connectedRef.current = false;
      }
    };
  }, [isAuthenticated, accessToken]);

  // ── Global event listeners ──
  // These run once when the user object becomes available and are torn down
  // when the user changes (e.g. logout → login as different user).
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleNotification = (data: { notification: { id: string; userId: string; title: string; body: string; isRead: boolean; createdAt: string } }) => {
      dispatch(addNotification(data.notification));
      toast.success(data.notification.title, { id: `notif-${data.notification.id}` });
    };

    const handleMessage = (data: { conversationId: string; message: { id: string; senderId: string; content: string; createdAt: string; sender: { id: string; firstName: string; lastName: string; avatar: string | null } } }) => {
      if (data.message.senderId !== user.id) {
        dispatch(addLiveMessage({
          conversationId: data.conversationId,
          message: { ...data.message, conversationId: data.conversationId, isRead: false },
        }));
        toast.custom((t) => (
          <div className={`rounded-lg bg-white px-4 py-3 shadow-lg ${t.visible ? "animate-in" : ""}`}>
            <p className="text-xs font-medium text-gray-500">{data.message.sender.firstName} {data.message.sender.lastName}</p>
            <p className="text-sm text-gray-900">{data.message.content}</p>
          </div>
        ), { id: `msg-${data.message.id}`, duration: 4000 });
      }
    };

    socket.on("notification:new", handleNotification);
    socket.on("message:new", handleMessage);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("message:new", handleMessage);
    };
  }, [dispatch, user]);

  return null;
}
