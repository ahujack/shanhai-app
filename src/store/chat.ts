import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { agentApi, AgentChatDto, AgentResponse, DivinationResult, FortuneSlip, Meditation, ZiResult } from '../services/api';

const CHAT_SESSION_KEY = 'shanhai_current_chat_session_v1';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: string;
  retryWith?: string; // 连接失败时可重试，携带原用户消息
  artifacts?: {
    reading?: DivinationResult;
    fortune?: FortuneSlip;
    meditation?: Meditation;
    zi?: ZiResult;
  };
  actions?: Array<{
    type: string;
    label: string;
  }>;
}

interface ChatState {
  sessionId: string;
  messages: ChatMessage[];
  isLoading: boolean;
  currentIntent?: string;
  
  // Actions
  sendMessage: (
    message: string,
    personaId?: string,
    mood?: string,
    options?: { appendUser?: boolean; replaceAssistantId?: string },
  ) => Promise<void>;
  clearMessages: () => void;
  hydrateMessages: () => Promise<void>;
  removeMessage: (id: string) => void;
  addSystemMessage: (content: string) => void;
}

function createSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function serializeMessages(messages: ChatMessage[]) {
  return messages.slice(-80).map((m) => ({
    ...m,
    timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
  }));
}

async function persistChat(sessionId: string, messages: ChatMessage[], currentIntent?: string) {
  try {
    await AsyncStorage.setItem(
      CHAT_SESSION_KEY,
      JSON.stringify({
        sessionId,
        currentIntent,
        messages: serializeMessages(messages),
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // persistence failure should never block chat
  }
}

async function clearPersistedChat() {
  try {
    await AsyncStorage.removeItem(CHAT_SESSION_KEY);
  } catch {
    // ignore
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: createSessionId(),
  messages: [],
  isLoading: false,
  
  sendMessage: async (
    message: string,
    personaId?: string,
    mood?: string,
    options?: { appendUser?: boolean; replaceAssistantId?: string },
  ) => {
    const appendUser = options?.appendUser !== false;
    const replaceAssistantId = options?.replaceAssistantId;
    const now = new Date();
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: now,
    };

    set((state) => ({
      messages: appendUser ? [...state.messages, userMessage] : state.messages,
      isLoading: true,
    }));

    const contextSource = appendUser ? [...get().messages] : get().messages;
    const recentContext = contextSource
      .slice(-8)
      .map((m) => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`);

    const dto: AgentChatDto = {
      message,
      personaId,
      context: recentContext,
      mood: mood as any,
      clientLocalHour: new Date().getHours(),
    };

    const assistantId = replaceAssistantId || `assistant_${Date.now()}`;
    let pendingChunk = '';
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    const flushPendingChunks = () => {
      if (!pendingChunk) return;
      const mergedChunk = pendingChunk;
      pendingChunk = '';
      set((state) => {
        const msgs = [...state.messages];
        const idx = msgs.findIndex((m) => m.id === assistantId);
        if (idx >= 0) {
          msgs[idx] = { ...msgs[idx], content: msgs[idx].content + mergedChunk };
        }
        return { messages: msgs };
      });
    };
    const scheduleChunkFlush = () => {
      if (flushTimer) return;
      flushTimer = setTimeout(() => {
        flushTimer = null;
        flushPendingChunks();
      }, 40);
    };
    const placeholderMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    set((state) => {
      if (replaceAssistantId) {
        return {
          messages: state.messages.map((m) =>
            m.id === replaceAssistantId
              ? { ...m, content: '', timestamp: new Date(), retryWith: undefined }
              : m,
          ),
        };
      }
      return {
        messages: [...state.messages, placeholderMessage],
      };
    });

    try {
      try {
        const response = await agentApi.chatStream(dto, (chunk) => {
          pendingChunk += chunk;
          scheduleChunkFlush();
        });
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        flushPendingChunks();
        set((state) => {
          const msgs = [...state.messages];
          const idx = msgs.findIndex((m) => m.id === assistantId);
          if (idx >= 0) {
            msgs[idx] = {
              ...msgs[idx],
              content: response.reply,
              intent: response.intent,
              artifacts: response.artifacts as any,
              actions: response.actions,
            };
          }
          void persistChat(state.sessionId, msgs, response.intent);
          return {
            messages: msgs,
            isLoading: false,
            currentIntent: response.intent,
          };
        });
        return;
      } catch (streamErr) {
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        flushPendingChunks();
        console.warn('流式请求失败，回退到普通请求', streamErr);
      }

      if (!replaceAssistantId) {
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== assistantId),
        }));
      }
      const response = await agentApi.chat(dto);
      set((state) => {
        if (replaceAssistantId) {
          const nextMessages = state.messages.map((m) =>
              m.id === replaceAssistantId
                ? {
                    ...m,
                    content: response.reply,
                    timestamp: new Date(),
                    intent: response.intent,
                    artifacts: response.artifacts as any,
                    actions: response.actions,
                  }
                : m,
            );
          void persistChat(state.sessionId, nextMessages, response.intent);
          return {
            messages: nextMessages,
            isLoading: false,
            currentIntent: response.intent,
          };
        }
        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: response.reply,
          timestamp: new Date(),
          intent: response.intent,
          artifacts: response.artifacts as any,
          actions: response.actions,
        };
        const nextMessages = [...state.messages, assistantMessage];
        void persistChat(state.sessionId, nextMessages, response.intent);
        return {
          messages: nextMessages,
          isLoading: false,
          currentIntent: response.intent,
        };
      });
    } catch (error) {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      console.error('发送消息失败:', error);
      set({ isLoading: false });

      set((state) => {
        const msgs = [...state.messages];
        const idx = msgs.findIndex((m) => m.id === assistantId);
        const lastUserMsg = state.messages.filter((m) => m.role === 'user').pop();
        const errStr = error instanceof Error ? error.message : String(error);
        const errorContent =
          /登录|请先登录|过期|重新登录|401/i.test(errStr)
            ? '登录状态已失效，请点击顶部「登录」重新登录；不登录也可继续试用对话。'
            : '抱歉，连接出现问题。请稍后再试。';
        const errorMsg = {
          id: idx >= 0 ? assistantId : `error_${Date.now()}`,
          role: 'assistant' as const,
          content: errorContent,
          timestamp: new Date(),
          retryWith: lastUserMsg?.content,
        };
        if (idx >= 0) {
          msgs[idx] = { ...msgs[idx], ...errorMsg };
        } else {
          msgs.push(errorMsg);
        }
        void persistChat(state.sessionId, msgs, state.currentIntent);
        return { messages: msgs };
      });
    }
  },
  
  clearMessages: () => {
    void clearPersistedChat();
    set({ sessionId: createSessionId(), messages: [], currentIntent: undefined });
  },

  hydrateMessages: async () => {
    try {
      const raw = await AsyncStorage.getItem(CHAT_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const messages = Array.isArray(parsed.messages)
        ? parsed.messages
            .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
            .map((m: any) => ({
              ...m,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            }))
        : [];
      if (!messages.length) return;
      set({
        sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : createSessionId(),
        messages,
        currentIntent: typeof parsed.currentIntent === 'string' ? parsed.currentIntent : undefined,
      });
    } catch {
      // ignore corrupted local session
    }
  },
  
  removeMessage: (id: string) => {
    set((state) => {
      const messages = state.messages.filter((m) => m.id !== id);
      void persistChat(state.sessionId, messages, state.currentIntent);
      return { messages };
    });
  },
  
  addSystemMessage: (content: string) => {
    const message: ChatMessage = {
      id: `system_${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    set(state => {
      const messages = [...state.messages, message];
      void persistChat(state.sessionId, messages, state.currentIntent);
      return { messages };
    });
  },
}));
