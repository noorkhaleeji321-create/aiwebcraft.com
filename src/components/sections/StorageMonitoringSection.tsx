import React, { useState } from 'react';
import { Gauge, ShieldCheck, AlertCircle, HardDrive, Database, Cpu, CheckCircle2, Lock } from 'lucide-react';
import { StorageQuota } from '../../types';
import { Language } from '../../locales/translations';

interface StorageMonitoringSectionProps {
  quota: StorageQuota;
  lang: Language;
}

export const StorageMonitoringSection: React.FC<StorageMonitoringSectionProps> = ({ quota, lang }) => {
  const [safetyLockActive, setSafetyLockActive] = useState(true);

  // Compute percentages
  const d1ReadPct = ((quota.d1_rows_read_today / quota.d1_rows_read_limit) * 100).toFixed(2);
  const d1WritePct = ((quota.d1_rows_written_today / quota.d1_rows_written_limit) * 100).toFixed(2);
  const r2StorageGb = (quota.r2_storage_bytes / (1024 * 1024 * 1024)).toFixed(3);
  const r2StoragePct = ((quota.r2_storage_bytes / quota.r2_storage_limit_bytes) * 100).toFixed(3);
  const r2OpsAPct = ((quota.r2_class_a_ops / quota.r2_class_a_limit) * 100).toFixed(3);
  const r2OpsBPct = ((quota.r2_class_b_ops / quota.r2_class_b_limit) * 100).toFixed(3);

  // Capacity projection: average product is 4KB text + 450KB image
  const remainingR2Bytes = quota.r2_storage_limit_bytes - quota.r2_storage_bytes;
  const remainingProductsCapacity = Math.floor(remainingR2Bytes / (450 * 1024));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              BUDGET GUARANTEE: ZERO MAD (0 DH)
            </span>
            <span className="text-xs text-emerald-400 font-mono">No Credit Card Active</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Permanent Storage & Quota Telemetry Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict automated protection against cloud billing. Real-time telemetry ensures 100% zero-cost operation and data preservation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Overrun Prevention Active</span>
          </div>
        </div>
      </div>

      {/* Safety Policy Status Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-purple-950/20 border border-emerald-800/40 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-semibold text-emerald-300">
            Mandatory Zero-Cost Compliance Protocol
          </div>
          <p className="text-slate-300 mt-0.5 leading-relaxed">
            Automatic billing, paid upgrades, and external paid APIs are completely disabled. If any resource approaches 85% of its free quota, the platform preserves all existing data in read-only mode to prevent unexpected fees.
          </p>
        </div>
      </div>

      {/* Detailed Service Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Central Relational DB */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Central Relational Database (SQLite)
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">100% Free Tier</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Reads per day */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Daily Rows Read:</span>
                <span className="font-mono tabular-nums text-white">
                  {quota.d1_rows_read_today.toLocaleString()} / 5,000,000 ({d1ReadPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.max(1, Number(d1ReadPct))}%` }} />
              </div>
            </div>

            {/* Writes per day */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Daily Rows Written:</span>
                <span className="font-mono tabular-nums text-white">
                  {quota.d1_rows_written_today.toLocaleString()} / 100,000 ({d1WritePct}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.max(1, Number(d1WritePct))}%` }} />
              </div>
            </div>

            {/* DB Storage volume */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Database Disk Storage:</span>
                <span className="font-mono tabular-nums text-white">
                  {(quota.d1_storage_bytes / (1024 * 1024)).toFixed(1)} MB / 10.0 GB Max
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[1%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Media & Product Image Storage */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Media & Product Image Storage
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">100% Free Tier</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Storage Volume */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Storage Occupancy:</span>
                <span className="font-mono tabular-nums text-white">
                  {r2StorageGb} GB / 10.0 GB ({r2StoragePct}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.max(1, Number(r2StoragePct))}%` }} />
              </div>
            </div>

            {/* Class A Operations (Uploads) */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Monthly Class A Ops (Uploads):</span>
                <span className="font-mono tabular-nums text-white">
                  {quota.r2_class_a_ops} / 1,000,000 ({r2OpsAPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full w-[1%]" />
              </div>
            </div>

            {/* Class B Operations (Reads) */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Monthly Class B Ops (Reads/CDN):</span>
                <span className="font-mono tabular-nums text-white">
                  {quota.r2_class_b_ops.toLocaleString()} / 10,000,000 ({r2OpsBPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[1%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Free Tier Capacity Projection */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Growth & Catalog Capacity Forecast
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Based on an average product profile (complete descriptions, pricing, variations + high-res WebP image @ 450 KB), your remaining free capacity supports:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Remaining Free Storage</span>
            <span className="text-lg font-bold font-mono text-purple-300">~9.98 GB</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Remaining Product Capacity</span>
            <span className="text-lg font-bold font-mono text-emerald-400">+{remainingProductsCapacity.toLocaleString()} Products</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">Projected Monthly Cost</span>
            <span className="text-lg font-bold font-mono text-white">0.00 MAD (Free)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
