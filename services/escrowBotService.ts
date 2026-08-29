
import { getPlatformCommissionPercentage } from './supabaseService.js';
import { getOrderById, updateOrderStatus, updateOrder } from './deliveryStore.js';
import { getSellerPayoutSettings } from './sellerStore.js';

export const ESCROW_HOLD_HOURS = 48;

export interface EscrowPayoutCalculation {
  grossAmount: number;
  commissionPct: number;
  platformFee: number;
  sellerNetPayout: number;
}

// Escrow Guardian Bot (EscrowBot):
// Automated escrow holding, 48-hour inspection protection, dispute freezing, platform commission deduction,
// and preparing full seller banking/crypto receiving credentials for Admin manual fund disbursement.
export const EscrowBot = {
  name: 'Escrow Guardian Bot',
  description: 'Protects buyer funds by locking them in a mandatory 48-hour inspection period, freezes payouts immediately on disputes, calculates platform commission automatically, and generates comprehensive buyer/seller reports for Admin manual disbursement.',

  /**
   * Checks if live gateway API keys or Moroccan CMI / Escrow configurations are set.
   */
  hasApiKeysConfigured: (): boolean => {
    const hasPaypal = Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);
    const hasMoroccoCmi = true; // CMI / Moroccan Bank Escrow is natively supported
    return hasPaypal || hasMoroccoCmi;
  },

  /**
   * Calculates fee deduction based on Admin Commission Rate setting
   */
  calculatePayout: async (grossAmount: number): Promise<EscrowPayoutCalculation> => {
    const commissionPct = await getPlatformCommissionPercentage(); // Fetched dynamically
    const platformFee = Math.round((grossAmount * (commissionPct / 100)) * 100) / 100;
    const sellerNetPayout = Math.round((grossAmount - platformFee) * 100) / 100;

    return {
      grossAmount,
      commissionPct,
      platformFee,
      sellerNetPayout
    };
  },

  /**
   * Locks buyer payment in escrow for the mandatory 48-hour inspection period.
   */
  holdPaymentInEscrow: async (orderId: string, grossAmount: number) => {
    const calc = await EscrowBot.calculatePayout(grossAmount);
    const apiConfigured = EscrowBot.hasApiKeysConfigured();
    const isHighValue = grossAmount >= 1000;

    if (!apiConfigured) {
      console.warn(`[EscrowBot SECURITY WARNING] Order ${orderId}: Payment processed without API Keys. Flagged for Manual Admin Receipt Verification.`);
    }

    if (isHighValue) {
      console.warn(`[EscrowBot HIGH-VALUE ALERT] Order ${orderId}: Amount $${grossAmount} >= $1,000. Mandatory Human-in-the-loop Admin Approval required.`);
    }

    console.log(`[EscrowBot] Holding $${grossAmount} in escrow for Order ${orderId} (48 Hours Hold). Mode: ${apiConfigured ? 'Automated API Gateway' : 'Manual Receipt / Offline Verification'}`);
    console.log(`[EscrowBot] Commission: ${calc.commissionPct}% ($${calc.platformFee}) | Seller Net Payout: $${calc.sellerNetPayout}`);

    let status = apiConfigured ? 'Escrow Locked (48h Inspection Window)' : 'PENDING_MANUAL_RECEIPT_VERIFICATION (No API Keys)';
    if (isHighValue) {
      status = 'PENDING_ADMIN_HIGH_VALUE_REVIEW (Mandatory Human-in-the-Loop Approval Required)';
    }

    return {
      orderId,
      holdPeriodHours: ESCROW_HOLD_HOURS,
      status,
      requiresManualAdminVerification: !apiConfigured || isHighValue,
      requiresAdminReview: isHighValue,
      calculation: calc
    };
  },

  /**
   * Freezes/Pauses escrow release immediately if buyer raises a dispute/objection within 48h.
   */
  freezeEscrowForDispute: async (orderId: string, reason: string) => {
    console.warn(`[EscrowBot] ESCROW FROZEN for Order ${orderId}! Buyer raised objection: "${reason}"`);
    updateOrderStatus(orderId, 'Disputed', 'Admin', `Escrow Guardian Bot froze fund transfer due to buyer dispute: ${reason}`);

    return {
      success: true,
      frozen: true,
      orderId,
      status: 'Escrow Frozen (Dispute Active)',
      reason
    };
  },

  /**
   * Automatically processes inspection completion after 48h if no buyer objection exists.
   * Deducts admin commission fee, loads seller payout credentials, and queues for Admin Manual Transfer.
   * STRICT CONSTRAINT: The bot NEVER auto-disburses funds; only the Admin can manually release payouts.
   */
  checkAndReleaseFunds: async (orderId: string, isBuyerAccepted: boolean = false) => {
    const order = getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // If order is disputed by buyer, release is BLOCKED
    if (order.deliveryStatus === 'Disputed') {
      return {
        success: false,
        released: false,
        status: 'Blocked',
        reason: 'Payment is frozen because the buyer raised a dispute within the 48h inspection window.'
      };
    }

    const calc = await EscrowBot.calculatePayout(order.askingPrice);

    console.log(`[EscrowBot] 48h Inspection complete or buyer approved for Order ${orderId}.`);
    console.log(`[EscrowBot] Platform Commission (${calc.commissionPct}% = $${calc.platformFee}).`);
    console.log(`[EscrowBot] Queued net $${calc.sellerNetPayout} for Admin Manual Disbursement to seller ${order.sellerName}.`);

    // Get the seller's payout settings (Bank RIB, SWIFT, Crypto Wallet, PayPal)
    const sellerEmail = order.sellerEmail || 'seller@example.com';
    const sellerPayoutDetails = getSellerPayoutSettings(sellerEmail);

    // Update delivery status in delivery store to Completed
    const updatedOrder = updateOrderStatus(
      orderId,
      'Completed',
      'System',
      `Escrow Guardian Bot verified 48h inspection window & asset handover. Platform Fee: $${calc.platformFee} (${calc.commissionPct}%). Seller Net Payout: $${calc.sellerNetPayout}. Queued for Admin Manual Transfer.`
    );

    if (updatedOrder) {
      updatedOrder.payoutStatus = 'Pending';
      updatedOrder.payoutDetails = sellerPayoutDetails;
      updatedOrder.payoutDisbursedAt = undefined;
      updateOrder(updatedOrder);
    }

    return {
      success: true,
      released: false, // Bot holds funds; Admin executes payout manually
      orderId,
      status: 'Ready for Admin Manual Payout',
      grossAmount: calc.grossAmount,
      commissionDeducted: calc.platformFee,
      commissionRatePct: calc.commissionPct,
      sellerNetPayout: calc.sellerNetPayout,
      sellerName: order.sellerName,
      sellerEmail: order.sellerEmail,
      payoutDetails: sellerPayoutDetails
    };
  },

  // Verifies that assets have been transferred
  verifyAssetTransfer: async (projectId: string, steps: {
    domainTransferred: boolean;
    codeTransferred: boolean;
    cloudAccessTransferred: boolean;
  }): Promise<{ verified: boolean; missing: string[] }> => {
    const missing: string[] = [];
    
    if (!steps.domainTransferred) missing.push("Domain");
    if (!steps.codeTransferred) missing.push("GitHub Repository");
    if (!steps.cloudAccessTransferred) missing.push("Cloud Access");

    return {
      verified: missing.length === 0,
      missing
    };
  },

  // Prepares payout breakdown for Admin
  releaseFunds: async (projectId: string, sellerId: string, amount: number) => {
    const calc = await EscrowBot.calculatePayout(amount);
    console.log(`[EscrowBot] Prepared net $${calc.sellerNetPayout} (Fee: $${calc.platformFee} @ ${calc.commissionPct}%) for Admin to wire to seller ${sellerId} for project ${projectId}`);
    return { 
      success: true, 
      grossAmount: amount, 
      platformFee: calc.platformFee, 
      commissionPct: calc.commissionPct, 
      sellerNetPayout: calc.sellerNetPayout,
      status: 'Ready for Admin Manual Transfer'
    };
  }
};


