import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, Send } from 'lucide-react';
import { OrderTransaction } from '../../types';
import { openDispute } from '../../services/deliveryStore';

interface DisputeModalProps {
  orderId: string;
  buyerName: string;
  isOpen: boolean;
  onClose: () => void;
  onDisputeSubmitted: (updated: OrderTransaction) => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  orderId,
  buyerName,
  isOpen,
  onClose,
  onDisputeSubmitted
}) => {
  const [reason, setReason] = useState('Source Code Incomplete or Broken');
  const [evidence, setEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidence.trim()) return;

    setIsSubmitting(true);
    const updated = openDispute(orderId, reason, evidence.trim(), buyerName);
    setIsSubmitting(false);

    if (updated) {
      onDisputeSubmitted(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2DDD3] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <div className="flex items-center gap-2 text-red-700 font-serif font-bold text-lg">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span>Open Escrow Dispute</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8C8275] hover:text-[#2C2A26] hover:bg-[#F5F2EB]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-[#5D5A53] leading-relaxed">
            Opening a dispute halts escrow funds release and escalates the transaction to AIWebCrafter admin arbitration. Please provide specific details and evidence.
          </p>

          <div>
            <label className="text-xs font-bold text-[#2C2A26] block mb-1">
              Primary Dispute Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-2.5 text-xs font-medium text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
            >
              <option value="Source Code Incomplete or Broken">Source Code Incomplete or Broken</option>
              <option value="Revenue or Financial Metric Discrepancy">Revenue or Financial Metric Discrepancy</option>
              <option value="Domain Registrar Transfer Failed">Domain Registrar Transfer Failed</option>
              <option value="Missing Database Backup or Users">Missing Database Backup or Users</option>
              <option value="Unregistered Third-Party IP Claim">Unregistered Third-Party IP Claim</option>
              <option value="Seller Unresponsive">Seller Unresponsive</option>
              <option value="Other Asset Discrepancy">Other Asset Discrepancy</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#2C2A26] block mb-1">
              Detailed Evidence Description & Context *
            </label>
            <textarea
              rows={4}
              required
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Describe the defect, test errors, missing files, or mismatch with advertised listing parameters..."
              className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-2.5 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950">
            <strong>Escrow Protection Notice:</strong> Your funds ($) remain frozen in escrow while an administrator reviews evidence submitted by both buyer and seller.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#5D5A53]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !evidence.trim()}
              className="px-6 py-2.5 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting Dispute...' : 'Submit Dispute'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal;
