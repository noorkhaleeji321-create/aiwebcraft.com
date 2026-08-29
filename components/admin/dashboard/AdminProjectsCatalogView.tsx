import React, { useState } from 'react';
import { Search, Layers, Trash2, AlertTriangle, X } from 'lucide-react';
import { SellerProject } from '../../../types';
import ProjectReviewCard from '../ProjectReviewCard';
import { deleteAllTestProjectsGlobal } from '../../../services/sellerStore';

interface AdminProjectsCatalogViewProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (val: string) => void;
  filteredProjects: SellerProject[];
  handleActionComplete: (proj: SellerProject) => void;
  onRefresh?: () => void;
}

export const AdminProjectsCatalogView: React.FC<AdminProjectsCatalogViewProps> = ({
  searchQuery,
  setSearchQuery,
  selectedStatusFilter,
  setSelectedStatusFilter,
  filteredProjects,
  handleActionComplete,
  onRefresh
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await deleteAllTestProjectsGlobal();
      setShowConfirmModal(false);
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white border border-[#E2DDD3] p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search projects by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#2C2A26]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
            title="Delete All Test Projects"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Delete All Test Projects</span>
          </button>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-[#FDFCF9] border border-[#E2DDD3] text-[#2C2A26] text-xs rounded-xl p-2.5 font-semibold focus:outline-none focus:border-[#2C2A26]"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved (Live)</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in duration-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xl text-slate-900">
                Confirm Deletion of All Test Projects
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to delete all test/demo projects from the system? This action cannot be undone and will permanently remove all test listings and associated data.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-3xl shadow-sm">
          <Layers className="w-10 h-10 text-[#8C8275] mx-auto" />
          <h3 className="font-serif font-bold text-lg text-[#2C2A26]">No Projects in Catalog</h3>
          <p className="text-xs text-[#5D5A53] max-w-md mx-auto">
            The global projects catalog is clean. Projects submitted by sellers will appear here for review and management.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((proj) => (
            <ProjectReviewCard
              key={proj.id}
              project={proj}
              onActionComplete={handleActionComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
