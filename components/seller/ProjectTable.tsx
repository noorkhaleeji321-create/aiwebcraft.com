import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Eye, 
  FileEdit, 
  Send, 
  Trash2, 
  ExternalLink, 
  RotateCcw, 
  CheckCircle, 
  Plus, 
  LayoutList, 
  LayoutGrid,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { SellerProject, SellerProjectStatus } from '../../types';
import ProjectStatusBadge from './ProjectStatusBadge';

interface ProjectTableProps {
  projects: SellerProject[];
  onAddNewProject: () => void;
  onEditProject: (id: string) => void;
  onPreviewProject: (project: SellerProject) => void;
  onSubmitForReview: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onDeleteAllProjects?: () => void;
  onViewPublicListing?: (project: SellerProject) => void;
  initialFilterStatus?: string;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onAddNewProject,
  onEditProject,
  onPreviewProject,
  onSubmitForReview,
  onDeleteProject,
  onDeleteAllProjects,
  onViewPublicListing,
  initialFilterStatus = 'All'
}) => {
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedProjectForReason, setSelectedProjectForReason] = useState<SellerProject | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Status Filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'Draft' && project.sellerStatus !== 'Draft') return false;
        if (statusFilter === 'Pending Review' && project.sellerStatus !== 'Pending Review') return false;
        if (statusFilter === 'Approved' && project.sellerStatus !== 'Approved') return false;
        if (statusFilter === 'Rejected' && project.sellerStatus !== 'Rejected') return false;
        if (statusFilter === 'Sold' && project.sellerStatus !== 'Sold') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = project.title.toLowerCase().includes(q);
        const matchesTagline = project.tagline.toLowerCase().includes(q);
        const matchesCat = project.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTagline && !matchesCat) return false;
      }

      return true;
    });
  }, [projects, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Bar */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD3] pb-4">
          <div>
            <h1 className="font-serif font-bold text-2xl text-[#2C2A26]">
              My Project Listings ({projects.length})
            </h1>
            <p className="text-xs text-[#5D5A53]">
              Manage all submitted, pending, and draft assets for your seller workspace
            </p>
          </div>

          <div className="flex items-center gap-2">
            {projects.length > 0 && (
              <button
                onClick={() => {
                  if (onDeleteAllProjects) {
                    onDeleteAllProjects();
                  } else {
                    projects.forEach(p => onDeleteProject(p.id));
                  }
                }}
                className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                title="Delete all projects in your workspace"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Workspace Projects</span>
              </button>
            )}

            <button
              onClick={onAddNewProject}
              className="px-4 py-2.5 bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#423E38] rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>+ Add New Project</span>
            </button>
          </div>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F5F2EB] border border-[#E2DDD3] rounded-2xl text-xs font-semibold">
            {['All', 'Draft', 'Pending Review', 'Approved', 'Rejected', 'Sold'].map((st) => {
              const count = st === 'All'
                ? projects.length
                : projects.filter((p) => p.sellerStatus === st).length;

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    statusFilter === st
                      ? 'bg-white text-[#2C2A26] shadow-2xs font-bold'
                      : 'text-[#5D5A53] hover:text-[#2C2A26]'
                  }`}
                >
                  <span>{st === 'Rejected' ? 'Changes Needed' : st}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                    statusFilter === st ? 'bg-[#2C2A26] text-[#F5F2EB]' : 'bg-[#EAE5D9] text-[#5D5A53]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Layout Toggles */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search my projects..."
                className="w-full pl-8 pr-3 py-2 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs focus:outline-none focus:border-[#2C2A26]"
              />
            </div>

            <div className="flex items-center bg-[#F5F2EB] border border-[#E2DDD3] rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-2xs text-[#2C2A26]' : 'text-[#8C8275]'}`}
                title="List View"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-2xs text-[#2C2A26]' : 'text-[#8C8275]'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal Alert if selecting a project */}
      {selectedProjectForReason && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-red-900">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-red-950 block">Rejection Feedback for "{selectedProjectForReason.title}":</strong>
              <p className="mt-0.5">{selectedProjectForReason.rejectionReason}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedProjectForReason(null)}
            className="text-xs text-red-800 underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Content Rendering */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-[#E2DDD3] rounded-3xl p-12 text-center space-y-3">
          <Search className="w-10 h-10 text-[#8C8275] mx-auto" />
          <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
            No Projects Found
          </h3>
          <p className="text-xs text-[#5D5A53] max-w-xs mx-auto">
            No listing matches the selected status or search filter.
          </p>
          <button
            onClick={() => { setStatusFilter('All'); setSearchQuery(''); }}
            className="px-4 py-2 bg-[#F5F2EB] border border-[#E2DDD3] rounded-xl text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE LIST VIEW */
        <div className="bg-white border border-[#E2DDD3] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2DDD3] bg-[#FDFCF9] text-[11px] font-bold uppercase tracking-wider text-[#8C8275]">
                  <th className="py-3.5 px-4 sm:px-6">Project Asset</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Financials</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD3] text-xs">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-[#FDFCF9] transition-colors">
                    {/* Project Asset Title & Image */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3.5 min-w-[200px]">
                        <img
                          src={project.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300'}
                          alt={project.title}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E2DDD3] shrink-0"
                        />
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#2C2A26]">
                            {project.title}
                          </h4>
                          <p className="text-[11px] text-[#8C8275] line-clamp-1 max-w-xs">
                            {project.tagline}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category & Platform */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-semibold text-[#2C2A26] block">
                        {project.category}
                      </span>
                      <span className="text-[11px] text-[#8C8275]">
                        {project.platform}
                      </span>
                    </td>

                    {/* Financials */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-[#2C2A26]">
                        {formatCurrency(project.askingPrice)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        +{formatCurrency(project.monthlyRevenue)}/mo MRR
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <ProjectStatusBadge
                        status={project.sellerStatus}
                        rejectionReason={project.rejectionReason}
                        size="sm"
                      />
                    </td>

                    {/* Last Updated Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-[#8C8275] text-[11px]">
                      {project.lastSavedAt
                        ? new Date(project.lastSavedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : project.createdAt}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview */}
                        <button
                          onClick={() => onPreviewProject(project)}
                          className="p-2 text-[#5D5A53] hover:text-[#2C2A26] hover:bg-[#F5F2EB] rounded-lg transition-all"
                          title="Preview Buyer View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Draft / Re-edit */}
                        {(project.sellerStatus === 'Draft' || project.sellerStatus === 'Rejected') && (
                          <button
                            onClick={() => onEditProject(project.id)}
                            className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit Project Details"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Submit for Review (if Draft or Rejected) */}
                        {(project.sellerStatus === 'Draft' || project.sellerStatus === 'Rejected') && (
                          <button
                            onClick={() => onSubmitForReview(project.id)}
                            className="px-2.5 py-1 bg-[#2C2A26] text-[#F5F2EB] hover:bg-[#423E38] rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                          >
                            <Send className="w-3 h-3 text-amber-300" />
                            <span>Submit</span>
                          </button>
                        )}

                        {/* Approved: View in Public Marketplace */}
                        {project.sellerStatus === 'Approved' && onViewPublicListing && (
                          <button
                            onClick={() => onViewPublicListing(project)}
                            className="px-2.5 py-1 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Market</span>
                          </button>
                        )}

                        {/* Pending Review Management Notice */}
                        {project.sellerStatus === 'Pending Review' && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Management Review (~5 mins)</span>
                          </span>
                        )}

                        {/* Delete Project */}
                        <button
                          onClick={() => onDeleteProject(project.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Project from Workspace"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-[#E2DDD3] rounded-3xl p-5 space-y-4 hover:border-[#2C2A26] transition-all shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="relative h-40 rounded-2xl overflow-hidden border border-[#E2DDD3]">
                  <img
                    src={project.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800'}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <ProjectStatusBadge status={project.sellerStatus} size="sm" />
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/75 text-white px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-xs">
                    {formatCurrency(project.askingPrice)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8275]">
                    {project.category} • {project.platform}
                  </span>
                  <h4 className="font-serif font-bold text-lg text-[#2C2A26]">
                    {project.title}
                  </h4>
                  <p className="text-xs text-[#5D5A53] line-clamp-2 mt-1">
                    {project.tagline}
                  </p>
                </div>

                {project.sellerStatus === 'Rejected' && project.rejectionReason && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900">
                    <strong className="font-bold block">Rejection Feedback:</strong>
                    <span className="line-clamp-2">{project.rejectionReason}</span>
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="pt-3 border-t border-[#E2DDD3] flex items-center justify-between gap-2">
                <div className="text-[11px] text-emerald-700 font-semibold">
                  +{formatCurrency(project.monthlyRevenue)}/mo MRR
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onPreviewProject(project)}
                    className="px-3 py-1.5 bg-[#F5F2EB] border border-[#E2DDD3] rounded-xl text-xs font-semibold text-[#2C2A26]"
                  >
                    Preview
                  </button>

                  {(project.sellerStatus === 'Draft' || project.sellerStatus === 'Rejected') && (
                    <button
                      onClick={() => onEditProject(project.id)}
                      className="px-3.5 py-1.5 bg-[#2C2A26] text-[#F5F2EB] rounded-xl text-xs font-bold"
                    >
                      Edit
                    </button>
                  )}

                  {project.sellerStatus === 'Approved' && onViewPublicListing && (
                    <button
                      onClick={() => onViewPublicListing(project)}
                      className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold"
                    >
                      Marketplace
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteProject(project.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Project from Workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectTable;
