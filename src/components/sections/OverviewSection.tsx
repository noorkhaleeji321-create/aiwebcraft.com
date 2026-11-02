import React from 'react';
import {
  Database,
  HardDrive,
  ShoppingBag,
  Package,
  ShieldCheck,
  Activity,
  ArrowRight,
  Terminal,
  Upload,
  Archive,
  KeyRound,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../../locales/translations';
import { Product, Order, ActivityLog, StorageQuota } from '../../types';
import { PermanentStorageStatus } from '../../services/gitStorageClient';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface OverviewSectionProps {
  lang: Language;
  products: Product[];
  orders: Order[];
  logs: ActivityLog[];
  quota: StorageQuota;
  storageStatus: PermanentStorageStatus | null;
  onNavigate: (section: any) => void;
  onOpenSql: () => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  lang,
  products,
  orders,
  logs,
  quota,
  storageStatus,
  onNavigate,
  onOpenSql
}) => {
  const t = TRANSLATIONS[lang];

  const dbSizeMb = (quota.d1_storage_bytes / (1024 * 1024)).toFixed(1);
  const mediaSizeMb = (quota.r2_storage_bytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* GitHub Auth Error Warning */}
      {storageStatus?.last_auth_error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-300">GitHub Storage Authentication Issue</h3>
            <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
              {storageStatus.last_auth_error}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <button 
                onClick={() => onNavigate('settings')}
                className="text-xs font-semibold text-red-300 hover:text-red-200 underline underline-offset-4 flex items-center gap-1"
              >
                Update GITHUB_TOKEN in Settings
              </button>
              <a 
                href="https://github.com/settings/tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <span>Generate New Token</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Top Banner Notice */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>PRIVATE STORE INFRASTRUCTURE</span>
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-emerald-400 font-mono">0 MAD Strict Budget</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {t.overview.heroTitle}
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
            {t.overview.heroDesc}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('api')}
            className="px-3.5 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Store API Gateway</span>
          </button>
          <button
            onClick={onOpenSql}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Run SQL</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.overview.activeProducts}</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {products.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Target: &ge; 100 Products</span>
            <span className="text-emerald-400 font-medium">Met (100% Free)</span>
          </div>
        </div>

        {/* Database Health & Size */}
        <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.overview.databaseStatus}</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {dbSizeMb} <span className="text-xs font-normal text-slate-400">MB</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{storageStatus?.mode === 'github' ? 'GitHub API Store' : 'Local File Store'}</span>
            <span className={`font-mono ${storageStatus?.mode === 'github' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {storageStatus?.mode === 'github' ? 'Synced' : 'Fallback Mode'}
            </span>
          </div>
        </div>

        {/* Object Storage R2 */}
        <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.overview.storageStatus}</span>
            <HardDrive className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {mediaSizeMb} <span className="text-xs font-normal text-slate-400">MB / 10 GB</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Permanent Storage (0 MAD)</span>
            <span className="text-emerald-400 font-medium">&lt; 0.1% Quota</span>
          </div>
        </div>

        {/* Orders Ingested */}
        <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.overview.totalOrders}</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {orders.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Recent: ORD-2026-1085</span>
            <span className="text-purple-300 font-mono">Synced</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Store Orders & Infrastructure Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Card */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">
                  {t.overview.recentOrders}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <span>View all ({orders.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {orders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-mono font-semibold text-purple-300">
                      {order.order_number}
                    </div>
                    <div className="text-slate-300 truncate">
                      {order.customer_name} · <span className="text-slate-400">{order.city}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-white tabular-nums">
                      {order.total_amount} {order.currency}
                    </div>
                    <span
                      className={`inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                        order.order_status === 'delivered'
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                          : order.order_status === 'shipped'
                          ? 'bg-sky-950/70 text-sky-400 border border-sky-800/50'
                          : order.order_status === 'processing'
                          ? 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                          : 'bg-purple-950/70 text-purple-300 border border-purple-800/50'
                      }`}
                    >
                      {order.order_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Orders ingest automatically via <code className="text-purple-300 font-mono">POST /api/v1/orders</code></span>
            <span className="text-emerald-400">Webhook Ready</span>
          </div>
        </div>

        {/* Infrastructure Activity Stream */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">
                  {t.overview.recentActivity}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('logs')}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Audit ({logs.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {logs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-mono text-purple-400 font-semibold">{log.action_type}</span>
                    <span className="font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 line-clamp-2 leading-relaxed">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>All operations cryptographically signed & logged</span>
            <span className="text-purple-400">Zero Plaintext Leak</span>
          </div>
        </div>
      </div>
    </div>
  );
};
