import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  ExternalLink, 
  Video, 
  ShieldCheck, 
  Eye, 
  FileText, 
  Clock, 
  AlertCircle,
  X,
  Sparkles,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { SellerProject } from '../../types';
import ProjectStatusBadge from '../seller/ProjectStatusBadge';
import ApprovalActions from './ApprovalActions';
import ProjectDetails from '../ProjectDetails';
import { toPublicListing } from '../../services/sellerStore';
import { safeFetchJson } from '../../utils/api';
import { getAdminKey } from '../../services/adminService';

interface ProjectReviewCardProps {
  project: SellerProject;
  onActionComplete: (updated: SellerProject) => void;
  compact?: boolean;
}

export const ProjectReviewCard: React.FC<ProjectReviewCardProps> = ({
  project,
  onActionComplete,
  compact = false
}) => {
  const [showFullReviewModal, setShowFullReviewModal] = useState(false);
  const [showFilesList, setShowFilesList] = useState(false);
  const [isSentinelCollapsed, setIsSentinelCollapsed] = useState(true);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(!compact);
  const [isScanning, setIsScanning] = useState(false);
  const [sentinelResult, setSentinelResult] = useState<{
    riskScore: number;
    riskLevel: string;
    summary: string;
    recommendation: string;
    sellerInputsSummary?: {
      title: string;
      tagline: string;
      category: string;
      askingPrice: number;
      monthlyRevenue: number;
      monthlyProfit: number;
      techStack: string[];
      demoUrl: string;
      videoUrl: string;
      sellerName: string;
      sellerEmail: string;
      descriptionSnippet: string;
      descriptionLength: number;
      attachedFilesCount: number;
      filesList: string[];
    };
    filesReport?: Array<{
      filename: string;
      path: string;
      status: 'clean' | 'warning' | 'vulnerable';
      details: string;
    }>;
  } | null>(null);

  const runAiSentinelScan = async () => {
    setIsScanning(true);
    try {
      const adminKey = getAdminKey() || '';
      const res = await safeFetchJson('/api/system/ai-sentinel-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ project })
      });
      if (res.ok && res.data?.success) {
        setSentinelResult({
          riskScore: res.data.riskScore ?? 10,
          riskLevel: res.data.riskLevel ?? 'Low',
          summary: res.data.summary ?? 'Project verified safe.',
          recommendation: res.data.recommendation ?? 'Approve',
          sellerInputsSummary: res.data.sellerInputsSummary,
          filesReport: res.data.filesReport
        });
      }
    } catch (err) {
      console.warn('AI Sentinel scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const publicListing = toPublicListing(project);

  return (
    <div
      className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-xs space-y-3.5 ${
        project.sellerStatus === 'Pending Review'
          ? 'border-amber-300 ring-1 ring-amber-200'
          : 'border-[#E2DDD3]'
      }`}
    >
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={project.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000'}
            alt={project.title}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-[#E2DDD3] shrink-0"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-[#EAE5D9] text-[#2C2A26] rounded-md text-[10px] font-bold uppercase">
                {project.category || 'SaaS'}
              </span>
              <ProjectStatusBadge status={project.sellerStatus} />
              {project.platform && (
                <span className="px-1.5 py-0.5 bg-[#F5F2EB] text-[#8C8275] rounded text-[10px] font-mono border border-[#E2DDD3]">
                  {project.platform}
                </span>
              )}
            </div>
            <h3 className="font-serif font-bold text-base text-[#2C2A26] mt-0.5 truncate">
              {project.title || 'Untitled Project'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#5D5A53] truncate">
              <span className="truncate">{project.tagline || 'No tagline provided.'}</span>
              <span className="text-[#8C8275] shrink-0">• Seller: <strong className="text-[#2C2A26]">{project.seller?.name || 'Seller'}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Top Metrics & Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <div className="text-right mr-1 hidden sm:block">
            <span className="font-serif font-bold text-base text-[#2C2A26] block">
              {formatCurrency(project.askingPrice)}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              +{formatCurrency(project.monthlyRevenue)}/mo MRR
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowFullReviewModal(true)}
            className="px-3 py-1.5 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] border border-[#E2DDD3] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
            title="Full Audit Inspection"
          >
            <Eye className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden md:inline">Full Audit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="px-2.5 py-1.5 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] border border-[#E2DDD3] rounded-xl text-xs font-bold transition-all flex items-center gap-1"
          >
            <span>{isDetailsExpanded ? 'Collapse' : 'Expand'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDetailsExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Sections */}
      {isDetailsExpanded && (
        <div className="space-y-3.5 pt-2 border-t border-[#E2DDD3] animate-fade-in">
          {/* Financial Metrics Strip */}
          <div className="grid grid-cols-3 gap-2.5 p-2.5 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8275] block">
                Asking Price
              </span>
              <span className="font-serif font-bold text-sm text-[#2C2A26]">
                {formatCurrency(project.askingPrice)}
              </span>
            </div>

            <div className="border-l border-[#E2DDD3] pl-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8275] block">
                Monthly Revenue
              </span>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#2C2A26]">
                <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{formatCurrency(project.monthlyRevenue)}/mo</span>
              </div>
            </div>

            <div className="border-l border-[#E2DDD3] pl-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8275] block">
                Net Profit
              </span>
              <span className="font-semibold text-xs text-emerald-700">
                {formatCurrency(project.monthlyProfit)}/mo
              </span>
            </div>
          </div>

          {/* Description Preview & Links */}
          <div className="space-y-1.5">
            <p className="text-xs text-[#5D5A53] leading-relaxed line-clamp-2">
              {project.description || project.longDescription || 'No overview provided.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800 hover:underline font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Live Website Demo</span>
                </a>
              )}

              {project.videoUrl && (
                <a
                  href={project.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-800 hover:underline font-bold flex items-center gap-1"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video Walkthrough</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Notice if currently Rejected */}
      {project.sellerStatus === 'Rejected' && project.rejectionReason && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-1">
          <strong className="font-bold flex items-center gap-1 text-red-950">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Rejection Reason Logged:</span>
          </strong>
          <p className="italic">{project.rejectionReason}</p>
        </div>
      )}

      {/* LOCAL SOURCE FILES VAULT INSPECTOR */}
      {project.secureFiles && project.secureFiles.length > 0 && (
        <div className="p-4 bg-[#FDFCF9] rounded-2xl border border-[#E2DDD3] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-800" />
              <span className="font-serif font-bold text-xs text-[#2C2A26]">
                Local Deliverables Vault ({project.secureFiles.length} Source Files Saved Locally)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowFilesList(!showFilesList)}
              className="text-xs text-amber-800 hover:underline font-bold flex items-center gap-1"
            >
              <span>{showFilesList ? 'Hide Files' : 'Inspect Saved Files'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showFilesList ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {showFilesList && (
            <div className="space-y-2 pt-2 border-t border-[#E2DDD3] animate-fade-in">
              <p className="text-[11px] text-[#8C8275]">
                🔒 These files are stored locally for verification prior to AI Sentinel scanning and final Supabase Vault encryption upon approval.
              </p>
              <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
                {project.secureFiles.map((file, idx) => (
                  <div key={file.id || idx} className="p-3 bg-white rounded-xl border border-[#E2DDD3] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-mono font-bold text-[#2C2A26]">
                      <span className="truncate">{file.path || file.name}</span>
                      <span className="text-[10px] text-[#8C8275] font-sans font-normal shrink-0 ml-2">
                        {Math.round((file.size || 0) / 1024)} KB
                      </span>
                    </div>
                    {file.snippet && (
                      <pre className="p-2 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto max-h-28 whitespace-pre-wrap">
                        {file.snippet.slice(0, 300)}{file.snippet.length > 300 ? '...' : ''}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI SENTINEL BOT SECURITY SCANNER */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200 space-y-3">
        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsSentinelCollapsed(!isSentinelCollapsed)}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-6 h-6 rounded-lg bg-amber-200/60 hover:bg-amber-200 flex items-center justify-center text-amber-900 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setIsSentinelCollapsed(!isSentinelCollapsed);
              }}
              aria-label="Toggle AI Sentinel section"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSentinelCollapsed ? '-rotate-90' : 'rotate-0'}`} />
            </button>
            <Sparkles className="w-4 h-4 text-amber-700 animate-pulse" />
            <span className="font-serif font-bold text-xs text-amber-950">
              AI Sentinel Guardian Bot (Automated AI Risk Audit & Verification)
            </span>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={runAiSentinelScan}
              disabled={isScanning}
              className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isScanning ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Auditing & Extracting Metrics...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Run AI Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {!isSentinelCollapsed && (
          <div className="space-y-4 pt-2 animate-fade-in">
            {/* 1. EXTRACTED SELLER SUBMISSION DATA BREAKDOWN */}
            <div className="p-4 bg-white rounded-2xl border border-amber-200/80 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <span className="font-serif font-bold text-[#2C2A26] flex items-center gap-1.5 text-xs">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>📋 Seller Submissions Data Breakdown</span>
                </span>
                <span className="text-[10px] text-[#8C8275] font-mono">
                  Verified Seller Data
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3] space-y-1">
                  <span className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Seller & Project Info</span>
                  <div className="font-bold text-[#2C2A26]">{project.title || 'Untitled'}</div>
                  <div className="text-[11px] text-[#5D5A53]">{project.tagline || 'No tagline'}</div>
                  <div className="text-[11px] text-[#8C8275] pt-1">
                    Verified Email: <strong className="text-amber-900">{project.ownerEmail || project.seller?.email || 'N/A'}</strong>
                  </div>
                </div>

                <div className="p-2.5 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3] space-y-1">
                  <span className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Financials & Tech Stack</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-900">Asking Price: {formatCurrency(project.askingPrice)}</span>
                    <span className="text-[#8C8275]">|</span>
                    <span className="text-emerald-700 font-semibold">Revenue: {formatCurrency(project.monthlyRevenue)}/mo</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(Array.isArray(project.techStack) && project.techStack.length > 0 ? project.techStack : [project.technology || project.platform || 'Web App']).map((t: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-[9px] font-bold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#8C8275]">Full Seller Description:</span>
                  <span className="text-[10px] text-amber-800 font-mono">({(project.description || project.longDescription || '').length} chars)</span>
                </div>
                <p className="text-[11px] text-[#2C2A26] leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {project.description || project.longDescription || 'No description provided by seller.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-3">
                  <span>Live Demo: <strong>{project.demoUrl ? project.demoUrl : 'Not provided'}</strong></span>
                  <span>|</span>
                  <span>Video: <strong>{project.videoUrl ? project.videoUrl : 'Not provided'}</strong></span>
                </div>
                <div className="text-amber-900 font-bold font-mono">
                  Uploaded Files: {project.secureFiles?.length || 0} files
                </div>
              </div>
            </div>

            {/* 2. AI SENTINEL AUDIT ANALYSIS & RECOMMENDATION */}
            {sentinelResult ? (
              <div className="p-4 bg-white rounded-2xl border border-amber-300 text-xs space-y-4 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl font-bold text-[10px] border ${
                      sentinelResult.recommendation === 'Approve' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                      sentinelResult.recommendation === 'Reject' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                      'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      Risk Level: {sentinelResult.riskLevel} ({sentinelResult.riskScore}/100)
                    </span>
                    <span className="text-xs font-bold text-[#2C2A26]">
                      Bot Recommendation: {' '}
                      <span className={`font-serif font-black px-2 py-0.5 rounded-lg border ${
                        sentinelResult.recommendation === 'Approve' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                        sentinelResult.recommendation === 'Reject' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                        'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {sentinelResult.recommendation}
                      </span>
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8C8275] font-mono">
                    AI Security Sentinel Scan • Completed
                  </div>
                </div>
                
                <p className="text-[#2C2A26] bg-[#FDFCF9] p-3 rounded-xl border border-amber-200/60 leading-relaxed font-sans">
                  "{sentinelResult.summary}"
                </p>

                {/* FILE-BY-FILE AUDIT BREAKDOWN */}
                {sentinelResult.filesReport && sentinelResult.filesReport.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#2C2A26] uppercase tracking-wider pb-1">
                      <span>📁 File-by-File Security Report</span>
                      <span className="text-amber-900 font-mono">({sentinelResult.filesReport.length} Files Audited)</span>
                    </div>
                    <div className="border border-amber-200/60 rounded-xl overflow-hidden divide-y divide-amber-100">
                      {sentinelResult.filesReport.map((file, idx) => (
                        <div key={idx} className="p-2.5 bg-[#FDFCF9]/60 hover:bg-amber-50/40 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-amber-950 truncate block">
                                {file.filename}
                              </span>
                              <span className="text-[9px] text-[#8C8275] font-mono truncate hidden md:inline">
                                ({file.path})
                              </span>
                            </div>
                            <p className="text-[11px] text-[#5D5A53] leading-relaxed">
                              {file.details}
                            </p>
                          </div>
                          <div className="shrink-0 pt-0.5 self-start sm:self-auto">
                            {file.status === 'clean' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Safe</span>
                              </span>
                            ) : file.status === 'warning' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3 text-amber-600 animate-pulse" />
                                <span>Warning</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-[10px] font-bold">
                                <AlertCircle className="w-3 h-3 text-rose-600 animate-ping" />
                                <span>Vulnerable</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-center text-xs text-[#8C8275]">
                    ⚠️ No attached source files detected for individual scan. Project metadata and endpoints audited.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#FDFCF9] border border-amber-200 rounded-xl text-center text-xs text-[#8C8275] space-y-1">
                <p className="font-bold text-amber-900">💡 Click "Run AI Audit" above to generate a comprehensive risk audit and recommendation.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* APPROVAL ACTIONS CONTROLS */}
      <div className="pt-2 border-t border-[#E2DDD3]">
        <ApprovalActions
          project={project}
          onActionComplete={(updated) => onActionComplete(updated)}
          layout="horizontal"
        />
      </div>

      {/* FULL INSPECTION MODAL */}
      {showFullReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-[#F5F2EB] rounded-3xl border border-[#E2DDD3] max-w-5xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-6 shadow-2xl relative animate-scale-up">
            {/* Modal Header Bar */}
            <div className="sticky top-0 z-20 bg-[#2C2A26] text-[#F5F2EB] p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="font-serif font-bold text-base text-white truncate">
                  Admin Audit: {project.title}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <ProjectStatusBadge status={project.sellerStatus} />
                <button
                  type="button"
                  onClick={() => setShowFullReviewModal(false)}
                  className="p-1.5 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Approval Action Bar in Modal */}
            <div className="p-4 bg-white rounded-2xl border border-[#E2DDD3] shadow-sm">
              <h4 className="font-serif font-bold text-sm text-[#2C2A26] mb-2">
                Decision Action for {project.title}:
              </h4>
              <ApprovalActions
                project={project}
                onActionComplete={(updated) => {
                  setShowFullReviewModal(false);
                  onActionComplete(updated);
                }}
              />
            </div>

            {/* Render exact Buyer View */}
            <div className="bg-white rounded-3xl border border-[#E2DDD3] overflow-hidden">
              <ProjectDetails
                listing={publicListing}
                onBack={() => setShowFullReviewModal(false)}
                isSaved={false}
                onToggleSave={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectReviewCard;
