import React from 'react';
import {
  LayoutDashboard,
  Database,
  Package,
  Image as ImageIcon,
  FolderTree,
  ShoppingBag,
  Users,
  KeyRound,
  ShieldAlert,
  Archive,
  RotateCcw,
  Gauge,
  ListRestart,
  Settings,
  Sparkles
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../locales/translations';

export type SectionKey =
  | 'overview'
  | 'database'
  | 'products'
  | 'media'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'api'
  | 'encryption'
  | 'backup'
  | 'restore'
  | 'storage_monitor'
  | 'logs'
  | 'settings';

interface SidebarProps {
  currentSection: SectionKey;
  onSelectSection: (key: SectionKey) => void;
  lang: Language;
  productsCount: number;
  ordersCount: number;
  storeName?: string;
  storeUrl?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  lang,
  productsCount,
  ordersCount,
  storeName = 'Natural Health Morocco',
  storeUrl = 'https://natural-health-morocco.vercel.app'
}) => {
  const t = TRANSLATIONS[lang];

  const navItems: { key: SectionKey; label: string; icon: React.FC<{ className?: string }>; badge?: string | number; group: string }[] = [
    { key: 'overview', label: t.sections.overview, icon: LayoutDashboard, group: 'core' },
    { key: 'database', label: t.sections.database, icon: Database, group: 'core' },
    { key: 'products', label: t.sections.products, icon: Package, badge: productsCount, group: 'catalog' },
    { key: 'media', label: t.sections.media, icon: ImageIcon, group: 'catalog' },
    { key: 'categories', label: t.sections.categories, icon: FolderTree, group: 'catalog' },
    { key: 'orders', label: t.sections.orders, icon: ShoppingBag, badge: ordersCount, group: 'commerce' },
    { key: 'customers', label: t.sections.customers, icon: Users, group: 'commerce' },
    { key: 'api', label: t.sections.api, icon: KeyRound, group: 'security' },
    { key: 'encryption', label: t.sections.encryption, icon: ShieldAlert, group: 'security' },
    { key: 'backup', label: t.sections.backup, icon: Archive, group: 'maintenance' },
    { key: 'restore', label: t.sections.restore, icon: RotateCcw, group: 'maintenance' },
    { key: 'storage_monitor', label: t.sections.storage_monitor, icon: Gauge, group: 'maintenance' },
    { key: 'logs', label: t.sections.logs, icon: ListRestart, group: 'maintenance' },
    { key: 'settings', label: t.sections.settings, icon: Settings, group: 'system' }
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#0A0D17] border-r border-slate-800/80 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none overflow-y-auto">
      <div className="p-3 space-y-1">
        {/* Connection Indicator - Phase 4H.1 Fix */}
        <div className="mb-3 px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center justify-between text-slate-300 font-medium mb-1">
            <span className="uppercase tracking-tight text-[9px] font-bold">Connected External Store Identity</span>
            <span className="text-emerald-400 font-mono text-[10px]">Active API</span>
          </div>
          <div className="font-semibold text-white truncate" title={storeName}>
            {storeName}
          </div>
          <div className="text-[10px] text-purple-300/80 font-mono truncate mt-0.5" title={storeUrl}>
            {storeUrl}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentSection === item.key;
            const IconComponent = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => onSelectSection(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer group text-left ${
                  isActive
                    ? 'bg-purple-600/15 text-purple-200 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconComponent
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md shrink-0 ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Zero Cost Permanent Storage Widget */}
      <div className="p-3 m-3 rounded-lg bg-gradient-to-b from-slate-900/90 to-purple-950/20 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Strict Zero-Cost Tier</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
          Permanent Zero-Cost Architecture. Zero MAD expense policy enforced.
        </p>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full w-[4%]" />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
          <span>Usage: 4.2 MB</span>
          <span>Max: 10 GB</span>
        </div>
      </div>
    </aside>
  );
};
