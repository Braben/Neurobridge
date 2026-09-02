import { api } from "./api";

export interface Conversation {
  id: string;
  createdAt: string;
  participants: {
    id: string;
    user: { id: string; firstName: string; lastName: string; email?: string | null; phone?: string | null; role: string; avatar: string | null };
  }[];
  messages: { content: string; createdAt: string; senderId: string }[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; avatar: string | null };
}

export const messagesApi = {
  listConversations: () =>
    api.get<{ conversations: Conversation[] }>("/messages/conversations").then((r) => r.data),

  createConversation: (participantIds: string[]) =>
    api.post<{ conversation: Conversation }>("/messages/conversations", { participantIds }).then((r) => r.data),

  getMessages: (conversationId: string) =>
    api.get<{ messages: Message[] }>(`/messages/conversations/${conversationId}/messages`).then((r) => r.data),

  sendMessage: (conversationId: string, content: string) =>
    api.post<{ msg: Message }>(`/messages/conversations/${conversationId}/messages`, { content }).then((r) => r.data),
};
