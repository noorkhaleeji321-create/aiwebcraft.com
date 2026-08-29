import { Router, Request, Response } from 'express';
import { serverSupabase } from '../config.js';

const router = Router();

// Send/Save Direct Chat Message API
router.post('/api/messages/send', async (req: Request, res: Response) => {
  try {
    const { chatId, listingId, projectName, sellerName, sellerEmail, buyerEmail, sender, text, senderName, sellerAvatar } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Message text required' });
    }
    
    if (!serverSupabase) {
      return res.status(503).json({ success: false, error: 'Database service is currently unavailable.' });
    }

    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: `msg-${now}-${Math.random().toString(36).substr(2, 4)}`,
      sender: sender || 'buyer',
      senderName: senderName || (sender === 'seller' ? (sellerName || 'Seller') : 'Buyer'),
      text: text.trim(),
      time: timeStr,
      timestamp: now
    };

    let session: any = null;

    // Try to find existing chat in Supabase
    if (chatId || listingId) {
       let query = serverSupabase.from('direct_chats').select('*');
       if (chatId) {
          query = query.eq('id', chatId);
       } else if (listingId && sellerEmail && buyerEmail) {
          query = query.eq('listing_id', listingId).eq('seller_email', sellerEmail).eq('buyer_email', buyerEmail);
       }
       const { data, error } = await query.maybeSingle();
       
       if (!error && data) {
          session = data.data || data;
       }
    }

    if (session) {
      if (buyerEmail) session.buyerEmail = buyerEmail;
      if (sellerEmail) session.sellerEmail = sellerEmail;
      if (!session.messages) session.messages = [];
      session.messages.push(newMsg);
      session.lastMessage = text.trim();
      session.time = timeStr;
      session.lastActivity = now;
      session.unread = false;
    } else {
      const newChatId = chatId || `chat-${now}-${Math.random().toString(36).substr(2, 4)}`;
      session = {
        id: newChatId,
        listingId,
        projectName: projectName || 'Listed Project',
        sellerName: sellerName || 'Verified Seller',
        sellerEmail: sellerEmail || '',
        sellerAvatar: sellerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        buyerEmail: buyerEmail || '',
        lastMessage: text.trim(),
        time: timeStr,
        lastActivity: now,
        unread: false,
        messages: [newMsg]
      };
    }

    // Save directly to Supabase
    const { error: sbErr } = await serverSupabase.from('direct_chats').upsert({
      id: session.id,
      listing_id: session.listingId || null,
      project_name: session.projectName || '',
      seller_email: session.sellerEmail || '',
      buyer_email: session.buyerEmail || '',
      last_message: session.lastMessage || '',
      updated_at: new Date().toISOString(),
      data: session
    });

    if (sbErr) {
      console.warn('[Supabase Messages Notice]', sbErr);
      return res.status(500).json({ success: false, error: 'Database save failed: ' + sbErr.message });
    }

    console.log(`[Server Messages] Message saved in chat ${session.id} from ${sender} (${session.buyerEmail} ➔ ${session.sellerEmail})`);
    return res.json({ success: true, chat: session });

  } catch (err: any) {
    console.error('Error in /api/messages/send:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error sending message' });
  }
});

// Fetch Direct Messages API
router.get('/api/messages', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email || '').toString().trim().toLowerCase();
    const userRole = (req.query.userRole || '').toString();

    if (!serverSupabase) {
       return res.status(503).json({ success: false, error: 'Database service is currently unavailable.' });
    }

    const { data, error } = await serverSupabase.from('direct_chats').select('*').order('updated_at', { ascending: false });
    
    if (error) {
       console.warn('[Supabase Fetch Messages Notice]', error);
       return res.status(500).json({ success: false, error: 'Failed to retrieve messages from database' });
    }

    let allChats = (data || []).map((row: any) => row.data || row);

    if (userRole === 'SUPER_ADMIN' || !email) {
      return res.json({ success: true, chats: allChats });
    }

    const filtered = allChats.filter((c: any) => {
      const isBuyer = Boolean(c.buyerEmail && c.buyerEmail.toLowerCase() === email);
      const isSeller = Boolean(c.sellerEmail && c.sellerEmail.toLowerCase() === email);
      const isUnassigned = !c.buyerEmail && !c.sellerEmail;
      return isBuyer || isSeller || isUnassigned;
    });

    return res.json({ success: true, chats: filtered });

  } catch (err: any) {
    console.error('Error in /api/messages:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error fetching messages' });
  }
});

export default router;
