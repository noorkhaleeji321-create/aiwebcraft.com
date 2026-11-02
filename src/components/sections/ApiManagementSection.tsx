import React, { useState } from 'react';
import { KeyRound, Play, Copy, Check, ShieldCheck, Terminal, Code2, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { ApiKey } from '../../types';
import { getApiKeys, generateApiKey, revokeApiKey, handleApiRequest, generateConnectorSnippet } from '../../services/apiService';
import { Language } from '../../locales/translations';

interface ApiManagementSectionProps {
  lang: Language;
  onRefresh: () => void;
}

export const ApiManagementSection: React.FC<ApiManagementSectionProps> = ({
  lang,
  onRefresh
}) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(getApiKeys());
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Interactive API Console state
  const [testMethod, setTestMethod] = useState<'GET' | 'POST'>('GET');
  const [testEndpoint, setTestEndpoint] = useState('/api/v1/products?limit=4');
  const [testPayload, setTestPayload] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isCallingApi, setIsCallingApi] = useState(false);

  // Snippet tabs
  const [selectedSnippetLang, setSelectedSnippetLang] = useState<'javascript' | 'php' | 'python' | 'curl'>('javascript');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const [customKey, setCustomKey] = useState<string>(() => {
    return localStorage.getItem('aiwebcrafter_custom_key') || '';
  });
  const [headerType, setHeaderType] = useState<'X-AWC-STOREFRONT-KEY' | 'X-AWC-API-KEY' | 'X-AWC-ADMIN-KEY'>('X-AWC-STOREFRONT-KEY');

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const { key, secretToken } = generateApiKey(newKeyName.trim(), ['read:products', 'write:orders']);
    setApiKeys(getApiKeys());
    setGeneratedSecret(secretToken);
    setCustomKey(secretToken);
    localStorage.setItem('aiwebcrafter_custom_key', secretToken);
    setNewKeyName('');
  };

  const handleClearSampleKeys = () => {
    if (!confirm(lang === 'ar' ? 'هل تريد مسح المفاتيح التجريبية من القائمة؟' : 'Clear sample keys from list?')) return;
    localStorage.removeItem('aiwebcrafter_api_keys_v1');
    setApiKeys([]);
  };

  const handleRevoke = (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? External store requests using it will be rejected.')) return;
    revokeApiKey(id);
    setApiKeys(getApiKeys());
  };

  const handleTestApi = async () => {
    setIsCallingApi(true);
    setApiResponse(null);
    try {
      let body: any = null;
      if (testMethod === 'POST' && testPayload.trim()) {
        body = JSON.parse(testPayload);
      }
      const tokenToUse = customKey.trim() || generatedSecret || 'awc_live_sample_token';
      const res = await handleApiRequest(testMethod, testEndpoint, body, tokenToUse);
      setApiResponse(res);
      if (testMethod === 'POST') {
        onRefresh();
      }
    } catch (err: any) {
      setApiResponse({ status: 500, success: false, error: err.message });
    } finally {
      setIsCallingApi(false);
    }
  };

  const handleSelectPreset = (method: 'GET' | 'POST', endpoint: string, body = '') => {
    setTestMethod(method);
    setTestEndpoint(endpoint);
    setTestPayload(body);
  };

  const activeKeyForSnippet = customKey.trim() || generatedSecret || 'YOUR_AWC_STOREFRONT_KEY';
  const currentSnippet = generateConnectorSnippet(selectedSnippetLang, activeKeyForSnippet, headerType);

  const copySnippet = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Connection Guide Card */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-indigo-500/20">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">
              {lang === 'ar' ? 'كيفية ربط المنصة مع متجرك الحالي' : 'How to Connect AIWebCrafter with Your Store'}
            </h3>
            <p className="text-[11px] text-indigo-300/80 font-medium">
              {lang === 'ar' ? 'اتبع هذه الخطوات البسيطة لربط متجرك ببياناتك السحابية' : 'Follow these steps to synchronize your existing store with this cloud backend.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
              <span className="text-xs font-bold text-white">{lang === 'ar' ? 'إنشاء مفتاح API' : 'Generate API Key'}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {lang === 'ar' ? 'قم بإنشاء مفتاح سري جديد من القسم أدناه. هذا المفتاح هو الذي سيسمح لمتجرك بالوصول إلى قاعدة البيانات.' : 'Create a new API token from the "Issue New API Credential" form below. This key allows your store to talk to this backend.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
              <span className="text-xs font-bold text-white">{lang === 'ar' ? 'نسخ كود الربط' : 'Copy Integration Code'}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {lang === 'ar' ? 'اختر لغة البرمجة لمتجرك (JavaScript, PHP, etc) وانسخ الكود الجاهز من قسم "Integration SDK" في الأسفل.' : 'Select your store\'s programming language and copy the pre-built code snippet from the "Integration SDK" section below.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
              <span className="text-xs font-bold text-white">{lang === 'ar' ? 'تفعيل الربط' : 'Go Live'}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {lang === 'ar' ? 'ضع الكود في ملفات متجرك. سيبدأ متجرك تلقائياً بجلب المنتجات وإرسال الطلبات إلى هذه المنصة.' : 'Paste the snippet into your store\'s source code. Your store will now fetch products and send orders directly to this cloud.'}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              SECURE STORE API GATEWAY
            </span>
            <span className="text-xs text-emerald-400 font-mono">TLS 1.3 · Rate Limited</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Store Integration & API Key Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect your existing store without altering its design or shopping interface. Use these endpoints to fetch products, deliver images, and ingest customer orders.
          </p>
        </div>
      </div>

      {/* Generated Secret Alert */}
      {generatedSecret && (
        <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200">New API Secret Key Created</span>
            <button
              onClick={() => setGeneratedSecret(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="text-[11px] text-slate-300">
            Please copy this key now. For zero-cost security, it will not be displayed again in full plaintext.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={generatedSecret}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-purple-300 select-all"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedSecret);
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
              }}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* API Keys Table & Creator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Active Store API Credentials ({apiKeys.length})
              </h3>
            </div>
            {apiKeys.length > 0 && (
              <button
                onClick={handleClearSampleKeys}
                className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'مسح المفاتيح السابقة' : 'Clear Keys'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/60 text-slate-400 font-medium">
                <tr>
                  <th className="px-3 py-2">Key Label</th>
                  <th className="px-3 py-2">Prefix</th>
                  <th className="px-3 py-2">Permissions</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-900/30">
                    <td className="px-3 py-2 text-white font-sans font-medium">{k.name}</td>
                    <td className="px-3 py-2 text-purple-300">{k.key_prefix}</td>
                    <td className="px-3 py-2 text-slate-400 font-sans text-[11px]">
                      {k.permissions.join(', ')}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          k.status === 'active'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {k.status === 'active' && (
                        <button
                          onClick={() => handleRevoke(k.id)}
                          className="text-rose-400 hover:text-rose-300 text-[11px] font-sans cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate New Key Form */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Issue New API Credential
          </h3>
          <p className="text-xs text-slate-400">
            Create dedicated tokens for your storefront website or mobile app with restricted read/write scopes.
          </p>

          <form onSubmit={handleCreateKey} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Key Name / Client</label>
              <input
                type="text"
                required
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. WooCommerce Frontend Connector"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg shadow-md shadow-purple-900/30 cursor-pointer"
            >
              Generate Live API Key
            </button>
          </form>
        </div>
      </div>

      {/* Interactive API Playground & Testing Console */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Interactive Store API Testing Console
            </h3>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSelectPreset('GET', '/api/v1/products?limit=5')}
              className="px-2 py-1 text-[11px] text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded cursor-pointer"
            >
              GET /products
            </button>
            <button
              onClick={() => handleSelectPreset('GET', '/api/v1/categories')}
              className="px-2 py-1 text-[11px] text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded cursor-pointer"
            >
              GET /categories
            </button>
            <button
              onClick={() =>
                handleSelectPreset(
                  'POST',
                  '/api/v1/orders',
                  JSON.stringify(
                    {
                      customer_name: "Hamza Tazi",
                      customer_phone: "+212 661-998877",
                      customer_email: "hamza.tazi@gmail.com",
                      shipping_address: "32 Boulevard Mohammed V",
                      city: "Casablanca",
                      payment_method: "Cash On Delivery (COD)",
                      items: [
                        { product_id: 1, product_name: "Céleste Organic Argan Oil", sku: "ARG-BIO-100", unit_price: 195, quantity: 2 },
                        { product_id: 4, product_name: "Moroccan Teapot", sku: "ART-POT-004", unit_price: 380, quantity: 1 }
                      ],
                      notes: "Please call before arrival"
                    },
                    null,
                    2
                  )
                )
              }
              className="px-2 py-1 text-[11px] text-purple-300 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 rounded cursor-pointer font-semibold"
            >
              Test POST /orders (Checkout Sim)
            </button>
          </div>
        </div>

        {/* Request Input Form */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={testMethod}
              onChange={(e) => setTestMethod(e.target.value as 'GET' | 'POST')}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-purple-400 cursor-pointer"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>

            <input
              type="text"
              value={testEndpoint}
              onChange={(e) => setTestEndpoint(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200"
            />

            <button
              onClick={handleTestApi}
              disabled={isCallingApi}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-purple-900/20 cursor-pointer disabled:opacity-50"
            >
              {isCallingApi ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>

          {testMethod === 'POST' && (
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                JSON Request Body Payload:
              </label>
              <textarea
                rows={6}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder='{ "customer_name": "...", "items": [...] }'
              />
            </div>
          )}
        </div>

        {/* API Response Display */}
        {apiResponse && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Response Status:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    apiResponse.status >= 200 && apiResponse.status < 300
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {apiResponse.status} {apiResponse.success ? 'OK' : 'Error'}
                </span>
              </div>
              <span className="text-purple-300">
                Latency: {apiResponse.meta?.latency_ms ?? 2} ms
              </span>
            </div>

            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 max-h-64 overflow-y-auto leading-relaxed">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Code Snippets for Store Integration */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-4">
        {/* Real Key Input & Configuration */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-purple-500/30 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'ar' ? 'المفتاح المضمّن في الأكواد البرمجية (Live Snippet Key)' : 'Key Embedded in Snippets'}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">Header:</span>
              <select
                value={headerType}
                onChange={(e) => setHeaderType(e.target.value as any)}
                className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-purple-300 font-mono cursor-pointer"
              >
                <option value="X-AWC-STOREFRONT-KEY">X-AWC-STOREFRONT-KEY (Storefront)</option>
                <option value="X-AWC-ADMIN-KEY">X-AWC-ADMIN-KEY (Admin Master)</option>
                <option value="X-AWC-API-KEY">X-AWC-API-KEY (General)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customKey}
              onChange={(e) => {
                const val = e.target.value;
                setCustomKey(val);
                localStorage.setItem('aiwebcrafter_custom_key', val);
              }}
              placeholder={lang === 'ar' ? 'الصق مفتاح متجرك الحقيقي AWC_STOREFRONT_KEY هنا لتحديث الأكواد فوراً...' : 'Paste your real AWC_STOREFRONT_KEY here to update snippets instantly...'}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-purple-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {customKey && (
              <button
                onClick={() => {
                  setCustomKey('');
                  localStorage.removeItem('aiwebcrafter_custom_key');
                }}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                title="Reset Key"
              >
                Reset
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400">
            {lang === 'ar'
              ? 'أي مفتاح تكتبه هنا سيظهر فوراً داخل أكواد JavaScript, PHP, Python, cURL بالأسفل لتقوم بنسخه مباشرة إلى متجرك.'
              : 'The key you enter here is instantly reflected across all JavaScript, PHP, Python, and cURL snippets below.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Integration SDK & Code Snippets for Your Existing Store
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {(['javascript', 'php', 'python', 'curl'] as const).map((langKey) => (
              <button
                key={langKey}
                onClick={() => setSelectedSnippetLang(langKey)}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer capitalize ${
                  selectedSnippetLang === langKey
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                {langKey}
              </button>
            ))}

            <button
              onClick={copySnippet}
              className="ml-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-purple-200 overflow-x-auto leading-relaxed">
          {currentSnippet}
        </pre>
      </div>
    </div>
  );
};
