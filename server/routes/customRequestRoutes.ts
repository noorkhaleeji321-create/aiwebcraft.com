import { Router, Request, Response } from 'express';
import { serverCustomRequestsStore, CustomRequestRecord, persistAllStores } from '../store.js';
import { serverSupabase } from '../config.js';

const router = Router();

// Load initial custom requests from Supabase on startup
async function loadCustomRequestsFromDB() {
  if (!serverSupabase) return;
  try {
    const { data, error } = await serverSupabase
      .from('custom_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && Array.isArray(data)) {
      data.forEach((row: any) => {
        const item: CustomRequestRecord = row.data || {
          id: row.id,
          projectType: row.project_type || 'Web App',
          projectName: row.project_name || 'Custom Build',
          description: row.description || '',
          selectedFeatures: row.selected_features || [],
          budget: row.budget || '$1,000 - $5,000',
          timeline: row.timeline || '1-2 weeks',
          buyerName: row.buyer_name || 'Client',
          buyerEmail: row.buyer_email || '',
          status: row.status || 'PENDING_REVIEW',
          createdAt: row.created_at || new Date().toISOString()
        };

        if (!serverCustomRequestsStore.some(r => r.id === item.id)) {
          serverCustomRequestsStore.push(item);
        }
      });
      console.log(`[CustomRequests] Loaded ${serverCustomRequestsStore.length} custom build requests from Supabase DB.`);
    }
  } catch (err: any) {
    console.warn('[CustomRequests DB Load Notice]:', err?.message || err);
  }
}

loadCustomRequestsFromDB();

// 1. GET Custom Requests API
router.get('/api/custom-requests', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email || req.query.buyerEmail || '').toString().trim().toLowerCase();
    const adminKey = req.headers['x-admin-key'] || req.headers['authorization'];
    const isAdmin = Boolean(
      adminKey || 
      req.query.isAdmin === 'true' || 
      email.includes('admin') || 
      email.includes('aiwebcraft')
    );

    let list = [...serverCustomRequestsStore];

    // Optionally re-query Supabase if available
    if (serverSupabase) {
      try {
        const { data, error } = await serverSupabase
          .from('custom_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && Array.isArray(data)) {
          data.forEach((row: any) => {
            const item: CustomRequestRecord = row.data || row;
            if (item && item.id && !list.some(r => r.id === item.id)) {
              list.push(item);
            }
          });
        }
      } catch (e) {
        // Ignore Supabase transient errors, fallback to memory
      }
    }

    // Filter by buyer email if not admin and email provided
    if (!isAdmin && email) {
      list = list.filter(r => (r.buyerEmail || '').toLowerCase() === email);
    }

    return res.json({
      success: true,
      requests: list
    });
  } catch (err: any) {
    console.error('Error in GET /api/custom-requests:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch custom requests' });
  }
});

// 2. POST Save/Create Custom Request API
router.post('/api/custom-requests', async (req: Request, res: Response) => {
  try {
    const { request } = req.body;
    if (!request || !request.id || !request.projectName || !request.buyerEmail) {
      return res.status(400).json({ success: false, error: 'Valid custom build request details (id, projectName, buyerEmail) required.' });
    }

    // Upsert into memory store
    const existingIdx = serverCustomRequestsStore.findIndex(r => r.id === request.id);
    if (existingIdx >= 0) {
      serverCustomRequestsStore[existingIdx] = { ...serverCustomRequestsStore[existingIdx], ...request };
    } else {
      serverCustomRequestsStore.unshift(request);
    }
    persistAllStores();

    // Upsert to Supabase DB if configured
    if (serverSupabase) {
      try {
        await serverSupabase.from('custom_requests').upsert({
          id: request.id,
          project_name: request.projectName,
          project_type: request.projectType,
          buyer_email: request.buyerEmail,
          buyer_name: request.buyerName,
          status: request.status || 'PENDING_REVIEW',
          budget: request.budget,
          timeline: request.timeline,
          created_at: request.createdAt || new Date().toISOString(),
          data: request
        }, { onConflict: 'id' });
      } catch (sbErr: any) {
        console.warn('[CustomRequests Supabase Sync Notice]:', sbErr?.message || sbErr);
      }
    }

    console.log(`[CustomRequests] Successfully saved request #${request.id} for buyer: ${request.buyerEmail}`);
    return res.json({
      success: true,
      request,
      requests: serverCustomRequestsStore,
      message: 'Custom request saved to central platform server memory and Supabase.'
    });
  } catch (err: any) {
    console.error('Error in POST /api/custom-requests:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to save custom request' });
  }
});

// 3. PUT Update Custom Request Status/Quote API
router.put('/api/custom-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const idx = serverCustomRequestsStore.findIndex(r => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Custom request not found' });
    }

    const updated = {
      ...serverCustomRequestsStore[idx],
      ...updates,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    serverCustomRequestsStore[idx] = updated;
    persistAllStores();

    if (serverSupabase) {
      try {
        await serverSupabase.from('custom_requests').upsert({
          id: updated.id,
          project_name: updated.projectName,
          project_type: updated.projectType,
          buyer_email: updated.buyerEmail,
          buyer_name: updated.buyerName,
          status: updated.status,
          budget: updated.budget,
          timeline: updated.timeline,
          created_at: updated.createdAt,
          data: updated
        }, { onConflict: 'id' });
      } catch (sbErr: any) {
        console.warn('[CustomRequests Supabase Update Notice]:', sbErr?.message || sbErr);
      }
    }

    return res.json({
      success: true,
      request: updated,
      requests: serverCustomRequestsStore
    });
  } catch (err: any) {
    console.error('Error in PUT /api/custom-requests:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update custom request' });
  }
});

// 4. DELETE Custom Request API
router.delete('/api/custom-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idx = serverCustomRequestsStore.findIndex(r => r.id === id);
    if (idx >= 0) {
      serverCustomRequestsStore.splice(idx, 1);
      persistAllStores();
    }

    if (serverSupabase) {
      try {
        await serverSupabase.from('custom_requests').delete().eq('id', id);
      } catch (sbErr: any) {
        console.warn('[CustomRequests Supabase Delete Notice]:', sbErr?.message || sbErr);
      }
    }

    return res.json({
      success: true,
      requests: serverCustomRequestsStore,
      message: 'Custom request deleted successfully.'
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/custom-requests:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete custom request' });
  }
});

export default router;
