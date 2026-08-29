import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  FileCheck, 
  DollarSign, 
  User, 
  History, 
  Send,
  Lock,
  ChevronRight,
  Landmark,
  Wallet,
  Receipt,
  Sparkles
} from 'lucide-react';
import { OrderTransaction, DeliveryStatus } from '../../types';
import { getStoredOrders, resolveDispute, updateOrderStatus, disburseAdminPayout } from '../../services/deliveryStore';
import { getSellerPayoutSettings } from '../../services/sellerStore';
import { useCommissionPercentage } from '../../services/supabaseService';

export const AdminDeliveryManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderTransaction[]>(getStoredOrders());
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOrder, setActiveOrder] = useState<OrderTransaction | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  
  // Manual payout action state
  const [transferRefInput, setTransferRefInput] = useState('');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState(false);

  const commissionPct = useCommissionPercentage();

  const refreshOrders = () => {
    setOrders(getStoredOrders());
  };

  const filteredOrders = (orders || []).filter((o) => {
    if (!o) return false;
    const matchesStatus = selectedStatus === 'All' || o.deliveryStatus === selectedStatus;
    const matchesSearch =
      (o.projectTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.buyerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.sellerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleResolve = (outcome: 'CompleteDeal' | 'RefundBuyer') => {
    if (!activeOrder) return;
    const updated = resolveDispute(
      activeOrder.id,
      resolutionNotes || `Admin resolved dispute: ${outcome}`,
      'System Admin',
      outcome
    );
    if (updated) {
      refreshOrders();
      setActiveOrder(updated);
      setResolutionNotes('');
    }
  };

  const handleApproveLocalPayment = () => {
    if (!activeOrder) return;
    const updated = updateOrderStatus(
      activeOrder.id,
      'Delivery Pending',
      'Admin',
      'Admin verified Moroccan bank wire transfer (CIH/Attijariwafa) manually. Authorized escrow activation.'
    );
    if (updated) {
      refreshOrders();
      setActiveOrder(updated);
    }
  };

  const handleManualPayoutDisburse = (orderId: string) => {
    if (!transferRefInput.trim()) {
      alert('Please enter the Bank Wire Reference ID or Transaction Hash before confirming.');
      return;
    }
    const updated = disburseAdminPayout(
      orderId,
      transferRefInput.trim(),
      undefined,
      'Admin confirmed manual wire transfer to seller bank/crypto account.'
    );
    if (updated) {
      refreshOrders();
      setActiveOrder(updated);
      setTransferRefInput('');
      setTransferSuccessMsg(true);
      setTimeout(() => setTransferSuccessMsg(false), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#E2DDD3] rounded-2xl">
          <span className="text-[10px] text-[#8C8275] font-bold uppercase block">Total Deals</span>
          <span className="font-serif font-bold text-2xl text-[#2C2A26]">{orders.length}</span>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <span className="text-[10px] text-amber-900 font-bold uppercase block">In Delivery / Inspection</span>
          <span className="font-serif font-bold text-2xl text-amber-950">
            {(orders || []).filter((o) => o?.deliveryStatus === 'Delivery Pending' || o?.deliveryStatus === 'Buyer Inspection').length}
          </span>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
          <span className="text-[10px] text-red-900 font-bold uppercase block">Active Disputes</span>
          <span className="font-serif font-bold text-2xl text-red-950">
            {(orders || []).filter((o) => o?.deliveryStatus === 'Disputed').length}
          </span>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <span className="text-[10px] text-emerald-900 font-bold uppercase block">Completed Escrow Value</span>
          <span className="font-serif font-bold text-2xl text-emerald-950">
            ${(orders || [])
              .filter((o) => o?.deliveryStatus === 'Completed')
              .reduce((sum, o) => sum + (o?.askingPrice || 0), 0)
              .toLocaleString()}
          </span>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2DDD3] p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C8275] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transactions by project, buyer, seller, or Order ID..."
            className="w-full pl-9 pr-4 py-2 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs text-[#2C2A26] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Awaiting Payment', 'Delivery Pending', 'Buyer Inspection', 'Disputed', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedStatus === st
                  ? 'bg-[#2C2A26] text-white shadow-sm'
                  : 'bg-[#FDFCF9] border border-[#E2DDD3] text-[#5D5A53] hover:border-[#2C2A26]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* TRANSACTIONS TABLE & DETAIL INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#E2DDD3] rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#2C2A26] border-b border-[#E2DDD3] pb-3">
            Escrow Transactions & Delivery Audit ({filteredOrders.length})
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#8C8275]">
                No transactions found matching filter parameters.
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = activeOrder?.id === ord.id;
                const isDisbursed = ord.payoutStatus === 'Disbursed';

                return (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setActiveOrder(ord);
                      setTransferRefInput(ord.paymentReference || '');
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                      isSelected
                        ? 'bg-amber-50/50 border-amber-400 shadow-md'
                        : 'bg-[#FDFCF9] border-[#E2DDD3] hover:border-[#2C2A26]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#8C8275]">#{ord?.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                          ord?.deliveryStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : ord?.deliveryStatus === 'Disputed'
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {ord?.deliveryStatus || 'Pending'}
                        </span>
                      </div>
                      <span className="font-serif font-bold text-sm text-[#2C2A26]">
                        ${(ord?.askingPrice || 0).toLocaleString()} {ord?.currency || 'USD'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-sm text-[#2C2A26]">{ord.projectTitle}</h4>
                      <ChevronRight className="w-4 h-4 text-[#8C8275]" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#5D5A53] pt-1 border-t border-[#E2DDD3]">
                      <span>Buyer: <strong>{ord.buyerName}</strong></span>
                      <span>Seller: <strong>{ord.sellerName}</strong></span>
                    </div>

                    {ord.deliveryStatus === 'Completed' && (
                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-[#8C8275]">Seller Payout:</span>
                        <span className={`font-bold px-2 py-0.5 rounded-md ${
                          isDisbursed ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-100 text-amber-900 animate-pulse'
                        }`}>
                          {isDisbursed ? '✓ Transferred by Admin' : '⚡ Awaiting Admin Manual Payout'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT SIDE: SELECTED TRANSACTION AUDIT & ESCROW GUARDIAN PAYOUT DETAILS */}
        <div className="lg:col-span-7 bg-white border border-[#E2DDD3] rounded-3xl p-6 shadow-sm space-y-6">
          {activeOrder ? (
            <div className="space-y-5">
              <div className="border-b border-[#E2DDD3] pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#8C8275]">Order #{activeOrder.id}</span>
                  <h3 className="font-serif font-bold text-base text-[#2C2A26]">
                    {activeOrder.projectTitle}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#8C8275] block">Total Order Price</span>
                  <span className="font-serif font-bold text-lg text-[#2C2A26]">
                    ${(activeOrder.askingPrice || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* ESCROW GUARDIAN BOT: SELLER PAYOUT WORKSPACE & BANK INFO */}
              {activeOrder.deliveryStatus === 'Completed' && (
                <div className="p-5 bg-gradient-to-br from-emerald-50/90 to-[#FAF8F5] border-2 border-emerald-300 rounded-3xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                      <span>Escrow Guardian • Seller Payout Verification Hub</span>
                    </div>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-950 px-2.5 py-1 rounded-full font-bold">
                      48H Inspection Completed
                    </span>
                  </div>

                  <p className="text-xs text-[#5D5A53]">
                    <strong>Escrow Guardian Bot</strong> verified buyer asset receipt and completed the 48-hour inspection window with zero open disputes. Below are the verified seller payout credentials and net amount to disburse:
                  </p>

                  {/* Financial calculation breakdown */}
                  {(() => {
                    const gross = activeOrder.askingPrice || 0;
                    const fee = Math.round(gross * (commissionPct / 100) * 100) / 100;
                    const net = Math.round((gross - fee) * 100) / 100;
                    const madApprox = Math.round(net * 10); // Approximation in MAD

                    return (
                      <div className="grid grid-cols-3 gap-2 text-center bg-white border border-emerald-200 p-3 rounded-2xl">
                        <div>
                          <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Gross Amount</span>
                          <span className="text-xs font-bold text-[#2C2A26]">${gross.toLocaleString()}</span>
                        </div>
                        <div className="border-x border-emerald-100">
                          <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Platform Fee ({commissionPct}%)</span>
                          <span className="text-xs font-bold text-rose-700">-${fee.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-emerald-800 uppercase block">Seller Net Payout</span>
                          <span className="text-sm font-serif font-extrabold text-emerald-800">${net.toLocaleString()}</span>
                          <span className="text-[9px] text-[#8C8275] block">~ {madApprox.toLocaleString()} DH</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Seller Bank / Receiving Credentials */}
                  {(() => {
                    const settings = activeOrder.payoutDetails || getSellerPayoutSettings(activeOrder.sellerEmail || 'seller@example.com');
                    const method = settings?.payoutMethod || 'bank';

                    return (
                      <div className="p-4 bg-white border border-emerald-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-2 text-xs font-bold text-[#2C2A26]">
                          <div className="flex items-center gap-2">
                            <Landmark className="w-4 h-4 text-emerald-700" />
                            <span>
                              {method === 'bank' && 'Bank Wire / RIB Account Information'}
                              {method === 'crypto' && 'Crypto Wallet (USDT / USDC)'}
                              {method === 'paypal' && 'Seller PayPal Account'}
                              {method === 'paddle' && 'Seller Paddle Merchant Account'}
                            </span>
                          </div>
                          <span className="text-[10px] font-normal text-[#8C8275]">
                            Seller: <strong>{activeOrder.sellerName}</strong> ({activeOrder.sellerEmail || 'seller@example.com'})
                          </span>
                        </div>

                        {method === 'bank' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-2 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3]">
                              <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Bank Name</span>
                              <span className="font-bold text-[#2C2A26]">{settings.bankName || 'CIH / Attijariwafa Bank'}</span>
                            </div>
                            <div className="p-2 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3]">
                              <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Beneficiary Name</span>
                              <span className="font-bold text-[#2C2A26]">{settings.bankAccountHolder || activeOrder.sellerName}</span>
                            </div>
                            <div className="p-2 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3] sm:col-span-2">
                              <span className="text-[9px] font-bold text-[#8C8275] uppercase block">RIB (24-Digits) / IBAN</span>
                              <span className="font-mono font-bold text-xs text-emerald-950 select-all block bg-white p-1.5 rounded border border-emerald-100 mt-1">
                                {settings.bankIban || '007 780 0001234567890123 45'}
                              </span>
                            </div>
                            {settings.bankSwift && (
                              <div className="p-2 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3]">
                                <span className="text-[9px] font-bold text-[#8C8275] uppercase block">SWIFT / BIC Code</span>
                                <span className="font-mono font-bold text-[#2C2A26]">{settings.bankSwift}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {method === 'crypto' && (
                          <div className="space-y-2 text-xs">
                            <div className="p-2 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3]">
                              <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Wallet Address</span>
                              <span className="font-mono font-bold text-xs text-emerald-950 select-all block bg-white p-1.5 rounded border border-emerald-100 mt-1 break-all">
                                {settings.cryptoWalletAddress || '0x71C...3a9f (USDT / USDC)'}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs px-1">
                              <span className="text-[#8C8275]">Network:</span>
                              <span className="font-bold text-emerald-800">{settings.cryptoNetwork || 'ERC-20 / TRC-20'}</span>
                            </div>
                          </div>
                        )}

                        {method === 'paypal' && (
                          <div className="p-2 bg-[#FDFCF9] rounded-xl border border-[#E2DDD3] text-xs">
                            <span className="text-[9px] font-bold text-[#8C8275] uppercase block">Registered PayPal Email</span>
                            <span className="font-mono font-bold text-[#2C2A26]">{settings.paypalEmail || activeOrder.sellerEmail}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Admin Manual Action Confirmation */}
                  {activeOrder.payoutStatus === 'Disbursed' ? (
                    <div className="p-3.5 bg-emerald-100/90 border border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Funds manually disbursed to seller by Admin</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Transfer Reference ID: <strong className="font-mono">{activeOrder.paymentReference}</strong> | Payout Date: {activeOrder.payoutDisbursedAt ? new Date(activeOrder.payoutDisbursedAt).toLocaleString() : 'Recent'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-white border border-amber-300 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>Confirm Manual Seller Payout (Admin Payout Action)</span>
                      </div>
                      <p className="text-[11px] text-[#5D5A53]">
                        Once you execute the wire transfer or send crypto to the seller, enter the transfer transaction reference ID to document and complete the audit trail:
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={transferRefInput}
                          onChange={(e) => setTransferRefInput(e.target.value)}
                          placeholder="Wire/Transaction Reference ID (e.g. VIR-CIH-2026-98124)"
                          className="flex-1 px-3 py-2 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs font-mono text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
                        />
                        <button
                          onClick={() => handleManualPayoutDisburse(activeOrder.id)}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>Confirm Manual Payout Sent</span>
                        </button>
                      </div>

                      {transferSuccessMsg && (
                        <p className="text-xs font-bold text-emerald-800 animate-fade-in-up">
                          ✓ Seller payout documented and saved successfully in audit logs!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* MOROCCAN WIRE TRANSFER MANUAL APPROVAL PANEL (BUYER DEPOSIT) */}
              {activeOrder.deliveryStatus === 'Awaiting Payment' && activeOrder.paymentGateway === 'cmi' && (
                <div className="p-4 bg-amber-50/80 border-2 border-amber-300 rounded-2xl space-y-3 animate-fade-in-up">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Pending Moroccan Bank Wire Deposit (CIH / Attijariwafa)</span>
                  </div>
                  <div className="text-xs text-[#5D5A53] space-y-2">
                    <p>Buyer: <strong>{activeOrder.buyerName}</strong> ({activeOrder.buyerEmail})</p>
                    <p className="bg-white p-2.5 rounded-xl border border-amber-200">
                      The buyer selected local Moroccan bank wire transfer. Please check your bank account statement <strong>(CIH / Attijariwafa Bank)</strong> to confirm deposit of <strong className="text-amber-950 font-serif font-bold">${(activeOrder.askingPrice || 0).toLocaleString()}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={handleApproveLocalPayment}
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Confirm Bank Deposit & Activate Escrow</span>
                  </button>
                </div>
              )}

              {/* DISPUTE RESOLUTION BOX IF ACTIVE */}
              {activeOrder.deliveryStatus === 'Disputed' && activeOrder.dispute && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-red-900 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-red-700" />
                    <span>Dispute Arbitration Workspace</span>
                  </div>

                  <div className="text-xs text-red-950 space-y-1">
                    <p><strong>Opened by:</strong> {activeOrder.dispute.openedBy}</p>
                    <p><strong>Reason:</strong> {activeOrder.dispute.reason}</p>
                    <p className="p-2.5 bg-white rounded-xl border border-red-200 italic">
                      "{activeOrder.dispute.evidenceDetails}"
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-red-200">
                    <label className="text-[11px] font-bold text-red-900 block">Admin Resolution Notes</label>
                    <textarea
                      rows={2}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Explain arbitration decision and evidence review outcome..."
                      className="w-full p-2 bg-white border border-red-200 rounded-xl text-xs focus:outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleResolve('RefundBuyer')}
                        className="py-2 bg-white text-red-800 border border-red-300 rounded-xl text-[11px] font-bold hover:bg-red-100 transition-all"
                      >
                        Refund Buyer
                      </button>
                      <button
                        onClick={() => handleResolve('CompleteDeal')}
                        className="py-2 bg-emerald-800 text-white rounded-xl text-[11px] font-bold hover:bg-emerald-900 transition-all"
                      >
                        Release to Seller
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ASSET CHECKLIST INSPECTOR */}
              <div>
                <h4 className="text-xs font-bold text-[#2C2A26] uppercase tracking-wider mb-2">
                  Delivered Assets Status
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeOrder.assets.map((ast) => (
                    <div key={ast.id} className="p-2.5 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#2C2A26]">{ast.title}</span>
                        <span className={`text-[10px] font-bold ${
                          ast.status === 'Pending' ? 'text-amber-700' : 'text-emerald-700'
                        }`}>
                          {ast.status}
                        </span>
                      </div>
                      {ast.deliverableValue && (
                        <p className="text-[10px] font-mono text-[#5D5A53] truncate">
                          {ast.deliverableValue}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AUDIT LOG TRAIL */}
              <div>
                <h4 className="text-xs font-bold text-[#2C2A26] uppercase tracking-wider mb-2">
                  Audit History
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeOrder.auditLogs.map((log) => (
                    <div key={log.id} className="p-2 bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl text-[11px]">
                      <div className="flex justify-between font-bold text-[#2C2A26]">
                        <span>{log.action}</span>
                        <span className="text-[10px] text-[#8C8275]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[#5D5A53]">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-[#8C8275] space-y-2">
              <Eye className="w-8 h-8 text-[#8C8275] mx-auto opacity-50" />
              <p>Select a transaction to inspect delivered assets, evidence, seller bank payout details, and audit logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDeliveryManagement;

