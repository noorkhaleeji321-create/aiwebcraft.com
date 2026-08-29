import { dispatchCustomEvent } from '../utils/eventBus.js';
import { safeFetchJson } from '../utils/api.js';

export interface SupportTicketMessage {
  id: string;
  sender: 'user' | 'admin';
  senderName: string;
  text: string;
  timestamp: number;
  date: string;
}

export interface SupportTicket {
  id: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'BUYER' | 'VENDOR' | 'VISITOR';
  subject: string;
  category: 'escrow' | 'verification' | 'order' | 'technical' | 'general' | 'dispute';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  messages: SupportTicketMessage[];
  adminNotes?: string;
}

const STORAGE_KEY = 'aiwebcrafter_support_tickets_v2';

export const getStoredSupportTickets = (): SupportTicket[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading support tickets', e);
    return [];
  }
};

export const saveSupportTickets = (tickets: SupportTicket[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    dispatchCustomEvent('support-tickets-updated');
  } catch (e) {
    console.error('Error saving support tickets', e);
  }
};

// Fetch latest support tickets from server and merge with local storage
export const fetchServerSupportTickets = async (email?: string, isAdmin = false): Promise<SupportTicket[]> => {
  try {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (isAdmin) params.append('isAdmin', 'true');

    const res = await safeFetchJson(`/api/support/tickets?${params.toString()}`);
    if (res.ok && res.data?.success && Array.isArray(res.data?.tickets)) {
      const serverTickets: SupportTicket[] = res.data.tickets;
      if (serverTickets.length > 0) {
        const local = getStoredSupportTickets();
        let changed = false;

        serverTickets.forEach(st => {
          const idx = local.findIndex(l => l.id === st.id);
          if (idx === -1) {
            local.unshift(st);
            changed = true;
          } else {
            local[idx] = { ...local[idx], ...st };
            changed = true;
          }
        });

        if (changed) {
          saveSupportTickets(local);
        }
        return local;
      }
    }
  } catch (err) {
    console.warn('Error fetching server support tickets:', err);
  }
  return getStoredSupportTickets();
};

// Create a new support ticket (User to Admin)
export const createSupportTicket = async (ticketData: {
  senderName: string;
  senderEmail: string;
  senderRole?: 'BUYER' | 'VENDOR' | 'VISITOR';
  subject: string;
  category?: 'escrow' | 'verification' | 'order' | 'technical' | 'general' | 'dispute';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
}): Promise<SupportTicket> => {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const dateStr = new Date(now).toLocaleString();
  const ticketId = `TICK-${Math.floor(10000 + Math.random() * 90000)}`;

  const newTicket: SupportTicket = {
    id: ticketId,
    senderName: ticketData.senderName.trim(),
    senderEmail: ticketData.senderEmail.trim().toLowerCase(),
    senderRole: ticketData.senderRole || 'BUYER',
    subject: ticketData.subject.trim(),
    category: ticketData.category || 'general',
    priority: ticketData.priority || 'medium',
    status: 'OPEN',
    createdAt: nowIso,
    updatedAt: nowIso,
    messages: [
      {
        id: `msg-${now}`,
        sender: 'user',
        senderName: ticketData.senderName.trim(),
        text: ticketData.message.trim(),
        timestamp: now,
        date: dateStr
      }
    ]
  };

  // Local storage save immediately
  const local = getStoredSupportTickets();
  local.unshift(newTicket);
  saveSupportTickets(local);

  // Sync to server backend
  try {
    await safeFetchJson('/api/support/tickets', {
      method: 'POST',
      body: ticketData
    });
  } catch (e) {
    console.warn('Backend ticket sync error:', e);
  }

  return newTicket;
};

// Reply to an existing support ticket
export const replyToSupportTicket = async (
  ticketId: string,
  sender: 'user' | 'admin',
  senderName: string,
  text: string
): Promise<SupportTicket | null> => {
  const local = getStoredSupportTickets();
  const index = local.findIndex(t => t.id === ticketId);
  if (index === -1) return null;

  const now = Date.now();
  const newMsg: SupportTicketMessage = {
    id: `msg-${now}`,
    sender,
    senderName,
    text: text.trim(),
    timestamp: now,
    date: new Date(now).toLocaleString()
  };

  local[index].messages.push(newMsg);
  local[index].updatedAt = new Date(now).toISOString();
  if (sender === 'admin' && local[index].status === 'OPEN') {
    local[index].status = 'IN_PROGRESS';
  }

  saveSupportTickets(local);

  // Sync to server
  try {
    await safeFetchJson('/api/support/reply', {
      method: 'POST',
      body: {
        ticketId,
        sender,
        senderName,
        text
      }
    });
  } catch (e) {
    console.warn('Backend ticket reply sync error:', e);
  }

  return local[index];
};

// Update ticket status (Admin action)
export const updateTicketStatus = async (
  ticketId: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
  adminNotes?: string
): Promise<SupportTicket | null> => {
  const local = getStoredSupportTickets();
  const index = local.findIndex(t => t.id === ticketId);
  if (index === -1) return null;

  local[index].status = status;
  if (adminNotes !== undefined) {
    local[index].adminNotes = adminNotes;
  }
  local[index].updatedAt = new Date().toISOString();

  saveSupportTickets(local);

  // Sync to server
  try {
    await safeFetchJson('/api/support/status', {
      method: 'POST',
      body: {
        ticketId,
        status,
        adminNotes
      }
    });
  } catch (e) {
    console.warn('Backend ticket status sync error:', e);
  }

  return local[index];
};

// Helper to filter tickets for a specific user email
export const getUserSupportTickets = (email: string): SupportTicket[] => {
  if (!email) return [];
  const lower = email.toLowerCase().trim();
  const all = getStoredSupportTickets();
  return all.filter(t => t.senderEmail.toLowerCase() === lower);
};
