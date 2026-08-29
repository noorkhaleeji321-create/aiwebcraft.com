import { Router, Request, Response } from 'express';
import { SupportTicketRecord, SupportTicketMessage } from '../store.js';
import { serverSupabase } from '../config.js';

const router = Router();

// 1. GET /api/support/tickets - Fetch user tickets or all tickets for admin
router.get('/api/support/tickets', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email || '').toString().trim().toLowerCase();
    const isAdmin = (req.query.isAdmin === 'true') || ((req as any).user?.role === 'admin');
    
    if (!serverSupabase) {
       return res.status(503).json({ success: false, error: 'Database service is currently unavailable.' });
    }

    let query = serverSupabase.from('support_tickets').select('*').order('updated_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) {
       console.warn('[Supabase Fetch Support Notice]', error);
       return res.status(500).json({ success: false, error: 'Failed to retrieve tickets from database' });
    }

    let tickets: SupportTicketRecord[] = (data || []).map((row: any) => row.data || row);

    if (!isAdmin && email) {
      tickets = tickets.filter(t => t.senderEmail.toLowerCase() === email);
    }

    return res.json({
      success: true,
      count: tickets.length,
      tickets
    });

  } catch (err: any) {
    console.error('Error fetching support tickets:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch tickets' });
  }
});

// 2. POST /api/support/tickets - Create a new support ticket / inquiry
router.post('/api/support/tickets', async (req: Request, res: Response) => {
  try {
    const { senderName, senderEmail, senderRole, subject, category, priority, message } = req.body;

    if (!senderName || !senderEmail || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: senderName, senderEmail, subject, and message are required.'
      });
    }

    if (!serverSupabase) {
       return res.status(503).json({ success: false, error: 'Database service is currently unavailable.' });
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const dateStr = new Date(now).toLocaleString();
    const ticketId = `TICK-${Math.floor(10000 + Math.random() * 90000)}`;

    const initialMessage: SupportTicketMessage = {
      id: `msg-${now}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'user',
      senderName: senderName.trim(),
      text: message.trim(),
      timestamp: now,
      date: dateStr
    };

    const newTicket: SupportTicketRecord = {
      id: ticketId,
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim().toLowerCase(),
      senderRole: senderRole || 'BUYER',
      subject: subject.trim(),
      category: category || 'general',
      priority: priority || 'medium',
      status: 'OPEN',
      createdAt: nowIso,
      updatedAt: nowIso,
      messages: [initialMessage]
    };

    const { error: sbErr } = await serverSupabase.from('support_tickets').upsert({
      id: newTicket.id,
      sender_name: newTicket.senderName,
      sender_email: newTicket.senderEmail,
      sender_role: newTicket.senderRole,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      status: newTicket.status,
      created_at: newTicket.createdAt,
      updated_at: newTicket.updatedAt,
      data: newTicket
    });

    if (sbErr) {
      console.warn('[Supabase Support Tickets Notice]', sbErr);
      return res.status(500).json({ success: false, error: 'Database save failed: ' + sbErr.message });
    }

    console.log(`[Support Ticket] Created new ticket #${ticketId} from ${senderName} (${senderEmail})`);
    return res.json({
      success: true,
      ticket: newTicket,
      message: 'Support ticket successfully submitted.'
    });

  } catch (err: any) {
    console.error('Error creating support ticket:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to create ticket' });
  }
});

// 3. POST /api/support/reply - Add a message to an existing ticket (User or Admin)
router.post('/api/support/reply', async (req: Request, res: Response) => {
  try {
    const { ticketId, sender, senderName, text } = req.body;

    if (!ticketId || !text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'ticketId and message text are required.' });
    }
    
    if (!serverSupabase) {
       return res.status(503).json({ success: false, error: 'Database service is currently unavailable.' });
    }

    // Fetch existing ticket from Supabase
    const { data, error } = await serverSupabase.from('support_tickets').select('*').eq('id', ticketId).maybeSingle();
    
    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Support ticket not found in database.' });
    }

    const ticket: SupportTicketRecord = data.data || data;

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const dateStr = new Date(now).toLocaleString();

    const newMsg: SupportTicketMessage = {
      id: `msg-${now}-${Math.random().toString(36).substring(2, 6)}`,
      sender: sender === 'admin' ? 'admin' : 'user',
      senderName: senderName || (sender === 'admin' ? 'Super Admin' : ticket.senderName),
      text: text.trim(),
      timestamp: now,
      date: dateStr
    };

    if (!ticket.messages) ticket.messages = [];
    ticket.messages.push(newMsg);
    ticket.updatedAt = nowIso;

    // Automatically transition OPEN to IN_PROGRESS if admin replies
    if (sender === 'admin' && ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }

    const { error: saveErr } = await serverSupabase.from('support_tickets').upsert({
      id: ticket.id,
      status: ticket.status,
      updated_at: ticket.updatedAt,
      data: ticket
    });

    if (saveErr) {
      console.warn('[Supabase Support Reply Notice]', saveErr);
      return res.status(500).json({ success: false, error: 'Database save failed: ' + saveErr.message });
    }

    console.log(`[Support Ticket] Reply added to #${ticketId} by ${newMsg.senderName}`);
    return res.json({ success: true, ticket });

  } catch (err: any) {
    console.error('Error replying to support ticket:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to reply to ticket' });
  }
});

// 4. POST /api/support/status - Change ticket status or add admin internal notes
router.post('/api/support/status', async (req: Request, res: Response) => {
  try {
    const { ticketId, status, adminNotes } = req.body;

    if (!ticketId || !status) {
      return res.status(400).json({ success: false, error: 'ticketId and status are required.' });
    }
    
    if (!serverSupabase) {
       return res.status(503).json({ success: false, error: 'Database service is currently unavailable.' });
    }

    const { data, error } = await serverSupabase.from('support_tickets').select('*').eq('id', ticketId).maybeSingle();
    
    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Support ticket not found.' });
    }

    const ticket: SupportTicketRecord = data.data || data;

    ticket.status = status;
    if (adminNotes !== undefined) {
      ticket.adminNotes = adminNotes;
    }
    ticket.updatedAt = new Date().toISOString();

    const { error: saveErr } = await serverSupabase.from('support_tickets').upsert({
      id: ticket.id,
      status: ticket.status,
      updated_at: ticket.updatedAt,
      data: ticket
    });

    if (saveErr) {
      console.warn('[Supabase Support Status Notice]', saveErr);
      return res.status(500).json({ success: false, error: 'Database save failed' });
    }

    console.log(`[Support Ticket] Status updated for #${ticketId} -> ${status}`);
    return res.json({ success: true, ticket });

  } catch (err: any) {
    console.error('Error updating support status:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to update ticket status' });
  }
});

export default router;
