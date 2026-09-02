"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "../../../hooks/useRedux";
import { messagesApi, Message } from "../../../services/messages";
import { getSocket } from "../../../services/socket";
import { clearLiveMessages } from "../../../store/slices/messageSlice";
import AppButton from "../../../components/ui/AppButton";
import { DashboardPanel, LoadingState, ScreenHeader } from "../../../components/ui/DashboardCards";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    messagesApi
      .getMessages(id)
      .then((d) => {
        setMessages(d.messages);
        dispatch(clearLiveMessages(id));
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, id, router, dispatch]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === id) {
        setMessages((prev) => (prev.some((message) => message.id === data.message.id) ? prev : [...prev, data.message]));
      }
    };
    socket.on("message:new", handler);
    return () => {
      socket.off("message:new", handler);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await messagesApi.sendMessage(id, content);
      setMessages((prev) => [...prev, res.msg]);
      setContent("");
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  const messagesBasePath = pathname.startsWith("/admin/") ? "/admin/messages" : "/messages";

  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Messages"
        title="Conversation"
        description="Live care-team message history and replies."
        action={
          <AppButton href={messagesBasePath} variant="ghost">
            Back
          </AppButton>
        }
      />

      <DashboardPanel title="Thread" description={`${messages.length} message${messages.length === 1 ? "" : "s"}`}>
        <div className="flex min-h-[60vh] flex-col rounded-md border border-[#d7e6f2] bg-white shadow-sm">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {loading ? (
              <LoadingState />
            ) : messages.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#536471]">No messages yet. Start the conversation.</p>
            ) : (
              messages.map((message) => {
                const isMe = message.senderId === user.id;
                return (
                  <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        isMe ? "bg-[#0a3d62] text-white" : "bg-[#f6fbfd] text-[#111827]"
                      }`}
                    >
                      {!isMe && (
                        <p className="text-xs font-semibold text-[#0078d4]">
                          {message.sender.firstName} {message.sender.lastName}
                        </p>
                      )}
                      <p className="mt-1 text-sm leading-6">{message.content}</p>
                      <p className={`mt-1 text-right text-xs ${isMe ? "text-white/70" : "text-[#536471]"}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-[#edf4f8] p-4">
            <input
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Type a message..."
              maxLength={5000}
              className="h-12 flex-1 rounded-2xl border border-[#b5d3ee] bg-[#f5f5f5] px-4 text-sm text-[#111827] outline-none focus:border-[#0071d7] focus:ring-4 focus:ring-[#0071d7]/20"
            />
            <AppButton type="submit" disabled={sending || !content.trim()}>
              {sending ? "Sending..." : "Send"}
            </AppButton>
          </form>
        </div>
      </DashboardPanel>
    </div>
  );
}
