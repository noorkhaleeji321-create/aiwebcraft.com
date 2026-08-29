import React from 'react';
import { ShieldCheck, CheckCircle2, Award, Lock } from 'lucide-react';
import { VerificationInfo } from '../types.js';

interface VerificationBadgeProps {
  verification?: VerificationInfo;
  variant?: 'compact' | 'full';
}

const defaultVerification: VerificationInfo = {
  revenueVerified: false,
  trafficVerified: false,
  codebaseVerified: false,
  sellerIdentityVerified: false
};

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verification = defaultVerification,
  variant = 'compact'
}) => {
  const safeVerification = verification || defaultVerification;

  const isFullyVerified =
    safeVerification.revenueVerified &&
    safeVerification.trafficVerified &&
    safeVerification.codebaseVerified;

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-semibold">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{isFullyVerified ? '100% Verified' : 'Verified Listing'}</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2DDD3] rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD3]">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#2C2A26]">Verification Status</h4>
            <p className="text-xs text-[#5D5A53]">Audited metrics & background verification</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
          AIWebCrafter Shield
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-start gap-2 p-2.5 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3]">
          <CheckCircle2
            className={`w-4 h-4 mt-0.5 ${
              safeVerification.revenueVerified ? 'text-emerald-600' : 'text-gray-300'
            }`}
          />
          <div>
            <span className="font-semibold text-[#2C2A26] block">Revenue Verified</span>
            <span className="text-[#5D5A53] text-[11px]">
              Stripe/Bank statement audit passed
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2.5 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3]">
          <CheckCircle2
            className={`w-4 h-4 mt-0.5 ${
              safeVerification.trafficVerified ? 'text-emerald-600' : 'text-gray-300'
            }`}
          />
          <div>
            <span className="font-semibold text-[#2C2A26] block">Traffic Verified</span>
            <span className="text-[#5D5A53] text-[11px]">
              Google Analytics / Cloudflare confirmed
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2.5 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3]">
          <CheckCircle2
            className={`w-4 h-4 mt-0.5 ${
              safeVerification.codebaseVerified ? 'text-emerald-600' : 'text-gray-300'
            }`}
          />
          <div>
            <span className="font-semibold text-[#2C2A26] block">Codebase Audit</span>
            <span className="text-[#5D5A53] text-[11px]">
              Clean architecture & IP ownership checked
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-2.5 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3]">
          <Lock className="w-4 h-4 text-emerald-600 mt-0.5" />
          <div>
            <span className="font-semibold text-[#2C2A26] block">Escrow Ready</span>
            <span className="text-[#5D5A53] text-[11px]">
              Protected transaction transfer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationBadge;
