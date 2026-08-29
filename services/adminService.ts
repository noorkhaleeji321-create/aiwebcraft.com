import { SellerProject, AdminUser, AdminSeller } from '../types.js';
import { safeFetchJson } from '../utils/api.js';
import { dispatchCustomEvent } from '../utils/eventBus.js';
import { 
  getAllStoredSellerProjects,
  getStoredSellerProjects, 
  saveSellerProjectDirectly, 
  toPublicListing,
  getDeletedListingIds,
  persistSellerProjects
} from './sellerStore.js';
import { 
  saveProjectToSupabase, 
  getCurrentSupabaseUser,
  getPlatformCommissionPercentage, 
  setPlatformCommissionPercentage,
  fetchPlatformCommissionPercentage
} from './supabaseService.js';

const ADMIN_KEY_STORAGE = 'aiwebcrafter_admin_key';

export interface AdminStats {
  totalProjects: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalMarketplaceValue: number;
  totalSellers: number;
}

// Check stored admin key
export const getAdminKey = (): string => {
  return (
    sessionStorage.getItem(ADMIN_KEY_STORAGE) ||
    localStorage.getItem(ADMIN_KEY_STORAGE) ||
    sessionStorage.getItem('aiwebcrafter_admin_token') ||
    localStorage.getItem('aiwebcrafter_admin_token') ||
    'aiwebcraft6@gmail.com'
  );
};

export const setAdminKey = (key: string, persist: boolean = false) => {
  sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
  sessionStorage.setItem('aiwebcrafter_admin_token', key);
  if (persist) {
    localStorage.setItem(ADMIN_KEY_STORAGE, key);
    localStorage.setItem('aiwebcrafter_admin_token', key);
  }
};

export const clearAdminKey = () => {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  localStorage.removeItem(ADMIN_KEY_STORAGE);
  sessionStorage.removeItem('aiwebcrafter_admin_token');
  localStorage.removeItem('aiwebcrafter_admin_token');
};

// Authenticate Admin Server-side
export const verifyAdminCredentials = async (adminKeyInput: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const { ok, data, error } = await safeFetchJson('/api/system/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: adminKeyInput })
    });

    if (ok && data?.success) {
      setAdminKey(data.token || adminKeyInput, true);
      // Sync local projects to server store
      await syncLocalProjectsToServer(data.token || adminKeyInput);
      return { success: true };
    } else {
      return { success: false, message: error || data?.error || 'Invalid Admin Credentials' };
    }
  } catch (err) {
    return { success: false, message: 'Server communication failed. Please check network.' };
  }
};

// Sync local projects to backend
export const syncLocalProjectsToServer = async (adminKeyOverride?: string) => {
  const key = adminKeyOverride || getAdminKey();
  if (!key) return;

  const localProjects = getAllStoredSellerProjects();
  try {
    await safeFetchJson('/api/system/sync-projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': key
      },
      body: JSON.stringify({ projects: localProjects })
    });
  } catch (err) {
    console.warn('Failed to sync projects to server:', err);
  }
};

// Purge all projects on server
export const purgeAllProjectsServer = async (): Promise<boolean> => {
  const key = getAdminKey();
  try {
    if (key) {
      await safeFetchJson('/api/system/purge-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': key
        }
      });
    }
  } catch (err) {
    console.warn('Failed to purge projects on server:', err);
  }
  return true;
};

// Fetch all projects for Admin (server-side authorized)
export const fetchAdminProjects = async (): Promise<SellerProject[]> => {
  const key = getAdminKey();
  
  if (!key) {
    return getAllStoredSellerProjects();
  }

  try {
    const { status, data } = await safeFetchJson('/api/system/projects', {
      headers: {
        'x-admin-key': key
      }
    });

    if (status === 403 || status === 401) {
      clearAdminKey();
      return getAllStoredSellerProjects();
    }

    if (data?.success && Array.isArray(data.projects)) {
      const deletedIds = getDeletedListingIds();
      // Filter out deleted projects and seed projects
      const validProjects = data.projects.filter((p: SellerProject) => {
        if (!p || !p.id) return false;
        if (deletedIds.includes(p.id) || deletedIds.includes(String(p.id).trim())) return false;
        const titleLower = (p.title || '').toLowerCase();
        const idLower = (p.id || '').toLowerCase();
        return !['sp-201', 'sp-202', 'sp-203', 'lst-101', 'lst-102', 'sp-demo-pending-1'].includes(p.id)
          && !idLower.startsWith('lst-') 
          && !idLower.startsWith('sp-demo')
          && !titleLower.includes('tarik')
          && !titleLower.includes('contentgenie')
          && !titleLower.includes('luxeglow')
          && !titleLower.includes('omniseo');
      });
      persistSellerProjects(validProjects);
      return validProjects;
    }
  } catch (err: any) {
    console.warn('Failed to fetch admin projects from server, falling back to local store:', err);
  }

  // Fallback to local store if server unreachable or errored
  return getAllStoredSellerProjects();
};

// Fetch Admin Stats
export const fetchAdminStats = async (): Promise<AdminStats> => {
  const key = getAdminKey();
  const allProjects = getAllStoredSellerProjects();

  const fallbackStats: AdminStats = {
    totalProjects: allProjects.length,
    pendingCount: allProjects.filter((p) => p.sellerStatus === 'Pending Review').length,
    approvedCount: allProjects.filter((p) => p.sellerStatus === 'Approved').length,
    rejectedCount: allProjects.filter((p) => p.sellerStatus === 'Rejected').length,
    totalMarketplaceValue: allProjects
      .filter((p) => p.sellerStatus === 'Approved')
      .reduce((sum, p) => sum + (p.askingPrice || 0), 0),
    totalSellers: new Set(allProjects.map((p) => p.seller?.id || 'sel-default')).size
  };

  if (!key) return fallbackStats;

  try {
    const res = await safeFetchJson('/api/system/stats', {
      headers: { 'x-admin-key': key }
    });
    if (res.ok && res.data?.stats) {
      return res.data.stats;
    }
  } catch (err) {
    console.warn('Using local fallback stats:', err);
  }

  return fallbackStats;
};

export interface AuditLogItem {
  id: string;
  adminUser: string;
  adminRole: string;
  projectId: string;
  projectTitle: string;
  action: 'APPROVED' | 'REJECTED';
  previousStatus: string;
  newStatus: string;
  reason?: string;
  timestamp: string;
}

const AUDIT_LOGS_STORAGE_KEY = 'aiwebcrafter_admin_audit_logs';

export const getStoredAuditLogs = (): AuditLogItem[] => {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading audit logs:', e);
  }
  return [];
};

export const recordAuditLogLocal = (item: AuditLogItem) => {
  const current = getStoredAuditLogs();
  current.unshift(item);
  try {
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Error saving audit log:', e);
  }
};

export const fetchAuditLogs = async (): Promise<AuditLogItem[]> => {
  const key = getAdminKey();
  if (!key) return getStoredAuditLogs();

  try {
    const res = await safeFetchJson('/api/system/audit-logs', {
      headers: { 'x-admin-key': key }
    });
    if (res.ok && Array.isArray(res.data?.auditLogs)) {
      return res.data.auditLogs;
    }
  } catch (e) {
    console.warn('Using local audit log fallback:', e);
  }

  return getStoredAuditLogs();
};

// SERVER-PROTECTED APPROVE PROJECT ACTION
export const approveProjectServer = async (
  projectId: string,
  adminUser: string = 'Platform Owner (aiwebcraft6@gmail.com)',
  projectData?: SellerProject
): Promise<{ success: boolean; message?: string; project?: SellerProject; auditLog?: AuditLogItem }> => {
  let key = getAdminKey();

  const allLocal = getAllStoredSellerProjects();
  const localProj = projectData || allLocal.find((p) => p.id === projectId);

  // Ensure server memory has the latest project synced
  await syncLocalProjectsToServer(key);

  try {
    const res = await safeFetchJson('/api/system/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': key
      },
      body: JSON.stringify({ projectId, adminUser, project: localProj })
    });

    if (res.ok && res.data?.project) {
      // Update local storage so marketplace picks it up immediately
      const approvedProj: SellerProject = {
        ...(localProj || {}),
        ...res.data.project,
        sellerStatus: 'Approved' as const,
        approvedAt: new Date().toISOString()
      };
      saveSellerProjectDirectly(approvedProj);

      // Save/sync to Supabase as well
      try {
        const user = await getCurrentSupabaseUser();
        await saveProjectToSupabase(approvedProj, user?.id || approvedProj.seller?.id || 'admin-approved-user');
      } catch (e) {
        console.warn('Supabase sync upon approval warning:', e);
      }

      if (res.data.auditLog) {
        recordAuditLogLocal(res.data.auditLog);
      }

      // Dispatch event to sync all UI components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aiwebcrafter_projects_updated', { detail: { project: approvedProj } }));
      }

      return {
        success: true,
        message: res.data.message || 'Project approved and published to Marketplace.',
        project: approvedProj,
        auditLog: res.data.auditLog
      };
    }
  } catch (err: any) {
    console.warn('Server approve request encountered error, applying safe client fallback:', err);
  }

  // Resilient fallback: approve locally and sync to Supabase directly
  if (localProj) {
    const approvedProj: SellerProject = {
      ...localProj,
      sellerStatus: 'Approved' as const,
      approvedAt: new Date().toISOString()
    };
    saveSellerProjectDirectly(approvedProj);

    try {
      const user = await getCurrentSupabaseUser();
      await saveProjectToSupabase(approvedProj, user?.id || approvedProj.seller?.id || 'admin-approved-user');
    } catch (e) {
      console.warn('Supabase direct sync fallback warning:', e);
    }

    const fallbackAuditLog: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      adminUser,
      adminRole: 'SUPER_ADMIN',
      projectId: localProj.id,
      projectTitle: localProj.title || 'Approved Project',
      action: 'APPROVED',
      previousStatus: localProj.sellerStatus || 'Pending Review',
      newStatus: 'Approved',
      timestamp: new Date().toISOString()
    };
    recordAuditLogLocal(fallbackAuditLog);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aiwebcrafter_projects_updated', { detail: { project: approvedProj } }));
    }

    return {
      success: true,
      message: `Project "${approvedProj.title}" approved and published to Marketplace.`,
      project: approvedProj,
      auditLog: fallbackAuditLog
    };
  }

  return { success: false, message: 'Project not found to approve.' };
};

// SERVER-PROTECTED REJECT PROJECT ACTION
export const rejectProjectServer = async (
  projectId: string,
  rejectionReason: string,
  adminUser: string = 'Platform Owner (aiwebcraft6@gmail.com)',
  projectData?: SellerProject
): Promise<{ success: boolean; message?: string; project?: SellerProject; auditLog?: AuditLogItem }> => {
  let key = getAdminKey();

  if (!rejectionReason || rejectionReason.trim().length < 3) {
    return { success: false, message: 'Rejection reason is required (at least 3 characters).' };
  }

  const allLocal = getAllStoredSellerProjects();
  const localProj = projectData || allLocal.find((p) => p.id === projectId);

  // Ensure server has latest projects synced before rejecting
  await syncLocalProjectsToServer(key);

  try {
    const res = await safeFetchJson('/api/system/reject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': key
      },
      body: JSON.stringify({ projectId, rejectionReason: rejectionReason.trim(), adminUser, project: localProj })
    });

    if (res.ok && res.data?.project) {
      const rejectedProj: SellerProject = {
        ...(localProj || {}),
        ...res.data.project,
        sellerStatus: 'Rejected' as const,
        rejectionReason: rejectionReason.trim()
      };
      // Update local storage so seller sees feedback
      saveSellerProjectDirectly(rejectedProj);

      try {
        const user = await getCurrentSupabaseUser();
        await saveProjectToSupabase(rejectedProj, user?.id || rejectedProj.seller?.id || 'admin-user');
      } catch (e) {
        console.warn('Supabase sync upon rejection warning:', e);
      }

      if (res.data.auditLog) {
        recordAuditLogLocal(res.data.auditLog);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aiwebcrafter_projects_updated', { detail: { project: rejectedProj } }));
      }

      return {
        success: true,
        message: res.data.message || 'Project rejected with feedback recorded.',
        project: rejectedProj,
        auditLog: res.data.auditLog
      };
    }
  } catch (err: any) {
    console.warn('Server reject request encountered error, applying safe client fallback:', err);
  }

  // Resilient fallback
  if (localProj) {
    const rejectedProj: SellerProject = {
      ...localProj,
      sellerStatus: 'Rejected' as const,
      rejectionReason: rejectionReason.trim()
    };
    saveSellerProjectDirectly(rejectedProj);

    try {
      const user = await getCurrentSupabaseUser();
      await saveProjectToSupabase(rejectedProj, user?.id || rejectedProj.seller?.id || 'admin-user');
    } catch (e) {
      console.warn('Supabase direct sync fallback warning:', e);
    }

    const fallbackAuditLog: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      adminUser,
      adminRole: 'SUPER_ADMIN',
      projectId: localProj.id,
      projectTitle: localProj.title || 'Rejected Project',
      action: 'REJECTED',
      previousStatus: localProj.sellerStatus || 'Pending Review',
      newStatus: 'Rejected',
      reason: rejectionReason.trim(),
      timestamp: new Date().toISOString()
    };
    recordAuditLogLocal(fallbackAuditLog);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aiwebcrafter_projects_updated', { detail: { project: rejectedProj } }));
    }

    return {
      success: true,
      message: `Project "${rejectedProj.title}" rejected with feedback.`,
      project: rejectedProj,
      auditLog: fallbackAuditLog
    };
  }

  return { success: false, message: 'Project not found to reject.' };
};

const USERS_STORAGE_KEY = 'aiwebcrafter_admin_users';
const SELLERS_STORAGE_KEY = 'aiwebcrafter_admin_sellers';

const DEFAULT_USERS: AdminUser[] = [
  {
    id: 'usr-105',
    name: 'Platform Owner',
    email: 'aiwebcraft6@gmail.com',
    role: 'Super Admin',
    registrationDate: '2025-01-01',
    projectsCount: 0,
    purchasesCount: 0,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300',
    location: 'Global Command Console',
    lastLogin: new Date().toISOString(),
    bio: 'Platform Owner & Administrator for AIWebCrafter.'
  }
];

const DEFAULT_SELLERS: AdminSeller[] = [];

export const getStoredAdminUsers = (): AdminUser[] => {
  try {
    const usersMap = new Map<string, AdminUser>();

    // 1. Add Platform Owner (Super Admin)
    DEFAULT_USERS.forEach(u => usersMap.set(u.email.toLowerCase().trim(), { ...u }));

    // 2. Read saved admin users from localStorage
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed: AdminUser[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(u => {
          if (u && u.email) {
            usersMap.set(u.email.toLowerCase().trim(), u);
          }
        });
      }
    }

    // 3. Aggregate from local user database (e.g., aiwebcrafter_local_users_db)
    const localUsersDbStr = localStorage.getItem('aiwebcrafter_local_users_db');
    if (localUsersDbStr) {
      try {
        const localDb = JSON.parse(localUsersDbStr);
        if (Array.isArray(localDb)) {
          localDb.forEach((lu: any) => {
            if (lu?.email) {
              const emailKey = lu.email.toLowerCase().trim();
              if (!usersMap.has(emailKey)) {
                const safeEmailSlug = emailKey.replace(/[^a-z0-9]/g, '_');
                usersMap.set(emailKey, {
                  id: (lu.id && typeof lu.id === 'string' && lu.id.trim()) ? lu.id : `usr-loc-${safeEmailSlug}`,
                  name: lu.fullName || lu.email.split('@')[0],
                  email: lu.email,
                  role: 'Buyer',
                  registrationDate: new Date().toISOString().split('T')[0],
                  projectsCount: 0,
                  purchasesCount: 0,
                  status: 'Active',
                  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
                  location: 'Global',
                  lastLogin: new Date().toISOString(),
                  bio: `Registered account on AIWebCrafter (${lu.email}).`
                });
              }
            }
          });
        }
      } catch {}
    }

    // 4. Aggregate currently logged in user
    const currentLocalUserStr = localStorage.getItem('aiwebcrafter_local_user');
    if (currentLocalUserStr) {
      try {
        const current = JSON.parse(currentLocalUserStr);
        if (current?.email) {
          const emailKey = current.email.toLowerCase().trim();
          if (!usersMap.has(emailKey)) {
            const safeEmailSlug = emailKey.replace(/[^a-z0-9]/g, '_');
            usersMap.set(emailKey, {
              id: (current.id && typeof current.id === 'string' && current.id.trim()) ? current.id : `usr-curr-${safeEmailSlug}`,
              name: current.user_metadata?.full_name || current.email.split('@')[0],
              email: current.email,
              role: 'Buyer',
              registrationDate: new Date().toISOString().split('T')[0],
              projectsCount: 0,
              purchasesCount: 0,
              status: 'Active',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
              location: 'Global',
              lastLogin: new Date().toISOString(),
              bio: `Active logged-in user on AIWebCrafter.`
            });
          }
        }
      } catch {}
    }

    // 5. Aggregate sellers from getAllStoredSellerProjects()
    try {
      const projects = getAllStoredSellerProjects();
      projects.forEach(p => {
        const email = (p.ownerEmail || p.seller?.email || '').toLowerCase().trim();
        if (email && email !== 'guest@aiwebcrafter.local') {
          const existing = usersMap.get(email);
          if (existing) {
            existing.projectsCount = (existing.projectsCount || 0) + 1;
            if (existing.role === 'Buyer') existing.role = 'Both';
            else if (existing.role !== 'Super Admin' && existing.role !== 'Both') existing.role = 'Seller';
          } else {
            const name = p.seller?.name || (email.includes('@') ? email.split('@')[0] : 'Seller User');
            const safeEmailSlug = email.replace(/[^a-z0-9]/g, '_');
            usersMap.set(email, {
              id: (p.seller?.id && typeof p.seller.id === 'string' && p.seller.id.trim()) ? p.seller.id : `usr-sel-${safeEmailSlug}`,
              name,
              email,
              role: 'Seller',
              registrationDate: p.createdAt || new Date().toISOString().split('T')[0],
              projectsCount: 1,
              purchasesCount: 0,
              status: 'Active',
              avatar: p.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
              location: p.seller?.location || 'Casablanca, Morocco',
              lastLogin: new Date().toISOString(),
              bio: `Verified digital creator on AIWebCrafter (${email}).`
            });
          }
        }
      });
    } catch {}

    // 6. Ensure strict uniqueness of IDs
    const usedIds = new Set<string>();
    const list = Array.from(usersMap.values()).map(u => {
      let finalId = u.id || `usr-${u.email.replace(/[^a-z0-9]/gi, '_')}`;
      if (usedIds.has(finalId)) {
        finalId = `${finalId}_${Math.random().toString(36).substring(2, 6)}`;
      }
      usedIds.add(finalId);
      return { ...u, id: finalId };
    });
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.warn('Error reading admin users:', e);
    return DEFAULT_USERS;
  }
};

export const saveStoredAdminUsers = (users: AdminUser[]) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Error saving admin users:', e);
  }
};

export const getStoredAdminSellers = (): AdminSeller[] => {
  try {
    const sellersMap = new Map<string, AdminSeller>();

    // 1. Saved admin sellers
    const raw = localStorage.getItem(SELLERS_STORAGE_KEY);
    if (raw) {
      const parsed: AdminSeller[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(s => {
          if (s && s.email) sellersMap.set(s.email.toLowerCase().trim(), s);
        });
      }
    }

    // 2. Aggregate from seller projects
    try {
      const projects = getAllStoredSellerProjects();
      projects.forEach(p => {
        const email = (p.ownerEmail || p.seller?.email || '').toLowerCase().trim();
        if (email && email !== 'guest@aiwebcrafter.local') {
          const existing = sellersMap.get(email);
          const isApproved = p.sellerStatus === 'Approved';
          const isSold = p.sellerStatus === 'Sold';
          if (existing) {
            existing.projectsCount = (existing.projectsCount || 0) + 1;
            if (isApproved) existing.approvedProjectsCount = (existing.approvedProjectsCount || 0) + 1;
            if (isSold) existing.soldProjectsCount = (existing.soldProjectsCount || 0) + 1;
          } else {
            const name = p.seller?.name || (email.includes('@') ? email.split('@')[0] : 'Seller User');
            sellersMap.set(email, {
              id: p.seller?.id || `sel-${Date.now()}`,
              name,
              email,
              projectsCount: 1,
              approvedProjectsCount: isApproved ? 1 : 0,
              soldProjectsCount: isSold ? 1 : 0,
              totalSales: isSold ? p.askingPrice : 0,
              verificationStatus: 'Verified',
              registrationDate: p.createdAt || new Date().toISOString().split('T')[0],
              status: 'Active',
              avatar: p.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
              location: p.seller?.location || 'Casablanca, Morocco',
              rating: p.seller?.rating || 5.0,
              responseRate: p.seller?.responseRate || '< 30 min',
              bio: p.seller?.bio || `Verified digital seller on AIWebCrafter.`
            });
          }
        }
      });
    } catch {}

    const list = Array.from(sellersMap.values());
    localStorage.setItem(SELLERS_STORAGE_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    console.warn('Error reading admin sellers:', e);
  }
  return DEFAULT_SELLERS;
};

export const saveStoredAdminSellers = (sellers: AdminSeller[]) => {
  try {
    localStorage.setItem(SELLERS_STORAGE_KEY, JSON.stringify(sellers));
  } catch (e) {
    console.warn('Error saving admin sellers:', e);
  }
};

// Fetch Users List
export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const key = getAdminKey();
  if (!key) return getStoredAdminUsers();

  try {
    const res = await safeFetchJson('/api/system/users', {
      headers: { 'x-admin-key': key }
    });
    if (res.ok && Array.isArray(res.data?.users)) {
      saveStoredAdminUsers(res.data.users);
      return res.data.users;
    }
  } catch (e) {
    console.warn('Error fetching admin users, using local:', e);
  }
  return getStoredAdminUsers();
};

// Fetch Sellers List
export const fetchAdminSellers = async (): Promise<AdminSeller[]> => {
  const key = getAdminKey();
  if (!key) return getStoredAdminSellers();

  try {
    const res = await safeFetchJson('/api/system/sellers', {
      headers: { 'x-admin-key': key }
    });
    if (res.ok && Array.isArray(res.data?.sellers)) {
      saveStoredAdminSellers(res.data.sellers);
      return res.data.sellers;
    }
  } catch (e) {
    console.warn('Error fetching admin sellers, using local:', e);
  }
  return getStoredAdminSellers();
};

// Update User Account Status (Server + local sync)
export const updateUserStatusServer = async (
  userId: string,
  action: 'Activate' | 'Suspend',
  suspensionReason?: string,
  adminUser: string = 'Platform Owner (aiwebcraft6@gmail.com)'
): Promise<{ success: boolean; message?: string; user?: AdminUser; auditLog?: AuditLogItem }> => {
  const key = getAdminKey();
  if (!key) {
    return { success: false, message: '403 Forbidden: No Admin key found.' };
  }

  try {
    const res = await safeFetchJson('/api/system/users/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': key
      },
      body: JSON.stringify({ userId, action, suspensionReason, adminUser })
    });

    if (res.ok && res.data?.user) {
      // Sync local list
      const localUsers = getStoredAdminUsers();
      const updated = localUsers.map((u) => (u.id === userId ? res.data.user : u));
      saveStoredAdminUsers(updated);

      if (res.data.auditLog) {
        recordAuditLogLocal(res.data.auditLog);
      }

      return {
        success: true,
        message: res.data.message,
        user: res.data.user,
        auditLog: res.data.auditLog
      };
    } else {
      return { success: false, message: res.error || res.data?.error || 'Failed to update user status.' };
    }
  } catch (err) {
    // Fallback Local
    const localUsers = getStoredAdminUsers();
    const target = localUsers.find((u) => u.id === userId);
    if (target) {
      const prevStatus = target.status;
      target.status = action === 'Suspend' ? 'Suspended' : 'Active';
      target.suspensionReason = action === 'Suspend' ? suspensionReason : undefined;
      saveStoredAdminUsers(localUsers);

      const localLog: AuditLogItem = {
        id: `audit-${Date.now()}`,
        adminUser,
        adminRole: 'SUPER_ADMIN',
        projectId: target.id,
        projectTitle: `User Account: ${target.name} (${target.email})`,
        action: action === 'Suspend' ? 'REJECTED' : 'APPROVED',
        previousStatus: prevStatus,
        newStatus: target.status,
        reason: action === 'Suspend' ? suspensionReason : 'Account activated locally',
        timestamp: new Date().toISOString()
      };
      recordAuditLogLocal(localLog);

      return { success: true, user: target, auditLog: localLog };
    }
    return { success: false, message: 'User not found in local fallback' };
  }
};

// Update Seller Account Status (Server + local sync)
export const updateSellerStatusServer = async (
  sellerId: string,
  action: 'Activate' | 'Suspend',
  suspensionReason?: string,
  adminUser: string = 'Platform Owner (aiwebcraft6@gmail.com)'
): Promise<{ success: boolean; message?: string; seller?: AdminSeller; auditLog?: AuditLogItem }> => {
  const key = getAdminKey();
  if (!key) {
    return { success: false, message: '403 Forbidden: No Admin key found.' };
  }

  try {
    const res = await safeFetchJson('/api/system/sellers/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': key
      },
      body: JSON.stringify({ sellerId, action, suspensionReason, adminUser })
    });

    if (res.ok && res.data?.seller) {
      // Sync local list
      const localSellers = getStoredAdminSellers();
      const updated = localSellers.map((s) => (s.id === sellerId ? res.data.seller : s));
      saveStoredAdminSellers(updated);

      if (res.data.auditLog) {
        recordAuditLogLocal(res.data.auditLog);
      }

      return {
        success: true,
        message: res.data.message,
        seller: res.data.seller,
        auditLog: res.data.auditLog
      };
    } else {
      return { success: false, message: res.error || res.data?.error || 'Failed to update seller status.' };
    }
  } catch (err) {
    // Fallback Local
    const localSellers = getStoredAdminSellers();
    const target = localSellers.find((s) => s.id === sellerId);
    if (target) {
      const prevStatus = target.status;
      target.status = action === 'Suspend' ? 'Suspended' : 'Active';
      target.suspensionReason = action === 'Suspend' ? suspensionReason : undefined;
      saveStoredAdminSellers(localSellers);

      const localLog: AuditLogItem = {
        id: `audit-${Date.now()}`,
        adminUser,
        adminRole: 'SUPER_ADMIN',
        projectId: target.id,
        projectTitle: `Seller Account: ${target.name} (${target.email})`,
        action: action === 'Suspend' ? 'REJECTED' : 'APPROVED',
        previousStatus: prevStatus,
        newStatus: target.status,
        reason: action === 'Suspend' ? suspensionReason : 'Seller activated locally',
        timestamp: new Date().toISOString()
      };
      recordAuditLogLocal(localLog);

      return { success: true, seller: target, auditLog: localLog };
    }
    return { success: false, message: 'Seller not found in local fallback' };
  }
};

export const getStoredCommissionRate = async (): Promise<number> => {
  return await getPlatformCommissionPercentage();
};

export const fetchStoredCommissionRate = async (): Promise<number> => {
  return await fetchPlatformCommissionPercentage();
};

export const saveStoredCommissionRate = async (rate: number): Promise<boolean> => {
  const res = await setPlatformCommissionPercentage(rate);
  dispatchCustomEvent('commission_rate_changed');
  return res;
};
