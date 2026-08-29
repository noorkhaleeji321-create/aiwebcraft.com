
import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Lock, Code, ShieldCheck, FileText, Activity, Save, Trash2, Key, X, Settings } from 'lucide-react';
import { getAdminKey, setAdminKey } from '../../services/adminService';

const BOTS = [
  { id: 'advisor', name: 'AI Advisor', icon: Sparkles, desc: 'Your 24/7 assistant providing expert advice and listing valuation.' },
  { id: 'validator', name: 'Metrics Validator', icon: TrendingUp, desc: 'Verifies Stripe, GA, and GitHub project metrics.' },
  { id: 'escrow', name: 'Escrow Guardian Bot', icon: Lock, desc: 'Secures buyer funds with a 48-hour inspection period, freezes on disputes, calculates platform commission, and provides verified seller banking details for Admin manual disbursement.' },
  { id: 'security', name: 'Security Scanner', icon: Code, desc: 'Detects vulnerabilities and leaked API keys.' },
  { id: 'guard', name: 'GuardBot', icon: ShieldCheck, desc: 'Protects against prompt injection and ensures compliance.' },
  { id: 'fraud', name: 'FraudBot', icon: ShieldCheck, desc: 'Prevents financial fraud and chargebacks.' },
  { id: 'audit', name: 'AuditLogBot', icon: FileText, desc: 'Records all critical actions in the system.' },
  { id: 'orchestrator', name: 'Orchestrator', icon: Activity, desc: 'Manages bot pipeline and resilience.' },
  { id: 'metricsVerifier', name: 'Metrics Verifier', icon: TrendingUp, desc: 'Verifies real project revenue and traffic.' }
];

export const BotControlCenter: React.FC = () => {
  const [keys, setKeys] = useState<Record<string, boolean>>({}); // Tracking active status
  const [inputs, setInputs] = useState<Record<string, string>>({
    advisor: '',
    validator: '',
    security: '',
    guard: '',
    fraud: '',
    audit: '',
    orchestrator: '',
    metricsVerifier: ''
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [savingAdminKey, setSavingAdminKey] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);
  const [activeBotConfigModal, setActiveBotConfigModal] = useState<{ id: string; name: string; desc: string; icon: any } | null>(null);
  const [botConfigs, setBotConfigs] = useState<Record<string, any>>({
    advisor: { geminiApiKey: '', primaryModel: 'gemini-3.6-flash', aiModel: 'gemini-3.6-flash' },
    validator: { geminiApiKey: '', supabaseApiKey: '', supabaseUrl: '' },
    escrow: { geminiApiKey: '' },
    security: { geminiApiKey: '', openaiApiKey: '' },
    guard: { geminiApiKey: '', supabaseServiceRoleKey: '' },
    fraud: { geminiApiKey: '', emailUser: '', emailPass: '' },
    audit: { geminiApiKey: '', groqApiKey: '' },
    orchestrator: { geminiApiKey: '', encryptionKey: '' },
    metricsVerifier: { geminiApiKey: '', unsplashAccessKey: '' }
  });
  const [activeEscrowTab, setActiveEscrowTab] = useState<'paypal' | 'paddle' | 'nowpayments' | 'local' | 'gemini'>('paypal');
  const [escrowConfig, setEscrowConfig] = useState({
    geminiApiKey: '',
    paypalClientId: '',
    paypalClientSecret: '',
    paypalMode: 'live',
    paddleVendorId: '',
    paddleApiKey: '',
    paddlePublicKey: '',
    nowpaymentsApiKey: '',
    nowpaymentsIpnSecret: '',
    nowpaymentsSandbox: 'off',
    localBeneficiaryName: '',
    localCihRib: '',
    localAttijariRib: '',
    localInstructions: ''
  });

  const getAdminToken = () => getAdminKey() || '';

  const handleSaveMasterAdminKey = async () => {
    if (!adminKeyInput || adminKeyInput.trim().length < 6) {
      setStatusMsg({ type: 'error', text: 'Please enter a strong admin key of at least 6 characters.' });
      return;
    }

    setSavingAdminKey(true);
    setStatusMsg(null);
    try {
      const response = await fetch('/api/system/save-admin-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({ newAdminKey: adminKeyInput.trim() })
      });

      const text = await response.text();
      if (!text || text.trim().startsWith('<')) {
        throw new Error('Unable to connect to the server. Please verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment settings.');
      }
      const data = JSON.parse(text);
      if (response.ok && data.success) {
        setAdminKey(adminKeyInput.trim(), true);
        setAdminKeyInput('');
        setStatusMsg({
          type: 'success',
          text: 'Admin Master Passcode successfully encrypted and saved to Supabase (AES-256)!'
        });
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to save admin key.' });
      }
    } catch (err: any) {
      console.error('Error saving admin key:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Error communicating with server.' });
    } finally {
      setSavingAdminKey(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchAllBotKeys = async () => {
      try {
        for (const bot of BOTS) {
          if (!isMounted) break;
          try {
            const response = await fetch(`/api/config/agents/${bot.id}`, {
              headers: { 'Authorization': `Bearer ${getAdminToken()}` },
              signal: controller.signal
            });
            const text = await response.text();
            if (!text || text.trim().startsWith('<')) {
              continue;
            }
            let data;
            try {
              data = JSON.parse(text);
            } catch (e) {
              console.warn(`[BotControlCenter] Skipping non-JSON response for ${bot.id}`);
              continue;
            }
            if (response.ok && isMounted && data?.hasKey) {
              setKeys(prev => ({ ...prev, [bot.id]: true }));

              // Load bot credentials if decrypted
              try {
                const decResponse = await fetch(`/api/config/agents/${bot.id}?decrypt=true`, {
                  headers: { 'Authorization': `Bearer ${getAdminToken()}` },
                  signal: controller.signal
                });
                if (decResponse.ok) {
                  const decText = await decResponse.text();
                  if (decText && !decText.trim().startsWith('<')) {
                    const decData = JSON.parse(decText);
                    if (decData?.success && decData?.apiKey) {
                      if (bot.id === 'escrow') {
                        try {
                          const parsed = JSON.parse(decData.apiKey);
                          setEscrowConfig(prev => ({ ...prev, ...parsed }));
                          setBotConfigs(prev => ({
                            ...prev,
                            escrow: { ...(prev.escrow || {}), ...parsed }
                          }));
                        } catch (err) {
                          console.warn('Failed to parse escrow key as JSON:', err);
                        }
                      } else {
                        try {
                          const parsed = JSON.parse(decData.apiKey);
                          if (parsed && typeof parsed === 'object') {
                            setBotConfigs(prev => ({
                              ...prev,
                              [bot.id]: {
                                ...(prev[bot.id] || {}),
                                ...parsed
                              }
                            }));
                          }
                        } catch {
                          // plain string fallback
                          setBotConfigs(prev => ({
                            ...prev,
                            [bot.id]: {
                              ...(prev[bot.id] || {}),
                              geminiApiKey: decData.apiKey
                            }
                          }));
                        }
                      }
                    }
                  }
                }
              } catch (err) {
                console.warn(`Failed to fetch decrypted config for ${bot.id}:`, err);
              }
            }
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.error(`Error fetching key for ${bot.id}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('Error in fetchAllBotKeys:', err);
      }
    };

    fetchAllBotKeys();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const saveKey = async (botId: string, customVal?: string) => {
    const val = customVal !== undefined ? customVal : inputs[botId];
    if (!val || val.trim() === '') {
      setStatusMsg({ type: 'error', text: 'Please enter the API key before saving.' });
      return;
    }

    setLoading(prev => ({ ...prev, [botId]: true }));
    try {
      setStatusMsg(null);
      const response = await fetch('/api/config/agents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify({ botId, apiKey: val.trim() })
      });
      const text = await response.text();
      let data;
      if (!text || text.trim().startsWith('<')) {
        throw new Error(`Unable to connect to API service (${response.status}). Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY configuration.`);
      }
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Unable to parse server response as JSON. Please retry.');
      }

      if (response.ok && data.success) {
        setKeys(prev => ({ ...prev, [botId]: true }));
        setInputs(prev => ({ ...prev, [botId]: '' }));
        setStatusMsg({ type: 'success', text: `Key for ${botId} encrypted and securely saved to database.` });
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to save key.' });
      }
    } catch (err: any) {
      console.error('Error saving key:', err);
      setStatusMsg({ type: 'error', text: err.message || 'An error occurred while connecting to the server.' });
    } finally {
      setLoading(prev => ({ ...prev, [botId]: false }));
    }
  };

  const removeKey = async (botId: string) => {
    setLoading(prev => ({ ...prev, [botId]: true }));
    try {
      setStatusMsg(null);
      const response = await fetch(`/api/config/agents/${botId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${getAdminToken()}`
        }
      });
      const text = await response.text();
      let data;
      if (!text || text.trim().startsWith('<')) {
        throw new Error(`Unable to connect to API service (${response.status}). Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY configuration.`);
      }
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Unable to parse server response as JSON. Please retry.');
      }

      if (response.ok && data.success) {
        setKeys(prev => ({ ...prev, [botId]: false }));
        setInputs(prev => ({ ...prev, [botId]: '' }));
        setStatusMsg({ type: 'success', text: `Key for ${botId} deleted successfully.` });
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to delete key.' });
      }
    } catch (err: any) {
      console.error('Error removing key:', err);
      setStatusMsg({ type: 'error', text: err.message || 'An error occurred during deletion.' });
    } finally {
      setLoading(prev => ({ ...prev, [botId]: false }));
    }
  };

  return (
    <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="border-b border-[#E2DDD3] pb-4 flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#2C2A26]">AI Sentinel Hub & Bot Controller</h2>
          <p className="text-xs text-[#5D5A53]">Monitor and control all automated agents operating within AIWebCrafter.</p>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs font-medium border ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          {statusMsg.text}
        </div>
      )}

      {/* Admin Master Key Storage (Supabase Encrypted AES-256) */}
      <div className="p-5 bg-[#FDFBF7] border border-[#E2DDD3] rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2C2A26] text-amber-300 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2C2A26]">Master Admin Passcode (Supabase Encrypted AES-256)</h3>
              <p className="text-xs text-[#8C8275]">
                Save your admin master key encrypted (AES-256) in Supabase to securely authorize and verify management actions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <input
            type="password"
            placeholder="Enter new master admin passcode (e.g., CustomAdminSecretKey2026)"
            value={adminKeyInput}
            onChange={(e) => setAdminKeyInput(e.target.value)}
            disabled={savingAdminKey}
            className="flex-1 bg-white border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2C2A26] disabled:opacity-50"
          />
          <button
            onClick={handleSaveMasterAdminKey}
            disabled={savingAdminKey || !adminKeyInput.trim()}
            className="px-4 py-2 bg-[#2C2A26] text-amber-300 rounded-xl text-xs font-semibold hover:bg-[#423E38] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Save className={`w-4 h-4 ${savingAdminKey ? 'animate-spin' : ''}`} />
            <span>Save to Supabase</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BOTS.map((bot) => {
          const Icon = bot.icon;
          const isActive = !!keys[bot.id];
          const isLoading = !!loading[bot.id];
          return (
            <div key={bot.id} className="p-4 border border-[#E2DDD3] rounded-2xl space-y-3 hover:shadow-sm transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-amber-100 text-amber-900' : 'bg-[#2C2A26] text-amber-300'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#2C2A26]">{bot.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <p className="text-[10px] text-[#8C8275]">{isActive ? 'Active & Configured' : 'Inactive'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-[#5D5A53] leading-relaxed">{bot.desc}</p>
              </div>
              
              <div className="pt-2">
                {bot.id === 'escrow' ? (
                  <div className="space-y-2 w-full">
                    <button
                      onClick={() => setIsEscrowModalOpen(true)}
                      className="w-full py-2 bg-[#2C2A26] text-amber-300 hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-[#E2DDD3] shadow-sm"
                    >
                      <Settings className="w-4 h-4 text-amber-300" />
                      <span>Configure Payment & Escrow Gateways</span>
                    </button>
                    <button
                      onClick={() => setActiveBotConfigModal({ id: bot.id, name: bot.name, desc: bot.desc, icon: bot.icon })}
                      className="w-full py-2 bg-[#F5F2EB] text-[#2C2A26] hover:bg-[#EBE6DC] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-[#E2DDD3]"
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Gemini AI Key Settings</span>
                    </button>
                    {isActive && (
                      <button
                        onClick={() => removeKey(bot.id)}
                        disabled={isLoading}
                        className="w-full py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 border border-rose-200 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Deactivate & Remove Keys</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 w-full">
                    <button
                      onClick={() => setActiveBotConfigModal({ id: bot.id, name: bot.name, desc: bot.desc, icon: bot.icon })}
                      className="w-full py-2 bg-[#2C2A26] text-amber-300 hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-[#E2DDD3] shadow-sm"
                    >
                      <Settings className="w-4 h-4 text-amber-300" />
                      <span>Configure Bot & Gemini AI Keys</span>
                    </button>
                    {isActive && (
                      <button
                        onClick={() => removeKey(bot.id)}
                        disabled={isLoading}
                        className="w-full py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 border border-rose-200 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Deactivate & Remove Keys</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Escrow Guardian Bot Gateway Configuration Modal */}
      {isEscrowModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2DDD3] rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-[#E2DDD3] flex items-center justify-between bg-[#FDFBF7] rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2C2A26] text-amber-300 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2A26]">Configure Escrow & Payment Gateways (AES-256)</h3>
                  <p className="text-[11px] text-[#8C8275]">Configure PayPal, Paddle, NowPayments, & Local Moroccan bank accounts.</p>
                </div>
              </div>
              <button
                onClick={() => setIsEscrowModalOpen(false)}
                className="p-2 hover:bg-[#F5F2EB] rounded-full text-[#8C8275] hover:text-[#2C2A26] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#E2DDD3] overflow-x-auto bg-[#FAF8F5]">
              <button
                onClick={() => setActiveEscrowTab('paypal')}
                className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap text-center ${
                  activeEscrowTab === 'paypal' ? 'border-[#2C2A26] text-[#2C2A26] bg-white' : 'border-transparent text-[#8C8275] hover:text-[#2C2A26]'
                }`}
              >
                PayPal (International)
              </button>
              <button
                onClick={() => setActiveEscrowTab('local')}
                className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap text-center ${
                  activeEscrowTab === 'local' ? 'border-[#2C2A26] text-[#2C2A26] bg-white' : 'border-transparent text-[#8C8275] hover:text-[#2C2A26]'
                }`}
              >
                Local Bank & CMI
              </button>
              <button
                onClick={() => setActiveEscrowTab('gemini')}
                className={`flex-1 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap text-center flex items-center justify-center gap-1.5 ${
                  activeEscrowTab === 'gemini' ? 'border-[#2C2A26] text-[#2C2A26] bg-white' : 'border-transparent text-[#8C8275] hover:text-[#2C2A26]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Gemini AI Key</span>
              </button>
            </div>

            {/* Modal Body / Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
              {activeEscrowTab === 'paypal' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 text-blue-900 border border-blue-100 rounded-xl text-[11px] leading-relaxed">
                    PayPal is the default gateway for international transactions. These credentials will be encrypted and securely stored.
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block">PayPal Client ID</label>
                    <input
                      type="text"
                      placeholder="Enter PayPal Client ID"
                      value={escrowConfig.paypalClientId}
                      onChange={(e) => setEscrowConfig(prev => ({ ...prev, paypalClientId: e.target.value }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block">PayPal Client Secret</label>
                    <input
                      type="password"
                      placeholder="Enter PayPal Client Secret"
                      value={escrowConfig.paypalClientSecret}
                      onChange={(e) => setEscrowConfig(prev => ({ ...prev, paypalClientSecret: e.target.value }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block">PayPal Environment Mode</label>
                    <select
                      value={escrowConfig.paypalMode}
                      onChange={(e) => setEscrowConfig(prev => ({ ...prev, paypalMode: e.target.value }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2C2A26]"
                    >
                      <option value="sandbox">Sandbox (Testing / Demo)</option>
                      <option value="live">Live (Real Transactions)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeEscrowTab === 'local' && (
                <div className="space-y-4">
                  <div className="p-3 bg-rose-50 text-rose-900 border border-rose-100 rounded-xl text-[11px] leading-relaxed">
                    Moroccan direct bank wire deposit account credentials for buyers using CIH Bank or Attijariwafa Bank.
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block">Beneficiary Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter Beneficiary Full Legal Name"
                      value={escrowConfig.localBeneficiaryName}
                      onChange={(e) => setEscrowConfig(prev => ({ ...prev, localBeneficiaryName: e.target.value }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block">CIH Bank RIB (24-Digits Account Number)</label>
                    <input
                      type="text"
                      placeholder="e.g.: 230 123 4567890123456789 12"
                      value={escrowConfig.localCihRib}
                      onChange={(e) => setEscrowConfig(prev => ({ ...prev, localCihRib: e.target.value }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block">Attijariwafa Bank RIB (24-Digits Account Number)</label>
                    <input
                      type="text"
                      placeholder="e.g.: 007 123 4567890123456789 12"
                      value={escrowConfig.localAttijariRib}
                      onChange={(e) => setEscrowConfig(prev => ({ ...prev, localAttijariRib: e.target.value }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block">Wire Deposit Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="Enter deposit instructions (e.g., Please include your Order ID in wire reference and send receipt)."
                      value={escrowConfig.localInstructions}
                      onChange={(e) => setEscrowConfig(prev => ({ ...prev, localInstructions: e.target.value }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                </div>
              )}

              {activeEscrowTab === 'gemini' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Gemini AI Key for Escrow Guardian Bot:</p>
                      <p className="text-[10px] opacity-90 mt-0.5">Powers intelligent dispute arbitration, code archive inspection, and transaction audit logs.</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Gemini API Key</span>
                    </label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={escrowConfig.geminiApiKey || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEscrowConfig(prev => ({ ...prev, geminiApiKey: val }));
                        setBotConfigs(prev => ({ ...prev, escrow: { ...(prev.escrow || {}), geminiApiKey: val } }));
                      }}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-[#E2DDD3] bg-[#FDFBF7] flex items-center justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setIsEscrowModalOpen(false)}
                className="px-4 py-2 border border-[#E2DDD3] text-[#2C2A26] rounded-xl text-xs font-semibold hover:bg-[#F5F2EB] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await saveKey('escrow', JSON.stringify(escrowConfig));
                  setIsEscrowModalOpen(false);
                }}
                className="px-5 py-2.5 bg-[#2C2A26] text-amber-300 rounded-xl text-xs font-bold hover:bg-[#423E38] transition-all flex items-center gap-2 shadow"
              >
                <Save className="w-4 h-4" />
                <span>Save Gateway Keys (AES-256)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Bot Configuration Modal (Gemini API Key + Primary Key) */}
      {activeBotConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2DDD3] rounded-3xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="p-5 border-b border-[#E2DDD3] flex items-center justify-between bg-[#FDFBF7] rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2C2A26] text-amber-300 flex items-center justify-center">
                  <activeBotConfigModal.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C2A26]">Configure Bot: {activeBotConfigModal.name}</h3>
                  <p className="text-[11px] text-[#8C8275]">{activeBotConfigModal.desc}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveBotConfigModal(null)}
                className="p-2 hover:bg-[#F5F2EB] rounded-full text-[#8C8275] hover:text-[#2C2A26] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">AI Configuration for {activeBotConfigModal.name}:</p>
                  <p className="text-[10px] opacity-90 mt-0.5">
                    {activeBotConfigModal.id === 'advisor' && 'Powers intelligent project consulting, price valuation recommendations, and buyer negotiations.'}
                    {activeBotConfigModal.id === 'validator' && 'Analyzes code quality, test suite coverage, and verifies project deployment readiness.'}
                    {activeBotConfigModal.id === 'escrow' && 'Arbitrates transaction disputes, verifies repository handover, and audits escrow verification.'}
                    {activeBotConfigModal.id === 'security' && 'Performs deep static vulnerability scans and detects leaked API secrets in code.'}
                    {activeBotConfigModal.id === 'guard' && 'Blocks prompt injections, unauthorized role escalation, and malicious access payloads.'}
                    {activeBotConfigModal.id === 'fraud' && 'Identifies suspicious transaction velocity, fake reviews, and chargeback risks.'}
                    {activeBotConfigModal.id === 'audit' && 'Generates immutable architectural audit logs and code quality reports.'}
                    {activeBotConfigModal.id === 'orchestrator' && 'Coordinates real-time task queues and resilient agent workflows.'}
                    {activeBotConfigModal.id === 'metricsVerifier' && 'Validates traffic graphs, revenue screenshots, and seller analytics claims.'}
                  </p>
                </div>
              </div>

              {/* Gemini API Key Box */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Gemini API Key</span>
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={botConfigs[activeBotConfigModal.id]?.geminiApiKey || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBotConfigs(prev => ({
                      ...prev,
                      [activeBotConfigModal.id]: {
                        ...(prev[activeBotConfigModal.id] || {}),
                        geminiApiKey: val
                      }
                    }));
                  }}
                  className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                />
              </div>

              {/* Bot Specific Environment Keys from .env.example */}
              {activeBotConfigModal.id === 'advisor' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-700" />
                      <span>Primary Model (PRIMARY_MODEL)</span>
                    </label>
                    <input
                      type="text"
                      value={botConfigs.advisor?.primaryModel || ''}
                      onChange={(e) => setBotConfigs(prev => ({ ...prev, advisor: { ...prev.advisor, primaryModel: e.target.value } }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-700" />
                      <span>AI Model (AI_MODEL)</span>
                    </label>
                    <input
                      type="text"
                      value={botConfigs.advisor?.aiModel || ''}
                      onChange={(e) => setBotConfigs(prev => ({ ...prev, advisor: { ...prev.advisor, aiModel: e.target.value } }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                </>
              )}

              {activeBotConfigModal.id === 'validator' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-700" />
                      <span>Supabase API Key (SUPABASE_API_KEY)</span>
                    </label>
                    <input
                      type="password"
                      value={botConfigs.validator?.supabaseApiKey || ''}
                      onChange={(e) => setBotConfigs(prev => ({ ...prev, validator: { ...prev.validator, supabaseApiKey: e.target.value } }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-700" />
                      <span>Supabase URL (SUPABASE_URL)</span>
                    </label>
                    <input
                      type="text"
                      value={botConfigs.validator?.supabaseUrl || ''}
                      onChange={(e) => setBotConfigs(prev => ({ ...prev, validator: { ...prev.validator, supabaseUrl: e.target.value } }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                </>
              )}

              {activeBotConfigModal.id === 'security' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-700" />
                    <span>OpenAI API Key (OPENAI_API_KEY)</span>
                  </label>
                  <input
                    type="password"
                    value={botConfigs.security?.openaiApiKey || ''}
                    onChange={(e) => setBotConfigs(prev => ({ ...prev, security: { ...prev.security, openaiApiKey: e.target.value } }))}
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                  />
                </div>
              )}

              {activeBotConfigModal.id === 'guard' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-700" />
                    <span>Supabase Service Role Key (SUPABASE_SERVICE_ROLE_KEY)</span>
                  </label>
                  <input
                    type="password"
                    value={botConfigs.guard?.supabaseServiceRoleKey || ''}
                    onChange={(e) => setBotConfigs(prev => ({ ...prev, guard: { ...prev.guard, supabaseServiceRoleKey: e.target.value } }))}
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                  />
                </div>
              )}

              {activeBotConfigModal.id === 'fraud' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-700" />
                      <span>Email User (EMAIL_USER)</span>
                    </label>
                    <input
                      type="text"
                      value={botConfigs.fraud?.emailUser || ''}
                      onChange={(e) => setBotConfigs(prev => ({ ...prev, fraud: { ...prev.fraud, emailUser: e.target.value } }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-700" />
                      <span>Email Password / App Password (EMAIL_PASS)</span>
                    </label>
                    <input
                      type="password"
                      value={botConfigs.fraud?.emailPass || ''}
                      onChange={(e) => setBotConfigs(prev => ({ ...prev, fraud: { ...prev.fraud, emailPass: e.target.value } }))}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                    />
                  </div>
                </>
              )}

              {activeBotConfigModal.id === 'audit' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-700" />
                    <span>Groq API Key (GROQ_API_KEY)</span>
                  </label>
                  <input
                    type="password"
                    value={botConfigs.audit?.groqApiKey || ''}
                    onChange={(e) => setBotConfigs(prev => ({ ...prev, audit: { ...prev.audit, groqApiKey: e.target.value } }))}
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                  />
                </div>
              )}

              {activeBotConfigModal.id === 'orchestrator' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-700" />
                    <span>Encryption Key (ENCRYPTION_KEY)</span>
                  </label>
                  <input
                    type="password"
                    value={botConfigs.orchestrator?.encryptionKey || ''}
                    onChange={(e) => setBotConfigs(prev => ({ ...prev, orchestrator: { ...prev.orchestrator, encryptionKey: e.target.value } }))}
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                  />
                </div>
              )}

              {activeBotConfigModal.id === 'metricsVerifier' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-700" />
                    <span>Unsplash Access Key (UNSPLASH_ACCESS_KEY)</span>
                  </label>
                  <input
                    type="password"
                    value={botConfigs.metricsVerifier?.unsplashAccessKey || ''}
                    onChange={(e) => setBotConfigs(prev => ({ ...prev, metricsVerifier: { ...prev.metricsVerifier, unsplashAccessKey: e.target.value } }))}
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#2C2A26]"
                  />
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[#E2DDD3] bg-[#FDFBF7] flex items-center justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setActiveBotConfigModal(null)}
                className="px-4 py-2 border border-[#E2DDD3] text-[#2C2A26] rounded-xl text-xs font-semibold hover:bg-[#F5F2EB] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const cfg = botConfigs[activeBotConfigModal.id] || { geminiApiKey: '', primaryKey: '' };
                  if (activeBotConfigModal.id === 'escrow') {
                    const mergedEscrow = {
                      ...escrowConfig,
                      geminiApiKey: cfg.geminiApiKey || escrowConfig.geminiApiKey
                    };
                    setEscrowConfig(mergedEscrow);
                    await saveKey('escrow', JSON.stringify(mergedEscrow));
                  } else {
                    const payload = JSON.stringify(cfg);
                    await saveKey(activeBotConfigModal.id, payload);
                  }
                  setActiveBotConfigModal(null);
                }}
                className="px-5 py-2.5 bg-[#2C2A26] text-amber-300 rounded-xl text-xs font-bold hover:bg-[#423E38] transition-all flex items-center gap-2 shadow"
              >
                <Save className="w-4 h-4" />
                <span>Save Key (AES-256)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
