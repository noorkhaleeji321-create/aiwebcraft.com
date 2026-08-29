import { dispatchCustomEvent } from '../utils/eventBus';
import { supabase } from './supabaseClient';

export type CustomRequestStatus = 
  | 'PENDING_REVIEW' 
  | 'QUOTE_SENT' 
  | 'ACCEPTED' 
  | 'IN_DEVELOPMENT' 
  | 'DELIVERED' 
  | 'REJECTED';

export interface OnDemandRequest {
  id: string;
  projectType: string;
  projectName: string;
  description: string;
  selectedFeatures: string[];
  budget: string;
  timeline: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  referenceUrls?: string;
  status: CustomRequestStatus;
  createdAt: string;
  adminNotes?: string;
  quotedPrice?: number;
  assignedEngineer?: string;
  lastUpdated?: string;
}

const STORAGE_KEY = 'aiwebcrafter_custom_build_requests';
const DEMO_REQUEST_IDS = ['REQ-2026-0892', 'REQ-2026-0914', 'REQ-2026-0925'];

let isFetchingInitial = false;

// Async function to fetch custom requests from server & Supabase
export async function fetchCustomRequestsFromServer(userEmail?: string): Promise<OnDemandRequest[]> {
  try {
    const adminKey = localStorage.getItem('aiwebcrafter_admin_key') || localStorage.getItem('aiwebcrafter_admin_passcode') || '';
    const headers: Record<string, string> = {};
    if (adminKey) {
      headers['x-admin-key'] = adminKey;
      headers['authorization'] = `Bearer ${adminKey}`;
    }

    const queryParam = userEmail ? `?buyerEmail=${encodeURIComponent(userEmail)}` : '?isAdmin=true';
    const response = await fetch(`/api/custom-requests${queryParam}`, { headers });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.success && Array.isArray(data.requests)) {
        const serverList: OnDemandRequest[] = data.requests;
        // Merge with local storage
        const localList = getLocalCustomRequests();
        const mergedMap = new Map<string, OnDemandRequest>();
        
        serverList.forEach(r => mergedMap.set(r.id, r));
        localList.forEach(r => {
          if (!mergedMap.has(r.id)) mergedMap.set(r.id, r);
        });

        const merged = Array.from(mergedMap.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        dispatchCustomEvent('aiwebcrafter_custom_requests_updated', merged);
        return merged;
      }
    }
  } catch (e) {
    console.warn('[onDemandService] Server fetch notice:', e);
  }

  // Fallback to Supabase client directly if express route not reachable
  try {
    const { data, error } = await supabase.from('custom_requests').select('*');
    if (!error && data && Array.isArray(data)) {
      const sbList: OnDemandRequest[] = data.map((row: any) => row.data || row);
      const localList = getLocalCustomRequests();
      const mergedMap = new Map<string, OnDemandRequest>();

      sbList.forEach(r => mergedMap.set(r.id, r));
      localList.forEach(r => {
        if (!mergedMap.has(r.id)) mergedMap.set(r.id, r);
      });

      const merged = Array.from(mergedMap.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      dispatchCustomEvent('aiwebcrafter_custom_requests_updated', merged);
      return merged;
    }
  } catch (e) {
    // ignore
  }

  return getLocalCustomRequests();
}

// Automatic continuous background polling for real-time custom request sync across browsers
if (typeof window !== 'undefined') {
  setInterval(() => {
    const userJson = localStorage.getItem('aiwebcrafter_local_user');
    let email = '';
    if (userJson) {
      try {
        const parsed = JSON.parse(userJson);
        email = parsed.email || '';
      } catch {}
    }
    const isAdminUser = localStorage.getItem('aiwebcrafter_admin_key') || localStorage.getItem('aiwebcrafter_admin_passcode') || email.includes('admin') || email.includes('aiwebcraft');
    fetchCustomRequestsFromServer(isAdminUser ? undefined : email).catch(() => {});
  }, 3000);
}

function getLocalCustomRequests(): OnDemandRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter(item => item && item.id && !DEMO_REQUEST_IDS.includes(item.id));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
    return [];
  } catch (err) {
    console.error('Failed to load custom requests from storage:', err);
    return [];
  }
}

export function getCustomRequests(): OnDemandRequest[] {
  const local = getLocalCustomRequests();
  
  // Trigger background sync if not already fetching
  if (!isFetchingInitial) {
    isFetchingInitial = true;
    fetchCustomRequestsFromServer().finally(() => {
      isFetchingInitial = false;
    });
  }

  return local;
}

export function saveCustomRequest(newRequest: OnDemandRequest): OnDemandRequest[] {
  try {
    const current = getLocalCustomRequests();
    const updated = [newRequest, ...current.filter(r => r.id !== newRequest.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    dispatchCustomEvent('aiwebcrafter_custom_request_created', newRequest);
    dispatchCustomEvent('aiwebcrafter_custom_requests_updated', updated);

    // Sync to Express Backend Server & Supabase asynchronously
    fetch('/api/custom-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request: newRequest })
    }).then(res => res.json()).then(data => {
      if (data && data.success && Array.isArray(data.requests)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.requests));
        dispatchCustomEvent('aiwebcrafter_custom_requests_updated', data.requests);
      }
    }).catch(err => {
      console.warn('Failed to sync custom request to server:', err);
    });

    // Also sync directly to Supabase client if available
    supabase.from('custom_requests').upsert({
      id: newRequest.id,
      project_name: newRequest.projectName,
      project_type: newRequest.projectType,
      buyer_email: newRequest.buyerEmail,
      buyer_name: newRequest.buyerName,
      status: newRequest.status || 'PENDING_REVIEW',
      budget: newRequest.budget,
      timeline: newRequest.timeline,
      created_at: newRequest.createdAt || new Date().toISOString(),
      data: newRequest
    }, { onConflict: 'id' }).then(() => {}).catch(() => {});

    return updated;
  } catch (err) {
    console.error('Failed to save custom request:', err);
    return [];
  }
}

export function updateCustomRequest(
  id: string, 
  updates: Partial<OnDemandRequest>
): OnDemandRequest[] {
  try {
    const current = getLocalCustomRequests();
    let updatedItem: OnDemandRequest | null = null;
    const updated = current.map(req => {
      if (req.id === id) {
        updatedItem = {
          ...req,
          ...updates,
          lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        return updatedItem;
      }
      return req;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    dispatchCustomEvent('aiwebcrafter_custom_requests_updated', updated);

    // Sync update with Express server
    fetch(`/api/custom-requests/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(res => res.json()).then(data => {
      if (data && data.success && Array.isArray(data.requests)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.requests));
        dispatchCustomEvent('aiwebcrafter_custom_requests_updated', data.requests);
      }
    }).catch(err => {
      console.warn('Failed to sync update to server:', err);
    });

    if (updatedItem) {
      const itemToSave = updatedItem as OnDemandRequest;
      supabase.from('custom_requests').upsert({
        id: itemToSave.id,
        project_name: itemToSave.projectName,
        project_type: itemToSave.projectType,
        buyer_email: itemToSave.buyerEmail,
        buyer_name: itemToSave.buyerName,
        status: itemToSave.status,
        budget: itemToSave.budget,
        timeline: itemToSave.timeline,
        created_at: itemToSave.createdAt,
        data: itemToSave
      }, { onConflict: 'id' }).then(() => {}).catch(() => {});
    }

    return updated;
  } catch (err) {
    console.error('Failed to update custom request:', err);
    return [];
  }
}

export function deleteCustomRequest(id: string): OnDemandRequest[] {
  try {
    const current = getLocalCustomRequests();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    dispatchCustomEvent('aiwebcrafter_custom_requests_updated', updated);

    // Sync delete to server
    fetch(`/api/custom-requests/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).then(res => res.json()).then(data => {
      if (data && data.success && Array.isArray(data.requests)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.requests));
        dispatchCustomEvent('aiwebcrafter_custom_requests_updated', data.requests);
      }
    }).catch(err => {
      console.warn('Failed to sync delete to server:', err);
    });

    supabase.from('custom_requests').delete().eq('id', id).then(() => {}).catch(() => {});

    return updated;
  } catch (err) {
    console.error('Failed to delete custom request:', err);
    return [];
  }
}
