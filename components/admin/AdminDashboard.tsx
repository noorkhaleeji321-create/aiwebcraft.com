import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  RefreshCw,
  CreditCard,
  Landmark,
  CheckCircle2,
  Folder,
  Database,
  Users,
  UserCheck,
  Layers,
  Clock,
  Package,
  DollarSign,
  Percent,
  Truck,
  Scale,
  FileCheck
} from 'lucide-react';
import { SellerProject, OrderTransaction } from '../../types';
import { fetchAdminProjects } from '../../services/adminService';
import { 
  getPlatformCommissionPercentage, 
  setPlatformCommissionPercentage,
  fetchPlatformCommissionPercentage,
  useCommissionPercentage
} from '../../services/supabaseService';
import { getStoredOrders, resolveDispute, updateOrder } from '../../services/deliveryStore';
import { getAllStoredSellerProjects, getSellerPayoutSettings } from '../../services/sellerStore';
import { dispatchCustomEvent } from '../../utils/eventBus';
import { AdminTab, AdminSidebar } from './AdminSidebar';
import ProjectReviewManagement from './ProjectReviewManagement';
import AdminDeliveryManagement from './AdminDeliveryManagement';
import { AdminUsersManagement } from './AdminUsersManagement';
import { AdminSellersManagement } from './AdminSellersManagement';
import { AdminChatManagement } from './AdminChatManagement';
import { BotControlCenter } from './BotControlCenter';
import { AdminCustomRequestsManagement } from './AdminCustomRequestsManagement';
import { getCustomRequests } from '../../services/onDemandService';
import { getStoredSupportTickets } from '../../services/supportTicketStore';

import { DashboardOverview } from './dashboard/DashboardOverview';
import { AdminProjectsCatalogView } from './dashboard/AdminProjectsCatalogView';
import { AdminOrdersTab } from './dashboard/AdminOrdersTab';
import { AdminCommissionsTab } from './dashboard/AdminCommissionsTab';

interface AdminDashboardProps {
  onBackToMarketplace: () => void;
  initialSubTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToMarketplace, initialSubTab }) => {
  const [activeTab, setActiveTab] = useState<any>('dashboard');

  useEffect(() => {
    if (initialSubTab) {
      let cleanTab = initialSubTab.replace('admin-', '');
      if (cleanTab === 'project-review') {
        cleanTab = 'reviews';
      }
      setActiveTab(cleanTab);
    }
  }, [initialSubTab]);

  const [projects, setProjects] = useState<SellerProject[]>([]);
  const [orders, setOrders] = useState<OrderTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  useEffect(() => {
    const tickets = getStoredSupportTickets() || [];
    setOpenTicketsCount(tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length);
    const handleUpdate = () => {
      const updated = getStoredSupportTickets() || [];
      setOpenTicketsCount(updated.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length);
    };
    window.addEventListener('support-tickets-updated', handleUpdate);
    return () => window.removeEventListener('support-tickets-updated', handleUpdate);
  }, []);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedCategory] = useState<string>('All');
  const [selectedDisputeOrder, setSelectedDisputeOrder] = useState<OrderTransaction | null>(null);
  const [resolutionNotes] = useState('');
  const commissionPct = useCommissionPercentage();
  const [commissionSavedMsg, setCommissionSavedMsg] = useState(false);

  // Manual Payout processing states
  const [payoutSubTab, setPayoutSubTab] = useState<'deposits' | 'payouts'>('payouts');
  const [selectedPayoutOrder, setSelectedPayoutOrder] = useState<OrderTransaction | null>(null);
  const [payoutRefInput, setPayoutRefInput] = useState('');
  const [payoutReceiptImage, setPayoutReceiptImage] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutDisbursing, setPayoutDisbursing] = useState(false);

  const handleSaveCommission = async (newPct: number) => {
    await setPlatformCommissionPercentage(newPct);
    dispatchCustomEvent('commission_rate_changed');
    setCommissionSavedMsg(true);
    setTimeout(() => setCommissionSavedMsg(false), 3500);
  };

  // Load Admin Data from Server API + Local Store Synchronization
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const projList = await fetchAdminProjects();
      const orderList = getStoredOrders();
      setProjects(projList);
      setOrders(orderList);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisbursePayout = (orderId: string) => {
    if (!payoutRefInput.trim()) {
      setPayoutError('Please provide the transaction reference code / bank confirmation ID.');
      return;
    }
    setPayoutDisbursing(true);
    setPayoutError(null);

    setTimeout(() => {
      const ordersList = getStoredOrders();
      const ordIdx = ordersList.findIndex(o => o.id === orderId);
      if (ordIdx >= 0) {
        const targetOrder = ordersList[ordIdx];
        const now = new Date().toISOString();

        const updated: OrderTransaction = {
          ...targetOrder,
          payoutStatus: 'Disbursed',
          payoutDisbursedAt: now,
          payoutReceiptUrl: payoutReceiptImage || undefined,
          paymentReference: payoutRefInput.trim(),
          auditLogs: [
            {
              id: `log-${Date.now()}`,
              timestamp: now,
              actor: 'Admin',
              action: 'Manual Seller Payout Disbursed',
              details: `Admin confirmed manual payment disbursement of remaining escrow funds to seller's payout method. Reference Code: ${payoutRefInput}`
            },
            ...targetOrder.auditLogs
          ]
        };

        updateOrder(updated);
        // Reload dashboard
        loadAdminData();
        setSelectedPayoutOrder(null);
        setPayoutRefInput('');
        setPayoutReceiptImage(null);
      }
      setPayoutDisbursing(false);
    }, 1000);
  };

  useEffect(() => {
    loadAdminData();

    const handleDataUpdate = () => {
      loadAdminData();
    };

    window.addEventListener('aiwebcrafter_projects_updated', handleDataUpdate);
    window.addEventListener('projects_updated', handleDataUpdate);
    window.addEventListener('orders-updated', handleDataUpdate);

    return () => {
      window.removeEventListener('aiwebcrafter_projects_updated', handleDataUpdate);
      window.removeEventListener('projects_updated', handleDataUpdate);
      window.removeEventListener('orders-updated', handleDataUpdate);
    };
  }, []);

  // Compute Real Calculated Metrics from Project & Order Data
  const metrics = useMemo(() => {
    const allProjs = projects.length > 0 ? projects : getAllStoredSellerProjects();
    const allOrders = orders.length > 0 ? orders : getStoredOrders();

    const pendingProjects = allProjs.filter((p) => p.sellerStatus === 'Pending Review');
    const approvedProjects = allProjs.filter((p) => p.sellerStatus === 'Approved');
    const rejectedProjects = allProjs.filter((p) => p.sellerStatus === 'Rejected');

    const completedOrders = (allOrders || []).filter((o) => o?.deliveryStatus === 'Completed');
    const activeDeliveries = (allOrders || []).filter((o) => o?.deliveryStatus === 'Delivery Pending' || o?.deliveryStatus === 'Buyer Inspection');
    const disputedOrders = (allOrders || []).filter((o) => o?.deliveryStatus === 'Disputed');

    const totalGMV = allOrders.reduce((sum, o) => sum + (o.askingPrice || 0), 0);
    const completedGMV = completedOrders.reduce((sum, o) => sum + (o.askingPrice || 0), 0);
    const platformCommission = Math.round(completedGMV * (commissionPct / 100));
    const escrowLockedFunds = activeDeliveries.reduce((sum, o) => sum + (o.askingPrice || 0), 0) + disputedOrders.reduce((sum, o) => sum + (o.askingPrice || 0), 0);

    const sellersSet = new Set(allProjs.map((p) => p.seller?.id || p.seller?.email).filter(Boolean));
    const buyersSet = new Set(allOrders.map((o) => o.buyerEmail || o.buyerId).filter(Boolean));
    const totalUsers = new Set([...Array.from(sellersSet), ...Array.from(buyersSet), 'aiwebcraft6@gmail.com']).size;

    return {
      totalUsers,
      totalSellers: sellersSet.size,
      totalProjects: allProjs.length,
      pendingCount: pendingProjects.length,
      approvedCount: approvedProjects.length,
      rejectedCount: rejectedProjects.length,
      totalSalesCount: completedOrders.length,
      totalOrderValue: totalGMV,
      platformCommission,
      escrowLockedFunds,
      pendingDeliveriesCount: activeDeliveries.length,
      openDisputesCount: disputedOrders.length
    };
  }, [projects, orders, commissionPct]);

  // Filtered Projects List
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      if (selectedStatusFilter !== 'All' && proj.sellerStatus !== selectedStatusFilter) {
        return false;
      }
      if (selectedCategory !== 'All' && proj.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = proj.title?.toLowerCase().includes(q);
        const matchesTagline = proj.tagline?.toLowerCase().includes(q);
        const matchesSeller = proj.seller?.name?.toLowerCase().includes(q);
        const matchesCategory = proj.category?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTagline && !matchesSeller && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [projects, selectedCategory, selectedStatusFilter, searchQuery]);

  const handleActionComplete = (updatedProject: SellerProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    loadAdminData();
  };

  const handleDisputeResolution = (outcome: 'CompleteDeal' | 'RefundBuyer') => {
    if (!selectedDisputeOrder) return;
    const updated = resolveDispute(
      selectedDisputeOrder.id,
      resolutionNotes || `Admin dispute decision: ${outcome}`,
      'Super Admin',
      outcome
    );
    if (updated) {
      loadAdminData();
      setSelectedDisputeOrder(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const dashboardMetricCards = [
    {
      id: 'm-users',
      title: 'Total Users',
      value: metrics.totalUsers,
      subtitle: 'Verified buyers & sellers',
      icon: Users,
      badge: 'Active Accounts',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      tabTarget: 'users' as AdminTab
    },
    {
      id: 'm-sellers',
      title: 'Verified Sellers',
      value: metrics.totalSellers,
      subtitle: 'KYC verified store owners',
      icon: UserCheck,
      badge: 'Seller KYC',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      tabTarget: 'sellers' as AdminTab
    },
    {
      id: 'm-projects',
      title: 'Total Projects',
      value: metrics.totalProjects,
      subtitle: 'Global software catalog',
      icon: Layers,
      badge: 'Catalog',
      badgeColor: 'bg-stone-100 text-stone-900 border-stone-300',
      tabTarget: 'projects' as AdminTab
    },
    {
      id: 'm-pending',
      title: 'Pending Review',
      value: metrics.pendingCount,
      subtitle: 'Awaiting moderation & code audit',
      icon: Clock,
      badge: metrics.pendingCount > 0 ? 'Requires Action' : 'Clean Queue',
      badgeColor: metrics.pendingCount > 0 ? 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold' : 'bg-gray-100 text-gray-700',
      tabTarget: 'reviews' as AdminTab
    },
    {
      id: 'm-approved',
      title: 'Approved Projects',
      value: metrics.approvedCount,
      subtitle: 'Live in Marketplace',
      icon: CheckCircle2,
      badge: 'Live Marketplace',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      tabTarget: 'projects' as AdminTab
    },
    {
      id: 'm-sales',
      title: 'Total Sales',
      value: metrics.totalSalesCount,
      subtitle: 'Completed escrow acquisitions',
      icon: Package,
      badge: 'Completed Deals',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      tabTarget: 'orders' as AdminTab
    },
    {
      id: 'm-gmv',
      title: 'Total Order Value (GMV)',
      value: formatCurrency(metrics.totalOrderValue),
      subtitle: 'Gross Marketplace Volume',
      icon: DollarSign,
      badge: 'Gross Revenue',
      badgeColor: 'bg-emerald-100 text-emerald-950 font-bold border-emerald-300',
      tabTarget: 'orders' as AdminTab
    },
    {
      id: 'm-commissions',
      title: 'Platform Commission',
      value: formatCurrency(metrics.platformCommission),
      subtitle: `${commissionPct}% Platform fee on completed deals`,
      icon: Percent,
      badge: 'Net Profit',
      badgeColor: 'bg-amber-200 text-amber-950 font-extrabold border-amber-300',
      tabTarget: 'commissions' as AdminTab
    },
    {
      id: 'm-escrow',
      title: 'Escrow Locked Balance',
      value: formatCurrency(metrics.escrowLockedFunds),
      subtitle: 'Secured funds in active handover',
      icon: Landmark,
      badge: 'Escrow Vault',
      badgeColor: 'bg-stone-200 text-stone-900 font-bold border-stone-300',
      tabTarget: 'escrow' as AdminTab
    },
    {
      id: 'm-deliveries',
      title: 'Pending Deliveries',
      value: metrics.pendingDeliveriesCount,
      subtitle: 'Code, domain & credential handovers',
      icon: Truck,
      badge: metrics.pendingDeliveriesCount > 0 ? 'Active Handover' : 'No Pending',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      tabTarget: 'deliveries' as AdminTab
    },
    {
      id: 'm-disputes',
      title: 'Open Disputes',
      value: metrics.openDisputesCount,
      subtitle: 'Arbitration tickets requiring decision',
      icon: Scale,
      badge: metrics.openDisputesCount > 0 ? 'Urgent Review' : 'Zero Disputes',
      badgeColor: metrics.openDisputesCount > 0 ? 'bg-red-100 text-red-900 border-red-300 font-extrabold animate-pulse' : 'bg-gray-100 text-gray-700',
      tabTarget: 'disputes' as AdminTab
    }
  ];

  const recentActivityLogs = useMemo(() => {
    const logs: { id: string; time: string; title: string; desc: string; type: 'review' | 'order' | 'seller' | 'dispute' | 'delivery' }[] = [];

    projects.forEach((p) => {
      if (p.sellerStatus === 'Pending Review') {
        logs.push({
          id: `act-proj-pend-${p.id}`,
          time: 'Recently',
          title: `Project Submission: "${p.title}"`,
          desc: `Submitted by ${p.seller?.name || 'Seller'} for $${(p.askingPrice || 0).toLocaleString()}. Awaiting code audit.`,
          type: 'review'
        });
      } else if (p.sellerStatus === 'Approved') {
        logs.push({
          id: `act-proj-appr-${p.id}`,
          time: p.approvedAt ? new Date(p.approvedAt).toLocaleDateString() : 'Active',
          title: `Project Approved & Live: "${p.title}"`,
          desc: `Approved by Super Admin. Listed in Marketplace category ${p.category}.`,
          type: 'review'
        });
      }
    });

    orders.forEach((o) => {
      if (!o) return;
      logs.push({
        id: `act-ord-init-${o.id}`,
        time: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recent',
        title: `Escrow Order Created: #${o.id}`,
        desc: `Buyer ${o.buyerName || 'Client'} deposited $${(o.askingPrice || 0).toLocaleString()} for ${o.projectTitle || 'Project'}.`,
        type: 'order'
      });

      if (o?.deliveryStatus === 'Disputed') {
        logs.push({
          id: `act-disp-${o.id}`,
          time: o.updatedAt ? new Date(o.updatedAt).toLocaleDateString() : 'Recent',
          title: `Arbitration Dispute Raised: #${o.id}`,
          desc: `Dispute filed for ${o.projectTitle || 'Project'}. Super Admin intervention requested.`,
          type: 'dispute'
        });
      }
    });

    return logs.slice(0, 8);
  }, [projects, orders]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8 animate-fade-in-up">
      {/* Top Super Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2DDD3] p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#2C2A26] text-amber-300 rounded-2xl flex items-center justify-center font-bold shadow-md">
            <ShieldCheck className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-amber-800 font-bold text-xs bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Super Admin Management Workspace</span>
            </div>
            <h1 className="font-serif font-bold text-2xl text-[#2C2A26] mt-1">
              AIWebCrafter Platform Owner Control
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            className="px-4 py-2.5 bg-[#F5F2EB] border border-[#E2DDD3] hover:border-[#2C2A26] text-[#2C2A26] rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            title="Refresh Real-time Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#8C8275] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT VIEW CONTAINER */}
      <div className="w-full">
        {/* Main Content Pane */}
        <div className="w-full space-y-6">

          {/* 1. DASHBOARD OVERVIEW TAB */}
          {(activeTab === 'dashboard' || activeTab === 'overview') && (
            <DashboardOverview
              metrics={metrics}
              dashboardMetricCards={dashboardMetricCards}
              recentActivityLogs={recentActivityLogs}
              setActiveTab={setActiveTab}
              formatCurrency={formatCurrency}
            />
          )}

          {/* 2. USERS MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <AdminUsersManagement onRefreshStats={loadAdminData} />
          )}

          {/* 3. SELLERS & KYC TAB */}
          {activeTab === 'sellers' && (
            <AdminSellersManagement onRefreshStats={loadAdminData} />
          )}

          {/* 4. GLOBAL PROJECTS TAB */}
          {activeTab === 'projects' && (
            <AdminProjectsCatalogView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedStatusFilter={selectedStatusFilter}
              setSelectedStatusFilter={setSelectedStatusFilter}
              filteredProjects={filteredProjects}
              handleActionComplete={handleActionComplete}
              onRefresh={loadAdminData}
            />
          )}

          {/* 5. PROJECT REVIEW TAB */}
          {activeTab === 'reviews' && (
            <ProjectReviewManagement onRefreshStats={loadAdminData} />
          )}

          {/* CUSTOM REQUESTS (ON-DEMAND) TAB */}
          {activeTab === 'custom-requests' && (
            <AdminCustomRequestsManagement />
          )}

          {/* 6. ORDERS TAB */}
          {activeTab === 'orders' && (
            <AdminOrdersTab
              orders={orders}
              setOrders={setOrders}
              loadAdminData={loadAdminData}
              formatCurrency={formatCurrency}
              totalOrderValue={metrics.totalOrderValue}
            />
          )}

          {/* 7. PAYMENTS TAB - DEPOSITS & SELLER PAYOUT HUB */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Financial Management & Escrow Hub</h2>
                  <p className="text-xs text-[#5D5A53]">Manage buyer escrow deposits and manual payout disbursements to sellers.</p>
                </div>

                {/* Sub-tab Toggle */}
                <div className="flex bg-[#F5F2EB] p-1 rounded-xl border border-[#E2DDD3] shrink-0">
                  <button
                    onClick={() => {
                      setPayoutSubTab('deposits');
                      setSelectedPayoutOrder(null);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      payoutSubTab === 'deposits' ? 'bg-[#2C2A26] text-[#F5F2EB]' : 'text-[#8C8275] hover:text-[#2C2A26]'
                    }`}
                  >
                    Buyer Deposits
                  </button>
                  <button
                    onClick={() => {
                      setPayoutSubTab('payouts');
                      setSelectedPayoutOrder(null);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      payoutSubTab === 'payouts' ? 'bg-[#2C2A26] text-[#F5F2EB]' : 'text-[#8C8275] hover:text-[#2C2A26]'
                    }`}
                  >
                    Seller Payouts
                  </button>
                </div>
              </div>

              {payoutSubTab === 'deposits' ? (
                /* BUYER DEPOSITS PANEL */
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-sm text-[#2C2A26]">Secured Escrow Deposits Registry</h3>
                  {orders.length === 0 ? (
                    <div className="p-12 text-center space-y-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl">
                      <CreditCard className="w-10 h-10 text-[#8C8275] mx-auto" />
                      <h3 className="font-serif font-bold text-lg text-[#2C2A26]">No Deposit Transactions Yet</h3>
                      <p className="text-xs text-[#5D5A53]">Once buyers initiate escrow purchases, payment logs will be recorded here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-[#E2DDD3] rounded-2xl">
                      <table className="w-full text-left text-xs text-[#2C2A26]">
                        <thead className="bg-[#F5F2EB] border-b border-[#E2DDD3] text-[#8C8275] font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-3">Reference ID</th>
                            <th className="p-3">Project Title</th>
                            <th className="p-3">Buyer Name</th>
                            <th className="p-3">Date</th>
                            <th className="p-3 text-right">Escrow Amount</th>
                            <th className="p-3 text-right">Escrow Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2DDD3] bg-white">
                          {orders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-[#FDFCF9]">
                              <td className="p-3 font-mono font-bold text-[#8C8275]">
                                {ord.paymentReference || `ESCROW-REF-${ord.id.toUpperCase()}`}
                              </td>
                              <td className="p-3 font-semibold">{ord.projectTitle}</td>
                              <td className="p-3">{ord.buyerName}</td>
                              <td className="p-3">{new Date(ord.createdAt).toLocaleDateString()}</td>
                              <td className="p-3 text-right font-bold">${(ord.askingPrice || 0).toLocaleString()}</td>
                              <td className="p-3 text-right">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  ord.deliveryStatus === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                                    : ord.deliveryStatus === 'Disputed'
                                    ? 'bg-rose-50 text-rose-950 border-rose-200'
                                    : 'bg-amber-50 text-amber-950 border-amber-200'
                                }`}>
                                  {ord.deliveryStatus === 'Completed' ? 'Released to Seller' : ord.deliveryStatus === 'Disputed' ? 'Disputed / Frozen' : 'Locked in Escrow'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* SELLER PAYOUTS HUB PANEL */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] border border-[#E2DDD3] p-4 rounded-2xl">
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-sm text-[#2C2A26]">Manual Seller Payout Disbursements</h4>
                      <p className="text-xs text-[#5D5A53]">
                        Showcases closed acquisitions requiring cash out. Admin can view the seller's preferred payout details, transfer offline, and upload receipts.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono bg-stone-900 text-stone-100 px-3 py-1.5 rounded-xl font-bold block shrink-0 text-center">
                      Platform Fee: {commissionPct}%
                    </span>
                  </div>

                  {/* Filter Completed orders requiring payout */}
                  {orders.filter(o => o.deliveryStatus === 'Completed').length === 0 ? (
                    <div className="p-12 text-center space-y-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl">
                      <Clock className="w-10 h-10 text-[#8C8275] mx-auto" />
                      <h3 className="font-serif font-bold text-lg text-[#2C2A26]">No Finished Handovers Yet</h3>
                      <p className="text-xs text-[#5D5A53]">Payout tasks appear as soon as a 48h escrow window closes or buyer accepts the handover.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Completed Orders List */}
                      <div className="lg:col-span-5 space-y-3">
                        <span className="text-[10px] font-bold text-[#8C8275] uppercase block">Select Transaction to Process</span>
                        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                          {orders.filter(o => o.deliveryStatus === 'Completed').map((ord) => {
                            const netPayout = Math.round((ord.askingPrice * (1 - commissionPct / 100)) * 100) / 100;
                            const isDisbursed = ord.payoutStatus === 'Disbursed';
                            const isSelected = selectedPayoutOrder?.id === ord.id;
                            
                            return (
                              <button
                                key={ord.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPayoutOrder(ord);
                                  setPayoutRefInput(ord.paymentReference || '');
                                  setPayoutReceiptImage(ord.payoutReceiptUrl || null);
                                  setPayoutError(null);
                                }}
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-stone-50 border-stone-800 shadow-sm'
                                    : 'bg-white border-[#E2DDD3] hover:border-stone-500'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#2C2A26]">Order #{ord.id}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                      isDisbursed
                                        ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                                        : 'bg-amber-50 text-amber-950 border-amber-200'
                                    }`}>
                                      {isDisbursed ? 'Disbursed' : 'Pending'}
                                    </span>
                                  </div>
                                  <h4 className="font-semibold text-[11px] text-[#2C2A26] truncate mt-1">{ord.projectTitle}</h4>
                                  <p className="text-[10px] text-[#8C8275] mt-0.5">Seller: {ord.sellerName}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold text-[#2C2A26] block">${(ord.askingPrice || 0).toLocaleString()}</span>
                                  <span className="text-[10px] font-bold text-emerald-700 block">Payout: ${(netPayout || 0).toLocaleString()}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Processing & Payment details Panel */}
                      <div className="lg:col-span-7">
                        {selectedPayoutOrder ? (
                          <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-5 rounded-3xl space-y-5">
                            {/* Header */}
                            <div className="border-b border-[#E2DDD3] pb-3 flex items-center justify-between">
                              <div>
                                <h3 className="font-serif font-bold text-sm text-[#2C2A26]">Payout Details & Execution</h3>
                                <p className="text-[10px] text-[#8C8275]">Processing payout for Order #{selectedPayoutOrder.id}</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                                selectedPayoutOrder.payoutStatus === 'Disbursed'
                                  ? 'bg-emerald-100 text-emerald-950 border border-emerald-200'
                                  : 'bg-amber-100 text-amber-950 border border-amber-200'
                              }`}>
                                {selectedPayoutOrder.payoutStatus === 'Disbursed' ? 'Disbursed' : 'Awaiting Transfer'}
                              </span>
                            </div>

                            {/* Financial breakdown */}
                            <div className="grid grid-cols-3 gap-3 text-center bg-white border border-[#E2DDD3] p-3 rounded-2xl">
                              <div>
                                <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Gross Amount</span>
                                <span className="text-xs font-bold text-[#2C2A26]">${(selectedPayoutOrder.askingPrice || 0).toLocaleString()}</span>
                              </div>
                              <div className="border-x border-[#E2DDD3]">
                                <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Platform Fee ({commissionPct}%)</span>
                                <span className="text-xs font-bold text-rose-700">-${(Math.round((selectedPayoutOrder.askingPrice || 0) * (commissionPct / 100) * 100) / 100).toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-emerald-700 uppercase block">Seller Net Total</span>
                                <span className="text-xs font-bold text-emerald-700">${(Math.round((selectedPayoutOrder.askingPrice || 0) * (1 - commissionPct / 100) * 100) / 100).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Seller Payout Config details */}
                            <div className="space-y-3">
                              <span className="text-[10px] font-bold text-[#8C8275] uppercase block">Seller's Configured Payout Method</span>
                              
                              {(() => {
                                const settings = selectedPayoutOrder.payoutDetails || getSellerPayoutSettings(selectedPayoutOrder.sellerEmail || 'seller@example.com');
                                const method = settings?.payoutMethod || 'bank';

                                return (
                                  <div className="p-4 bg-white border border-[#E2DDD3] rounded-2xl space-y-3">
                                    <div className="flex items-center gap-2 border-b border-[#E2DDD3] pb-2 text-xs font-bold text-[#2C2A26]">
                                      <Landmark className="w-4 h-4 text-[#8C8275]" />
                                      <span>
                                        {method === 'bank' && 'Direct Bank Wire'}
                                        {method === 'paypal' && 'PayPal Account'}
                                        {method === 'paddle' && 'Paddle Account'}
                                        {method === 'crypto' && 'Cryptocurrency (USDT/USDC)'}
                                      </span>
                                    </div>

                                    {method === 'bank' && (
                                      <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                          <span className="text-[9px] font-bold text-[#8C8275] block">Bank Name</span>
                                          <span className="font-semibold text-[#2C2A26]">{settings.bankName || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-bold text-[#8C8275] block">Beneficiary</span>
                                          <span className="font-semibold text-[#2C2A26]">{settings.bankAccountHolder || selectedPayoutOrder.sellerName}</span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-bold text-[#8C8275] block">SWIFT/BIC</span>
                                          <span className="font-mono font-semibold text-[#2C2A26]">{settings.bankSwift || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-bold text-[#8C8275] block">IBAN</span>
                                          <span className="font-mono font-semibold text-[#2C2A26] break-all">{settings.bankIban || 'N/A'}</span>
                                        </div>
                                      </div>
                                    )}

                                    {method === 'paypal' && (
                                      <div className="text-xs">
                                        <span className="text-[9px] font-bold text-[#8C8275] block">PayPal Account Email</span>
                                        <span className="font-semibold text-[#2C2A26] font-mono">{settings.paypalEmail || selectedPayoutOrder.sellerEmail || 'N/A'}</span>
                                      </div>
                                    )}

                                    {method === 'paddle' && (
                                      <div className="text-xs">
                                        <span className="text-[9px] font-bold text-[#8C8275] block">Paddle Account Email</span>
                                        <span className="font-semibold text-[#2C2A26] font-mono">{settings.paddleEmail || selectedPayoutOrder.sellerEmail || 'N/A'}</span>
                                      </div>
                                    )}

                                    {method === 'crypto' && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                          <span className="text-[9px] font-bold text-[#8C8275] block">Wallet Address</span>
                                          <span className="font-mono font-semibold text-[#2C2A26] break-all">{settings.cryptoWalletAddress || 'N/A'}</span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-bold text-[#8C8275] block">Network</span>
                                          <span className="font-bold text-emerald-700">{settings.cryptoNetwork || 'ERC-20'}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Form or Receipt depending on payoutStatus */}
                            {selectedPayoutOrder.payoutStatus === 'Disbursed' ? (
                              <div className="space-y-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                  ✓ Payout Disbursed Successfully
                                </h4>
                                <div className="text-xs space-y-1 text-emerald-800">
                                  <p><strong>Payout Ref:</strong> <span className="font-mono font-bold">{selectedPayoutOrder.paymentReference}</span></p>
                                  <p><strong>Disbursed At:</strong> {selectedPayoutOrder.payoutDisbursedAt ? new Date(selectedPayoutOrder.payoutDisbursedAt).toLocaleString() : 'N/A'}</p>
                                </div>
                                {selectedPayoutOrder.payoutReceiptUrl && (
                                  <div className="pt-2">
                                    <span className="text-[10px] font-bold text-[#8C8275] block mb-1">Transfer Receipt Attachment:</span>
                                    <div className="border border-emerald-200 rounded-xl overflow-hidden max-w-sm h-36 bg-white flex items-center justify-center">
                                      <img
                                        src={selectedPayoutOrder.payoutReceiptUrl}
                                        alt="Receipt Screenshot"
                                        className="max-h-full max-w-full object-contain"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Admin Form to mark payout as Completed / Disbursed */
                              <div className="bg-white border border-[#E2DDD3] p-4 rounded-2xl space-y-4">
                                <h4 className="text-xs font-bold text-[#2C2A26]">Register Manual Transfer & Upload Receipt</h4>
                                
                                <div className="space-y-3 text-xs">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#8C8275] uppercase block">Bank / Payout Reference ID</label>
                                    <input
                                      type="text"
                                      value={payoutRefInput}
                                      onChange={(e) => setPayoutRefInput(e.target.value)}
                                      placeholder="e.g. TR-97761014-MA"
                                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs p-3 font-mono focus:outline-none focus:border-stone-800"
                                    />
                                  </div>

                                  {/* Receipt Upload */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-[#8C8275] uppercase block">Transfer Receipt Screenshot</label>
                                    
                                    <div className="flex items-center gap-3">
                                      <label className="flex-1 border border-dashed border-[#E2DDD3] bg-[#FAF8F5] p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-all">
                                        <span className="text-[11px] font-semibold text-[#8C8275]">📷 Choose Screenshot / PDF Receipt</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              if (file.size > 5 * 1024 * 1024) {
                                                setPayoutError('File size exceeds 5MB limit');
                                                return;
                                              }
                                              const reader = new FileReader();
                                              reader.onload = () => {
                                                setPayoutReceiptImage(reader.result as string);
                                                setPayoutError(null);
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                          className="hidden"
                                        />
                                      </label>

                                      {payoutReceiptImage && (
                                        <div className="relative w-14 h-14 border border-[#E2DDD3] rounded-xl overflow-hidden shrink-0 bg-stone-50 flex items-center justify-center">
                                          <img
                                            src={payoutReceiptImage}
                                            alt="Receipt Attachment Preview"
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setPayoutReceiptImage(null)}
                                            className="absolute top-0 right-0 bg-black/60 text-white rounded-bl-lg p-0.5"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {payoutError && (
                                  <p className="text-[11px] font-bold text-rose-800">{payoutError}</p>
                                )}

                                <div className="flex justify-end gap-2 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPayoutOrder(null)}
                                    className="px-4 py-2 text-xs font-semibold text-[#5D5A53]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDisbursePayout(selectedPayoutOrder.id)}
                                    disabled={payoutDisbursing}
                                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                  >
                                    {payoutDisbursing ? 'Recording...' : 'Confirm Payout Disbursement'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center p-12 bg-[#FAF8F5] border border-dashed border-[#E2DDD3] rounded-3xl text-center space-y-3">
                            <Clock className="w-10 h-10 text-[#8C8275]" />
                            <h4 className="font-serif font-bold text-[#2C2A26] text-sm">Process Payout Task</h4>
                            <p className="text-xs text-[#5D5A53] max-w-sm">
                              Click on any closed deal listed on the left to inspect seller's preferred payout method, enter SWIFT or Wallet hashes, and upload the manual payment proof.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 8. COMMISSIONS TAB */}
          {activeTab === 'commissions' && (
            <AdminCommissionsTab
              platformCommission={metrics.platformCommission}
              formatCurrency={formatCurrency}
              commissionSavedMsg={commissionSavedMsg}
              commissionPct={commissionPct}
              handleSaveCommission={handleSaveCommission}
            />
          )}

          {/* 9. ESCROW TAB */}
          {activeTab === 'escrow' && (
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2DDD3] pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-700" />
                    <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Escrow Vault & Buyer Protection</h2>
                  </div>
                  <p className="text-xs text-[#5D5A53]">
                    Buyer deposits are held securely for a mandatory 48-hour inspection period. Funds freeze immediately upon dispute, and ready seller balances are disbursed by Admin.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-200 text-amber-950 rounded-full text-xs font-extrabold border border-amber-300">
                    Escrow Locked Funds: {formatCurrency(metrics.escrowLockedFunds)}
                  </span>
                </div>
              </div>

              {/* Bot Status & Guarantee Policy Banner */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-800" />
                    <span>Escrow Guardian Sentinel Active 24/7</span>
                  </span>
                  <p className="text-[#5D5A53]">
                    • 48-Hour Inspection Guarantee | • Instant freeze on dispute | • Automatic commission ({commissionPct}%) deduction | • Manual secure seller disbursement
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('deliveries')}
                  className="px-4 py-2 bg-[#2C2A26] text-amber-300 hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  Open Delivery & Payout Center →
                </button>
              </div>

              {(orders || []).filter(o => o?.deliveryStatus === 'Delivery Pending' || o?.deliveryStatus === 'Buyer Inspection' || o?.deliveryStatus === 'Disputed').length === 0 ? (
                <div className="p-12 text-center space-y-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl">
                  <Landmark className="w-10 h-10 text-[#8C8275] mx-auto" />
                  <h3 className="font-serif font-bold text-lg text-[#2C2A26]">No Funds Currently in Inspection</h3>
                  <p className="text-xs text-[#5D5A53]">When new transactions are initiated, locked escrow funds and inspection timers will be monitored here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(orders || []).filter(o => o?.deliveryStatus === 'Delivery Pending' || o?.deliveryStatus === 'Buyer Inspection' || o?.deliveryStatus === 'Disputed').map((escrowOrd) => (
                    <div key={escrowOrd.id} className="p-4 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#2C2A26] block">Order #{escrowOrd.id} - {escrowOrd.projectTitle}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            escrowOrd.deliveryStatus === 'Disputed' ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}>
                            {escrowOrd.deliveryStatus}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#5D5A53]">
                          Buyer: {escrowOrd.buyerName} | Seller: {escrowOrd.sellerName} | Gateway: {escrowOrd.paymentGateway || 'Escrow'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-serif font-bold text-sm text-[#2C2A26]">${(escrowOrd.askingPrice || 0).toLocaleString()}</span>
                        <button
                          onClick={() => {
                            setActiveTab('deliveries');
                          }}
                          className="px-3 py-1.5 bg-white border border-[#E2DDD3] text-[#2C2A26] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold"
                        >
                          Inspect & Audit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 10. DELIVERIES TAB */}
          {activeTab === 'deliveries' && (
            <AdminDeliveryManagement />
          )}

          {/* 11. DISPUTES TAB */}
          {activeTab === 'disputes' && (
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Disputes & Arbitration Panel</h2>
                  <p className="text-xs text-[#5D5A53]">Resolve disagreement tickets between buyers and sellers.</p>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-900 rounded-full text-xs font-bold border border-red-300">
                  Open Disputes: {metrics.openDisputesCount}
                </span>
              </div>

              {(orders || []).filter((o) => o?.deliveryStatus === 'Disputed').length === 0 ? (
                <div className="p-12 text-center space-y-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="font-serif font-bold text-lg text-[#2C2A26]">Zero Active Disputes</h3>
                  <p className="text-xs text-[#5D5A53]">All marketplace orders are progressing smoothly without conflicts.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(orders || []).filter((o) => o?.deliveryStatus === 'Disputed').map((disputed) => (
                    <div key={disputed.id} className="p-5 border border-red-200 bg-red-50/40 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-red-900">Dispute Order #{disputed.id} - {disputed.projectTitle}</span>
                        <span className="font-serif font-bold text-sm text-[#2C2A26]">${(disputed.askingPrice || 0).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#5D5A53]">Buyer: {disputed.buyerName} | Seller: {disputed.sellerName}</p>
                      
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setSelectedDisputeOrder(disputed);
                            handleDisputeResolution('CompleteDeal');
                          }}
                          className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                        >
                          Award Funds to Seller
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDisputeOrder(disputed);
                            handleDisputeResolution('RefundBuyer');
                          }}
                          className="px-3 py-1.5 bg-red-700 text-white rounded-xl text-xs font-bold"
                        >
                          Full Refund to Buyer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 12. FILES TAB */}
          {activeTab === 'files' && (
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Platform Files & Vault</h2>
                  <p className="text-xs text-[#5D5A53]">System contracts, asset zip archives, and NDA documents.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="p-4 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Folder className="w-5 h-5 text-amber-700" />
                    <span className="text-xs font-bold text-[#2C2A26]">AIWebCrafter_Master_Asset_Transfer_Contract_2026.pdf</span>
                  </div>
                  <button className="px-3 py-1 bg-[#2C2A26] text-amber-300 rounded-xl text-xs font-bold">Download</button>
                </div>
              </div>
            </div>
          )}

          {/* 13. REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Marketplace Growth & Financial Reports</h2>
                  <p className="text-xs text-[#5D5A53]">Transaction statistics, category distribution, and deal speed.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl text-center space-y-1">
                  <span className="text-[11px] text-[#8C8275] font-bold uppercase block">Total Sales (GMV)</span>
                  <span className="font-serif font-bold text-2xl text-[#2C2A26]">{formatCurrency(metrics.totalOrderValue)}</span>
                </div>
                <div className="p-4 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl text-center space-y-1">
                  <span className="text-[11px] text-[#8C8275] font-bold uppercase block">Platform Commission Earned</span>
                  <span className="font-serif font-bold text-2xl text-amber-900">{formatCurrency(metrics.platformCommission)}</span>
                </div>
                <div className="p-4 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl text-center space-y-1">
                  <span className="text-[11px] text-[#8C8275] font-bold uppercase block">Completed Deals Count</span>
                  <span className="font-serif font-bold text-2xl text-emerald-900">{metrics.totalSalesCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* 14. CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Category Taxonomy Management</h2>
                  <p className="text-xs text-[#5D5A53]">Marketplace categories, tech stack tags, and fee multipliers.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['SaaS', 'Shopify', 'AI Tools', 'E-commerce', 'Mobile Apps', 'Websites', 'Other'].map((cat) => (
                  <div key={cat} className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-center">
                    <span className="text-xs font-bold text-[#2C2A26] block">{cat}</span>
                    <span className="text-[10px] text-[#8C8275]">
                      {projects.filter((p) => p.category === cat).length} Listed Apps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 15. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2C2A26]">System Settings & Config</h2>
                  <p className="text-xs text-[#5D5A53]">Platform fee rate, escrow inspection duration, and server keys.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-[#2C2A26]">
                <div className="p-4 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl space-y-2">
                  <span className="font-bold block">Platform Escrow Commission Fee</span>
                  <p className="text-[#5D5A53]">Standard fee deducted on deal completion: <strong>{commissionPct}%</strong></p>
                </div>

                <div className="p-4 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl space-y-2">
                  <span className="font-bold block">Escrow Buyer Inspection Window</span>
                  <p className="text-[#5D5A53]">Default inspection period before auto-release: <strong>7 Days</strong></p>
                </div>

                <div className="p-4 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl space-y-2">
                  <span className="font-bold block">Database Integration Readiness</span>
                  <p className="text-[#5D5A53] flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Structured state ready for seamless Supabase migration.</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CHAT & AI TAKEOVER TAB */}
          {activeTab === 'chat' && (
            <AdminChatManagement />
          )}

          {activeTab === 'sentinel' && (
            <BotControlCenter />
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
