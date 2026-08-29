import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserCheck, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  MapPin, 
  Star, 
  MessageSquare,
  ShieldAlert,
  Clock,
  UserX,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { AdminSeller, SellerProject } from '../../types';
import { fetchAdminSellers, updateSellerStatusServer } from '../../services/adminService';
import { getAllStoredSellerProjects } from '../../services/sellerStore';

interface AdminSellersManagementProps {
  onRefreshStats?: () => void;
}

export const AdminSellersManagement: React.FC<AdminSellersManagementProps> = ({ onRefreshStats }) => {
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'All' | 'Verified' | 'Pending' | 'Unverified'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Suspended'>('All');

  // Detail Drawer state
  const [selectedSeller, setSelectedSeller] = useState<AdminSeller | null>(null);
  const [sellerProjects, setSellerProjects] = useState<SellerProject[]>([]);

  // Suspend Dialog state
  const [suspendSellerId, setSuspendSellerId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminSellers();
      setSellers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = (seller: AdminSeller) => {
    setSelectedSeller(seller);
    // Find projects owned by this seller
    const allProjects = getAllStoredSellerProjects();
    const owns = allProjects.filter(p => p.seller?.email === seller.email || p.seller?.id === seller.id);
    setSellerProjects(owns);
  };

  const handleStatusChange = async (sellerId: string, action: 'Activate' | 'Suspend', reason?: string) => {
    setSubmittingStatus(true);
    try {
      const res = await updateSellerStatusServer(sellerId, action, reason);
      if (res.success && res.seller) {
        // Update local state
        setSellers(prev => prev.map(s => s.id === sellerId ? res.seller! : s));
        if (selectedSeller?.id === sellerId) {
          setSelectedSeller(res.seller);
        }
        if (onRefreshStats) onRefreshStats();
        // Reset suspension dialog
        setSuspendSellerId(null);
        setSuspendReason('');
      } else {
        alert(res.message || 'Action failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error executing action');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const triggerSuspend = (sellerId: string) => {
    setSuspendSellerId(sellerId);
    setSuspendReason('');
  };

  // Filtered Sellers
  const filteredSellers = sellers.filter(s => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      s.name.toLowerCase().includes(query) || 
      s.email.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query);
    
    const matchesVerification = verificationFilter === 'All' || s.verificationStatus === verificationFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

    return matchesSearch && matchesVerification && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#8C8275] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search sellers by store name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E2DDD3] text-[#2C2A26] text-xs rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#2C2A26] transition-all font-semibold placeholder-[#8C8275]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8C8275] uppercase tracking-wider">KYC Verification:</span>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as any)}
              className="bg-white border border-[#E2DDD3] text-[#2C2A26] text-xs rounded-xl py-2 px-3 font-bold focus:outline-none focus:border-[#2C2A26]"
            >
              <option value="All">All Verification</option>
              <option value="Verified">Verified Only</option>
              <option value="Pending">Pending KYC</option>
              <option value="Unverified">Unverified</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8C8275] uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-[#E2DDD3] text-[#2C2A26] text-xs rounded-xl py-2 px-3 font-bold focus:outline-none focus:border-[#2C2A26]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <button 
            onClick={loadSellers}
            className="p-2.5 bg-white border border-[#E2DDD3] hover:bg-[#F5F2EB] rounded-xl text-[#2C2A26] transition-all text-xs font-bold"
            title="Reload Sellers"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-[#E2DDD3] rounded-3xl">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#5D5A53] font-bold">Fetching verified merchant credentials...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-950 p-6 rounded-3xl text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h4 className="font-serif font-bold text-base">Database Connection Fault</h4>
          <p className="text-xs text-red-800">{error}</p>
          <button onClick={loadSellers} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
            Retry Connection
          </button>
        </div>
      ) : filteredSellers.length === 0 ? (
        <div className="bg-white border border-[#E2DDD3] rounded-3xl p-16 text-center space-y-3">
          <UserCheck className="w-10 h-10 text-[#8C8275] mx-auto opacity-50" />
          <h3 className="font-serif font-bold text-lg text-[#2C2A26]">No Sellers Found</h3>
          <p className="text-xs text-[#5D5A53]">No seller accounts match your search parameters.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2DDD3] rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2C2A26]">
              <thead className="bg-[#F5F2EB] border-b border-[#E2DDD3] text-[#8C8275] font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Seller Details</th>
                  <th className="p-4 text-center">Projects</th>
                  <th className="p-4 text-center">Approved</th>
                  <th className="p-4 text-center">Sold</th>
                  <th className="p-4 text-right">Total Sales</th>
                  <th className="p-4">KYC State</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD3]">
                {filteredSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-[#FDFCF9] transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {seller.avatar ? (
                          <img 
                            src={seller.avatar} 
                            alt={seller.name} 
                            className="w-9 h-9 rounded-full object-cover border border-[#E2DDD3]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#E2DDD3] text-[#2C2A26] flex items-center justify-center font-bold text-xs uppercase">
                            {seller.name.substring(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-[#2C2A26] truncate">{seller.name}</h4>
                          <span className="text-[11px] text-[#5D5A53] block truncate">{seller.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-[#2C2A26]">
                      {seller.projectsCount}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-[11px]">
                        {seller.approvedProjectsCount}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold text-[11px]">
                        {seller.soldProjectsCount}
                      </span>
                    </td>
                    <td className="p-4 text-right font-serif font-bold text-[#2C2A26] text-sm">
                      ${(seller.totalSales || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        seller.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        seller.verificationStatus === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        'bg-stone-50 text-stone-700 border-stone-200'
                      }`}>
                        {seller.verificationStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        seller.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                          : 'bg-rose-50 text-rose-900 border-rose-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${seller.status === 'Active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        {seller.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenProfile(seller)}
                          className="px-2.5 py-1.5 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] text-[11px] font-bold rounded-lg transition-all"
                        >
                          View Profile
                        </button>
                        
                        {seller.status === 'Active' ? (
                          <button
                            onClick={() => triggerSuspend(seller.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-900 rounded-lg transition-all"
                            title="Suspend Seller Merchant"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(seller.id, 'Activate')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-900 rounded-lg transition-all"
                            title="Reactivate Merchant"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUSPENSION REASON MODAL */}
      {suspendSellerId && (
        <div className="fixed inset-0 bg-[#2C2A26]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DDD3] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-serif font-bold text-lg text-[#2C2A26]">Suspend Seller Account</h3>
              </div>
              <button 
                onClick={() => setSuspendSellerId(null)}
                className="p-1 hover:bg-[#F5F2EB] rounded-lg text-[#8C8275]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5D5A53]">
              You are about to suspend this seller account. Suspended sellers' listings will be hidden, and they won't be able to list new projects or access earnings.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider block">
                Suspension Reason <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Specify the exact platform policy violation or reason..."
                className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs p-3 focus:outline-none focus:border-rose-600 min-h-[100px] text-[#2C2A26] font-semibold"
                required
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Failed business registration verification.', 'Listing stolen or copyrighted source code.', 'Attempting to bypass platform escrow.', 'Poor buyer communication response rates.'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSuspendReason(preset)}
                    className="px-2 py-1 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] text-[10px] rounded font-semibold"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSuspendSellerId(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(suspendSellerId, 'Suspend', suspendReason)}
                disabled={submittingStatus || suspendReason.trim().length < 3}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2"
              >
                {submittingStatus ? 'Suspending...' : 'Suspend Merchant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELLER PROFILE DETAIL MODAL */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-[#2C2A26]/80 backdrop-blur-sm z-40 flex items-center justify-end">
          <div className="bg-[#FDFCF9] border-l border-[#E2DDD3] w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto space-y-6 flex flex-col animate-in slide-in-from-right duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-600" />
                <h3 className="font-serif font-bold text-lg text-[#2C2A26]">Seller Store Details</h3>
              </div>
              <button 
                onClick={() => setSelectedSeller(null)}
                className="p-1.5 hover:bg-[#F5F2EB] rounded-xl text-[#8C8275]"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Profile Hero Card */}
            <div className="bg-white border border-[#E2DDD3] p-4 rounded-3xl flex gap-4">
              {selectedSeller.avatar ? (
                <img 
                  src={selectedSeller.avatar} 
                  alt={selectedSeller.name} 
                  className="w-16 h-16 rounded-2xl object-cover border border-[#E2DDD3] shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#E2DDD3] text-[#2C2A26] flex items-center justify-center font-bold text-xl shrink-0 uppercase">
                  {selectedSeller.name.substring(0, 2)}
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <h4 className="font-serif font-bold text-base text-[#2C2A26] flex items-center gap-2">
                  {selectedSeller.name}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    selectedSeller.status === 'Active' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}>
                    {selectedSeller.status}
                  </span>
                </h4>
                <p className="text-xs text-[#5D5A53] flex items-center gap-1.5 font-semibold">
                  <Mail className="w-3.5 h-3.5" />
                  {selectedSeller.email}
                </p>
                {selectedSeller.location && (
                  <p className="text-[11px] text-[#8C8275] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedSeller.location}
                  </p>
                )}
              </div>
            </div>

            {/* Merchant bio */}
            {selectedSeller.bio && (
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider">Merchant Biography</h5>
                <p className="text-xs text-[#2C2A26] bg-white border border-[#E2DDD3] p-3 rounded-2xl leading-relaxed italic">
                  "{selectedSeller.bio}"
                </p>
              </div>
            )}

            {/* KYC Notice if Suspended */}
            {selectedSeller.status === 'Suspended' && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Administrative Suspension Notice</span>
                </div>
                <p className="text-xs text-rose-800 font-semibold pl-6">
                  Reason: {selectedSeller.suspensionReason || 'No explicit reason specified.'}
                </p>
              </div>
            )}

            {/* Seller KPI Scores */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-3 rounded-2xl space-y-1 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-[#8C8275] uppercase tracking-wider block">Merchant Rating</span>
                <span className="text-sm font-bold text-[#2C2A26] block flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {selectedSeller.rating ? selectedSeller.rating.toFixed(1) : '5.0'} / 5.0
                </span>
              </div>
              <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-3 rounded-2xl space-y-1 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-[#8C8275] uppercase tracking-wider block">Response SLA</span>
                <span className="text-xs font-bold text-[#2C2A26] block flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  {selectedSeller.responseRate || '100%'}
                </span>
              </div>
            </div>

            {/* Performance metrics */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white border border-[#E2DDD3] p-3 rounded-2xl text-center space-y-1">
                <span className="text-[8px] font-bold text-[#8C8275] uppercase tracking-wider block">Total Submissions</span>
                <span className="text-base font-bold text-[#2C2A26] block flex items-center justify-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  {selectedSeller.projectsCount}
                </span>
              </div>
              <div className="bg-white border border-[#E2DDD3] p-3 rounded-2xl text-center space-y-1">
                <span className="text-[8px] font-bold text-[#8C8275] uppercase tracking-wider block">Approved & Live</span>
                <span className="text-base font-bold text-emerald-700 block flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {selectedSeller.approvedProjectsCount}
                </span>
              </div>
              <div className="bg-white border border-[#E2DDD3] p-3 rounded-2xl text-center space-y-1">
                <span className="text-[8px] font-bold text-[#8C8275] uppercase tracking-wider block">Sold Count</span>
                <span className="text-base font-bold text-blue-700 block flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  {selectedSeller.soldProjectsCount}
                </span>
              </div>
            </div>

            {/* Total Financial Sales block */}
            <div className="bg-[#2C2A26] text-[#F5F2EB] p-4 rounded-3xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Gross Merchandise Value (GMV)</span>
                <span className="text-xs text-amber-100/70 block">Total gross sales processed through escrow contracts.</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xl font-serif font-bold text-amber-300 block flex items-center justify-end">
                  <DollarSign className="w-5 h-5 shrink-0" />
                  {(selectedSeller.totalSales || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* List of Projects Owned by Seller */}
            <div className="space-y-2.5">
              <h5 className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider flex items-center justify-between">
                <span>Startup Portfolio Listings ({sellerProjects.length})</span>
                <span className="text-[9px] font-semibold text-purple-600">Merchant Storefront</span>
              </h5>
              {sellerProjects.length === 0 ? (
                <div className="bg-white border border-dashed border-[#E2DDD3] p-6 rounded-2xl text-center text-xs text-[#8C8275]">
                  This merchant has not listed any startup projects yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {sellerProjects.map(proj => (
                    <div key={proj.id} className="bg-white border border-[#E2DDD3] p-3 rounded-2xl flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-[#2C2A26] truncate">{proj.title}</p>
                        <p className="text-[10px] text-[#8C8275] uppercase font-semibold">{proj.category} • ${(proj.askingPrice || 0).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        proj.sellerStatus === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        proj.sellerStatus === 'Pending Review' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        'bg-stone-50 text-stone-700 border-stone-200'
                      }`}>
                        {proj.sellerStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit / Onboarding Dates */}
            <div className="space-y-2 border-t border-[#E2DDD3] pt-4">
              <h5 className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider font-sans">Merchant Verification Telemetry</h5>
              <div className="bg-[#F5F2EB] p-3 rounded-2xl space-y-1.5 text-[11px] text-[#5D5A53] font-sans">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#8C8275]" />
                  <span>Onboarded to platform: <strong className="text-[#2C2A26]">{selectedSeller.registrationDate}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>KYC Level: <strong className="text-emerald-700">{selectedSeller.verificationStatus === 'Verified' ? 'Document & Business Entity Verified' : 'Standard Unverified Profile'}</strong></span>
                </div>
              </div>
            </div>

            {/* Administrative Action Bottom Row */}
            <div className="mt-auto pt-4 border-t border-[#E2DDD3] flex items-center gap-2">
              {selectedSeller.status === 'Active' ? (
                <button
                  onClick={() => {
                    triggerSuspend(selectedSeller.id);
                  }}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <UserX className="w-4 h-4" />
                  Suspend Seller Store
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(selectedSeller.id, 'Activate')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  Reactivate Seller Store
                </button>
              )}
              <button
                onClick={() => setSelectedSeller(null)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all"
              >
                Dismiss Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
