import { create } from 'zustand';
import { agentApi, AgentChatDto, AgentResponse, DivinationResult, FortuneSlip, Meditation, ZiResult } from '../services/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: string;
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
  messages: ChatMessage[];
  isLoading: boolean;
  currentIntent?: string;
  
  // Actions
  sendMessage: (message: string, personaId?: string, userId?: string, mood?: string) => Promise<void>;
  clearMessages: () => void;
  addSystemMessage: (content: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  
  sendMessage: async (message: string, personaId?: string, userId?: string, mood?: string) => {
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    set(state => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    const recentContext = get()
      .messages
      .slice(-8)
      .map((m) => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`);

    const dto: AgentChatDto = {
      message,
      personaId,
      context: recentContext,
      userId,
      mood: mood as any,
    };

    const assistantId = `assistant_${Date.now()}`;
    const placeholderMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    set(state => ({
      messages: [...state.messages, placeholderMessage],
    }));

    try {
      try {
        const response = await agentApi.chatStream(dto, (chunk) => {
          set((state) => {
            const msgs = [...state.messages];
            const idx = msgs.findIndex((m) => m.id === assistantId);
            if (idx >= 0) {
              msgs[idx] = { ...msgs[idx], content: msgs[idx].content + chunk };
            }
            return { messages: msgs };
          });
        });
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
          return {
            messages: msgs,
            isLoading: false,
            currentIntent: response.intent,
          };
        });
        return;
      } catch (streamErr) {
        console.warn('流式请求失败，回退到普通请求', streamErr);
      }

      set((state) => ({
        messages: state.messages.filter((m) => m.id !== assistantId),
      }));
      const response = await agentApi.chat(dto);
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        intent: response.intent,
        artifacts: response.artifacts as any,
        actions: response.actions,
      };
      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        currentIntent: response.intent,
      }));
    } catch (error) {
      console.error('发送消息失败:', error);
      set({ isLoading: false });

      set((state) => {
        const msgs = [...state.messages];
        const idx = msgs.findIndex((m) => m.id === assistantId);
        if (idx >= 0) {
          msgs[idx] = {
            ...msgs[idx],
            content: '抱歉，连接出现问题。请稍后再试。',
          };
        } else {
          msgs.push({
            id: `error_${Date.now()}`,
            role: 'assistant',
            content: '抱歉，连接出现问题。请稍后再试。',
            timestamp: new Date(),
          });
        }
        return { messages: msgs };
      });
    }
  },
  
  clearMessages: () => {
    set({ messages: [], currentIntent: undefined });
  },
  
  addSystemMessage: (content: string) => {
    const message: ChatMessage = {
      id: `system_${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    set(state => ({
      messages: [...state.messages, message],
    }));
  },
}));
