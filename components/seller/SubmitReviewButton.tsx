import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle2, Clock, Sparkles, X, ShieldAlert } from 'lucide-react';
import { SellerProject } from '../../types';
import { submitProjectForReview } from '../../services/sellerStore';

interface SubmitReviewButtonProps {
  project: Partial<SellerProject>;
  onSuccessSubmitted: (updatedProject: SellerProject) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'badge';
}

export const SubmitReviewButton: React.FC<SubmitReviewButtonProps> = ({
  project,
  onSuccessSubmitted,
  className = '',
  variant = 'primary'
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorList, setErrorList] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleValidationCheck = () => {
    setErrorList([]);
    const errors: string[] = [];

    if (!project.title || project.title.trim().length < 3) {
      errors.push('Project Title is required (at least 3 characters).');
    }
    if (!project.tagline || project.tagline.trim().length < 10) {
      errors.push('Tagline is required (at least 10 characters).');
    }
    if (!project.description || project.description.trim().length < 20) {
      errors.push('Short Overview Description is required (at least 20 characters).');
    }
    if (!project.askingPrice || project.askingPrice <= 0) {
      errors.push('Asking Price must be greater than $0.');
    }
    if (project.monthlyRevenue === undefined || project.monthlyRevenue < 0) {
      errors.push('Monthly Revenue is required.');
    }
    if (project.monthlyProfit === undefined) {
      errors.push('Monthly Profit is required.');
    }
    if (!project.ownershipDeclaration?.declared) {
      errors.push('You must review and accept the ownership & intellectual property declaration in Step 6.');
    }

    if (errors.length > 0) {
      setErrorList(errors);
      return;
    }

    // Pass validation -> show confirm modal
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    if (!project.id) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const res = submitProjectForReview(project.id!);
      setIsSubmitting(false);

      if (res.success && res.project) {
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        onSuccessSubmitted(res.project);
      } else if (res.errors) {
        setErrorList(res.errors);
        setShowConfirmModal(false);
      }
    }, 600);
  };

  return (
    <>
      {/* Trigger Button */}
      {variant === 'primary' && (
        <button
          type="button"
          onClick={handleValidationCheck}
          className={`px-5 py-2.5 bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md ${className}`}
        >
          <Send className="w-4 h-4 text-amber-300" />
          <span>Submit Project for Review</span>
        </button>
      )}

      {variant === 'secondary' && (
        <button
          type="button"
          onClick={handleValidationCheck}
          className={`px-4 py-2 bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${className}`}
        >
          <Clock className="w-4 h-4 text-amber-700" />
          <span>Submit for Review</span>
        </button>
      )}

      {/* Missing Fields Error Toast */}
      {errorList.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-red-950 text-red-100 p-4 rounded-2xl shadow-2xl border border-red-700 space-y-2 animate-bounce-in">
          <div className="flex items-center justify-between border-b border-red-800 pb-2">
            <span className="font-bold text-xs flex items-center gap-1.5 text-red-300">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Submission Incomplete ({errorList.length} errors)</span>
            </span>
            <button
              onClick={() => setErrorList([])}
              className="p-1 hover:bg-red-900 rounded-lg text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="text-xs space-y-1 list-disc list-inside text-red-200">
            {errorList.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirm Submission Dialog Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DDD3] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-start justify-between border-b border-[#E2DDD3] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-amber-100 text-amber-900 rounded-xl flex items-center justify-center">
                  <Send className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
                    Submit Listing for Curation
                  </h3>
                  <span className="text-xs text-[#5D5A53]">
                    AIWebCrafter Quality & Curation Process
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 hover:bg-[#F5F2EB] rounded-xl text-[#8C8275]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#5D5A53] leading-relaxed">
              <p>
                By clicking confirm, your project status will update to <strong className="text-amber-800">Pending Review</strong> and be saved in encrypted form on Supabase under your registered seller account.
              </p>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-emerald-950">
                <strong className="font-bold block flex items-center gap-1 text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>🔒 Isolated & Encrypted Protection:</span>
                </strong>
                <p className="text-[11px] text-emerald-800">
                  Your source code, financial declarations, and project files are encrypted and bound strictly to your registered email on Supabase. Buyers in Marketplace can view and purchase the asset, but cannot modify your listing data.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2DDD3] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-[#F5F2EB] border border-[#E2DDD3] rounded-xl text-xs font-semibold text-[#2C2A26]"
              >
                Cancel & Keep Editing
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>Confirm & Send for Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DDD3] rounded-3xl max-w-lg w-full p-8 text-center space-y-5 shadow-2xl animate-scale-up">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif font-bold text-2xl text-[#2C2A26]">
                Project Submitted for Review!
              </h3>
              <p className="text-xs text-[#5D5A53] max-w-sm mx-auto leading-relaxed">
                Your listing status is now <strong className="text-amber-800">Pending Review</strong>. The AIWebCrafter team will evaluate your financial metrics and codebase.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs text-emerald-950 text-left space-y-1.5">
              <strong className="font-bold text-emerald-900 block flex items-center gap-1.5">
                <span>🔐 Encrypted & Isolated on Supabase</span>
              </strong>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                1. Project code & assets are <strong>encrypted and assigned specifically to your account</strong>.<br />
                2. Once approved by Admin, all buyers in Marketplace can <strong>view metrics and buy</strong>.<br />
                3. Buyers can ONLY view and purchase — nobody can modify your listing data except you.
              </p>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all"
            >
              Return to Seller Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SubmitReviewButton;
