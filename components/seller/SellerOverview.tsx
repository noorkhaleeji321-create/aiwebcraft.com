import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  Tag, 
  FileEdit, 
  DollarSign, 
  PlusCircle, 
  ArrowUpRight, 
  ShieldCheck, 
  Sparkles,
  AlertTriangle,
  Percent
} from 'lucide-react';
import { SellerProject } from '../../types';
import ProjectStatusBadge from './ProjectStatusBadge';
import { useCommissionPercentage } from '../../services/supabaseService';

interface SellerOverviewProps {
  projects: SellerProject[];
  onAddNewProject: () => void;
  onViewMyProjects: () => void;
  onEditProject: (id: string) => void;
  onPreviewProject: (project: SellerProject) => void;
}

export const SellerOverview: React.FC<SellerOverviewProps> = ({
  projects,
  onAddNewProject,
  onViewMyProjects,
  onEditProject,
  onPreviewProject
}) => {
  const commissionPct = useCommissionPercentage();

  const totalCount = projects.length;
  const pendingCount = projects.filter((p) => p.sellerStatus === 'Pending Review').length;
  const approvedCount = projects.filter((p) => p.sellerStatus === 'Approved').length;
  const draftCount = projects.filter((p) => p.sellerStatus === 'Draft').length;
  const rejectedCount = projects.filter((p) => p.sellerStatus === 'Rejected').length;
  const soldCount = projects.filter((p) => p.sellerStatus === 'Sold').length;

  const totalValuation = projects.reduce((sum, p) => sum + (p.askingPrice || 0), 0);
  const totalMonthlyRevenue = projects.reduce((sum, p) => sum + (p.monthlyRevenue || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const recentProjects = projects.slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Banner */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Seller Control Center</span>
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#2C2A26]">
              Manage Your Digital Portfolio & Asset Listings
            </h1>
            <p className="text-xs sm:text-sm text-[#5D5A53]">
              Track listing submission status, edit drafts, preview marketplace cards, and manage acquisition deals.
            </p>
          </div>

          <button
            onClick={onAddNewProject}
            className="px-5 py-3 bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>+ Add New Project</span>
          </button>
        </div>

        {/* Platform Commission Rate Notice Set By Admin */}
        <div className="pt-4 mt-4 border-t border-[#E2DDD3] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-[#2C2A26]">
            <div className="w-7 h-7 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-200">
              <Percent className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <span className="font-bold">Active Platform Commission Fee:</span>{' '}
              <span className="font-serif font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                {commissionPct}%
              </span>{' '}
              <span className="text-[#5D5A53]">deducted upon successful project sale</span>
            </div>
          </div>
          <span className="text-[11px] text-[#8C8275] italic">Configured by platform admin</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Added */}
        <div className="p-4 bg-white border border-[#E2DDD3] rounded-2xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-[#8C8275]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Projects</span>
            <FolderKanban className="w-4 h-4 text-[#2C2A26]" />
          </div>
          <div className="font-serif font-bold text-2xl text-[#2C2A26]">
            {totalCount}
          </div>
          <div className="text-[11px] text-[#8C8275]">Added by you</div>
        </div>

        {/* Pending Review */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-amber-950">
            {pendingCount}
          </div>
          <div className="text-[11px] text-amber-800 font-medium">Under curation</div>
        </div>

        {/* Approved & Live */}
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Live in Market</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-emerald-950">
            {approvedCount}
          </div>
          <div className="text-[11px] text-emerald-800 font-medium">Approved by admin</div>
        </div>

        {/* Drafts */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-gray-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Drafts</span>
            <FileEdit className="w-4 h-4 text-gray-500" />
          </div>
          <div className="font-serif font-bold text-2xl text-gray-900">
            {draftCount}
          </div>
          <div className="text-[11px] text-gray-600">Incomplete</div>
        </div>

        {/* Sold */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-purple-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sold Assets</span>
            <Tag className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-serif font-bold text-2xl text-purple-950">
            {soldCount}
          </div>
          <div className="text-[11px] text-purple-800 font-medium">Acquisitions</div>
        </div>

        {/* Total Valuation */}
        <div className="p-4 bg-[#FDFCF9] border-2 border-[#2C2A26] rounded-2xl space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-[#8C8275]">
            <span className="text-[10px] font-bold uppercase tracking-wider">Portfolio Value</span>
            <DollarSign className="w-4 h-4 text-[#2C2A26]" />
          </div>
          <div className="font-serif font-bold text-xl text-[#2C2A26]">
            {formatCurrency(totalValuation)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            +{formatCurrency(totalMonthlyRevenue)}/mo MRR
          </div>
        </div>
      </div>

      {/* Rejected / Feedback Alert Notice if any */}
      {rejectedCount > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs text-red-900">
          <div className="flex items-center gap-2 font-bold text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Action Required: {rejectedCount} Project(s) Require Revisions</span>
          </div>
          <p className="text-red-800">
            One or more of your listings was returned with curator feedback. Click "Edit & Resubmit" in My Projects to address the review items.
          </p>
        </div>
      )}

      {/* Recent Projects List Section */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
          <div>
            <h3 className="font-serif font-bold text-xl text-[#2C2A26]">
              Your Portfolio Projects
            </h3>
            <p className="text-xs text-[#5D5A53]">
              Overview of recently created and submitted digital assets
            </p>
          </div>

          <button
            onClick={onViewMyProjects}
            className="text-xs font-bold text-[#2C2A26] hover:text-[#423E38] flex items-center gap-1 underline underline-offset-4"
          >
            <span>View All Projects ({totalCount})</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-10 space-y-3 bg-[#FDFCF9] border-2 border-dashed border-[#E2DDD3] rounded-2xl">
            <FolderKanban className="w-10 h-10 text-[#8C8275] mx-auto" />
            <div className="font-serif font-bold text-lg text-[#2C2A26]">
              No Projects Added Yet
            </div>
            <p className="text-xs text-[#5D5A53] max-w-sm mx-auto">
              Start by adding your first SaaS tool, Shopify store, or digital asset to list it on AIWebCrafter.
            </p>
            <button
              onClick={onAddNewProject}
              className="px-5 py-2.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-xs font-bold hover:bg-[#423E38]"
            >
              + Create First Project Listing
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2DDD3]">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FDFCF9] p-3 rounded-2xl transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={project.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300'}
                    alt={project.title}
                    className="w-14 h-14 rounded-xl object-cover border border-[#E2DDD3] shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-serif font-bold text-base text-[#2C2A26]">
                        {project.title}
                      </h4>
                      <ProjectStatusBadge
                        status={project.sellerStatus}
                        rejectionReason={project.rejectionReason}
                        size="sm"
                      />
                    </div>
                    <p className="text-xs text-[#5D5A53] line-clamp-1">
                      {project.tagline}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[#8C8275] font-medium">
                      <span>Category: <strong className="text-[#2C2A26]">{project.category}</strong></span>
                      <span>•</span>
                      <span>Asking: <strong className="text-[#2C2A26]">{formatCurrency(project.askingPrice)}</strong></span>
                      <span>•</span>
                      <span>MRR: <strong className="text-emerald-700">{formatCurrency(project.monthlyRevenue)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => onPreviewProject(project)}
                    className="px-3 py-1.5 bg-[#F5F2EB] border border-[#E2DDD3] hover:border-[#2C2A26] text-[#2C2A26] rounded-xl text-xs font-semibold transition-all"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => onEditProject(project.id)}
                    className="px-3.5 py-1.5 bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all"
                  >
                    {project.sellerStatus === 'Draft' ? 'Edit Draft' : 'Manage'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOverview;
