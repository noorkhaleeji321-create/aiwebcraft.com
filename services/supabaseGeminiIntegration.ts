/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from '@google/genai';
import { supabase } from './supabaseClient.js';
import {
  CustomRequestRow,
  ListingRow,
  MessageRow,
  OrderRow,
  PlatformSettingsRow,
  ProfileRow,
  ProjectRow,
  SellerRow,
  SupportTicketRow,
  UserRole
} from '../types/supabaseTables.js';

/**
 * 1. Admin Verification Helper via Supabase RLS Profile Check
 */
export async function verifyAdminRoleInSupabase(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (!error && profile) {
      return profile.role === 'admin';
    }
  } catch (err) {
    console.warn('[Supabase Role Check Warning]:', err);
  }
  return false;
}

/**
 * 2. Get User Profile with Session auth.uid()
 */
export async function getUserProfile(userId: string): Promise<ProfileRow | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) return data as ProfileRow;
  } catch (err) {
    console.warn('[getUserProfile Error]:', err);
  }
  return null;
}

/**
 * 3. Gemini Function Declarations (Tools) mapping to all 9 Tables
 */

export const searchListingsTool: FunctionDeclaration = {
  name: 'search_listings',
  description: 'Search approved marketplace listings and web apps in the listings table',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, description: 'Category to filter (e.g., SaaS, Mobile App, AI Product, E-commerce)' },
      minPrice: { type: Type.NUMBER, description: 'Minimum asking price in USD' },
      maxPrice: { type: Type.NUMBER, description: 'Maximum asking price in USD' },
      query: { type: Type.STRING, description: 'Keyword query in title, tagline, or description' }
    }
  }
};

export const getUserProfileTool: FunctionDeclaration = {
  name: 'get_user_profile',
  description: 'Fetch current authenticated user profile and check role (admin, buyer, seller) from profiles table',
  parameters: {
    type: Type.OBJECT,
    properties: {
      userId: { type: Type.STRING, description: 'User ID (auth.uid())' }
    },
    required: ['userId']
  }
};

export const queryCustomRequestsTool: FunctionDeclaration = {
  name: 'query_custom_requests',
  description: 'Query user custom build requests and calculator submissions from custom_requests table',
  parameters: {
    type: Type.OBJECT,
    properties: {
      buyerEmail: { type: Type.STRING, description: 'Email address of the buyer' },
      status: { type: Type.STRING, description: 'Status filter (PENDING_REVIEW, IN_PROGRESS, COMPLETED)' }
    }
  }
};

export const getOrdersStatusTool: FunctionDeclaration = {
  name: 'get_orders_status',
  description: 'Check escrow transaction status, payment confirmation, and delivery for buyer or seller from orders table',
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderId: { type: Type.STRING, description: 'Order or escrow transaction ID' },
      userEmail: { type: Type.STRING, description: 'Email of the buyer or seller' }
    }
  }
};

export const getPlatformSettingsTool: FunctionDeclaration = {
  name: 'get_platform_settings',
  description: 'Fetch global site platform settings (e.g. commission percentage, escrow rules) from platform_settings table',
  parameters: {
    type: Type.OBJECT,
    properties: {
      settingKey: { type: Type.STRING, description: 'Optional specific setting key' }
    }
  }
};

export const getUserMessagesTool: FunctionDeclaration = {
  name: 'get_user_messages',
  description: 'Fetch private user messages for a conversation or project from messages table',
  parameters: {
    type: Type.OBJECT,
    properties: {
      userEmail: { type: Type.STRING, description: 'Email of the authenticated user' },
      projectId: { type: Type.STRING, description: 'Optional project ID context' }
    },
    required: ['userEmail']
  }
};

export const getProjectsTool: FunctionDeclaration = {
  name: 'get_projects',
  description: 'Fetch seller digital projects and SaaS applications from projects table',
  parameters: {
    type: Type.OBJECT,
    properties: {
      sellerId: { type: Type.STRING, description: 'Seller ID or owner email' },
      status: { type: Type.STRING, description: 'Project status filter (Draft, Pending Review, Approved)' }
    }
  }
};

export const getSellerProfileTool: FunctionDeclaration = {
  name: 'get_seller_profile',
  description: 'Fetch storefront and verification info for a seller from sellers table',
  parameters: {
    type: Type.OBJECT,
    properties: {
      sellerId: { type: Type.STRING, description: 'Seller ID or email' }
    },
    required: ['sellerId']
  }
};

export const manageSupportTicketTool: FunctionDeclaration = {
  name: 'manage_support_ticket',
  description: 'Query or create support tickets for a user in support_tickets table',
  parameters: {
    type: Type.OBJECT,
    properties: {
      userEmail: { type: Type.STRING, description: 'Email of the ticket submitter' },
      action: { type: Type.STRING, description: 'Action to perform: "GET" or "CREATE"' },
      subject: { type: Type.STRING, description: 'Ticket subject line if creating' },
      messageContent: { type: Type.STRING, description: 'Initial ticket message body' }
    },
    required: ['userEmail', 'action']
  }
};

export const ALL_SUPABASE_GEMINI_TOOLS = [
  searchListingsTool,
  getUserProfileTool,
  queryCustomRequestsTool,
  getOrdersStatusTool,
  getPlatformSettingsTool,
  getUserMessagesTool,
  getProjectsTool,
  getSellerProfileTool,
  manageSupportTicketTool
];

/**
 * 4. Server-Side Execution Dispatcher for Gemini Tool Calls against Supabase
 */
export async function executeSupabaseGeminiToolCall(
  toolName: string,
  args: any,
  sessionUser?: { id: string; email: string; role?: string }
): Promise<any> {
  try {
    switch (toolName) {
      case 'search_listings': {
        let query = supabase.from('listings').select('*').eq('status', 'approved');
        if (args.category) query = query.eq('category', args.category);
        if (args.minPrice) query = query.gte('asking_price', args.minPrice);
        if (args.maxPrice) query = query.lte('asking_price', args.maxPrice);
        if (args.query) query = query.ilike('title', `%${args.query}%`);

        const { data, error } = await query.limit(10);
        if (error) return { error: error.message };
        return { listings: data };
      }

      case 'get_user_profile': {
        const targetUserId = args.userId || sessionUser?.id;
        if (!targetUserId) return { error: 'User ID is required' };
        
        // RLS enforcement: User can view own profile or admin can view any
        if (sessionUser && sessionUser.id !== targetUserId && sessionUser.role !== 'admin') {
          const isAdmin = await verifyAdminRoleInSupabase(sessionUser.id);
          if (!isAdmin) return { error: 'Unauthorized: Access restricted by RLS profile rules' };
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .maybeSingle();

        if (error) return { error: error.message };
        return { profile: data };
      }

      case 'query_custom_requests': {
        let query = supabase.from('custom_requests').select('*');
        if (args.buyerEmail) query = query.eq('buyer_email', args.buyerEmail);
        if (args.status) query = query.eq('status', args.status);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(10);
        if (error) return { error: error.message };
        return { custom_requests: data };
      }

      case 'get_orders_status': {
        let query = supabase.from('orders').select('*');
        if (args.orderId) {
          query = query.eq('id', args.orderId);
        } else if (args.userEmail) {
          query = query.or(`buyer_email.eq.${args.userEmail},seller_email.eq.${args.userEmail}`);
        } else if (sessionUser?.email) {
          query = query.or(`buyer_email.eq.${sessionUser.email},seller_email.eq.${sessionUser.email}`);
        }

        const { data, error } = await query.limit(5);
        if (error) return { error: error.message };
        return { orders: data };
      }

      case 'get_platform_settings': {
        const { data, error } = await supabase.from('platform_settings').select('*');
        if (error) return { error: error.message };
        return { settings: data };
      }

      case 'get_user_messages': {
        const userEmail = args.userEmail || sessionUser?.email;
        if (!userEmail) return { error: 'User email is required to view private messages' };

        let query = supabase
          .from('messages')
          .select('*')
          .or(`sender_email.eq.${userEmail},recipient_email.eq.${userEmail}`);

        if (args.projectId) {
          query = query.eq('project_id', args.projectId);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
        if (error) return { error: error.message };
        return { messages: data };
      }

      case 'get_projects': {
        let query = supabase.from('projects').select('*');
        if (args.sellerId) query = query.eq('seller_id', args.sellerId);
        if (args.status) query = query.eq('status', args.status);

        const { data, error } = await query.limit(10);
        if (error) return { error: error.message };
        return { projects: data };
      }

      case 'get_seller_profile': {
        const { data, error } = await supabase
          .from('sellers')
          .select('*')
          .or(`id.eq.${args.sellerId},email.eq.${args.sellerId}`)
          .maybeSingle();

        if (error) return { error: error.message };
        return { seller: data };
      }

      case 'manage_support_ticket': {
        if (args.action === 'CREATE') {
          const ticketId = `st-${Date.now()}`;
          const newTicket = {
            id: ticketId,
            user_email: args.userEmail,
            subject: args.subject || 'Support Inquiry',
            status: 'OPEN',
            messages: args.messageContent ? [{ sender: args.userEmail, text: args.messageContent, timestamp: new Date().toISOString() }] : []
          };
          const { data, error } = await supabase.from('support_tickets').insert([newTicket]).select();
          if (error) return { error: error.message };
          return { ticketCreated: true, ticket: data?.[0] };
        } else {
          const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_email', args.userEmail)
            .order('created_at', { ascending: false });

          if (error) return { error: error.message };
          return { tickets: data };
        }
      }

      default:
        return { error: `Unknown tool call: ${toolName}` };
    }
  } catch (err: any) {
    console.error(`Error executing Gemini Supabase Tool [${toolName}]:`, err);
    return { error: err?.message || 'Tool execution failed' };
  }
}
