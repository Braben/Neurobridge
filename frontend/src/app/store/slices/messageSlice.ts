// Message Redux slice — buffers live messages received via socket so they
// are available across page navigations. The SocketManager pushes messages
// here, and individual conversation pages flush the buffer on mount via
// clearLiveMessages. The buffer is capped at 100 messages per conversation
// to prevent unbounded memory growth.
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Sender {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: Sender;
}

interface MessageState {
  /** Map of conversationId → array of live-streamed messages. */
  liveMessages: Record<string, Message[]>;
}

const initialState: MessageState = {
  liveMessages: {},
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    /** Appends a live message to the conversation's buffer, capped at 100 entries. */
    addLiveMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;
      if (!state.liveMessages[conversationId]) {
        state.liveMessages[conversationId] = [];
      }
      state.liveMessages[conversationId].push(message);
      // Cap to prevent unbounded growth from long-running sessions
      if (state.liveMessages[conversationId].length > 100) {
        state.liveMessages[conversationId] = state.liveMessages[conversationId].slice(-100);
      }
    },
    /** Clears the buffer for a conversation (called when navigating into that conversation). */
    clearLiveMessages: (state, action: PayloadAction<string>) => {
      delete state.liveMessages[action.payload];
    },
  },
});

export const { addLiveMessage, clearLiveMessages } = messageSlice.actions;
export default messageSlice.reducer;
