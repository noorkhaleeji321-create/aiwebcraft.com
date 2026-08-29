import React, { useState, useEffect } from 'react';
import { CheckCircle2, Globe, Sparkles, RefreshCw } from 'lucide-react';

interface AdminCommissionsTabProps {
  platformCommission: number;
  formatCurrency: (val: number) => string;
  commissionSavedMsg: boolean;
  commissionPct: number;
  handleSaveCommission: (val: number) => Promise<void> | void;
}

export const AdminCommissionsTab: React.FC<AdminCommissionsTabProps> = ({
  platformCommission,
  formatCurrency,
  commissionSavedMsg,
  commissionPct,
  handleSaveCommission
}) => {
  // Fully controlled local state for the slider & input to prevent background re-renders from overwriting edits
  const [localPct, setLocalPct] = useState<number>(commissionPct);
  const [isSaving, setIsSaving] = useState(false);

  // Update local slider state only on initial mount or when a new confirmed commissionPct prop is received
  useEffect(() => {
    setLocalPct(commissionPct);
  }, []);

  const onSave = async () => {
    setIsSaving(true);
    try {
      await handleSaveCommission(localPct);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Platform Commissions & Global Marketplace Fee</h2>
          <p className="text-xs text-[#5D5A53]">Manage marketplace acquisition fees and global platform revenue percentage.</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-[#8C8275] block uppercase">Collected Commissions</span>
          <span className="font-serif font-bold text-2xl text-amber-900">{formatCurrency(platformCommission)}</span>
        </div>
      </div>

      {commissionSavedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Platform commission rate successfully updated globally to {localPct}% across all browsers and sessions!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-[#FDFCF9] border border-[#E2DDD3] rounded-3xl space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-[#2C2A26] text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-700" />
                <span>Global Platform Fee Percentage (%)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={localPct}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) setLocalPct(v);
                  }}
                  className="w-20 px-3 py-1 bg-white border border-amber-300 rounded-xl text-right font-serif font-bold text-lg text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="font-bold text-amber-900 text-sm">%</span>
              </div>
            </div>
            <p className="text-xs text-[#5D5A53] leading-relaxed">
              This percentage is unified and synchronized globally. When you save it, every buyer, seller, and new browser session will immediately see and calculate deals using this exact rate.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-[#8C8275]">
                <span>Min: 0.5%</span>
                <span>Current: {localPct}%</span>
                <span>Max: 30%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.5"
                value={localPct}
                onChange={(e) => setLocalPct(parseFloat(e.target.value))}
                className="w-full accent-[#2C2A26] cursor-pointer"
              />
            </div>

            <div className="flex gap-2">
              {[3, 5, 10, 15, 20, 25].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLocalPct(preset)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    localPct === preset
                      ? 'bg-[#2C2A26] text-[#F5F2EB] border-[#2C2A26] shadow-sm'
                      : 'bg-white text-[#2C2A26] border-[#E2DDD3] hover:bg-[#F5F2EB]'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>

            <button
              onClick={onSave}
              disabled={isSaving}
              className="w-full py-3.5 bg-[#2C2A26] text-[#F5F2EB] font-bold rounded-xl text-xs hover:bg-[#423E38] transition-all shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Saving and Syncing Globally...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Save & Broadcast Global Commission ({localPct}%)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Sync Info Box */}
        <div className="p-6 bg-gradient-to-br from-[#2C2A26] to-[#423E38] text-white rounded-3xl space-y-4 flex flex-col justify-between shadow-md">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
                Real-Time Cloud Sync Active
              </span>
            </div>

            <h3 className="font-serif font-bold text-lg text-white">
              Global Platform Unification
            </h3>

            <p className="text-xs text-[#D6D1C7] leading-relaxed">
              When saved, this commission rate is written directly to the server state and persisted to the cloud database. Any user opening AIWebCrafter from any browser or incognito session will see this unified rate.
            </p>
          </div>

          <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between text-[#D6D1C7]">
              <span>Current Live Rate:</span>
              <strong className="text-white font-mono">{localPct}%</strong>
            </div>
            <div className="flex justify-between text-[#D6D1C7]">
              <span>Example $10,000 Deal:</span>
              <strong className="text-emerald-300 font-mono">+${Math.round(10000 * (localPct / 100)).toLocaleString()} Fee</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

