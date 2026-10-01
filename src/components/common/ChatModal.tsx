import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image, ShieldCheck, CheckCheck } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Booking } from '../../types';

interface ChatModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ booking, isOpen, onClose }) => {
  const { chatMessages, sendMessage } = useApp();
  const { currentUser } = useAuth();
  const { t, isBangla } = useLanguage();

  const [inputMessage, setInputMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const relevantMessages = chatMessages.filter(m => m.bookingId === booking.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, relevantMessages.length]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessage(booking.id, inputMessage.trim());
    setInputMessage('');
  };

  const isCustomer = currentUser?.role === 'CUSTOMER';
  const otherPartyName = isCustomer ? booking.technicianName : booking.customerName;
  const otherPartyAvatar = isCustomer ? booking.technicianAvatar : (currentUser?.avatar || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg h-[600px] max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={otherPartyAvatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&auto=format&fit=crop&q=80'}
                alt={otherPartyName}
                className="w-10 h-10 rounded-full object-cover border border-orange-500"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                <span>{otherPartyName}</span>
                {isCustomer && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
              </div>
              <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                <span>{booking.serviceNameBn}</span>
                <span>·</span>
                <span className="text-orange-600 dark:text-orange-400 font-mono">#{booking.bookingNumber}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
          <button
            type="button"
            onClick={() => setInputMessage(isBangla ? 'আপনি কতক্ষণের মধ্যে পৌঁছাবেন?' : 'What is your ETA?')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap hover:border-orange-500 transition-colors"
          >
            {isBangla ? 'কতক্ষণের মধ্যে পৌঁছাবেন?' : 'What is ETA?'}
          </button>
          <button
            type="button"
            onClick={() => setInputMessage(isBangla ? 'আমি বাসার ঠিকানা পাঠিয়েছি।' : 'I have shared the exact location.')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap hover:border-orange-500 transition-colors"
          >
            {isBangla ? 'ঠিকানা পাঠিয়েছি' : 'Location sent'}
          </button>
          <button
            type="button"
            onClick={() => setInputMessage(isBangla ? 'গেটে এসে একটি কল দেবেন।' : 'Please call upon arrival.')}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap hover:border-orange-500 transition-colors"
          >
            {isBangla ? 'গেটে এসে কল দিন' : 'Call at gate'}
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/50 dark:bg-zinc-950/40">
          {relevantMessages.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              <p>কোনো বার্তা নেই। প্রথম মেসেজ পাঠিয়ে কথা শুরু করুন।</p>
            </div>
          ) : (
            relevantMessages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const timeFormatted = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isMe
                        ? 'bg-orange-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-xs'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1 px-1">
                    <span>{timeFormatted}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-orange-500" />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isBangla ? 'মেসেজ লিখুন...' : 'Type a message...'}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="p-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white transition-all shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
