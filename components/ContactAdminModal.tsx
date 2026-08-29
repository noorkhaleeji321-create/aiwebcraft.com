import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  ShieldCheck, 
  Headphones, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  HelpCircle, 
  FileText, 
  Landmark, 
  UserCheck, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { 
  SupportTicket, 
  getStoredSupportTickets, 
  createSupportTicket, 
  replyToSupportTicket, 
  fetchServerSupportTickets 
} from '../services/supportTicketStore.js';
import { getCurrentLoggedInEmail } from '../services/sellerStore.js';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  initialCategory?: string;
}

export const ContactAdminModal: React.FC<ContactAdminModalProps> = ({
  isOpen,
  onClose,
  userRole = 'BUYER',
  initialCategory = 'general'
}) => {
  const [activeTab, setActiveTab] = useState<'new-ticket' | 'my-tickets'>('new-ticket');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Form states
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [category, setCategory] = useState<any>(initialCategory);
  const [priority, setPriority] = useState<any>('medium');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Chat message reply state
  const [replyInput, setReplyInput] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Load user data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = getCurrentLoggedInEmail() || localStorage.getItem('aiwebcrafter_visitor_email') || '';
      if (email) {
        setSenderEmail(email);
      }
      const storedName = localStorage.getItem('aiwebcrafter_user_name') || '';
      if (storedName) {
        setSenderName(storedName);
      }
    }
  }, [isOpen]);

  // Load tickets
  const loadTickets = () => {
    const list = getStoredSupportTickets();
    const currentEmail = senderEmail || getCurrentLoggedInEmail() || '';
    const filtered = currentEmail 
      ? list.filter(t => t.senderEmail.toLowerCase() === currentEmail.toLowerCase())
      : list;
    
    setTickets(filtered.length > 0 ? filtered : list);
    
    setSelectedTicketId(prev => {
      if (!prev && filtered.length > 0) return filtered[0].id;
      return prev;
    });
  };

  useEffect(() => {
    let interval: any;
    
    if (isOpen) {
      loadTickets();
      
      const fetchLiveTickets = () => {
        fetchServerSupportTickets(senderEmail).then(() => {
          loadTickets();
        });
      };
      
      fetchLiveTickets();
      
      interval = setInterval(() => {
        fetchLiveTickets();
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, senderEmail]);

  useEffect(() => {
    const handleUpdate = () => loadTickets();
    window.addEventListener('support-tickets-updated', handleUpdate);
    return () => window.removeEventListener('support-tickets-updated', handleUpdate);
  }, [senderEmail]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedTicketId, tickets]);

  if (!isOpen) return null;

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleSubmitNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !subject.trim() || !messageText.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const newTicket = await createSupportTicket({
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        senderRole: (userRole as any) || 'BUYER',
        subject: subject.trim(),
        category,
        priority,
        message: messageText.trim()
      });

      setSubmitSuccessMsg(`Ticket #${newTicket.id} has been submitted directly to Administration!`);
      setSubject('');
      setMessageText('');
      loadTickets();
      setSelectedTicketId(newTicket.id);

      setTimeout(() => {
        setSubmitSuccessMsg(null);
        setActiveTab('my-tickets');
      }, 1500);
    } catch (err: any) {
      console.error('Error creating ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedTicketId) return;

    setIsReplying(true);
    try {
      await replyToSupportTicket(
        selectedTicketId,
        'user',
        senderName || 'Client',
        replyInput.trim()
      );
      setReplyInput('');
      loadTickets();
    } catch (err: any) {
      console.error('Error sending reply:', err);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#F5F2EB] border border-[#E2DDD3] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="bg-[#2C2A26] text-[#F5F2EB] p-4 sm:p-5 flex items-center justify-between border-b border-[#423E38]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-300 text-[#2C2A26] flex items-center justify-center font-bold shadow-md">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base sm:text-lg text-white">
                  Direct Contact with Administration
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Official Support Desk</span>
                </span>
              </div>
              <p className="text-xs text-[#D6D1C7]">
                Direct official communication with platform administration for KYC, Escrow, Technical Support & Disputes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#D6D1C7] hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-[#E2DDD3] bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('new-ticket')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'new-ticket'
                  ? 'bg-[#2C2A26] text-[#F5F2EB] shadow-xs'
                  : 'text-[#5D5A53] hover:bg-[#F5F2EB]'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-amber-300" />
              <span>New Message to Admin</span>
            </button>
            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === 'my-tickets'
                  ? 'bg-[#2C2A26] text-[#F5F2EB] shadow-xs'
                  : 'text-[#5D5A53] hover:bg-[#F5F2EB]'
              }`}
            >
              <Inbox className="w-3.5 h-3.5 text-amber-300" />
              <span>My Inquiries & Live Chat ({tickets.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#5D5A53]">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Avg. Response Time: <strong>2-4 Hours</strong></span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F5F2EB]">
          {activeTab === 'new-ticket' ? (
            <div className="max-w-2xl mx-auto bg-white border border-[#E2DDD3] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
                  Submit Direct Inquiry to Administration
                </h3>
                <p className="text-xs text-[#5D5A53]">
                  Your request is routed directly to the Super Admin desk and verified by Sentinel Bots.
                </p>
              </div>

              {submitSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{submitSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitNewTicket} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2C2A26] mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Yassine Alami"
                      className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs text-[#2C2A26] focus:border-[#2C2A26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2C2A26] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="e.g. you@example.com"
                      className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs text-[#2C2A26] focus:border-[#2C2A26] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2C2A26] mb-1">
                      Inquiry Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs text-[#2C2A26] focus:border-[#2C2A26] outline-none font-medium"
                    >
                      <option value="escrow">💳 Escrow & Moroccan CMI / Wire Payment</option>
                      <option value="verification">🛡️ Seller KYC & Code Audit Verification</option>
                      <option value="order">📦 Order Delivery & Inspection Assistance</option>
                      <option value="dispute">⚖️ Arbitration & Dispute Settlement</option>
                      <option value="technical">🛠️ Custom Builds & Technical Questions</option>
                      <option value="general">💬 General Marketplace Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2C2A26] mb-1">
                      Urgency Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs text-[#2C2A26] focus:border-[#2C2A26] outline-none font-medium"
                    >
                      <option value="low">Standard</option>
                      <option value="medium">Medium</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent Escrow Action</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C2A26] mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Inquiring about CIH bank escrow deposit for SaaS project #101"
                    className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs text-[#2C2A26] focus:border-[#2C2A26] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C2A26] mb-1">
                    Your Message / Details for Admin *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Describe your inquiry, order ID, or request with full clarity for the administration team..."
                    className="w-full bg-[#FDFCF9] border border-[#E2DDD3] rounded-xl p-3 text-xs text-[#2C2A26] focus:border-[#2C2A26] outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8C8275]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official direct channel with platform ownership</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#2C2A26] hover:bg-[#423E38] text-[#F5F2EB] px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending to Admin...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-amber-300" />
                        <span>Send to Administration</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* My Tickets & Live Admin Chat */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[460px]">
              {/* Tickets List */}
              <div className="bg-white border border-[#E2DDD3] rounded-2xl p-3 flex flex-col overflow-hidden shadow-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2DDD3]">
                  <span className="font-serif font-bold text-xs text-[#2C2A26]">
                    Your Inquiries ({tickets.length})
                  </span>
                  <button
                    onClick={loadTickets}
                    className="text-[#8C8275] hover:text-[#2C2A26] p-1 rounded transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {tickets.length === 0 ? (
                    <div className="text-center py-10 text-[#8C8275] space-y-2">
                      <Inbox className="w-8 h-8 mx-auto text-[#D6D1C7]" />
                      <p className="text-xs">No inquiries submitted yet.</p>
                      <button
                        onClick={() => setActiveTab('new-ticket')}
                        className="text-xs text-amber-800 font-bold underline"
                      >
                        Create your first inquiry
                      </button>
                    </div>
                  ) : (
                    tickets.map((t) => {
                      const isSelected = t.id === selectedTicketId;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTicketId(t.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-[#2C2A26] text-[#F5F2EB] border-[#2C2A26] shadow-xs'
                              : 'bg-[#FDFCF9] hover:bg-[#F5F2EB] border-[#E2DDD3] text-[#2C2A26]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-amber-300' : 'text-amber-800'}`}>
                              #{t.id}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                              t.status === 'RESOLVED' 
                                ? 'bg-emerald-100 text-emerald-900' 
                                : t.status === 'IN_PROGRESS' 
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-amber-100 text-amber-950'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold truncate leading-tight">
                            {t.subject}
                          </h4>
                          <div className="flex items-center justify-between mt-1 text-[10px] opacity-75">
                            <span>{t.messages?.length || 0} messages</span>
                            <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Thread with Admin */}
              <div className="md:col-span-2 bg-white border border-[#E2DDD3] rounded-2xl flex flex-col overflow-hidden shadow-xs">
                {selectedTicket ? (
                  <>
                    {/* Thread Header */}
                    <div className="p-3 bg-[#FDFCF9] border-b border-[#E2DDD3] flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-900">
                            #{selectedTicket.id}
                          </span>
                          <h4 className="font-bold text-xs text-[#2C2A26]">
                            {selectedTicket.subject}
                          </h4>
                        </div>
                        <span className="text-[10px] text-[#8C8275] block">
                          Category: <strong>{selectedTicket.category}</strong> • Priority: <strong>{selectedTicket.priority}</strong>
                        </span>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        selectedTicket.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-900'
                          : selectedTicket.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {selectedTicket.status === 'IN_PROGRESS' ? 'Admin In Review' : selectedTicket.status}
                      </span>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F2EB]" ref={chatScrollRef}>
                      {selectedTicket.messages.map((m, idx) => {
                        const isAdmin = m.sender === 'admin';
                        return (
                          <div
                            key={idx}
                            className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className="max-w-[85%]">
                              <div className="flex items-center gap-1 mb-0.5 text-[10px] font-bold">
                                {isAdmin ? (
                                  <span className="text-amber-900 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                                    AIWebCrafter Administration
                                  </span>
                                ) : (
                                  <span className="text-[#5D5A53]">
                                    {m.senderName || 'You'}
                                  </span>
                                )}
                                <span className="text-[#8C8275] text-[9px] font-normal">
                                  • {m.date || new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div
                                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                  isAdmin
                                    ? 'bg-amber-50 border-2 border-amber-300 text-[#2C2A26] shadow-2xs font-medium'
                                    : 'bg-[#2C2A26] text-[#F5F2EB]'
                                }`}
                              >
                                {m.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reply Input */}
                    <form onSubmit={handleSendReply} className="p-2.5 bg-white border-t border-[#E2DDD3] flex gap-2">
                      <input
                        type="text"
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        placeholder="Type reply to Administration desk..."
                        className="flex-1 bg-[#F5F2EB] border border-[#E2DDD3] rounded-xl px-3 py-2 text-xs text-[#2C2A26] outline-none focus:border-[#2C2A26]"
                      />
                      <button
                        type="submit"
                        disabled={!replyInput.trim() || isReplying}
                        className="bg-[#2C2A26] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#423E38] transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3 text-amber-300" />
                        <span>Send</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#8C8275]">
                    <MessageSquare className="w-8 h-8 text-[#D6D1C7] mb-2" />
                    <p className="text-xs">Select an inquiry from the list to view the conversation with Admin.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info Strip */}
        <div className="bg-[#2C2A26] text-[#D6D1C7] px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between text-[11px] border-t border-[#423E38] gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Direct Admin Dispatch: <strong>aiwebcraft6@gmail.com</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span>🛡️ Protected with 48h Inspection Hold</span>
            <button
              onClick={() => setActiveTab('new-ticket')}
              className="text-amber-300 hover:text-white font-bold underline cursor-pointer"
            >
              + Submit Another Inquiry
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactAdminModal;
