import React from 'react';
import { 
  FileEdit, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Tag, 
  Info 
} from 'lucide-react';
import { SellerProjectStatus } from '../../types';

interface ProjectStatusBadgeProps {
  status: SellerProjectStatus;
  rejectionReason?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = ({
  status,
  rejectionReason,
  size = 'md',
  showDetails = false
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-[10px] gap-1';
      case 'lg':
        return 'px-3.5 py-1.5 text-xs font-bold gap-2';
      case 'md':
      default:
        return 'px-2.5 py-1 text-xs font-semibold gap-1.5';
    }
  };

  const renderBadge = () => {
    switch (status) {
      case 'Draft':
        return (
          <span className={`inline-flex items-center rounded-lg bg-gray-100 text-gray-700 border border-gray-300 ${getSizeClasses()}`}>
            <FileEdit className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span>Draft</span>
          </span>
        );

      case 'Pending Review':
        return (
          <span className={`inline-flex items-center rounded-lg bg-amber-50 text-amber-800 border border-amber-300 ${getSizeClasses()}`}>
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
            <span>Pending Review</span>
          </span>
        );

      case 'Approved':
        return (
          <span className={`inline-flex items-center rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 ${getSizeClasses()}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Approved & Live</span>
          </span>
        );

      case 'Rejected':
        return (
          <span className={`inline-flex items-center rounded-lg bg-red-50 text-red-800 border border-red-300 ${getSizeClasses()}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>Changes Required</span>
          </span>
        );

      case 'Sold':
        return (
          <span className={`inline-flex items-center rounded-lg bg-purple-50 text-purple-900 border border-purple-300 ${getSizeClasses()}`}>
            <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Acquired / Sold</span>
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div className="inline-block">
      {renderBadge()}

      {showDetails && status === 'Rejected' && rejectionReason && (
        <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-[11px] uppercase tracking-wider text-red-800">Rejection Feedback:</span>
            <span>{rejectionReason}</span>
          </div>
        </div>
      )}

      {showDetails && status === 'Pending Review' && (
        <p className="mt-1.5 text-[11px] text-amber-800">
          ⏳ Being reviewed by AIWebCrafter team. It will appear in Marketplace upon approval.
        </p>
      )}
    </div>
  );
};

export default ProjectStatusBadge;
