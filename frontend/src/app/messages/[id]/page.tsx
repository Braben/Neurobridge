"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "../../hooks/useRedux";
import { messagesApi, Message } from "../../services/messages";
import { getSocket } from "../../services/socket";
import { clearLiveMessages } from "../../store/slices/messageSlice";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    messagesApi.getMessages(id).then((d) => {
      setMessages(d.messages);
      dispatch(clearLiveMessages(id));
    }).finally(() => setLoading(false));
  }, [isAuthenticated, id, router, dispatch]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === id) {
        setMessages((prev) => prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]);
      }
    };
    socket.on("message:new", handler);
    return () => { socket.off("message:new", handler); };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await messagesApi.sendMessage(id, content);
      setMessages((prev) => [...prev, res.msg]);
      setContent("");
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-4">
          <Link href="/messages" className="text-sm text-blue-600 hover:text-blue-500">&larr; Messages</Link>
          <h1 className="ml-4 text-lg font-bold text-gray-900">Conversation</h1>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4">
        <div className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-white p-4 shadow">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-12 text-center text-gray-500">No messages yet. Start the conversation.</p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-xl px-4 py-2 ${
                    isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}>
                    {!isMe && (
                      <p className="text-xs font-medium opacity-75">{msg.sender.firstName} {msg.sender.lastName}</p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`mt-0.5 text-right text-xs ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="mt-4 flex gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            maxLength={5000}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button type="submit" disabled={sending || !content.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
