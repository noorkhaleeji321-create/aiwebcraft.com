import { PremiumLogo } from "./PremiumLogo";
import React from 'react';
import { ShieldCheck, ArrowRight, Zap, Code, Lock, CheckCircle2, Sparkles, TrendingUp, Cpu, Database, Key, FileCheck } from 'lucide-react';
import projectOverviewImg from '../src/assets/images/project_overview_dashboard_1787067342962.jpg';
import { useCommissionPercentage } from '../services/supabaseService.js';

interface LandingPageProps {
  onOpenAuth: (isSignUp: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const commissionRate = useCommissionPercentage();

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#2C2A26] font-sans flex flex-col justify-between selection:bg-[#D6D1C7]">
      {/* Top Header Navigation */}
      <header className="w-full px-6 lg:px-12 py-6 flex items-center justify-between border-b border-[#E2DDD3]/60 bg-[#F5F2EB]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
<PremiumLogo className="w-10 h-10" />
          <div>
            <h1 className="font-serif font-bold text-lg text-[#2C2A26] tracking-tight">AIWeb<span className="text-[#D97706]">Crafter</span></h1>
            <p className="text-[10px] text-[#8C8275] uppercase font-mono tracking-wider animate-shine">Secure Marketplace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth(true)}
            className="px-4 py-2.5 text-xs font-semibold text-[#2C2A26] hover:text-black transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => onOpenAuth(false)}
            className="px-5 py-2.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-xs font-bold hover:bg-[#423E38] transition-all flex items-center gap-1.5"
          >
            <span>Create Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full flex flex-col items-center text-center pb-16 space-y-10">
        {/* Content Wrapper with Project Overview Image Background */}
        <div 
          className="w-full bg-cover bg-center bg-no-repeat bg-fixed relative"
          style={{ backgroundImage: `url(${projectOverviewImg})` }}
        >
          {/* Overlay to ensure ultra-high legibility & premium frosted glass feel */}
          <div className="absolute inset-0 bg-black/35 z-0"></div>

          {/* Actual Content Container - Positioned relatively to stand on top of background & overlay */}
          <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 w-full flex flex-col items-center text-center py-20 space-y-16">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-amber-200 animate-fade-in backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>The Premier Secure Marketplace for Verified SaaS & Digital Assets</span>
            </div>

            <div className="space-y-6 max-w-3xl">
              <h1 className="font-serif font-bold text-4xl sm:text-6xl text-white tracking-tight leading-[1.15]">
                Acquire, Scale & Launch <span className="underline decoration-amber-400/80 decoration-2 text-amber-200">Verified SaaS</span> Projects
              </h1>
              <p className="text-sm sm:text-base text-white/95 leading-relaxed max-w-2xl mx-auto font-medium">
                Securely trade production-ready web applications, AI tools, and revenue-generating digital micro-startups with built-in cryptographic escrow and Supabase authentication.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center pt-2">
              <button
                onClick={() => onOpenAuth(false)}
                className="w-full sm:w-auto px-8 py-4 bg-[#2C2A26] text-[#F5F2EB] rounded-2xl text-sm font-bold hover:bg-[#423E38] transition-all flex items-center justify-center gap-2 group"
              >
                <span>Get Started & Create Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onOpenAuth(true)}
                className="w-full sm:w-auto px-8 py-4 bg-white/90 border border-[#E2DDD3] text-[#2C2A26] rounded-2xl text-sm font-semibold hover:bg-[#FDFCF9] transition-all flex items-center justify-center gap-2 backdrop-blur-md"
              >
                <Lock className="w-4 h-4 text-[#8C8275]" />
                <span>Sign In to Platform</span>
              </button>
            </div>



            {/* Feature Grid with Frosted Glass Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 w-full text-left">
              <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-[#E2DDD3] space-y-3 transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-amber-50/90 text-amber-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#2C2A26]">100% Verified Assets</h3>
                <p className="text-xs text-[#5D5A53] leading-relaxed font-medium">
                  Every project listed on our platform undergoes rigorous technical and financial verification before publication.
                </p>
              </div>

              <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-[#E2DDD3] space-y-3 transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50/90 text-emerald-800 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#2C2A26]">Secure Supabase Auth</h3>
                <p className="text-xs text-[#5D5A53] leading-relaxed font-medium">
                  Protected by military-grade security encryption, Google SSO, CAPTCHA verification, and strict access control.
                </p>
              </div>

              <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-[#E2DDD3] space-y-3 transition-all duration-300">
                <div className="w-10 h-10 rounded-2xl bg-blue-50/90 text-blue-800 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#2C2A26]">Instant Handover</h3>
                <p className="text-xs text-[#5D5A53] leading-relaxed font-medium">
                  Automated buyer delivery centers and secure escrow workflows ensure seamless ownership transfer.
                </p>
              </div>
            </div>

             {/* AIWebCrafter Advanced Services Grid */}
            <div className="w-full pt-8 space-y-8 text-left">
              <div className="border-b border-white/20 pb-4">
                <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">AIWebCrafter Advanced Platform Services</h2>
                <p className="text-sm text-white/90 mt-1 font-medium">9+ elite integrated services powered by AIWebCrafter to verify data, secure escrow transactions, and ensure maximum code quality.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "AI SaaS Advisory & Architecture", icon: Sparkles, desc: "24/7 AI-driven consulting and architecture guidance for SaaS developers and investors to optimize project scalability." },
                  { title: "Automated Metrics & Revenue Validation", icon: TrendingUp, desc: "Automated verification of recurring revenue, analytics data, and performance metrics to ensure complete transparency." },
                  { title: "Escrow Guardian & Secured Transactions", icon: Lock, desc: "Neutral escrow system that securely holds buyer funds until digital assets and codebases are successfully transferred." },
                  { title: "Advanced Security Vulnerability Scanner", icon: Code, desc: "Automated security checks to scan codebases for vulnerabilities, malicious injections, and leaked API secrets." },
                  { title: "Multi-Factor Identity & Access Guard", icon: ShieldCheck, desc: "Robust Supabase-powered authentication and role-based access control ensuring enterprise-grade data security." },
                  { title: "Anti-Fraud & Suspicious Activity Shield", icon: Zap, desc: "Real-time monitoring and instant alerts to detect fraudulent transactions and suspicious marketplace behavior." },
                  { title: "Audit Logging & Accounting Compliance", icon: FileCheck, desc: "Comprehensive logging and accounting verification for all platform transactions, ensuring complete legal compliance." },
                  { title: "Cloud Orchestration & Secure Encryption", icon: Cpu, desc: "Secure cloud task coordination backed by end-to-end AES-256 encryption for all sensitive platform configurations." },
                  { title: "Media & Digital Asset Verification", icon: Database, desc: "Automated integrity verification and cloud storage management for project media, assets, and deliverables." }
                ].map((service, i) => (
                  <div key={i} className="bg-white/80 hover:bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-[#E2DDD3] space-y-3 transition-all duration-300">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50/90 text-amber-800 flex items-center justify-center">
                      <service.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-[#2C2A26]">{service.title}</h3>
                    <p className="text-xs text-[#5D5A53] leading-relaxed font-medium">{service.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Explanation & Role Section with Frosted Glass Cards */}
            <div className="w-full pt-8 space-y-8 text-left">
              <div className="border-b border-white/20 pb-4">
                <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">What is AIWebCrafter and its role?</h2>
                <p className="text-sm text-white/90 mt-1 font-medium">The trusted and secure marketplace for buying and selling SaaS (Software as a Service) applications, software projects, and AI tools.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#E2DDD3] space-y-4 transition-all duration-300">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50/90 text-amber-800 text-xs font-semibold">
                    <span>Platform Role</span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-[#2C2A26]">Guaranteed & Secure Digital Transactions</h3>
                  <p className="text-xs sm:text-sm text-[#5D5A53] leading-relaxed font-medium">
         WebCrafter acts as a neutral escrow agent. We secure the buyer's funds in a protected escrow account until all project files are successfully delivered and verified, preventing fraud and fully protecting both parties.
                  </p>
                </div>

                <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#E2DDD3] space-y-4 transition-all duration-300">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/90 text-emerald-800 text-xs font-semibold">
                    <span>Commission & Fees</span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-[#2C2A26]">Competitive Commission: Only {commissionRate.toFixed(1)}%</h3>
                  <p className="text-xs sm:text-sm text-[#5D5A53] leading-relaxed font-medium">
                    The platform charges a low, fixed commission of only <b>{commissionRate.toFixed(1)}%</b> on successful transactions. This fee covers cloud infrastructure, Supabase security, and round-the-clock instant handover support.
                  </p>
                </div>
              </div>

              {/* Seller & Buyer Rules & Policies */}
              <div className="pt-8 space-y-8">
                <div className="border-b border-white/20 pb-4">
                  <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">Seller & Buyer Rules & Policies</h2>
                  <p className="text-sm text-white/90 mt-1 font-medium">Strict conditions to ensure a secure, professional, and dispute-free environment.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Seller Rules */}
                  <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#E2DDD3] space-y-4 transition-all duration-300">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/90 text-blue-800 text-xs font-semibold">
                      <span>Seller Policies</span>
                    </div>
                    <ul className="space-y-4 text-xs sm:text-sm text-[#5D5A53] leading-relaxed">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span><b>Exclusive Intellectual Property:</b> The listed project must be fully owned, licensed, and free of any copyright infringement.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span><b>Proof of Revenue & Traffic:</b> Provide verified, accurate metrics for monthly revenues, expenses, and traffic statistics.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span><b>Delivery & Support Period:</b> Commitment to transfer all assets and provide initial technical support to the buyer for 7 days post-handover.</span>
                      </li>
                      <li className="flex items-start gap-2 border-t border-[#E2DDD3]/60 pt-3">
                        <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span><b>Revenue Fraud Penalty:</b> Any manipulation of revenue figures or traffic statistics leads to permanent account suspension and complete forfeiture of escrow funds.</span>
                      </li>
                      <li className="flex items-start gap-2 border-t border-[#E2DDD3]/60 pt-3">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span><b>Support Scope:</b> The 7-day post-sale support covers fixing existing bugs or code issues to match the description, and does not include custom feature additions or rebuilding the application.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Buyer Rules */}
                  <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#E2DDD3] space-y-4 transition-all duration-300">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50/90 text-purple-800 text-xs font-semibold">
                      <span>Buyer Policies</span>
                    </div>
                    <ul className="space-y-4 text-xs sm:text-sm text-[#5D5A53] leading-relaxed">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span><b>Escrow Compliance:</b> All payments and transactions must be completed exclusively via the platform's secure escrow system.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span><b>Project Inspection:</b> Review and inspect the source code within the specified verification period before confirming final acceptance.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span><b>Confidentiality:</b> Maintain absolute confidentiality of the seller's source code and trade secrets, and do not distribute illegally.</span>
                      </li>
                      <li className="flex items-start gap-2 border-t border-[#E2DDD3]/60 pt-3">
                        <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span><b>Anti-Piracy Compliance:</b> The buyer is legally committed not to resell or distribute the source code publicly, especially for single-license products.</span>
                      </li>
                      <li className="flex items-start gap-2 border-t border-[#E2DDD3]/60 pt-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><b>48-Hour Inspection & Download Timer:</b> Upon purchasing a project, seller payout is executed within 48 hours. The 48-hour clock begins the exact moment the buyer downloads the project files. Any defect, dissatisfaction, or non-compliance during this period will trigger immediate platform administration intervention to resolve the dispute.</span>
                      </li>
                      <li className="flex items-start gap-2 border-t border-[#E2DDD3]/60 pt-3">
                        <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span><b>Platform Communication Rule:</b> All communications must stay on-platform. Off-platform deals (e.g. WhatsApp, personal email) waive all safety guarantees and lead to permanent suspension.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Platform & Dispute Rights Section */}
                <div className="pt-8">
                  <div className="bg-white/80 hover:bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#E2DDD3] space-y-6 transition-all duration-300">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50/90 text-amber-800 text-xs font-semibold">
                      <span>Platform & Dispute Rights</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-[#5D5A53]">
                      <div className="space-y-2">
                        <h4 className="font-serif font-bold text-base text-[#2C2A26] flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                          Platform Fee Transparency
                        </h4>
                        <p className="leading-relaxed font-medium">
                          The platform charges a transparent, fixed commission of <b>{commissionRate.toFixed(1)}%</b> on successful transactions, deducted from the seller to cover secure hosting, protection, and escrow oversight.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-serif font-bold text-base text-[#2C2A26] flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                          48h Payout & Download Timer
                        </h4>
                        <p className="leading-relaxed font-medium">
                          Seller payout is processed within 48 hours. The countdown starts immediately upon downloading the project files. Any issue, bug, or dissatisfaction reported within 48 hours triggers admin dispute resolution.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-serif font-bold text-base text-[#2C2A26] flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                          Disputes & Admin Intervention
                        </h4>
                        <p className="leading-relaxed font-medium">
                          If the transaction is canceled by mutual agreement before asset handover, funds are fully refunded to the buyer. In case of disputes or seller breach, platform management intervenes directly to review evidence and issue a binding resolution.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 lg:px-12 py-6 border-t border-[#E2DDD3] text-center text-xs text-[#8C8275]">
        <p>&copy; 2026 AIWebCrafter Secure Marketplace. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
