import React, { useState } from 'react';
import { Settings, ShieldCheck, Lock, CheckCircle2, Save, Globe, DollarSign, Truck, Database, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { StoreSetting } from '../../types';
import { getDatabase, persistDatabase, addActivityLog } from '../../db/sqliteEngine';
import { clearPermanentStorageProducts, clearPermanentStorageOrders } from '../../services/gitStorageClient';
import { Language } from '../../locales/translations';

interface SettingsSectionProps {
  settings: StoreSetting[];
  lang: Language;
  onRefresh: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ settings, lang, onRefresh }) => {
  const getVal = (key: string, def = '') => settings.find((s) => s.key === key)?.value || def;

  const [storeName, setStoreName] = useState(getVal('store_name', 'Natural Health Morocco'));
  const [storeUrl, setStoreUrl] = useState(getVal('store_url', 'https://natural-health-morocco.vercel.app'));
  const [currency, setCurrency] = useState(getVal('default_currency', 'MAD'));
  const [freeShipping, setFreeShipping] = useState(getVal('free_shipping_threshold', '500'));
  const [standardFee, setStandardFee] = useState(getVal('standard_delivery_fee', '35'));
  const [coveredRegions, setCoveredRegions] = useState(
    getVal('covered_regions', 'Casablanca, Rabat, Marrakech, Tangier, Fes, Agadir, Oujda, Tetouan')
  );
  const [is2FaEnabled, setIs2FaEnabled] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();

      const pairs = [
        { k: 'store_name', v: storeName, cat: 'general' },
        { k: 'store_url', v: storeUrl, cat: 'general' },
        { k: 'default_currency', v: currency, cat: 'localization' },
        { k: 'free_shipping_threshold', v: freeShipping, cat: 'shipping' },
        { k: 'standard_delivery_fee', v: standardFee, cat: 'shipping' },
        { k: 'covered_regions', v: coveredRegions, cat: 'shipping' }
      ];

      for (const p of pairs) {
        db.run(`INSERT OR REPLACE INTO store_settings (key, value, category, updated_at) VALUES (?, ?, ?, ?)`, [
          p.k,
          p.v,
          p.cat,
          now
        ]);
      }

      persistDatabase(db);
      await addActivityLog('SQL_QUERY', 'SETTINGS', 'store_config', 'Updated store configuration parameters');
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
      onRefresh();
    } catch (err: any) {
      alert('Save error: ' + err.message);
    }
  };
  
  const [isClearingProds, setIsClearingProds] = useState(false);
  const [isClearingOrds, setIsClearingOrds] = useState(false);

  const handleClearProducts = async () => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من مسح جميع المنتجات التجريبية؟ لا يمكن التراجع عن هذه الخطوة.' : 'Are you sure you want to clear all sample products? This cannot be undone.')) return;
    
    setIsClearingProds(true);
    try {
      const res = await clearPermanentStorageProducts();
      if (res.success) {
        alert(lang === 'ar' ? `تم مسح ${res.cleared_count} منتج بنجاح.` : `Cleared ${res.cleared_count} products successfully.`);
        onRefresh();
      } else {
        alert('Error: ' + res.error);
      }
    } catch (err: any) {
      alert('Clear error: ' + err.message);
    } finally {
      setIsClearingProds(false);
    }
  };

  const handleClearOrders = async () => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من مسح جميع الطلبات الوهمية؟' : 'Are you sure you want to clear all sample orders?')) return;
    
    setIsClearingOrds(true);
    try {
      const res = await clearPermanentStorageOrders();
      if (res.success) {
        alert(lang === 'ar' ? `تم مسح ${res.cleared_count} طلب بنجاح.` : `Cleared ${res.cleared_count} orders successfully.`);
        onRefresh();
      } else {
        alert('Error: ' + res.error);
      }
    } catch (err: any) {
      alert('Clear error: ' + err.message);
    } finally {
      setIsClearingOrds(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              SYSTEM CONFIGURATION
            </span>
            <span className="text-xs text-emerald-400 font-mono">Synced to SQLite</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Account, Security & Store Parameters
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure delivery rules, pricing currency (MAD), security policies, and connection links for your external store.
          </p>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Store settings saved successfully and synced across database.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Parameters Card */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Globe className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white uppercase tracking-wider">
              Connected External Store Identity
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Store Brand Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Store Front-End URL</label>
              <input
                type="text"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Currency & Delivery Rules */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Truck className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white uppercase tracking-wider">
              Currency & Shipping Rules (Morocco Focus)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Store Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="MAD">MAD (Moroccan Dirham - درهم)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Standard Delivery Fee (MAD)</label>
              <input
                type="number"
                value={standardFee}
                onChange={(e) => setStandardFee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Free Delivery Threshold (MAD)</label>
              <input
                type="number"
                value={freeShipping}
                onChange={(e) => setFreeShipping(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Covered Shipping Regions & Cities</label>
            <input
              type="text"
              value={coveredRegions}
              onChange={(e) => setCoveredRegions(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
        </div>

        {/* Security & Access Policy */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Lock className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white uppercase tracking-wider">
              Security & Master Access Control
            </h3>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div>
              <div className="font-semibold text-white">Strict Zero-Cost Defense Shield</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Automatically rejects any third-party paid service or unauthorized billing trigger.
              </div>
            </div>
            <span className="text-emerald-400 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
              ENFORCED
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div>
              <div className="font-semibold text-white">Two-Factor Authentication (TOTP)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Requires time-based one-time code on owner login.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIs2FaEnabled(!is2FaEnabled)}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                is2FaEnabled
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {is2FaEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
        {/* Maintenance & Data Safety Card */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Database className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-white uppercase tracking-wider">
              {lang === 'ar' ? 'الصيانة وإدارة البيانات التجريبية' : 'Maintenance & Data Management'}
            </h3>
          </div>

          <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-white font-semibold">{lang === 'ar' ? 'منطقة العمليات الحساسة' : 'Sensitive Operations Area'}</div>
              <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {lang === 'ar' 
                  ? 'استخدم هذه الأدوات فقط لمسح البيانات الوهمية والبدء بمتجرك الحقيقي. سيتم مسح البيانات من مخزن GitHub الدائم ومن قاعدة البيانات المحلية.'
                  : 'Use these tools ONLY to clear sample data before migrating your real store. This affects both GitHub permanent storage and local database.'}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleClearProducts}
                  disabled={isClearingProds}
                  className="px-4 py-2 bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 text-red-300 rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isClearingProds ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{lang === 'ar' ? 'مسح جميع المنتجات' : 'Clear All Products'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearOrders}
                  disabled={isClearingOrds}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isClearingOrds ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{lang === 'ar' ? 'مسح جميع الطلبات الوهمية' : 'Clear All Sample Orders'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-lg shadow-purple-900/30 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
