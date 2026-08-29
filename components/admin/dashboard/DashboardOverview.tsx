import React from 'react';
import { 
  Activity, 
  ArrowRight, 
  AlertTriangle, 
  FileCheck, 
  Truck, 
  Scale, 
  Landmark,
  Package,
  Users
} from 'lucide-react';
import { AdminTab } from '../AdminSidebar';

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  badge: string;
  badgeColor: string;
  tabTarget: AdminTab;
}

interface ActivityLog {
  id: string;
  time: string;
  title: string;
  desc: string;
  type: 'review' | 'order' | 'seller' | 'dispute' | 'delivery';
}

interface DashboardOverviewProps {
  metrics: {
    pendingCount: number;
    pendingDeliveriesCount: number;
    openDisputesCount: number;
    escrowLockedFunds: number;
  };
  dashboardMetricCards: MetricCard[];
  recentActivityLogs: ActivityLog[];
  setActiveTab: (tab: AdminTab) => void;
  formatCurrency: (val: number) => string;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  metrics,
  dashboardMetricCards,
  recentActivityLogs,
  setActiveTab,
  formatCurrency
}) => {
  return (
    <div className="space-y-8">
      {/* METRIC CARDS GRID (11 Critical Metrics) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg text-[#2C2A26] flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            <span>Real-Time Marketplace Performance Metrics</span>
          </h2>
          <span className="text-xs text-[#8C8275]">Click any card to open management page</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dashboardMetricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => setActiveTab(card.tabTarget)}
                className="bg-white border border-[#E2DDD3] rounded-3xl p-5 hover:shadow-md hover:border-[#2C2A26]/50 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#2C2A26] text-amber-300 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8275] block">
                    {card.title}
                  </span>
                  <div className="text-2xl font-serif font-bold text-[#2C2A26] mt-0.5">
                    {card.value}
                  </div>
                  <p className="text-[11px] text-[#5D5A53] mt-1 flex items-center justify-between">
                    <span>{card.subtitle}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8C8275] group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PENDING ACTIONS SECTION */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
                Pending Actions
              </h3>
              <p className="text-xs text-[#5D5A53]">
                Critical items requiring immediate Super Admin review, approval, or arbitration.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Action 1: Pending Projects */}
          <div className={`p-4 rounded-2xl border ${metrics.pendingCount > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-[#FDFCF9] border-[#E2DDD3]'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-amber-700" />
              <div>
                <span className="text-xs font-bold text-[#2C2A26] block">
                  Projects Pending Moderation ({metrics.pendingCount})
                </span>
                <span className="text-[11px] text-[#5D5A53]">
                  {metrics.pendingCount > 0 ? 'Awaiting seller revenue proof & code audit' : 'All submissions reviewed'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('reviews' as AdminTab)}
              className="px-3 py-1.5 bg-[#2C2A26] text-amber-300 hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all shrink-0"
            >
              Review Now
            </button>
          </div>

          {/* Action 2: Pending Deliveries */}
          <div className={`p-4 rounded-2xl border ${metrics.pendingDeliveriesCount > 0 ? 'bg-blue-50/50 border-blue-200' : 'bg-[#FDFCF9] border-[#E2DDD3]'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-blue-700" />
              <div>
                <span className="text-xs font-bold text-[#2C2A26] block">
                  Active Handover Deliveries ({metrics.pendingDeliveriesCount})
                </span>
                <span className="text-[11px] text-[#5D5A53]">
                  Code repository, DB & domain transfers
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('deliveries' as AdminTab)}
              className="px-3 py-1.5 bg-[#2C2A26] text-white hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all shrink-0"
            >
              Inspect Handovers
            </button>
          </div>

          {/* Action 3: Open Disputes */}
          <div className={`p-4 rounded-2xl border ${metrics.openDisputesCount > 0 ? 'bg-red-50 border-red-200' : 'bg-[#FDFCF9] border-[#E2DDD3]'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-red-700" />
              <div>
                <span className="text-xs font-bold text-[#2C2A26] block">
                  Open Arbitration Disputes ({metrics.openDisputesCount})
                </span>
                <span className="text-[11px] text-[#5D5A53]">
                  Buyer/Seller dispute claims awaiting decision
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('disputes' as AdminTab)}
              className="px-3 py-1.5 bg-red-700 text-white hover:bg-red-800 rounded-xl text-xs font-bold transition-all shrink-0"
            >
              Arbitrate Now
            </button>
          </div>

          {/* Action 4: Payout & Escrow Funds */}
          <div className="p-4 rounded-2xl border bg-[#FDFCF9] border-[#E2DDD3] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Landmark className="w-5 h-5 text-emerald-700" />
              <div>
                <span className="text-xs font-bold text-[#2C2A26] block">
                  Escrow Funds Locked ({formatCurrency(metrics.escrowLockedFunds)})
                </span>
                <span className="text-[11px] text-[#5D5A53]">
                  Protected funds awaiting buyer confirmation
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('escrow' as AdminTab)}
              className="px-3 py-1.5 bg-[#2C2A26] text-white hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all shrink-0"
            >
              Manage Escrow
            </button>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY SECTION */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <h3 className="font-serif font-bold text-lg text-[#2C2A26] flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>Recent Activity Stream</span>
          </h3>
          <span className="text-xs text-[#8C8275]">Auto-updated from live database</span>
        </div>

        <div className="space-y-3">
          {recentActivityLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#8C8275] bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3]">
              No activity recorded yet. New project submissions, orders, and audits will be streamed here in real-time.
            </div>
          ) : (
            recentActivityLogs.map((log) => (
              <div key={log.id} className="p-3.5 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#2C2A26] text-amber-300 flex items-center justify-center shrink-0 font-bold mt-0.5">
                    {log.type === 'review' ? <FileCheck className="w-4 h-4" /> :
                     log.type === 'order' ? <Package className="w-4 h-4" /> :
                     log.type === 'dispute' ? <Scale className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2C2A26]">{log.title}</h4>
                    <p className="text-[11px] text-[#5D5A53] mt-0.5">{log.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] text-[#8C8275] font-semibold bg-[#EAE5D9] px-2 py-0.5 rounded-md shrink-0">
                  {log.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
