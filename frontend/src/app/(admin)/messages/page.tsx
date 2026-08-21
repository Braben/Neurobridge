"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "../../hooks/useRedux";
import { messagesApi, Conversation } from "../../services/messages";
import { getSocket } from "../../services/socket";
import { DashboardPanel, EmptyState, LoadingState, ScreenHeader, StatusBadge } from "../../components/ui/DashboardCards";

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    messagesApi
      .listConversations()
      .then((d) => setConversations(d.conversations))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data: { conversation: Conversation }) => {
      setConversations((prev) => (prev.some((c) => c.id === data.conversation.id) ? prev : [data.conversation, ...prev]));
    };
    socket.on("conversation:new", handler);
    return () => {
      socket.off("conversation:new", handler);
    };
  }, []);

  const getOtherParticipants = (conversation: Conversation) =>
    conversation.participants.filter((participant) => participant.user.id !== user?.id).map((participant) => participant.user);

  if (!user) return null;

  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Care communication"
        title="Messages"
        description="Continue parent and therapist conversations, with live updates from the messaging socket service."
      />

      <DashboardPanel title="Conversations" description={`${conversations.length} active thread${conversations.length === 1 ? "" : "s"}`}>
        <div className="overflow-hidden rounded-md border border-[#d7e6f2] bg-white shadow-sm">
          {loading ? (
            <LoadingState />
          ) : conversations.length === 0 ? (
            <EmptyState title="No conversations yet" message="Messages will appear here once a care team conversation starts." />
          ) : (
            <div className="divide-y divide-[#edf4f8]">
              {conversations.map((conversation) => {
                const others = getOtherParticipants(conversation);
                const lastMessage = conversation.messages[0];
                return (
                  <Link
                    key={conversation.id}
                    href={`/messages/${conversation.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#f8fbfd]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-[#111827]">
                          {others.map((other) => `${other.firstName} ${other.lastName}`).join(", ") || "Conversation"}
                        </p>
                        {lastMessage && lastMessage.senderId !== user.id && <StatusBadge tone="teal">Latest</StatusBadge>}
                      </div>
                      {lastMessage && <p className="mt-1 truncate text-sm text-[#536471]">{lastMessage.content}</p>}
                    </div>
                    {lastMessage && (
                      <span className="shrink-0 text-xs text-[#536471]">
                        {new Date(lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}
