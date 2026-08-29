import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Send, 
  X, 
  ShieldCheck, 
  Sparkles,
  MessageSquare,
  FileCheck,
  Trash2
} from 'lucide-react';
import { SellerProject } from '../../types';
import { approveProjectServer, rejectProjectServer } from '../../services/adminService';
import { deleteSellerProject, addDeletedListingId } from '../../services/sellerStore';
import { deleteProjectFromSupabase } from '../../services/supabaseService';

interface ApprovalActionsProps {
  project: Partial<SellerProject>;
  onActionComplete: (updatedProject: SellerProject) => void;
  layout?: 'horizontal' | 'compact' | 'modal';
}

export const ApprovalActions: React.FC<ApprovalActionsProps> = ({
  project,
  onActionComplete,
  layout = 'horizontal'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Common quick templates for rejection
  const REJECTION_TEMPLATES = [
    'Missing financial proof for Stripe/Bank MRR statements.',
    'Description is too short; please provide full business model details.',
    'Invalid or broken live demo link provided.',
    'Asking price does not match financial profit metrics.'
  ];

  const handleApprove = async () => {
    if (!project.id) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const res = await approveProjectServer(project.id, undefined, project as SellerProject);
    setIsProcessing(false);

    if (res.success && res.project) {
      setSuccessMessage('Approved! Project is now LIVE in the Marketplace.');
      setTimeout(() => {
        onActionComplete(res.project!);
      }, 800);
    } else {
      setErrorMessage(res.message || 'Failed to approve project.');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project.id) return;

    if (!rejectionReason || rejectionReason.trim().length < 3) {
      setErrorMessage('Please enter a valid rejection reason (at least 3 characters).');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const res = await rejectProjectServer(project.id, rejectionReason, undefined, project as SellerProject);
    setIsProcessing(false);

    if (res.success && res.project) {
      setShowRejectModal(false);
      setSuccessMessage('Project rejected. Feedback recorded for seller.');
      setTimeout(() => {
        onActionComplete(res.project!);
      }, 800);
    } else {
      setErrorMessage(res.message || 'Failed to reject project.');
    }
  };

  const handleDeleteProject = async () => {
    if (!project.id) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${project.title || 'this project'}"?`)) {
      return;
    }
    setIsProcessing(true);
    try {
      deleteSellerProject(project.id);
      addDeletedListingId(project.id);
      await deleteProjectFromSupabase(project.id);
      setSuccessMessage('Project deleted successfully.');
      setTimeout(() => {
        onActionComplete({ ...project, id: project.id, isDeleted: true } as any);
      }, 400);
    } catch (err) {
      setErrorMessage('Failed to delete project.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Messages */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold rounded-xl flex items-center gap-2 animate-bounce-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-950 text-xs font-bold rounded-xl flex items-center gap-2 animate-bounce-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className={`flex items-center gap-2.5 ${layout === 'compact' ? 'flex-wrap' : ''}`}>
        {/* Approve Button */}
        <button
          type="button"
          onClick={handleApprove}
          disabled={isProcessing || project.sellerStatus === 'Approved'}
          className="flex-1 min-w-[130px] px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isProcessing ? 'Approving...' : 'Approve Project'}</span>
        </button>

        {/* Reject Button */}
        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setShowRejectModal(true);
          }}
          disabled={isProcessing}
          className="flex-1 min-w-[130px] px-4 py-2.5 bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <XCircle className="w-4 h-4 text-amber-800" />
          <span>Reject Submission</span>
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDeleteProject}
          disabled={isProcessing}
          className="px-4 py-2.5 bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          title="Delete Project"
        >
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>Delete</span>
        </button>
      </div>

      {/* Reject Reason Dialog Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DDD3] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-start justify-between border-b border-[#E2DDD3] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-red-100 text-red-900 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
                    Reject Listing Submission
                  </h3>
                  <span className="text-xs text-[#5D5A53]">
                    Rejection Reason Logged Server-Side
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1.5 hover:bg-[#F5F2EB] rounded-xl text-[#8C8275]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <p className="text-xs text-[#5D5A53] leading-relaxed">
                Please provide clear constructive feedback for <strong>{project.title || 'this project'}</strong>. The seller will see this exact message in their Seller Dashboard to make required revisions.
              </p>

              {/* Quick Template Chips */}
              <div>
                <span className="text-[11px] font-bold text-[#8C8275] uppercase block mb-1.5">
                  Quick Feedback Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {REJECTION_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReason(tmpl)}
                      className="text-[11px] px-2.5 py-1 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] rounded-lg border border-[#E2DDD3] text-left transition-all"
                    >
                      + {tmpl.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Textarea */}
              <div>
                <label className="text-xs font-bold text-[#2C2A26] uppercase block mb-1">
                  Rejection Reason (Required)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why this project was rejected (e.g. Please upload Stripe screenshot for MRR proof)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-xs rounded-xl p-3 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {errorMessage && (
                <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMessage}</span>
                </p>
              )}

              <div className="pt-3 border-t border-[#E2DDD3] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-[#F5F2EB] border border-[#E2DDD3] rounded-xl text-xs font-semibold text-[#2C2A26]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-red-700 text-white hover:bg-red-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-red-200" />
                  <span>Confirm & Send Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalActions;
