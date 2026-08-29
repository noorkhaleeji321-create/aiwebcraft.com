import { SellerProject, Listing, SellerProjectStatus, SellerPayoutSettings } from '../types.js';
import { MOCK_LISTINGS } from '../data/mockListings.js';
import { saveProjectToSupabase } from './supabaseService.js';
import { dispatchCustomEvent } from '../utils/eventBus.js';
import { safeFetchJson } from '../utils/api.js';

const STORAGE_KEY = 'aiwebcrafter_seller_projects_v4';

// Initial mock seller projects representing each workflow state (kept empty for clean production data)
const INITIAL_SELLER_PROJECTS: SellerProject[] = [];

const DELETED_LISTINGS_KEY = 'aiwebcrafter_deleted_listings_v1';

export const getDeletedListingIds = (): string[] => {
  try {
    const raw = localStorage.getItem(DELETED_LISTINGS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes('6b67c62e-9c11-421a-9a9f-e6ae91075ed3')) {
      list.push('6b67c62e-9c11-421a-9a9f-e6ae91075ed3');
    }
    if (!list.includes('644443db-b5b8-43d8-a790-fa18b3f55bd9')) {
      list.push('644443db-b5b8-43d8-a790-fa18b3f55bd9');
    }
    return list;
  } catch {
    return ['6b67c62e-9c11-421a-9a9f-e6ae91075ed3', '644443db-b5b8-43d8-a790-fa18b3f55bd9'];
  }
};

export const addDeletedListingId = (id: string) => {
  try {
    const current = getDeletedListingIds();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(DELETED_LISTINGS_KEY, JSON.stringify(current));
    }
  } catch (e) {
    console.warn('Error saving deleted listing id:', e);
  }
};

export const clearAllTestProjects = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('aiwebcrafter_seller_projects_v3');
    localStorage.removeItem('aiwebcrafter_seller_projects_v2');
    localStorage.removeItem('aiwebcrafter_seller_projects_v1');
    localStorage.removeItem('aiwebcrafter_seller_projects');
  } catch (e) {
    console.warn('Error clearing seller projects from localStorage:', e);
  }
};

export const getCurrentLoggedInEmail = (): string => {
  try {
    const local = localStorage.getItem('aiwebcrafter_local_user');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed?.email) return parsed.email;
    }
    // Check localStorage for Supabase auth tokens
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('user'))) {
        try {
          const val = localStorage.getItem(key);
          if (val && val.startsWith('{')) {
            const parsed = JSON.parse(val);
            if (parsed?.user?.email) return parsed.user.email;
            if (parsed?.email) return parsed.email;
            if (parsed?.currentSession?.user?.email) return parsed.currentSession.user.email;
          }
        } catch {}
      }
    }
  } catch {}
  return '';
};

export const getAllStoredSellerProjects = (): SellerProject[] => {
  try {
    const deletedIds = getDeletedListingIds();
    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed: SellerProject[] = raw ? JSON.parse(raw) : [];
    
    // Ensure secureFiles array exists on every project
    let needsPersist = false;
    parsed = parsed.filter(p => {
      if (p.id === '6b67c62e-9c11-421a-9a9f-e6ae91075ed3' || deletedIds.includes(p.id)) {
        return false;
      }
      return true;
    }).map(p => {
      if (!p.secureFiles) {
        p.secureFiles = [];
        needsPersist = true;
      }
      return p;
    });

    if (needsPersist) {
      persistSellerProjects(parsed);
    }

    return parsed;
  } catch (e) {
    console.warn('Error reading all seller projects:', e);
    return [];
  }
};

export const notifyProjectsUpdated = () => {
  dispatchCustomEvent('projects_updated');
  dispatchCustomEvent('aiwebcrafter_projects_updated');
};

let isSyncingSellerProjects = false;

export const syncSellerProjectsWithServer = async (filterEmail?: string) => {
  if (isSyncingSellerProjects) return;
  isSyncingSellerProjects = true;
  try {
    const res = await safeFetchJson('/api/listings?status=all');
    if (res.ok && res.data?.success && Array.isArray(res.data?.listings)) {
      const serverListings = res.data.listings;
      if (serverListings.length > 0) {
        const deletedIds = getDeletedListingIds();
        const local = getAllStoredSellerProjects();
        let updated = false;

        serverListings.forEach((sl: any) => {
          if (!sl || !sl.id || deletedIds.includes(sl.id)) return;
          const slId = String(sl.id);
          const idx = local.findIndex(p => p.id === slId || String(p.id) === slId);
          
          let sellerStatus: SellerProjectStatus = 'Approved';
          if (sl.status === 'pending') sellerStatus = 'Pending Review';
          else if (sl.status === 'draft') sellerStatus = 'Draft';
          else if (sl.status === 'rejected') sellerStatus = 'Rejected';
          else if (sl.status === 'sold') sellerStatus = 'Sold';

          const ownerEmail = sl.owner_email || sl.seller_email || sl.ownerEmail || 'registered_seller';

          const projObj: SellerProject = {
            id: slId,
            slug: sl.slug || slId,
            ownerEmail,
            sellerStatus,
            lastSavedAt: sl.updated_at || sl.created_at || new Date().toISOString(),
            title: sl.title || 'Listed Project',
            tagline: sl.tagline || '',
            description: sl.description || '',
            longDescription: sl.long_description || sl.description || '',
            askingPrice: Number(sl.asking_price || sl.price || sl.askingPrice) || 0,
            currency: sl.currency || 'USD',
            monthlyRevenue: Number(sl.monthly_revenue || sl.monthlyRevenue) || 0,
            monthlyProfit: Number(sl.monthly_profit || sl.monthlyProfit) || 0,
            monthlyExpenses: Number(sl.monthly_expenses || sl.monthlyExpenses) || 0,
            monthlyVisitors: Number(sl.monthly_visitors || sl.monthlyVisitors) || 0,
            category: sl.category || 'SaaS',
            projectType: sl.project_type || sl.projectType || 'SaaS Platform',
            platform: sl.platform || 'React & Node.js',
            imageUrl: sl.image_url || sl.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
            gallery: sl.gallery || [sl.image_url || sl.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000'],
            createdAt: sl.created_at ? sl.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            secureFiles: sl.secure_files || sl.secureFiles || [],
            techStack: sl.tech_stack || sl.techStack || {
              frontend: ['React 18', 'Tailwind CSS'],
              backend: ['Node.js', 'Express'],
              database: ['Supabase (PostgreSQL)']
            },
            businessOverview: sl.business_overview || sl.businessOverview || {
              model: 'SaaS',
              monetization: ['Subscriptions'],
              targetAudience: 'Global Users',
              growthOpportunities: ['Marketing', 'SEO'],
              includedAssets: ['Codebase', 'Domain'],
              workloadHoursPerWeek: 5
            },
            financialOverview: sl.financial_overview || sl.financialOverview || {
              ttmRevenue: (Number(sl.monthly_revenue || sl.monthlyRevenue) || 0) * 12,
              ttmProfit: (Number(sl.monthly_profit || sl.monthlyProfit) || 0) * 12,
              expensesBreakdown: [],
              highlights: ['Low overhead']
            },
            seller: sl.seller || {
              id: 'seller-1',
              name: 'Verified Seller',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
              location: 'Morocco',
              memberSince: '2025',
              rating: 5,
              responseRate: '100%',
              completedDeals: 1,
              verified: true,
              bio: 'Digital asset creator and developer.'
            },
            verification: sl.verification || {
              revenueVerified: true,
              trafficVerified: true,
              codebaseVerified: true
            },
            business_stage: sl.business_stage || 'LIVE_REVENUE'
          };

          if (idx === -1) {
            local.unshift(projObj);
            updated = true;
          } else {
            local[idx] = { ...local[idx], ...projObj };
            updated = true;
          }
        });

        if (updated) {
          persistSellerProjects(local);
          notifyProjectsUpdated();
        }
      }
    }
  } catch (err) {
    console.warn('Sync seller projects warning:', err);
  } finally {
    isSyncingSellerProjects = false;
  }
};

export const getStoredSellerProjects = (filterEmail?: string): SellerProject[] => {
  try {
    // Trigger background sync with server / Supabase
    syncSellerProjectsWithServer(filterEmail).catch(() => {});

    const allProjects = getAllStoredSellerProjects();
    const currentEmail = filterEmail || getCurrentLoggedInEmail();

    if (currentEmail && currentEmail !== 'guest@aiwebcrafter.local') {
      let updated = false;
      const userProjects = allProjects.filter(p => {
        if (!p.ownerEmail || p.ownerEmail === 'guest@aiwebcrafter.local') {
          p.ownerEmail = currentEmail;
          updated = true;
          return true;
        }
        return p.ownerEmail.toLowerCase() === currentEmail.toLowerCase();
      });
      if (updated) {
        persistSellerProjects(allProjects);
      }
      return userProjects;
    }

    return allProjects.filter(p => !p.ownerEmail || p.ownerEmail === 'guest@aiwebcrafter.local');
  } catch (e) {
    console.warn('Error reading seller projects from localStorage:', e);
  }
  return [];
};

export const persistSellerProjects = (projects: SellerProject[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn('Error saving seller projects to localStorage:', e);
  }
};

export const getSellerProjectById = (id: string): SellerProject | undefined => {
  const currentEmail = getCurrentLoggedInEmail();
  try {
    const allProjects = getAllStoredSellerProjects();
    const proj = allProjects.find((p) => p.id === id);
    if (proj && currentEmail && proj.ownerEmail && proj.ownerEmail.toLowerCase() !== currentEmail.toLowerCase()) {
      return undefined; // Not authorized to view other users' workspace project in seller mode
    }
    return proj;
  } catch {
    return undefined;
  }
};

export const generateDefaultSecureFiles = (title: string = 'Digital Project', platform: string = 'React & Node.js') => {
  return [];
};

export const saveProjectDraft = (projectData: Partial<SellerProject>): SellerProject => {
  let currentEmail = getCurrentLoggedInEmail();
  if (!currentEmail) {
    currentEmail = 'guest@aiwebcrafter.local';
  }

  const allProjects = getAllStoredSellerProjects();
  const now = new Date().toISOString();

  let existingIndex = allProjects.findIndex((p) => p.id === projectData.id);

  const title = projectData.title || 'Untitled Digital Project';
  const platform = projectData.platform || 'Next.js & Supabase';

  const defaultFiles = generateDefaultSecureFiles(title, platform);

  if (existingIndex >= 0) {
    const existing = allProjects[existingIndex];
    if (
      existing.ownerEmail && 
      existing.ownerEmail !== 'guest@aiwebcrafter.local' && 
      currentEmail !== 'guest@aiwebcrafter.local' && 
      existing.ownerEmail.toLowerCase() !== currentEmail.toLowerCase()
    ) {
      throw new Error('Unauthorized: You can only modify projects associated with your own account.');
    }

    const secureFilesToSave = (projectData.secureFiles && projectData.secureFiles.length > 0)
      ? projectData.secureFiles
      : (existing.secureFiles && existing.secureFiles.length > 0)
      ? existing.secureFiles
      : [];

    // Update existing draft or project
    const updatedProject: SellerProject = {
      ...existing,
      ...projectData,
      secureFiles: secureFilesToSave,
      ownerEmail: existing.ownerEmail || currentEmail,
      lastSavedAt: now
    };
    allProjects[existingIndex] = updatedProject;
    persistSellerProjects(allProjects);

    // Only save to Supabase if project is NOT in Draft state (e.g. Pending Review, Approved, etc.)
    if (updatedProject.sellerStatus !== 'Draft') {
      saveProjectToSupabase(updatedProject, updatedProject.ownerEmail).catch(() => {});
    }
    return updatedProject;
  } else {
    // Create new project draft
    const id = projectData.id || `sp-${Date.now()}`;
    const slug = (projectData.title || 'untitled')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const userName = (currentEmail && currentEmail.includes('@')) ? currentEmail.split('@')[0] : 'Seller User';

    const secureFilesToSave = (projectData.secureFiles && projectData.secureFiles.length > 0)
      ? projectData.secureFiles
      : [];

    const newProject: SellerProject = {
      id,
      slug,
      ownerEmail: currentEmail,
      sellerStatus: 'Draft',
      lastSavedAt: now,
      createdAt: now.split('T')[0],
      business_stage: 'LIVE_REVENUE',
      title,
      tagline: projectData.tagline || '',
      description: projectData.description || '',
      longDescription: projectData.longDescription || '',
      askingPrice: Number(projectData.askingPrice) || 5000,
      currency: projectData.currency || 'USD',
      monthlyRevenue: Number(projectData.monthlyRevenue) || 0,
      monthlyProfit: Number(projectData.monthlyProfit) || 0,
      monthlyExpenses: Number(projectData.monthlyExpenses) || 0,
      monthlyVisitors: Number(projectData.monthlyVisitors) || 0,
      category: projectData.category || 'SaaS',
      projectType: projectData.projectType || 'SaaS Platform',
      platform,
      demoUrl: projectData.demoUrl || '',
      videoUrl: projectData.videoUrl || '',
      imageUrl: projectData.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
      gallery: projectData.gallery && projectData.gallery.length > 0
        ? projectData.gallery
        : ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000'],
      secureFiles: secureFilesToSave,
      techStack: projectData.techStack || {
        frontend: ['React 18', 'Tailwind CSS'],
        backend: ['Node.js', 'Express'],
        database: ['Supabase (PostgreSQL)'],
        aiModels: ['Gemini 1.5 Flash'],
        hosting: ['Vercel'],
        payments: ['Stripe Billing']
      },
      businessOverview: projectData.businessOverview || {
        model: 'Subscription SaaS',
        monetization: ['Recurring Subscriptions'],
        targetAudience: 'Digital founders & small agencies',
        growthOpportunities: ['Paid Ads', 'SEO Content Marketing'],
        includedAssets: ['Domain Name', 'Full Codebase', 'Database & Customer Accounts'],
        workloadHoursPerWeek: 5,
        reasonForSelling: 'Focusing on new software ventures'
      },
      financialOverview: projectData.financialOverview || {
        ttmRevenue: (Number(projectData.monthlyRevenue) || 0) * 12,
        ttmProfit: (Number(projectData.monthlyProfit) || 0) * 12,
        expensesBreakdown: [
          { category: 'Hosting & Cloud API', amount: Number(projectData.monthlyExpenses) || 50 }
        ],
        highlights: ['Low overhead', 'Growth ready']
      },
      seller: projectData.seller || {
        id: `sel-${Date.now()}`,
        name: `${userName} (Seller)`,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        location: 'Casablanca, Morocco',
        memberSince: '2025',
        rating: 5.0,
        responseRate: '100% (< 30 min)',
        completedDeals: 1,
        verified: false,
        bio: `Verified digital seller on AIWebCrafter (${currentEmail}).`
      },
      verification: projectData.verification || {
        revenueVerified: false,
        trafficVerified: false,
        codebaseVerified: false,
        identityVerified: false
      },
      currentStep: projectData.currentStep || 1
    };

    allProjects.unshift(newProject);
    persistSellerProjects(allProjects);
    // Draft project stays in local storage until "Confirm & Send for Review" is clicked
    dispatchCustomEvent('projects_updated');
    return newProject;
  }
};

export const submitProjectForReview = (
  id: string
): { success: boolean; errors?: string[]; project?: SellerProject } => {
  const currentEmail = getCurrentLoggedInEmail();
  const allProjects = getAllStoredSellerProjects();
  const index = allProjects.findIndex((p) => p.id === id);

  if (index === -1) {
    return { success: false, errors: ['Project not found'] };
  }

  const proj = allProjects[index];

  if (
    proj.ownerEmail && 
    proj.ownerEmail !== 'guest@aiwebcrafter.local' && 
    currentEmail && 
    proj.ownerEmail.toLowerCase() !== currentEmail.toLowerCase()
  ) {
    return { success: false, errors: ['Unauthorized: You can only submit your own projects.'] };
  }

  const errors: string[] = [];

  // Validation
  if (!proj.title || proj.title.trim().length < 3) {
    errors.push('Project Title must be at least 3 characters.');
  }
  if (!proj.tagline || proj.tagline.trim().length < 10) {
    errors.push('Tagline must be at least 10 characters.');
  }
  if (!proj.description || proj.description.trim().length < 20) {
    errors.push('Short Description must be at least 20 characters.');
  }
  if (!proj.askingPrice || proj.askingPrice <= 0) {
    errors.push('Asking Price must be greater than $0.');
  }
  if (proj.monthlyRevenue === undefined || proj.monthlyRevenue < 0) {
    errors.push('Monthly Revenue cannot be negative.');
  }
  if (proj.monthlyProfit === undefined) {
    errors.push('Monthly Profit is required.');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Set status to Pending Review and associate with seller email & registered seller name
  const sellerEmail = proj.ownerEmail && proj.ownerEmail !== 'guest@aiwebcrafter.local' ? proj.ownerEmail : (currentEmail || 'seller@example.com');
  const registeredName = sellerEmail.includes('@') ? sellerEmail.split('@')[0] : 'Seller User';

  const updated: SellerProject = {
    ...proj,
    ownerEmail: sellerEmail,
    sellerStatus: 'Pending Review',
    submittedAt: new Date().toISOString(),
    rejectionReason: undefined,
    seller: {
      ...(proj.seller || {}),
      id: proj.seller?.id || `sel-${Date.now()}`,
      name: `${registeredName} (Seller)`,
      avatar: proj.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      location: proj.seller?.location || 'Casablanca, Morocco',
      memberSince: proj.seller?.memberSince || '2025',
      rating: proj.seller?.rating || 5.0,
      responseRate: proj.seller?.responseRate || '100% (< 30 min)',
      completedDeals: proj.seller?.completedDeals || 0,
      verified: true,
      bio: `Verified digital seller on AIWebCrafter (${sellerEmail}).`
    }
  };

  allProjects[index] = updated;
  persistSellerProjects(allProjects);

  // Encrypt and save securely to Supabase and central server catalog NOW (upon Confirm & Send for Review)
  saveProjectToSupabase(updated, sellerEmail).then((res) => {
    console.log('Project successfully saved to Supabase upon review submission:', res);
    notifyProjectsUpdated();
  }).catch((err) => {
    console.warn('Supabase async save notice upon submit:', err);
    notifyProjectsUpdated();
  });

  notifyProjectsUpdated();

  return { success: true, project: updated };
};

export const deleteSellerProject = (id: string, filterEmail?: string): boolean => {
  if (!id) return false;
  const cleanId = String(id).trim();
  addDeletedListingId(id);
  addDeletedListingId(cleanId);
  
  const keys = [
    STORAGE_KEY,
    'aiwebcrafter_seller_projects_v4',
    'aiwebcrafter_seller_projects_v3',
    'aiwebcrafter_seller_projects_v2',
    'aiwebcrafter_seller_projects_v1',
    'aiwebcrafter_seller_projects'
  ];

  try {
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        let parsed: SellerProject[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed = parsed.filter((p) => p.id !== id && String(p.id).trim() !== cleanId);
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      }
    }
  } catch (e) {
    console.warn('Error removing project from localStorage:', e);
  }

  // Also notify backend server to remove from memory store & Supabase database
  safeFetchJson('/api/listings/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: id })
  }).catch((err) => {
    console.warn('Backend listing delete request error:', err);
  });

  dispatchCustomEvent('aiwebcrafter_projects_updated');
  dispatchCustomEvent('seller-projects-updated');

  return true;
};

export const deleteAllTestProjectsGlobal = async (): Promise<boolean> => {
  const keys = [
    STORAGE_KEY,
    'aiwebcrafter_seller_projects_v4',
    'aiwebcrafter_seller_projects_v3',
    'aiwebcrafter_seller_projects_v2',
    'aiwebcrafter_seller_projects_v1',
    'aiwebcrafter_seller_projects'
  ];

  try {
    const allProjects = getAllStoredSellerProjects();
    allProjects.forEach(p => {
      if (p.id) {
        addDeletedListingId(p.id);
        addDeletedListingId(String(p.id).trim());
      }
    });

    for (const key of keys) {
      localStorage.removeItem(key);
    }

    // Call server purge route to clear backend in-memory store and Supabase database
    const adminKey = 
      sessionStorage.getItem('aiwebcrafter_admin_key') || 
      localStorage.getItem('aiwebcrafter_admin_key') || 
      sessionStorage.getItem('aiwebcrafter_admin_token') ||
      localStorage.getItem('aiwebcrafter_admin_token') ||
      'aiwebcraft6@gmail.com';

    try {
      await safeFetchJson('/api/system/purge-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
          'authorization': `Bearer ${adminKey}`
        }
      });
    } catch (e) {
      console.warn('Server purge API call error:', e);
    }

    dispatchCustomEvent('aiwebcrafter_projects_updated');
    dispatchCustomEvent('seller-projects-updated');
  } catch (e) {
    console.warn('Error deleting all test projects globally:', e);
  }

  return true;
};

export const deleteAllUserSellerProjects = (filterEmail?: string): boolean => {
  const currentEmail = filterEmail || getCurrentLoggedInEmail();
  const keys = [
    STORAGE_KEY,
    'aiwebcrafter_seller_projects_v3',
    'aiwebcrafter_seller_projects_v2',
    'aiwebcrafter_seller_projects_v1',
    'aiwebcrafter_seller_projects'
  ];

  try {
    const allProjects = getAllStoredSellerProjects();
    const userProjects = allProjects.filter(p => {
      if (!currentEmail || currentEmail === 'guest@aiwebcrafter.local') {
        return !p.ownerEmail || p.ownerEmail === 'guest@aiwebcrafter.local';
      }
      return !p.ownerEmail || p.ownerEmail === 'guest@aiwebcrafter.local' || p.ownerEmail.toLowerCase() === currentEmail.toLowerCase();
    });

    userProjects.forEach(p => {
      if (p.id) {
        addDeletedListingId(p.id);
        addDeletedListingId(String(p.id).trim());
      }
    });

    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        let parsed: SellerProject[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const remaining = parsed.filter(p => !userProjects.some(dp => dp.id === p.id || String(dp.id).trim() === String(p.id).trim()));
          localStorage.setItem(key, JSON.stringify(remaining));
        }
      }
    }
  } catch (e) {
    console.warn('Error deleting all user seller projects:', e);
  }

  return true;
};

export const saveSellerProjectDirectly = (updatedProject: SellerProject) => {
  const currentEmail = getCurrentLoggedInEmail() || updatedProject.ownerEmail || 'guest@aiwebcrafter.local';
  const allProjects = getAllStoredSellerProjects();
  const index = allProjects.findIndex((p) => p.id === updatedProject.id);

  const title = updatedProject.title || 'Digital Project';
  const platform = updatedProject.platform || 'React & Node.js';

  const secureFilesToSave = (updatedProject.secureFiles && updatedProject.secureFiles.length > 0)
    ? updatedProject.secureFiles
    : [];

  const projectToSave: SellerProject = {
    ...updatedProject,
    secureFiles: secureFilesToSave,
    ownerEmail: updatedProject.ownerEmail || currentEmail
  };

  if (index >= 0) {
    allProjects[index] = projectToSave;
  } else {
    allProjects.unshift(projectToSave);
  }

  persistSellerProjects(allProjects);
  return projectToSave;
};

// Simulation helper for testing admin approval
export const simulateAdminApproval = (id: string): SellerProject | undefined => {
  const allProjects = getAllStoredSellerProjects();
  const index = allProjects.findIndex((p) => p.id === id);
  if (index >= 0) {
    const updated: SellerProject = {
      ...allProjects[index],
      sellerStatus: 'Approved',
      approvedAt: new Date().toISOString(),
      seller: {
        ...allProjects[index].seller,
        id: allProjects[index].seller?.id || 'sel-default',
        name: allProjects[index].seller?.name || 'Verified Seller',
        avatar: allProjects[index].seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        rating: allProjects[index].seller?.rating ?? 5.0,
        completedDeals: allProjects[index].seller?.completedDeals ?? 2,
        verified: true,
        memberSince: allProjects[index].seller?.memberSince || '2025',
        location: allProjects[index].seller?.location || 'Casablanca, Morocco',
        responseRate: allProjects[index].seller?.responseRate || '< 30 min',
        bio: allProjects[index].seller?.bio || 'Verified digital builder on AIWebCrafter.'
      },
      verification: {
        revenueVerified: true,
        trafficVerified: true,
        codebaseVerified: true,
        identityVerified: true
      }
    };
    allProjects[index] = updated;
    persistSellerProjects(allProjects);
    return updated;
  }
  return undefined;
};

// Convert SellerProject to Listing format for rendering with ListingCard or ProjectDetails
export const toPublicListing = (sp: SellerProject): Listing => {
  return {
    id: sp.id,
    slug: sp.slug,
    title: sp.title,
    tagline: sp.tagline,
    description: sp.description,
    longDescription: sp.longDescription || sp.description,
    askingPrice: sp.askingPrice,
    monthlyRevenue: sp.monthlyRevenue,
    monthlyProfit: sp.monthlyProfit,
    monthlyVisitors: sp.monthlyVisitors,
    category: sp.category,
    platform: sp.platform,
    status: sp.sellerStatus === 'Sold' ? 'Sold' : 'For Sale',
    featured: false,
    imageUrl: sp.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
    gallery: sp.gallery && sp.gallery.length > 0 ? sp.gallery : [sp.imageUrl],
    demoUrl: sp.demoUrl,
    videoUrl: sp.videoUrl,
    techStack: sp.techStack,
    businessOverview: sp.businessOverview,
    financialOverview: sp.financialOverview,
    seller: {
      id: sp.seller?.id || 'sel-default',
      name: sp.seller?.name || 'Youssef El Amrani',
      avatar: sp.seller?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      rating: sp.seller?.rating ?? 5.0,
      completedDeals: sp.seller?.completedDeals ?? 12,
      verified: sp.seller?.verified ?? true,
      memberSince: sp.seller?.memberSince || '2024',
      location: sp.seller?.location || 'Casablanca, Morocco',
      responseRate: sp.seller?.responseRate || '< 1 hour',
      bio: sp.seller?.bio || 'Verified digital builder and SaaS seller on AIWebCrafter.'
    },
    verification: sp.verification || {
      revenueVerified: false,
      trafficVerified: false,
      codebaseVerified: false,
      sellerIdentityVerified: false
    },
    createdAt: sp.createdAt,

    // AIWebCrafter Product Stage System Fields
    business_stage: sp.business_stage || 'LIVE_REVENUE',
    asset_type: sp.asset_type || 'SaaS',

    // PRE_LAUNCH
    expectedLaunchDate: sp.expectedLaunchDate,
    developmentProgress: sp.developmentProgress,
    featuresCompleted: sp.featuresCompleted,
    featuresRemaining: sp.featuresRemaining,
    demo: sp.demo,
    technology: sp.technology,
    betaWaitlistUsers: sp.betaWaitlistUsers,

    // BETA
    betaStartDate: sp.betaStartDate,
    betaUsers: sp.betaUsers,
    payingUsers: sp.payingUsers,
    currentFeatures: sp.currentFeatures,
    knownIssues: sp.knownIssues,
    expectedPublicLaunch: sp.expectedPublicLaunch,

    // LIVE_NO_REVENUE
    launchDate: sp.launchDate,
    totalUsers: sp.totalUsers,
    activeUsers: sp.activeUsers,
    traffic: sp.traffic,
    growth: sp.growth,

    // LIVE_REVENUE
    averageMonthlyRevenue: sp.averageMonthlyRevenue,
    revenuePeriod: sp.revenuePeriod,
    payingCustomers: sp.payingCustomers,
    totalCustomers: sp.totalCustomers,
    mrr: sp.mrr,
    arr: sp.arr,
    revenueSource: sp.revenueSource,
    revenueVerificationStatus: sp.revenueVerificationStatus,

    // ESTABLISHED
    businessAge: sp.businessAge,
    annualRevenue: sp.annualRevenue,
    profit: sp.profit,
    users: sp.users,
    expenses: sp.expenses,
    teamSize: sp.teamSize,
    churn: sp.churn,
    acquisitionChannels: sp.acquisitionChannels,
    reasonForSale: sp.reasonForSale
  };
};

// Return approved seller projects as public listings for Marketplace integration
export const getApprovedSellerListings = (): Listing[] => {
  const projects = getAllStoredSellerProjects();
  return projects
    .filter((p) => p.sellerStatus === 'Approved')
    .map(toPublicListing);
};

// --- SELLER PAYOUT SETTINGS STORE ---
const PAYOUT_SETTINGS_PREFIX = 'aiwebcrafter_seller_payout_settings_';

export const getSellerPayoutSettings = (email: string): SellerPayoutSettings => {
  try {
    const key = `${PAYOUT_SETTINGS_PREFIX}${email.toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading payout settings:', e);
  }
  // Safe default
  return {
    payoutMethod: 'bank',
    bankName: '',
    bankSwift: '',
    bankIban: '',
    bankAccountHolder: '',
    paypalEmail: email || '',
    paddleEmail: email || '',
    cryptoWalletAddress: '',
    cryptoNetwork: 'ERC-20',
    updatedAt: new Date().toISOString()
  };
};

export const saveSellerPayoutSettings = (email: string, settings: SellerPayoutSettings) => {
  try {
    const key = `${PAYOUT_SETTINGS_PREFIX}${email.toLowerCase()}`;
    const updated = {
      ...settings,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(updated));
    // Trigger update event to notify any active subscribers
    dispatchCustomEvent('seller-payout-settings-updated');
  } catch (e) {
    console.error('Error saving payout settings:', e);
  }
};
