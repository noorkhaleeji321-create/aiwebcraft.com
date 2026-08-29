import { Listing } from '../types.js';

export const CATEGORIES_LIST = [
  { id: 'All', name: 'All Categories', icon: 'Sparkles', description: 'Explore all digital assets listed across categories' },
  { id: 'AI Tools', name: 'AI & Automation', icon: 'Bot', description: 'Generative AI suites, prompt copilots, and AI micro-SaaS' },
  { id: 'SaaS', name: 'B2B & B2C SaaS', icon: 'Cloud', description: 'Software-as-a-Service platforms with active subscriptions' },
  { id: 'E-commerce', name: 'E-commerce & Stores', icon: 'ShoppingBag', description: 'Turnkey Shopify stores, WooCommerce, dropshipping, & digital storefronts' },
  { id: 'Mobile Apps', name: 'Mobile Apps', icon: 'Smartphone', description: 'iOS and Android mobile apps with app store monetization' },
  { id: 'Digital Content', name: 'Content & Newsletters', icon: 'Newspaper', description: 'Monetized newsletters, digital media, & content blogs' },
  { id: 'Browser Extensions', name: 'Browser Extensions', icon: 'Globe', description: 'Chrome & Web extensions with recurring user bases' },
  { id: 'Websites', name: 'Websites & Portals', icon: 'Globe', description: 'Turnkey websites, digital tools, and web portals' }
];

// Clean empty array for production marketplace initial state
export const MOCK_LISTINGS: Listing[] = [];

export const POPULAR_TECH_TAGS = [
  'React',
  'TypeScript',
  'Node.js',
  'Tailwind',
  'Next.js',
  'Supabase',
  'Python',
  'OpenAI',
  'Stripe'
];

