import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Bot, 
  UserCheck, 
  Send, 
  ShieldCheck, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Users, 
  Headphones, 
  Clock, 
  Filter, 
  CheckCircle2, 
  FileText,
  Mail,
  User,
  Sparkles
} from 'lucide-react';
import { ChatSession, getStoredChatSessions, setAiBotActiveStatus, addMessageToSession } from '../../services/chatStore';
import { BuyerMessagesPage } from '../BuyerSubPages';
import { 
  SupportTicket, 
  getStoredSupportTickets, 
  replyToSupportTicket, 
  updateTicketStatus, 
  fetchServerSupportTickets 
} from '../../services/supportTicketStore';

export const AdminChatManagement: React.FC = () => {
  const [chatMode, setChatMode] = useState<'user-support-tickets' | 'visitor-ai' | 'buyer-seller-direct'>('user-support-tickets');
  
  // Visitor AI state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Support Tickets state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState<string>('ALL');
  const [isSendingTicketReply, setIsSendingTicketReply] = useState(false);
  const ticketChatScrollRef = useRef<HTMLDivElement>(null);

  // Load Sessions
  const loadSessions = () => {
    const list = getStoredChatSessions() || [];
    setSessions(list);
    setSelectedSessionId(prev => {
      if (!prev && list.length > 0) return list[0]?.sessionId || null;
      return prev;
    });
  };

  // Load Tickets
  const loadTickets = () => {
    const list = getStoredSupportTickets() || [];
    setSupportTickets(list);
    setSelectedTicketId(prev => {
      if (!prev && list.length > 0) return list[0]?.id || null;
      return prev;
    });
  };

  useEffect(() => {
    loadSessions();
    loadTickets();
    
    const fetchLiveTickets = () => {
      fetchServerSupportTickets(undefined, true).then(() => {
        loadTickets();
      });
    };

    fetchLiveTickets();

    const interval = setInterval(() => {
      loadSessions();
      fetchLiveTickets();
    }, 3000);

    const handleTicketsUpdated = () => loadTickets();
    window.addEventListener('support-tickets-updated', handleTicketsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('support-tickets-updated', handleTicketsUpdated);
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedSessionId, sessions]);

  useEffect(() => {
    if (ticketChatScrollRef.current) {
      ticketChatScrollRef.current.scrollTop = ticketChatScrollRef.current.scrollHeight;
    }
  }, [selectedTicketId, supportTickets]);

  const selectedSession = sessions.find((s) => s.sessionId === selectedSessionId);
  const selectedTicket = supportTickets.find((t) => t.id === selectedTicketId);

  const handleToggleAi = (sessionId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const updated = setAiBotActiveStatus(sessionId, nextStatus);
    setSessions(updated);
  };

  const handleSendAdminMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedSessionId) return;

    setAiBotActiveStatus(selectedSessionId, false);
    const updated = addMessageToSession(selectedSessionId, 'admin', adminReplyText);
    setSessions(updated);
    setAdminReplyText('');
  };

  // Handle Admin replying to user support inquiry
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReplyText.trim() || !selectedTicketId) return;

    setIsSendingTicketReply(true);
    try {
      await replyToSupportTicket(
        selectedTicketId,
        'admin',
        'Super Admin (AIWebCrafter)',
        ticketReplyText.trim()
      );
      setTicketReplyText('');
      loadTickets();
    } catch (err) {
      console.error('Error replying to ticket:', err);
    } finally {
      setIsSendingTicketReply(false);
    }
  };

  const handleUpdateStatus = async (status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
    if (!selectedTicketId) return;
    await updateTicketStatus(selectedTicketId, status);
    loadTickets();
  };

  const filteredSessions = sessions.filter((s) => 
    s.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.visitorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTickets = supportTickets.filter((t) => {
    const matchesSearch = 
      t.id.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
      t.senderName.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
      t.senderEmail.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(ticketSearchQuery.toLowerCase());
    
    const matchesStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
    const matchesCategory = ticketCategoryFilter === 'ALL' || t.category === ticketCategoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const openTicketsCount = supportTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  return (
    <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
      {/* Header with Mode Switching */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DDD3]">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#2C2A26]">Live Chat & AI Bot</h2>
          <p className="text-xs text-[#5D5A53]">
            Manage visitor AI chat sessions, user support tickets, and direct buyer-seller communications.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#F5F2EB] p-1 rounded-2xl border border-[#E2DDD3]">
          <button
            onClick={() => setChatMode('user-support-tickets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              chatMode === 'user-support-tickets'
                ? 'bg-[#2C2A26] text-[#F5F2EB] shadow-xs'
                : 'text-[#5D5A53] hover:text-[#2C2A26]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-amber-300" />
            <span>User Support & Inquiries</span>
            {openTicketsCount > 0 && (
              <span className="bg-amber-400 text-black text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ml-1">
                {openTicketsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setChatMode('visitor-ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              chatMode === 'visitor-ai'
                ? 'bg-[#2C2A26] text-[#F5F2EB] shadow-xs'
                : 'text-[#5D5A53] hover:text-[#2C2A26]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-300" />
            <span>Visitor AI Chats ({sessions.length})</span>
          </button>
          <button
            onClick={() => setChatMode('buyer-seller-direct')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              chatMode === 'buyer-seller-direct'
                ? 'bg-[#2C2A26] text-[#F5F2EB] shadow-xs'
                : 'text-[#5D5A53] hover:text-[#2C2A26]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>Buyer-Seller Direct Chats</span>
          </button>
        </div>
      </div>

      {chatMode === 'buyer-seller-direct' ? (
        <BuyerMessagesPage userRole="SUPER_ADMIN" />
      ) : chatMode === 'user-support-tickets' ? (
        /* USER SUPPORT INQUIRIES & DIRECT ADMIN CHAT */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FDFCF9] p-3 rounded-2xl border border-[#E2DDD3]">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-[#8C8275]" />
              <input
                type="text"
                placeholder="Search by ticket #, user name, email, or subject..."
                value={ticketSearchQuery}
                onChange={(e) => setTicketSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E2DDD3] rounded-xl px-3 py-1.5 text-xs text-[#2C2A26] focus:border-[#2C2A26] outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value as any)}
                className="bg-white border border-[#E2DDD3] rounded-xl px-3 py-1.5 text-xs text-[#2C2A26] font-medium outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">🟢 Open</option>
                <option value="IN_PROGRESS">🟡 In Progress</option>
                <option value="RESOLVED">🔵 Resolved</option>
                <option value="CLOSED">⚪ Closed</option>
              </select>

              <select
                value={ticketCategoryFilter}
                onChange={(e) => setTicketCategoryFilter(e.target.value)}
                className="bg-white border border-[#E2DDD3] rounded-xl px-3 py-1.5 text-xs text-[#2C2A26] font-medium outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="escrow">Escrow & Payments</option>
                <option value="verification">KYC & Verification</option>
                <option value="order">Order Assistance</option>
                <option value="dispute">Disputes & Arbitration</option>
                <option value="technical">Technical Support</option>
                <option value="general">General</option>
              </select>

              <button
                onClick={loadTickets}
                className="p-2 bg-white border border-[#E2DDD3] rounded-xl text-[#5D5A53] hover:text-[#2C2A26] transition-colors"
                title="Refresh Tickets"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ticket Master-Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl overflow-hidden shadow-2xs h-[620px]">
            {/* Left: Tickets List (4 Cols) */}
            <div className="lg:col-span-4 border-r border-[#E2DDD3] flex flex-col bg-[#FDFCF9]">
              <div className="p-3 bg-white border-b border-[#E2DDD3] flex items-center justify-between text-xs font-bold text-[#2C2A26]">
                <span>Inquiries Queue ({filteredTickets.length})</span>
                <span className="text-[10px] text-[#8C8275] font-normal">Updated Live</span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#E2DDD3]">
                {filteredTickets.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#8C8275]">
                    No support tickets matching filters.
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const isSelected = t.id === selectedTicketId;
                    const lastMsg = t.messages[t.messages.length - 1];
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`p-3.5 cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-50/80 border-l-4 border-[#2C2A26]' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs text-amber-900">
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

                        <h4 className="font-bold text-xs text-[#2C2A26] truncate mb-0.5">
                          {t.subject}
                        </h4>

                        <div className="flex items-center gap-1.5 text-[11px] text-[#5D5A53] mb-1">
                          <span>{t.senderName}</span>
                          <span className="text-[#8C8275]">({t.senderRole})</span>
                        </div>

                        <p className="text-[11px] text-[#8C8275] truncate mb-1.5">
                          {lastMsg ? `${lastMsg.sender === 'admin' ? 'Admin: ' : ''}${lastMsg.text}` : 'No messages'}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-[#8C8275]">
                          <span className="capitalize">{t.category}</span>
                          <span>{new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Ticket Conversation & Admin Action Panel (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col bg-white">
              {selectedTicket ? (
                <>
                  {/* Ticket Header */}
                  <div className="p-4 border-b border-[#E2DDD3] flex flex-wrap items-center justify-between gap-4 bg-[#FDFCF9]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-amber-900">
                          #{selectedTicket.id}
                        </span>
                        <h3 className="font-bold text-sm text-[#2C2A26]">
                          {selectedTicket.subject}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#5D5A53] mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#8C8275]" />
                          <strong>{selectedTicket.senderName}</strong> ({selectedTicket.senderRole})
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#8C8275]" />
                          {selectedTicket.senderEmail}
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-950 font-bold px-1.5 py-0.2 rounded uppercase">
                          {selectedTicket.priority} Priority
                        </span>
                      </div>
                    </div>

                    {/* Status Management Buttons */}
                    <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#E2DDD3]">
                      <button
                        onClick={() => handleUpdateStatus('IN_PROGRESS')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          selectedTicket.status === 'IN_PROGRESS'
                            ? 'bg-blue-600 text-white'
                            : 'text-[#5D5A53] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('RESOLVED')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          selectedTicket.status === 'RESOLVED'
                            ? 'bg-emerald-600 text-white'
                            : 'text-[#5D5A53] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        ✓ Resolved
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('CLOSED')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          selectedTicket.status === 'CLOSED'
                            ? 'bg-gray-800 text-white'
                            : 'text-[#5D5A53] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Conversation History */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F5F2EB]/50" ref={ticketChatScrollRef}>
                    {selectedTicket.messages.map((m, idx) => {
                      const isAdmin = m.sender === 'admin';
                      return (
                        <div
                          key={idx}
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isAdmin
                              ? 'bg-amber-100 border border-amber-300 text-amber-950 font-medium'
                              : 'bg-white border border-[#E2DDD3] text-[#2C2A26]'
                          }`}>
                            <div className="flex items-center justify-between gap-3 mb-1.5 text-[10px] opacity-75">
                              <span className="font-bold flex items-center gap-1">
                                {isAdmin ? (
                                  <>
                                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                                    Super Admin (Official Response)
                                  </>
                                ) : (
                                  m.senderName || selectedTicket.senderName
                                )}
                              </span>
                              <span>{m.date || new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="whitespace-pre-wrap">{m.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Admin Reply Form */}
                  <form onSubmit={handleSendTicketReply} className="p-4 border-t border-[#E2DDD3] bg-white flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Type official admin response to user inquiry..."
                      value={ticketReplyText}
                      onChange={(e) => setTicketReplyText(e.target.value)}
                      className="flex-1 bg-[#F5F2EB] border border-[#E2DDD3] rounded-xl px-4 py-3 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
                    />
                    <button
                      type="submit"
                      disabled={!ticketReplyText.trim() || isSendingTicketReply}
                      className="bg-[#2C2A26] hover:bg-[#423E38] text-amber-300 px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Admin Reply</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-[#8C8275]">
                  Select a support inquiry from the left queue to view details and respond.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Visitor AI Chats Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#FDFCF9] border border-[#E2DDD3] rounded-2xl overflow-hidden shadow-2xs h-[650px]">
          {/* Left: Session List (4 Cols) */}
          <div className="lg:col-span-4 border-r border-[#E2DDD3] flex flex-col bg-[#FDFCF9]">
            <div className="p-4 border-b border-[#E2DDD3]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8C8275]" />
                <input
                  type="text"
                  placeholder="Search visitor chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2DDD3] rounded-xl text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#E2DDD3]">
              {filteredSessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8C8275]">
                  No active visitor chats found.
                </div>
              ) : (
                filteredSessions.map((s) => {
                  const isSelected = s.sessionId === selectedSessionId;
                  const lastMsg = s.messages[s.messages.length - 1];
                  return (
                    <div
                      key={s.sessionId}
                      onClick={() => setSelectedSessionId(s.sessionId)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/70 border-l-4 border-[#2C2A26]' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[#2C2A26] truncate">{s.visitorName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          s.aiBotActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {s.aiBotActive ? '🤖 AI Active' : '👤 Admin Mode'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5D5A53] truncate mb-2">
                        {lastMsg ? lastMsg.text : 'No messages yet'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-[#8C8275]">
                        <span>{s.messages.length} messages</span>
                        <span>{new Date(s.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Active Chat Conversation & Takeover Panel (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col bg-white">
            {selectedSession ? (
              <>
                {/* Chat Header & Takeover Toggle */}
                <div className="p-4 border-b border-[#E2DDD3] flex flex-wrap items-center justify-between gap-4 bg-[#FDFCF9]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2C2A26] text-amber-300 flex items-center justify-center font-bold">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#2C2A26]">{selectedSession.visitorName}</h3>
                      <span className="text-[11px] text-[#8C8275]">ID: {selectedSession.sessionId}</span>
                    </div>
                  </div>

                  {/* AI / Admin Takeover Switch */}
                  <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-[#E2DDD3]">
                    <div className="text-right">
                      <span className="text-[11px] font-bold block text-[#2C2A26]">
                        {selectedSession.aiBotActive ? 'AI Bot Handling' : 'Human Admin Takeover'}
                      </span>
                      <span className="text-[9px] text-[#8C8275] block">
                        {selectedSession.aiBotActive ? 'Verified Deals Assistant replying' : 'AI paused. You are in control.'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleAi(selectedSession.sessionId, selectedSession.aiBotActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        selectedSession.aiBotActive ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          selectedSession.aiBotActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F5F2EB]/50" ref={chatScrollRef}>
                  {selectedSession.messages.map((m, i) => {
                    const isUser = m.role === 'user';
                    const isAdmin = m.role === 'admin';
                    return (
                      <div key={i} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[75%] p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-white border border-[#E2DDD3] text-[#2C2A26]'
                            : isAdmin
                            ? 'bg-amber-100 border border-amber-300 text-amber-950 font-medium'
                            : 'bg-[#2C2A26] text-[#F5F2EB]'
                        }`}>
                          <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                            <span className="font-bold">
                              {isUser ? selectedSession.visitorName : isAdmin ? 'Human Admin (You)' : 'AI Verified Deals Assistant'}
                            </span>
                            <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p>{m.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Admin Reply Input */}
                <form onSubmit={handleSendAdminMessage} className="p-4 border-t border-[#E2DDD3] bg-white flex items-center gap-3">
                  <input
                    type="text"
                    placeholder={selectedSession.aiBotActive ? "Type reply to take over from AI..." : "Type message as Human Admin..."}
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    className="flex-1 bg-[#F5F2EB] border border-[#E2DDD3] rounded-xl px-4 py-3 text-xs text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
                  />
                  <button
                    type="submit"
                    disabled={!adminReplyText.trim()}
                    className="bg-[#2C2A26] hover:bg-[#423E38] text-amber-300 px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send & Take Over</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[#8C8275]">
                Select a visitor conversation from the left to start chatting.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default AdminChatManagement;
