import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileCheck, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  ExternalLink, 
  Video, 
  X, 
  ShieldCheck, 
  RefreshCw,
  History,
  AlertCircle,
  Trash2,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText
} from 'lucide-react';
import { SellerProject } from '../../types';
import { 
  fetchAdminProjects, 
  fetchAuditLogs, 
  AuditLogItem 
} from '../../services/adminService';
import { toPublicListing, deleteAllTestProjectsGlobal } from '../../services/sellerStore';
import ProjectStatusBadge from '../seller/ProjectStatusBadge';
import ApprovalActions from './ApprovalActions';
import AdminReviewChecklist from './AdminReviewChecklist';
import ProjectDetails from '../ProjectDetails';
import { ProjectReviewCard } from './ProjectReviewCard';

interface ProjectReviewManagementProps {
  onRefreshStats?: () => void;
}

export const ProjectReviewManagement: React.FC<ProjectReviewManagementProps> = ({
  onRefreshStats
}) => {
  const [projects, setProjects] = useState<SellerProject[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View & Pagination States
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending Review' | 'Approved' | 'Rejected'>('Pending Review');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price_high' | 'price_low' | 'mrr_high'>('newest');

  // Audit Modal State
  const [selectedProject, setSelectedProject] = useState<SellerProject | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projs, logs] = await Promise.all([
        fetchAdminProjects(),
        fetchAuditLogs()
      ]);
      setProjects(projs);
      setAuditLogs(logs);
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.warn('Error loading admin review data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleProjectsUpdate = () => {
      loadData();
    };
    window.addEventListener('aiwebcrafter_projects_updated', handleProjectsUpdate);
    return () => {
      window.removeEventListener('aiwebcrafter_projects_updated', handleProjectsUpdate);
    };
  }, []);

  // Filter & Sort Logic
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      // Status Filter
      if (statusFilter !== 'All' && proj.sellerStatus !== statusFilter) {
        return false;
      }

      // Category Filter
      if (categoryFilter !== 'All' && proj.category !== categoryFilter) {
        return false;
      }

      // Search Query Match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = proj.title?.toLowerCase().includes(q);
        const matchesTagline = proj.tagline?.toLowerCase().includes(q);
        const matchesSeller = proj.seller?.name?.toLowerCase().includes(q) || (proj.seller as any)?.email?.toLowerCase().includes(q) || proj.ownerEmail?.toLowerCase().includes(q);
        const matchesCategory = proj.category?.toLowerCase().includes(q);
        const matchesPlatform = proj.platform?.toLowerCase().includes(q);
        const matchesId = proj.id?.toLowerCase().includes(q);

        if (!matchesTitle && !matchesTagline && !matchesSeller && !matchesCategory && !matchesPlatform && !matchesId) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_high') {
        return (b.askingPrice || 0) - (a.askingPrice || 0);
      }
      if (sortBy === 'price_low') {
        return (a.askingPrice || 0) - (b.askingPrice || 0);
      }
      if (sortBy === 'mrr_high') {
        return (b.monthlyRevenue || 0) - (a.monthlyRevenue || 0);
      }
      // newest
      const dateA = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [projects, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, sortBy, itemsPerPage]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage) || 1;
  const paginatedProjects = useMemo(() => {
    if (itemsPerPage >= 9999) return filteredProjects;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage, itemsPerPage]);

  // Counts
  const pendingCount = projects.filter((p) => p.sellerStatus === 'Pending Review').length;
  const approvedCount = projects.filter((p) => p.sellerStatus === 'Approved').length;
  const rejectedCount = projects.filter((p) => p.sellerStatus === 'Rejected').length;

  const handleActionComplete = (updatedProj: SellerProject & { isDeleted?: boolean }) => {
    if (updatedProj.isDeleted) {
      setProjects((prev) => prev.filter((p) => p.id !== updatedProj.id));
    } else {
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProj.id ? updatedProj : p))
      );
    }
    // Reload audit logs & stats
    fetchAuditLogs().then(setAuditLogs);
    if (onRefreshStats) onRefreshStats();
  };

  const handleDeleteAllTestProjects = async () => {
    setIsLoading(true);
    try {
      await deleteAllTestProjectsGlobal();
      setProjects([]);
      if (onRefreshStats) onRefreshStats();
    } catch (e) {
      console.warn('Error purging all projects:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Status Counters */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-200 text-amber-950 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  Admin Hub
                </span>
                <span className="text-xs text-[#8C8275]">
                  {projects.length} Total Projects In System
                </span>
              </div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2C2A26] mt-0.5">
                Projects Management & Approvals
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <button
              type="button"
              onClick={handleDeleteAllTestProjects}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              title="Purge All Test Projects"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Purge Test Projects</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="px-3.5 py-2 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] border border-[#E2DDD3] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Filter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setStatusFilter('Pending Review')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
              statusFilter === 'Pending Review'
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                : 'bg-[#FDFCF9] text-[#2C2A26] border-[#E2DDD3] hover:bg-[#F5F2EB]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-bold uppercase ${statusFilter === 'Pending Review' ? 'text-amber-100' : 'text-[#8C8275]'}`}>
                Pending Review
              </span>
              <Clock className={`w-3.5 h-3.5 ${statusFilter === 'Pending Review' ? 'text-amber-100' : 'text-amber-600'}`} />
            </div>
            <span className="font-serif font-bold text-xl sm:text-2xl block">
              {pendingCount}
            </span>
            <span className={`text-[10px] ${statusFilter === 'Pending Review' ? 'text-amber-100' : 'text-[#5D5A53]'}`}>
              Awaiting Audit
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Approved')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              statusFilter === 'Approved'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm ring-2 ring-emerald-300'
                : 'bg-[#FDFCF9] text-[#2C2A26] border-[#E2DDD3] hover:bg-[#F5F2EB]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-bold uppercase ${statusFilter === 'Approved' ? 'text-emerald-200' : 'text-[#8C8275]'}`}>
                Approved & Live
              </span>
              <CheckCircle2 className={`w-3.5 h-3.5 ${statusFilter === 'Approved' ? 'text-emerald-200' : 'text-emerald-600'}`} />
            </div>
            <span className="font-serif font-bold text-xl sm:text-2xl block">
              {approvedCount}
            </span>
            <span className={`text-[10px] ${statusFilter === 'Approved' ? 'text-emerald-200' : 'text-[#5D5A53]'}`}>
              In Marketplace
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Rejected')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              statusFilter === 'Rejected'
                ? 'bg-red-700 text-white border-red-800 shadow-sm ring-2 ring-red-300'
                : 'bg-[#FDFCF9] text-[#2C2A26] border-[#E2DDD3] hover:bg-[#F5F2EB]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-bold uppercase ${statusFilter === 'Rejected' ? 'text-red-200' : 'text-[#8C8275]'}`}>
                Rejected
              </span>
              <XCircle className={`w-3.5 h-3.5 ${statusFilter === 'Rejected' ? 'text-red-200' : 'text-red-600'}`} />
            </div>
            <span className="font-serif font-bold text-xl sm:text-2xl block">
              {rejectedCount}
            </span>
            <span className={`text-[10px] ${statusFilter === 'Rejected' ? 'text-red-200' : 'text-[#5D5A53]'}`}>
              Requires revision
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              statusFilter === 'All'
                ? 'bg-[#2C2A26] text-white border-black shadow-sm ring-2 ring-gray-400'
                : 'bg-[#FDFCF9] text-[#2C2A26] border-[#E2DDD3] hover:bg-[#F5F2EB]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-bold uppercase ${statusFilter === 'All' ? 'text-gray-300' : 'text-[#8C8275]'}`}>
                All Projects
              </span>
              <FileCheck className={`w-3.5 h-3.5 ${statusFilter === 'All' ? 'text-amber-300' : 'text-[#8C8275]'}`} />
            </div>
            <span className="font-serif font-bold text-xl sm:text-2xl block">
              {projects.length}
            </span>
            <span className={`text-[10px] ${statusFilter === 'All' ? 'text-gray-300' : 'text-[#5D5A53]'}`}>
              Total Listings
            </span>
          </button>
        </div>
      </div>

      {/* Search, Filter & View Mode Toolbar */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-3.5 sm:p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8C8275] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Quick search project title, seller, ID, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] placeholder-[#8C8275] text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-amber-600 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8275] hover:text-[#2C2A26]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters, Sorting & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-xs font-bold rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-600 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="SaaS">SaaS</option>
            <option value="AI Tools">AI Tools</option>
            <option value="Shopify">Shopify</option>
            <option value="Mobile Apps">Mobile Apps</option>
            <option value="Content">Content & Blogs</option>
            <option value="Agency">Agency</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-xs font-bold rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-600 cursor-pointer"
          >
            <option value="newest">Sort: Newest</option>
            <option value="price_high">Sort: Price (High-Low)</option>
            <option value="price_low">Sort: Price (Low-High)</option>
            <option value="mrr_high">Sort: MRR (High-Low)</option>
          </select>

          {/* Items Per Page */}
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-xs font-bold rounded-xl px-2 py-2 focus:outline-none focus:border-amber-600 cursor-pointer"
            title="Projects per page"
          >
            <option value={10}>10 / page</option>
            <option value={15}>15 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={9999}>All</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#F5F2EB] p-1 rounded-xl border border-[#E2DDD3] ml-auto lg:ml-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-white text-[#2C2A26] shadow-xs'
                  : 'text-[#8C8275] hover:text-[#2C2A26]'
              }`}
              title="Compact Table List (Fast Scanning)"
            >
              <LayoutList className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'cards'
                  ? 'bg-white text-[#2C2A26] shadow-xs'
                  : 'text-[#8C8275] hover:text-[#2C2A26]'
              }`}
              title="Compact Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects List or Table */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-[#E2DDD3] rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 bg-[#F5F2EB] text-[#8C8275] rounded-2xl flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
            No projects found matching filter criteria
          </h3>
          <p className="text-xs text-[#5D5A53] max-w-md mx-auto">
            Try switching status tabs, selecting all categories, or clearing search keywords.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('All');
              setSearchQuery('');
              setCategoryFilter('All');
            }}
            className="px-4 py-2 bg-[#2C2A26] text-white text-xs font-bold rounded-xl hover:bg-black transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* COMPACT HIGH-DENSITY TABLE VIEW */
        <div className="bg-white border border-[#E2DDD3] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2DDD3] bg-[#FDFCF9] text-[#8C8275] font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-3">Category / Tech</th>
                  <th className="py-3 px-3">Financials</th>
                  <th className="py-3 px-3">Seller</th>
                  <th className="py-3 px-3">Files / Audit</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD3]">
                {paginatedProjects.map((project) => {
                  const isRowExpanded = expandedRowId === project.id;
                  return (
                    <React.Fragment key={project.id}>
                      <tr 
                        className={`hover:bg-[#FAF8F5] transition-colors ${
                          project.sellerStatus === 'Pending Review' ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* Project Title & Image */}
                        <td className="py-2.5 px-4 min-w-[220px]">
                          <div className="flex items-center gap-3">
                            <img
                              src={project.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300'}
                              alt={project.title}
                              className="w-10 h-10 rounded-xl object-cover border border-[#E2DDD3] shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-[#2C2A26] block truncate hover:text-amber-900 cursor-pointer"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setShowAuditModal(true);
                                }}
                              >
                                {project.title || 'Untitled'}
                              </span>
                              <span className="text-[11px] text-[#8C8275] truncate block">
                                {project.tagline || 'No tagline'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category & Tech */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 bg-[#EAE5D9] text-[#2C2A26] rounded text-[10px] font-bold uppercase inline-block">
                              {project.category || 'SaaS'}
                            </span>
                            {project.platform && (
                              <span className="text-[10px] text-[#8C8275] block font-mono">
                                {project.platform}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Financials */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="font-serif font-bold text-xs text-[#2C2A26] block">
                              {formatCurrency(project.askingPrice)}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold block">
                              +{formatCurrency(project.monthlyRevenue)}/mo
                            </span>
                          </div>
                        </td>

                        {/* Seller */}
                        <td className="py-2.5 px-3 min-w-[140px]">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-[#2C2A26] block truncate">
                              {project.seller?.name || 'Seller'}
                            </span>
                            <span className="text-[10px] text-[#8C8275] block truncate font-mono">
                              {project.ownerEmail || project.seller?.email || 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Files & Audit */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-[#F5F2EB] border border-[#E2DDD3] text-[#5D5A53] rounded text-[10px] font-bold">
                              {project.secureFiles?.length || 0} Files
                            </span>
                            {project.demoUrl && (
                              <a
                                href={project.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-amber-800 hover:bg-amber-100 rounded"
                                title="Live Demo"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <ProjectStatusBadge status={project.sellerStatus} />
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProject(project);
                                setShowAuditModal(true);
                              }}
                              className="px-2.5 py-1 bg-[#F5F2EB] hover:bg-[#EAE5D9] text-[#2C2A26] border border-[#E2DDD3] rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Full Audit Inspection"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-700" />
                              <span>Audit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setExpandedRowId(isRowExpanded ? null : project.id)}
                              className="p-1 hover:bg-[#F5F2EB] rounded-lg text-[#8C8275] transition-all"
                              title={isRowExpanded ? "Collapse Row" : "Quick Expand"}
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isRowExpanded ? 'rotate-180 text-amber-800' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row Accordion */}
                      {isRowExpanded && (
                        <tr>
                          <td colSpan={7} className="p-4 bg-[#FDFCF9] border-b border-[#E2DDD3]">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-2">
                                <span className="font-bold text-xs text-[#2C2A26]">
                                  Quick Decision & Files for {project.title}
                                </span>
                                <span className="text-[11px] text-[#8C8275]">
                                  ID: {project.id}
                                </span>
                              </div>

                              <ApprovalActions
                                project={project}
                                onActionComplete={handleActionComplete}
                                layout="horizontal"
                              />

                              <p className="text-xs text-[#5D5A53] leading-relaxed">
                                {project.description || 'No description provided.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* COMPACT CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {paginatedProjects.map((project) => (
            <ProjectReviewCard
              key={project.id}
              project={project}
              onActionComplete={handleActionComplete}
              compact={true}
            />
          ))}
        </div>
      )}

      {/* Pagination Footer Controls */}
      {filteredProjects.length > 0 && (
        <div className="bg-white border border-[#E2DDD3] rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[#8C8275] font-medium">
            Showing <strong className="text-[#2C2A26]">{Math.min(filteredProjects.length, (currentPage - 1) * itemsPerPage + 1)}</strong> to{' '}
            <strong className="text-[#2C2A26]">{Math.min(filteredProjects.length, currentPage * itemsPerPage)}</strong> of{' '}
            <strong className="text-[#2C2A26]">{filteredProjects.length}</strong> projects
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-[#FDFCF9] hover:bg-[#F5F2EB] text-[#2C2A26] border border-[#E2DDD3] rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((pageNum, idx, arr) => (
                    <React.Fragment key={pageNum}>
                      {idx > 0 && pageNum - arr[idx - 1] > 1 && (
                        <span className="text-xs text-[#8C8275] px-1">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                          currentPage === pageNum
                            ? 'bg-[#2C2A26] text-white shadow-xs'
                            : 'bg-[#FDFCF9] hover:bg-[#F5F2EB] text-[#2C2A26] border border-[#E2DDD3]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-[#FDFCF9] hover:bg-[#F5F2EB] text-[#2C2A26] border border-[#E2DDD3] rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* FULL INSPECTION MODAL */}
      {showAuditModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-[#F5F2EB] rounded-3xl border border-[#E2DDD3] max-w-5xl w-full max-h-[94vh] overflow-y-auto p-4 sm:p-6 space-y-6 shadow-2xl relative animate-scale-up">
            {/* Modal Top Bar */}
            <div className="sticky top-0 z-30 bg-[#2C2A26] text-[#F5F2EB] p-4 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-amber-300">
                      Super Admin Full Audit
                    </span>
                    <ProjectStatusBadge status={selectedProject.sellerStatus} />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-white truncate max-w-md">
                    {selectedProject.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAuditModal(false);
                  setSelectedProject(null);
                }}
                className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Decision Action Controls in Modal */}
            <div className="p-4 bg-white rounded-2xl border border-[#E2DDD3] shadow-sm space-y-2">
              <h4 className="font-serif font-bold text-sm text-[#2C2A26]">
                Review Decision for {selectedProject.title}:
              </h4>
              <ApprovalActions
                project={selectedProject}
                onActionComplete={(updated) => {
                  handleActionComplete(updated);
                  setSelectedProject(updated);
                }}
              />
            </div>

            {/* Admin Audit Checklist */}
            <AdminReviewChecklist project={selectedProject} />

            {/* Live Buyer View Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-base text-[#2C2A26] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-800" />
                  <span>Buyer Experience Live Preview</span>
                </h4>
                <span className="text-xs text-[#8C8275]">
                  Exact rendering shown in Marketplace
                </span>
              </div>

              <div className="bg-white rounded-3xl border border-[#E2DDD3] overflow-hidden shadow-sm">
                <ProjectDetails
                  listing={toPublicListing(selectedProject)}
                  onBack={() => {}}
                  isSaved={false}
                  onToggleSave={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT / ACTIVITY LOG HISTORY */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#F5F2EB] text-[#2C2A26] rounded-xl flex items-center justify-center">
              <History className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#2C2A26]">
                Admin Audit & Activity Log
              </h3>
              <p className="text-xs text-[#5D5A53]">
                Server-authenticated trail of all project state changes
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 bg-[#EAE5D9] text-[#2C2A26] rounded-lg text-xs font-bold">
            {auditLogs.length} Records Logged
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-[#8C8275] italic text-center py-4">
            No audit log records found yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2DDD3] bg-[#FDFCF9] text-[#8C8275] font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Admin</th>
                  <th className="py-2.5 px-3">Project Title</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Transition</th>
                  <th className="py-2.5 px-3">Notes / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD3]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FDFCF9] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#5D5A53] whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#2C2A26] whitespace-nowrap">
                      {log.adminUser}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#2C2A26]">
                      {log.projectTitle}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          log.action === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-900 border border-red-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#5D5A53] whitespace-nowrap">
                      <span className="line-through mr-1 text-[#8C8275]">{log.previousStatus}</span>
                      <span>→</span>
                      <strong className="ml-1 text-[#2C2A26]">{log.newStatus}</strong>
                    </td>
                    <td className="py-2.5 px-3 text-[#5D5A53] max-w-xs truncate">
                      {log.reason ? (
                        <span className="text-red-900 italic">"{log.reason}"</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Approved & Published</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectReviewManagement;
