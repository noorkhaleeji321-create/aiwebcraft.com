import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderPlus, 
  FolderKanban, 
  ArrowLeft, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  Users,
  Handshake,
  Files,
  CreditCard,
  BarChart3,
  User,
  Sparkles
} from 'lucide-react';
import { getPlatformCommissionPercentage, fetchPlatformCommissionPercentage } from '../../services/supabaseService.js';

export type SellerTab = 
  | 'dashboard'
  | 'my-projects'
  | 'add-project'
  | 'sales'
  | 'buyers'
  | 'offers'
  | 'deliveries'
  | 'files'
  | 'earnings'
  | 'reports'
  | 'account';

interface SellerSidebarProps {
  activeTab: SellerTab;
  onTabChange: (tab: SellerTab) => void;
  onBackToMarketplace: () => void;
  counts: {
    total: number;
    pending: number;
    approved: number;
    drafts: number;
    sold: number;
    deliveries?: number;
    offers?: number;
  };
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({
  activeTab,
  onTabChange,
  onBackToMarketplace,
  counts
}) => {
  const [commissionPct, setCommissionPct] = useState(getPlatformCommissionPercentage());

  useEffect(() => {
    fetchPlatformCommissionPercentage().then((val) => {
      if (typeof val === 'number') setCommissionPct(val);
    }).catch(() => {});

    const handleChanged = () => {
      setCommissionPct(getPlatformCommissionPercentage());
    };
    window.addEventListener('commission_rate_changed', handleChanged);
    window.addEventListener('aiwebcrafter_commission_updated', handleChanged);
    return () => {
      window.removeEventListener('commission_rate_changed', handleChanged);
      window.removeEventListener('aiwebcrafter_commission_updated', handleChanged);
    };
  }, []);
  const menuItems: { id: SellerTab; label: string; icon: React.FC<any>; count?: number; badgeColor?: string; isSpecial?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'my-projects',
      label: 'My Projects',
      icon: FolderKanban,
      count: counts.total,
      badgeColor: 'bg-[#EAE5D9] text-[#2C2A26]'
    },
    {
      id: 'add-project',
      label: '+ Add Project',
      icon: FolderPlus,
      isSpecial: true
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: TrendingUp,
      count: counts.sold > 0 ? counts.sold : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-200'
    },
    {
      id: 'buyers',
      label: 'Buyers',
      icon: Users
    },
    {
      id: 'offers',
      label: 'Offers',
      icon: Handshake,
      count: counts.offers,
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-200'
    },
    {
      id: 'deliveries',
      label: 'Delivery & Ownership',
      icon: ShieldCheck,
      count: counts.deliveries,
      badgeColor: 'bg-blue-100 text-blue-900 border border-blue-200'
    },
    {
      id: 'files',
      label: 'Files & Vault',
      icon: Files
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: CreditCard
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3
    },
    {
      id: 'account',
      label: 'Account',
      icon: User
    }
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border border-[#E2DDD3] rounded-3xl p-5 space-y-6 shadow-sm shrink-0">
      {/* Back to Marketplace Link */}
      <button
        onClick={onBackToMarketplace}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] rounded-xl text-xs font-semibold transition-all border border-[#E2DDD3]"
      >
        <div className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4 text-[#8C8275]" />
          <span>Exit to Marketplace</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-[#8C8275]" />
      </button>

      {/* Seller Identity Header Card */}
      <div className="p-3.5 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl flex items-center gap-3">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"
            alt="Seller Avatar"
            className="w-11 h-11 rounded-xl object-cover border border-[#E2DDD3]"
            referrerPolicy="no-referrer"
          />
          <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-3.5 h-3.5 rounded-full" title="Active Seller" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-serif font-bold text-sm text-[#2C2A26] truncate">
            Youssef El Amrani
          </h4>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Seller</span>
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-1.5 text-xs font-semibold">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#2C2A26] text-[#F5F2EB] shadow-sm font-bold'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 font-bold'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-amber-600" />
                  <span>{item.label}</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#2C2A26] text-[#F5F2EB] shadow-sm font-bold'
                  : 'text-[#5D5A53] hover:bg-[#F5F2EB] hover:text-[#2C2A26]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              
              {item.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-[#EAE5D9] text-[#2C2A26]'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Seller Promo Box */}
      <div className="p-4 bg-emerald-950 text-emerald-100 rounded-2xl space-y-2.5 border border-emerald-800 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{commissionPct}% Platform Commission</span>
        </div>
        <p className="text-[11px] text-emerald-200 leading-relaxed">
          List your SaaS or digital business with clear {commissionPct}% platform fee on deal completion. Get direct buyer leads and verified escrow closing.
        </p>
      </div>
    </aside>
  );
};

export default SellerSidebar;
