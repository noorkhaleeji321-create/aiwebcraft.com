import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  FileText, 
  Image as ImageIcon, 
  DollarSign, 
  UserCheck, 
  FolderCheck, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SellerProject } from '../../types';

interface AdminReviewChecklistProps {
  project: SellerProject;
  onChecklistChange?: (allChecked: boolean) => void;
}

interface ChecklistGroup {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  items: {
    id: string;
    label: string;
    description: string;
    verified: boolean;
    detail?: string;
  }[];
}

export const AdminReviewChecklist: React.FC<AdminReviewChecklistProps> = ({
  project,
  onChecklistChange
}) => {
  // Initialize checklist items based on project data presence
  const initialGroups: ChecklistGroup[] = [
    {
      id: 'info',
      title: 'Project Information',
      subtitle: 'Core listing details',
      icon: FileText,
      items: [
        {
          id: 'info-title',
          label: 'Title & Tagline Clarity',
          description: 'Descriptive title and concise value proposition',
          verified: Boolean(project.title && project.tagline && project.title.length > 3),
          detail: project.title
        },
        {
          id: 'info-desc',
          label: 'Business Description',
          description: 'Detailed overview of product, customer base, and operations',
          verified: Boolean(project.description && project.description.length > 20),
          detail: `${project.description?.slice(0, 50)}...`
        },
        {
          id: 'info-tech',
          label: 'Tech Stack Declarations',
          description: 'Recognized frameworks and deployment architecture',
          verified: Boolean(project.techStack && Object.keys(project.techStack).length > 0),
          detail: project.platform || 'Declared Tech'
        }
      ]
    },
    {
      id: 'media',
      title: 'Media & Live Demo',
      subtitle: 'Visuals and preview links',
      icon: ImageIcon,
      items: [
        {
          id: 'media-cover',
          label: 'Cover Image / Logo',
          description: 'High-resolution preview card and branded assets',
          verified: Boolean(project.imageUrl),
          detail: project.imageUrl ? 'Cover Image Attached' : 'Missing Image'
        },
        {
          id: 'media-demo',
          label: 'Live Website / App Demo',
          description: 'Accessible live instance for inspection',
          verified: Boolean(project.demoUrl),
          detail: project.demoUrl || 'No URL Provided'
        },
        {
          id: 'media-video',
          label: 'Video Walkthrough (Optional)',
          description: 'Loom or YouTube product demonstration',
          verified: Boolean(project.videoUrl),
          detail: project.videoUrl ? 'Video Provided' : 'Optional'
        }
      ]
    },
    {
      id: 'financials',
      title: 'Price & Financial Verification',
      subtitle: 'Revenue, profits, and asking price',
      icon: DollarSign,
      items: [
        {
          id: 'fin-price',
          label: 'Asking Price & Valuation Multiplier',
          description: 'Fair market multiple based on trailing financials',
          verified: Boolean(project.askingPrice && project.askingPrice > 0),
          detail: `$${(project.askingPrice || 0).toLocaleString()} USD`
        },
        {
          id: 'fin-revenue',
          label: 'MRR & Monthly Profit Metrics',
          description: 'Monthly recurring revenue and profit margins',
          verified: project.monthlyRevenue !== undefined && project.monthlyProfit !== undefined,
          detail: `$${project.monthlyRevenue}/mo MRR ($${project.monthlyProfit}/mo Profit)`
        },
        {
          id: 'fin-proof',
          label: 'Stripe / Bank Revenue Verification',
          description: 'Attached P&L reports, merchant statements, or bank proofs',
          verified: Boolean(project.verification?.revenueVerified),
          detail: project.verification?.revenueVerified ? 'Revenue Verified' : 'Self-declared'
        }
      ]
    },
    {
      id: 'seller',
      title: 'Seller Identity & KYC',
      subtitle: 'Identity validation and reputation',
      icon: UserCheck,
      items: [
        {
          id: 'seller-identity',
          label: 'KYC Passport / ID Verification',
          description: 'Government ID & email verification',
          verified: Boolean(project.seller?.verified || project.verification?.identityVerified),
          detail: project.seller?.name || 'Verified Seller'
        },
        {
          id: 'seller-response',
          label: 'Response Rate & Trust Score',
          description: 'Seller responsiveness and platform track record',
          verified: Boolean(project.seller?.responseRate),
          detail: project.seller?.responseRate || 'High Rating'
        }
      ]
    },
    {
      id: 'assets',
      title: 'Asset Ownership & Handover',
      subtitle: 'Code, domain, and transfer protocol',
      icon: FolderCheck,
      items: [
        {
          id: 'asset-code',
          label: 'GitHub Repository Transferability',
          description: 'Git repository readiness and dependency licenses',
          verified: Boolean(project.verification?.codebaseVerified ?? true),
          detail: 'Full Code Ownership'
        },
        {
          id: 'asset-domain',
          label: 'Domain Name & DNS Transfer',
          description: 'Domain registrar auth codes and DNS configuration',
          verified: true,
          detail: 'Domain & Accounts'
        },
        {
          id: 'asset-included',
          label: 'Included Assets List Check',
          description: 'Agreed digital assets in handover package',
          verified: Boolean(project.businessOverview?.includedAssets?.length),
          detail: `${project.businessOverview?.includedAssets?.length || 3} assets listed`
        }
      ]
    },
    {
      id: 'security_ownership',
      title: 'Ownership & Delivery Files',
      subtitle: 'Signed IP and secure file vault',
      icon: ShieldCheck,
      items: [
        {
          id: 'ownership-declared',
          label: 'IP Declaration Signed',
          description: 'Legally binding IP assignment declaration',
          verified: Boolean(project.ownershipDeclaration?.declared),
          detail: project.ownershipDeclaration?.declaredBy ? `Signed: ${project.ownershipDeclaration.declaredBy}` : 'Unsigned / Draft'
        },
        {
          id: 'vault-files',
          label: 'Secure Code Delivery Vault',
          description: 'Encrypted code release zip and database dumps',
          verified: Boolean((project as any).secureFiles && (project as any).secureFiles.length > 0),
          detail: (project as any).secureFiles && (project as any).secureFiles.length > 0 
            ? `${(project as any).secureFiles.length} secure files uploaded` 
            : 'No secure files attached'
        }
      ]
    }
  ];

  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    initialGroups.forEach((group) => {
      group.items.forEach((item) => {
        initialState[item.id] = item.verified;
      });
    });
    return initialState;
  });

  const toggleCheck = (id: string) => {
    const newState = { ...checkedState, [id]: !checkedState[id] };
    setCheckedState(newState);

    const totalCount = Object.keys(newState).length;
    const checkedCount = Object.values(newState).filter(Boolean).length;
    if (onChecklistChange) {
      onChecklistChange(checkedCount === totalCount);
    }
  };

  const totalItems = Object.keys(checkedState).length;
  const completedCount = Object.values(checkedState).filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / (totalItems || 1)) * 100);

  return (
    <div className="bg-[#FDFCF9] border border-[#E2DDD3] rounded-3xl p-5 space-y-5">
      {/* Header & Score Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD3] pb-4">
        <div>
          <h3 className="font-serif font-bold text-base text-[#2C2A26] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
            <span>Admin Review & Audit Checklist</span>
          </h3>
          <p className="text-xs text-[#5D5A53] mt-0.5">
            Verify project compliance before publishing to public Marketplace
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[11px] font-bold uppercase text-[#8C8275] block">
              Audit Score
            </span>
            <span className={`font-serif font-bold text-sm ${completionPercentage === 100 ? 'text-emerald-700' : 'text-amber-800'}`}>
              {completedCount} / {totalItems} Passed ({completionPercentage}%)
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2DDD3] flex items-center justify-center p-1 font-bold text-xs">
            <div 
              className={`w-full h-full rounded-xl flex items-center justify-center ${
                completionPercentage === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}
            >
              {completionPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#EAE5D9] h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${completionPercentage === 100 ? 'bg-emerald-600' : 'bg-amber-600'}`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Checklist Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialGroups.map((group) => {
          const GroupIcon = group.icon;
          const isGroupComplete = group.items.every((it) => checkedState[it.id]);

          return (
            <div 
              key={group.id} 
              className={`p-4 rounded-2xl border transition-all ${
                isGroupComplete 
                  ? 'bg-emerald-50/40 border-emerald-200' 
                  : 'bg-white border-[#E2DDD3]'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E2DDD3]">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isGroupComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-[#F5F2EB] text-[#2C2A26]'}`}>
                    <GroupIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#2C2A26] leading-tight">
                      {group.title}
                    </h4>
                    <span className="text-[10px] text-[#8C8275]">{group.subtitle}</span>
                  </div>
                </div>

                {isGroupComplete && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </div>

              <div className="space-y-2.5">
                {group.items.map((item) => {
                  const isChecked = Boolean(checkedState[item.id]);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleCheck(item.id)}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-start gap-2.5 transition-all border ${
                        isChecked 
                          ? 'bg-white border-emerald-300 text-[#2C2A26]' 
                          : 'bg-[#F5F2EB] border-[#E2DDD3] text-[#5D5A53] hover:bg-white'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 text-amber-700">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-[#8C8275]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-semibold text-xs truncate ${isChecked ? 'line-through text-[#8C8275]' : 'text-[#2C2A26]'}`}>
                            {item.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#8C8275] truncate">{item.description}</p>
                        {item.detail && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#EAE5D9] text-[#2C2A26] rounded text-[9px] font-mono">
                            {item.detail}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Banner */}
      {completionPercentage === 100 ? (
        <div className="p-3.5 bg-emerald-100/70 border border-emerald-300 rounded-2xl text-xs text-emerald-950 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>All audit verification criteria passed! Ready for Admin Approval.</span>
          </div>
          <span className="px-2.5 py-1 bg-emerald-700 text-white text-[10px] font-bold rounded-lg uppercase">
            100% Verified
          </span>
        </div>
      ) : (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Some items are unverified. Admin can still manually approve or reject after reviewing details below.
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminReviewChecklist;
