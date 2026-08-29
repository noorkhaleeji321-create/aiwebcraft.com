import { PremiumLogo } from "./PremiumLogo";
import React, { useState } from 'react';
import { 
  Sparkles, 
  Heart, 
  Menu, 
  X, 
  ShieldCheck, 
  Search, 
  Store, 
  Grid, 
  LayoutDashboard, 
  Users, 
  Target, 
  FileText, 
  ShoppingCart, 
  Landmark, 
  BookOpen, 
  Wallet, 
  Calculator, 
  BarChart3, 
  Folder,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Mail,
  Clock,
  Megaphone,
  Edit3,
  Crown,
  Briefcase,
  ShoppingBag,
  Sliders,
  PlusCircle,
  ListFilter,
  UserPlus,
  Building,
  User,
  Copy,
  Globe,
  Settings,
  Package,
  MessageSquare,
  Layers,
  BadgeDollarSign,
  Handshake,
  Truck,
  FileCheck,
  CreditCard,
  Percent,
  Scale,
  Wand2,
  Headphones,
  LucideIcon
} from 'lucide-react';
import { 
  SUPER_ADMIN_CONFIG, 
  ON_DEMAND_CONFIG,
  VENDOR_CENTER_CONFIG, 
  MARKETPLACE_CONFIG, 
  FUTURE_TOOLS_CONFIG,
  SidebarItem, 
  SidebarSubItem, 
  UserRole 
} from '../sidebarConfig.js';
import { Language } from '../types.js';
import { useTranslation } from '../src/context/I18nContext.js';
import { getCurrentLoggedInEmail } from '../services/sellerStore.js';

export type { UserRole };

interface SidebarNavProps {
  activeView: string;
  activeSubTab?: string;
  userRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onNavigate: (viewType: any, targetSection?: string) => void;
  savedCount: number;
  onOpenAccountModal: () => void;
  onOpenSearchModal?: () => void;
  onContactAdmin?: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  filters?: any;
  onFilterChange?: (updated: any) => void;
  onResetFilters?: () => void;
}

// Icon resolver map
const iconMap: Record<string, LucideIcon> = {
  Store,
  Grid,
  TrendingUp,
  ShieldCheck,
  Heart,
  LayoutDashboard,
  Users,
  Target,
  FileText,
  ShoppingCart,
  Landmark,
  BookOpen,
  Wallet,
  Calculator,
  BarChart3,
  Folder,
  Mail,
  Clock,
  Megaphone,
  Edit3,
  Globe,
  UserCheck,
  Sliders,
  Settings,
  Package,
  MessageSquare,
  User,
  Layers,
  PlusCircle,
  BadgeDollarSign,
  Handshake,
  Truck,
  FileCheck,
  CreditCard,
  Percent,
  Scale,
  Crown,
  Headphones
};

// Sub-item specific icon helper
const getSubItemIcon = (id: string): LucideIcon => {
  if (id.includes('add')) return PlusCircle;
  if (id.includes('company') || id.includes('directory')) return Building;
  if (id.includes('individual')) return User;
  if (id.includes('duplicates')) return Copy;
  if (id.includes('lead')) return UserPlus;
  return ListFilter;
};

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeView,
  activeSubTab,
  userRole = 'SUPER_ADMIN',
  onRoleChange,
  onNavigate,
  savedCount,
  onOpenAccountModal,
  onOpenSearchModal,
  onContactAdmin,
  language,
  onLanguageChange,
  filters,
  onFilterChange,
  onResetFilters
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Default to collapsed so the user sees a compact sidebar until they click to expand it
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string>('contacts');
  const [activeSubItemId, setActiveSubItemId] = useState<string | null>('contact-list');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { t } = useTranslation();

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const loadProfilePhoto = () => {
    try {
      const email = getCurrentLoggedInEmail();
      const storageKey = `aiwebcrafter_profile_${email || 'guest'}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.photoUrl) {
          setProfilePhoto(parsed.photoUrl);
          return;
        }
      }
    } catch {}
    setProfilePhoto(null);
  };

  React.useEffect(() => {
    loadProfilePhoto();
    
    // Sync instantly when user saves profile edits
    window.addEventListener('profile-updated', loadProfilePhoto);
    window.addEventListener('direct-chats-updated', loadProfilePhoto);
    return () => {
      window.removeEventListener('profile-updated', loadProfilePhoto);
      window.removeEventListener('direct-chats-updated', loadProfilePhoto);
    };
  }, []);

  // Selected Active Workspace Mode: 'ADMIN' | 'ON_DEMAND' | 'VENDOR' | 'MARKETPLACE'
  const [activeWorkspace, setActiveWorkspace] = useState<'ADMIN' | 'ON_DEMAND' | 'VENDOR' | 'MARKETPLACE'>(
    userRole === 'SUPER_ADMIN' ? 'ADMIN' : 'MARKETPLACE'
  );

  // Sync workspace automatically when activeView changes
  React.useEffect(() => {
    if (activeView === 'admin') {
      setActiveWorkspace('ADMIN');
    } else if (activeView === 'on-demand') {
      setActiveWorkspace('ON_DEMAND');
    } else if (activeView === 'sell') {
      setActiveWorkspace('VENDOR');
    } else {
      setActiveWorkspace('MARKETPLACE');
    }
  }, [activeView]);

  // Compute active item ID dynamically based on view and sub-tab
  const computedActiveItemId = React.useMemo(() => {
    if (activeView === 'home') {
      return activeSubTab || 'marketplace';
    } else if (activeView === 'saved') {
      return 'saved';
    } else if (activeView === 'on-demand') {
      return 'on-demand-create';
    } else if (activeView === 'sell') {
      return activeSubTab || 'vendor-dashboard';
    } else if (activeView === 'admin') {
      return activeSubTab || 'admin-dashboard';
    } else if (activeView === 'buyer-purchases') {
      return 'buyer-purchases';
    } else if (activeView === 'buyer-orders') {
      return 'buyer-orders';
    } else if (activeView === 'buyer-messages') {
      return 'buyer-messages';
    } else if (activeView === 'buyer-account') {
      return 'buyer-account';
    } else if (activeView === 'categories') {
      return 'categories';
    }
    return activeItemId;
  }, [activeView, activeSubTab, activeItemId]);

  // Accordion state for expanded mode
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    contacts: true // Expand Contacts module by default
  });

  // Floating flyout menu state for collapsed mode
  const [activeFlyoutId, setActiveFlyoutId] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleWorkspaceChange = (workspace: 'ADMIN' | 'ON_DEMAND' | 'VENDOR' | 'MARKETPLACE') => {
    setActiveWorkspace(workspace);
    if (workspace === 'ADMIN') {
      if (onRoleChange) onRoleChange('SUPER_ADMIN');
      onNavigate('admin');
    } else if (workspace === 'ON_DEMAND') {
      if (onRoleChange) onRoleChange('BUYER');
      onNavigate('on-demand');
    } else if (workspace === 'VENDOR') {
      if (onRoleChange) onRoleChange('VENDOR');
      onNavigate('sell');
    } else {
      if (onRoleChange) onRoleChange('BUYER');
      onNavigate('home', 'marketplace');
    }
  };

  const handleItemNavigation = (item: SidebarItem) => {
    setActiveItemId(item.id);

    if (item.id === 'contact-admin') {
      if (onContactAdmin) {
        onContactAdmin();
      } else {
        window.dispatchEvent(new CustomEvent('open-contact-admin'));
      }
      setMobileOpen(false);
      return;
    } else if (item.id === 'marketplace') {
      onNavigate('home', 'marketplace');
    } else if (item.id === 'categories') {
      onNavigate('categories');
    } else if (item.id === 'saved') {
      onNavigate('saved');
    } else if (item.id === 'on-demand-create' || item.id === 'on-demand') {
      onNavigate('on-demand');
    } else if (item.id === 'buyer-purchases') {
      onNavigate('buyer-purchases');
    } else if (item.id === 'buyer-orders') {
      onNavigate('buyer-orders');
    } else if (item.id === 'buyer-messages') {
      onNavigate('buyer-messages');
    } else if (item.id === 'buyer-account') {
      onNavigate('buyer-account');
    } else if (item.id === 'vendor-account') {
      onNavigate('sell', 'vendor-account');
    } else if (item.id === 'sell' || item.id === 'files-vault' || item.id.startsWith('vendor-')) {
      onNavigate('sell', item.id);
    } else if (item.id.startsWith('admin-') || activeWorkspace === 'ADMIN') {
      onNavigate('admin', item.id);
    } else {
      onNavigate('home', item.id);
    }
    setMobileOpen(false);
  };

  const handleSubItemClick = (subItem: SidebarSubItem, parentItem: SidebarItem) => {
    setActiveItemId(parentItem.id);
    setActiveSubItemId(subItem.id);
    setActiveFlyoutId(null);
    setMobileOpen(false);

    if (subItem.action === 'CREATE_CLIENT' || subItem.action === 'CREATE_CONTACT' || subItem.action === 'CREATE_LEAD' || subItem.action === 'CREATE_SUPPLIER') {
      onOpenAccountModal();
    } else {
      onNavigate('sell', subItem.id);
    }
  };

  // Render an individual sidebar item
  const renderSidebarItem = (item: SidebarItem, collapsed: boolean) => {
    const Icon = iconMap[item.icon] || Store;
    const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
    const isAccordionOpen = Boolean(expandedAccordions[item.id]);
    const isItemSelected = computedActiveItemId === item.id;
    const isFlyoutOpen = activeFlyoutId === item.id;

    let badgeText = item.badge?.text;
    let badgeColor = item.badge?.color;
    let counterVal = item.counter;

    if (item.id === 'saved') {
      counterVal = savedCount > 0 ? savedCount : 1;
    }

    const tooltipText = `${item.title.ar} (${item.title.en})`;

    return (
      <div
        key={item.id}
        className="relative group"
        onMouseEnter={() => {
          if (collapsed && hasSubItems) {
            setActiveFlyoutId(item.id);
          }
        }}
        onMouseLeave={() => {
          if (collapsed && hasSubItems) {
            setActiveFlyoutId(null);
          }
        }}
      >
        <button
          onClick={() => {
            if (hasSubItems && !collapsed) {
              toggleAccordion(item.id);
            } else if (hasSubItems && collapsed) {
              setActiveFlyoutId(isFlyoutOpen ? null : item.id);
            } else {
              handleItemNavigation(item);
            }
          }}
          title={collapsed ? tooltipText : undefined}
          className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all group relative ${
            collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
          } ${
            isItemSelected
              ? 'bg-[#2C2A26] text-[#F5F2EB]'
              : 'text-[#5D5A53] hover:bg-[#EAE5D9] hover:text-[#2C2A26]'
          }`}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
            <Icon
              className={`w-4 h-4 shrink-0 ${
                isItemSelected
                  ? 'text-amber-300'
                  : activeWorkspace === 'ADMIN'
                  ? 'text-amber-600'
                  : 'text-[#8C8275] group-hover:text-[#2C2A26]'
              } ${item.id === 'saved' && counterVal && counterVal > 0 ? 'fill-red-500 text-red-500' : ''}`}
            />
            {!collapsed && (
              <div className="flex flex-col text-left min-w-0">
                <span className="truncate font-sans font-bold leading-tight">{item.title.ar}</span>
                <span className="text-[10px] text-[#8C8275] group-hover:text-[#5D5A53] font-normal truncate">
                  {item.title.en}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="flex items-center gap-1.5 shrink-0">
              {badgeText && (
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                  {badgeText}
                </span>
              )}

              {counterVal !== undefined && counterVal > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-amber-950">
                  {counterVal}
                </span>
              )}

              {hasSubItems && (
                <span className="text-[#8C8275] group-hover:text-[#2C2A26] transition-transform">
                  {isAccordionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              )}
            </div>
          )}

          {/* Collapsed Badge Indicators */}
          {collapsed && counterVal !== undefined && counterVal > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-[#F5F2EB]" />
          )}
          {collapsed && badgeText && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
          )}
          {collapsed && hasSubItems && (
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#8C8275]" />
          )}
        </button>

        {/* EXPANDED ACCORDION SUB-ITEMS DROPDOWN */}
        {!collapsed && hasSubItems && isAccordionOpen && (
          <div className="mt-1 ml-3 pl-3 border-l-2 border-[#D6D1C7] space-y-1 py-1 animate-fade-in">
            {item.subItems?.map((sub) => {
              const SubIcon = getSubItemIcon(sub.id);
              const isSubSelected = activeSubItemId === sub.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => handleSubItemClick(sub, item)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-all ${
                    isSubSelected
                      ? 'bg-[#EAE5D9] text-[#2C2A26] font-bold border-r-2 border-amber-600'
                      : 'text-[#5D5A53] hover:bg-[#EAE5D9]/60 hover:text-[#2C2A26]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <SubIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="truncate">{sub.title.ar}</span>
                  </div>
                  <span className="text-[9px] text-[#8C8275] font-normal truncate ml-1">{sub.title.en}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* COLLAPSED FLOATING FLYOUT PANEL (SELLSY STYLE) */}
        {collapsed && hasSubItems && isFlyoutOpen && (
          <div className="absolute left-full top-0 ml-2 w-64 bg-[#F5F2EB] border border-[#E2DDD3] rounded-2xl2xl p-3 z-50 space-y-2 animate-fade-in">
            <div className="pb-2 border-b border-[#E2DDD3] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-[#2C2A26]">{item.title.ar}</h4>
                <p className="text-[10px] text-[#8C8275]">{item.title.en}</p>
              </div>
              <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                {item.subItems?.length} items
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {item.subItems?.map((sub) => {
                const SubIcon = getSubItemIcon(sub.id);
                const isSubSelected = activeSubItemId === sub.id;

                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSubItemClick(sub, item)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium text-left transition-all ${
                      isSubSelected
                        ? 'bg-[#2C2A26] text-[#F5F2EB]'
                        : 'text-[#5D5A53] hover:bg-[#EAE5D9] hover:text-[#2C2A26]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <SubIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{sub.title.ar}</span>
                    </div>
                    <span className="text-[9px] opacity-75 truncate">{sub.title.en}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const activeSectionConfig = 
    activeWorkspace === 'ADMIN'
      ? SUPER_ADMIN_CONFIG
      : activeWorkspace === 'ON_DEMAND'
      ? ON_DEMAND_CONFIG
      : activeWorkspace === 'VENDOR'
      ? VENDOR_CENTER_CONFIG
      : MARKETPLACE_CONFIG;

  const renderSidebarContent = (collapsed: boolean) => (
    <div className={`flex flex-col h-full py-4 space-y-4 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'} transition-all duration-300`}>
      {/* HEADER: BRAND LOGO & TOGGLE BUTTON */}
      <div className={`pb-3 border-b border-[#E2DDD3] flex items-center justify-between relative ${collapsed ? 'flex-col gap-3' : ''}`}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleWorkspaceChange('MARKETPLACE');
          }}
          className="flex items-center gap-2.5 group min-w-0"
          id="sidebar-brand-logo"
          title="AIWebCrafter - DIGITAL MARKETPLACE"
        >
          <PremiumLogo className="w-9 h-9 group-hover:scale-105 transition-transform duration-200" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-serif font-bold tracking-tight text-[#2C2A26] leading-tight truncate">
                AIWeb<span className="text-[#D97706]">Crafter</span>
              </span>
              <span className="text-[8px] tracking-widest uppercase font-semibold text-[#8C8275] truncate animate-shine">
                DIGITAL MARKETPLACE
              </span>
            </div>
          )}
        </a>

        {/* COLLAPSE / EXPAND TOGGLE BUTTON */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-xl bg-[#EAE5D9] hover:bg-[#2C2A26] text-[#5D5A53] hover:text-[#F5F2EB] border border-[#D6D1C7] transition-all shrink-0"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          id="sidebar-toggle-btn"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* SYSTEM / WORKSPACE SWITCHER CONTROLLER (SEPARATED INDIVIDUAL CARDS) */}
      <div className="space-y-2">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#8C8275] uppercase tracking-wider px-1">
              <span>System Workspaces</span>
              <Sliders className="w-3.5 h-3.5 text-[#8C8275]" />
            </div>

            {/* 1. SUPER ADMIN BOX */}
            {userRole === 'SUPER_ADMIN' && (
              <div className="bg-[#2C2A26] text-[#F5F2EB] p-2 rounded-2xl border border-amber-900/30">
                <button
                  onClick={() => handleWorkspaceChange('ADMIN')}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-xs font-bold ${
                    activeWorkspace === 'ADMIN'
                      ? 'bg-amber-500 text-amber-950 border-amber-300 font-extrabold ring-1 ring-amber-300'
                      : 'bg-[#1E1D1A] text-amber-100/80 border-white/10 hover:bg-[#282622] hover:border-amber-500/40'
                  }`}
                  title="Super Admin Panel"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${activeWorkspace === 'ADMIN' ? 'bg-amber-950/20 text-amber-950' : 'bg-white/5 text-amber-400'}`}>
                      <Crown className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="truncate leading-tight">Super Admin</span>
                      <span className={`text-[9px] font-normal truncate ${activeWorkspace === 'ADMIN' ? 'text-amber-950/80' : 'text-amber-200/50'}`}>
                        Management
                      </span>
                    </div>
                  </div>
                  {activeWorkspace === 'ADMIN' && (
                    <span className="w-2 h-2 rounded-full bg-amber-950 animate-pulse shrink-0 mr-1" />
                  )}
                </button>
              </div>
            )}

            {/* 2. ON-DEMAND CUSTOM BUILD BOX */}
            <div className="bg-[#2C2A26] text-[#F5F2EB] p-2 rounded-2xl border border-amber-900/30">
              <button
                onClick={() => handleWorkspaceChange('ON_DEMAND')}
                className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-xs font-bold ${
                  activeWorkspace === 'ON_DEMAND'
                    ? 'bg-amber-500 text-amber-950 border-amber-300 font-extrabold ring-1 ring-amber-300'
                    : 'bg-[#1E1D1A] text-amber-100/80 border-white/10 hover:bg-[#282622] hover:border-amber-500/40'
                }`}
                title="On-Demand Custom Build"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${activeWorkspace === 'ON_DEMAND' ? 'bg-amber-950/20 text-amber-950' : 'bg-white/5 text-amber-400'}`}>
                    <Wand2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="truncate leading-tight">Custom Build</span>
                    <span className={`text-[9px] font-normal truncate ${activeWorkspace === 'ON_DEMAND' ? 'text-amber-950/80' : 'text-amber-200/50'}`}>
                      On-Demand Projects
                    </span>
                  </div>
                </div>
                {activeWorkspace === 'ON_DEMAND' && (
                  <span className="w-2 h-2 rounded-full bg-amber-950 animate-pulse shrink-0 mr-1" />
                )}
              </button>
            </div>

            {/* 3. MARKETPLACE BOX */}
            <div className="bg-[#2C2A26] text-[#F5F2EB] p-2 rounded-2xl border border-amber-900/30">
              <button
                onClick={() => handleWorkspaceChange('MARKETPLACE')}
                className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-xs font-bold ${
                  activeWorkspace === 'MARKETPLACE'
                    ? 'bg-amber-500 text-amber-950 border-amber-300 font-extrabold ring-1 ring-amber-300'
                    : 'bg-[#1E1D1A] text-amber-100/80 border-white/10 hover:bg-[#282622] hover:border-amber-500/40'
                }`}
                title="Marketplace Buyer View"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${activeWorkspace === 'MARKETPLACE' ? 'bg-amber-950/20 text-amber-950' : 'bg-white/5 text-amber-400'}`}>
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="truncate leading-tight">Marketplace</span>
                    <span className={`text-[9px] font-normal truncate ${activeWorkspace === 'MARKETPLACE' ? 'text-amber-950/80' : 'text-amber-200/50'}`}>
                      Marketplace
                    </span>
                  </div>
                </div>
                {activeWorkspace === 'MARKETPLACE' && (
                  <span className="w-2 h-2 rounded-full bg-amber-950 animate-pulse shrink-0 mr-1" />
                )}
              </button>
            </div>

          </div>
        ) : (
          /* COLLAPSED WORKSPACE ICON SWITCHER WITH SEPARATED BOXES */
          <div className="flex flex-col gap-1.5 p-1.5 bg-[#2C2A26] rounded-2xl border border-white/10">
            {userRole === 'SUPER_ADMIN' && (
              <button
                onClick={() => handleWorkspaceChange('ADMIN')}
                className={`p-2 rounded-xl flex justify-center border transition-all ${
                  activeWorkspace === 'ADMIN'
                    ? 'bg-amber-500 text-amber-950 border-amber-300'
                    : 'bg-[#1E1D1A] text-amber-200 border-white/10 hover:bg-[#282622]'
                }`}
                title="Super Admin View"
              >
                <Crown className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleWorkspaceChange('ON_DEMAND')}
              className={`p-2 rounded-xl flex justify-center border transition-all ${
                activeWorkspace === 'ON_DEMAND'
                  ? 'bg-amber-500 text-amber-950 border-amber-300'
                  : 'bg-[#1E1D1A] text-amber-200 border-white/10 hover:bg-[#282622]'
              }`}
              title="On-Demand Custom Build"
            >
              <Wand2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleWorkspaceChange('MARKETPLACE')}
              className={`p-2 rounded-xl flex justify-center border transition-all ${
                activeWorkspace === 'MARKETPLACE'
                  ? 'bg-amber-500 text-amber-950 border-amber-300'
                  : 'bg-[#1E1D1A] text-amber-200 border-white/10 hover:bg-[#282622]'
              }`}
              title="Marketplace View"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* DYNAMICALLY RENDERED SECTIONS BASED ON ACTIVE WORKSPACE */}
      <div className="flex-1 space-y-4">
        {activeSectionConfig.map((section) => (
          <div key={section.id} className="space-y-1 pt-2 border-t border-[#E2DDD3] first:border-0 first:pt-0">
            {!collapsed ? (
              <div className="px-3 text-[10px] font-bold text-[#8C8275] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>{section.sectionTitle.ar}</span>
                <span className="text-[9px] text-[#5D5A53] font-mono">{section.sectionTitle.en}</span>
              </div>
            ) : (
              <div className="w-full text-center py-1">
                <div className="w-4 h-0.5 bg-[#D6D1C7] mx-auto rounded-full" title={section.sectionTitle.en} />
              </div>
            )}

            <div className="space-y-1">
              {section.items.map((item) => renderSidebarItem(item, collapsed))}
            </div>
          </div>
        ))}

        {/* Collapsible Marketplace Filters Section */}
        {activeWorkspace === 'MARKETPLACE' && filters && onFilterChange && onResetFilters && !collapsed && (
          <div className="pt-2 border-t border-[#E2DDD3] space-y-3 px-3">
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="w-full flex items-center justify-between py-1 px-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8C8275] hover:text-[#2C2A26] transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-700" />
                <span>Filters & Sort</span>
              </div>
              <span className="text-[9px] font-semibold">
                {isFiltersExpanded ? 'Collapse' : 'Expand'}
              </span>
            </button>

            {isFiltersExpanded && (
              <div className="space-y-3 mt-1.5 max-h-[300px] overflow-y-auto pr-1">
                {/* Sort By select */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Sort By</span>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
                    className="w-full bg-white border border-[#E2DDD3] text-[#2C2A26] text-[11px] rounded-lg p-1.5 font-medium focus:outline-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="revenue-high">Revenue: High to Low</option>
                    <option value="profit-high">Profit: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {/* Min Monthly Revenue presets */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Min. Revenue</span>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { label: 'Any', value: null },
                      { label: '$1K+', value: 1000 },
                      { label: '$3K+', value: 3000 },
                      { label: '$5K+', value: 5000 }
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => onFilterChange({ minRevenue: preset.value })}
                        className={`py-1 text-[10px] font-medium rounded border text-center transition-all ${
                          filters.minRevenue === preset.value
                            ? 'bg-[#2C2A26] text-[#F5F2EB] border-[#2C2A26]'
                            : 'bg-white text-[#2C2A26] border-[#E2DDD3] hover:border-[#2C2A26]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Asking Price Range */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Price Range ($)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice !== null ? filters.minPrice : ''}
                      onChange={(e) =>
                        onFilterChange({
                          minPrice: e.target.value ? Number(e.target.value) : null
                        })
                      }
                      className="w-1/2 bg-white border border-[#E2DDD3] text-[#2C2A26] text-[10px] rounded-lg p-1 focus:outline-none"
                    />
                    <span className="text-[10px] text-[#8C8275]">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice !== null ? filters.maxPrice : ''}
                      onChange={(e) =>
                        onFilterChange({
                          maxPrice: e.target.value ? Number(e.target.value) : null
                        })
                      }
                      className="w-1/2 bg-white border border-[#E2DDD3] text-[#2C2A26] text-[10px] rounded-lg p-1 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Verified Sellers toggle */}
                <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg bg-white border border-[#E2DDD3] hover:border-[#2C2A26] transition-all">
                  <span className="text-[10px] font-bold text-[#2C2A26]">Verified Only</span>
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => onFilterChange({ verifiedOnly: e.target.checked })}
                    className="w-3.5 h-3.5 accent-[#2C2A26]"
                  />
                </label>

                {/* Reset button */}
                <button
                  onClick={onResetFilters}
                  className="w-full py-1 bg-[#FAF8F5] border border-[#E2DDD3] hover:border-[#2C2A26] text-[#8C8275] hover:text-[#2C2A26] text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all"
                >
                  <span>Reset Filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER SECTION: ACCOUNT & PORTAL */}
      <div className="pt-3 border-t border-[#E2DDD3] space-y-2">
        {/* LANGUAGE SWITCHER */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className={`w-full flex items-center p-2.5 rounded-2xl bg-white border border-[#E2DDD3] hover:border-[#2C2A26] text-xs font-bold text-[#2C2A26] transition-all ${collapsed ? 'justify-center' : 'justify-between'}`}
          >
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              {!collapsed && <span>{language.toUpperCase()}</span>}
            </div>
            {!collapsed && <ChevronDown className="w-4 h-4 text-[#8C8275]" />}
          </button>
          {isLangOpen && (
            <div className={`absolute ${collapsed ? 'left-full ml-2' : 'left-0'} bottom-full mb-2 w-24 bg-white border border-[#E2DDD3] rounded-xl z-50`}>
              {['en', 'ar', 'fr'].map(lang => (
                <button
                  key={lang}
                  onClick={() => { onLanguageChange(lang as Language); setIsLangOpen(false); }}
                  className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-[#FDFCF9] capitalize"
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contact Administration Direct Trigger Button */}
        <button
          onClick={() => {
            setMobileOpen(false);
            if (onContactAdmin) {
              onContactAdmin();
            } else {
              window.dispatchEvent(new CustomEvent('open-contact-admin'));
            }
          }}
          title={collapsed ? "Contact Administration (Official Desk)" : undefined}
          className={`w-full flex items-center bg-[#2C2A26] hover:bg-[#423E38] text-[#F5F2EB] rounded-2xl text-xs font-bold transition-all cursor-pointer border border-[#E2DDD3]/30 ${
            collapsed ? 'justify-center p-2' : 'justify-between p-2.5'
          }`}
          id="sidebar-contact-admin-btn"
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
            <div className="w-7 h-7 rounded-lg bg-amber-300 text-[#2C2A26] flex items-center justify-center shrink-0 relative">
              <Headphones className="w-4 h-4 text-[#2C2A26]" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            {!collapsed && (
              <div className="text-left min-w-0">
                <span className="block truncate leading-tight text-white font-bold">Contact Admin</span>
                <span className="text-[10px] text-amber-300 font-normal block truncate">
                  Official Support Desk
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <span className="text-[9px] bg-emerald-500/30 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 border border-emerald-400/30">
              Live
            </span>
          )}
        </button>
        
        <button
          onClick={() => {
            setMobileOpen(false);
            onOpenAccountModal();
          }}
          title={collapsed ? "Account & Portal (Verified Workspace)" : undefined}
          className={`w-full flex items-center bg-white border border-[#E2DDD3] hover:border-[#2C2A26] rounded-2xl text-xs font-bold text-[#2C2A26] transition-all ${
            collapsed ? 'justify-center p-2' : 'justify-between p-2.5'
          }`}
          id="sidebar-account-btn"
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 overflow-hidden">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </div>
            {!collapsed && (
              <div className="text-left min-w-0">
                <span className="block truncate leading-tight">Account & Portal</span>
                <span className="text-[10px] text-[#8C8275] font-normal block truncate">
                  Active: {activeWorkspace} Mode
                </span>
              </div>
            )}
          </div>
          {!collapsed && <ChevronRight className="w-4 h-4 text-[#8C8275] shrink-0" />}
        </button>

        {/* BOTTOM TOGGLE CAPABILITY */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center w-full py-1.5 rounded-xl bg-[#EAE5D9]/50 hover:bg-[#EAE5D9] text-[#8C8275] hover:text-[#2C2A26] text-[10px] font-bold transition-all gap-1.5"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP VERTICAL SIDEBAR WITH COLLAPSIBLE TRANSITION */}
      <aside
        className={`hidden lg:flex bg-[#F5F2EB] border-r border-[#E2DDD3] h-screen sticky top-0 shrink-0 flex-col z-40 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* MOBILE TOP BAR WITH BURGER MENU TOGGLE */}
      <header className="lg:hidden sticky top-0 left-0 right-0 bg-[#F5F2EB]/95 backdrop-blur-md border-b border-[#E2DDD3] z-40 px-4 py-3 flex items-center justify-between">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleWorkspaceChange('MARKETPLACE');
          }}
          className="flex items-center gap-2"
        >
          <PremiumLogo className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="text-base font-serif font-bold tracking-tight text-[#2C2A26]">
              AIWeb<span className="text-[#D97706]">Crafter</span>
            </span>
            <span className="text-[9px] tracking-widest uppercase font-semibold text-[#8C8275] -mt-1 animate-shine">
              DIGITAL MARKETPLACE
            </span>
          </div>
        </a>

        <div className="flex items-center gap-2">
          {onOpenSearchModal && (
            <button
              onClick={onOpenSearchModal}
              className="p-2 text-[#5D5A53] hover:text-[#2C2A26] rounded-lg"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => onNavigate('saved')}
            className="p-2 relative text-[#2C2A26]"
            title="Favorites"
          >
            <Heart className={`w-5 h-5 ${savedCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            {savedCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
            )}
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-[#2C2A26] hover:bg-[#EAE5D9] rounded-lg"
            id="mobile-sidebar-toggle"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-[#F5F2EB] h-full2xl z-10">
            {renderSidebarContent(false)}
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarNav;
