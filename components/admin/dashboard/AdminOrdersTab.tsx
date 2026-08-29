import React from 'react';
import { Package } from 'lucide-react';
import { OrderTransaction } from '../../../types';
import { clearAllOrders } from '../../../services/deliveryStore';

interface AdminOrdersTabProps {
  orders: OrderTransaction[];
  setOrders: (orders: OrderTransaction[]) => void;
  loadAdminData: () => void;
  formatCurrency: (val: number) => string;
  totalOrderValue: number;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  orders,
  setOrders,
  loadAdminData,
  formatCurrency,
  totalOrderValue
}) => {
  return (
    <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Marketplace Orders Log</h2>
          <p className="text-xs text-[#5D5A53]">All escrow purchase transactions across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold border border-emerald-300">
            GMV: {formatCurrency(totalOrderValue)}
          </span>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all orders log?")) {
                clearAllOrders();
                setOrders([]);
                loadAdminData();
              }
            }}
            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 transition-colors"
          >
            Clear Orders Log
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl">
          <Package className="w-10 h-10 text-[#8C8275] mx-auto" />
          <h3 className="font-serif font-bold text-lg text-[#2C2A26]">No Orders Placed Yet</h3>
          <p className="text-xs text-[#5D5A53]">The orders registry is empty. New purchase orders will be logged here in real-time.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#2C2A26]">
            <thead className="bg-[#F5F2EB] border-b border-[#E2DDD3] text-[#8C8275] font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Project Title</th>
                <th className="p-3">Buyer</th>
                <th className="p-3">Seller</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD3]">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FDFCF9]">
                  <td className="p-3 font-mono font-bold text-[#2C2A26]">{ord?.id}</td>
                  <td className="p-3 font-bold">{ord?.projectTitle}</td>
                  <td className="p-3">{ord?.buyerName}</td>
                  <td className="p-3">{ord?.sellerName}</td>
                  <td className="p-3 font-serif font-bold text-[#2C2A26]">${(ord?.askingPrice || 0).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      ord?.deliveryStatus === 'Completed' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                      ord?.deliveryStatus === 'Disputed' ? 'bg-red-100 text-red-900 border-red-300' :
                      'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {ord?.deliveryStatus || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
