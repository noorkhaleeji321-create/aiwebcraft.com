import { 
  OrderTransaction, 
  DeliveryStatus, 
  AssetDeliveryItem, 
  AuditLogRecord, 
  DisputeRecord, 
  Listing, 
  SellerProject 
} from '../types.js';
import { dispatchCustomEvent } from '../utils/eventBus.js';
import { safeFetchJson } from '../utils/api.js';

const DELIVERY_STORAGE_KEY = 'aiwebcrafter_delivery_orders_v1';

const INITIAL_ORDERS: OrderTransaction[] = [];

let isFetchingServerOrders = false;

export const clearAllOrders = () => {
  try {
    localStorage.removeItem(DELIVERY_STORAGE_KEY);
    localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.warn('Failed to clear delivery orders:', e);
  }
};

export const fetchServerOrders = async (userEmail?: string): Promise<OrderTransaction[]> => {
  try {
    const url = userEmail ? `/api/orders?email=${encodeURIComponent(userEmail)}` : '/api/orders';
    const res = await safeFetchJson(url);
    if (res.ok && res.data?.success && Array.isArray(res.data?.orders)) {
      const serverOrds: OrderTransaction[] = res.data.orders;
      if (serverOrds.length > 0) {
        const local = getStoredOrders();
        let changed = false;
        serverOrds.forEach(so => {
          const idx = local.findIndex(l => l.id === so.id);
          if (idx === -1) {
            local.unshift(so);
            changed = true;
          } else {
            local[idx] = { ...local[idx], ...so };
            changed = true;
          }
        });
        if (changed) {
          persistOrders(local);
          dispatchCustomEvent('orders-updated');
        }
        return local;
      }
    }
  } catch (err) {
    console.warn('Error fetching server orders:', err);
  }
  return getStoredOrders();
};

export const getStoredOrders = (): OrderTransaction[] => {
  try {
    const raw = localStorage.getItem(DELIVERY_STORAGE_KEY);
    if (raw) {
      const parsed: OrderTransaction[] = JSON.parse(raw);
      // Aggressively clean out test/demo orders
      const demoKeywords = [
        'ord-101', 'ord-102', 'ord-902', 'ord-903', 'ord-demo', 'lst-101', 'sp-201',
        'nexus', 'artisanal', 'contentgenie', 'luxeglow', 'omniseo', 'tarik', 'test',
        'demo', 'sami', 'benali', 'naciri', 'karim', 'sarah',
        'alex', 'mercer', 'flowai', 'fffffff', 'gggg', 'iawebcrafter', 'youssef', 'el amrani',
        'ord-977604', 'ord-830706', 'ord-279968', 'ord-951482', 'ord-544235', 'ord-639599'
      ];
      const cleaned = parsed.filter(o => {
        const idLower = (o.id || '').toLowerCase();
        const titleLower = (o.projectTitle || '').toLowerCase();
        const buyerLower = (o.buyerName || '').toLowerCase();
        const sellerLower = (o.sellerName || '').toLowerCase();
        const isDemo = demoKeywords.some(kw => 
          idLower.includes(kw) || 
          titleLower.includes(kw) || 
          buyerLower.includes(kw) || 
          sellerLower.includes(kw)
        );
        return !isDemo;
      });
      if (cleaned.length !== parsed.length) {
        persistOrders(cleaned);
      }

      // Trigger background sync with server orders if not already running
      if (!isFetchingServerOrders) {
        isFetchingServerOrders = true;
        safeFetchJson('/api/orders').then(res => {
          isFetchingServerOrders = false;
          if (res.ok && res.data?.success && Array.isArray(res.data?.orders)) {
            const serverOrds: OrderTransaction[] = res.data.orders;
            const currentLocal = getStoredOrders();
            let hasNew = false;
            serverOrds.forEach(so => {
              if (!currentLocal.some(cl => cl.id === so.id)) {
                currentLocal.unshift(so);
                hasNew = true;
              }
            });
            if (hasNew) {
              persistOrders(currentLocal);
              dispatchCustomEvent('orders-updated');
            }
          }
        }).catch(() => {
          isFetchingServerOrders = false;
        });
      }

      return cleaned;
    }
  } catch (e) {
    console.warn('Failed to parse delivery orders from localStorage:', e);
  }
  persistOrders([]);
  return [];
};

// Automatic continuous polling for real-time orders sync across browsers
if (typeof window !== 'undefined') {
  setInterval(() => {
    const userJson = localStorage.getItem('aiwebcrafter_local_user');
    let email = '';
    if (userJson) {
      try {
        const parsed = JSON.parse(userJson);
        email = parsed.email || '';
      } catch {}
    }
    fetchServerOrders(email).catch(() => {});
  }, 4000);
}

export const persistOrders = (orders: OrderTransaction[]) => {
  try {
    localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('Failed to save delivery orders to localStorage:', e);
  }
};

export const getOrderById = (id: string): OrderTransaction | undefined => {
  const orders = getStoredOrders();
  return orders.find((o) => o.id === id);
};

export const createOrderFromListing = (
  listing: Listing,
  buyerName: string,
  buyerEmail: string,
  paymentGateway?: 'paypal' | 'cmi'
): OrderTransaction => {
  const orders = getStoredOrders();
  const now = new Date().toISOString();

  // Anti-Double-Click Deduplication:
  // Check if an order for the same project and buyer email was created in the last 15 seconds
  const existingRecentOrder = orders.find((o) => {
    if (o.projectId !== listing.id) return false;
    if ((o.buyerEmail || '').toLowerCase() !== (buyerEmail || '').toLowerCase()) return false;
    const orderTime = new Date(o.createdAt).getTime();
    return (Date.now() - orderTime) < 15000; // 15 second deduplication window
  });

  if (existingRecentOrder) {
    console.warn(`[Anti-Double-Click] Deduplicating order creation for ${listing.title}. Returning existing order #${existingRecentOrder.id}`);
    return existingRecentOrder;
  }

  const orderId = `ord-${Date.now().toString().slice(-6)}`;

  const defaultAssets: AssetDeliveryItem[] = [
    {
      id: `ast-${Date.now()}-1`,
      type: 'Source Code',
      title: 'Full Source Code & Git Repository',
      description: 'Complete application source files, libraries, and version history.',
      status: 'Pending'
    },
    {
      id: `ast-${Date.now()}-2`,
      type: 'Database',
      title: 'Production Database & Schema Export',
      description: 'Database backup dump, migrations, and schema definitions.',
      status: 'Pending'
    },
    {
      id: `ast-${Date.now()}-3`,
      type: 'Domain Transfer',
      title: 'Primary Domain Registrar Transfer / Auth Code',
      description: 'Ownership transfer authorization key for domain registrar.',
      status: 'Pending'
    },
    {
      id: `ast-${Date.now()}-4`,
      type: 'Credentials & Vault',
      title: 'Hosting & Service API Keys (Secure Vault)',
      description: 'Production credentials, API tokens, and cloud account access.',
      status: 'Pending',
      isSecret: true
    },
    {
      id: `ast-${Date.now()}-5`,
      type: 'Documentation',
      title: 'Operational Manual & Handover Guide',
      description: 'Runbook detailing deployment, architecture, and maintenance instructions.',
      status: 'Pending'
    }
  ];

  const realSellerEmail = (listing as any).ownerEmail || (listing as any).sellerEmail || listing.seller?.email || 'seller@example.com';

  const newOrder: OrderTransaction = {
    id: orderId,
    projectId: listing.id,
    projectTitle: listing.title,
    projectImage: listing.imageUrl,
    askingPrice: listing.askingPrice,
    currency: 'USD',
    buyerId: `usr-${Date.now().toString().slice(-4)}`,
    buyerName: buyerName || 'Verified Buyer',
    buyerEmail: buyerEmail || 'buyer@example.com',
    sellerId: listing.seller.id || 'sel-current-user',
    sellerName: listing.seller.name || 'Verified Seller',
    sellerEmail: realSellerEmail,
    deliveryStatus: 'Awaiting Payment',
    createdAt: now,
    updatedAt: now,
    termsAccepted: true,
    termsAcceptedAt: now,
    paymentReference: `ESCROW-PENDING-${orderId.toUpperCase()}`,
    paymentGateway,
    ownershipDeclaration: {
      declared: true,
      declaredBy: listing.seller.name || 'Seller',
      declaredAt: listing.createdAt || now,
      ownershipTermsAccepted: true,
      declarationText: `Seller certified full legal title and ownership of ${listing.title}.`,
      ipCheckVerified: listing.verification?.codebaseVerified ?? false
    },
    assets: defaultAssets,
    auditLogs: [
      {
        id: `log-${Date.now()}-1`,
        timestamp: now,
        actor: 'Buyer',
        action: 'Purchase Terms Accepted & Order Initiated',
        details: `${buyerName} accepted Terms of Sale & Delivery Policy for ${listing.title} ($${(listing?.askingPrice || 0).toLocaleString()}).`
      },
      {
        id: `log-${Date.now()}-2`,
        timestamp: now,
        actor: 'System',
        action: 'Delivery Checklist Initialized',
        details: 'Initialized 5 asset delivery items awaiting seller upload.'
      }
    ]
  };

  orders.unshift(newOrder);
  persistOrders(orders);

  // Sync with central server & Supabase immediately
  safeFetchJson('/api/orders/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: newOrder })
  }).then(() => {
    dispatchCustomEvent('orders-updated');
    dispatchCustomEvent('projects_updated');
  }).catch((err) => {
    console.warn('Error saving order to server:', err);
    dispatchCustomEvent('orders-updated');
    dispatchCustomEvent('projects_updated');
  });

  dispatchCustomEvent('orders-updated');
  return newOrder;
};

export const updateOrderStatus = (
  orderId: string,
  newStatus: DeliveryStatus,
  actor: 'Seller' | 'Buyer' | 'Admin' | 'Payment Gateway' | 'System',
  details: string
): OrderTransaction | undefined => {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const order = orders[idx];

  const newLog: AuditLogRecord = {
    id: `log-${Date.now()}`,
    timestamp: now,
    actor,
    action: `Status updated to ${newStatus}`,
    details
  };

  const updated: OrderTransaction = {
    ...order,
    deliveryStatus: newStatus,
    updatedAt: now,
    auditLogs: [newLog, ...order.auditLogs]
  };

  orders[idx] = updated;
  persistOrders(orders);
  return updated;
};

export const updateOrder = (updatedOrder: OrderTransaction): void => {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === updatedOrder.id);
  if (idx >= 0) {
    orders[idx] = updatedOrder;
    persistOrders(orders);
    dispatchCustomEvent('orders-updated');
  }
};

export const deliverAssetItem = (
  orderId: string,
  assetId: string,
  deliverableValue: string,
  notes?: string
): OrderTransaction | undefined => {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const order = orders[idx];

  const updatedAssets = order.assets.map((ast) => {
    if (ast.id === assetId) {
      return {
        ...ast,
        status: 'Delivered' as const,
        deliverableValue,
        notes: notes || ast.notes,
        deliveredAt: now
      };
    }
    return ast;
  });

  const assetItem = order.assets.find((a) => a.id === assetId);
  const assetTitle = assetItem ? assetItem.title : 'Asset';

  const newLog: AuditLogRecord = {
    id: `log-${Date.now()}`,
    timestamp: now,
    actor: 'Seller',
    action: `Delivered Asset: ${assetTitle}`,
    details: `Seller delivered asset payload/credentials for ${assetTitle}.`
  };

  // Check if all assets are now delivered
  const allDelivered = updatedAssets.every((a) => a.status === 'Delivered');
  const newStatus: DeliveryStatus = allDelivered ? 'Buyer Inspection' : 'Delivery Pending';

  const updated: OrderTransaction = {
    ...order,
    assets: updatedAssets,
    deliveryStatus: newStatus,
    updatedAt: now,
    auditLogs: [newLog, ...order.auditLogs]
  };

  orders[idx] = updated;
  persistOrders(orders);
  return updated;
};

export const markAllAssetsDelivered = (
  orderId: string
): OrderTransaction | undefined => {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const order = orders[idx];

  const updatedAssets = order.assets.map((ast) => ({
    ...ast,
    status: 'Delivered' as const,
    deliveredAt: ast.deliveredAt || now,
    deliverableValue: ast.deliverableValue || 'https://vault.aiwebcrafter.com/assets/' + ast.id
  }));

  const newLog: AuditLogRecord = {
    id: `log-${Date.now()}`,
    timestamp: now,
    actor: 'Seller',
    action: 'Marked All Assets Delivered',
    details: 'Seller confirmed complete handover of all project assets. Moved order to Buyer Inspection.'
  };

  const updated: OrderTransaction = {
    ...order,
    assets: updatedAssets,
    deliveryStatus: 'Buyer Inspection',
    updatedAt: now,
    auditLogs: [newLog, ...order.auditLogs]
  };

  orders[idx] = updated;
  persistOrders(orders);
  return updated;
};

export const acceptDelivery = (
  orderId: string,
  buyerName: string
): OrderTransaction | undefined => {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const order = orders[idx];

  const updatedAssets = order.assets.map((ast) => ({
    ...ast,
    status: 'Verified' as const,
    verifiedAt: now
  }));

  const log1: AuditLogRecord = {
    id: `log-${Date.now()}-1`,
    timestamp: now,
    actor: 'Buyer',
    action: 'Delivery Accepted',
    details: `${buyerName} verified all delivered assets and accepted the delivery.`
  };

  const log2: AuditLogRecord = {
    id: `log-${Date.now()}-2`,
    timestamp: now,
    actor: 'Payment Gateway',
    action: 'Escrow Funds Released & Deal Completed',
    details: `Escrow release triggered ($${(order?.askingPrice || 0).toLocaleString()}). Ownership transfer officially completed.`
  };

  const updated: OrderTransaction = {
    ...order,
    assets: updatedAssets,
    deliveryStatus: 'Completed',
    updatedAt: now,
    auditLogs: [log2, log1, ...order.auditLogs]
  };

  orders[idx] = updated;
  persistOrders(orders);
  return updated;
};

export const openDispute = (
  orderId: string,
  reason: string,
  evidenceDetails: string,
  buyerName: string
): OrderTransaction | undefined => {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const order = orders[idx];

  const dispute: DisputeRecord = {
    id: `disp-${Date.now()}`,
    orderId,
    status: 'Open',
    reason,
    evidenceDetails,
    openedAt: now,
    openedBy: buyerName
  };

  const newLog: AuditLogRecord = {
    id: `log-${Date.now()}`,
    timestamp: now,
    actor: 'Buyer',
    action: 'Dispute Raised',
    details: `Buyer ${buyerName} opened a formal dispute: "${reason}". Evidence logged.`
  };

  const updated: OrderTransaction = {
    ...order,
    deliveryStatus: 'Disputed',
    dispute,
    updatedAt: now,
    auditLogs: [newLog, ...order.auditLogs]
  };

  orders[idx] = updated;
  persistOrders(orders);
  return updated;
};

export const resolveDispute = (
  orderId: string,
  resolutionNotes: string,
  adminName: string,
  outcome: 'CompleteDeal' | 'RefundBuyer'
): OrderTransaction | undefined => {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const order = orders[idx];

  const updatedDispute: DisputeRecord | undefined = order.dispute
    ? {
        ...order.dispute,
        status: 'Resolved',
        resolvedAt: now,
        resolvedBy: adminName,
        resolutionNotes
      }
    : undefined;

  const newStatus: DeliveryStatus = outcome === 'CompleteDeal' ? 'Completed' : 'Awaiting Payment';

  const newLog: AuditLogRecord = {
    id: `log-${Date.now()}`,
    timestamp: now,
    actor: 'Admin',
    action: `Dispute Resolved (${outcome})`,
    details: `Admin ${adminName} resolved dispute. Note: ${resolutionNotes}`
  };

  const updated: OrderTransaction = {
    ...order,
    deliveryStatus: newStatus,
    dispute: updatedDispute,
    updatedAt: now,
    auditLogs: [newLog, ...order.auditLogs]
  };

  orders[idx] = updated;
  persistOrders(orders);
  return updated;
};

export const simulatePaymentConfirmation = (
  orderId: string
): OrderTransaction | undefined => {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const order = orders[idx];

  const log1: AuditLogRecord = {
    id: `log-${Date.now()}-1`,
    timestamp: now,
    actor: 'Payment Gateway',
    action: 'Payment Confirmed & Funds In Escrow',
    details: `Simulated Escrow webhook confirmed receipt of $${(order?.askingPrice || 0).toLocaleString()}.`
  };

  const updated: OrderTransaction = {
    ...order,
    deliveryStatus: 'Delivery Pending',
    paymentReference: `ESCROW-CONFIRMED-${Date.now().toString().slice(-6)}`,
    updatedAt: now,
    auditLogs: [log1, ...order.auditLogs]
  };

  orders[idx] = updated;
  persistOrders(orders);
  return updated;
};

export const disburseAdminPayout = (
  orderId: string,
  transferReference: string,
  receiptUrl?: string,
  notes?: string
): OrderTransaction | undefined => {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const order = orders[idx];

  const log: AuditLogRecord = {
    id: `log-${Date.now()}`,
    timestamp: now,
    actor: 'Admin',
    action: 'Manual Seller Payout Executed',
    details: `Admin confirmed manual fund transfer to seller. Ref: ${transferReference}${notes ? ` | Note: ${notes}` : ''}`
  };

  const updated: OrderTransaction = {
    ...order,
    payoutStatus: 'Disbursed',
    payoutDisbursedAt: now,
    payoutReceiptUrl: receiptUrl || order.payoutReceiptUrl,
    paymentReference: transferReference,
    auditLogs: [log, ...order.auditLogs]
  };

  orders[idx] = updated;
  persistOrders(orders);
  dispatchCustomEvent('orders-updated');
  return updated;
};

