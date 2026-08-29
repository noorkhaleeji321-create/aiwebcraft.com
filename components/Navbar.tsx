import React from 'react';
import { Language } from '../types.js';
import SidebarNav, { UserRole } from './SidebarNav.js';

export interface NavbarProps {
  activeView: string;
  activeSubTab?: string;
  userRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onNavigate: (viewType: any, targetSection?: string) => void;
  savedCount: number;
  onOpenAccountModal: () => void;
  onOpenSearchModal?: () => void;
  onContactAdmin?: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  filters?: any;
  onFilterChange?: (updated: any) => void;
  onResetFilters?: () => void;
}

export const Navbar: React.FC<NavbarProps> = (props) => {
  return <SidebarNav {...props} />;
};

export default Navbar;
