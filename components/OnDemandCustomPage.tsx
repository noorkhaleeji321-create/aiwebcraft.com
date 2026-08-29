import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Cloud, 
  Bot, 
  Smartphone, 
  Globe, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Send, 
  Code2, 
  FileText, 
  DollarSign, 
  Layers, 
  ChevronRight, 
  HelpCircle,
  Headphones,
  Check,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from '../src/context/I18nContext.js';
import { 
  OnDemandRequest, 
  getCustomRequests, 
  fetchCustomRequestsFromServer,
  saveCustomRequest,
  deleteCustomRequest
} from '../services/onDemandService.js';

export type { OnDemandRequest };


const PROJECT_TYPES = [
  {
    id: 'shopify',
    name: 'Shopify Store',
    icon: ShoppingBag,
    desc: 'Turnkey Shopify e-commerce store with winning products, premium theme, and apps',
    popular: true
  },
  {
    id: 'ecommerce',
    name: 'E-commerce D2C Platform',
    icon: ShoppingBag,
    desc: 'Custom WooCommerce or Next.js commerce store with multi-currency & local payment gateways'
  },
  {
    id: 'saas',
    name: 'Micro-SaaS Platform',
    icon: Cloud,
    desc: 'Subscription software with Stripe billing, user auth, dashboard & API integration',
    popular: true
  },
  {
    id: 'ai-tool',
    name: 'AI Tool & Web Copilot',
    icon: Bot,
    desc: 'Gemini / OpenAI powered SaaS tool, automated workflows, and prompt copilots',
    popular: true
  },
  {
    id: 'mobile-app',
    name: 'Mobile App (iOS & Android)',
    icon: Smartphone,
    desc: 'Cross-platform mobile application with push notifications and in-app subscriptions'
  },
  {
    id: 'custom-web',
    name: 'Custom Web Portal / Directory',
    icon: Globe,
    desc: 'Custom marketplace, directory, portfolio, or web application tailored from scratch'
  }
];

const AVAILABLE_FEATURES = [
  'Escrow Protection Integration',
  'Multi-Currency Stripe & PayPal',
  'AI Chatbot / Concierge Copilot',
  'Mobile Responsive UI & Dark Mode',
  'Admin Analytics & Sales Dashboard',
  'Automated Order Tracking',
  'Multi-Language Support (EN / FR / ES)',
  'SEO & High-Performance Optimization',
  'Automated Email & SMS Notifications',
  'Database Setup & Cloud API Deployment',
  'Domain Setup & SSL Configuration',
  'Full Source Code & 100% IP Transfer'
];

const BUDGET_RANGES = [
  { id: '500-1500', label: '$500 - $1,500', sub: 'Starter MVP / Ready Store' },
  { id: '1500-3500', label: '$1,500 - $3,500', sub: 'Growth SaaS / Custom Brand', popular: true },
  { id: '3500-8000', label: '$3,500 - $8,000', sub: 'Full Scale Platform' },
  { id: '8000+', label: '$8,000+', sub: 'Enterprise & Multi-Vendor' }
];

const TIMELINES = [
  { id: '7-14', label: '7 - 14 Days', desc: 'Fast turnaround sprint' },
  { id: '14-30', label: '2 - 4 Weeks', desc: 'Standard production build' },
  { id: '30-60', label: '1 - 2 Months', desc: 'Comprehensive ecosystem' }
];

interface OnDemandCustomPageProps {
  onBackToMarketplace: () => void;
}

export const OnDemandCustomPage: React.FC<OnDemandCustomPageProps> = ({ onBackToMarketplace }) => {
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'request' | 'my-orders'>('request');

  // Form State
  const [selectedType, setSelectedType] = useState<string>('shopify');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'Escrow Protection Integration',
    'Multi-Currency Stripe & PayPal',
    'Mobile Responsive UI & Dark Mode',
    'Full Source Code & 100% IP Transfer'
  ]);
  const [budget, setBudget] = useState('$1,500 - $3,500');
  const [timeline, setTimeline] = useState('2 - 4 Weeks');
  const [referenceUrls, setReferenceUrls] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<OnDemandRequest | null>(null);
  const [savedRequests, setSavedRequests] = useState<OnDemandRequest[]>([]);
  const [requestToDelete, setRequestToDelete] = useState<OnDemandRequest | null>(null);

  // Load existing orders from storage & server
  useEffect(() => {
    const list = getCustomRequests();
    setSavedRequests(list);
    fetchCustomRequestsFromServer().then(remoteList => {
      if (remoteList && remoteList.length > 0) {
        setSavedRequests(remoteList);
      }
    });

    const handleUpdate = () => {
      setSavedRequests(getCustomRequests());
    };
    window.addEventListener('aiwebcrafter_custom_requests_updated', handleUpdate);
    return () => {
      window.removeEventListener('aiwebcrafter_custom_requests_updated', handleUpdate);
    };
  }, []);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !buyerEmail.trim()) {
      alert('Please provide project description and your contact email.');
      return;
    }

    setIsSubmitting(true);

    const projectTypeObj = PROJECT_TYPES.find(t => t.id === selectedType);
    const newReq: OnDemandRequest = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      projectType: projectTypeObj?.name || selectedType,
      projectName: projectName.trim() || `${projectTypeObj?.name.split(' ')[0]} Custom Request`,
      description,
      selectedFeatures,
      budget,
      timeline,
      buyerName: buyerName.trim() || 'Client',
      buyerEmail: buyerEmail.trim(),
      buyerPhone: buyerPhone.trim() || undefined,
      referenceUrls: referenceUrls.trim() || undefined,
      status: 'PENDING_REVIEW',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setTimeout(() => {
      const updated = saveCustomRequest(newReq);
      setSavedRequests(updated);
      setSubmittedRequest(newReq);
      setIsSubmitting(false);
    }, 600);
  };

  const handleStartNew = () => {
    setSubmittedRequest(null);
    setProjectName('');
    setDescription('');
    setReferenceUrls('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#2C2A26] text-[#F5F2EB] rounded-3xl p-6 sm:p-10 border border-amber-900/30 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>On-Demand Custom Build</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
              Request a Custom Store or SaaS Platform
            </h1>
            <p className="text-sm sm:text-base text-[#D6D1C7] leading-relaxed">
              Order a custom-built Shopify store, SaaS application, or AI copilot tailored to your exact specifications. Our engineering team designs, builds, and transfers 100% turnkey ownership with verified payment gateways.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('request')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'request'
                  ? 'bg-amber-400 text-[#2C2A26] shadow-md scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              + Create New Request
            </button>
            <button
              onClick={() => setActiveTab('my-orders')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'my-orders'
                  ? 'bg-amber-400 text-[#2C2A26] shadow-md scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span>My Requests</span>
              {savedRequests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-xs">
                  {savedRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Guarantees Row */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-[#D6D1C7]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Escrow Payment Protection</span>
          </div>
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span>100% Code & IP Ownership</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Guaranteed Delivery Timeline</span>
          </div>
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-purple-400 shrink-0" />
            <span>30 Days Free Technical Support</span>
          </div>
        </div>
      </div>

      {/* VIEW: MY PREVIOUS REQUESTS */}
      {activeTab === 'my-orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-[#2C2A26]">
              Submitted Custom Requests ({savedRequests.length})
            </h2>
            <button
              onClick={() => setActiveTab('request')}
              className="text-xs text-amber-800 font-bold hover:underline"
            >
              + Submit New Request
            </button>
          </div>

          {savedRequests.length === 0 ? (
            <div className="bg-white border border-[#E2DDD3] rounded-2xl p-10 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#2C2A26]">No Custom Requests Yet</h3>
              <p className="text-xs sm:text-sm text-[#5D5A53] max-w-md mx-auto">
                Submit your first custom build request for a store or software platform tailored to your business needs. Our team will review and provide a detailed scope & quote within 24 hours.
              </p>
              <button
                onClick={() => setActiveTab('request')}
                className="px-6 py-2.5 bg-[#2C2A26] text-white font-bold text-xs rounded-xl shadow hover:bg-black transition-colors"
              >
                Request Custom Build
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedRequests.map((req) => (
                <div key={req.id} className="bg-white border border-[#E2DDD3] rounded-2xl p-5 space-y-3 shadow-xs hover:border-[#2C2A26] transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        {req.id}
                      </span>
                      <h4 className="font-bold text-sm text-[#2C2A26] mt-1">{req.projectName}</h4>
                      <p className="text-xs text-[#8C8275]">{req.projectType}</p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Under Review & Estimation
                    </span>
                  </div>

                  <p className="text-xs text-[#5D5A53] line-clamp-2 bg-[#F9F7F2] p-2.5 rounded-xl">
                    {req.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {req.selectedFeatures.slice(0, 3).map((f, i) => (
                      <span key={i} className="text-[10px] bg-[#EFEBE1] text-[#4A463F] px-2 py-0.5 rounded-md font-medium">
                        ✓ {f}
                      </span>
                    ))}
                    {req.selectedFeatures.length > 3 && (
                      <span className="text-[10px] text-[#8C8275] px-1 self-center">
                        +{req.selectedFeatures.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E2DDD3] flex items-center justify-between text-xs text-[#5D5A53]">
                    <span>Budget: <strong className="text-[#2C2A26]">{req.budget}</strong></span>
                    <span>Timeline: <strong className="text-[#2C2A26]">{req.timeline}</strong></span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#8C8275]">{req.createdAt}</span>
                      <button
                        onClick={() => setRequestToDelete(req)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Custom Request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (ENGLISH) */}
      {requestToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DDD3] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
                  Delete Custom Request?
                </h3>
                <p className="text-xs text-[#5D5A53] leading-relaxed">
                  Are you sure you want to delete <strong>"{requestToDelete.projectName}"</strong> ({requestToDelete.id})? This action cannot be undone and will permanently remove your request specifications.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2DDD3] flex items-center justify-end gap-2">
              <button
                onClick={() => setRequestToDelete(null)}
                className="px-4 py-2 bg-white border border-[#D6D1C7] text-[#2C2A26] hover:bg-stone-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const updated = deleteCustomRequest(requestToDelete.id);
                  setSavedRequests(updated);
                  setRequestToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Delete Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: REQUEST BUILD FORM */}
      {activeTab === 'request' && (
        <>
          {submittedRequest ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Request Received Successfully • {submittedRequest.id}
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#2C2A26]">
                  Thank you! We are reviewing your project specs.
                </h2>
                <p className="text-xs sm:text-sm text-[#5D5A53] leading-relaxed">
                  Your custom build request for <strong>{submittedRequest.projectName}</strong> has been logged. Our lead tech consultant will review your specifications and contact you at <strong>{submittedRequest.buyerEmail}</strong> within 24 hours with a scope & prototype estimate.
                </p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E2DDD3] rounded-2xl p-4 text-left text-xs space-y-2 text-[#4A463F]">
                <div className="flex justify-between border-b border-[#EAE5D9] pb-1.5">
                  <span className="text-[#8C8275]">Project Type:</span>
                  <span className="font-bold text-[#2C2A26]">{submittedRequest.projectType}</span>
                </div>
                <div className="flex justify-between border-b border-[#EAE5D9] pb-1.5">
                  <span className="text-[#8C8275]">Target Budget:</span>
                  <span className="font-bold text-[#2C2A26]">{submittedRequest.budget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C8275]">Target Timeline:</span>
                  <span className="font-bold text-[#2C2A26]">{submittedRequest.timeline}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleStartNew}
                  className="px-6 py-2.5 bg-white border border-[#2C2A26] text-[#2C2A26] font-bold text-xs rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Submit Another Request
                </button>
                <button
                  onClick={onBackToMarketplace}
                  className="px-6 py-2.5 bg-[#2C2A26] text-white font-bold text-xs rounded-xl hover:bg-black transition-colors"
                >
                  Back to Marketplace
                </button>
              </div>
            </div>
          ) : (
            /* MULTI-STEP REQUEST FORM */
            <form onSubmit={handleSubmit} className="bg-white border border-[#E2DDD3] rounded-3xl p-6 sm:p-10 space-y-8 shadow-sm">
              {/* Step 1: Project Type Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#2C2A26] text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#2C2A26]">
                    Select Project Type
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PROJECT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#2C2A26] bg-[#FAF8F5] ring-2 ring-[#2C2A26] shadow-sm'
                            : 'border-[#E2DDD3] bg-white hover:border-[#8C8275]'
                        }`}
                      >
                        {type.popular && (
                          <span className="absolute top-3 right-3 text-[10px] bg-amber-400/20 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                            POPULAR
                          </span>
                        )}
                        <div className="space-y-2">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-[#2C2A26] text-amber-300' : 'bg-[#F2EDE4] text-[#2C2A26]'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-[#2C2A26]">{type.name}</h4>
                            <p className="text-[11px] text-[#706B62] mt-1 leading-snug">{type.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Project Name & Detailed Specifications */}
              <div className="space-y-4 pt-4 border-t border-[#E2DDD3]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#2C2A26] text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#2C2A26]">
                    Project Name & Requirements
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#2C2A26] block mb-1.5">
                      Project / Store Brand Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. NovaStore Shopify Brand or AutoFlow AI Copilot"
                      className="w-full bg-[#FAF8F5] border border-[#D6D1C7] rounded-xl px-3.5 py-2.5 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2C2A26] block mb-1.5">
                      Reference URLs & Inspirations (Optional)
                    </label>
                    <input
                      type="text"
                      value={referenceUrls}
                      onChange={(e) => setReferenceUrls(e.target.value)}
                      placeholder="https://example.com, https://competitor.com"
                      className="w-full bg-[#FAF8F5] border border-[#D6D1C7] rounded-xl px-3.5 py-2.5 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2C2A26] block mb-1.5">
                    Describe what you want built (Detailed scope & features) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your project: target audience, product catalog/services, preferred payment gateways, design preferences, and any specific custom functionality..."
                    className="w-full bg-[#FAF8F5] border border-[#D6D1C7] rounded-xl p-3.5 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26] focus:bg-white leading-relaxed"
                  ></textarea>
                </div>
              </div>

              {/* Step 3: Features Checklist */}
              <div className="space-y-3 pt-4 border-t border-[#E2DDD3]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#2C2A26] text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#2C2A26]">
                    Included Features & Integrations
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {AVAILABLE_FEATURES.map((feat) => {
                    const isChecked = selectedFeatures.includes(feat);
                    return (
                      <button
                        type="button"
                        key={feat}
                        onClick={() => toggleFeature(feat)}
                        className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                          isChecked
                            ? 'bg-[#2C2A26] text-[#F5F2EB] border-[#2C2A26]'
                            : 'bg-[#FAF8F5] text-[#4A463F] border-[#E2DDD3] hover:bg-white'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isChecked ? 'bg-amber-400 text-black' : 'border border-[#8C8275]'}`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="leading-snug">{feat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Budget & Timeline */}
              <div className="space-y-4 pt-4 border-t border-[#E2DDD3]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#2C2A26] text-white text-xs font-bold flex items-center justify-center">4</span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#2C2A26]">
                    Budget & Expected Timeline
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Budget */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#2C2A26] block">Expected Budget Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      {BUDGET_RANGES.map((b) => (
                        <button
                          type="button"
                          key={b.id}
                          onClick={() => setBudget(b.label)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            budget === b.label
                              ? 'bg-[#2C2A26] text-[#F5F2EB] border-[#2C2A26]'
                              : 'bg-[#FAF8F5] text-[#2C2A26] border-[#E2DDD3] hover:bg-white'
                          }`}
                        >
                          <div className="font-bold text-xs">{b.label}</div>
                          <div className={`text-[10px] ${budget === b.label ? 'text-amber-300' : 'text-[#8C8275]'}`}>{b.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#2C2A26] block">Desired Turnaround Time</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIMELINES.map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => setTimeline(t.label)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            timeline === t.label
                              ? 'bg-[#2C2A26] text-[#F5F2EB] border-[#2C2A26]'
                              : 'bg-[#FAF8F5] text-[#2C2A26] border-[#E2DDD3] hover:bg-white'
                          }`}
                        >
                          <div className="font-bold text-xs">{t.label}</div>
                          <div className={`text-[9px] ${timeline === t.label ? 'text-amber-300' : 'text-[#8C8275]'}`}>{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Contact Information */}
              <div className="space-y-3 pt-4 border-t border-[#E2DDD3]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#2C2A26] text-white text-xs font-bold flex items-center justify-center">5</span>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#2C2A26]">
                    Your Contact Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#2C2A26] block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full bg-[#FAF8F5] border border-[#D6D1C7] rounded-xl px-3.5 py-2.5 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2C2A26] block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full bg-[#FAF8F5] border border-[#D6D1C7] rounded-xl px-3.5 py-2.5 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#2C2A26] block mb-1">Phone / WhatsApp (Optional)</label>
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full bg-[#FAF8F5] border border-[#D6D1C7] rounded-xl px-3.5 py-2.5 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-[#E2DDD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#5D5A53]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>No upfront financial obligation • Milestone payments released via Escrow</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-[#2C2A26] text-white hover:bg-black rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-amber-300" />
                      <span>Submit Custom Build Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default OnDemandCustomPage;
