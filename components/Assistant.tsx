import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, ShieldCheck, Bot, UserCheck, Headphones } from 'lucide-react';
import { ChatMessage } from '../types.js';
import { sendMessageToGemini } from '../services/geminiService.js';
import { 
  getOrCreateVisitorSession, 
  addMessageToSession, 
  getStoredChatSessions, 
  ChatSession 
} from '../services/chatStore.js';

const Assistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'visitor-' + Math.random().toString(36).substring(2, 9);
    let id = localStorage.getItem('aiwebcrafter_visitor_session_id');
    if (!id) {
      id = 'visitor-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('aiwebcrafter_visitor_session_id', id);
    }
    return id;
  });

  const [session, setSession] = useState<ChatSession>(() => 
    getOrCreateVisitorSession(sessionId, 'Verified Buyer')
  );
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll chat session state from storage to catch admin takeover replies & AI active status changes
  useEffect(() => {
    const interval = setInterval(() => {
      const storedSessions = getStoredChatSessions();
      const current = storedSessions.find((s) => s.sessionId === sessionId);
      if (current) {
        setSession({ ...current });
      }
    }, 1500);

    const handleStorageEvent = () => {
      const storedSessions = getStoredChatSessions();
      const current = storedSessions.find((s) => s.sessionId === sessionId);
      if (current) {
        setSession({ ...current });
      }
    };
    window.addEventListener('storage-chat-updated', handleStorageEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage-chat-updated', handleStorageEvent);
    };
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session.messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');
    
    // Add user message to session store
    const updatedSessions = addMessageToSession(sessionId, 'user', userText);
    const updated = updatedSessions.find((s) => s.sessionId === sessionId);
    if (updated) setSession({ ...updated });

    // Check if AI bot is active
    if (!session.aiBotActive) {
      // AI bot is paused due to Human Admin takeover. Do not trigger Gemini! Admin will reply manually.
      return;
    }

    setIsThinking(true);

    try {
      const history = session.messages.map((m) => ({ role: m.role === 'admin' ? 'model' : m.role, text: m.text }));
      const responseText = await sendMessageToGemini(history, userText);

      // Verify AI is still active before adding model response
      const latestSessions = getStoredChatSessions();
      const latestCurrent = latestSessions.find((s) => s.sessionId === sessionId);
      if (latestCurrent && latestCurrent.aiBotActive) {
        const afterAi = addMessageToSession(sessionId, 'model', responseText);
        const cur = afterAi.find((s) => s.sessionId === sessionId);
        if (cur) setSession({ ...cur });
      }
    } catch (error) {
      console.error('Gemini advisor error', error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="bg-[#F5F2EB] rounded-3xl shadow-2xl w-[92vw] sm:w-[400px] h-[520px] max-h-[80vh] mb-3 flex flex-col overflow-hidden border border-[#E2DDD3] animate-fade-in-up">
          {/* Header */}
          <div className="bg-[#2C2A26] text-[#F5F2EB] p-4 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-300 text-[#2C2A26] flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif font-bold text-sm block">AIWebCrafter Advisor</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  {session.aiBotActive ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Verified Deals Assistant (AI Active)</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3 text-amber-400" />
                      <span>Human Admin Connected</span>
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-contact-admin'));
                }}
                className="text-amber-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px] font-bold"
                title="Direct Official Administration Support (Contact Admin)"
              >
                <Headphones className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Desk</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#D6D1C7] hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F2EB]" ref={scrollRef}>
            {session.messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isAdmin = msg.role === 'admin';
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col max-w-[85%]">
                    {isAdmin && (
                      <span className="text-[10px] font-bold text-amber-800 mb-1 ml-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Human Admin (AIWebCrafter)
                      </span>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-[#2C2A26] text-[#F5F2EB] font-medium'
                          : isAdmin
                          ? 'bg-amber-50 border-2 border-amber-300 text-[#2C2A26] shadow-2xs font-medium'
                          : 'bg-white border border-[#E2DDD3] text-[#2C2A26] shadow-2xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
            {isThinking && session.aiBotActive && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E2DDD3] p-3 rounded-2xl flex gap-1.5 items-center shadow-2xs">
                  <div className="w-1.5 h-1.5 bg-[#8C8275] rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-[#8C8275] rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 bg-[#8C8275] rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-[#E2DDD3]">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={session.aiBotActive ? "Ask about SaaS listings, MRR, tech..." : "Type message to Human Admin..."}
                className="flex-1 bg-[#F5F2EB] border border-[#E2DDD3] focus:border-[#2C2A26] px-3 py-2 rounded-xl text-xs outline-none text-[#2C2A26] placeholder-[#8C8275]"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isThinking}
                className="bg-[#2C2A26] text-[#F5F2EB] px-3.5 py-2 rounded-xl hover:bg-[#423E38] transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            {!session.aiBotActive && (
              <div className="mt-2 text-[10px] text-amber-800 text-center font-medium bg-amber-50 py-1 rounded-lg">
                ⚠️ AI Advisor is paused. You are chatting directly with a Human Admin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#2C2A26] text-[#F5F2EB] w-13 h-13 p-3.5 flex items-center justify-center rounded-2xl shadow-xl hover:scale-105 transition-all duration-200 z-50 border border-white/20 relative"
        title="Ask AI Marketplace Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6 text-amber-300" />}
        {!session.aiBotActive && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  );
};

export default Assistant;
