import { dispatchCustomEvent } from '../utils/eventBus.js';

export interface ChatMessageItem {
  role: 'user' | 'model' | 'admin';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  sessionId: string;
  visitorName: string;
  visitorEmail?: string;
  messages: ChatMessageItem[];
  aiBotActive: boolean; // true = AI bot replies, false = Human admin takeover (AI paused)
  lastActivity: number;
}

const CHAT_STORAGE_KEY = 'aiwebcrafter_admin_chat_sessions_v2';

export const getStoredChatSessions = (): ChatSession[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading chat sessions', e);
    return [];
  }
};

export const saveChatSessions = (sessions: ChatSession[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
    dispatchCustomEvent('storage-chat-updated');
  } catch (e) {
    console.error('Error saving chat sessions', e);
  }
};

export const getOrCreateVisitorSession = (sessionId: string, visitorName = 'Visitor'): ChatSession => {
  const sessions = getStoredChatSessions();
  let session = sessions.find((s) => s.sessionId === sessionId);
  if (!session) {
    session = {
      sessionId,
      visitorName,
      messages: [
        {
          role: 'model',
          text: 'Welcome to AIWebCrafter! I am your AI Marketplace Advisor. Ask me about any SaaS listing, valuation multiples, or tech stacks.',
          timestamp: Date.now()
        }
      ],
      aiBotActive: true,
      lastActivity: Date.now()
    };
    sessions.push(session);
    saveChatSessions(sessions);
  }
  return session;
};

export const addMessageToSession = (sessionId: string, role: 'user' | 'model' | 'admin', text: string): ChatSession[] => {
  const sessions = getStoredChatSessions();
  const index = sessions.findIndex((s) => s.sessionId === sessionId);
  if (index !== -1) {
    sessions[index].messages.push({ role, text, timestamp: Date.now() });
    sessions[index].lastActivity = Date.now();
  } else {
    sessions.push({
      sessionId,
      visitorName: 'Visitor #' + sessionId.slice(-4),
      messages: [{ role, text, timestamp: Date.now() }],
      aiBotActive: true,
      lastActivity: Date.now()
    });
  }
  saveChatSessions(sessions);
  return sessions;
};

export const setAiBotActiveStatus = (sessionId: string, aiBotActive: boolean): ChatSession[] => {
  const sessions = getStoredChatSessions();
  const index = sessions.findIndex((s) => s.sessionId === sessionId);
  if (index !== -1) {
    sessions[index].aiBotActive = aiBotActive;
    saveChatSessions(sessions);
  }
  return sessions;
};
