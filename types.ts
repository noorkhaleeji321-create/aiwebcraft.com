/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

export type CategoryType = string;

export type SellerProjectStatus = 'Draft' | 'Pending Review' | 'Approved' | 'Rejected' | 'Sold';

export type Language = 'en' | 'ar' | 'fr';

export interface TechStack {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  aiModels?: string[];
  hosting?: string[];
  payments?: string[];
}

export interface BusinessOverview {
  model: string;
  monetization: string[];
  targetAudience: string;
  growthOpportunities: string[];
  includedAssets: string[];
  workloadHoursPerWeek: number;
  reasonForSelling?: string;
}

export interface ExpenseItem {
  category: string;
  amount: number;
}

export interface FinancialOverview {
  ttmRevenue: number;
  ttmProfit: number;
  expensesBreakdown: ExpenseItem[];
  highlights: string[];
}

export interface SellerInfo {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  location: string;
  memberSince: string;
  rating: number;
  responseRate: string;
  completedDeals: number;
  verified: boolean;
  bio: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Buyer' | 'Seller' | 'Both' | 'Super Admin';
  registrationDate: string;
  projectsCount: number;
  purchasesCount: number;
  status: 'Active' | 'Suspended';
  suspensionReason?: string;
  avatar?: string;
  location?: string;
  lastLogin?: string;
  bio?: string;
}

export interface AdminSeller {
  id: string;
  name: string;
  email: string;
  projectsCount: number;
  approvedProjectsCount: number;
  soldProjectsCount: number;
  totalSales: number;
  verificationStatus: 'Verified' | 'Pending' | 'Unverified';
  registrationDate: string;
  status: 'Active' | 'Suspended';
  suspensionReason?: string;
  avatar?: string;
  location?: string;
  rating?: number;
  responseRate?: string;
  bio?: string;
}

export interface VerificationInfo {
  revenueVerified: boolean;
  trafficVerified: boolean;
  codebaseVerified: boolean;
  identityVerified?: boolean;
  sellerIdentityVerified?: boolean;
}

export type BusinessStage = 'PRE_LAUNCH' | 'BETA' | 'LIVE_NO_REVENUE' | 'LIVE_REVENUE' | 'ESTABLISHED';

export type AssetTypeOption =
  | 'SaaS'
  | 'Mobile App'
  | 'Website'
  | 'E-commerce Store'
  | 'AI Product'
  | 'Marketplace'
  | 'API'
  | 'Chrome Extension'
  | 'Domain'
  | 'Digital Tool'
  | 'Source Code'
  | 'Other';

export interface Listing {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  longDescription: string;
  askingPrice: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  monthlyVisitors: number;
  category: Exclude<CategoryType, 'All'>;
  platform: string;
  status: 'For Sale' | 'Under Offer' | 'Sold';
  featured?: boolean;
  imageUrl: string;
  gallery: string[];
  demoUrl?: string;
  videoUrl?: string;
  techStack: TechStack;
  businessOverview: BusinessOverview;
  financialOverview: FinancialOverview;
  seller: SellerInfo;
  verification: VerificationInfo;
  createdAt: string;

  // AIWebCrafter Product Stage System Fields
  business_stage: BusinessStage;
  asset_type?: AssetTypeOption;

  // PRE_LAUNCH
  expectedLaunchDate?: string;
  developmentProgress?: number;
  featuresCompleted?: string[];
  featuresRemaining?: string[];
  demo?: string;
  technology?: string[];
  betaWaitlistUsers?: number;

  // BETA
  betaStartDate?: string;
  betaUsers?: number;
  payingUsers?: number;
  currentFeatures?: string[];
  knownIssues?: string[];
  expectedPublicLaunch?: string;

  // LIVE_NO_REVENUE
  launchDate?: string;
  totalUsers?: number;
  activeUsers?: number;
  traffic?: number;
  growth?: string;

  // LIVE_REVENUE
  averageMonthlyRevenue?: number;
  revenuePeriod?: string;
  payingCustomers?: number;
  totalCustomers?: number;
  mrr?: number;
  arr?: number;
  revenueSource?: string;
  revenueVerificationStatus?: 'CLAIMED' | 'VERIFIED';

  // ESTABLISHED
  businessAge?: string;
  annualRevenue?: number;
  profit?: number;
  users?: number;
  expenses?: number;
  teamSize?: number;
  churn?: string;
  acquisitionChannels?: string[];
  reasonForSale?: string;
}

export type DeliveryStatus = 
  | 'Awaiting Payment' 
  | 'Payment Confirmed' 
  | 'Delivery Pending' 
  | 'Delivered' 
  | 'Buyer Inspection' 
  | 'Accepted' 
  | 'Disputed' 
  | 'Completed';

export type AssetType = 
  | 'Source Code' 
  | 'Database' 
  | 'Domain Transfer' 
  | 'Hosting & Cloud' 
  | 'Design Files' 
  | 'Documentation' 
  | 'Credentials & Vault';

export interface AssetDeliveryItem {
  id: string;
  type: AssetType;
  title: string;
  description: string;
  status: 'Pending' | 'Delivered' | 'Verified';
  isSecret?: boolean;
  deliverableValue?: string;
  deliveredAt?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface OwnershipDeclaration {
  declared: boolean;
  declaredBy: string;
  declaredAt: string;
  ownershipTermsAccepted: boolean;
  declarationText: string;
  ipCheckVerified?: boolean;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actor: 'Seller' | 'Buyer' | 'Admin' | 'Payment Gateway' | 'System';
  action: string;
  details: string;
}

export interface DisputeRecord {
  id: string;
  orderId: string;
  status: 'Open' | 'Under Review' | 'Resolved';
  reason: string;
  evidenceDetails: string;
  openedAt: string;
  openedBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface OrderTransaction {
  id: string;
  projectId: string;
  projectTitle: string;
  projectImage: string;
  askingPrice: number;
  currency: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  deliveryStatus: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
  termsAccepted: boolean;
  termsAcceptedAt?: string;
  ownershipDeclaration: OwnershipDeclaration;
  assets: AssetDeliveryItem[];
  auditLogs: AuditLogRecord[];
  dispute?: DisputeRecord;
  paymentReference?: string;
  paymentGateway?: 'paypal' | 'cmi';
  payoutStatus?: 'Pending' | 'Disbursed' | 'None';
  payoutDetails?: SellerPayoutSettings;
  payoutReceiptUrl?: string;
  payoutDisbursedAt?: string;
}

export interface SellerPayoutSettings {
  payoutMethod: 'bank' | 'paypal' | 'crypto';
  bankName?: string;
  bankSwift?: string;
  bankIban?: string;
  bankAccountHolder?: string;
  paypalEmail?: string;
  cryptoWalletAddress?: string;
  cryptoNetwork?: string;
  updatedAt: string;
}

export interface ProjectSecureFile {
  id: string;
  name: string;
  path: string;
  size: number;
  snippet?: string;
  isExtractedFile?: boolean;
}

export interface SellerProject {
  id: string;
  slug: string;
  ownerEmail?: string;
  sellerStatus: SellerProjectStatus;
  rejectionReason?: string;
  lastSavedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  currentStep?: number;
  title: string;
  tagline: string;
  description: string;
  longDescription: string;
  askingPrice: number;
  currency: string;
  monthlyRevenue: number;
  monthlyProfit: number;
  monthlyExpenses: number;
  monthlyVisitors: number;
  category: Exclude<CategoryType, 'All'>;
  projectType: string;
  platform: string;
  demoUrl?: string;
  videoUrl?: string;
  imageUrl: string;
  gallery: string[];
  secureFiles?: ProjectSecureFile[];
  techStack: TechStack;
  businessOverview: BusinessOverview;
  financialOverview: FinancialOverview;
  seller: SellerInfo;
  verification: VerificationInfo;
  createdAt: string;
  ownershipDeclaration?: OwnershipDeclaration;

  // AIWebCrafter Product Stage System Fields
  business_stage: BusinessStage;
  asset_type?: AssetTypeOption;

  // PRE_LAUNCH
  expectedLaunchDate?: string;
  developmentProgress?: number;
  featuresCompleted?: string[];
  featuresRemaining?: string[];
  demo?: string;
  technology?: string[];
  betaWaitlistUsers?: number;

  // BETA
  betaStartDate?: string;
  betaUsers?: number;
  payingUsers?: number;
  currentFeatures?: string[];
  knownIssues?: string[];
  expectedPublicLaunch?: string;

  // LIVE_NO_REVENUE
  launchDate?: string;
  totalUsers?: number;
  activeUsers?: number;
  traffic?: number;
  growth?: string;

  // LIVE_REVENUE
  averageMonthlyRevenue?: number;
  revenuePeriod?: string;
  payingCustomers?: number;
  totalCustomers?: number;
  mrr?: number;
  arr?: number;
  revenueSource?: string;
  revenueVerificationStatus?: 'CLAIMED' | 'VERIFIED';

  // ESTABLISHED
  businessAge?: string;
  annualRevenue?: number;
  profit?: number;
  users?: number;
  expenses?: number;
  teamSize?: number;
  churn?: string;
  acquisitionChannels?: string[];
  reasonForSale?: string;
}

export interface FilterOptions {
  search: string;
  category: CategoryType;
  minPrice: number | null;
  maxPrice: number | null;
  minRevenue: number | null;
  verifiedOnly: boolean;
  selectedTech: string[];
  sortBy: 'newest' | 'price-low' | 'price-high' | 'revenue-high' | 'profit-high';
  businessStageFilter?: 'All' | BusinessStage;
  assetTypeFilter?: 'All' | AssetTypeOption;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export type ViewState = 
  | { type: 'home' }
  | { type: 'project'; listing: Listing }
  | { type: 'sell'; initialSubTab?: string; projectId?: string }
  | { type: 'saved' }
  | { type: 'checkout'; listing: Listing }
  | { type: 'seller-delivery'; orderId: string }
  | { type: 'buyer-delivery'; orderId: string }
  | { type: 'admin'; initialSubTab?: string }
  | { type: 'buyer-purchases' }
  | { type: 'buyer-orders' }
  | { type: 'buyer-messages' }
  | { type: 'buyer-account' }
  | { type: 'categories' }
  | { type: 'on-demand' };

export interface JournalArticle {
  id: number | string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
  content: React.ReactNode;
}

export type Product = Listing;


