export type UserRole = 'SUPER_ADMIN' | 'VENDOR' | 'BUYER' | 'ALL';

export interface SidebarSubItem {
  id: string;
  title: {
    en: string;
    ar: string;
  };
  path: string;
  requiredRole?: UserRole;
  action?: string;
  description?: {
    en: string;
    ar: string;
  };
}

export interface SidebarItem {
  id: string;
  title: {
    en: string;
    ar: string;
  };
  icon: string;
  path: string;
  requiredRole: UserRole;
  description?: {
    en: string;
    ar: string;
  };
  badge?: {
    text: string;
    color: string;
  };
  counter?: number;
  subItems?: SidebarSubItem[];
}

export interface SidebarSection {
  id: string;
  sectionTitle: {
    en: string;
    ar: string;
  };
  requiredRole?: UserRole;
  items: SidebarItem[];
}

// ==========================================
// 1. PUBLIC MARKETPLACE CONFIG (Buyer Workspace)
// ==========================================
export const MARKETPLACE_CONFIG: SidebarSection[] = [
  {
    id: 'marketplace_buyer_core',
    sectionTitle: {
      en: 'Marketplace Navigation',
      ar: ''
    },
    requiredRole: 'BUYER',
    items: [
      {
        id: 'marketplace',
        title: {
          en: 'Marketplace',
          ar: ''
        },
        icon: 'Store',
        path: '/marketplace',
        requiredRole: 'BUYER',
        description: {
          en: 'Browse verified SaaS, digital products, and web projects',
          ar: ''
        }
      },
      {
        id: 'categories',
        title: {
          en: 'Categories',
          ar: ''
        },
        icon: 'Grid',
        path: '/categories',
        requiredRole: 'BUYER',
        description: {
          en: 'Filter by tech stack, revenue model, and industry',
          ar: ''
        }
      },
      {
        id: 'saved',
        title: {
          en: 'Favorites',
          ar: ''
        },
        icon: 'Heart',
        path: '/saved',
        requiredRole: 'BUYER',
        counter: 1,
        description: {
          en: 'Bookmarked projects and shortlisted assets',
          ar: ''
        }
      },
      {
        id: 'buyer-purchases',
        title: {
          en: 'Purchases',
          ar: ''
        },
        icon: 'ShoppingCart',
        path: '/buyer/purchases',
        requiredRole: 'BUYER',
        description: {
          en: 'Acquired apps, codebases, and digital assets',
          ar: ''
        }
      },
      {
        id: 'buyer-orders',
        title: {
          en: 'Orders',
          ar: ''
        },
        icon: 'Package',
        path: '/buyer/orders',
        requiredRole: 'BUYER',
        description: {
          en: 'Active purchases, escrow status, and delivery tracking',
          ar: ''
        }
      },
      {
        id: 'buyer-messages',
        title: {
          en: 'Messages',
          ar: ''
        },
        icon: 'MessageSquare',
        path: '/buyer/messages',
        requiredRole: 'BUYER',
        description: {
          en: 'Direct inquiries with verified project sellers',
          ar: ''
        }
      },
      {
        id: 'buyer-account',
        title: {
          en: 'Account',
          ar: ''
        },
        icon: 'User',
        path: '/account',
        requiredRole: 'BUYER',
        description: {
          en: 'Buyer profile, verification, and preferences',
          ar: ''
        }
      },
      {
        id: 'contact-admin',
        title: {
          en: 'Contact Admin',
          ar: 'Contact Admin'
        },
        icon: 'Headphones',
        path: '/contact-admin',
        requiredRole: 'BUYER',
        badge: {
          text: 'DIRECT',
          color: 'bg-emerald-500 text-white font-bold'
        },
        description: {
          en: 'Direct official communication desk with platform administration',
          ar: 'Direct official communication desk with platform administration'
        }
      }
    ]
  }
];

// ==========================================
// 2. ON-DEMAND CUSTOM BUILD CONFIG (Buyer Custom Requests)
// ==========================================
export const ON_DEMAND_CONFIG: SidebarSection[] = [
  {
    id: 'on_demand_core',
    sectionTitle: {
      en: 'On-Demand Custom Build',
      ar: 'On-Demand Custom Build'
    },
    requiredRole: 'BUYER',
    items: [
      {
        id: 'on-demand-create',
        title: {
          en: 'Custom Request',
          ar: 'Custom Request'
        },
        icon: 'Sparkles',
        path: '/on-demand',
        requiredRole: 'BUYER',
        badge: {
          text: 'CUSTOM',
          color: 'bg-amber-400 text-black font-extrabold'
        },
        description: {
          en: 'Order a custom-built Shopify store, SaaS, or AI tool to your exact specifications',
          ar: 'Order a custom-built Shopify store, SaaS, or AI tool to your exact specifications'
        }
      },
      {
        id: 'marketplace',
        title: {
          en: 'Browse Ready Projects',
          ar: 'Browse Ready Projects'
        },
        icon: 'Store',
        path: '/marketplace',
        requiredRole: 'BUYER',
        description: {
          en: 'Explore turnkey verified businesses and stores ready for acquisition',
          ar: 'Explore turnkey verified businesses and stores ready for acquisition'
        }
      }
    ]
  }
];

// ==========================================
// 3. VENDOR CENTER CONFIG (Seller Workspace)
// ==========================================
export const VENDOR_CENTER_CONFIG: SidebarSection[] = [
  {
    id: 'vendor_center_core',
    sectionTitle: {
      en: 'Vendor Center',
      ar: ''
    },
    requiredRole: 'VENDOR',
    items: [
      {
        id: 'vendor-dashboard',
        title: {
          en: 'Dashboard',
          ar: ''
        },
        icon: 'LayoutDashboard',
        path: '/vendor/dashboard',
        requiredRole: 'VENDOR',
        description: {
          en: 'Overview of store metrics, sales, and total revenue',
          ar: ''
        }
      },
      {
        id: 'vendor-projects',
        title: {
          en: 'My Projects',
          ar: ''
        },
        icon: 'Layers',
        path: '/vendor/projects',
        requiredRole: 'VENDOR',
        description: {
          en: 'Manage listed software assets and active draft projects',
          ar: ''
        }
      },
      {
        id: 'sell',
        title: {
          en: 'Add Project',
          ar: ''
        },
        icon: 'PlusCircle',
        path: '/sell',
        requiredRole: 'VENDOR',
        badge: {
          text: 'ZERO FEE',
          color: 'bg-amber-200 text-amber-950 border border-amber-300 font-extrabold'
        },
        description: {
          en: 'List a new digital project with escrow protection',
          ar: ''
        }
      },
      {
        id: 'vendor-sales',
        title: {
          en: 'Sales',
          ar: ''
        },
        icon: 'BadgeDollarSign',
        path: '/vendor/sales',
        requiredRole: 'VENDOR',
        description: {
          en: 'Transaction logs, completed sales, and revenue receipts',
          ar: ''
        }
      },
      {
        id: 'vendor-buyers',
        title: {
          en: 'Buyers',
          ar: ''
        },
        icon: 'Users',
        path: '/vendor/buyers',
        requiredRole: 'VENDOR',
        description: {
          en: 'Buyer inquiries, lead profiles, and client CRM',
          ar: ''
        }
      },
      {
        id: 'vendor-offers',
        title: {
          en: 'Offers',
          ar: ''
        },
        icon: 'Handshake',
        path: '/vendor/offers',
        requiredRole: 'VENDOR',
        description: {
          en: 'Review purchase offers and counter-proposals',
          ar: ''
        }
      },
      {
        id: 'vendor-delivery',
        title: {
          en: 'Delivery & Ownership',
          ar: ''
        },
        icon: 'Truck',
        path: '/delivery',
        requiredRole: 'VENDOR',
        description: {
          en: 'Handover code, credentials, domain transfer, and escrow completion',
          ar: ''
        }
      },
      {
        id: 'files-vault',
        title: {
          en: 'Files & Vault',
          ar: ''
        },
        icon: 'Folder',
        path: '/files-vault',
        requiredRole: 'VENDOR',
        description: {
          en: 'Encrypted storage for source code, zip archives, and contracts',
          ar: ''
        }
      },
      {
        id: 'vendor-earnings',
        title: {
          en: 'Earnings',
          ar: ''
        },
        icon: 'Wallet',
        path: '/vendor/earnings',
        requiredRole: 'VENDOR',
        description: {
          en: 'Net profits, pending payouts, and balance withdrawals',
          ar: ''
        }
      },
      {
        id: 'vendor-reports',
        title: {
          en: 'Reports',
          ar: ''
        },
        icon: 'BarChart3',
        path: '/reports',
        requiredRole: 'VENDOR',
        description: {
          en: 'Traffic analytics, valuation insights, and view counts',
          ar: ''
        }
      },
      {
        id: 'vendor-account',
        title: {
          en: 'Account',
          ar: ''
        },
        icon: 'UserCheck',
        path: '/account',
        requiredRole: 'VENDOR',
        description: {
          en: 'Seller KYC verification, store bio, and payment payout settings',
          ar: ''
        }
      }
    ]
  }
];

// ==========================================
// 3. SUPER ADMIN CONFIG (Admin Workspace)
// ==========================================
export const SUPER_ADMIN_CONFIG: SidebarSection[] = [
  {
    id: 'super_admin_core',
    sectionTitle: {
      en: 'Super Admin',
      ar: ''
    },
    requiredRole: 'SUPER_ADMIN',
    items: [
      {
        id: 'admin-dashboard',
        title: {
          en: 'Dashboard',
          ar: ''
        },
        icon: 'LayoutDashboard',
        path: '/admin/dashboard',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'System-wide metrics, GMV, total commissions, and active deals',
          ar: ''
        }
      },
      {
        id: 'admin-users',
        title: {
          en: 'Users',
          ar: ''
        },
        icon: 'Users',
        path: '/admin/users',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Manage registered buyers, user roles, and account statuses',
          ar: ''
        }
      },
      {
        id: 'admin-sellers',
        title: {
          en: 'Sellers',
          ar: ''
        },
        icon: 'UserCheck',
        path: '/admin/sellers',
        requiredRole: 'SUPER_ADMIN',
        counter: 5,
        description: {
          en: 'Verify KYC identity documents and approve seller accounts',
          ar: ''
        }
      },
      {
        id: 'admin-projects',
        title: {
          en: 'Projects',
          ar: ''
        },
        icon: 'Layers',
        path: '/admin/marketplace',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Global software catalog, active listings, and unlisted drafts',
          ar: ''
        }
      },
      {
        id: 'admin-project-review',
        title: {
          en: 'Project Review',
          ar: ''
        },
        icon: 'FileCheck',
        path: '/admin/reviews',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Audit revenue proof, code quality, and approve listing requests',
          ar: ''
        }
      },
      {
        id: 'admin-custom-requests',
        title: {
          en: 'Custom Builds (On-Demand)',
          ar: ''
        },
        icon: 'Wand2',
        path: '/admin/custom-requests',
        requiredRole: 'SUPER_ADMIN',
        badge: {
          text: 'ORDERS',
          color: 'bg-amber-400 text-amber-950 font-extrabold'
        },
        description: {
          en: 'Manage and review custom buyer build specifications and quotes',
          ar: ''
        }
      },
      {
        id: 'admin-sentinel',
        title: {
          en: 'AI Sentinel Hub',
          ar: ''
        },
        icon: 'ShieldCheck',
        path: '/admin/sentinel',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Monitor all platform bots and automation performance',
          ar: ''
        }
      },
      {
        id: 'admin-orders',
        title: {
          en: 'Orders',
          ar: ''
        },
        icon: 'Package',
        path: '/admin/orders',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'All system transactions and purchase orders',
          ar: ''
        }
      },
      {
        id: 'admin-payments',
        title: {
          en: 'Payments',
          ar: ''
        },
        icon: 'CreditCard',
        path: '/admin/payments',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Payment gateway logs, deposits, and payout releases',
          ar: ''
        }
      },
      {
        id: 'admin-commissions',
        title: {
          en: 'Commissions',
          ar: ''
        },
        icon: 'Percent',
        path: '/admin/commissions',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Platform service fees, escrow revenue, and referral payouts',
          ar: ''
        }
      },
      {
        id: 'admin-escrow',
        title: {
          en: 'Escrow',
          ar: ''
        },
        icon: 'Landmark',
        path: '/admin/escrow',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Escrow accounts balance, locked funds, and release approvals',
          ar: ''
        }
      },
      {
        id: 'admin-deliveries',
        title: {
          en: 'Deliveries',
          ar: ''
        },
        icon: 'Truck',
        path: '/admin/deliveries',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Monitor technical handover between seller and buyer',
          ar: ''
        }
      },
      {
        id: 'admin-disputes',
        title: {
          en: 'Disputes',
          ar: ''
        },
        icon: 'Scale',
        path: '/admin/disputes',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Arbitration for buyer-seller disputes and refund claims',
          ar: ''
        }
      },
      {
        id: 'admin-files',
        title: {
          en: 'Files',
          ar: ''
        },
        icon: 'Folder',
        path: '/admin/files',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'System file repository, contracts, and platform documentation',
          ar: ''
        }
      },
      {
        id: 'admin-reports',
        title: {
          en: 'Reports',
          ar: ''
        },
        icon: 'BarChart3',
        path: '/admin/reports',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Financial audits, marketplace health stats, and growth analytics',
          ar: ''
        }
      },
      {
        id: 'admin-categories',
        title: {
          en: 'Categories',
          ar: ''
        },
        icon: 'Grid',
        path: '/admin/categories',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Configure marketplace taxonomy, tech stacks, and tags',
          ar: ''
        }
      },
      {
        id: 'admin-settings',
        title: {
          en: 'Settings',
          ar: ''
        },
        icon: 'Sliders',
        path: '/admin/settings',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Global payment keys, fee rates, security policies, and integrations',
          ar: ''
        }
      }
    ]
  },
  {
    id: 'super_admin_chat_sec',
    sectionTitle: {
      en: 'Support & AI Bot',
      ar: 'الدعم الفني والآلي'
    },
    requiredRole: 'SUPER_ADMIN',
    items: [
      {
        id: 'admin-chat',
        title: {
          en: 'Live Chat & AI Bot',
          ar: 'Live Chat & AI Bot'
        },
        icon: 'MessageSquare',
        path: '/admin/chat',
        requiredRole: 'SUPER_ADMIN',
        description: {
          en: 'Manage visitor AI chat sessions, support tickets, and bot triggers',
          ar: ''
        }
      }
    ]
  }
];

// ==========================================
// 4. FUTURE / EXTENDED TOOLS CONFIG (Future Tools)
// ==========================================
export const FUTURE_TOOLS_CONFIG: SidebarSection[] = [
  {
    id: 'future_tools_section',
    sectionTitle: {
      en: 'Future Tools',
      ar: ''
    },
    requiredRole: 'ALL',
    items: [
      {
        id: 'contacts',
        title: {
          en: 'Contacts',
          ar: ''
        },
        icon: 'Users',
        path: '/contacts',
        requiredRole: 'ALL',
        description: {
          en: 'Clients, leads, suppliers, and company directory',
          ar: ''
        },
        subItems: [
          {
            id: 'add-client',
            title: { en: 'Add Client', ar: '' },
            path: '/contacts/clients/add',
            action: 'CREATE_CLIENT'
          },
          {
            id: 'client-list',
            title: { en: 'Client List', ar: '' },
            path: '/contacts/clients'
          },
          {
            id: 'add-lead',
            title: { en: 'Add Lead', ar: '' },
            path: '/contacts/leads/add',
            action: 'CREATE_LEAD'
          },
          {
            id: 'lead-list',
            title: { en: 'Lead List', ar: '' },
            path: '/contacts/leads'
          },
          {
            id: 'add-supplier',
            title: { en: 'Add Supplier', ar: '' },
            path: '/contacts/suppliers/add',
            action: 'CREATE_SUPPLIER'
          },
          {
            id: 'supplier-list',
            title: { en: 'Supplier List', ar: '' },
            path: '/contacts/suppliers'
          },
          {
            id: 'add-contact',
            title: { en: 'Add Contact', ar: '' },
            path: '/contacts/add',
            action: 'CREATE_CONTACT'
          },
          {
            id: 'contact-list',
            title: { en: 'Contact List', ar: '' },
            path: '/contacts/list'
          },
          {
            id: 'company-list',
            title: { en: 'Company List', ar: '' },
            path: '/contacts/companies'
          },
          {
            id: 'individual-list',
            title: { en: 'Individual List', ar: '' },
            path: '/contacts/individuals'
          },
          {
            id: 'duplicates-list',
            title: { en: 'Duplicates List', ar: '' },
            path: '/contacts/duplicates'
          },
          {
            id: 'company-directory',
            title: { en: 'Company Directory', ar: '' },
            path: '/contacts/directory'
          }
        ]
      },
      {
        id: 'suppliers',
        title: {
          en: 'Suppliers',
          ar: ''
        },
        icon: 'ShoppingCart',
        path: '/contacts/suppliers',
        requiredRole: 'ALL',
        description: {
          en: 'Vendor supplier directories and hardware/hosting partners',
          ar: ''
        }
      },
      {
        id: 'timetracking',
        title: {
          en: 'Time Tracking',
          ar: ''
        },
        icon: 'Clock',
        path: '/tools/time-tracking',
        requiredRole: 'ALL',
        description: {
          en: 'Log developer support hours and migration tasks',
          ar: ''
        }
      },
      {
        id: 'marketing',
        title: {
          en: 'Marketing',
          ar: ''
        },
        icon: 'Megaphone',
        path: '/tools/marketing',
        requiredRole: 'ALL',
        description: {
          en: 'Outreach campaigns and investor email newsletters',
          ar: ''
        }
      },
      {
        id: 'mail',
        title: {
          en: 'Mail',
          ar: ''
        },
        icon: 'Mail',
        path: '/tools/mail',
        requiredRole: 'ALL',
        description: {
          en: 'Internal communication inbox and mail sync',
          ar: ''
        }
      },
      {
        id: 'accounting',
        title: {
          en: 'Accounting',
          ar: ''
        },
        icon: 'Calculator',
        path: '/accounting',
        requiredRole: 'ALL',
        description: {
          en: 'General ledgers, balance sheets, and tax compliance',
          ar: ''
        }
      }
    ]
  }
];

// Combine all for default lookup if needed
export const SIDEBAR_CONFIG: SidebarSection[] = [
  ...MARKETPLACE_CONFIG,
  ...VENDOR_CENTER_CONFIG,
  ...SUPER_ADMIN_CONFIG,
  ...FUTURE_TOOLS_CONFIG
];
