import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  ExternalLink, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Edit3, 
  Trash2, 
  Calendar, 
  User, 
  Layers, 
  Sparkles, 
  Send,
  MessageSquare,
  CheckSquare,
  ChevronRight,
  ShieldCheck,
  Building,
  AlertTriangle
} from 'lucide-react';
import { 
  OnDemandRequest, 
  CustomRequestStatus, 
  getCustomRequests, 
  fetchCustomRequestsFromServer,
  updateCustomRequest, 
  deleteCustomRequest 
} from '../../services/onDemandService';

export const AdminCustomRequestsManagement: React.FC = () => {
  const [requests, setRequests] = useState<OnDemandRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<OnDemandRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<OnDemandRequest | null>(null);

  // Edit / Action form states for modal
  const [editStatus, setEditStatus] = useState<CustomRequestStatus>('PENDING_REVIEW');
  const [editQuote, setEditQuote] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editEngineer, setEditEngineer] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const loadData = () => {
    const list = getCustomRequests();
    setRequests(list);
    fetchCustomRequestsFromServer().then(remoteList => {
      if (remoteList && remoteList.length > 0) {
        setRequests(remoteList);
      }
    });
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('aiwebcrafter_custom_requests_updated', handleUpdate);
    window.addEventListener('aiwebcrafter_custom_request_created', handleUpdate);
    window.addEventListener('focus', loadData);

    const interval = setInterval(() => {
      loadData();
    }, 2000);

    return () => {
      window.removeEventListener('aiwebcrafter_custom_requests_updated', handleUpdate);
      window.removeEventListener('aiwebcrafter_custom_request_created', handleUpdate);
      window.removeEventListener('focus', loadData);
      clearInterval(interval);
    };
  }, []);

  const handleOpenDetails = (req: OnDemandRequest) => {
    setSelectedRequest(req);
    setEditStatus(req.status);
    setEditQuote(req.quotedPrice ? req.quotedPrice.toString() : '');
    setEditNotes(req.adminNotes || '');
    setEditEngineer(req.assignedEngineer || '');
    setSaveSuccessMsg(false);
  };

  const handleSaveModalChanges = () => {
    if (!selectedRequest) return;
    const numQuote = editQuote ? parseFloat(editQuote) : undefined;
    const updatedList = updateCustomRequest(selectedRequest.id, {
      status: editStatus,
      quotedPrice: isNaN(numQuote as number) ? undefined : numQuote,
      adminNotes: editNotes,
      assignedEngineer: editEngineer
    });
    setRequests(updatedList);
    const refreshed = updatedList.find(r => r.id === selectedRequest.id) || null;
    setSelectedRequest(refreshed);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const triggerDeleteConfirm = (req: OnDemandRequest) => {
    setRequestToDelete(req);
  };

  const confirmDeleteAction = () => {
    if (!requestToDelete) return;
    const updated = deleteCustomRequest(requestToDelete.id);
    setRequests(updated);
    if (selectedRequest?.id === requestToDelete.id) {
      setSelectedRequest(null);
    }
    setRequestToDelete(null);
  };

  const getStatusBadge = (status: CustomRequestStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return {
          label: 'Pending Review',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Clock
        };
      case 'QUOTE_SENT':
        return {
          label: 'Quote Sent',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: Send
        };
      case 'ACCEPTED':
        return {
          label: 'Quote Accepted',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: CheckCircle2
        };
      case 'IN_DEVELOPMENT':
        return {
          label: 'In Development',
          bg: 'bg-purple-100 text-purple-900 border-purple-300',
          icon: Sparkles
        };
      case 'DELIVERED':
        return {
          label: 'Delivered & Handed Over',
          bg: 'bg-emerald-700 text-white border-emerald-800',
          icon: ShieldCheck
        };
      case 'REJECTED':
        return {
          label: 'Declined / Cancelled',
          bg: 'bg-red-100 text-red-900 border-red-300',
          icon: AlertCircle
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: Clock
        };
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    const matchesSearch = 
      req.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.buyerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.projectType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'PENDING_REVIEW').length;
  const inDevCount = requests.filter(r => r.status === 'IN_DEVELOPMENT').length;
  const totalQuotedValue = requests.reduce((acc, curr) => acc + (curr.quotedPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats Strip */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/10 text-amber-900 rounded-xl">
                <Wand2 className="w-5 h-5" />
              </span>
              <h2 className="font-serif font-bold text-xl text-[#2C2A26]">On-Demand Custom Build Requests</h2>
            </div>
            <p className="text-xs text-[#5D5A53] mt-1">
              Review and manage incoming custom website, Shopify, and SaaS build orders submitted by buyers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-300">
              {pendingCount} Pending Action
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-[#8C8275] block">Total Inquiries</span>
            <span className="text-xl font-bold font-serif text-[#2C2A26]">{totalCount}</span>
          </div>
          <div className="p-3.5 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-[#8C8275] block">Pending Review</span>
            <span className="text-xl font-bold font-serif text-amber-700">{pendingCount}</span>
          </div>
          <div className="p-3.5 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-[#8C8275] block">Active In Dev</span>
            <span className="text-xl font-bold font-serif text-purple-700">{inDevCount}</span>
          </div>
          <div className="p-3.5 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-[#8C8275] block">Quoted Pipeline</span>
            <span className="text-xl font-bold font-serif text-emerald-800">${totalQuotedValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by project name, buyer name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs text-[#2C2A26] placeholder-[#8C8275] focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-[#8C8275]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs font-semibold text-[#2C2A26] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="QUOTE_SENT">Quote Sent</option>
              <option value="ACCEPTED">Quote Accepted</option>
              <option value="IN_DEVELOPMENT">In Development</option>
              <option value="DELIVERED">Delivered</option>
              <option value="REJECTED">Declined</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-white border border-[#E2DDD3] rounded-3xl">
            <Wand2 className="w-10 h-10 text-[#8C8275] mx-auto" />
            <h3 className="font-serif font-bold text-lg text-[#2C2A26]">No Custom Build Requests Found</h3>
            <p className="text-xs text-[#5D5A53]">
              {searchQuery || statusFilter !== 'ALL' 
                ? 'Try adjusting your search criteria or status filter.'
                : 'Incoming client custom requests from the On-Demand form will automatically appear here.'}
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const badge = getStatusBadge(req.status);
            const BadgeIcon = badge.icon;

            return (
              <div 
                key={req.id} 
                className="bg-white border border-[#E2DDD3] hover:border-amber-400/60 rounded-3xl p-5 sm:p-6 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-[#EAE5D9] text-[#5D5A53] px-2 py-0.5 rounded-md">
                        {req.id}
                      </span>
                      <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {req.projectType}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-lg text-[#2C2A26] truncate">
                      {req.projectName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-[#8C8275] block uppercase font-bold">Client Budget</span>
                      <span className="text-xs font-bold text-[#2C2A26]">{req.budget}</span>
                    </div>
                    {req.quotedPrice ? (
                      <div className="text-right pl-3 border-l border-[#E2DDD3]">
                        <span className="text-[10px] text-emerald-800 block uppercase font-bold">Admin Quote</span>
                        <span className="text-sm font-bold font-serif text-emerald-800">${req.quotedPrice.toLocaleString()}</span>
                      </div>
                    ) : null}
                    <button
                      onClick={() => handleOpenDetails(req)}
                      className="px-4 py-2 bg-[#2C2A26] text-amber-300 hover:bg-[#3B3833] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Details</span>
                    </button>
                  </div>
                </div>

                {/* Brief description snippet */}
                <p className="text-xs text-[#5D5A53] line-clamp-2 leading-relaxed bg-[#FDFCF9] p-3 rounded-xl border border-[#E2DDD3]/60">
                  {req.description}
                </p>

                {/* Client Info & Features summary footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-[#E2DDD3]/60">
                  <div className="flex flex-wrap items-center gap-4 text-[#5D5A53]">
                    <span className="flex items-center gap-1 font-medium">
                      <User className="w-3.5 h-3.5 text-[#8C8275]" />
                      <strong>{req.buyerName}</strong>
                    </span>
                    <a 
                      href={`mailto:${req.buyerEmail}?subject=Regarding Your Custom Project Request (${req.projectName})`}
                      className="flex items-center gap-1 text-amber-800 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{req.buyerEmail}</span>
                    </a>
                    {req.buyerPhone && (
                      <a 
                        href={`tel:${req.buyerPhone}`}
                        className="flex items-center gap-1 text-[#5D5A53] hover:text-[#2C2A26]"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#8C8275]" />
                        <span>{req.buyerPhone}</span>
                      </a>
                    )}
                    <span className="flex items-center gap-1 text-[#8C8275]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{req.createdAt}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8C8275]">
                      {req.selectedFeatures.length} features selected
                    </span>
                    <button
                      onClick={() => triggerDeleteConfirm(req)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Delete Request"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL MODAL DRAWER */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF8F5] border border-[#E2DDD3] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 bg-[#2C2A26] text-[#F5F2EB] flex items-center justify-between border-b border-amber-900/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-amber-950 text-[10px] font-extrabold">
                    {selectedRequest.id}
                  </span>
                  <span className="text-xs text-amber-200 font-semibold">
                    {selectedRequest.projectType}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl text-white">
                  {selectedRequest.projectName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-all"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-[#2C2A26]">
              {/* Success Notification */}
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Request details, status, and quotes updated successfully.</span>
                </div>
              )}

              {/* Client Contact & Project Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client Details */}
                <div className="bg-white p-4 rounded-2xl border border-[#E2DDD3] space-y-2">
                  <h4 className="text-xs font-bold uppercase text-[#8C8275] tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-700" />
                    <span>Client Contact Details</span>
                  </h4>
                  <div className="space-y-1 text-xs">
                    <p><strong>Name:</strong> {selectedRequest.buyerName}</p>
                    <p className="flex items-center gap-2">
                      <strong>Email:</strong> 
                      <a href={`mailto:${selectedRequest.buyerEmail}`} className="text-amber-800 hover:underline">
                        {selectedRequest.buyerEmail}
                      </a>
                    </p>
                    {selectedRequest.buyerPhone && (
                      <p className="flex items-center gap-2">
                        <strong>Phone:</strong> 
                        <a href={`tel:${selectedRequest.buyerPhone}`} className="text-[#2C2A26] hover:underline">
                          {selectedRequest.buyerPhone}
                        </a>
                      </p>
                    )}
                    <p className="text-[11px] text-[#8C8275]"><strong>Submitted On:</strong> {selectedRequest.createdAt}</p>
                  </div>
                </div>

                {/* Scope & Budget Details */}
                <div className="bg-white p-4 rounded-2xl border border-[#E2DDD3] space-y-2">
                  <h4 className="text-xs font-bold uppercase text-[#8C8275] tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                    <span>Scope & Estimates</span>
                  </h4>
                  <div className="space-y-1 text-xs">
                    <p><strong>Estimated Budget:</strong> {selectedRequest.budget}</p>
                    <p><strong>Desired Timeline:</strong> {selectedRequest.timeline}</p>
                    {selectedRequest.referenceUrls && (
                      <div className="pt-1">
                        <strong className="block text-[11px] text-[#8C8275]">Reference Links:</strong>
                        <p className="text-xs text-amber-800 break-all">{selectedRequest.referenceUrls}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Description */}
              <div className="bg-white p-5 rounded-2xl border border-[#E2DDD3] space-y-2">
                <h4 className="text-xs font-bold uppercase text-[#8C8275] tracking-wider">
                  Full Project Specifications & Description
                </h4>
                <div className="text-xs text-[#2C2A26] leading-relaxed whitespace-pre-wrap bg-[#FDFCF9] p-4 rounded-xl border border-[#E2DDD3]/60">
                  {selectedRequest.description}
                </div>
              </div>

              {/* Selected Features Checklist */}
              <div className="bg-white p-5 rounded-2xl border border-[#E2DDD3] space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#8C8275] tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                  <span>Requested Features & Integrations ({selectedRequest.selectedFeatures.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedRequest.selectedFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-[#FDFCF9] border border-[#E2DDD3]/60 rounded-xl text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[#2C2A26] font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADMIN CONTROLS SECTION */}
              <div className="bg-amber-500/10 border border-amber-300/60 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                  <span>Admin Workflow & Project Management</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Status update */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2C2A26] block">Project Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as CustomRequestStatus)}
                      className="w-full bg-white border border-[#E2DDD3] rounded-xl p-2 text-xs font-semibold text-[#2C2A26] focus:outline-none"
                    >
                      <option value="PENDING_REVIEW">Pending Review</option>
                      <option value="QUOTE_SENT">Quote Sent</option>
                      <option value="ACCEPTED">Quote Accepted</option>
                      <option value="IN_DEVELOPMENT">In Development</option>
                      <option value="DELIVERED">Delivered & Handed Over</option>
                      <option value="REJECTED">Declined / Cancelled</option>
                    </select>
                  </div>

                  {/* Official Quote Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2C2A26] block">Official Quote ($ USD)</label>
                    <input
                      type="number"
                      placeholder="e.g. 3500"
                      value={editQuote}
                      onChange={(e) => setEditQuote(e.target.value)}
                      className="w-full bg-white border border-[#E2DDD3] rounded-xl p-2 text-xs text-[#2C2A26] focus:outline-none"
                    />
                  </div>

                  {/* Assigned Lead Engineer */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#2C2A26] block">Assigned Engineer</label>
                    <input
                      type="text"
                      placeholder="e.g. Full-Stack Lead"
                      value={editEngineer}
                      onChange={(e) => setEditEngineer(e.target.value)}
                      className="w-full bg-white border border-[#E2DDD3] rounded-xl p-2 text-xs text-[#2C2A26] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Admin Internal Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#2C2A26] block">Internal Admin Notes & Log</label>
                  <textarea
                    rows={3}
                    placeholder="Enter private milestone notes, client agreements, or payment milestones..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-white border border-[#E2DDD3] rounded-xl p-3 text-xs text-[#2C2A26] focus:outline-none"
                  />
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${selectedRequest.buyerEmail}?subject=Quote for ${selectedRequest.projectName}&body=Hi ${selectedRequest.buyerName},%0D%0A%0D%0AThank you for submitting your custom build request with AIWebCrafter.%0D%0AWe have reviewed your project requirements and are pleased to provide our proposal.%0D%0A%0D%0AQuote: $${editQuote || '3500'} USD%0D%0AEstimated Timeline: ${selectedRequest.timeline}%0D%0A%0D%0AIncluded Features:%0D%0A${selectedRequest.selectedFeatures.map(f => '- ' + f).join('%0D%0A')}%0D%0A%0D%0ABest regards,%0D%0AAIWebCrafter Engineering Team`}
                      className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-[#E2DDD3] text-[#2C2A26] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-700" />
                      <span>Email Proposal to Client</span>
                    </a>
                    <button
                      onClick={() => triggerDeleteConfirm(selectedRequest)}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Request</span>
                    </button>
                  </div>

                  <button
                    onClick={handleSaveModalChanges}
                    className="px-5 py-2 bg-[#2C2A26] hover:bg-[#3B3833] text-amber-300 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (ENGLISH) */}
      {requestToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DDD3] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
                  Delete Custom Build Request?
                </h3>
                <p className="text-xs text-[#5D5A53] leading-relaxed">
                  Are you sure you want to delete the custom build request for <strong>"{requestToDelete.projectName}"</strong> ({requestToDelete.id})? This action cannot be undone and will permanently remove all specifications and quotes.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2DDD3] flex items-center justify-end gap-2">
              <button
                onClick={() => setRequestToDelete(null)}
                className="px-4 py-2 bg-white border border-[#D6D1C7] text-[#2C2A26] hover:bg-stone-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
