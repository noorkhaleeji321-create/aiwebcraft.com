import React, { useState, useEffect } from 'react';
import { Headphones, ShieldCheck, MessageSquare, Sparkles } from 'lucide-react';
import { getStoredSupportTickets } from '../services/supportTicketStore.js';
import { getCurrentLoggedInEmail } from '../services/sellerStore.js';

interface FloatingContactAdminButtonProps {
  onClick: () => void;
}

export const FloatingContactAdminButton: React.FC<FloatingContactAdminButtonProps> = ({ onClick }) => {
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);

  const checkTickets = () => {
    try {
      const email = getCurrentLoggedInEmail();
      const list = getStoredSupportTickets();
      const userTickets = email 
        ? list.filter(t => t.senderEmail.toLowerCase() === email.toLowerCase())
        : list;
      
      const open = userTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
      setOpenTicketsCount(open);
    } catch {
      setOpenTicketsCount(0);
    }
  };

  useEffect(() => {
    checkTickets();
    const handleUpdate = () => checkTickets();
    window.addEventListener('support-tickets-updated', handleUpdate);
    return () => window.removeEventListener('support-tickets-updated', handleUpdate);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2 animate-fade-in group">
      <button
        onClick={onClick}
        id="floating-contact-admin-btn"
        className="flex items-center gap-2.5 bg-[#2C2A26] hover:bg-[#423E38] text-[#F5F2EB] border border-[#E2DDD3]/40 px-3.5 py-2.5 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        title="Direct Support Desk (Contact Administration)"
      >
        <div className="w-7 h-7 rounded-full bg-amber-300 text-[#2C2A26] flex items-center justify-center font-bold shadow-xs relative">
          <Headphones className="w-4 h-4 text-[#2C2A26]" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white animate-pulse" />
        </div>

        <div className="text-left hidden sm:block pr-1">
          <span className="text-xs font-bold text-white tracking-tight">Contact Admin</span>
        </div>

        {openTicketsCount > 0 && (
          <span className="bg-amber-400 text-black text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
            {openTicketsCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingContactAdminButton;
