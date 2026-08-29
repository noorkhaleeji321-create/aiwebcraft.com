import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  Cpu, 
  Image as ImageIcon, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Sparkles, 
  FileEdit,
  X,
  AlertCircle,
  Tag,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { SellerProject } from '../../types';
import { saveProjectDraft } from '../../services/sellerStore';
import ProjectStep from './ProjectStep';
import ProjectPreview from './ProjectPreview';
import SubmitReviewButton from './SubmitReviewButton';

interface ProjectFormProps {
  initialProject?: SellerProject | null;
  onCancel: () => void;
  onSuccessSubmitted: (project: SellerProject) => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialProject,
  onCancel,
  onSuccessSubmitted
}) => {
  const [currentStep, setCurrentStep] = useState<number>(initialProject?.currentStep || 1);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<SellerProject>>(
    initialProject || {
      title: '',
      tagline: '',
      description: '',
      longDescription: '',
      askingPrice: 45000,
      currency: 'USD',
      monthlyRevenue: 3000,
      monthlyProfit: 2400,
      monthlyExpenses: 600,
      monthlyVisitors: 10000,
      category: 'SaaS',
      projectType: 'SaaS Platform',
      platform: 'Next.js 14 & Supabase',
      demoUrl: '',
      videoUrl: '',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
      gallery: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000'],
      business_stage: 'LIVE_REVENUE',
      asset_type: 'SaaS',
      techStack: {
        frontend: ['React 18', 'Tailwind CSS'],
        backend: ['Node.js', 'Express'],
        database: ['PostgreSQL (Supabase)'],
        aiModels: ['Gemini 1.5 Flash'],
        hosting: ['Vercel'],
        payments: ['Stripe Billing']
      },
      businessOverview: {
        model: 'Subscription SaaS',
        monetization: ['Recurring Subscriptions'],
        targetAudience: 'Solo founders & agencies',
        growthOpportunities: ['SEO Content', 'Paid Retargeting Ads'],
        includedAssets: ['Domain Name', 'GitHub Repository', 'Customer Database'],
        workloadHoursPerWeek: 4,
        reasonForSelling: 'Focusing on new enterprise AI software'
      },
      financialOverview: {
        ttmRevenue: 36000,
        ttmProfit: 28800,
        expensesBreakdown: [{ category: 'Cloud Infrastructure & AI API', amount: 600 }],
        highlights: ['80% Gross Profit Margin', 'Zero Paid Marketing Spend']
      },
      ownershipDeclaration: {
        declared: false,
        declaredBy: '',
        declaredAt: '',
        ownershipTermsAccepted: false,
        declarationText: ''
      },
      secureFiles: [],
      currentStep: 1
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const STEP_TITLES = [
    { number: 1, name: 'Basic Information', engName: 'Basic Info', icon: Building2 },
    { number: 2, name: 'Project Type', engName: 'Project Type', icon: Tag },
    { number: 3, name: 'Media & Demo', engName: 'Media & Demo', icon: ImageIcon },
    { number: 4, name: 'Tech & Performance', engName: 'Tech & Performance', icon: Cpu },
    { number: 5, name: 'Price & Offer', engName: 'Price & Offer', icon: DollarSign },
    { number: 6, name: 'Ownership', engName: 'Ownership', icon: ShieldCheck },
    { number: 7, name: 'Secure Files', engName: 'Secure Files', icon: HardDrive }
  ];

  // Real-time Field Setter
  const handleFieldChange = (field: keyof SellerProject, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field as string];
        return updated;
      });
    }
  };

  // Step Validation logic
  const validateCurrentStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.title || formData.title.trim().length < 3) {
        errs.title = 'Title must be at least 3 characters.';
      }
      if (!formData.tagline || formData.tagline.trim().length < 10) {
        errs.tagline = 'Tagline must be at least 10 characters.';
      }
      if (!formData.description || formData.description.trim().length < 15) {
        errs.description = 'Overview description must be at least 15 characters.';
      }
    }

    if (currentStep === 4) {
      if (formData.business_stage !== 'PRE_LAUNCH' && formData.business_stage !== 'BETA' && formData.business_stage !== 'LIVE_NO_REVENUE') {
        if (formData.monthlyRevenue === undefined || formData.monthlyRevenue < 0) {
          errs.monthlyRevenue = 'Revenue is required.';
        }
        if (formData.monthlyProfit === undefined) {
          errs.monthlyProfit = 'Net Profit is required.';
        }
      }
    }

    if (currentStep === 5) {
      if (!formData.askingPrice || formData.askingPrice <= 0) {
        errs.askingPrice = 'Asking Price must be greater than $0.';
      }
    }

    if (currentStep === 6) {
      if (!formData.ownershipDeclaration?.declared) {
        errs.ownership = 'You must declare and sign ownership terms.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      const nextStep = Math.min(7, currentStep + 1);
      setCurrentStep(nextStep);
      // Auto save draft on step advance
      saveDraftInternal(nextStep);
    }
  };

  const handlePrevStep = () => {
    const prevStep = Math.max(1, currentStep - 1);
    setCurrentStep(prevStep);
  };

  const saveDraftInternal = (stepToSave?: number) => {
    setIsSaving(true);
    setSaveErrorMsg(null);
    const toSave: Partial<SellerProject> = {
      ...formData,
      currentStep: stepToSave || currentStep
    };

    try {
      const saved = saveProjectDraft(toSave);
      setFormData(saved);
      setIsSaving(false);

      setSaveSuccessMsg('Draft Saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setIsSaving(false);
      setSaveErrorMsg(err?.message || 'Failed to save draft.');
      setTimeout(() => setSaveErrorMsg(null), 4000);
    }
  };

  if (isPreviewMode) {
    return (
      <ProjectPreview
        project={formData}
        onBackToEdit={() => setIsPreviewMode(false)}
        onSaveDraft={() => saveDraftInternal()}
        onSuccessSubmitted={onSuccessSubmitted}
      />
    );
  }

  return (
    <div className="space-[#2C2A26] space-y-8 animate-fade-in-up">
      {/* Wizard Navigation & Progress Bar Header */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-[#F5F2EB] rounded-xl text-[#8C8275] transition-all"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-serif font-bold text-2xl text-[#2C2A26]">
                {formData.id ? 'Edit your listed project' : 'Add New Project for Sale'}
              </h1>
              <p className="text-xs text-[#5D5A53] mt-0.5">
                Advanced project listing system, operating in secure phases and compliant with review tools.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {saveSuccessMsg && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saveSuccessMsg}</span>
              </span>
            )}
            {saveErrorMsg && (
              <span className="text-xs text-rose-700 font-bold flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{saveErrorMsg}</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => saveDraftInternal()}
              disabled={isSaving}
              className="px-3.5 py-2 bg-[#F5F2EB] border border-[#E2DDD3] hover:border-[#2C2A26] text-[#2C2A26] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5 text-amber-700" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPreviewMode(true)}
              className="px-3.5 py-2 bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {STEP_TITLES.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => {
                  if (step.number < currentStep || validateCurrentStep()) {
                    setCurrentStep(step.number);
                  }
                }}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2 ${
                  isActive
                    ? 'bg-[#2C2A26] text-[#F5F2EB] border-[#2C2A26] shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-200 font-semibold'
                    : 'bg-[#FDFCF9] text-[#8C8275] border-[#E2DDD3] hover:border-[#2C2A26]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? 'text-amber-300' : isCompleted ? 'text-emerald-700' : 'text-[#8C8275]'
                  }`}>
                    Step {step.number}
                  </span>
                  <Icon className={`w-4 h-4 ${
                    isActive ? 'text-amber-300' : isCompleted ? 'text-emerald-600' : 'text-[#8C8275]'
                  }`} />
                </div>
                <div>
                  <span className="text-xs font-serif font-bold block leading-tight">
                    {step.name}
                  </span>
                  <span className="text-[10px] opacity-60 block">
                    {step.engName}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Local Draft Storage Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-300/80 rounded-2xl text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <div>
            <span className="font-bold text-amber-900 block sm:inline">Important Notice: </span>
            <span className="text-amber-900 font-medium">
              This draft is saved in your local browser cache. Click <strong className="font-bold text-amber-950">"Confirm & Send for Review"</strong> to submit and securely store it on the cloud.
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-lg shrink-0 border border-amber-300">
          Browser Local Cache
        </span>
      </div>

      {/* STEP CONTENT BODY */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 sm:p-8 shadow-sm">
        <ProjectStep
          currentStep={currentStep}
          formData={formData}
          onChangeField={handleFieldChange}
          errors={errors}
          onGoToPreview={() => setIsPreviewMode(true)}
        />

        {/* FOOTER WIZARD CONTROLS */}
        <div className="mt-8 pt-6 border-t border-[#E2DDD3] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="px-4 py-2.5 bg-[#F5F2EB] border border-[#E2DDD3] hover:border-[#2C2A26] text-[#2C2A26] rounded-xl text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => saveDraftInternal()}
              className="px-4 py-2.5 bg-[#F5F2EB] border border-[#E2DDD3] hover:border-[#2C2A26] text-[#2C2A26] rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-amber-700" />
              <span>Save Draft</span>
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md"
              >
                <span>Next Step {currentStep + 1}</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            ) : (
              <SubmitReviewButton
                project={formData}
                onSuccessSubmitted={onSuccessSubmitted}
                variant="primary"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
