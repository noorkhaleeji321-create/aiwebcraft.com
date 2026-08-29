import React from 'react';
import SellerDashboard from './seller/SellerDashboard.js';
import { Listing } from '../types.js';

interface SellProjectProps {
  onBackToMarketplace: () => void;
  onViewPublicListing?: (listing: Listing) => void;
  initialSubTab?: 'overview' | 'my-projects' | 'add-project';
  projectId?: string;
}

const SellProject: React.FC<SellProjectProps> = ({
  onBackToMarketplace,
  onViewPublicListing,
  initialSubTab,
  projectId
}) => {
  return (
    <SellerDashboard
      onBackToMarketplace={onBackToMarketplace}
      onViewPublicListing={onViewPublicListing}
      initialSubTab={initialSubTab}
      projectId={projectId}
    />
  );
};

export default SellProject;
