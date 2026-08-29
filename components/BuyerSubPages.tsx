import React, { useState, useEffect } from 'react';
import { 
  Grid, CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, Mail, Calendar, 
  Download, FileText, Clock, AlertCircle, Sparkles, MessageSquare, Send, 
  User, Check, Settings, Key, HelpCircle, Laptop, CreditCard, ChevronRight, Trash2,
  Inbox, ExternalLink, Camera, Upload
} from 'lucide-react';
import { Listing, CategoryType } from '../types.js';
import { CATEGORIES_LIST } from '../data/mockListings.js';
import { getStoredOrders } from '../services/deliveryStore.js';
import { 
  getStoredDirectChats, 
  getUserDirectChats,
  addDirectChatMessage, 
  deleteDirectChat, 
  DirectChatSession 
} from '../services/directChatStore.js';
import { getCurrentLoggedInEmail } from '../services/sellerStore.js';
import { dispatchCustomEvent } from '../utils/eventBus.js';

// ---------------------------------------------------------------------------
// 1. CATEGORIES PAGE
// ---------------------------------------------------------------------------
interface CategoriesPageProps {
  onSelectCategory: (category: CategoryType) => void;
  onNavigateHome: () => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  onSelectCategory,
  onNavigateHome
}) => {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-16 space-y-6">
      <div className="border-b border-[#E2DDD3] pb-4">
        <h1 className="font-serif font-bold text-3xl text-[#2C2A26]">
          Categories Catalog
        </h1>
        <p className="text-sm text-[#5D5A53] mt-1">
          Browse specialized listings across digital business models and technologies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES_LIST.map((cat) => {
          if (cat.id === 'All') return null;
          return (
            <div 
              key={cat.id}
              className="bg-white border border-[#E2DDD3] rounded-3xl p-6 flex flex-col justify-between hover:border-amber-600 transition-all shadow-sm hover:shadow group cursor-pointer"
              onClick={() => {
                onSelectCategory(cat.id as CategoryType);
                onNavigateHome();
              }}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#FAF8F5] rounded-2xl flex items-center justify-center border border-[#E2DDD3] group-hover:bg-amber-50 group-hover:border-amber-400 transition-colors">
                  <Sparkles className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2C2A26] flex items-center gap-2">
                    <span>{cat.name}</span>
                    <span className="text-xs bg-[#F5F2EB] text-[#5D5A53] px-2.5 py-0.5 rounded-full font-sans font-medium">
                      {(cat as any).count || 0} assets
                    </span>
                  </h3>
                  <p className="text-xs text-[#8C8275] mt-1.5 leading-relaxed">
                    Explore verified digital products, SaaS integrations, and turnkey solutions in {cat.name}.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#FAF8F5] flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Explore Available Projects</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};


// ---------------------------------------------------------------------------
// 2. PURCHASES PAGE
// ---------------------------------------------------------------------------
export const BuyerPurchasesPage: React.FC = () => {
  const completedOrders = (getStoredOrders() || []).filter(o => o?.deliveryStatus === 'Completed');

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-16 space-y-6">
      <div className="border-b border-[#E2DDD3] pb-4">
        <h1 className="font-serif font-bold text-3xl text-[#2C2A26]">
          My Acquired Assets
        </h1>
        <p className="text-sm text-[#5D5A53] mt-1">
          Access your digital files, software licenses, database structures, and keys
        </p>
      </div>

      {completedOrders.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white border border-[#E2DDD3] rounded-3xl shadow-sm">
          <ShoppingBag className="w-10 h-10 text-[#8C8275] mx-auto" />
          <h3 className="font-serif font-bold text-lg text-[#2C2A26]">No Acquired Assets Yet</h3>
          <p className="text-xs text-[#5D5A53] max-w-md mx-auto">
            You have not completed any project purchases yet. When you acquire a listing on AIWebCrafter, its downloadable assets, license keys, and credentials will appear here.
          </p>
        </div>
      ) : (
        completedOrders.map((item) => (
          <div key={item.id} className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#FAF8F5] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Verified Transfer
                </span>
                <h2 className="font-serif font-bold text-xl text-[#2C2A26] mt-1">{item.projectTitle}</h2>
                <p className="text-xs text-[#8C8275] mt-0.5">Purchased on {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'} for ${(item.askingPrice || 0).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 bg-[#FAF8F5] p-3 rounded-2xl border border-[#E2DDD3]">
                <Key className="w-4 h-4 text-amber-700" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#8C8275] block">Order Ref</span>
                  <code className="text-xs font-mono font-bold text-[#2C2A26]">{item.paymentReference || item.id}</code>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D5A53] flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#8C8275]" />
                  <span>Transfer Assets ({item.assets.length})</span>
                </h3>
                <div className="space-y-2">
                  {item.assets.map((ast) => (
                    <div key={ast.id} className="flex items-center justify-between p-3 bg-[#FAF8F5] border border-[#E2DDD3] rounded-xl">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-[#8C8275] flex-shrink-0" />
                        <span className="text-xs font-medium text-[#2C2A26] truncate">{ast.title}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-full border border-emerald-300">
                        {ast.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E2DDD3] p-4 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D5A53]">Seller Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-bold text-[#2C2A26] block">{item.sellerName}</span>
                    <span className="text-[10px] text-[#8C8275]">{item.sellerEmail}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </section>
  );
};


// ---------------------------------------------------------------------------
// 3. ORDERS PAGE
// ---------------------------------------------------------------------------
interface BuyerOrdersPageProps {
  onOpenDelivery: (orderId: string) => void;
}

export const BuyerOrdersPage: React.FC<BuyerOrdersPageProps> = ({
  onOpenDelivery
}) => {
  const activeOrders = getStoredOrders();

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-16 space-y-6">
      <div className="border-b border-[#E2DDD3] pb-4">
        <h1 className="font-serif font-bold text-3xl text-[#2C2A26]">
          Escrow & Active Orders
        </h1>
        <p className="text-sm text-[#5D5A53] mt-1">
          Monitor your active transactions, escrow releases, and code transfers securely
        </p>
      </div>

      {activeOrders.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white border border-[#E2DDD3] rounded-3xl shadow-sm">
          <Clock className="w-10 h-10 text-[#8C8275] mx-auto" />
          <h3 className="font-serif font-bold text-lg text-[#2C2A26]">No Active Escrow Orders</h3>
          <p className="text-xs text-[#5D5A53] max-w-md mx-auto">
            You have no active escrow transactions at the moment. When you purchase a project on AIWebCrafter, your order status and transfer steps will be tracked here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeOrders.map((order) => (
            <div key={order.id} className="bg-white border border-[#E2DDD3] rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:shadow transition-all">
              <div className="space-y-3 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-[#8C8275] bg-[#F5F2EB] px-2.5 py-0.5 rounded-full">
                    ID: {order.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    order?.deliveryStatus === 'Completed' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    order?.deliveryStatus === 'Disputed' ? 'bg-red-100 text-red-900 border-red-300' :
                    'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {order?.deliveryStatus || 'Pending'}
                  </span>
                  <span className="text-[10px] text-[#8C8275]">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#2C2A26]">{order.projectTitle}</h3>
                  <p className="text-xs text-[#8C8275] mt-0.5">Contract Amount: <span className="font-bold text-[#2C2A26]">${(order.askingPrice || 0).toLocaleString()}</span> • Seller: {order.sellerName}</p>
                </div>
              </div>

              <div className="flex-shrink-0 w-full md:w-auto">
                <button
                  onClick={() => onOpenDelivery(order.id)}
                  className="w-full md:w-auto px-5 py-2.5 bg-[#2C2A26] hover:bg-[#423E38] text-[#F5F2EB] text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Track & Manage Delivery</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};


// ---------------------------------------------------------------------------
// 4. MESSAGES PAGE
// ---------------------------------------------------------------------------
interface BuyerMessagesPageProps {
  onNavigateHome?: () => void;
  userRole?: string;
}

export const BuyerMessagesPage: React.FC<BuyerMessagesPageProps> = ({ onNavigateHome, userRole }) => {
  const currentEmail = getCurrentLoggedInEmail();
  const [chats, setChats] = useState<DirectChatSession[]>(() => getUserDirectChats(currentEmail, userRole) || []);
  const [activeChatId, setActiveChatId] = useState<string | null>(() => (chats && chats[0] ? chats[0].id : null));
  const [inputText, setInputText] = useState('');

  const refreshChats = () => {
    const email = getCurrentLoggedInEmail();
    const updatedList = getUserDirectChats(email, userRole) || [];
    setChats(updatedList);
    if (updatedList.length > 0 && (!activeChatId || !updatedList.some(c => c.id === activeChatId))) {
      setActiveChatId(updatedList[0]?.id || null);
    }
  };

  // Sync state when direct-chats-updated event fires
  useEffect(() => {
    refreshChats();
    const handleChatsUpdated = () => {
      refreshChats();
    };

    window.addEventListener('direct-chats-updated', handleChatsUpdated);
    return () => window.removeEventListener('direct-chats-updated', handleChatsUpdated);
  }, [activeChatId, userRole]);

  const currentChat = chats.find(c => c.id === activeChatId);

  // Check if current logged-in user is the Seller for this session
  const isSellerForChat = currentChat && (
    (currentChat.sellerEmail && currentEmail && currentChat.sellerEmail.toLowerCase() === currentEmail.toLowerCase()) ||
    userRole === 'VENDOR'
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');

    const senderRole = isSellerForChat ? 'seller' : 'buyer';
    const updatedSession = addDirectChatMessage(
      activeChatId, 
      senderRole, 
      messageText,
      isSellerForChat ? (currentChat?.sellerName || 'Seller') : (currentChat?.buyerEmail || 'Buyer')
    );
    if (updatedSession) {
      refreshChats();
    }
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDirectChat(chatId);
    refreshChats();
  };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-16 space-y-6">
      <div className="border-b border-[#E2DDD3] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-3xl text-[#2C2A26]">
            Direct Messages & Communications
          </h1>
          <p className="text-sm text-[#5D5A53] mt-1">
            Isolated communication portal between Buyers, Sellers, and Marketplace Admins
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentEmail && (
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-300">
              User: {currentEmail}
            </span>
          )}
          {chats.length > 0 && (
            <div className="text-xs font-bold text-[#8C8275] bg-[#F5F2EB] px-3 py-1.5 rounded-full border border-[#E2DDD3]">
              {chats.length} {chats.length === 1 ? 'Active Session' : 'Active Sessions'}
            </div>
          )}
        </div>
      </div>

      {chats.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-[#E2DDD3] rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 shadow-sm my-8">
          <div className="w-16 h-16 bg-[#F5F2EB] text-[#2C2A26] border border-[#E2DDD3] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Inbox className="w-8 h-8 text-amber-900" />
          </div>
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-2xl text-[#2C2A26]">
              No Private Messages
            </h3>
            <p className="text-xs text-[#5D5A53] leading-relaxed max-w-md mx-auto">
              Your message box is isolated for privacy. When a buyer or seller initiates a discussion on a listing, messages will route specifically to your account ({currentEmail || 'guest'}).
            </p>
          </div>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2C2A26] hover:bg-[#423E38] text-white font-bold text-xs rounded-xl transition-all shadow-sm mt-2"
            >
              <span>Browse Marketplace Listings</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          )}
        </div>
      ) : (
        /* Active Discussions Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white border border-[#E2DDD3] rounded-3xl overflow-hidden min-h-[520px] shadow-sm">
          {/* Chats list sidebar (1 col wide) */}
          <div className="lg:col-span-1 border-r border-[#E2DDD3] bg-[#FAF8F5] flex flex-col">
            <div className="p-4 border-b border-[#E2DDD3] bg-white flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2C2A26]">Discussions ({chats.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#E2DDD3]">
              {chats.map((chat) => {
                const isSellerView = chat.sellerEmail && currentEmail && chat.sellerEmail.toLowerCase() === currentEmail.toLowerCase();
                const displayTitle = isSellerView ? `Buyer: ${chat.buyerEmail || 'Verified Buyer'}` : chat.sellerName;

                return (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`w-full p-4 text-left flex gap-3 transition-colors cursor-pointer group relative ${
                      activeChatId === chat.id ? 'bg-[#F5F2EB]' : 'hover:bg-white'
                    }`}
                  >
                    <img src={chat.sellerAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-[#E2DDD3] shrink-0" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#2C2A26] truncate">{displayTitle}</span>
                        <span className="text-[9px] text-[#8C8275]">{chat.time}</span>
                      </div>
                      <span className="text-[10px] text-amber-800 font-medium block truncate">{chat.projectName}</span>
                      <p className="text-[11px] text-[#5D5A53] truncate mt-0.5">{chat.lastMessage || 'No messages yet'}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      title="Delete Conversation"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#8C8275] hover:text-red-600 self-start"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat window pane (2 cols wide) */}
          {currentChat ? (
            <div className="lg:col-span-2 flex flex-col justify-between h-[520px] bg-white">
              {/* Top chat bar */}
              <div className="p-4 border-b border-[#E2DDD3] flex items-center justify-between bg-[#FDFCF9]">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={currentChat.sellerAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-[#E2DDD3] shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#2C2A26] truncate">
                      {isSellerForChat ? `Buyer Inquiry (${currentChat.buyerEmail || 'Buyer'})` : currentChat.sellerName}
                    </h4>
                    <p className="text-[10px] text-[#8C8275] truncate">
                      Listing: <span className="text-amber-800 font-semibold">{currentChat.projectName}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[9px] font-bold text-emerald-800">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span>
                    <span>{isSellerForChat ? 'You: Seller' : 'You: Buyer'}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(currentChat.id, e)}
                    className="p-1.5 text-[#8C8275] hover:text-red-600 rounded-lg hover:bg-[#F5F2EB] transition-colors"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages block */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFCF9]">
                {currentChat.messages.length === 0 ? (
                  <p className="text-center text-xs text-[#8C8275] py-8">Start the conversation by typing a message below...</p>
                ) : (
                  currentChat.messages.map((msg, idx) => {
                    const isMyMessage = (isSellerForChat && msg.sender === 'seller') || (!isSellerForChat && msg.sender === 'buyer');

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col max-w-[80%] ${
                          isMyMessage ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div className="text-[9px] text-[#8C8275] mb-0.5 px-1 font-semibold">
                          {msg.sender === 'seller' ? `Seller (${currentChat.sellerName})` : `Buyer (${currentChat.buyerEmail || 'Buyer'})`}
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isMyMessage
                              ? 'bg-[#2C2A26] text-[#F5F2EB] rounded-br-none shadow-sm'
                              : 'bg-[#F5F2EB] text-[#2C2A26] border border-[#E2DDD3] rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-[#8C8275] mt-1 px-1">{msg.time}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message input footer */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[#E2DDD3] flex gap-2 bg-white">
                <input
                  type="text"
                  placeholder={
                    isSellerForChat 
                      ? `Reply to buyer (${currentChat.buyerEmail || 'Buyer'})...`
                      : `Write a message to seller (${currentChat.sellerName})...`
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-[#FAF8F5] border border-[#E2DDD3] text-xs rounded-xl px-4 py-2.5 text-[#2C2A26] focus:outline-none focus:border-[#2C2A26]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-5 py-2.5 bg-[#2C2A26] hover:bg-[#423E38] disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center h-[520px] text-xs text-[#8C8275]">
              Select a conversation from the sidebar to view details.
            </div>
          )}
        </div>
      )}
    </section>
  );
};


// ---------------------------------------------------------------------------
// 5. ACCOUNT PAGE
// ---------------------------------------------------------------------------
export const BuyerAccountPage: React.FC = () => {
  const currentEmail = getCurrentLoggedInEmail();
  const storageKey = `aiwebcrafter_profile_${currentEmail || 'guest'}`;

  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    // Clean initial state, no pre-filled mock names like "Yassine Alami"
    return {
      name: '',
      email: currentEmail || '',
      phone: '',
      location: '',
      company: '',
      photoUrl: ''
    };
  });

  const [hasSaved, setHasSaved] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    // Strict Size Limit Check: 5MB maximum
    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(`Image size exceeds the maximum allowed limit of 5MB.`);
      return;
    }

    // Security Verification: prevent unsafe/malicious uploads
    // 1. Verify standard mime types for image content
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload a valid image (JPEG, PNG, GIF, WEBP).');
      return;
    }

    // 2. Sanity check file extension
    const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setUploadError('Invalid file extension. Please use a secure image format.');
      return;
    }

    // Read securely via FileReader
    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError('Failed to securely read the uploaded image.');
    };
    reader.onload = () => {
      const base64Data = reader.result as string;
      // 3. Ensure base64 string starts with valid data URI schema to block script payloads
      if (base64Data.startsWith('data:image/')) {
        setProfile((prev: any) => ({ ...prev, photoUrl: base64Data }));
      } else {
        setUploadError('Unsafe content detected in file payload.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
      // Dispatch profile update event for live visual syncing
      dispatchCustomEvent('profile-updated');
    } catch (err) {
      console.error('Error saving profile:', err);
    }
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 2500);
  };

  const nameInitials = profile.name
    ? profile.name.slice(0, 2).toUpperCase()
    : (profile.email ? profile.email.slice(0, 2).toUpperCase() : 'US');

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-16 space-y-6">
      <div className="border-b border-[#E2DDD3] pb-4">
        <h1 className="font-serif font-bold text-3xl text-[#2C2A26]">
          Account Settings
        </h1>
        <p className="text-sm text-[#5D5A53] mt-1">
          Manage your verified buyer identity, personal avatar, and contact coordinates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main settings edit form (2 cols wide) */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-6 shadow-sm">
          {/* Avatar & Photo Upload Block */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-[#F5F2EB]">
            <div className="relative group self-start sm:self-auto">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt="Profile Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#2C2A26] shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 bg-[#2C2A26] text-[#F5F2EB] rounded-2xl flex items-center justify-center font-bold font-serif text-3xl border border-[#E2DDD3] shadow-inner">
                  {nameInitials}
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 bg-amber-100 hover:bg-amber-200 text-[#2C2A26] p-1.5 rounded-xl border border-amber-300 cursor-pointer shadow-sm transition-all flex items-center justify-center">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#2C2A26]">
                {profile.name || 'Your Account Profile'}
              </h3>
              <p className="text-xs text-[#5D5A53]">
                Click the camera icon to upload your real photo. Max size: <strong className="text-[#2C2A26]">5MB</strong>.
              </p>
              {uploadError && (
                <p className="text-[11px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-200 mt-1">
                  {uploadError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-[#2C2A26] uppercase">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your real full name..."
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] text-[#2C2A26] rounded-xl p-3 focus:outline-none focus:border-[#2C2A26]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#2C2A26] uppercase">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="Enter email address..."
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] text-[#2C2A26] rounded-xl p-3 focus:outline-none focus:border-[#2C2A26]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#2C2A26] uppercase">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="e.g. +212 600-000000"
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] text-[#2C2A26] rounded-xl p-3 focus:outline-none focus:border-[#2C2A26]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#2C2A26] uppercase">Location</label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="e.g. Casablanca, Morocco"
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] text-[#2C2A26] rounded-xl p-3 focus:outline-none focus:border-[#2C2A26]"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-bold text-[#2C2A26] uppercase">Company / Fund</label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                placeholder="Enter your investment firm or company name..."
                className="w-full bg-[#FAF8F5] border border-[#E2DDD3] text-[#2C2A26] rounded-xl p-3 focus:outline-none focus:border-[#2C2A26]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#FAF8F5] flex items-center justify-between">
            {hasSaved ? (
              <span className="text-xs text-green-700 font-bold flex items-center gap-1.5 animate-pulse">
                <Check className="w-4 h-4" />
                <span>Changes saved successfully!</span>
              </span>
            ) : (
              <span></span>
            )}
            <button
              type="submit"
              className="px-6 py-3 bg-[#2C2A26] hover:bg-[#423E38] text-white font-bold rounded-xl text-xs transition-all shadow"
            >
              Save Profile Details
            </button>
          </div>
        </form>

        {/* Right side verification & security (1 col wide) */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D5A53]">Identity & Compliance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl border border-green-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-700" />
                  <div>
                    <span className="text-xs font-bold text-green-900 block">KYC Verification</span>
                    <span className="text-[10px] text-green-700">Completed & Approved</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl border border-green-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-700" />
                  <div>
                    <span className="text-xs font-bold text-green-900 block">Accreditation</span>
                    <span className="text-[10px] text-green-700">Proof of Funds Uploaded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2DDD3] rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D5A53]">Security</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-[#2C2A26] block">Two-Factor Authentication</span>
                  <span className="text-[10px] text-[#8C8275]">Secured via SMS & App</span>
                </div>
                <span className="text-[10px] font-bold text-green-700">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
