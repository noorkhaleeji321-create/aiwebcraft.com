import { Category, Product, Customer, Order, OrderItem, StoreSetting, ApiKey, StoredMediaFile, ActivityLog } from '../types';

export const SEED_CATEGORIES: Category[] = [
  {
    id: 1,
    name: "Moroccan Artisanal Crafts",
    name_ar: "الصناعة التقليدية المغربية",
    slug: "moroccan-artisanal-crafts",
    parent_id: null,
    description: "Authentic handmade pottery, ceramics, lanterns, and brass decor from Fez and Marrakech.",
    icon: "Sparkles",
    sort_order: 1
  },
  {
    id: 2,
    name: "Organic Argan & Cosmetics",
    name_ar: "زيت الأركان العضوي ومستحضرات التجميل",
    slug: "organic-argan-cosmetics",
    parent_id: null,
    description: "Pure cold-pressed bio-certified cosmetic argan oil, black soap, and ghassoul clay.",
    icon: "Droplets",
    sort_order: 2
  },
  {
    id: 3,
    name: "Handmade Leather Goods",
    name_ar: "المنتجات الجلدية الطبيعية",
    slug: "handmade-leather-goods",
    parent_id: null,
    description: "Full-grain goat and cow leather bags, babouches slippers, and travel goods crafted in Chouara tanneries.",
    icon: "Briefcase",
    sort_order: 3
  }
];

export const INITIAL_MEDIA_FILES: StoredMediaFile[] = [];

export const SEED_PRODUCTS: Product[] = [];

export const SEED_CUSTOMERS: Customer[] = [];

export const SEED_ORDERS: Order[] = [];

export const SEED_STORE_SETTINGS: StoreSetting[] = [
  { key: "store_name", value: "Natural Health Morocco", category: "general", updated_at: "2026-10-01" },
  { key: "store_url", value: "https://natural-health-morocco.vercel.app", category: "general", updated_at: "2026-10-01" },
  { key: "default_currency", value: "MAD", category: "localization", updated_at: "2026-10-01" },
  { key: "supported_currencies", value: "MAD, EUR, USD", category: "localization", updated_at: "2026-10-01" },
  { key: "default_language", value: "ar", category: "localization", updated_at: "2026-10-01" },
  { key: "database_provider", value: "SQLite3 / Permanent Relational (Zero Cost)", category: "security", updated_at: "2026-10-01" },
  { key: "object_storage_provider", value: "Permanent Media Storage (Zero Cost)", category: "security", updated_at: "2026-10-01" },
  { key: "encryption_standard", value: "AES-256-GCM + PBKDF2 Web Crypto", category: "security", updated_at: "2026-10-01" },
  { key: "api_rate_limit_per_minute", value: "120", category: "api", updated_at: "2026-10-01" }
];

export const SEED_API_KEYS: ApiKey[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];

