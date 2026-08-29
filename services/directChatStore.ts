import { dispatchCustomEvent } from '../utils/eventBus.js';
import { safeFetchJson } from '../utils/api.js';

export interface DirectChatMessage {
  id: string;
  sender: 'buyer' | 'seller';
  senderName?: string;
  text: string;
  time: string;
  timestamp: number;
}

export interface DirectChatSession {
  id: string;
  listingId?: string;
  projectName: string;
  sellerName: string;
  sellerEmail?: string;
  sellerAvatar: string;
  buyerEmail?: string;
  lastMessage: string;
  time: string;
  lastActivity: number;
  unread: boolean;
  messages: DirectChatMessage[];
}

const STORAGE_KEY = 'aiwebcrafter_direct_chats_v2';

let isFetchingServerMessages = false;

export const fetchServerMessages = async (filterEmail?: string, userRole?: string): Promise<DirectChatSession[]> => {
  try {
    const params = new URLSearchParams();
    if (filterEmail) params.append('email', filterEmail);
    if (userRole) params.append('userRole', userRole);

    const res = await safeFetchJson(`/api/messages?${params.toString()}`);
    if (res.ok && res.data?.success && Array.isArray(res.data?.chats)) {
      const serverChats: DirectChatSession[] = res.data.chats;
      if (serverChats.length > 0) {
        const local = getStoredDirectChats();
        let changed = false;
        serverChats.forEach(sc => {
          const idx = local.findIndex(l => l.id === sc.id);
          if (idx === -1) {
            local.unshift(sc);
            changed = true;
          } else {
            // merge messages
            const existingMsgs = local[idx].messages || [];
            (sc.messages || []).forEach(m => {
              if (!existingMsgs.some(em => em.id === m.id || (em.timestamp === m.timestamp && em.text === m.text))) {
                existingMsgs.push(m);
                changed = true;
              }
            });
            local[idx] = { ...local[idx], ...sc, messages: existingMsgs };
          }
        });
        if (changed) {
          saveDirectChats(local);
          dispatchCustomEvent('direct-chats-updated');
          dispatchCustomEvent('aiwebcrafter_chats_updated');
        }
        return local;
      }
    }
  } catch (err) {
    console.warn('Error fetching server messages:', err);
  }
  return getStoredDirectChats();
};

// Automatic continuous polling for real-time messages across browsers
if (typeof window !== 'undefined') {
  setInterval(() => {
    const userJson = localStorage.getItem('aiwebcrafter_local_user');
    let email = '';
    let role = '';
    if (userJson) {
      try {
        const parsed = JSON.parse(userJson);
        email = parsed.email || '';
        role = parsed.role || '';
      } catch {}
    }
    fetchServerMessages(email, role).catch(() => {});
  }, 3000);
}

/**
 * Returns stored direct chats filtered for a specific user email & role.
 * Enforces privacy isolation so each user only sees messages relevant to them.
 */
export const getUserDirectChats = (filterEmail?: string, userRole?: string): DirectChatSession[] => {
  const allChats = getStoredDirectChats();

  // Trigger background server sync
  if (!isFetchingServerMessages && filterEmail) {
    isFetchingServerMessages = true;
    fetchServerMessages(filterEmail, userRole).finally(() => {
      isFetchingServerMessages = false;
    });
  }

  if (userRole === 'SUPER_ADMIN') {
    return allChats;
  }
  const email = (filterEmail || '').trim().toLowerCase();
  if (!email) {
    return allChats;
  }
  if (email === 'guest@aiwebcrafter.local') {
    return allChats.filter(c => 
      !c.buyerEmail || 
      !c.sellerEmail || 
      c.buyerEmail.toLowerCase() === 'guest@aiwebcrafter.local' ||
      c.sellerEmail.toLowerCase() === 'guest@aiwebcrafter.local'
    );
  }
  return allChats.filter(c => {
    const isBuyer = Boolean(c.buyerEmail && c.buyerEmail.toLowerCase() === email);
    const isSeller = Boolean(c.sellerEmail && c.sellerEmail.toLowerCase() === email);
    const isUnassigned = !c.buyerEmail && !c.sellerEmail;
    return isBuyer || isSeller || isUnassigned;
  });
};

export const getStoredDirectChats = (): DirectChatSession[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading direct chats from storage:', e);
    return [];
  }
};

export const saveDirectChats = (chats: DirectChatSession[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    dispatchCustomEvent('direct-chats-updated');
  } catch (e) {
    console.error('Error saving direct chats:', e);
  }
};

export const formatChatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export interface CreateChatParams {
  listingId?: string;
  projectName: string;
  sellerName: string;
  sellerEmail?: string;
  sellerAvatar?: string;
  initialMessage?: string;
  buyerEmail?: string;
}

export const createOrGetDirectChat = (params: CreateChatParams): DirectChatSession => {
  const chats = getStoredDirectChats();
  const now = Date.now();
  const timeStr = formatChatTime(now);

  const cleanProjectName = params.projectName || 'Listed Project';
  const cleanSellerName = params.sellerName || 'Verified Seller';
  const avatar = params.sellerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';

  // Check if a chat already exists for this listing or seller
  let existing = chats.find(c => 
    (params.listingId && c.listingId === params.listingId) ||
    (c.projectName === cleanProjectName && c.sellerName === cleanSellerName)
  );

  if (existing) {
    if (params.buyerEmail) existing.buyerEmail = params.buyerEmail;
    if (params.sellerEmail) existing.sellerEmail = params.sellerEmail;
    if (params.initialMessage && params.initialMessage.trim()) {
      const newMsg: DirectChatMessage = {
        id: `msg-${now}-${Math.random().toString(36).substr(2, 4)}`,
        sender: 'buyer',
        text: params.initialMessage.trim(),
        time: timeStr,
        timestamp: now
      };
      existing.messages.push(newMsg);
      existing.lastMessage = params.initialMessage.trim();
      existing.time = timeStr;
      existing.lastActivity = now;
      existing.unread = false;
      saveDirectChats(chats);

      // Send to server API
      safeFetchJson('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: existing.id,
          listingId: existing.listingId,
          projectName: existing.projectName,
          sellerName: existing.sellerName,
          sellerEmail: existing.sellerEmail,
          buyerEmail: existing.buyerEmail,
          sender: 'buyer',
          text: params.initialMessage.trim()
        })
      }).catch(err => console.warn('Server message sync warning:', err));
    }
    return existing;
  }

  // Create brand new chat
  const newChatId = `chat-${now}-${Math.random().toString(36).substr(2, 4)}`;
  const initialMessages: DirectChatMessage[] = [];

  if (params.initialMessage && params.initialMessage.trim()) {
    initialMessages.push({
      id: `msg-${now}-1`,
      sender: 'buyer',
      text: params.initialMessage.trim(),
      time: timeStr,
      timestamp: now
    });
  }

  const newSession: DirectChatSession = {
    id: newChatId,
    listingId: params.listingId,
    projectName: cleanProjectName,
    sellerName: cleanSellerName,
    sellerEmail: params.sellerEmail,
    sellerAvatar: avatar,
    buyerEmail: params.buyerEmail,
    lastMessage: params.initialMessage?.trim() || 'Chat initialized',
    time: timeStr,
    lastActivity: now,
    unread: false,
    messages: initialMessages
  };

  chats.unshift(newSession);
  saveDirectChats(chats);

  // Send to server API
  if (params.initialMessage && params.initialMessage.trim()) {
    safeFetchJson('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: newChatId,
        listingId: params.listingId,
        projectName: cleanProjectName,
        sellerName: cleanSellerName,
        sellerEmail: params.sellerEmail,
        buyerEmail: params.buyerEmail,
        sender: 'buyer',
        text: params.initialMessage.trim(),
        sellerAvatar: avatar
      })
    }).catch(err => console.warn('Server message sync warning:', err));
  }

  return newSession;
};

export const addDirectChatMessage = (
  chatId: string,
  sender: 'buyer' | 'seller',
  text: string,
  senderName?: string
): DirectChatSession | null => {
  const chats = getStoredDirectChats();
  const chatIndex = chats.findIndex(c => c.id === chatId);
  if (chatIndex === -1) return null;

  const now = Date.now();
  const timeStr = formatChatTime(now);

  const newMsg: DirectChatMessage = {
    id: `msg-${now}-${Math.random().toString(36).substr(2, 4)}`,
    sender,
    senderName,
    text: text.trim(),
    time: timeStr,
    timestamp: now
  };

  const targetChat = chats[chatIndex];
  targetChat.messages.push(newMsg);
  targetChat.lastMessage = text.trim();
  targetChat.time = timeStr;
  targetChat.lastActivity = now;

  // Move updated chat to top
  chats.splice(chatIndex, 1);
  chats.unshift(targetChat);

  saveDirectChats(chats);

  // Send to server API
  safeFetchJson('/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId: targetChat.id,
      listingId: targetChat.listingId,
      projectName: targetChat.projectName,
      sellerName: targetChat.sellerName,
      sellerEmail: targetChat.sellerEmail,
      buyerEmail: targetChat.buyerEmail,
      sender,
      senderName,
      text: text.trim(),
      sellerAvatar: targetChat.sellerAvatar
    })
  }).catch(err => console.warn('Server message sync warning:', err));

  return targetChat;
};

export const deleteDirectChat = (chatId: string): void => {
  const chats = getStoredDirectChats();
  const filtered = chats.filter(c => c.id !== chatId);
  saveDirectChats(filtered);
};

export const clearAllDirectChats = (): void => {
  saveDirectChats([]);
};
