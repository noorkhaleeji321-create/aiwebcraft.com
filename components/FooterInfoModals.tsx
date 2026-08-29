import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  ShieldCheck, 
  FileText, 
  BookOpen, 
  Scale, 
  CheckCircle2, 
  TrendingUp, 
  Lock, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

export type FooterModalType = 'valuation' | 'escrow' | 'buyer-guide' | 'terms' | 'privacy' | null;

interface FooterInfoModalsProps {
  activeModal: FooterModalType;
  onClose: () => void;
  onSellClick?: () => void;
}

export const FooterInfoModals: React.FC<FooterInfoModalsProps> = ({ activeModal, onClose, onSellClick }) => {
  // Valuation Calculator State
  const [calcMonthlyRev, setCalcMonthlyRev] = useState<number>(2500);
  const [calcMonthlyProfit, setCalcMonthlyProfit] = useState<number>(1800);
  const [calcCategory, setCalcCategory] = useState<string>('SaaS');
  const [calcGrowth, setCalcGrowth] = useState<string>('steady'); // 'steady', 'fast', 'pre-revenue'
  const [calcHasCode, setCalcHasCode] = useState<boolean>(true);

  if (!activeModal) return null;

  // Calculation logic
  const arr = calcMonthlyRev * 12;
  let baseMultiple = calcCategory === 'AI Tools' ? 4.5 : calcCategory === 'SaaS' ? 4.0 : calcCategory === 'Shopify' ? 3.2 : 3.5;
  if (calcGrowth === 'fast') baseMultiple += 1.2;
  if (calcGrowth === 'pre-revenue') baseMultiple = 1.8;
  if (!calcHasCode) baseMultiple *= 0.7;

  const estimatedMinPrice = Math.round(arr * Math.max(1.5, baseMultiple - 0.8));
  const estimatedMaxPrice = Math.round(arr * (baseMultiple + 0.8));
  const recommendedListingPrice = Math.round(arr * baseMultiple);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E2DDD3] my-8 max-h-[90vh] flex flex-col justify-between">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD3] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
              activeModal === 'valuation' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
              activeModal === 'escrow' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
              activeModal === 'buyer-guide' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
              'bg-purple-100 text-purple-900 border border-purple-300'
            }`}>
              {activeModal === 'valuation' && <Calculator className="w-6 h-6" />}
              {activeModal === 'escrow' && <ShieldCheck className="w-6 h-6" />}
              {activeModal === 'buyer-guide' && <BookOpen className="w-6 h-6" />}
              {activeModal === 'terms' && <Scale className="w-6 h-6" />}
              {activeModal === 'privacy' && <FileText className="w-6 h-6" />}
            </div>

            <div>
              <h2 className="font-serif font-bold text-xl text-[#2C2A26]">
                {activeModal === 'valuation' && 'SaaS & Project Valuation Calculator'}
                {activeModal === 'escrow' && 'Escrow Guarantee & Funds Vault Protection'}
                {activeModal === 'buyer-guide' && 'Buyer Due Diligence Checklist & Guide'}
                {activeModal === 'terms' && 'Terms of Service & Platform Governance'}
                {activeModal === 'privacy' && 'Privacy Policy & Data Security Standards'}
              </h2>
              <p className="text-xs text-[#5D5A53] mt-0.5">
                {activeModal === 'valuation' && 'Estimate fair market value based on real revenue and verified ARR multiples.'}
                {activeModal === 'escrow' && 'Complete protection for buyer funds and seller assets until verification is complete.'}
                {activeModal === 'buyer-guide' && 'Step-by-step checklist to audit financials, codebase, and traffic before completing purchase.'}
                {activeModal === 'terms' && 'Rules and legal obligations governing buying, selling, and escrow on AIWebCrafter.'}
                {activeModal === 'privacy' && 'Encryption standards and personal data protection guidelines.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F5F2EB] hover:bg-[#EAE5D9] flex items-center justify-center text-[#2C2A26] font-bold text-sm transition-all cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="overflow-y-auto space-y-6 pr-1 text-[#2C2A26]">

          {/* 1. VALUATION CALCULATOR MODAL CONTENT */}
          {activeModal === 'valuation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#FDFCF9] p-5 rounded-2xl border border-[#E2DDD3]">
                
                {/* Inputs */}
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-sm text-[#2C2A26] border-b border-[#E2DDD3] pb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-700" />
                    <span>Project Inputs & Financial Metrics</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-[#5D5A53] mb-1">
                      Current Monthly Revenue (USD):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-[#8C8275] font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        value={calcMonthlyRev}
                        onChange={(e) => setCalcMonthlyRev(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-[#E2DDD3] rounded-xl text-xs font-bold text-[#2C2A26] focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5D5A53] mb-1">
                      Net Monthly Profit (USD):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-[#8C8275] font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        value={calcMonthlyProfit}
                        onChange={(e) => setCalcMonthlyProfit(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-[#E2DDD3] rounded-xl text-xs font-bold text-[#2C2A26] focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5D5A53] mb-1">Project Category:</label>
                    <select
                      value={calcCategory}
                      onChange={(e) => setCalcCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2DDD3] rounded-xl text-xs font-bold text-[#2C2A26] focus:outline-none focus:border-amber-500"
                    >
                      <option value="SaaS">SaaS Platform (Recurring Subscriptions)</option>
                      <option value="AI Tools">AI Tool / Web App</option>
                      <option value="Shopify">Shopify E-commerce Store</option>
                      <option value="E-commerce">E-commerce Brand</option>
                      <option value="Mobile Apps">Mobile App</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#5D5A53] mb-1">Growth Trend:</label>
                    <select
                      value={calcGrowth}
                      onChange={(e) => setCalcGrowth(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2DDD3] rounded-xl text-xs font-bold text-[#2C2A26] focus:outline-none focus:border-amber-500"
                    >
                      <option value="steady">Steady Growth (10%-30% YoY)</option>
                      <option value="fast">High Growth (50%+ YoY)</option>
                      <option value="pre-revenue">Pre-revenue / Starter Project</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="calcHasCode"
                      checked={calcHasCode}
                      onChange={(e) => setCalcHasCode(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                    />
                    <label htmlFor="calcHasCode" className="text-xs text-[#2C2A26] font-semibold cursor-pointer">
                      Includes full source code and complete IP ownership
                    </label>
                  </div>
                </div>

                {/* Outputs & Multipliers */}
                <div className="p-5 bg-gradient-to-br from-amber-900 to-[#2C2A26] text-white rounded-2xl flex flex-col justify-between shadow-lg space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider block">
                      Estimated Valuation Result
                    </span>
                    
                    <div className="space-y-1">
                      <div className="text-3xl font-serif font-black text-amber-300">
                        ${recommendedListingPrice.toLocaleString()} <span className="text-xs font-sans text-amber-100 font-normal">USD</span>
                      </div>
                      <div className="text-xs text-amber-200">
                        Recommended Range: <strong className="text-white font-mono">${estimatedMinPrice.toLocaleString()} - ${estimatedMaxPrice.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/10 rounded-xl space-y-2 border border-white/10 text-xs">
                    <div className="flex justify-between text-amber-200">
                      <span>Annual Revenue Multiple (ARR Multiple):</span>
                      <strong className="text-white font-mono">{baseMultiple.toFixed(1)}x ARR</strong>
                    </div>
                    <div className="flex justify-between text-amber-200">
                      <span>Annual Recurring Revenue (ARR):</span>
                      <strong className="text-white font-mono">${arr.toLocaleString()}/year</strong>
                    </div>
                    <div className="flex justify-between text-amber-200">
                      <span>Operating Profit Margin:</span>
                      <strong className="text-white font-mono">{calcMonthlyRev > 0 ? Math.round((calcMonthlyProfit / calcMonthlyRev) * 100) : 0}% Profit Margin</strong>
                    </div>
                  </div>

                  {onSellClick && (
                    <button
                      onClick={() => {
                        onClose();
                        onSellClick();
                      }}
                      className="w-full py-3 bg-amber-300 hover:bg-amber-400 text-[#2C2A26] font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                    >
                      <Sparkles className="w-4 h-4 text-amber-900" />
                      <span>List Your Project at This Valuation Now</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Educational Explanation */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs space-y-2">
                <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-800" />
                  <span>How are digital projects valued on AIWebCrafter?</span>
                </h4>
                <p className="text-[#5D5A53] leading-relaxed">
                  Our valuation calculator analyzes real historical transaction data across over 1,500 digital asset acquisitions. Annual Revenue Multiples (ARR) typically range from <strong>3.0x to 6.0x</strong> depending on revenue stability, codebase quality, user retention rates, and net profit margins.
                </p>
              </div>
            </div>
          )}

          {/* 2. ESCROW GUARANTEE MODAL CONTENT */}
          {activeModal === 'escrow' && (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-emerald-900 to-[#2C2A26] text-white rounded-2xl flex items-center justify-between gap-4 shadow-md">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider block">100% Secure Transaction Vault</span>
                  <h3 className="font-serif font-bold text-lg text-white">Escrow Protection & Funds Vault Guarantee</h3>
                  <p className="text-xs text-emerald-200">Buyer funds are held safely in escrow and are only released after full codebase inspection and verification.</p>
                </div>
                <ShieldCheck className="w-16 h-16 text-emerald-400 shrink-0 opacity-90" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#2C2A26] text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-mono font-bold">1</span>
                    <span>Deposit into Escrow Vault</span>
                  </div>
                  <p className="text-[#5D5A53] leading-relaxed">
                    When a buyer completes payment via PayPal, Card, or Crypto, funds are locked in a neutral, encrypted Escrow vault inaccessible to the seller.
                  </p>
                </div>

                <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#2C2A26] text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-mono font-bold">2</span>
                    <span>Asset & Code Handover</span>
                  </div>
                  <p className="text-[#5D5A53] leading-relaxed">
                    The seller transfers source code, domain ownership, hosting access, and integrated accounts to the buyer via our safe handover protocol.
                  </p>
                </div>

                <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#2C2A26] text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-mono font-bold">3</span>
                    <span>Inspection Window (7 Days)</span>
                  </div>
                  <p className="text-[#5D5A53] leading-relaxed">
                    The buyer is granted a 7-day inspection window to audit the codebase, run live tests, and verify financial metrics.
                  </p>
                </div>

                <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#2C2A26] text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-mono font-bold">4</span>
                    <span>Confirmed Release or 100% Refund</span>
                  </div>
                  <p className="text-[#5D5A53] leading-relaxed">
                    Once the buyer approves delivery, funds are released to the seller. In case of major undisclosed defects, a full 100% refund is initiated.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2 font-sans">
                <div className="font-bold flex items-center gap-2 text-emerald-950">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>Intellectual Property Protection Commitment:</span>
                </div>
                <p className="leading-relaxed text-[#2C2A26]">
                  All assets, source code, and encrypted credentials stored in the vault are protected under an automated, legally binding Non-Disclosure Agreement (NDA).
                </p>
              </div>
            </div>
          )}

          {/* 3. BUYER DUE DILIGENCE GUIDE MODAL CONTENT */}
          {activeModal === 'buyer-guide' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2 text-xs">
                <h3 className="font-serif font-bold text-base text-blue-950 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-800" />
                  <span>Comprehensive Buyer Due Diligence Checklist</span>
                </h3>
                <p className="text-[#5D5A53] leading-relaxed">
                  Follow this expert-approved checklist to inspect and audit any digital asset before confirming ownership transfer:
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Check 1 */}
                <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#2C2A26] text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>1. Financial & Revenue Verification</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#5D5A53] pl-2 leading-relaxed">
                    <li>Request read-only access to Stripe or PayPal dashboard to verify past revenue numbers.</li>
                    <li>Calculate net monthly profit after deducting server hosting, API costs, and gateway fees.</li>
                    <li>Verify churn rates and ensure there are no abnormal refund or chargeback spikes.</li>
                  </ul>
                </div>

                {/* Check 2 */}
                <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#2C2A26] text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>2. Technical Codebase & Architecture Audit</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#5D5A53] pl-2 leading-relaxed">
                    <li>Audit repository source code to ensure high quality, maintainability, and no critical security flaws.</li>
                    <li>Confirm clean licensing and absence of non-transferable proprietary third-party libraries.</li>
                    <li>Verify all environment variables (.env.example) and API keys required to deploy and run.</li>
                  </ul>
                </div>

                {/* Check 3 */}
                <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#2C2A26] text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>3. Traffic & Audience Audit</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#5D5A53] pl-2 leading-relaxed">
                    <li>Review Google Analytics to confirm traffic acquisition sources (Organic SEO vs Paid Ads).</li>
                    <li>Check domain WHOIS, domain authority, and ensure no active search engine penalties or bans.</li>
                  </ul>
                </div>

                {/* Check 4 */}
                <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#2C2A26] text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>4. Final Ownership Transfer</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[#5D5A53] pl-2 leading-relaxed">
                    <li>Update all security credentials, master passwords, and administrative access keys immediately.</li>
                    <li>Complete digital signature on IP Transfer Agreement preventing seller from building an identical clone.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 4. TERMS OF SERVICE MODAL CONTENT */}
          {activeModal === 'terms' && (
            <div className="space-y-6 text-xs text-[#2C2A26]">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-1">
                <h3 className="font-serif font-bold text-base text-purple-950 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-800" />
                  <span>Terms of Service & Platform Governance Agreement</span>
                </h3>
                <p className="text-[#5D5A53] text-[11px]">
                  Last updated: August 25, 2026 • Legally binding platform agreement
                </p>
              </div>

              <div className="space-y-4 leading-relaxed text-[#5D5A53]">
                <section className="space-y-2">
                  <h4 className="font-serif font-bold text-sm text-[#2C2A26]">Article 1: Scope & Legal Eligibility</h4>
                  <p>
                    This agreement establishes the governing terms for using AIWebCrafter to buy, sell, and transfer digital assets, SaaS applications, and software tools. Using the platform constitutes full acceptance of these terms.
                  </p>
                </section>

                <section className="space-y-2 border-t border-[#E2DDD3] pt-3">
                  <h4 className="font-serif font-bold text-sm text-[#2C2A26]">Article 2: Listing Accuracy & Seller Representations</h4>
                  <p>
                    Sellers must provide true, accurate, and up-to-date metrics regarding revenue, profit, traffic, and codebase ownership. Misleading listings or forged documentation result in immediate account termination.
                  </p>
                </section>

                <section className="space-y-2 border-t border-[#E2DDD3] pt-3">
                  <h4 className="font-serif font-bold text-sm text-[#2C2A26]">Article 3: Mandatory Escrow Policy</h4>
                  <p>
                    To protect all parties, all financial transactions must take place through AIWebCrafter's encrypted Escrow Vault. External or off-platform transactions are strictly prohibited.
                  </p>
                </section>

                <section className="space-y-2 border-t border-[#E2DDD3] pt-3">
                  <h4 className="font-serif font-bold text-sm text-[#2C2A26]">Article 4: IP Transfer & Non-Compete</h4>
                  <p>
                    Upon payout release, full intellectual property rights, trademarks, and source code ownership transfer to the buyer. Sellers agree to a 12-month non-compete period regarding identical clones.
                  </p>
                </section>

                <section className="space-y-2 border-t border-[#E2DDD3] pt-3">
                  <h4 className="font-serif font-bold text-sm text-[#2C2A26]">Article 5: Dispute Resolution & Arbitration</h4>
                  <p>
                    In case of disagreement during the Inspection Window, AIWebCrafter administration acts as an impartial arbitrator to review technical evidence and issue a final binding resolution.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* 5. PRIVACY POLICY MODAL CONTENT */}
          {activeModal === 'privacy' && (
            <div className="space-y-6 text-xs text-[#2C2A26]">
              <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl space-y-1">
                <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-800" />
                  <span>Privacy Policy & Data Security Standards</span>
                </h3>
                <p className="text-[#5D5A53] text-[11px]">
                  Committed to strict international encryption standards and GDPR compliance.
                </p>
              </div>

              <div className="space-y-4 leading-relaxed text-[#5D5A53]">
                <section className="space-y-2">
                  <h4 className="font-serif font-bold text-sm text-[#2C2A26]">1. Information We Collect</h4>
                  <p>
                    We only collect essential data required to operate escrow transactions and verify accounts, including email address, name, transaction records, and listing specifications.
                  </p>
                </section>

                <section className="space-y-2 border-t border-[#E2DDD3] pt-3">
                  <h4 className="font-serif font-bold text-sm text-[#2C2A26]">2. Encrypted File Storage</h4>
                  <p>
                    Sensitive source code files, credentials, and financial attachments are stored in isolated vaults encrypted with AES-256 protocols.
                  </p>
                </section>

                <section className="space-y-2 border-t border-[#E2DDD3] pt-3">
                  <h4 className="font-serif font-bold text-sm text-[#2C2A26]">3. No Data Selling or Third-Party Sharing</h4>
                  <p>
                    We never sell, rent, or monetize your personal data to advertisers. Data is exclusively used to provide secure marketplace and escrow services.
                  </p>
                </section>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="pt-4 border-t border-[#E2DDD3] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#8C8275]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">AIWebCrafter Official Platform Governance</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};

export default FooterInfoModals;
