import React, { useState, useEffect, useMemo } from 'react';
import { 
  getStoredSellerProjects, 
  deleteSellerProject, 
  deleteAllUserSellerProjects,
  simulateAdminApproval, 
  toPublicListing,
  getCurrentLoggedInEmail,
  getSellerPayoutSettings,
  saveSellerPayoutSettings
} from '../../services/sellerStore';
import { getCurrentSupabaseUser, saveProjectToSupabase, useCommissionPercentage } from '../../services/supabaseService';
import { SellerProject, Listing, SellerPayoutSettings } from '../../types';
import SellerSidebar, { SellerTab } from './SellerSidebar';
import SellerOverview from './SellerOverview';
import ProjectTable from './ProjectTable';
import ProjectForm from './ProjectForm';
import ProjectPreview from './ProjectPreview';
import SellerDeliveryCenter from '../delivery/SellerDeliveryCenter';
import { getStoredOrders } from '../../services/deliveryStore';
import { BuyerMessagesPage } from '../BuyerSubPages';
import { 
  DollarSign, 
  Users, 
  Handshake, 
  Check, 
  X, 
  UploadCloud, 
  HardDrive, 
  Trash2, 
  CheckCircle, 
  CreditCard, 
  ArrowUpRight, 
  Clock, 
  FileCheck,
  MapPin,
  TrendingUp,
  BarChart2,
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  FileText,
  Lock,
  Layers,
  Globe,
  Sparkles
} from 'lucide-react';

interface SellerDashboardProps {
  onBackToMarketplace: () => void;
  onViewPublicListing?: (listing: Listing) => void;
  initialSubTab?: string;
  projectId?: string;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  onBackToMarketplace,
  onViewPublicListing,
  initialSubTab = 'overview',
  projectId
}) => {
  const [activeTab, setActiveTab] = useState<any>('dashboard');

  useEffect(() => {
    if (initialSubTab) {
      const cleanTab = initialSubTab.replace('vendor-', '');
      if (cleanTab === 'overview' || cleanTab === 'dashboard') {
        setActiveTab('dashboard');
      } else if (cleanTab === 'projects') {
        setActiveTab('my-projects');
      } else if (cleanTab === 'sell') {
        setActiveTab('add-project');
      } else if (cleanTab === 'delivery') {
        setActiveTab('deliveries');
      } else if (cleanTab === 'files-vault') {
        setActiveTab('files');
      } else {
        setActiveTab(cleanTab);
      }
      setEditingProjectId(null);
      setPreviewingProject(null);
    }
  }, [initialSubTab]);

  const [sellerProjects, setSellerProjects] = useState<SellerProject[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(projectId || null);
  const [previewingProject, setPreviewingProject] = useState<SellerProject | null>(null);
  const commissionPct = useCommissionPercentage();

  // --- INTERACTIVE SUB-TABS EXTRA DATA STATES ---
  // Offers List State
  const [offers, setOffers] = useState<any[]>([]);

  // Files List State
  const [vaultFiles, setVaultFiles] = useState<any[]>([]);

  // Earnings Summary & Withdraw requests
  const [earningsWithdrawals, setEarningsWithdrawals] = useState<any[]>([]);

  // Profile Account settings state
  const [profileForm, setProfileForm] = useState({
    name: '',
    storeName: '',
    email: '',
    location: '',
    bio: '',
    payoutAddress: '',
    notifOffer: true,
    notifStatus: true
  });

  const [savingAccount, setSavingAccount] = useState(false);
  const [showAccountToast, setShowAccountToast] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [projectToDelete, setProjectToDelete] = useState<SellerProject | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const [payoutSettings, setPayoutSettings] = useState<SellerPayoutSettings>({
    payoutMethod: 'bank',
    bankName: '',
    bankSwift: '',
    bankIban: '',
    bankAccountHolder: '',
    paypalEmail: '',
    cryptoWalletAddress: '',
    cryptoNetwork: 'ERC-20',
    updatedAt: ''
  });

  const [savingPayout, setSavingPayout] = useState(false);
  const [showPayoutToast, setShowPayoutToast] = useState(false);

  // Load seller projects from local store on mount / update
  const reloadProjects = () => {
    const email = getCurrentLoggedInEmail();
    setCurrentUserEmail(email);
    const list = getStoredSellerProjects(email);
    setSellerProjects(list);
    setPayoutSettings(getSellerPayoutSettings(email));
  };

  useEffect(() => {
    reloadProjects();
  }, []);

  // Compute counts for sidebar
  const counts = useMemo(() => {
    return {
      total: sellerProjects.length,
      pending: sellerProjects.filter((p) => p.sellerStatus === 'Pending Review').length,
      approved: sellerProjects.filter((p) => p.sellerStatus === 'Approved').length,
      drafts: sellerProjects.filter((p) => p.sellerStatus === 'Draft').length,
      sold: sellerProjects.filter((p) => p.sellerStatus === 'Sold').length,
      deliveries: getStoredOrders().length,
      offers: offers.filter(o => o.status === 'Pending').length
    };
  }, [sellerProjects, offers]);

  // Editing Project Object if any
  const projectBeingEdited = useMemo(() => {
    if (!editingProjectId) return null;
    return sellerProjects.find((p) => p.id === editingProjectId) || null;
  }, [editingProjectId, sellerProjects]);

  // Handlers
  const handleAddNewProject = () => {
    setEditingProjectId(null);
    setPreviewingProject(null);
    setActiveTab('add-project');
  };

  const handleEditProject = (id: string) => {
    setEditingProjectId(id);
    setPreviewingProject(null);
    setActiveTab('add-project');
  };

  const handlePreviewProject = (project: SellerProject) => {
    setPreviewingProject(project);
  };

  const handleDeleteProject = (id: string) => {
    const proj = sellerProjects.find(p => p.id === id);
    if (proj) {
      setProjectToDelete(proj);
    } else {
      deleteSellerProject(id, currentUserEmail);
      if (editingProjectId === id) setEditingProjectId(null);
      if (previewingProject?.id === id) setPreviewingProject(null);
      reloadProjects();
    }
  };

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      deleteSellerProject(projectToDelete.id, currentUserEmail);
      if (editingProjectId === projectToDelete.id) setEditingProjectId(null);
      if (previewingProject?.id === projectToDelete.id) setPreviewingProject(null);
      setProjectToDelete(null);
      reloadProjects();
    }
  };

  const handleDeleteAllProjects = () => {
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAllProjects = () => {
    deleteAllUserSellerProjects(currentUserEmail);
    setEditingProjectId(null);
    setPreviewingProject(null);
    setShowDeleteAllConfirm(false);
    reloadProjects();
  };

  const handleSubmissionSuccess = async (updatedProject: SellerProject) => {
    const user = await getCurrentSupabaseUser();
    if (user) {
      await saveProjectToSupabase(updatedProject, user.id);
    }
    reloadProjects();
    setEditingProjectId(null);
    setPreviewingProject(null);
    setActiveTab('my-projects');
  };

  // --- SUB-TAB ACTIONS ---
  // Accept / Counter / Decline Offer Handlers
  const handleOfferAction = (offerId: string, action: 'Approved' | 'Declined', counterPrice?: number) => {
    setOffers(prev => prev.map(o => {
      if (o.id === offerId) {
        return { 
          ...o, 
          status: action,
          amount: counterPrice || o.amount
        };
      }
      return o;
    }));
  };

  // Simulate Drag & Drop Vault Upload with active progress
  const handleSimulatedFileUpload = () => {
    if (!newFileName.trim()) return;
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          const newFile = {
            id: `fl-${Date.now()}`,
            name: newFileName.endsWith('.zip') || newFileName.endsWith('.pdf') ? newFileName : `${newFileName}.zip`,
            size: '4.8 MB',
            type: newFileName.includes('.') ? newFileName.split('.').pop()?.toUpperCase() + ' File' : 'ZIP Archive',
            uploadedAt: new Date().toISOString().split('T')[0],
            category: 'Source Code'
          };
          setVaultFiles(prevFiles => [newFile, ...prevFiles]);
          setTimeout(() => setUploadProgress(null), 1000);
          setNewFileName('');
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  // Delete Vault File
  const handleDeleteVaultFile = (fileId: string) => {
    setVaultFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Request Payout
  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawalAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > 23000) {
      setWithdrawStatus('Insufficient available balance to complete this payout.');
      return;
    }
    const newWd = {
      id: `wd-${Date.now()}`,
      amount: amt,
      method: 'Stripe Direct Payout',
      status: 'In Progress',
      date: new Date().toISOString().split('T')[0]
    };
    setEarningsWithdrawals(prev => [newWd, ...prev]);
    setWithdrawalAmount('');
    setWithdrawStatus('Withdrawal payout request submitted successfully!');
    setTimeout(() => setWithdrawStatus(null), 4000);
  };

  // Save Account profile settings
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    setTimeout(() => {
      setSavingAccount(false);
      setShowAccountToast(true);
      setTimeout(() => setShowAccountToast(false), 3000);
    }, 1000);
  };

  // Save Payout Settings handler
  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayout(true);
    setTimeout(() => {
      saveSellerPayoutSettings(currentUserEmail, payoutSettings);
      setSavingPayout(false);
      setShowPayoutToast(true);
      setTimeout(() => setShowPayoutToast(false), 3000);
    }, 800);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
      {/* Top Mobile Bar */}
      <div className="lg:hidden bg-white border border-[#E2DDD3] p-3 rounded-2xl flex items-center justify-between text-xs font-bold">
        <span className="text-[#2C2A26]">Seller Dashboard Workspace</span>
        <button
          onClick={onBackToMarketplace}
          className="text-[#8C8275] underline"
        >
          Back to Market
        </button>
      </div>

      <div className="w-full space-y-6">
        {/* Right Main Content Panel */}
        <div className="flex-1 min-w-0 w-full space-y-6">

          {/* Workspace Security & Owner Isolation Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    <span>Seller Private Workspace (System Workspace)</span>
                  </h3>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Supabase Isolated
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Active Account: <strong className="text-amber-300 font-mono">{currentUserEmail || 'Guest Workspace'}</strong> • Displays only your workspace projects. You hold exclusive permissions to manage, edit, or delete them.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold shrink-0 bg-slate-950/60 px-3.5 py-2 rounded-2xl border border-slate-700/50 text-slate-300">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Approved projects are published globally on Marketplace</span>
            </div>
          </div>

          {/* PREVIEW MODE IF ACTIVE */}
          {previewingProject ? (
            <ProjectPreview
              project={previewingProject}
              onBackToEdit={() => {
                setEditingProjectId(previewingProject.id);
                setPreviewingProject(null);
                setActiveTab('add-project');
              }}
              onSaveDraft={() => reloadProjects()}
              onSuccessSubmitted={handleSubmissionSuccess}
            />
          ) : (activeTab === 'overview' || activeTab === 'dashboard') ? (
            /* OVERVIEW DASHBOARD */
            <SellerOverview
              projects={sellerProjects}
              onAddNewProject={handleAddNewProject}
              onViewMyProjects={() => setActiveTab('my-projects')}
              onEditProject={handleEditProject}
              onPreviewProject={handlePreviewProject}
            />
          ) : activeTab === 'my-projects' ? (
            /* MY PROJECTS LIST / TABLE */
            <ProjectTable
              projects={sellerProjects}
              onAddNewProject={handleAddNewProject}
              onEditProject={handleEditProject}
              onPreviewProject={handlePreviewProject}
              onSubmitForReview={(id) => {
                const target = sellerProjects.find((p) => p.id === id);
                if (target) {
                  setEditingProjectId(target.id);
                  setActiveTab('add-project');
                }
              }}
              onDeleteProject={handleDeleteProject}
              onDeleteAllProjects={handleDeleteAllProjects}
              onViewPublicListing={(sp) => {
                if (onViewPublicListing) {
                  onViewPublicListing(toPublicListing(sp));
                }
              }}
              initialFilterStatus="All"
            />
          ) : activeTab === 'add-project' ? (
            /* ADD OR EDIT MULTI-STEP FORM WIZARD */
            <ProjectForm
              initialProject={projectBeingEdited}
              onCancel={() => {
                setEditingProjectId(null);
                setActiveTab('my-projects');
              }}
              onSuccessSubmitted={handleSubmissionSuccess}
            />
          ) : activeTab === 'deliveries' ? (
            /* SELLER DELIVERY CENTER */
            <SellerDeliveryCenter
              order={getStoredOrders()?.[0]}
              onBack={() => setActiveTab('dashboard')}
              onOrderUpdated={() => reloadProjects()}
            />
          ) : activeTab === 'sales' ? (
            /* SALES TAB - COMPLETED ACQUISITIONS */
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-5">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Closed Acquisitions & Sales Log</h2>
                  <p className="text-xs text-[#5D5A53]">Secure escrow closing, transfer protocols, and platform sales volume.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-xl shrink-0">
                    Gross Volume: $0
                  </span>
                </div>
              </div>

              {/* Sales Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-4 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Acquisitions Cleared</span>
                    <span className="text-base font-serif font-bold text-[#2C2A26] block">0 Deals</span>
                  </div>
                  <CheckCircle className="w-8 h-8 text-[#8C8275]" />
                </div>

                <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-4 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Escrow Protected</span>
                    <span className="text-base font-serif font-bold text-[#2C2A26] block">$0 Locked</span>
                  </div>
                  <Clock className="w-8 h-8 text-[#8C8275]" />
                </div>

                <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-4 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Direct Seller Payout</span>
                    <span className="text-base font-serif font-bold text-[#2C2A26] block">{commissionPct}% Fee Policy</span>
                  </div>
                  <TrendingUp className="w-8 h-8 text-[#8C8275]" />
                </div>
              </div>

              {/* Sales Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#2C2A26]">
                  <thead className="bg-[#F5F2EB] border-b border-[#E2DDD3] text-[#8C8275] font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Deal ID</th>
                      <th className="p-3">SaaS Startup Title</th>
                      <th className="p-3">Verified Buyer</th>
                      <th className="p-3">Closing Date</th>
                      <th className="p-3 text-right">Escrow Amount</th>
                      <th className="p-3 text-right">Transfer Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DDD3]">
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#8C8275] italic">
                        No closed acquisitions or sales registered yet. Use "+ Add New Project" to list a digital asset.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'buyers' ? (
            /* BUYERS & DIRECT MESSAGES TAB FOR VENDORS */
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-2 sm:p-4 shadow-sm">
              <BuyerMessagesPage userRole="VENDOR" />
            </div>
          ) : activeTab === 'offers' ? (
            /* OFFERS TAB - INCOMING OFFERS AND NEGOTIATIONS */
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div>
                <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Incoming Offers Log</h2>
                <p className="text-xs text-[#5D5A53]">Track, accept, reject, or negotiate purchase offers from verified buyer accounts.</p>
              </div>

              <div className="space-y-4">
                {offers.length === 0 ? (
                  <div className="p-8 text-center bg-[#FAF8F5] border border-[#E2DDD3] rounded-3xl text-xs text-[#8C8275] italic">
                    No active acquisition offers received yet.
                  </div>
                ) : (
                  offers.map((off) => (
                    <div key={off.id} className="p-4 border border-[#E2DDD3] rounded-2xl bg-[#FAF8F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-bold uppercase rounded border border-amber-300">Offer Pending</span>
                          <span className="text-[10px] text-[#8C8275]">{off.timestamp ? new Date(off.timestamp).toLocaleString() : 'N/A'}</span>
                        </div>
                        <h4 className="font-serif font-bold text-sm text-[#2C2A26] truncate">{off.projectTitle}</h4>
                        <div className="text-[11px] text-[#5D5A53]">
                          Proposed by <strong className="text-[#2C2A26]">{off.buyerName}</strong> ({off.buyerEmail})
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between md:justify-end">
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Offered Price</span>
                          <span className="text-lg font-serif font-bold text-emerald-800">${(off.amount || 0).toLocaleString()}</span>
                        </div>

                        {off.status === 'Pending' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOfferAction(off.id, 'Approved')}
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                              title="Accept Offer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOfferAction(off.id, 'Declined')}
                              className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                              title="Reject Offer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                            off.status === 'Approved' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-stone-100 text-stone-800 border-stone-300'
                          }`}>
                            {off.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'files' ? (
            /* FILES & VAULT TAB */
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-5">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Merchant Assets & Files Vault</h2>
                  <p className="text-xs text-[#5D5A53]">Secure repository for source code archives, metadata, database schemas, and KYC document uploads.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold rounded-xl shrink-0">
                    Vault Size: {vaultFiles.length ? (vaultFiles.length * 4.8).toFixed(1) : '0'} MB / 100 MB max
                  </span>
                </div>
              </div>

              {/* Upload Input */}
              <div className="border-2 border-dashed border-[#E2DDD3] hover:border-[#2C2A26] rounded-2xl p-6 text-center space-y-4 bg-[#FAF8F5] transition-all">
                <UploadCloud className="w-10 h-10 text-[#8C8275] mx-auto" />
                <div className="max-w-xs mx-auto space-y-2">
                  <p className="text-xs font-bold text-[#2C2A26]">Simulate Uploading New Deliverable</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. contentgenie_v1.1_clean.zip"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="flex-1 bg-white border border-[#E2DDD3] text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#2C2A26]"
                    />
                    <button
                      type="button"
                      onClick={handleSimulatedFileUpload}
                      className="px-3 py-2 bg-[#2C2A26] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shrink-0"
                    >
                      Upload
                    </button>
                  </div>
                </div>

                {uploadProgress !== null && (
                  <div className="max-w-xs mx-auto space-y-1">
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="text-[10px] text-emerald-800 font-bold">Uploading... {uploadProgress}%</span>
                  </div>
                )}
              </div>

              {/* Files list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Uploaded Secure Deliverables</h4>
                {vaultFiles.length === 0 ? (
                  <div className="p-8 border border-dashed border-[#E2DDD3] bg-[#FAF8F5] rounded-2xl text-center text-xs text-[#8C8275] italic">
                    No deliverables uploaded to secure vault yet.
                  </div>
                ) : (
                  vaultFiles.map((file) => (
                    <div key={file.id} className="p-3.5 border border-[#E2DDD3] bg-white rounded-2xl flex items-center justify-between text-xs hover:bg-[#FDFCF9]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] text-[#2C2A26] border border-[#E2DDD3] flex items-center justify-center font-bold">
                          <HardDrive className="w-4 h-4 text-[#8C8275]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#2C2A26]">{file.name}</p>
                          <p className="text-[10px] text-[#8C8275]">{file.size} • {file.type} • Uploaded {file.uploadedAt}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVaultFile(file.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 hover:text-rose-900 rounded-lg transition-all"
                        title="Delete Deliverable File"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'earnings' ? (
            /* EARNINGS TAB - PAYOUTS AND BALANCES */
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-5">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Available Earnings & Financials</h2>
                  <p className="text-xs text-[#5D5A53]">Direct payouts, escrow hold, and historical withdrawals log.</p>
                </div>
              </div>

              {/* Balances Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-4 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold text-[#8C8275] uppercase tracking-wider block">Net Revenue</span>
                  <span className="text-lg font-serif font-bold text-[#2C2A26] block">$0</span>
                </div>
                <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-4 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold text-[#8C8275] uppercase tracking-wider block">Withdrawn Amount</span>
                  <span className="text-lg font-serif font-bold text-[#2C2A26] block">$0</span>
                </div>
                <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl space-y-1 border border-emerald-800">
                  <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block">Available to Withdraw</span>
                  <span className="text-lg font-serif font-bold text-emerald-300 block">$0</span>
                </div>
                <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-4 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold text-[#8C8275] uppercase tracking-wider block">Locked in Escrow</span>
                  <span className="text-lg font-serif font-bold text-[#8C8275] block">$0</span>
                </div>
              </div>

              {/* Payout & Withdrawal Settings Management Form */}
              <form onSubmit={handleSavePayout} className="bg-[#FAF8F5] border border-[#E2DDD3] p-6 rounded-3xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-stone-700" />
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#2C2A26]">Payout & Bank Account Settings</h4>
                      <p className="text-[11px] text-[#5D5A53]">Configure how you receive funds after the 48-hour inspection period.</p>
                    </div>
                  </div>
                  {showPayoutToast && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-xl font-bold">
                      ✓ Payout settings saved!
                    </span>
                  )}
                </div>

                {/* Payout Method Tabs Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Payout Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'bank', label: 'Bank Wire (Local / International)' },
                      { id: 'paypal', label: 'PayPal' },
                      { id: 'crypto', label: 'Crypto (USDT/USDC)' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPayoutSettings({ ...payoutSettings, payoutMethod: method.id as any })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          payoutSettings.payoutMethod === method.id
                            ? 'bg-[#2C2A26] border-[#2C2A26] text-[#F5F2EB] shadow-sm'
                            : 'bg-white border-[#E2DDD3] text-[#2C2A26] hover:bg-stone-50'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Payment Fields depending on active selection */}
                <div className="bg-white border border-[#E2DDD3] p-4 rounded-2xl space-y-4">
                  {payoutSettings.payoutMethod === 'bank' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#8C8275] uppercase block">Bank Name</label>
                        <input
                          type="text"
                          value={payoutSettings.bankName || ''}
                          onChange={(e) => setPayoutSettings({ ...payoutSettings, bankName: e.target.value })}
                          placeholder="e.g. Attijariwafa Bank, BCP..."
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs p-3 focus:outline-none focus:border-[#2C2A26] font-semibold text-[#2C2A26]"
                          required={payoutSettings.payoutMethod === 'bank'}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#8C8275] uppercase block">Account Holder Name</label>
                        <input
                          type="text"
                          value={payoutSettings.bankAccountHolder || ''}
                          onChange={(e) => setPayoutSettings({ ...payoutSettings, bankAccountHolder: e.target.value })}
                          placeholder="Full Legal Name"
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs p-3 focus:outline-none focus:border-[#2C2A26] font-semibold text-[#2C2A26]"
                          required={payoutSettings.payoutMethod === 'bank'}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#8C8275] uppercase block">SWIFT / BIC Code</label>
                        <input
                          type="text"
                          value={payoutSettings.bankSwift || ''}
                          onChange={(e) => setPayoutSettings({ ...payoutSettings, bankSwift: e.target.value })}
                          placeholder="e.g. BCMA MA RXXXX"
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs p-3 font-mono focus:outline-none focus:border-[#2C2A26]"
                          required={payoutSettings.payoutMethod === 'bank'}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#8C8275] uppercase block">IBAN Number</label>
                        <input
                          type="text"
                          value={payoutSettings.bankIban || ''}
                          onChange={(e) => setPayoutSettings({ ...payoutSettings, bankIban: e.target.value })}
                          placeholder="MA64 0071..."
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs p-3 font-mono focus:outline-none focus:border-[#2C2A26]"
                          required={payoutSettings.payoutMethod === 'bank'}
                        />
                      </div>
                    </div>
                  )}

                  {payoutSettings.payoutMethod === 'paypal' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8C8275] uppercase block">PayPal Email Address</label>
                      <input
                        type="email"
                        value={payoutSettings.paypalEmail || ''}
                        onChange={(e) => setPayoutSettings({ ...payoutSettings, paypalEmail: e.target.value })}
                        placeholder="paypal@yourstore.com"
                        className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs p-3 focus:outline-none focus:border-[#2C2A26] font-semibold text-[#2C2A26]"
                        required={payoutSettings.payoutMethod === 'paypal'}
                      />
                    </div>
                  )}

                  {payoutSettings.payoutMethod === 'crypto' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#8C8275] uppercase block">Wallet Address (USDT / USDC)</label>
                        <input
                          type="text"
                          value={payoutSettings.cryptoWalletAddress || ''}
                          onChange={(e) => setPayoutSettings({ ...payoutSettings, cryptoWalletAddress: e.target.value })}
                          placeholder="e.g. 0x71C... or T..."
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs p-3 font-mono focus:outline-none focus:border-[#2C2A26]"
                          required={payoutSettings.payoutMethod === 'crypto'}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#8C8275] uppercase block">Network Protocol</label>
                        <select
                          value={payoutSettings.cryptoNetwork || 'ERC-20'}
                          onChange={(e) => setPayoutSettings({ ...payoutSettings, cryptoNetwork: e.target.value })}
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs p-3 focus:outline-none focus:border-[#2C2A26] font-bold text-[#2C2A26]"
                        >
                          <option value="TRC-20">TRON (TRC-20) - Low Fees</option>
                          <option value="ERC-20">Ethereum (ERC-20)</option>
                          <option value="Polygon">Polygon (USDT/USDC)</option>
                          <option value="Solana">Solana Network</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-[10px] text-[#8C8275]">
                    ✓ Reminder: These settings will be automatically used to transfer your payouts after the 48-hour inspection window.
                  </p>
                  <button
                    type="submit"
                    disabled={savingPayout}
                    className="px-6 py-2.5 bg-[#2C2A26] hover:bg-black disabled:opacity-50 text-[#F5F2EB] text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    {savingPayout ? 'Saving...' : 'Save Payout Settings'}
                  </button>
                </div>
              </form>

              {/* Optional: Payout / Withdrawal Request Simulator */}
              <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-5 rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4.5 h-4.5 text-stone-700" />
                  <h4 className="font-serif font-bold text-sm text-[#2C2A26]">Request Custom Payout Withdrawal</h4>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                  <input
                    type="number"
                    placeholder="Enter withdrawal amount..."
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="flex-1 bg-white border border-[#E2DDD3] text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-stone-700 font-semibold text-[#2C2A26]"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const amt = parseFloat(withdrawalAmount);
                      if (isNaN(amt) || amt <= 0) return;
                      const newWd = {
                        id: `wd-${Date.now().toString().slice(-5)}`,
                        amount: amt,
                        method: payoutSettings.payoutMethod === 'bank' ? 'Bank Wire Payout' : payoutSettings.payoutMethod === 'crypto' ? 'Crypto Transfer' : 'PayPal Payout',
                        status: 'In Progress',
                        date: new Date().toISOString().split('T')[0]
                      };
                      setEarningsWithdrawals(prev => [newWd, ...prev]);
                      setWithdrawalAmount('');
                      setWithdrawStatus('Withdrawal request submitted successfully! It will be reviewed and processed.');
                      setTimeout(() => setWithdrawStatus(null), 4000);
                    }}
                    className="px-4 py-2.5 bg-stone-700 hover:bg-black text-[#F5F2EB] text-xs font-bold rounded-xl transition-all"
                  >
                    Submit Request
                  </button>
                </div>
                {withdrawStatus && (
                  <p className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 p-2 rounded-xl inline-block">
                    {withdrawStatus}
                  </p>
                )}
              </div>

              {/* Withdrawals Log */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Recent Payout Transactions</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#2C2A26]">
                    <thead className="bg-[#F5F2EB] border-b border-[#E2DDD3] text-[#8C8275] font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Reference ID</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2DDD3]">
                      {earningsWithdrawals.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-[#8C8275] italic">
                            No payout transactions requested yet.
                          </td>
                        </tr>
                      ) : (
                        earningsWithdrawals.map((wd) => (
                          <tr key={wd.id} className="hover:bg-[#FDFCF9]">
                            <td className="p-3 font-mono font-bold">{wd.id}</td>
                            <td className="p-3">{wd.method}</td>
                            <td className="p-3">{wd.date}</td>
                            <td className="p-3 text-right font-bold">${(wd.amount || 0).toLocaleString()}</td>
                            <td className="p-3 text-right">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                wd.status === 'Completed' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}>
                                {wd.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'reports' ? (
            /* REPORTS TAB - VISUAL TRAFFIC STATS */
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-5">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Traffic & Performance Analytics</h2>
                  <p className="text-xs text-[#5D5A53]">Unique page views, marketplace visibility, and conversions rate.</p>
                </div>
              </div>

              {/* SVG Micro-charts and Graphs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-[#E2DDD3] bg-[#FAF8F5] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#2C2A26]">Unique Views History (Past 6 Months)</h4>
                    <span className="text-[11px] font-bold text-[#8C8275]">0 total views</span>
                  </div>
                  {/* SVG Chart */}
                  <svg viewBox="0 0 300 120" className="w-full h-32 overflow-visible">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2C2A26" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#2C2A26" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Gridlines */}
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#E2DDD3" strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="300" y2="60" stroke="#E2DDD3" strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="0" y1="100" x2="300" y2="100" stroke="#E2DDD3" strokeWidth="0.5" />
                    
                    {/* Area - Flat */}
                    <path
                      d="M 10 100 L 290 100 L 290 100 L 10 100 Z"
                      fill="url(#chartGradient)"
                    />
                    {/* Line - Flat */}
                    <path
                      d="M 10 100 L 290 100"
                      fill="none"
                      stroke="#8C8275"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="p-4 border border-[#E2DDD3] bg-[#FAF8F5] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#2C2A26]">Monthly Conversion Rate</h4>
                    <span className="text-[11px] font-bold text-stone-600">0% average</span>
                  </div>
                  {/* SVG Bar Chart - Zeroed */}
                  <svg viewBox="0 0 300 120" className="w-full h-32 overflow-visible">
                    <line x1="0" y1="100" x2="300" y2="100" stroke="#E2DDD3" strokeWidth="1" />
                    
                    {/* Bars - Zeroed */}
                    <rect x="20" y="98" width="24" height="2" rx="1" fill="#E2DDD3" />
                    <rect x="80" y="98" width="24" height="2" rx="1" fill="#E2DDD3" />
                    <rect x="140" y="98" width="24" height="2" rx="1" fill="#E2DDD3" />
                    <rect x="200" y="98" width="24" height="2" rx="1" fill="#E2DDD3" />
                    <rect x="260" y="98" width="24" height="2" rx="1" fill="#E2DDD3" />

                    {/* Labels */}
                    <text x="20" y="115" fontSize="8" fill="#8C8275" fontWeight="bold">May</text>
                    <text x="80" y="115" fontSize="8" fill="#8C8275" fontWeight="bold">Jun</text>
                    <text x="140" y="115" fontSize="8" fill="#8C8275" fontWeight="bold">Jul</text>
                    <text x="200" y="115" fontSize="8" fill="#8C8275" fontWeight="bold">Aug</text>
                    <text x="260" y="115" fontSize="8" fill="#8C8275" fontWeight="bold">Sep</text>
                  </svg>
                </div>
              </div>
            </div>
          ) : activeTab === 'account' ? (
            /* ACCOUNT SETTINGS TAB */
            <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="border-b border-[#E2DDD3] pb-4">
                <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Merchant Account Settings</h2>
                <p className="text-xs text-[#5D5A53]">Manage store credentials, public agency profile, bio, and billing addresses.</p>
              </div>

              {showAccountToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Profile changes successfully synchronized with cloud servers!</span>
                </div>
              )}

              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Full Legal Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs px-3.5 py-3 focus:outline-none focus:border-[#2C2A26] font-semibold text-[#2C2A26]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Store / Agency Name</label>
                    <input
                      type="text"
                      value={profileForm.storeName}
                      onChange={(e) => setProfileForm({ ...profileForm, storeName: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs px-3.5 py-3 focus:outline-none focus:border-[#2C2A26] font-semibold text-[#2C2A26]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Contact Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs px-3.5 py-3 focus:outline-none focus:border-[#2C2A26] font-semibold text-[#2C2A26]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Business Headquarters Location</label>
                    <input
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs px-3.5 py-3 focus:outline-none focus:border-[#2C2A26] font-semibold text-[#2C2A26]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 bg-[#FAF8F5] border border-[#E2DDD3] p-4 rounded-2xl">
                  <label className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Payout Destination Settings</label>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-[#2C2A26] font-medium leading-relaxed">
                      🏦 Payout destination details (Bank Wire, PayPal, Crypto) are fully managed through the dedicated <strong>Earnings</strong> tab.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('earnings')}
                      className="px-4 py-2 bg-[#2C2A26] hover:bg-black text-[#F5F2EB] text-xs font-bold rounded-xl shrink-0 transition-all shadow-xs"
                    >
                      Configure Payouts
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">Merchant Store Bio</label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl text-xs p-3.5 focus:outline-none focus:border-[#2C2A26] font-semibold text-[#2C2A26]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingAccount}
                    className="px-5 py-2.5 bg-[#2C2A26] hover:bg-black disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    {savingAccount ? 'Saving Changes...' : 'Save Profile Settings'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>

      {/* Delete Single Project Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-2xl">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Delete Project?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900 font-bold">"{projectToDelete.title}"</strong> from your workspace?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Project</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Workspace Projects Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-2xl">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Delete All Workspace Projects?</h3>
                <p className="text-xs text-slate-500">This action will clear all your projects</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete all <strong className="text-slate-900 font-bold">{sellerProjects.length} projects</strong> in your personal workspace?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAllProjects}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All Projects</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
