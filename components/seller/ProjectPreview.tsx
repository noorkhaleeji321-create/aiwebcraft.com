import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  LayoutGrid, 
  FileText, 
  ShieldCheck, 
  Save, 
  Send, 
  CheckCircle2 
} from 'lucide-react';
import { SellerProject } from '../../types.js';
import { toPublicListing } from '../../services/sellerStore.js';
import ListingCard from '../ListingCard.js';
import ProjectDetails from '../ProjectDetails.js';
import SubmitReviewButton from './SubmitReviewButton.js';

interface ProjectPreviewProps {
  project: Partial<SellerProject>;
  onBackToEdit: () => void;
  onSaveDraft: () => void;
  onSuccessSubmitted: (updated: SellerProject) => void;
}

export const ProjectPreview: React.FC<ProjectPreviewProps> = ({
  project,
  onBackToEdit,
  onSaveDraft,
  onSuccessSubmitted
}) => {
  const [previewTab, setPreviewTab] = useState<'card' | 'details'>('details');
  const [isSavedDemo, setIsSavedDemo] = useState(false);

  // Convert partial seller project to full public listing cleanly
  const publicListing = useMemo(() => {
    const mergedProject: SellerProject = {
      id: project.id || 'preview-temp',
      slug: project.slug || 'preview',
      sellerStatus: project.sellerStatus || 'Draft',
      lastSavedAt: project.lastSavedAt || new Date().toISOString(),
      createdAt: project.createdAt || new Date().toISOString().split('T')[0],
      title: project.title || 'Untitled Digital Project',
      tagline: project.tagline || 'No tagline provided yet.',
      description: project.description || 'No description provided.',
      longDescription: project.longDescription || project.description || 'No detailed description provided.',
      askingPrice: Number(project.askingPrice) || 0,
      currency: project.currency || 'USD',
      monthlyRevenue: Number(project.monthlyRevenue) || 0,
      monthlyProfit: Number(project.monthlyProfit) || 0,
      monthlyExpenses: Number(project.monthlyExpenses) || 0,
      monthlyVisitors: Number(project.monthlyVisitors) || 0,
      category: project.category || 'SaaS',
      projectType: project.projectType || 'SaaS Platform',
      platform: project.platform || 'Next.js & Supabase',
      demoUrl: project.demoUrl || '',
      videoUrl: project.videoUrl || '',
      imageUrl: project.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
      gallery: project.gallery && project.gallery.length > 0
        ? project.gallery
        : ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000'],
      techStack: project.techStack || {
        frontend: ['React 18', 'Tailwind CSS'],
        backend: ['Node.js', 'Express'],
        database: ['Supabase (PostgreSQL)'],
        aiModels: ['Gemini 1.5 Flash'],
        hosting: ['Vercel'],
        payments: ['Stripe Billing']
      },
      businessOverview: project.businessOverview || {
        model: 'Subscription SaaS',
        monetization: ['Recurring Subscriptions'],
        targetAudience: 'Digital founders & agencies',
        growthOpportunities: ['SEO', 'Content Marketing'],
        includedAssets: ['Domain Name', 'Full Codebase', 'Database'],
        workloadHoursPerWeek: 5
      },
      financialOverview: project.financialOverview || {
        ttmRevenue: (Number(project.monthlyRevenue) || 0) * 12,
        ttmProfit: (Number(project.monthlyProfit) || 0) * 12,
        expensesBreakdown: [{ category: 'Hosting & Cloud API', amount: Number(project.monthlyExpenses) || 50 }],
        highlights: ['Low overhead', 'Growth ready']
      },
      seller: project.seller || {
        id: 'sel-current-user',
        name: 'Youssef El Amrani (You)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        location: 'Casablanca, Morocco',
        memberSince: '2025',
        rating: 5.0,
        responseRate: '100% (< 30 min)',
        completedDeals: 2,
        verified: true,
        bio: 'Verified digital builder and SaaS seller on AIWebCrafter.'
      },
      verification: project.verification || {
        revenueVerified: false,
        trafficVerified: true,
        codebaseVerified: true,
        identityVerified: true
      },
      ...project
    } as SellerProject;

    return toPublicListing(mergedProject);
  }, [project]);


  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Sticky Preview Header Control Bar */}
      <div className="sticky top-20 z-30 bg-[#2C2A26] text-[#F5F2EB] border border-[#423E38] rounded-3xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToEdit}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Wizard</span>
          </button>

          <div>
            <div className="inline-flex items-center gap-1.5 text-amber-300 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Buyer Eye Preview Mode</span>
            </div>
            <h3 className="font-serif font-bold text-base text-white truncate max-w-xs sm:max-w-md">
              {project.title || 'Untitled Project'}
            </h3>
          </div>
        </div>

        {/* Center Toggle Tabs */}
        <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/10 text-xs font-semibold self-start md:self-auto">
          <button
            onClick={() => setPreviewTab('details')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              previewTab === 'details'
                ? 'bg-amber-400 text-amber-950 font-bold shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Details Page</span>
          </button>

          <button
            onClick={() => setPreviewTab('card')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              previewTab === 'card'
                ? 'bg-amber-400 text-amber-950 font-bold shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Marketplace Card</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={onSaveDraft}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Save className="w-3.5 h-3.5 text-amber-300" />
            <span>Save Draft</span>
          </button>

          <SubmitReviewButton
            project={project}
            onSuccessSubmitted={onSuccessSubmitted}
            variant="primary"
          />
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 bg-amber-50 border border-amber-300/80 rounded-2xl text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong className="text-amber-950">Notice:</strong> This draft is currently saved only in your local browser cache. Click <strong className="text-amber-950 font-bold">"Confirm & Send for Review"</strong> to securely submit it to the cloud.
          </span>
        </div>
        <span className="text-[11px] font-mono text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-lg shrink-0 border border-amber-300">
          Local Draft Preview
        </span>
      </div>

      {/* RENDER SELECTED PREVIEW VIEW */}
      {previewTab === 'card' ? (
        <div className="max-w-md mx-auto py-8 space-y-4">
          <h4 className="font-serif font-bold text-center text-lg text-[#2C2A26]">
            Marketplace Card Preview
          </h4>
          <ListingCard
            listing={publicListing}
            isSaved={isSavedDemo}
            onToggleSave={() => setIsSavedDemo(!isSavedDemo)}
            onViewDetails={() => setPreviewTab('details')}
          />
        </div>
      ) : (
        <div className="bg-[#F5F2EB] rounded-3xl border border-[#E2DDD3] overflow-hidden">
          <ProjectDetails
            listing={publicListing}
            onBack={onBackToEdit}
            isSaved={isSavedDemo}
            onToggleSave={() => setIsSavedDemo(!isSavedDemo)}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectPreview;
