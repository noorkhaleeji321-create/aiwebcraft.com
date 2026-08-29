import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Key, 
  Code2, 
  Database, 
  Globe, 
  Server, 
  FileText, 
  AlertTriangle, 
  ArrowLeft, 
  Send, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Plus, 
  History,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { OrderTransaction, AssetDeliveryItem, DeliveryStatus } from '../../types';
import { deliverAssetItem, markAllAssetsDelivered, updateOrderStatus } from '../../services/deliveryStore';

interface SellerDeliveryCenterProps {
  order: OrderTransaction;
  onBack: () => void;
  onOrderUpdated: (updated: OrderTransaction) => void;
}

export const SellerDeliveryCenter: React.FC<SellerDeliveryCenterProps> = ({
  order,
  onBack,
  onOrderUpdated
}) => {
  const [selectedAsset, setSelectedAsset] = useState<AssetDeliveryItem | null>(null);
  const [deliverValue, setDeliverValue] = useState('');
  const [deliverNotes, setDeliverNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4 bg-white border border-[#E2DDD3] rounded-3xl">
        <p className="text-sm font-semibold text-[#8C8275]">No order details found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-[#2C2A26] text-white rounded-xl text-xs font-bold">
          Back
        </button>
      </div>
    );
  }

  const STATUS_STEPS: DeliveryStatus[] = [
    'Awaiting Payment',
    'Payment Confirmed',
    'Delivery Pending',
    'Delivered',
    'Buyer Inspection',
    'Accepted',
    'Completed'
  ];

  const getCurrentStepIndex = (status?: DeliveryStatus) => {
    if (!status) return 0;
    if (status === 'Disputed') return 4;
    const idx = STATUS_STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white border border-[#E2DDD3] rounded-3xl space-y-4">
        <h2 className="font-serif font-bold text-2xl text-[#2C2A26]">Order Details Not Available</h2>
        <button onClick={onBack} className="px-4 py-2 bg-[#2C2A26] text-white rounded-xl text-xs font-bold">Back</button>
      </div>
    );
  }

  const currentIdx = getCurrentStepIndex(order?.deliveryStatus);

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'Source Code': return <Code2 className="w-5 h-5 text-indigo-600" />;
      case 'Database': return <Database className="w-5 h-5 text-emerald-600" />;
      case 'Domain Transfer': return <Globe className="w-5 h-5 text-sky-600" />;
      case 'Hosting & Cloud': return <Server className="w-5 h-5 text-purple-600" />;
      case 'Credentials & Vault': return <Key className="w-5 h-5 text-amber-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleDeliverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !deliverValue.trim()) return;

    const updated = deliverAssetItem(order.id, selectedAsset.id, deliverValue.trim(), deliverNotes.trim());
    if (updated) {
      onOrderUpdated(updated);
      setSelectedAsset(null);
      setDeliverValue('');
      setDeliverNotes('');
    }
  };

  const handleMarkAllDelivered = () => {
    const updated = markAllAssetsDelivered(order.id);
    if (updated) {
      onOrderUpdated(updated);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E2DDD3] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#F5F2EB] rounded-xl text-[#8C8275] transition-all"
            title="Return to Orders list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                Seller Handover Center
              </span>
              <span className="text-xs text-[#8C8275] font-mono">#{order.id}</span>
            </div>
            <h1 className="font-serif font-bold text-2xl text-[#2C2A26] mt-1">
              {order.projectTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl px-4 py-2.5">
          <div className="text-right">
            <span className="text-[10px] text-[#8C8275] font-bold uppercase block">Escrow Deal Amount</span>
            <span className="font-serif font-bold text-lg text-[#2C2A26]">
              ${(order.askingPrice || 0).toLocaleString()} {order.currency || 'USD'}
            </span>
          </div>
          <div className="h-8 w-px bg-[#E2DDD3]" />
          <div>
            <span className="text-[10px] text-[#8C8275] font-bold uppercase block">Buyer</span>
            <span className="text-xs font-bold text-[#2C2A26]">{order.buyerName}</span>
          </div>
        </div>
      </div>

      {/* DELIVERY WORKFLOW TIMELINE */}
      <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
          <h2 className="font-serif font-bold text-base text-[#2C2A26] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Escrow & Asset Delivery Workflow</span>
          </h2>
          <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
            order.deliveryStatus === 'Completed'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : order.deliveryStatus === 'Disputed'
              ? 'bg-red-100 text-red-900 border border-red-300'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}>
            Current State: {order.deliveryStatus}
          </span>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
          {STATUS_STEPS.map((st, i) => {
            const isDone = i < currentIdx || order.deliveryStatus === 'Completed';
            const isCurrent = i === currentIdx && order.deliveryStatus !== 'Completed';

            return (
              <div
                key={st}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : isCurrent
                    ? 'bg-[#2C2A26] border-[#2C2A26] text-white shadow-md'
                    : 'bg-[#FDFCF9] border-[#E2DDD3] text-[#8C8275]'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className={`text-[10px] font-bold ${isCurrent ? 'text-amber-300' : 'text-[#8C8275]'}`}>
                      0{i + 1}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold block leading-tight">
                  {st}
                </span>
              </div>
            );
          })}
        </div>

        {/* Seller Status Guidance Banner */}
        {order.deliveryStatus === 'Awaiting Payment' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Awaiting Buyer Payment Confirmation</strong>
              <span>The buyer has accepted terms and is securing funds in escrow. Once payment is confirmed by escrow, you will be notified to release source code & assets.</span>
            </div>
          </div>
        )}

        {(order.deliveryStatus === 'Payment Confirmed' || order.deliveryStatus === 'Delivery Pending') && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block mb-0.5">Escrow Payment Confirmed — Handover Ready</strong>
                <span>Payment is secured in escrow. Please deliver all agreed items using the checklist below.</span>
              </div>
            </div>
            <button
              onClick={handleMarkAllDelivered}
              className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Mark All Delivered</span>
            </button>
          </div>
        )}

        {order.deliveryStatus === 'Buyer Inspection' && (
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-950 flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Under Buyer Inspection</strong>
              <span>All assets have been handed over. The buyer is currently reviewing code, credentials, and domain access. They will click "Accept Delivery" to trigger final payout.</span>
            </div>
          </div>
        )}

        {order.deliveryStatus === 'Disputed' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-700" />
              <span>Dispute Opened by Buyer</span>
            </div>
            <p>
              <strong>Reason:</strong> {order.dispute?.reason || 'Asset verification issue'}
            </p>
            <p className="bg-white p-3 rounded-xl border border-red-200 text-[#2C2A26]">
              "{order.dispute?.evidenceDetails}"
            </p>
            <p className="text-[11px] text-red-800 font-medium">
              An AIWebCrafter admin mediator is reviewing the audit log and evidence. Escrow funds remain safely frozen until resolution.
            </p>
          </div>
        )}
      </div>

      {/* ASSET TRANSFER CHECKLIST & HANDOVER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#2C2A26]">
                  Seller Asset Delivery Checklist
                </h3>
                <p className="text-xs text-[#5D5A53]">
                  Attach repository links, domain auth codes, database dumps, and vault secrets.
                </p>
              </div>

              <span className="text-xs font-bold text-[#2C2A26] bg-[#F5F2EB] px-3 py-1.5 rounded-xl border border-[#E2DDD3]">
                {order.assets.filter((a) => a.status !== 'Pending').length} / {order.assets.length} Delivered
              </span>
            </div>

            {/* Asset Items List */}
            <div className="space-y-4">
              {order.assets.map((asset) => {
                const isDelivered = asset.status !== 'Pending';
                const isSecret = asset.isSecret;

                return (
                  <div
                    key={asset.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isDelivered
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-[#FDFCF9] border-[#E2DDD3] hover:border-[#2C2A26]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-white border border-[#E2DDD3] rounded-xl shrink-0">
                          {getAssetIcon(asset.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#8C8275] uppercase tracking-wider">
                              {asset.type}
                            </span>
                            {isSecret && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-700" /> Secure Vault
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif font-bold text-sm text-[#2C2A26]">{asset.title}</h4>
                          <p className="text-xs text-[#5D5A53] mt-0.5">{asset.description}</p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isDelivered ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Delivered
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setDeliverValue(asset.deliverableValue || '');
                              setDeliverNotes(asset.notes || '');
                            }}
                            className="px-3.5 py-2 bg-[#2C2A26] text-white rounded-xl text-xs font-bold hover:bg-[#423E38] transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Deliver Item</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delivered Payload / Value Preview */}
                    {isDelivered && asset.deliverableValue && (
                      <div className="p-3 bg-white border border-emerald-200 rounded-xl text-xs space-y-1.5 font-mono">
                        <div className="flex items-center justify-between text-[11px] text-[#8C8275]">
                          <span>Delivered Content / Token:</span>
                          <span className="text-[10px] text-emerald-800 font-sans">
                            {asset.deliveredAt ? new Date(asset.deliveredAt).toLocaleTimeString() : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 bg-[#F5F2EB] p-2 rounded-lg text-[#2C2A26]">
                          <span className="truncate">
                            {isSecret && !showSecrets[asset.id]
                              ? '••••••••••••••••••••••••••••••••'
                              : asset.deliverableValue}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSecret && (
                              <button
                                onClick={() => toggleSecret(asset.id)}
                                className="p-1 hover:bg-white rounded-md text-[#5D5A53]"
                                title="Toggle visibility"
                              >
                                {showSecrets[asset.id] ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => handleCopy(asset.deliverableValue!, asset.id)}
                              className="p-1 hover:bg-white rounded-md text-[#5D5A53]"
                              title="Copy value"
                            >
                              {copiedId === asset.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        {asset.notes && (
                          <p className="text-[11px] font-sans text-[#5D5A53] pt-1">
                            <strong>Note:</strong> {asset.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: AUDIT LOG TIMELINE & LEGAL DECLARATION */}
        <div className="space-y-6">
          {/* Seller Ownership Declaration Reminder */}
          <div className="bg-[#FDFCF9] border border-[#E2DDD3] rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#2C2A26] font-serif font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Seller Title Guarantee</span>
            </div>
            <p className="text-xs text-[#5D5A53] leading-relaxed">
              Certified by <strong>{order.ownershipDeclaration.declaredBy}</strong> on{' '}
              {new Date(order.ownershipDeclaration.declaredAt).toLocaleDateString()}.
            </p>
            <div className="p-3 bg-white rounded-xl border border-[#E2DDD3] text-[11px] text-[#5D5A53] italic">
              "{order.ownershipDeclaration.declarationText}"
            </div>
          </div>

          {/* Time-stamped Audit Log */}
          <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
              <h3 className="font-serif font-bold text-base text-[#2C2A26] flex items-center gap-2">
                <History className="w-4 h-4 text-amber-700" />
                <span>Audit & Activity Log</span>
              </h3>
              <span className="text-[10px] text-[#8C8275] font-mono">{order.auditLogs.length} events</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {order.auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#2C2A26]">{log.action}</span>
                    <span className="text-[10px] text-[#8C8275] font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#5D5A53]">{log.details}</p>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                    Actor: {log.actor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DELIVER ASSET MODAL */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DDD3] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3">
              <div className="flex items-center gap-2">
                {getAssetIcon(selectedAsset.type)}
                <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
                  Deliver {selectedAsset.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-[#8C8275] hover:text-[#2C2A26] text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleDeliverSubmit} className="space-y-4">
              <p className="text-xs text-[#5D5A53]">
                Provide the access link, Git URL, authorization key, or vault token for <strong>{selectedAsset.title}</strong>.
              </p>

              <div>
                <label className="text-xs font-bold text-[#2C2A26] block mb-1">
                  Deliverable URL / Token / Secret *
                </label>
                {selectedAsset.isSecret ? (
                  <input
                    type="password"
                    required
                    value={deliverValue}
                    onChange={(e) => setDeliverValue(e.target.value)}
                    placeholder="Enter secret key or vault token securely"
                    className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-2.5 text-xs font-mono text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={deliverValue}
                    onChange={(e) => setDeliverValue(e.target.value)}
                    placeholder="https://github.com/org/repo or EPP-CODE-1234"
                    className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-2.5 text-xs font-mono text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-[#2C2A26] block mb-1">
                  Handover Instructions / Notes for Buyer (Optional)
                </label>
                <textarea
                  rows={3}
                  value={deliverNotes}
                  onChange={(e) => setDeliverNotes(e.target.value)}
                  placeholder="e.g. Granted admin invite to buyer email alex@techfund.io. Please check your inbox."
                  className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-2.5 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#5D5A53]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#2C2A26] text-white rounded-xl text-xs font-bold hover:bg-[#423E38] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 text-amber-300" />
                  <span>Confirm Handover Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDeliveryCenter;
