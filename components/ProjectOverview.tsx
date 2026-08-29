import React from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Target, 
  PackageCheck, 
  Sparkles 
} from 'lucide-react';
import { BusinessOverview } from '../types.js';

interface ProjectOverviewProps {
  overview?: BusinessOverview;
  longDescription: string;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  overview,
  longDescription
}) => {
  const safeOverview = (overview && typeof overview === 'object') ? overview : {} as Partial<BusinessOverview>;
  const model = safeOverview?.model || 'Subscription SaaS';
  const monetization = Array.isArray(safeOverview?.monetization) ? safeOverview.monetization : ['Recurring Subscriptions'];
  const workloadHoursPerWeek = safeOverview?.workloadHoursPerWeek ?? 5;
  const targetAudience = safeOverview?.targetAudience || 'Digital founders & software developers';
  const reasonForSelling = safeOverview?.reasonForSelling || '';
  const includedAssets = Array.isArray(safeOverview?.includedAssets) ? safeOverview.includedAssets : ['Complete Source Code & Intellectual Property', 'Production Domain & Assets'];
  const growthOpportunities = Array.isArray(safeOverview?.growthOpportunities) ? safeOverview.growthOpportunities : ['Expand SEO content marketing', 'Launch partner affiliate program'];

  return (
    <div className="bg-white border border-[#E2DDD3] rounded-2xl p-6 space-y-8 shadow-sm">
      {/* Section Title */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2DDD3]">
        <div className="p-2 bg-[#2C2A26] text-[#F5F2EB] rounded-xl">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-xl text-[#2C2A26]">
            Business Overview & Operations
          </h3>
          <p className="text-xs text-[#5D5A53]">
            Core operational structure, business model, and assets included
          </p>
        </div>
      </div>

      {/* Narrative Description */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-[#2C2A26] uppercase tracking-wider">
          About the Project
        </h4>
        <p className="text-sm text-[#5D5A53] leading-relaxed whitespace-pre-line">
          {longDescription}
        </p>
      </div>

      {/* Business Model Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model Card */}
        <div className="bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8C8275] uppercase tracking-wider">
            <Target className="w-4 h-4 text-amber-700" />
            <span>Monetization Model</span>
          </div>
          <p className="text-sm font-semibold text-[#2C2A26]">
            {model}
          </p>
          <ul className="text-xs text-[#5D5A53] space-y-1 pt-1">
            {monetization.map((item, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Workload & Target Audience */}
        <div className="bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8C8275] uppercase tracking-wider">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Weekly Workload</span>
            </div>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200">
              ~{workloadHoursPerWeek} hrs/week
            </span>
          </div>
          <p className="text-xs text-[#5D5A53] leading-relaxed">
            <strong className="text-[#2C2A26]">Target Audience:</strong> {targetAudience}
          </p>
          {reasonForSelling && (
            <div className="pt-2 border-t border-[#E2DDD3] text-xs">
              <span className="font-bold text-[#2C2A26]">Reason for Sale: </span>
              <span className="text-[#5D5A53]">{reasonForSelling}</span>
            </div>
          )}
        </div>
      </div>

      {/* Assets Included Checklist */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-emerald-600" />
          <h4 className="text-sm font-bold text-[#2C2A26] uppercase tracking-wider">
            Included Assets & Deliverables
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {includedAssets.map((asset, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3] text-xs font-medium text-[#2C2A26]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{asset}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Opportunities */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-bold text-[#2C2A26] uppercase tracking-wider">
            Key Scale & Growth Opportunities
          </h4>
        </div>

        <div className="space-y-2">
          {growthOpportunities.map((opp, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs text-[#2C2A26]"
            >
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950">Opportunity #{idx + 1}: </span>
                <span className="text-[#5D5A53]">{opp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
