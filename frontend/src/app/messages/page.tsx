"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "../hooks/useRedux";
import { messagesApi, Conversation } from "../services/messages";

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    messagesApi.listConversations().then((d) => setConversations(d.conversations)).finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const getOtherParticipants = (conv: Conversation) =>
    conv.participants.filter((p) => p.user.id !== user?.id).map((p) => p.user);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-4">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-500">&larr; Dashboard</Link>
          <h1 className="ml-4 text-xl font-bold text-gray-900">Messages</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow">
            <p className="text-gray-500">No conversations yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const others = getOtherParticipants(conv);
              const lastMsg = conv.messages[0];
              return (
                <Link key={conv.id} href={`/messages/${conv.id}`}
                  className="flex items-center justify-between rounded-xl bg-white p-4 shadow transition-colors hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {others.map((o) => `${o.firstName} ${o.lastName}`).join(", ")}
                    </p>
                    {lastMsg && (
                      <p className="mt-0.5 truncate text-sm text-gray-500">{lastMsg.content}</p>
                    )}
                  </div>
                  {lastMsg && (
                    <span className="ml-4 shrink-0 text-xs text-gray-400">
                      {new Date(lastMsg.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
