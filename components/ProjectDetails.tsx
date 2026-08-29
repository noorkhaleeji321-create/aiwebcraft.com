import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ShieldCheck, 
  DollarSign, 
  MessageSquare, 
  TrendingUp, 
  Globe, 
  Sparkles, 
  Check,
  ExternalLink,
  Play
} from 'lucide-react';
import { Listing } from '../types.js';
import ProjectGallery from './ProjectGallery.js';
import ProjectOverview from './ProjectOverview.js';
import FinancialOverview from './FinancialOverview.js';
import TechnologyList from './TechnologyList.js';
import SellerCard from './SellerCard.js';
import VerificationBadge from './VerificationBadge.js';
import ContactModal from './ContactModal.js';
import OfferModal from './OfferModal.js';
import BuyModal from './BuyModal.js';

interface ProjectDetailsProps {
  listing: Listing;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onOpenBuyerDelivery?: (orderId: string) => void;
  onNavigateMessages?: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  listing,
  onBack,
  isSaved,
  onToggleSave,
  onOpenBuyerDelivery,
  onNavigateMessages
}) => {
  const [activeModal, setActiveModal] = useState<'contact' | 'offer' | 'buy' | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatNum = (val: any) => {
    if (val === undefined || val === null || val === '') return '0';
    const num = typeof val === 'number' ? val : Number(String(val).replace(/,/g, ''));
    return isNaN(num) ? String(val) : num.toLocaleString();
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      // Fallback
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-20 px-4 sm:px-8 lg:px-12 w-full max-w-[1440px] mx-auto space-y-8" id="project-details-page">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-b border-[#E2DDD3] pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E2DDD3] hover:border-[#2C2A26] text-[#2C2A26] rounded-xl text-sm font-semibold transition-all shadow-2xs"
          id="back-to-marketplace-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="p-2.5 bg-white border border-[#E2DDD3] hover:border-[#2C2A26] rounded-xl text-[#2C2A26] text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Share listing link"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          <button
            onClick={() => onToggleSave(listing.id)}
            className={`p-2.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSaved
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-white border-[#E2DDD3] text-[#2C2A26] hover:border-[#2C2A26]'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`}
            />
            <span className="hidden sm:inline">
              {isSaved ? 'Saved' : 'Save Project'}
            </span>
          </button>
        </div>
      </div>

      {/* Header Info Banner */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-[#2C2A26] text-[#F5F2EB] text-xs font-bold rounded-lg uppercase tracking-wider">
                {listing.category}
              </span>
              <span className="px-3 py-1 bg-[#EAE5D9] text-[#2C2A26] text-xs font-semibold rounded-lg">
                {listing.platform}
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: {listing.status}</span>
              </span>

              {listing.business_stage && (
                <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                  listing.business_stage === 'PRE_LAUNCH' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                  listing.business_stage === 'BETA' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                  listing.business_stage === 'LIVE_NO_REVENUE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  listing.business_stage === 'LIVE_REVENUE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Stage: {
                    listing.business_stage === 'PRE_LAUNCH' ? '🚀 Pre-Launch' :
                    listing.business_stage === 'BETA' ? '🧪 Beta' :
                    listing.business_stage === 'LIVE_NO_REVENUE' ? '🌐 Live / No Revenue' :
                    listing.business_stage === 'LIVE_REVENUE' ? '💰 Live / Revenue' :
                    '🏢 Established'
                  }
                </span>
              )}

              {listing.asset_type && (
                <span className="px-3 py-1 bg-[#F5F2EB] text-[#2C2A26] border border-[#E2DDD3] text-xs font-semibold rounded-lg">
                  Type: {listing.asset_type}
                </span>
              )}

              {(listing.business_stage === 'LIVE_REVENUE' || listing.business_stage === 'ESTABLISHED') && (
                <span className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1 ${
                  listing.revenueVerificationStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {listing.revenueVerificationStatus === 'VERIFIED' ? '✓ Revenue Verified' : 'Revenue Claimed'}
                </span>
              )}
            </div>

            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#2C2A26] leading-tight">
              {listing.title}
            </h1>
            <p className="text-base text-[#5D5A53] leading-relaxed">
              {listing.tagline}
            </p>
          </div>

          {/* Pricing Highlight Card */}
          <div className="bg-[#FDFCF9] border-2 border-[#2C2A26] rounded-2xl p-5 min-w-[240px] text-right space-y-2 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C8275] block">
              Asking Acquisition Price
            </span>
            <div className="font-serif font-bold text-3xl text-[#2C2A26]">
              {formatCurrency(listing.askingPrice)}
            </div>

            <div className="pt-2 border-t border-[#E2DDD3] text-xs space-y-1 text-[#5D5A53]">
              <div className="flex justify-between">
                <span>Monthly Revenue:</span>
                <strong className="text-[#2C2A26]">{formatCurrency(listing.monthlyRevenue)}/mo</strong>
              </div>
              <div className="flex justify-between">
                <span>Net Profit:</span>
                <strong className="text-emerald-700">{formatCurrency(listing.monthlyProfit)}/mo</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E2DDD3] text-xs">
          <div className="p-3 bg-[#F5F2EB] rounded-xl">
            <span className="text-[#8C8275] uppercase font-bold block text-[10px]">
              Monthly Traffic
            </span>
            <span className="font-bold text-[#2C2A26] text-sm">
              {(listing.monthlyVisitors || 0).toLocaleString()} Visitors
            </span>
          </div>

          <div className="p-3 bg-[#F5F2EB] rounded-xl">
            <span className="text-[#8C8275] uppercase font-bold block text-[10px]">
              Annualized Revenue
            </span>
            <span className="font-bold text-[#2C2A26] text-sm">
              {formatCurrency(listing.financialOverview?.ttmRevenue ?? ((listing.monthlyRevenue || 0) * 12))} TTM
            </span>
          </div>

          <div className="p-3 bg-[#F5F2EB] rounded-xl">
            <span className="text-[#8C8275] uppercase font-bold block text-[10px]">
              Escrow Protection
            </span>
            <span className="font-bold text-emerald-700 text-sm flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Protected</span>
            </span>
          </div>

          <div className="p-3 bg-[#F5F2EB] rounded-xl">
            <span className="text-[#8C8275] uppercase font-bold block text-[10px]">
              Onboarding Support
            </span>
            <span className="font-bold text-[#2C2A26] text-sm">
              30 Days Included
            </span>
          </div>
        </div>
      </div>

      {/* Live Demo & Video Walkthrough Links for Buyers */}
      <div className="bg-gradient-to-r from-amber-50 via-emerald-50/45 to-white border border-[#E2DDD3] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm" id="buyer-demo-video-banner">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-900 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#2C2A26]">
              Interactive Live App Demo & Video Walkthrough Available
            </h3>
            <p className="text-xs text-[#5D5A53]">
              Test the live application or watch the walkthrough video (YouTube / Loom) to inspect {listing.title} before acquiring.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (listing.demoUrl) {
                window.open(listing.demoUrl, '_blank', 'noreferrer');
              } else {
                setShowDemoModal(true);
              }
            }}
            className="px-4 py-2.5 bg-[#2C2A26] hover:bg-[#423E38] text-[#F5F2EB] rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            id="buyer-visit-demo-link"
          >
            <ExternalLink className="w-4 h-4 text-amber-300" />
            <span>Visit Live App Demo</span>
          </button>

          <button
            onClick={() => {
              const rawVideo = listing.videoUrl || (listing as any).video_url || (listing as any).video;
              if (rawVideo && typeof rawVideo === 'string' && rawVideo.trim().length > 0) {
                let formattedUrl = rawVideo.trim();
                if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                  formattedUrl = `https://${formattedUrl}`;
                }
                window.open(formattedUrl, '_blank', 'noreferrer');
              } else {
                setShowVideoModal(true);
              }
            }}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            id="buyer-watch-video-link"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Watch YouTube / Loom Walkthrough</span>
          </button>
        </div>
      </div>

      {/* 1. Full-Width Project Visual Preview (Gallery) */}
      <div className="w-full" id="project-visual-preview-container">
        <ProjectGallery
          images={listing.gallery}
          title={listing.title}
          demoUrl={listing.demoUrl}
        />
      </div>

      {/* Main Grid: Left Column (Details), Right Column (CTAs + Verification) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stage Specific Details Block */}
          <div className="bg-white border border-[#E2DDD3] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2DDD3]">
              <div className="p-2 bg-amber-500/10 text-amber-900 rounded-xl">
                <Sparkles className="w-4 h-4 text-amber-800" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
                  {listing.business_stage === 'PRE_LAUNCH' ? '🚀 Pre-Launch Roadmap & Tech' :
                   listing.business_stage === 'BETA' ? '🧪 Beta Operations & User Stats' :
                   listing.business_stage === 'LIVE_NO_REVENUE' ? '🌐 Live Engagement Metrics' :
                   listing.business_stage === 'LIVE_REVENUE' ? '💰 Financial Performance details' :
                   '🏢 Established Business Operations'}
                </h3>
                <p className="text-[11px] text-[#5D5A53]">
                  Operational parameters specific to this business development stage
                </p>
              </div>
            </div>

            {listing.business_stage === 'PRE_LAUNCH' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listing.expectedLaunchDate && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Expected Launch Date</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{listing.expectedLaunchDate}</span>
                  </div>
                )}
                {listing.developmentProgress !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Development Progress</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-full bg-[#EAE5D9] h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: `${listing.developmentProgress}%` }}></div>
                      </div>
                      <span className="font-bold text-emerald-800 shrink-0">{listing.developmentProgress}%</span>
                    </div>
                  </div>
                )}
                {listing.betaWaitlistUsers !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Beta Waitlist Users</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{formatNum(listing.betaWaitlistUsers)} users</span>
                  </div>
                )}
                {listing.demo && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Interactive Prototype / Demo</span>
                    <a href={listing.demo} target="_blank" rel="noreferrer" className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1 mt-1">
                      <span>View Demo Prototype</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
                {listing.featuresCompleted && listing.featuresCompleted.length > 0 && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs md:col-span-2">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Features Completed</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {listing.featuresCompleted.map((f, i) => (
                        <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md font-medium">✓ {f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {listing.featuresRemaining && listing.featuresRemaining.length > 0 && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs md:col-span-2">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Upcoming Roadmap Features</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {listing.featuresRemaining.map((f, i) => (
                        <span key={i} className="px-2 py-1 bg-[#F5F2EB] text-[#5D5A53] border border-[#E2DDD3] rounded-md font-medium">⏳ {f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {listing.business_stage === 'BETA' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listing.betaStartDate && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Beta Start Date</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{listing.betaStartDate}</span>
                  </div>
                )}
                {listing.betaUsers !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Registered Beta Users</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{formatNum(listing.betaUsers)} users</span>
                  </div>
                )}
                {listing.payingUsers !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Early Paying Customers</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{listing.payingUsers} paying accounts</span>
                  </div>
                )}
                {listing.expectedPublicLaunch && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Expected Public Launch</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{listing.expectedPublicLaunch}</span>
                  </div>
                )}
                {listing.currentFeatures && listing.currentFeatures.length > 0 && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs md:col-span-2">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Active Beta Features</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {listing.currentFeatures.map((f, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-50 text-purple-800 border border-purple-100 rounded-md font-medium">⚡ {f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {listing.knownIssues && listing.knownIssues.length > 0 && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs md:col-span-2">
                    <span className="font-bold text-red-800 block uppercase mb-1">Known Limitations / Issues</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {listing.knownIssues.map((f, i) => (
                        <span key={i} className="px-2 py-1 bg-red-50 text-red-800 border border-red-100 rounded-md font-medium">⚠️ {f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {listing.business_stage === 'LIVE_NO_REVENUE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listing.launchDate && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Platform Launch Date</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{listing.launchDate}</span>
                  </div>
                )}
                {listing.totalUsers !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Total Registered Users</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{formatNum(listing.totalUsers)}</span>
                  </div>
                )}
                {listing.activeUsers !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Monthly Active Users (MAU)</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{formatNum(listing.activeUsers)} MAU</span>
                  </div>
                )}
                {listing.traffic !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Monthly Visits</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{formatNum(listing.traffic)} unique visits</span>
                  </div>
                )}
                {listing.growth && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs md:col-span-2">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">User Growth Rate & Engagement Pattern</span>
                    <span className="text-sm font-medium text-[#2C2A26] block mt-1">{listing.growth}</span>
                  </div>
                )}
              </div>
            )}

            {listing.business_stage === 'LIVE_REVENUE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listing.mrr !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Monthly Recurring Revenue (MRR)</span>
                    <span className="text-sm font-bold text-emerald-800">${formatNum(listing.mrr)} /mo</span>
                  </div>
                )}
                {listing.arr !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Annual Recurring Revenue (ARR)</span>
                    <span className="text-sm font-bold text-emerald-950">${formatNum(listing.arr)} /yr</span>
                  </div>
                )}
                {listing.payingCustomers !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Paying Customers</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{listing.payingCustomers} subscribers</span>
                  </div>
                )}
                {listing.totalCustomers !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Total Customer Base</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{listing.totalCustomers} users</span>
                  </div>
                )}
                {listing.revenueSource && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Revenue Stream Model</span>
                    <span className="text-sm font-medium text-[#2C2A26]">{listing.revenueSource}</span>
                  </div>
                )}
                {listing.revenueVerificationStatus && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Merchant Account Proof Status</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block mt-1 ${
                      listing.revenueVerificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {listing.revenueVerificationStatus === 'VERIFIED' ? '✓ Revenue Verified by Admin' : 'Unverified Self-Reported Revenue'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {listing.business_stage === 'ESTABLISHED' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listing.businessAge && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Company Age / Lifespan</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{listing.businessAge}</span>
                  </div>
                )}
                {listing.annualRevenue !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Annual Revenue</span>
                    <span className="text-sm font-bold text-emerald-800">${formatNum(listing.annualRevenue)} /yr</span>
                  </div>
                )}
                {listing.profit !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Annual Net Profit</span>
                    <span className="text-sm font-bold text-emerald-950">${formatNum(listing.profit)} /yr</span>
                  </div>
                )}
                {listing.users !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Verified Users / Clients</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{formatNum(listing.users)}</span>
                  </div>
                )}
                {listing.churn !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Annualized / Monthly Churn Rate</span>
                    <span className="text-sm font-bold text-red-800">{listing.churn}%</span>
                  </div>
                )}
                {listing.teamSize !== undefined && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Full-Time Team Size</span>
                    <span className="text-sm font-bold text-[#2C2A26]">{listing.teamSize} employees / contractors</span>
                  </div>
                )}
                {listing.acquisitionChannels && listing.acquisitionChannels.length > 0 && (
                  <div className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs md:col-span-2">
                    <span className="font-bold text-[#8C8275] block uppercase mb-1">Primary Acquisition Channels</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {listing.acquisitionChannels.map((c, i) => (
                        <span key={i} className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-md font-medium">🎯 {c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Business Overview */}
          <ProjectOverview
            overview={listing.businessOverview}
            longDescription={listing.longDescription}
          />

          {/* Financial Overview */}
          <FinancialOverview
            financials={listing.financialOverview || {
              ttmRevenue: (listing.monthlyRevenue || 0) * 12,
              ttmProfit: (listing.monthlyProfit || 0) * 12,
              expensesBreakdown: [],
              highlights: []
            }}
            monthlyRevenue={listing.monthlyRevenue || 0}
            monthlyProfit={listing.monthlyProfit || 0}
            askingPrice={listing.askingPrice || 0}
          />

          {/* Technology Architecture */}
          <TechnologyList
            techStack={listing.techStack}
            platform={listing.platform}
          />
        </div>

        {/* Right Sticky Sidebar (CTAs & Verification info) */}
        <div className="space-y-6">
          {/* Primary Action Card */}
          <div className="bg-white border-2 border-[#2C2A26] rounded-2xl p-6 space-y-4 shadow-md sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD3]">
              <div>
                <span className="text-xs text-[#8C8275] font-bold uppercase block">
                  Buy Now or Inquire
                </span>
                <span className="font-serif font-bold text-2xl text-[#2C2A26]">
                  {formatCurrency(listing.askingPrice)}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-lg">
                Ready to Transfer
              </span>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => setActiveModal('buy')}
                className="w-full py-3.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-sm font-bold hover:bg-[#423E38] transition-all flex items-center justify-center gap-2 shadow-md"
                id="buy-now-btn"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Buy Now ({formatCurrency(listing.askingPrice)})</span>
              </button>

              <button
                onClick={() => setActiveModal('contact')}
                className="w-full py-3 bg-white text-[#2C2A26] border border-[#E2DDD3] hover:border-[#2C2A26] rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                id="contact-seller-btn"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contact Seller</span>
              </button>

              <button
                onClick={() => setActiveModal('offer')}
                className="w-full py-2.5 bg-[#F5F2EB] text-[#2C2A26] hover:bg-[#EAE5D9] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                id="make-offer-btn"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                <span>Make an Offer</span>
              </button>
            </div>

            <p className="text-[11px] text-[#8C8275] text-center pt-2 border-t border-[#E2DDD3]">
              🔒 Protected by AIWebCrafter Escrow. Zero fees for buyers.
            </p>
          </div>

          {/* Verification Badge Details */}
          <VerificationBadge verification={listing.verification} variant="full" />
        </div>
      </div>

      {/* Modals */}
      <ContactModal
        listing={listing}
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
        onNavigateToMessages={onNavigateMessages}
      />

      <OfferModal
        listing={listing}
        isOpen={activeModal === 'offer'}
        onClose={() => setActiveModal(null)}
      />

      <BuyModal
        listing={listing}
        isOpen={activeModal === 'buy'}
        onClose={() => setActiveModal(null)}
        onOrderCreated={(ord) => {
          if (onOpenBuyerDelivery) {
            onOpenBuyerDelivery(ord.id);
          }
        }}
      />

      {/* Interactive Live Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-[#E2DDD3]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD3]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-900">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2C2A26]">{listing.title} — Live App Preview</h3>
                  <p className="text-xs text-[#5D5A53]">Interactive runtime preview of the application being sold</p>
                </div>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="w-8 h-8 rounded-full bg-[#F5F2EB] hover:bg-[#EAE5D9] flex items-center justify-center text-[#2C2A26] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-[#8C8275]">
                <span>Asset: {listing.title}</span>
                <span className="text-emerald-600 font-bold">● Verified Live Runtime</span>
              </div>
              <div className="p-6 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span>{listing.platform || 'React & Node.js Platform'}</span>
                  <span className="text-emerald-400">ONLINE</span>
                </div>
                <p>&gt; Initializing application sandbox for {listing.title}...</p>
                <p>&gt; Category: {listing.category} | Asking Price: ${(listing.askingPrice || 0).toLocaleString()}</p>
                <p>&gt; Database & API endpoints connected successfully.</p>
                <div className="p-3 bg-slate-800 rounded-lg text-slate-200 mt-2 space-y-1">
                  <p className="font-bold text-white">🚀 All features operational</p>
                  <p className="text-[11px] text-slate-300">This live sandbox demonstrates the complete codebase and architecture ready for instant ownership transfer.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDemoModal(false)}
                className="px-5 py-2.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-xs font-bold hover:bg-[#423E38] transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Walkthrough Modal */}
      {showVideoModal && (() => {
        const rawVideo = listing.videoUrl || (listing as any).video_url || (listing as any).video;
        const cleanVideoUrl = rawVideo && typeof rawVideo === 'string' && rawVideo.trim().length > 0
          ? (rawVideo.trim().startsWith('http://') || rawVideo.trim().startsWith('https://') ? rawVideo.trim() : `https://${rawVideo.trim()}`)
          : null;

        const ytMatch = cleanVideoUrl ? cleanVideoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/) : null;
        const loomMatch = cleanVideoUrl ? cleanVideoUrl.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/) : null;

        const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` :
                         loomMatch ? `https://www.loom.com/embed/${loomMatch[1]}` : null;

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-[#E2DDD3]">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD3]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-700">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2C2A26]">{listing.title} — Video Walkthrough</h3>
                    <p className="text-xs text-[#5D5A53]">YouTube / Loom Architecture & Codebase Overview</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F2EB] hover:bg-[#EAE5D9] flex items-center justify-center text-[#2C2A26] font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-4">
                {embedUrl ? (
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
                    <iframe
                      src={embedUrl}
                      title={`${listing.title} Video Walkthrough`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : cleanVideoUrl ? (
                  <div className="p-6 bg-red-50/60 rounded-2xl border border-red-200 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
                      <Play className="w-6 h-6 fill-current" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-base text-[#2C2A26]">Walkthrough Video Link Provided by Seller</h4>
                      <p className="text-xs text-[#5D5A53] max-w-md mx-auto truncate font-mono bg-white p-2 rounded-xl border border-red-200">
                        {cleanVideoUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => window.open(cleanVideoUrl, '_blank', 'noreferrer')}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 mx-auto shadow-md cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Video Link in New Tab</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-200 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto font-bold text-lg">
                      🎬
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-base text-[#2C2A26]">No Demo Video Attached Yet</h4>
                      <p className="text-xs text-[#5D5A53] max-w-md mx-auto leading-relaxed">
                        The seller has not provided a YouTube or Loom video link for this listing. You can message them directly via <strong>"Contact Seller"</strong> to request a walkthrough.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {cleanVideoUrl && (
                  <button
                    onClick={() => window.open(cleanVideoUrl, '_blank', 'noreferrer')}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Watch External Video</span>
                  </button>
                )}
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="px-5 py-2.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-xs font-bold hover:bg-[#423E38] transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ProjectDetails;
