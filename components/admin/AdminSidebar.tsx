import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Layers, 
  FileCheck, 
  Package, 
  CreditCard, 
  Percent, 
  Landmark, 
  Truck, 
  Scale, 
  Folder, 
  BarChart3, 
  Grid, 
  Sliders, 
  ShieldCheck, 
  LogOut, 
  ArrowLeft,
  MessageSquare,
  Wand2
} from 'lucide-react';

export type AdminTab = 
  | 'dashboard'
  | 'users'
  | 'sellers'
  | 'projects'
  | 'reviews'
  | 'custom-requests'
  | 'orders'
  | 'payments'
  | 'commissions'
  | 'escrow'
  | 'deliveries'
  | 'disputes'
  | 'files'
  | 'reports'
  | 'categories'
  | 'settings'
  | 'chat'
  | 'sentinel'
  // Compatibility Aliases
  | 'overview'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'all';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onBackToMarketplace: () => void;
  onLogoutAdmin: () => void;
  counts: {
    pending: number;
    sellers?: number;
    projects?: number;
    orders?: number;
    deliveries?: number;
    disputes?: number;
    customRequests?: number;
    openTickets?: number;
  };
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  onBackToMarketplace,
  onLogoutAdmin,
  counts
}) => {
  // Normalize tab for active state
  const normalizedTab = 
    activeTab === 'overview' ? 'dashboard' :
    activeTab === 'pending' ? 'reviews' :
    activeTab === 'approved' || activeTab === 'rejected' || activeTab === 'all' ? 'projects' :
    activeTab;

  const navItems: { id: AdminTab; label: string; icon: React.FC<any>; count?: number; badgeColor?: string }[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard 
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: Users 
    },
    { 
      id: 'sellers', 
      label: 'Sellers', 
      icon: UserCheck,
      count: counts.sellers,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    { 
      id: 'projects', 
      label: 'Projects', 
      icon: Layers,
      count: counts.projects,
      badgeColor: 'bg-stone-100 text-stone-800 border-stone-300'
    },
    { 
      id: 'reviews', 
      label: 'Project Review', 
      icon: FileCheck,
      count: counts.pending,
      badgeColor: counts.pending > 0 ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' : 'bg-gray-100 text-gray-600'
    },
    { 
      id: 'custom-requests', 
      label: 'Custom Builds (On-Demand)', 
      icon: Wand2,
      count: counts.customRequests,
      badgeColor: counts.customRequests && counts.customRequests > 0 ? 'bg-amber-400 text-amber-950 font-extrabold border-amber-500' : 'bg-stone-100 text-stone-800'
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: Package,
      count: counts.orders,
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    },
    { 
      id: 'payments', 
      label: 'Payments', 
      icon: CreditCard 
    },
    { 
      id: 'commissions', 
      label: 'Commissions', 
      icon: Percent 
    },
    { 
      id: 'escrow', 
      label: 'Escrow', 
      icon: Landmark 
    },
    { 
      id: 'deliveries', 
      label: 'Deliveries', 
      icon: Truck,
      count: counts.deliveries,
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300'
    },
    { 
      id: 'chat', 
      label: 'Live Chat & AI Bot', 
      icon: MessageSquare,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
    },
    { 
      id: 'sentinel', 
      label: 'AI Sentinel Hub', 
      icon: ShieldCheck 
    },
    { 
      id: 'disputes', 
      label: 'Disputes', 
      icon: Scale,
      count: counts.disputes,
      badgeColor: counts.disputes && counts.disputes > 0 ? 'bg-red-100 text-red-900 border-red-300 font-bold' : 'bg-gray-100 text-gray-600'
    },
    { 
      id: 'files', 
      label: 'Files', 
      icon: Folder 
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: BarChart3 
    },
    { 
      id: 'categories', 
      label: 'Categories', 
      icon: Grid 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Sliders 
    }
  ];

  return (
    <aside className="w-full lg:w-72 bg-white border border-[#E2DDD3] rounded-3xl p-5 space-y-6 shadow-sm shrink-0">
      {/* Navigation List */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = normalizedTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#2C2A26] text-[#F5F2EB] shadow-sm font-bold'
                  : 'text-[#5D5A53] hover:bg-[#F5F2EB] hover:text-[#2C2A26]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-[#8C8275]'}`} />
                <span>{item.label}</span>
              </div>

              {item.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Navigation & Security Logout */}
      <div className="pt-4 border-t border-[#E2DDD3] space-y-2">
        <button
          onClick={onBackToMarketplace}
          className="w-full py-2.5 px-3 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-[#E2DDD3]"
        >
          <ArrowLeft className="w-4 h-4 text-[#8C8275]" />
          <span>Exit to Marketplace</span>
        </button>

        <button
          onClick={onLogoutAdmin}
          className="w-full py-2 px-3 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-red-200"
        >
          <LogOut className="w-3.5 h-3.5 text-red-600" />
          <span>Lock Admin Console</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
