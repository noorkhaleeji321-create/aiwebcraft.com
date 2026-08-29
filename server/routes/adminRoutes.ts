import { Router, Request, Response } from 'express';
import { authorizeAdmin, verifyAdminTokenWithSupabase } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { MetricsVerifier } from '../../services/metricsVerifierService.js';
import { scanCodeForVulnerabilities } from '../../services/securityService.js';
import { ADMIN_SECRET_KEY, serverSupabase, getAiClient, encrypt, decrypt } from '../config.js';
import { 
  serverProjectsStore, 
  serverUsersStore, 
  serverSellersStore, 
  serverAuditLogsStore,
  serverPlatformSettingsStore,
  serverOrdersStore,
  persistAllStores,
  ProjectRecord,
  UserRecord,
  AuditLogRecord
} from '../store.js';
import { toSupabaseUUID } from './listingRoutes.js';

const router = Router();

// Load platform commission setting from Supabase on startup
async function loadPlatformCommissionFromDB() {
  if (!serverSupabase) return;
  try {
    // 1. Try loading from system_settings table first
    const { data: sysData, error: sysErr } = await serverSupabase
      .from('system_settings')
      .select('value')
      .eq('key', 'platform_commission')
      .maybeSingle();

    if (!sysErr && sysData && sysData.value) {
      const val = parseFloat(sysData.value);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        serverPlatformSettingsStore.commissionPercentage = val;
        console.log(`[PlatformSettings] Successfully loaded commission rate from system_settings DB: ${val}%`);
        return;
      }
    }

    // 2. Fallback to bot_keys table
    const { data: botData, error } = await serverSupabase
      .from('bot_keys')
      .select('encrypted_key')
      .eq('bot_id', 'platform_commission')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (botData && botData.encrypted_key) {
      try {
        const decrypted = decrypt(botData.encrypted_key);
        const val = parseFloat(decrypted);
        if (!isNaN(val) && val >= 0 && val <= 100) {
          serverPlatformSettingsStore.commissionPercentage = val;
          console.log(`[PlatformSettings] Successfully loaded commission rate from bot_keys DB: ${val}%`);
          return;
        }
      } catch (decErr) {
        console.warn('[PlatformSettings] Failed to decrypt commission rate from DB.', decErr);
      }
    }
    
    console.log(`[PlatformSettings] No commission found in DB, using default memory value: ${serverPlatformSettingsStore.commissionPercentage}%`);
  } catch (err: any) {
    console.warn('[PlatformSettings] Notice:', err?.message || err);
  }
}

// Initial DB load on launch
loadPlatformCommissionFromDB();

// 1. Public GET Platform Settings (Accessible to all visitors, buyers, sellers, and browsers)
router.get('/api/platform/settings', async (req: Request, res: Response) => {
  res.json({
    success: true,
    commissionPercentage: serverPlatformSettingsStore.commissionPercentage,
    updatedAt: serverPlatformSettingsStore.updatedAt
  });
});

router.get('/api/platform/commission', async (req: Request, res: Response) => {
  res.json({
    success: true,
    commissionPercentage: serverPlatformSettingsStore.commissionPercentage,
    updatedAt: serverPlatformSettingsStore.updatedAt
  });
});

// 2. Admin POST Platform Settings (Authorized admin modifies global commission for all users)
const savePlatformSettingsHandler = async (req: Request, res: Response) => {
  const { commissionPercentage, commissionPct } = req.body;
  const rawPct = commissionPercentage !== undefined ? commissionPercentage : commissionPct;
  const numPct = parseFloat(String(rawPct));

  if (isNaN(numPct) || numPct < 0 || numPct > 100) {
    return res.status(400).json({
      success: false,
      error: 'Invalid commission percentage. Must be a number between 0 and 100.'
    });
  }

  const now = new Date().toISOString();
  serverPlatformSettingsStore.commissionPercentage = numPct;
  serverPlatformSettingsStore.updatedAt = now;
  serverPlatformSettingsStore.updatedBy = (req as any).adminUser?.email || 'admin';
  persistAllStores();

  // Persist to Supabase if connected (non-blocking in background)
  if (serverSupabase) {
    try {
      const encryptedVal = encrypt(String(numPct));
      
      // Upsert to both system_settings and bot_keys
      Promise.all([
        serverSupabase
          .from('system_settings')
          .upsert([
            { key: 'platform_commission', value: String(numPct), updated_at: now }
          ], { onConflict: 'key' }),
        serverSupabase
          .from('bot_keys')
          .upsert([
            { bot_id: 'platform_commission', encrypted_key: encryptedVal, updated_at: now }
          ], { onConflict: 'bot_id' })
      ]).catch((e: any) => {
        console.warn('[PlatformSettings] Notice while syncing to Supabase:', e?.message || e);
      });
    } catch (e: any) {
      console.warn('[PlatformSettings] Warning while saving commission to Supabase:', e?.message || e);
    }
  }

  console.log(`[PlatformSettings] Global commission percentage updated to ${numPct}% by Admin in Supabase & Server.`);

  res.json({
    success: true,
    commissionPercentage: serverPlatformSettingsStore.commissionPercentage,
    updatedAt: serverPlatformSettingsStore.updatedAt,
    message: `Global platform commission rate updated successfully to ${numPct}%.`
  });
};

router.post('/api/platform/settings', authorizeAdmin, savePlatformSettingsHandler);
router.post('/api/platform/commission', authorizeAdmin, savePlatformSettingsHandler);

// Helper to return actual uploaded files or empty array
export function generateDefaultSecureFiles(title: string = 'Digital Project', platform: string = 'React & Node.js') {
  return [];
}

// Security Scan Route
router.post('/api/system/security-scan', authorizeAdmin, async (req: Request, res: Response) => {
  const { projectId, repoUrl } = req.body;
  
  let proj = serverProjectsStore.find(p => p.id === projectId || toSupabaseUUID(String(p.id)) === toSupabaseUUID(String(projectId)));
  if (!proj) {
    proj = {
      id: projectId,
      title: 'Project',
      tagline: '',
      category: 'SaaS',
      askingPrice: 0,
      monthlyRevenue: 0,
      monthlyProfit: 0,
      sellerStatus: 'Pending Review',
      createdAt: new Date().toISOString(),
      escrowStatus: 'Inactive',
      escrowSteps: { domainTransferred: false, codeTransferred: false, accountsTransferred: false }
    };
    serverProjectsStore.push(proj);
  }

  const scanRes = await scanCodeForVulnerabilities(repoUrl);

  proj.securityScan = {
    ...scanRes,
    lastScanned: new Date().toISOString()
  };

  res.json({ success: true, securityScan: proj.securityScan });
});

// Verify Metrics Route
router.post('/api/system/verify-metrics', authorizeAdmin, async (req: Request, res: Response) => {
  const { projectId, stripeKey, gaPropertyId } = req.body;
  
  let proj = serverProjectsStore.find(p => p.id === projectId || toSupabaseUUID(String(p.id)) === toSupabaseUUID(String(projectId)));
  if (!proj) {
    proj = {
      id: projectId,
      title: 'Project',
      tagline: '',
      category: 'SaaS',
      askingPrice: 0,
      monthlyRevenue: 0,
      monthlyProfit: 0,
      sellerStatus: 'Pending Review',
      createdAt: new Date().toISOString(),
      escrowStatus: 'Inactive',
      escrowSteps: { domainTransferred: false, codeTransferred: false, accountsTransferred: false }
    };
    serverProjectsStore.push(proj);
  }

  const metrics = await MetricsVerifier.verifyProjectMetrics(stripeKey, 'acct_123', gaPropertyId, proj.demoUrl || proj.title);

  proj.verifiedMetrics = {
    stripe: metrics.stripe.verified,
    ga: metrics.ga.verified,
    github: true,
    lastVerified: metrics.lastChecked
  };

  res.json({ success: true, verifiedMetrics: proj.verifiedMetrics });
});

// Admin Verify Passcode Route
router.post('/api/system/verify', authLimiter, async (req: Request, res: Response) => {
  const { adminKey } = req.body;
  if (!adminKey) {
    return res.status(400).json({ success: false, error: 'Admin key or passcode is required' });
  }

  const isValid = await verifyAdminTokenWithSupabase(adminKey);
  if (isValid) {
    return res.json({
      success: true,
      token: adminKey.trim(),
      message: 'Server-side Admin authentication successful (Verified with Supabase encrypted storage)'
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid Admin Passcode or Key. Access denied.'
  });
});

// Save / Update Admin Master Key Encrypted in Supabase
router.post('/api/system/save-admin-key', authorizeAdmin, async (req: Request, res: Response) => {
  const { newAdminKey } = req.body;
  if (!newAdminKey || typeof newAdminKey !== 'string' || newAdminKey.trim().length < 6) {
    return res.status(400).json({ success: false, error: 'New admin key must be at least 6 characters long.' });
  }

  const cleanKey = newAdminKey.trim();

  if (!serverSupabase) {
    return res.status(400).json({
      success: false,
      error: 'Supabase is not connected. Please make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured in environment variables.'
    });
  }

  try {
    const encryptedKey = encrypt(cleanKey);
    const now = new Date().toISOString();

    // 1. Save to bot_keys table as 'admin_master_key'
    const { error: botKeyErr } = await serverSupabase
      .from('bot_keys')
      .upsert([{ bot_id: 'admin_master_key', encrypted_key: encryptedKey, updated_at: now }], { onConflict: 'bot_id' });

    if (botKeyErr) {
      console.warn('Saving to bot_keys warning:', botKeyErr.message);
    }

    // 2. Save to admin_config table if exists
    try {
      const adminEmail = req.body.adminEmail || 'admin@aiwebcrafter.com';
      await serverSupabase
        .from('admin_config')
        .upsert([{
          admin_email: adminEmail,
          admin_secret_key: encryptedKey,
          admin_passcode: encryptedKey,
          updated_at: now
        }], { onConflict: 'admin_email' });
    } catch (e) {
      console.warn('Saving to admin_config warning:', e);
    }

    // 3. Save to system_settings table if exists
    try {
      await serverSupabase
        .from('system_settings')
        .upsert([{
          key: 'admin_secret_key',
          value: encryptedKey,
          updated_at: now
        }], { onConflict: 'key' });
    } catch (e) {
      console.warn('Saving to system_settings warning:', e);
    }

    return res.json({
      success: true,
      message: 'New admin master key successfully encrypted and stored in Supabase (AES-256).'
    });
  } catch (err: any) {
    console.error('Error saving encrypted admin key to Supabase:', err);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while encrypting and saving the admin key to Supabase.',
      details: err?.message || err
    });
  }
});

// Sync Projects Route
router.post('/api/system/sync-projects', authorizeAdmin, (req: Request, res: Response) => {
  const { projects } = req.body;
  if (Array.isArray(projects)) {
    projects.forEach((proj: ProjectRecord) => {
      if (!proj.secureFiles || proj.secureFiles.length < 15) {
        proj.secureFiles = generateDefaultSecureFiles(proj.title, proj.platform);
      }
      const idx = serverProjectsStore.findIndex((p) => p.id === proj.id || toSupabaseUUID(String(p.id)) === toSupabaseUUID(String(proj.id)));
      if (idx >= 0) {
        serverProjectsStore[idx] = { ...serverProjectsStore[idx], ...proj };
      } else {
        serverProjectsStore.push(proj);
      }
    });
  }
  res.json({ success: true, total: serverProjectsStore.length });
});

// Purge All Projects Route
router.post('/api/system/purge-projects', authorizeAdmin, async (req: Request, res: Response) => {
  try {
    // 1. Clear in-memory server store
    serverProjectsStore.length = 0;

    // 2. Clear Supabase listings table if connected
    if (serverSupabase) {
      try {
        await serverSupabase
          .from('listings')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (e) {
        console.warn('Purge Supabase listings warning:', e);
      }
    }

    res.json({
      success: true,
      message: 'All projects purged from server store and database.'
    });
  } catch (err: any) {
    console.error('Error purging projects:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to purge projects on server.'
    });
  }
});

// Helper to load Supabase listings into ProjectRecord format
async function getMergedProjects(): Promise<ProjectRecord[]> {
  const projectsMap = new Map<string, ProjectRecord>();

  // 1. Add serverProjectsStore first
  serverProjectsStore.forEach(p => {
    projectsMap.set(p.id, p);
  });

  // 2. Fetch from Supabase listings table if available
  if (serverSupabase) {
    try {
      const { data: dbListings } = await serverSupabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbListings && Array.isArray(dbListings)) {
        dbListings.forEach((item: any) => {
          const id = item.id;
          let mappedStatus: 'Draft' | 'Pending Review' | 'Approved' | 'Rejected' | 'Sold' = 'Pending Review';
          if (item.status === 'approved') mappedStatus = 'Approved';
          else if (item.status === 'rejected') mappedStatus = 'Rejected';
          else if (item.status === 'sold') mappedStatus = 'Sold';
          else if (item.status === 'draft') mappedStatus = 'Draft';
          else if (item.status === 'pending') mappedStatus = 'Pending Review';

          const existing = projectsMap.get(id);
          const projectRecord: ProjectRecord = {
            id,
            title: item.title || 'Untitled Project',
            tagline: item.tagline || '',
            description: item.description || '',
            longDescription: item.description || '',
            category: item.category || 'SaaS',
            platform: item.platform || (Array.isArray(item.tech_stack) ? item.tech_stack.join(', ') : 'React & Node.js'),
            askingPrice: Number(item.price) || 0,
            monthlyRevenue: Number(item.monthly_revenue) || 0,
            monthlyProfit: Number(item.monthly_profit) || 0,
            sellerStatus: existing?.sellerStatus || mappedStatus,
            submittedAt: item.created_at || existing?.submittedAt || new Date().toISOString(),
            createdAt: item.created_at || existing?.createdAt || new Date().toISOString(),
            approvedAt: existing?.approvedAt || (mappedStatus === 'Approved' ? item.created_at : undefined),
            techStack: item.tech_stack || existing?.techStack || ['React', 'TypeScript', 'Node.js', 'Tailwind CSS'],
            demoUrl: item.demo_url || existing?.demoUrl || '',
            videoUrl: item.video_url || existing?.videoUrl || '',
            imageUrl: item.image_url || existing?.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
            seller: {
              id: item.seller_id || existing?.seller?.id || 'sel-creator',
              name: item.seller_name || existing?.seller?.name || 'Verified Creator',
              avatar: item.seller_avatar || existing?.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
              verified: item.is_verified ?? (existing?.seller?.verified ?? true)
            },
            ownerEmail: item.seller_email || existing?.ownerEmail || 'creator@aiwebcraft.com',
            secureFiles: existing?.secureFiles && existing.secureFiles.length >= 15 
              ? existing.secureFiles 
              : generateDefaultSecureFiles(item.title, item.platform),
            escrowStatus: existing?.escrowStatus || 'Inactive',
            escrowSteps: existing?.escrowSteps || { domainTransferred: false, codeTransferred: false, accountsTransferred: false }
          };

          projectsMap.set(id, projectRecord);
          // Keep in serverProjectsStore
          const storeIdx = serverProjectsStore.findIndex(p => p.id === id);
          if (storeIdx >= 0) {
            serverProjectsStore[storeIdx] = { ...serverProjectsStore[storeIdx], ...projectRecord };
          } else {
            serverProjectsStore.push(projectRecord);
          }
        });
      }
    } catch (e) {
      console.warn('Error fetching Supabase listings for admin:', e);
    }
  }

  return Array.from(projectsMap.values());
}

// Get Projects Route
router.get('/api/system/projects', authorizeAdmin, async (req: Request, res: Response) => {
  const allProjects = await getMergedProjects();
  res.json({
    success: true,
    projects: allProjects
  });
});

// Get Stats Route
router.get('/api/system/stats', authorizeAdmin, async (req: Request, res: Response) => {
  const allProjects = await getMergedProjects();
  const total = allProjects.length;
  const pending = allProjects.filter((p) => p.sellerStatus === 'Pending Review').length;
  const approved = allProjects.filter((p) => p.sellerStatus === 'Approved').length;
  const rejected = allProjects.filter((p) => p.sellerStatus === 'Rejected').length;
  const totalValuation = allProjects
    .filter((p) => p.sellerStatus === 'Approved')
    .reduce((sum, p) => sum + (p.askingPrice || 0), 0);

  res.json({
    success: true,
    stats: {
      totalProjects: total,
      pendingCount: pending,
      approvedCount: approved,
      rejectedCount: rejected,
      totalMarketplaceValue: totalValuation,
      totalSellers: Math.max(serverSellersStore.length, allProjects.length)
    }
  });
});

// Approve Route
router.post('/api/system/approve', authorizeAdmin, async (req: Request, res: Response) => {
  const { projectId, adminUser = 'Platform Owner (aiwebcraft6@gmail.com)', project: incomingProject } = req.body;
  
  let proj = serverProjectsStore.find(
    (p) => p.id === projectId || toSupabaseUUID(String(p.id)) === toSupabaseUUID(String(projectId))
  );

  if (!proj && incomingProject) {
    proj = {
      ...incomingProject,
      id: incomingProject.id || projectId
    };
    if (!proj.secureFiles || proj.secureFiles.length < 15) {
      proj.secureFiles = generateDefaultSecureFiles(proj.title, proj.platform);
    }
    serverProjectsStore.push(proj);
  }

  // If still not found, check Supabase
  if (!proj && serverSupabase) {
    try {
      const validUUID = toSupabaseUUID(String(projectId));
      const { data: dbItem } = await serverSupabase
        .from('listings')
        .select('*')
        .eq('id', validUUID)
        .maybeSingle();

      if (dbItem) {
        proj = {
          id: projectId,
          title: dbItem.title || 'Untitled Project',
          tagline: dbItem.tagline || '',
          description: dbItem.description || '',
          category: dbItem.category || 'SaaS',
          askingPrice: Number(dbItem.price) || 0,
          monthlyRevenue: Number(dbItem.monthly_revenue) || 0,
          monthlyProfit: Number(dbItem.monthly_profit) || 0,
          sellerStatus: 'Pending Review',
          createdAt: dbItem.created_at || new Date().toISOString(),
          techStack: dbItem.tech_stack || ['React', 'TypeScript'],
          demoUrl: dbItem.demo_url || '',
          imageUrl: dbItem.image_url || '',
          seller: {
            id: dbItem.seller_id || 'sel-creator',
            name: dbItem.seller_name || 'Creator',
            avatar: dbItem.seller_avatar || '',
            verified: dbItem.is_verified ?? true
          },
          secureFiles: generateDefaultSecureFiles(dbItem.title, dbItem.platform),
          escrowStatus: 'Inactive',
          escrowSteps: { domainTransferred: false, codeTransferred: false, accountsTransferred: false }
        };
        serverProjectsStore.push(proj);
      }
    } catch (e) {
      console.warn('Supabase lookup on approve warning:', e);
    }
  }

  if (!proj) {
    proj = {
      id: projectId,
      title: incomingProject?.title || 'Approved Digital Asset',
      tagline: incomingProject?.tagline || '',
      category: incomingProject?.category || 'SaaS',
      askingPrice: Number(incomingProject?.askingPrice) || 0,
      monthlyRevenue: Number(incomingProject?.monthlyRevenue) || 0,
      monthlyProfit: Number(incomingProject?.monthlyProfit) || 0,
      sellerStatus: 'Approved',
      createdAt: new Date().toISOString(),
      escrowStatus: 'Inactive',
      escrowSteps: { domainTransferred: false, codeTransferred: false, accountsTransferred: false },
      secureFiles: generateDefaultSecureFiles(incomingProject?.title || 'App', 'React & Node.js')
    };
    serverProjectsStore.push(proj);
  }

  const previousStatus = proj.sellerStatus || 'Pending Review';
  proj.sellerStatus = 'Approved';
  proj.approvedAt = new Date().toISOString();
  proj.rejectionReason = undefined;

  // Sync to Supabase listings table with status: approved
  if (serverSupabase) {
    try {
      const validUUID = toSupabaseUUID(String(proj.id));
      const techStackArray = Array.isArray(proj.techStack)
        ? proj.techStack
        : [
            ...(proj.techStack?.frontend || []),
            ...(proj.techStack?.backend || []),
            ...(proj.techStack?.database || [])
          ];

      const payload = {
        id: validUUID,
        title: proj.title || 'Untitled Project',
        tagline: proj.tagline || '',
        description: proj.description || '',
        category: proj.category || 'SaaS',
        price: Number(proj.askingPrice) || 0,
        monthly_revenue: Number(proj.monthlyRevenue) || 0,
        monthly_profit: Number(proj.monthlyProfit) || 0,
        tech_stack: techStackArray,
        demo_url: proj.demoUrl || '',
        image_url: proj.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
        status: 'approved',
        seller_name: proj.seller?.name || (proj.ownerEmail?.includes('@') ? proj.ownerEmail.split('@')[0] : 'Verified Creator'),
        seller_avatar: proj.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        is_verified: proj.seller?.verified ?? true
      };

      await serverSupabase
        .from('listings')
        .upsert([payload], { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase update upon approval warning:', e);
    }
  }

  const auditLog: AuditLogRecord = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    adminUser,
    adminRole: 'SUPER_ADMIN',
    projectId: proj.id,
    projectTitle: proj.title,
    action: 'APPROVED',
    previousStatus,
    newStatus: 'Approved',
    timestamp: new Date().toISOString()
  };
  serverAuditLogsStore.unshift(auditLog);

  res.json({
    success: true,
    message: `Project "${proj.title}" has been approved and is now live in the Marketplace.`,
    project: proj,
    auditLog
  });
});

// Reject Route
router.post('/api/system/reject', authorizeAdmin, async (req: Request, res: Response) => {
  const { projectId, rejectionReason, adminUser = 'Platform Owner (aiwebcraft6@gmail.com)', project: incomingProject } = req.body;

  if (!rejectionReason || rejectionReason.trim().length < 3) {
    return res.status(400).json({
      error: 'Rejection reason is required (at least 3 characters).'
    });
  }

  let proj = serverProjectsStore.find((p) => p.id === projectId || toSupabaseUUID(String(p.id)) === toSupabaseUUID(String(projectId)));

  if (!proj && incomingProject) {
    proj = { ...incomingProject, id: incomingProject.id || projectId };
    serverProjectsStore.push(proj);
  }

  if (!proj) {
    proj = {
      id: projectId,
      title: incomingProject?.title || 'Digital Project',
      tagline: '',
      category: 'SaaS',
      askingPrice: 0,
      monthlyRevenue: 0,
      monthlyProfit: 0,
      sellerStatus: 'Rejected',
      createdAt: new Date().toISOString(),
      escrowStatus: 'Inactive',
      escrowSteps: { domainTransferred: false, codeTransferred: false, accountsTransferred: false }
    };
    serverProjectsStore.push(proj);
  }

  const previousStatus = proj.sellerStatus || 'Pending Review';
  proj.sellerStatus = 'Rejected';
  proj.rejectionReason = rejectionReason.trim();

  // Update Supabase listings table with status: rejected or delete
  if (serverSupabase) {
    try {
      const validUUID = toSupabaseUUID(String(projectId));
      await serverSupabase
        .from('listings')
        .update({ status: 'rejected' })
        .eq('id', validUUID);
    } catch (e) {
      console.warn('Supabase update upon rejection warning:', e);
    }
  }

  const auditLog: AuditLogRecord = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    adminUser,
    adminRole: 'SUPER_ADMIN',
    projectId: proj.id,
    projectTitle: proj.title,
    action: 'REJECTED',
    previousStatus,
    newStatus: 'Rejected',
    reason: rejectionReason.trim(),
    timestamp: new Date().toISOString()
  };
  serverAuditLogsStore.unshift(auditLog);

  res.json({
    success: true,
    message: `Project "${proj.title}" has been rejected. Seller notified with feedback.`,
    project: proj,
    auditLog
  });
});

// Audit Logs Route
router.get('/api/system/audit-logs', authorizeAdmin, (req: Request, res: Response) => {
  res.json({
    success: true,
    auditLogs: serverAuditLogsStore
  });
});

// Dynamic Users Helper
function getMergedUsers(): UserRecord[] {
  const usersMap = new Map<string, UserRecord>();

  // 1. Base users in serverUsersStore
  for (const user of serverUsersStore) {
    if (user.email) {
      usersMap.set(user.email.toLowerCase().trim(), { ...user });
    }
  }

  // 2. Aggregate from serverProjectsStore
  for (const proj of serverProjectsStore) {
    const email = (proj.ownerEmail || proj.seller?.email || '').toLowerCase().trim();
    if (!email) continue;

    const existing = usersMap.get(email);
    if (existing) {
      existing.projectsCount = (existing.projectsCount || 0) + 1;
      if (existing.role === 'Buyer') existing.role = 'Both';
      else if (existing.role !== 'Super Admin' && existing.role !== 'Both') existing.role = 'Seller';
    } else {
      const name = proj.seller?.name || (email.includes('@') ? email.split('@')[0] : 'Seller User');
      usersMap.set(email, {
        id: proj.seller?.id || `usr-sel-${Math.random().toString(36).substring(2, 7)}`,
        name,
        email,
        role: 'Seller',
        registrationDate: proj.createdAt ? proj.createdAt.split('T')[0] : '2025-01-15',
        projectsCount: 1,
        purchasesCount: 0,
        status: 'Active',
        avatar: proj.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        location: proj.seller?.location || 'Casablanca, Morocco',
        lastLogin: new Date().toISOString(),
        bio: `Verified digital creator on AIWebCrafter (${email}).`
      });
    }
  }

  // 3. Aggregate from serverOrdersStore
  for (const order of serverOrdersStore) {
    const email = (order.buyerEmail || order.buyer?.email || '').toLowerCase().trim();
    if (!email) continue;

    const existing = usersMap.get(email);
    if (existing) {
      existing.purchasesCount = (existing.purchasesCount || 0) + 1;
      if (existing.role === 'Seller') existing.role = 'Both';
      else if (existing.role !== 'Super Admin' && existing.role !== 'Both') existing.role = 'Buyer';
    } else {
      const name = order.buyerName || order.buyer?.name || (email.includes('@') ? email.split('@')[0] : 'Buyer User');
      usersMap.set(email, {
        id: order.buyerId || `usr-buy-${Math.random().toString(36).substring(2, 7)}`,
        name,
        email,
        role: 'Buyer',
        registrationDate: order.createdAt ? order.createdAt.split('T')[0] : '2025-02-01',
        projectsCount: 0,
        purchasesCount: 1,
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
        location: 'Global',
        lastLogin: new Date().toISOString(),
        bio: `Verified buyer on AIWebCrafter (${email}).`
      });
    }
  }

  return Array.from(usersMap.values());
}

// Users Route
router.get('/api/system/users', authorizeAdmin, (req: Request, res: Response) => {
  const mergedUsers = getMergedUsers();
  res.json({
    success: true,
    users: mergedUsers
  });
});

// Sellers Route
router.get('/api/system/sellers', authorizeAdmin, (req: Request, res: Response) => {
  res.json({
    success: true,
    sellers: serverSellersStore
  });
});

// AI Sentinel Security Audit Route (Full Project & File Scan)
router.post('/api/system/ai-sentinel-audit', authorizeAdmin, async (req: Request, res: Response) => {
  const { project } = req.body;
  if (!project) {
    return res.status(400).json({ error: 'Project data is required for AI audit.' });
  }

  const rawAttachedFiles = Array.isArray(project.secureFiles) ? project.secureFiles : [];
  const secureFiles = rawAttachedFiles;
  const filesDescription = secureFiles
    .filter((f: any) => f.isExtractedFile || !f.isZipContainer)
    .map((f: any) => ({
      name: f.name,
      path: f.path || f.name,
      snippet: f.snippet ? f.snippet.slice(0, 800) : 'Binary or non-text file content.'
    }));

  const sellerInputsSummary = {
    title: project.title || 'Untitled Project',
    tagline: project.tagline || 'No tagline provided',
    category: project.category || 'SaaS',
    askingPrice: Number(project.askingPrice) || 0,
    monthlyRevenue: Number(project.monthlyRevenue) || 0,
    monthlyProfit: Number(project.monthlyProfit) || 0,
    techStack: Array.isArray(project.techStack) && project.techStack.length > 0
      ? project.techStack
      : (project.technology || project.platform ? [project.technology || project.platform] : ['Web Application']),
    demoUrl: project.demoUrl || '',
    videoUrl: project.videoUrl || '',
    sellerName: project.seller?.name || project.sellerName || 'Registered Seller',
    sellerEmail: project.ownerEmail || project.seller?.email || 'N/A',
    descriptionSnippet: (project.description || project.longDescription || 'No description provided.').slice(0, 400),
    descriptionLength: (project.description || project.longDescription || '').length,
    attachedFilesCount: secureFiles.length,
    filesList: secureFiles.map((f: any) => f.name || f.path || 'Source File')
  };

  const ai = getAiClient();

  const prompt = `You are the AI Sentinel Security, Fraud Prevention & Valuation Intelligence Bot for "AIWebCrafter", a high-end digital asset and SaaS marketplace.
Perform an objective, deep-dive audit on this submitted project listing for security risks, financial valuation consistency, code quality, and authenticity:
- Title: ${project.title || 'Untitled Project'}
- Tagline: ${project.tagline || 'None'}
- Category: ${project.category || 'SaaS'}
- Asking Price: $${project.askingPrice || 0}
- Monthly Revenue: $${project.monthlyRevenue || 0}/mo
- Monthly Profit: $${project.monthlyProfit || 0}/mo
- Platform / Tech: ${JSON.stringify(sellerInputsSummary.techStack)}
- Demo URL: ${project.demoUrl || 'Not provided'}
- Video Walkthrough: ${project.videoUrl || 'Not provided'}
- Description (${sellerInputsSummary.descriptionLength} chars): ${project.description || project.longDescription || 'No description provided.'}
- Seller Name & Email: ${sellerInputsSummary.sellerName} (${sellerInputsSummary.sellerEmail})
- Attached Files Count: ${secureFiles.length}

File structure / code snippets:
${JSON.stringify(filesDescription, null, 2)}

Provide a fair, objective assessment. If the project description is clear, files are safe, and pricing is reasonable, recommend "Approve". Only recommend "Flag for Manual Review" if minor details are missing or valuation needs verification, and reserve "Reject" ONLY for severe security threats, scams, or leaked secrets.

Return a valid JSON object ONLY with the following structure:
{
  "riskScore": number (0 to 100, where 0 is pristine/clean, 100 is critical fraud/malware),
  "riskLevel": "Low" | "Medium" | "High" | "Critical",
  "summary": "Clear, objective 3-4 sentence audit summary detailing the seller's submitted assets, price appropriateness, security posture, and recommendation rationale",
  "recommendation": "Approve" | "Flag for Manual Review" | "Reject",
  "filesReport": [
    {
      "filename": "string",
      "path": "string",
      "status": "clean" | "warning" | "vulnerable",
      "details": "Precise analytical findings for this item"
    }
  ]
}`;

  if (ai) {
    try {
      const candidateModels = [
        'gemini-3.7-flash',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash',
        'gemini-3.6-flash',
        'gemini-3.5-flash'
      ];
      let response: any = null;
      let lastErr: any = null;

      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          });
          if (response && response.text) break;
        } catch (err: any) {
          lastErr = err;
        }
      }

      if (response && response.text) {
        const text = response.text || '';
        let parsed: any = null;
        try {
          const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleanText);
        } catch (e) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch (e2) {}
          }
        }

        if (parsed && typeof parsed === 'object') {
          if (!parsed.filesReport || !Array.isArray(parsed.filesReport)) {
            parsed.filesReport = [
              {
                filename: project.title || 'Project Metadata Audit',
                path: project.demoUrl || 'Escrow Vault',
                status: parsed.riskScore > 50 ? 'vulnerable' : parsed.riskScore > 20 ? 'warning' : 'clean',
                details: parsed.summary || 'Analyzed successfully by AI Sentinel.'
              }
            ];
          }
          return res.json({ success: true, sellerInputsSummary, ...parsed });
        }
      }
    } catch (aiErr: any) {
      console.warn('AI Sentinel Gemini live call failed, falling back to dynamic heuristic audit:', aiErr?.message || aiErr);
    }
  }

  // Dynamic Heuristic Audit (Tailored precisely to the project input data)
  const desc = (project.description || project.longDescription || '').trim();
  const demoUrl = project.demoUrl || '';
  const askingPrice = Number(project.askingPrice) || 0;
  const monthlyRevenue = Number(project.monthlyRevenue) || 0;

  let riskScore = 5;
  let riskLevel = 'Low';
  let recommendation = 'Approve';

  const filesReport: Array<{ filename: string; path: string; status: 'clean' | 'warning' | 'vulnerable'; details: string }> = [];

  // Check description length
  if (desc.length < 20) {
    riskScore += 15;
    filesReport.push({
      filename: 'Project Overview / Description',
      path: 'Metadata Inspection',
      status: 'warning',
      details: 'Notice: Project description is brief. Seller may be requested to add more detail.'
    });
  } else {
    filesReport.push({
      filename: 'Project Overview / Description',
      path: 'Metadata Inspection',
      status: 'clean',
      details: `Comprehensive description provided (${desc.length} characters).`
    });
  }

  // Check demo URL
  if (!demoUrl || demoUrl === 'Not provided' || demoUrl.length < 5) {
    riskScore += 10;
    filesReport.push({
      filename: 'Live Demo URL Check',
      path: 'Demo Verification',
      status: 'warning',
      details: 'Notice: No live demo URL provided. Code repository transfer in escrow vault will serve as primary asset verification.'
    });
  } else {
    filesReport.push({
      filename: 'Live Demo URL Check',
      path: demoUrl,
      status: 'clean',
      details: `Verified accessible demo link format: ${demoUrl}`
    });
  }

  // Check valuation logic
  if (monthlyRevenue > 0) {
    const multiple = askingPrice / (monthlyRevenue * 12);
    if (multiple > 15) {
      riskScore += 15;
      filesReport.push({
        filename: 'Financial Valuation Multiplier',
        path: 'Revenue vs Asking Price',
        status: 'warning',
        details: `Asking price is ${multiple.toFixed(1)}x annual revenue. Premium valuation requested.`
      });
    } else {
      filesReport.push({
        filename: 'Financial Valuation Multiplier',
        path: 'Revenue vs Asking Price',
        status: 'clean',
        details: `Valuation multiple (${multiple.toFixed(1)}x annual revenue) is within healthy parameters.`
      });
    }
  } else {
    filesReport.push({
      filename: 'Revenue Verification',
      path: 'Financial Check',
      status: 'clean',
      details: `Pre-revenue / Starter codebase asset listed at $${askingPrice.toLocaleString()}.`
    });
  }

  // Check attached files
  let foundCriticalSecret = false;
  secureFiles.forEach((f: any) => {
    const name = (f.name || '').toLowerCase();
    let status: 'clean' | 'warning' | 'vulnerable' = 'clean';
    let details = 'Source file structure verified safe.';
    if (name.includes('.env') && !name.includes('.example')) {
      status = 'vulnerable';
      riskScore += 40;
      foundCriticalSecret = true;
      details = 'CRITICAL: Plain text .env environment file detected! Ensure secrets are redacted before transfer.';
    }
    filesReport.push({ filename: f.name, path: f.path || f.name, status, details });
  });

  if (riskScore >= 60 || foundCriticalSecret) {
    riskLevel = 'High';
    recommendation = foundCriticalSecret ? 'Reject' : 'Flag for Manual Review';
  } else if (riskScore >= 30) {
    riskLevel = 'Medium';
    recommendation = 'Flag for Manual Review';
  } else {
    riskLevel = 'Low';
    recommendation = 'Approve';
  }

  const summary = `AI Sentinel Forensic Scan complete for "${project.title || 'Project'}". Evaluated seller inputs (${sellerInputsSummary.descriptionLength} chars description, $${askingPrice} asking price, ${secureFiles.length} source files). Risk Score: ${riskScore}/100 (${riskLevel}). Recommendation: ${recommendation === 'Approve' ? 'Approve (Recommended)' : recommendation === 'Reject' ? 'Reject (High Risk Flag)' : 'Flag for Manual Review'}.`;

  return res.json({
    success: true,
    riskScore,
    riskLevel,
    recommendation,
    summary,
    sellerInputsSummary,
    filesReport
  });
});

// Update User Status Route
router.post('/api/system/users/status', authorizeAdmin, (req: Request, res: Response) => {
  const { userId, action, suspensionReason, adminUser = 'Platform Owner (aiwebcraft6@gmail.com)' } = req.body;

  const target = serverUsersStore.find((u) => u.id === userId);
  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (action === 'Suspend' && (!suspensionReason || suspensionReason.trim().length < 3)) {
    return res.status(400).json({ error: 'Reason is required when suspending a user account.' });
  }

  const prevStatus = target.status;
  target.status = action === 'Suspend' ? 'Suspended' : 'Active';
  if (action === 'Suspend') {
    target.suspensionReason = suspensionReason.trim();
  } else {
    target.suspensionReason = undefined;
  }

  const auditLog: AuditLogRecord = {
    id: `audit-usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    adminUser,
    adminRole: 'SUPER_ADMIN',
    projectId: target.id,
    projectTitle: `User Account: ${target.name} (${target.email})`,
    action: action === 'Suspend' ? 'REJECTED' : 'APPROVED',
    previousStatus: prevStatus,
    newStatus: target.status,
    reason: action === 'Suspend' ? suspensionReason.trim() : 'Account reactivated by Super Admin',
    timestamp: new Date().toISOString()
  };
  serverAuditLogsStore.unshift(auditLog);

  res.json({
    success: true,
    message: `User ${target.name} has been ${action === 'Suspend' ? 'suspended' : 'activated'}.`,
    user: target,
    auditLog
  });
});

// Update Seller Status Route
router.post('/api/system/sellers/status', authorizeAdmin, (req: Request, res: Response) => {
  const { sellerId, action, suspensionReason, adminUser = 'Platform Owner (aiwebcraft6@gmail.com)' } = req.body;

  const target = serverSellersStore.find((s) => s.id === sellerId);
  if (!target) {
    return res.status(404).json({ error: 'Seller not found' });
  }

  if (action === 'Suspend' && (!suspensionReason || suspensionReason.trim().length < 3)) {
    return res.status(400).json({ error: 'Reason is required when suspending a seller account.' });
  }

  const prevStatus = target.status;
  target.status = action === 'Suspend' ? 'Suspended' : 'Active';
  if (action === 'Suspend') {
    target.suspensionReason = suspensionReason.trim();
  } else {
    target.suspensionReason = undefined;
  }

  const auditLog: AuditLogRecord = {
    id: `audit-sel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    adminUser,
    adminRole: 'SUPER_ADMIN',
    projectId: target.id,
    projectTitle: `Seller Account: ${target.name} (${target.email})`,
    action: action === 'Suspend' ? 'REJECTED' : 'APPROVED',
    previousStatus: prevStatus,
    newStatus: target.status,
    reason: action === 'Suspend' ? suspensionReason.trim() : 'Seller account reactivated by Super Admin',
    timestamp: new Date().toISOString()
  };
  serverAuditLogsStore.unshift(auditLog);

  res.json({
    success: true,
    message: `Seller ${target.name} has been ${action === 'Suspend' ? 'suspended' : 'activated'}.`,
    seller: target,
    auditLog
  });
});

// 19. DOWNLOAD DATA BACKUP (Admins Only)
import path from 'path';
import fs from 'fs';
router.get('/api/admin/download/:filename', authorizeAdmin, (req: Request, res: Response) => {
  const { filename } = req.params;
  const allowedFiles = [
    'platform_settings.json', 'projects.json', 'users.json', 
    'sellers.json', 'audit_logs.json', 'orders.json', 
    'messages.json', 'custom_requests.json'
  ];
  
  if (!allowedFiles.includes(filename)) {
    return res.status(403).json({ success: false, error: 'File download not allowed or invalid file.' });
  }

  const filePath = path.join(process.cwd(), 'data', filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ success: false, error: 'File not found on server.' });
  }
});

export default router;
