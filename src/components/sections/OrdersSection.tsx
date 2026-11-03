import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Eye, Filter, CheckCircle2, Clock, Truck, Check, AlertCircle, AlertTriangle, X, RefreshCw, Trash2 } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { Language } from '../../locales/translations';
import {
  getPermanentStorageOrders,
  updatePermanentStorageOrderStatus,
  clearPermanentStorageOrders,
  deletePermanentStorageOrder
} from '../../services/gitStorageClient';
import { ConfirmModal } from '../ConfirmModal';

interface OrdersSectionProps {
  orders: Order[];
  lang: Language;
  onRefresh: () => void;
}

export const OrdersSection: React.FC<OrdersSectionProps> = ({
  orders: initialOrders,
  lang,
  onRefresh
}) => {
  const [ordersList, setOrdersList] = useState<Order[]>(initialOrders);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch orders directly from Backend Storage API (/api/backend/storage/orders)
  const fetchBackendOrders = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const orders = await getPermanentStorageOrders();
      setOrdersList(orders);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load orders from backend storage.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendOrders();
  }, []);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: () => {}
  });

  const handleClearAllOrders = () => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف جميع الطلبات (Clear All Orders)',
      message: 'wach fiحlan bghiti tmsa7 ga3 talabatt lwahmiya/ttajribiya mn lmatjar؟ (Are you sure you want to clear all sample orders?)',
      confirmText: 'نعم، امسح الكل (Yes, Clear All)',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        setFeedback(null);
        const result = await clearPermanentStorageOrders();
        if (result.success) {
          setFeedback({
            type: 'success',
            message: `Sample orders cleared successfully (${result.cleared_count || 0} items removed).`
          });
          await fetchBackendOrders();
          onRefresh();
        } else {
          setFeedback({
            type: 'error',
            message: result.error || 'Failed to clear sample orders.'
          });
          setIsLoading(false);
        }
      }
    });
  };

  const handleDeleteOrder = (id: number, orderNumber: string) => {
    setConfirmModal({
      isOpen: true,
      title: lang === 'ar' ? 'حذف الطلب (Delete Order)' : 'Delete Order',
      message: lang === 'ar' 
        ? `hall fi3lan bgheti tmsa7 order "${orderNumber}"؟` 
        : `Are you sure you want to delete order "${orderNumber}"?`,
      confirmText: lang === 'ar' ? 'نعم، امسح (Yes, Delete)' : 'Delete',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setUpdatingId(id); // Reuse updatingId as a loading state for the row
        setFeedback(null);

        const result = await deletePermanentStorageOrder(id);
        setUpdatingId(null);

        if (result.success) {
          setFeedback({
            type: 'success',
            message: `Order #${orderNumber} was successfully deleted from Backend Permanent Storage.`
          });
          await fetchBackendOrders();
          onRefresh();
        } else {
          setFeedback({
            type: 'error',
            message: result.error || `Failed to delete order #${orderNumber}.`
          });
        }
      }
    });
  };

  const filteredOrders = ordersList.filter((o) => {
    const matchesStatus = selectedStatus === 'all' || o.order_status === selectedStatus;
    const matchesSearch =
      (o.order_number && o.order_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.customer_phone && o.customer_phone.includes(searchTerm)) ||
      (o.city && o.city.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Handle Order Status Update (Delegated entirely to Backend)
  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setFeedback(null);

    const result = await updatePermanentStorageOrderStatus(orderId, newStatus);
    setUpdatingId(null);

    if (result.success && result.data) {
      // Confirmed by backend
      setOrdersList((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
      );
      if (activeOrder?.id === orderId) {
        setActiveOrder({ ...activeOrder, order_status: newStatus });
      }
      setFeedback({
        type: 'success',
        message: `Order #${orderId} status successfully updated to "${newStatus}" in Backend Storage.`
      });
      onRefresh();
    } else {
      // Failed - do NOT update status in UI
      setFeedback({
        type: 'error',
        message: result.error || `Failed to update status for order #${orderId}. Operation rejected by Backend.`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              BACKEND STORAGE: /api/backend/storage/orders
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-emerald-400 font-mono tabular-nums">{ordersList.length} Orders Saved</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Customer Orders & Fulfillment Database
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ingestion endpoint from your external store checkout. Customer contact, address, and line items are stored securely.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleClearAllOrders}
            disabled={isLoading || ordersList.length === 0}
            className="px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-30"
            title="Clear sample test orders"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{lang === 'ar' ? 'مسح الطلبات الوهمية' : 'Clear Sample Orders'}</span>
          </button>

          <button
            onClick={fetchBackendOrders}
            disabled={isLoading}
            className="p-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            title="Refresh from Backend Storage"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-white/10 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Network / Permission / Storage Error Alert */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Orders Storage Connection Error</div>
              <div className="text-rose-300/90 text-[11px] mt-0.5">{fetchError}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {fetchError.toLowerCase().includes('permission') || fetchError.toLowerCase().includes('authentication') ? (
              <button
                onClick={() => {
                  localStorage.removeItem('aiwebcrafter_authenticated');
                  window.location.reload();
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>{lang === 'ar' ? 'تسجيل الدخول لتجديد الجلسة' : 'Log In (Refresh Session)'}</span>
              </button>
            ) : null}
            <button
              onClick={fetchBackendOrders}
              className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order #, customer, phone, or city..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Statuses ({ordersList.length})</option>
            <option value="pending">Pending ({ordersList.filter((o) => o.order_status === 'pending').length})</option>
            <option value="processing">Processing ({ordersList.filter((o) => o.order_status === 'processing').length})</option>
            <option value="shipped">Shipped ({ordersList.filter((o) => o.order_status === 'shipped').length})</option>
            <option value="delivered">Delivered ({ordersList.filter((o) => o.order_status === 'delivered').length})</option>
            <option value="cancelled">Cancelled ({ordersList.filter((o) => o.order_status === 'cancelled').length})</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
            <div className="text-xs text-purple-300 font-mono">
              Loading orders from Backend Storage (/api/backend/storage/orders)...
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/80 text-slate-400 font-medium border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-3 py-3">Customer & Destination</th>
                  <th className="px-3 py-3">Payment Method</th>
                  <th className="px-3 py-3 text-right">Total (MAD)</th>
                  <th className="px-3 py-3 text-center">Order Status</th>
                  <th className="px-3 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((ord) => {
                    const isUpdating = updatingId === ord.id;
                    return (
                      <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-purple-300 text-xs">
                          {ord.order_number}
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-medium text-white">{ord.customer_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {ord.customer_phone} · {ord.city}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-slate-300 text-[11px]">
                          {ord.payment_method}
                        </td>

                        <td className="px-3 py-3 text-right font-mono font-bold text-white tabular-nums">
                          {ord.total_amount} {ord.currency}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <select
                              value={ord.order_status}
                              disabled={isUpdating}
                              onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
                              className={`text-[11px] font-medium px-2 py-1 rounded bg-slate-900 border cursor-pointer capitalize disabled:opacity-50 ${
                                ord.order_status === 'delivered'
                                  ? 'text-emerald-400 border-emerald-800/60'
                                  : ord.order_status === 'shipped'
                                  ? 'text-sky-400 border-sky-800/60'
                                  : ord.order_status === 'processing'
                                  ? 'text-amber-400 border-amber-800/60'
                                  : ord.order_status === 'cancelled'
                                  ? 'text-rose-400 border-rose-800/60'
                                  : 'text-purple-300 border-purple-800/60'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {isUpdating && <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-slate-400 text-[11px] font-mono">
                          {new Date(ord.created_at).toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActiveOrder(ord)}
                              className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded text-[11px] flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-purple-400" />
                              <span className="hidden sm:inline">View Items</span>
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(ord.id, ord.order_number)}
                              disabled={isUpdating}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-30"
                              title="Delete Order Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-xs text-slate-500 space-y-2">
                      <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto stroke-[1.5]" />
                      <div className="text-slate-300 font-medium">No Orders Found</div>
                      <div className="text-slate-500 max-w-sm mx-auto">
                        {searchTerm || selectedStatus !== 'all'
                          ? 'No orders match your filter criteria.'
                          : 'Your store has not received any orders yet. New orders will appear here automatically.'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  {activeOrder.order_number}
                </h3>
                <div className="text-[11px] text-slate-400">
                  Placed on {new Date(activeOrder.created_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Customer Delivery Card */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="font-semibold text-slate-300 mb-1 text-[11px] uppercase tracking-wider">
                  Customer & Shipping Destination
                </div>
                <div className="text-white font-medium">{activeOrder.customer_name}</div>
                <div className="text-slate-400 font-mono text-[11px]">{activeOrder.customer_phone}</div>
                {activeOrder.customer_email && (
                  <div className="text-slate-400 font-mono text-[11px]">{activeOrder.customer_email}</div>
                )}
                <div className="text-purple-300 mt-1">
                  {activeOrder.shipping_address}, {activeOrder.city}
                </div>
                {activeOrder.notes && (
                  <div className="text-amber-300/80 mt-1 italic text-[11px]">
                    Note: "{activeOrder.notes}"
                  </div>
                )}
              </div>

              {/* Order Items Table */}
              <div>
                <div className="font-semibold text-slate-300 mb-2 text-[11px] uppercase tracking-wider">
                  Order Items ({activeOrder.items?.length || 0})
                </div>
                <div className="rounded-lg border border-slate-800 overflow-hidden divide-y divide-slate-800">
                  {activeOrder.items && activeOrder.items.length > 0 ? (
                    activeOrder.items.map((item, idx) => (
                      <div key={item.product_id || idx} className="p-2.5 flex items-center justify-between bg-slate-950/40">
                        <div>
                          <div className="font-medium text-white">{item.product_name}</div>
                          <div className="text-[10px] font-mono text-slate-500">SKU: {item.sku}</div>
                        </div>
                        <div className="text-right font-mono tabular-nums">
                          <div className="text-white">
                            {item.quantity} × {item.unit_price} MAD
                          </div>
                          <div className="text-purple-300 text-[11px] font-bold">
                            = {item.line_total} MAD
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-slate-500">No items loaded.</div>
                  )}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
                <div className="text-slate-300 font-medium">Grand Total (Server Calculated)</div>
                <div className="text-lg font-bold font-mono text-white tabular-nums">
                  {activeOrder.total_amount} {activeOrder.currency}
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setActiveOrder(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
