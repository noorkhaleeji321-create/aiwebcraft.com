import React, { useState } from 'react';
import { Users, Search, Phone, Mail, MapPin, Eye, ShoppingBag } from 'lucide-react';
import { Customer } from '../../types';
import { Language } from '../../locales/translations';

interface CustomersSectionProps {
  customers: Customer[];
  lang: Language;
}

export const CustomersSection: React.FC<CustomersSectionProps> = ({ customers, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#0B0F19] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              CUSTOMER IDENTITY & PROFILES
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-emerald-400 font-mono tabular-nums">{customers.length} Verified Records</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Customer Directory & Delivery Records
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Customer records aggregated from orders submitted by your external e-commerce store with lifetime order metrics.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-xl bg-[#0B0F19] border border-slate-800 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name, phone, city, or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/80 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-3 py-3">Phone Number</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">City / Region</th>
                <th className="px-3 py-3 text-center">Orders</th>
                <th className="px-3 py-3 text-right">Total Spent</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">
                      {c.first_name} {c.last_name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">ID: {c.uuid}</div>
                  </td>
                  <td className="px-3 py-3 font-mono text-purple-300 text-[11px]">{c.phone}</td>
                  <td className="px-3 py-3 text-slate-300 font-mono text-[11px]">{c.email}</td>
                  <td className="px-3 py-3 text-slate-300">{c.city}, {c.country}</td>
                  <td className="px-3 py-3 text-center font-mono tabular-nums text-white">
                    {c.total_orders || 1}
                  </td>
                  <td className="px-3 py-3 text-right font-mono tabular-nums font-bold text-white">
                    {c.total_spent || 0} MAD
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedCust(c)}
                      className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded text-[11px] cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {selectedCust && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                Customer Record: {selectedCust.first_name} {selectedCust.last_name}
              </h3>
              <button
                onClick={() => setSelectedCust(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 text-slate-300">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-500">Contact Details:</div>
                <div className="font-mono text-white">{selectedCust.phone}</div>
                <div className="font-mono text-purple-300">{selectedCust.email}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-500">Delivery Address:</div>
                <div className="text-white">{selectedCust.address_line1}</div>
                <div>{selectedCust.city}, {selectedCust.state_region} {selectedCust.postal_code}</div>
                <div className="text-slate-400">{selectedCust.country}</div>
              </div>

              {selectedCust.notes && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-500">Notes:</div>
                  <div className="text-slate-200 mt-0.5">{selectedCust.notes}</div>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedCust(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
