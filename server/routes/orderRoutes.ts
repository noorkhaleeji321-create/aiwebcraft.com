import { Router, Request, Response } from 'express';
import { serverOrdersStore, serverProjectsStore } from '../store.js';
import { serverSupabase } from '../config.js';

const router = Router();

// Save/Create Order API
router.post('/api/orders/save', async (req: Request, res: Response) => {
  try {
    const { order } = req.body;
    if (!order || !order.id) {
      return res.status(400).json({ success: false, error: 'Order details required' });
    }

    // 1. Update in server memory store
    const existingIdx = serverOrdersStore.findIndex(o => o.id === order.id);
    if (existingIdx >= 0) {
      serverOrdersStore[existingIdx] = { ...serverOrdersStore[existingIdx], ...order };
    } else {
      serverOrdersStore.unshift(order);
    }

    // 2. Mark project status in serverProjectsStore as 'Sold' or 'Pending Escrow' if matching project exists
    if (order.projectId) {
      const projIdx = serverProjectsStore.findIndex(p => p.id === order.projectId);
      if (projIdx >= 0) {
        serverProjectsStore[projIdx].sellerStatus = 'Sold';
        serverProjectsStore[projIdx].escrowStatus = 'Initiated';
      }
    }

    // 3. Try saving to Supabase if configured
    if (serverSupabase) {
      try {
        await serverSupabase.from('orders').upsert({
          id: order.id,
          project_id: order.projectId,
          project_title: order.projectTitle,
          asking_price: order.askingPrice,
          buyer_email: order.buyerEmail,
          buyer_name: order.buyerName,
          seller_email: order.sellerEmail,
          seller_name: order.sellerName,
          delivery_status: order.deliveryStatus,
          created_at: order.createdAt || new Date().toISOString(),
          data: order
        });
      } catch (sbErr: any) {
        console.warn('[Supabase Orders Notice]', sbErr?.message || sbErr);
      }
    }

    console.log(`[Server Orders] Successfully saved order #${order.id} for seller: ${order.sellerEmail}`);
    return res.json({
      success: true,
      order,
      message: 'Order saved to central server memory store and Supabase.'
    });
  } catch (err: any) {
    console.error('Error in /api/orders/save:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error saving order' });
  }
});

// Fetch Orders API
router.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email || req.query.sellerEmail || req.query.buyerEmail || '').toString().trim().toLowerCase();
    const role = (req.query.role || '').toString();

    let ordersList = [...serverOrdersStore];

    // Try fetching from Supabase if configured
    if (serverSupabase) {
      try {
        let query = serverSupabase.from('orders').select('*').order('created_at', { ascending: false });
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const sbOrders = data.map((row: any) => row.data || row);
          // Merge with memory store, prioritizing memory store updates
          const merged = [...serverOrdersStore];
          sbOrders.forEach((sbOrd: any) => {
            if (!merged.some(m => m.id === sbOrd.id)) {
              merged.push(sbOrd);
            }
          });
          ordersList = merged;
        }
      } catch (sbErr) {
        console.warn('[Supabase Fetch Orders Notice]', sbErr);
      }
    }

    // If role is SUPER_ADMIN or no email supplied, return all orders
    if (role === 'SUPER_ADMIN' || !email) {
      return res.json({ success: true, orders: ordersList });
    }

    // Filter by buyerEmail or sellerEmail
    const filtered = ordersList.filter(o => {
      const bEmail = (o.buyerEmail || '').toLowerCase();
      const sEmail = (o.sellerEmail || '').toLowerCase();
      return bEmail === email || sEmail === email;
    });

    return res.json({ success: true, orders: filtered });
  } catch (err: any) {
    console.error('Error in /api/orders:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error fetching orders' });
  }
});

// Update Order Status API
router.post('/api/orders/update-status', async (req: Request, res: Response) => {
  try {
    const { orderId, deliveryStatus, auditLog, payoutReceiptUrl } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID required' });
    }

    const idx = serverOrdersStore.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      serverOrdersStore[idx].deliveryStatus = deliveryStatus || serverOrdersStore[idx].deliveryStatus;
      serverOrdersStore[idx].updatedAt = new Date().toISOString();
      if (payoutReceiptUrl) {
        serverOrdersStore[idx].payoutReceiptUrl = payoutReceiptUrl;
      }
      if (auditLog) {
        serverOrdersStore[idx].auditLogs = [auditLog, ...(serverOrdersStore[idx].auditLogs || [])];
      }
    }

    return res.json({
      success: true,
      order: idx >= 0 ? serverOrdersStore[idx] : null
    });
  } catch (err: any) {
    console.error('Error in /api/orders/update-status:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
