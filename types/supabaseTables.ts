/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'buyer' | 'seller' | 'both' | 'user';

// 1. custom_requests
export interface CustomRequestRow {
  id: string;
  project_name: string;
  project_type?: string;
  buyer_email: string;
  buyer_name?: string;
  user_id?: string;
  status: 'PENDING_REVIEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  budget?: string;
  timeline?: string;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
}

// 2. listings
export interface ListingRow {
  id: string;
  seller_id: string;
  seller_name?: string;
  seller_email?: string;
  seller_avatar?: string;
  seller_verified?: boolean;
  title: string;
  tagline?: string;
  description?: string;
  long_description?: string;
  asking_price: number;
  monthly_revenue: number;
  monthly_profit: number;
  monthly_visitors?: number;
  category: string;
  platform?: string;
  image_url?: string;
  gallery?: string[];
  tech_stack?: string[];
  demo_url?: string;
  video_url?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'sold';
  business_stage?: string;
  asset_type?: string;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
}

// 3. messages
export interface MessageRow {
  id: string;
  sender_id?: string;
  receiver_id?: string;
  sender_email: string;
  recipient_email: string;
  project_id?: string;
  content: string;
  read?: boolean;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
}

// 4. orders
export interface OrderRow {
  id: string;
  listing_id?: string;
  project_id?: string;
  buyer_id?: string;
  buyer_email: string;
  seller_id?: string;
  seller_email: string;
  amount: number;
  commission_amount?: number;
  net_seller_amount?: number;
  status: 'pending' | 'payment_confirmed' | 'delivered' | 'accepted' | 'disputed' | 'completed' | 'cancelled';
  payment_method?: string;
  delivery_status?: string;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
}

// 5. platform_settings
export interface PlatformSettingsRow {
  id?: string;
  key?: string;
  value?: string;
  platform_commission_rate?: number;
  min_payout_threshold?: number;
  escrow_hold_days?: number;
  auto_payouts_enabled?: boolean;
  stripe_connected?: boolean;
  crypto_payments_enabled?: boolean;
  updated_at?: string;
  data?: Record<string, any>;
}

// 6. profiles
export interface ProfileRow {
  id: string; // auth.uid()
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
}

// 7. projects
export interface ProjectRow {
  id: string;
  seller_id: string;
  owner_email?: string;
  title: string;
  tagline?: string;
  description?: string;
  asking_price: number;
  monthly_revenue: number;
  monthly_profit: number;
  category: string;
  status: 'Draft' | 'Pending Review' | 'Approved' | 'Rejected' | 'Sold';
  tech_stack?: Record<string, any>;
  business_overview?: Record<string, any>;
  financial_overview?: Record<string, any>;
  secure_files?: any[];
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
}

// 8. sellers
export interface SellerRow {
  id: string;
  user_id?: string;
  email: string;
  name: string;
  company?: string;
  verified?: boolean;
  rating?: number;
  completed_deals?: number;
  payout_method?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
}

// 9. support_tickets
export interface SupportTicketRow {
  id: string;
  user_id?: string;
  user_email: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  messages?: any[];
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
}

export interface SupabaseDatabaseSchema {
  public: {
    Tables: {
      custom_requests: { Row: CustomRequestRow; Insert: Partial<CustomRequestRow>; Update: Partial<CustomRequestRow> };
      listings: { Row: ListingRow; Insert: Partial<ListingRow>; Update: Partial<ListingRow> };
      messages: { Row: MessageRow; Insert: Partial<MessageRow>; Update: Partial<MessageRow> };
      orders: { Row: OrderRow; Insert: Partial<OrderRow>; Update: Partial<OrderRow> };
      platform_settings: { Row: PlatformSettingsRow; Insert: Partial<PlatformSettingsRow>; Update: Partial<PlatformSettingsRow> };
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow>; Update: Partial<ProfileRow> };
      projects: { Row: ProjectRow; Insert: Partial<ProjectRow>; Update: Partial<ProjectRow> };
      sellers: { Row: SellerRow; Insert: Partial<SellerRow>; Update: Partial<SellerRow> };
      support_tickets: { Row: SupportTicketRow; Insert: Partial<SupportTicketRow>; Update: Partial<SupportTicketRow> };
    };
  };
}
