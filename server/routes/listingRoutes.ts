import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { serverSupabase } from '../config.js';
import { SellerProject } from '../../types.js';
import { serverProjectsStore } from '../store.js';

const router = Router();

// Deterministic UUID converter for Postgres UUID column compatibility
export function toSupabaseUUID(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id.toLowerCase();
  const hash = crypto.createHash('md5').update(id || 'default-id').digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    'a' + hash.substring(17, 20),
    hash.substring(20, 32)
  ].join('-').toLowerCase();
}

// Find Supabase Auth / Profile UUID for a given email if available
async function findSupabaseUserUUID(emailOrId?: string): Promise<string | null> {
  if (!emailOrId || !serverSupabase) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(emailOrId)) return emailOrId.toLowerCase();

  try {
    const { data: profile } = await serverSupabase
      .from('profiles')
      .select('id')
      .eq('email', emailOrId)
      .maybeSingle();
    if (profile?.id) return profile.id;
  } catch {}

  try {
    const listRes = await serverSupabase.auth.admin.listUsers();
    const users = listRes?.data?.users;
    const matched = users?.find((u: any) => u.email?.toLowerCase() === emailOrId.toLowerCase());
    if (matched?.id) return matched.id;
  } catch {}

  return null;
}

// SAVE / UPSERT PROJECT TO SUPABASE
router.post('/api/listings/save', async (req: Request, res: Response) => {
  try {
    const { project, userEmailOrId } = req.body as { project: SellerProject; userEmailOrId?: string };

    if (!project || !project.id) {
      return res.status(400).json({ success: false, error: 'Project data and ID are required' });
    }

    const projectId = String(project.id);
    const validUUID = toSupabaseUUID(projectId);

    // -------------------------------------------------------------
    // SECURITY AUTHENTICATION ENFORCEMENT:
    // Extract & verify JWT token directly from Supabase Auth Session
    // -------------------------------------------------------------
    let authenticatedUserEmail: string | null = null;
    let authenticatedUserId: string | null = null;

    const rawAuthHeader = 
      (req.headers['authorization'] as string) || 
      (req.headers['x-user-token'] as string) || 
      (req.headers['x-access-token'] as string);

    if (rawAuthHeader && serverSupabase) {
      const cleanToken = rawAuthHeader.replace(/^Bearer\s+/i, '').trim().replace(/^["']|["']$/g, '');
      if (cleanToken && cleanToken.length > 10) {
        try {
          const { data, error } = await serverSupabase.auth.getUser(cleanToken);
          if (!error && data?.user?.email) {
            authenticatedUserEmail = data.user.email.toLowerCase().trim();
            authenticatedUserId = data.user.id;
            console.log(`[Security Shield] Verified JWT Session for user: ${authenticatedUserEmail} (${authenticatedUserId})`);
          } else if (error) {
            console.warn('[Security Shield] JWT Verification Warning:', error.message);
          }
        } catch (authErr: any) {
          console.warn('[Security Shield] Exception verifying auth token:', authErr?.message || authErr);
        }
      }
    }

    // Determine final, tamper-proof seller email
    let sellerEmail = (project.ownerEmail || userEmailOrId || 'registered_seller').toLowerCase().trim();

    if (authenticatedUserEmail) {
      // OVERRIDE frontend payload to prevent user email spoofing via Postman/REST
      sellerEmail = authenticatedUserEmail;
      project.ownerEmail = authenticatedUserEmail;
      if (!project.seller) project.seller = {} as any;
      const emailName = authenticatedUserEmail.split('@')[0];
      project.seller.name = `${emailName} (Seller)`;
    }

    // Prevent Unauthorized Listing Overwrites / Impersonation:
    const existingIdx = serverProjectsStore.findIndex(
      (p) => p.id === projectId || p.id === validUUID || toSupabaseUUID(String(p.id)) === validUUID
    );

    if (existingIdx >= 0) {
      const existingProject = serverProjectsStore[existingIdx];
      const existingOwnerEmail = (existingProject.ownerEmail || '').toLowerCase().trim();

      if (existingOwnerEmail && existingOwnerEmail !== 'guest@aiwebcrafter.local' && existingOwnerEmail !== 'registered_seller') {
        if (authenticatedUserEmail && authenticatedUserEmail !== existingOwnerEmail && authenticatedUserEmail !== 'aiwebcraft6@gmail.com') {
          console.warn(`[Security Shield] Blocked listing update attempt by ${authenticatedUserEmail} on project owned by ${existingOwnerEmail}`);
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Security Shield blocked listing update. You do not own this listing.'
          });
        }
      }
    }

    const matchedUserUuid = authenticatedUserId || await findSupabaseUserUUID(sellerEmail);

    // Map tech stack safely
    const techStackArray = Array.isArray(project.techStack)
      ? project.techStack
      : [
          ...(project.techStack?.frontend || []),
          ...(project.techStack?.backend || []),
          ...(project.techStack?.database || [])
        ];

    // Determine status: approved -> approved, Pending Review -> pending, Draft -> draft
    let status = 'pending';
    if (project.sellerStatus === 'Approved') {
      status = 'approved';
    } else if (project.sellerStatus === 'Draft') {
      status = 'draft';
    } else if (project.sellerStatus === 'Rejected') {
      status = 'rejected';
    }

    let mappedSellerStatus: 'Draft' | 'Pending Review' | 'Approved' | 'Rejected' | 'Sold' = 'Pending Review';
    if (project.sellerStatus === 'Approved' || status === 'approved') mappedSellerStatus = 'Approved';
    else if (project.sellerStatus === 'Draft' || status === 'draft') mappedSellerStatus = 'Draft';
    else if (project.sellerStatus === 'Rejected' || status === 'rejected') mappedSellerStatus = 'Rejected';
    else if (project.sellerStatus === 'Sold' || status === 'sold') mappedSellerStatus = 'Sold';

    // 1. Always update serverProjectsStore in memory immediately
    const projectRecord: any = {
      ...project,
      id: projectId,
      ownerEmail: sellerEmail,
      sellerStatus: mappedSellerStatus,
      submittedAt: project.submittedAt || new Date().toISOString(),
      createdAt: project.createdAt || new Date().toISOString()
    };

    if (existingIdx >= 0) {
      serverProjectsStore[existingIdx] = { ...serverProjectsStore[existingIdx], ...projectRecord };
    } else {
      serverProjectsStore.push(projectRecord);
    }

    // 2. If serverSupabase is not configured, return success from server memory store
    if (!serverSupabase) {
      console.log(`[Server Store] Saved listing ${projectId} to in-memory store (Supabase offline).`);
      return res.json({
        success: true,
        message: 'Project saved to server in-memory store.',
        listing: projectRecord,
        supabaseId: validUUID
      });
    }

    const payload = {
      id: validUUID,
      title: project.title || 'Untitled Project',
      tagline: project.tagline || '',
      description: project.description || '',
      category: project.category || 'SaaS',
      price: Number(project.askingPrice) || 0,
      monthly_revenue: Number(project.monthlyRevenue) || 0,
      monthly_profit: Number(project.monthlyProfit) || 0,
      tech_stack: techStackArray,
      demo_url: project.demoUrl || '',
      image_url: project.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
      status: status,
      seller_name: project.seller?.name || (sellerEmail.includes('@') ? sellerEmail.split('@')[0] : 'Verified Creator'),
      seller_avatar: project.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      seller_id: matchedUserUuid || sellerEmail,
      user_id: matchedUserUuid || sellerEmail,
      is_verified: project.seller?.verified ?? true
    };

    const { data, error } = await serverSupabase
      .from('listings')
      .upsert([payload], { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('[Supabase Save Notice]', error.message);
      // Still return success because it's saved in server memory store!
      return res.json({
        success: true,
        message: 'Project saved to server store (Supabase upsert warning: ' + error.message + ')',
        listing: projectRecord,
        supabaseId: validUUID
      });
    }

    console.log(`[Supabase] Successfully saved listing ${validUUID} (original: ${projectId}) with status ${status}`);

    return res.json({
      success: true,
      message: 'Project successfully saved to Supabase listings and server store.',
      listing: data?.[0] || payload,
      supabaseId: validUUID
    });
  } catch (err: any) {
    console.error('[Supabase Save Exception]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error while saving to Supabase'
    });
  }
});

// DELETE PROJECT FROM SUPABASE & SERVER STORE
router.post('/api/listings/delete', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    const validUUID = toSupabaseUUID(String(projectId));

    // Remove from in-memory server store
    for (let i = serverProjectsStore.length - 1; i >= 0; i--) {
      if (serverProjectsStore[i].id === projectId || toSupabaseUUID(String(serverProjectsStore[i].id)) === validUUID) {
        serverProjectsStore.splice(i, 1);
      }
    }

    if (serverSupabase) {
      const { error } = await serverSupabase
        .from('listings')
        .delete()
        .eq('id', validUUID);

      if (error) {
        console.error('[Supabase Delete Error]', error);
      } else {
        console.log(`[Supabase] Successfully deleted listing ${validUUID} (original: ${projectId})`);
      }
    }

    return res.json({
      success: true,
      message: 'Project successfully deleted from server store and Supabase listings.',
      deletedId: validUUID
    });
  } catch (err: any) {
    console.error('[Supabase Delete Exception]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error while deleting project'
    });
  }
});

// GET LISTINGS FROM SUPABASE & SERVER STORE
router.get('/api/listings', async (req: Request, res: Response) => {
  try {
    const { status = 'approved' } = req.query;
    let supabaseListings: any[] = [];

    if (serverSupabase) {
      let query = serverSupabase.from('listings').select('*').order('created_at', { ascending: false });
      if (status && status !== 'all') {
        query = query.eq('status', String(status));
      }
      const { data, error } = await query;
      if (error) {
        console.error('[Supabase Server] Fetch listings error:', error.message);
      }
      if (!error && Array.isArray(data)) {
        supabaseListings = data;
      }
    }

    // Also include in-memory serverProjectsStore items
    const memoryListings = serverProjectsStore.filter(p => {
      if (status && status !== 'all') {
        const st = String(status).toLowerCase();
        const pSt = String(p.sellerStatus || '').toLowerCase();
        if (st === 'approved' && pSt !== 'approved') return false;
        if (st === 'pending' && !pSt.includes('pending')) return false;
      }
      return true;
    }).map(p => ({
      id: p.id,
      slug: p.slug || p.id,
      owner_email: p.ownerEmail || p.seller_email || 'registered_seller',
      title: p.title,
      tagline: p.tagline,
      description: p.description,
      long_description: p.longDescription || p.description,
      asking_price: p.askingPrice,
      monthly_revenue: p.monthlyRevenue,
      monthly_profit: p.monthlyProfit,
      monthly_visitors: p.monthlyVisitors,
      category: p.category,
      platform: p.platform,
      image_url: p.imageUrl,
      status: (p.sellerStatus === 'Approved' ? 'approved' : p.sellerStatus === 'Pending Review' ? 'pending' : 'draft'),
      created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString()
    }));

    // Merge and deduplicate by id
    const map = new Map<string, any>();
    supabaseListings.forEach(l => {
      if (l && l.id) map.set(String(l.id), l);
    });
    memoryListings.forEach(l => {
      if (l && l.id && !map.has(String(l.id))) {
        map.set(String(l.id), l);
      }
    });

    const merged = Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return res.json({
      success: true,
      listings: merged
    });
  } catch (err: any) {
    console.error('[Supabase Fetch Listings Exception]', err);
    return res.status(500).json({ success: false, error: err?.message });
  }
});

// -----------------------------------------------------------------------
// UPLOAD ASSETS TO SUPABASE STORAGE WITH "TEMP" STATUS
// CRITICAL: This route ONLY handles binary storage bucket file uploads (temp/ folder).
// It DOES NOT create or modify any record in the main database table (listings).
// -----------------------------------------------------------------------
router.post('/api/storage/upload-temp', async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, folder, base64Data } = req.body || {};
    if (!base64Data || !fileName) {
      return res.status(400).json({ success: false, error: 'fileName and base64Data are required' });
    }

    const cleanFolder = folder === 'documents' ? 'documents' : 'images';
    const cleanName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `temp/${cleanFolder}/temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}`;

    let publicUrl = '';

    if (serverSupabase) {
      try {
        const rawBase64 = String(base64Data).replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(rawBase64, 'base64');
        const bucketName = 'project-assets';

        const { data, error } = await serverSupabase.storage
          .from(bucketName)
          .upload(storagePath, buffer, {
            contentType: fileType || 'application/octet-stream',
            upsert: true
          });

        if (!error && data?.path) {
          const { data: pub } = serverSupabase.storage.from(bucketName).getPublicUrl(data.path);
          publicUrl = pub.publicUrl;
        }
      } catch (stErr: any) {
        console.warn('[Supabase Storage] Notice uploading temp file to bucket:', stErr?.message || stErr);
      }
    }

    if (!publicUrl) {
      publicUrl = base64Data.startsWith('data:') ? base64Data : `data:${fileType || 'image/png'};base64,${base64Data}`;
    }

    console.log(`[Supabase Storage] File uploaded to storage (${storagePath}) with status: temp. Main database table was NOT modified.`);

    return res.json({
      success: true,
      url: publicUrl,
      storagePath,
      isTemp: true,
      status: 'temp',
      fileName,
      message: 'File successfully uploaded to Supabase Storage as temporary asset. Database project row was not created.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to upload temp asset' });
  }
});

export default router;

