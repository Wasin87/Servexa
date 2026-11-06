import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image, ShieldCheck, CheckCheck, Paperclip, Phone, MapPin, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Booking } from '../../types';
import { StatusBadge } from './StatusBadge';

interface ChatModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ booking, isOpen, onClose }) => {
  const { chatMessages, sendMessage, markChatMessagesRead } = useApp();
  const { currentUser } = useAuth();
  const { isBangla } = useLanguage();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCustomer = currentUser?.role === 'CUSTOMER';
  const readerRole = isCustomer ? 'CUSTOMER' : 'TECHNICIAN';

  const relevantMessages = chatMessages.filter(m => m.bookingId === booking.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      markChatMessagesRead(booking.id, readerRole);
    }
  }, [isOpen, relevantMessages.length, booking.id, readerRole]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() && !selectedPhoto) return;

    sendMessage(
      booking.id,
      inputMessage.trim(),
      selectedPhoto || undefined,
      readerRole
    );
    setInputMessage('');
    setSelectedPhoto(null);
  };

  const otherPartyName = isCustomer ? booking.technicianName : booking.customerName;
  const otherPartyPhone = isCustomer ? booking.technicianPhone : booking.customerPhone;
  const otherPartyAvatar = isCustomer ? booking.technicianAvatar : (currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80');

  // Suggestions tailored ONLY to Customer vs ONLY to Technician
  const customerChips = [
    { bn: 'আপনি কতক্ষণের মধ্যে পৌঁছাবেন?', en: 'What is your ETA?' },
    { bn: 'আমি বাসায় আছি, চলে আসুন।', en: 'I am at home, please come over.' },
    { bn: 'গেটে এসে একটি কল দেবেন।', en: 'Please call when you reach gate.' },
    { bn: 'বাসার সঠিক লোকেশন পাঠালাম।', en: 'Exact address sent in note.' },
    { bn: 'কাজের আনুমানিক বিল কত হতে পারে?', en: 'What is the estimated cost?' }
  ];

  const technicianChips = [
    { bn: 'আমি রওনা হয়েছি, ১৫ মিনিটের মধ্যে পৌঁছাবো।', en: 'On my way, arriving in 15 mins.' },
    { bn: 'আপনার গেটের সামনে দাঁড়িয়ে আছি।', en: 'I am standing outside your gate.' },
    { bn: 'ঠিকানা ও বাসা নম্বরটি একটু কনফার্ম করবেন?', en: 'Please confirm house number.' },
    { bn: 'জরুরি কাজের যন্ত্রপাতি ও পার্টস সাথে এনেছি।', en: 'Carrying required tools & parts.' },
    { bn: 'কাজ শুরু করার আগে একবার সমস্যাটি দেখা প্রয়োজন।', en: 'Need to inspect the issue first.' }
  ];

  const activeChips = isCustomer ? customerChips : technicianChips;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg h-[620px] max-h-[92vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={otherPartyAvatar}
                alt={otherPartyName}
                className="w-10 h-10 rounded-full object-cover border-2 border-orange-500 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {otherPartyName}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  {isCustomer ? (isBangla ? 'টেকনিশিয়ান' : 'Tech') : (isBangla ? 'কাস্টমার' : 'Customer')}
                </span>
              </div>

              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">
                  #{booking.bookingNumber}
                </span>
                <span>·</span>
                <span className="truncate">{isBangla ? booking.serviceNameBn : booking.serviceNameEn}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${otherPartyPhone}`}
              className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
              title={isBangla ? 'সরাসরি কল দিন' : 'Call'}
            >
              <Phone className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Service Status Strip */}
        <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {isBangla ? 'সার্ভিস স্ট্যাটাস:' : 'Live Status:'}
            </span>
            <StatusBadge status={booking.status} className="scale-90 origin-left" />
          </div>

          <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
            📍 {booking.customerArea}
          </span>
        </div>

        {/* Quick Suggestion Chips (Strictly Role Based) */}
        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-zinc-500 dark:text-zinc-400 font-bold shrink-0 text-[10px] flex items-center gap-1 bg-stone-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {isCustomer ? (isBangla ? 'কাস্টমার কুইক মেসেজ:' : 'Customer Quick Msg:') : (isBangla ? 'টেকনিশিয়ান কুইক রিপ্লাই:' : 'Pro Quick Reply:')}
          </span>
          {activeChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputMessage(isBangla ? chip.bn : chip.en)}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 whitespace-nowrap hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer shrink-0 font-medium"
            >
              {isBangla ? chip.bn : chip.en}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/50 dark:bg-zinc-950/40">
          {relevantMessages.length === 0 ? (
            <div className="text-center py-14 px-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-xl">
                💬
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'সরাসরি রিয়েল-টাইম কথোপকথন' : 'Direct Live Chat'}
              </h4>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                {isBangla
                  ? 'আপনার কোনো প্রশ্ন বা অবস্থান জানতে সরাসরি মেসেজ পাঠাতে পারেন। মেসেজ করার সাথে সাথে অন্য প্রান্তের নিকট নোটিফিকেশন পৌঁছে যাবে।'
                  : 'Send a message directly to coordinate arrival, location, or problem details.'}
              </p>
            </div>
          ) : (
            relevantMessages.map((msg) => {
              const isMe = (readerRole === 'CUSTOMER' && msg.senderRole === 'CUSTOMER') ||
                           (readerRole === 'TECHNICIAN' && msg.senderRole === 'TECHNICIAN');
              const timeFormatted = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] font-bold text-zinc-400 mb-0.5 px-1">
                    {msg.senderName} ({msg.senderRole === 'CUSTOMER' ? (isBangla ? 'গ্রাহক' : 'Customer') : (isBangla ? 'টেকনিশিয়ান' : 'Tech')})
                  </div>

                  <div
                    className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs space-y-2 ${
                      isMe
                        ? 'bg-orange-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-xs'
                    }`}
                  >
                    {msg.attachmentUrl && (
                      <img
                        src={msg.attachmentUrl}
                        alt="Attachment"
                        className="rounded-xl max-h-40 object-cover w-full border border-black/10"
                      />
                    )}
                    <div>{msg.message}</div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-1 px-1">
                    <span>{timeFormatted}</span>
                    {isMe && (
                      <CheckCheck className={`w-3.5 h-3.5 ${msg.isRead ? 'text-blue-500' : 'text-orange-500'}`} />
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Image Attachment Bar */}
        {selectedPhoto && (
          <div className="px-4 py-2 bg-orange-50 dark:bg-orange-950/40 border-t border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <img src={selectedPhoto} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-orange-500" />
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {isBangla ? 'ছবি সংযুক্ত করা হয়েছে' : 'Photo attached'}
              </span>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="text-zinc-400 hover:text-zinc-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const sampleImages = [
                'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'
              ];
              setSelectedPhoto(sampleImages[Math.floor(Math.random() * sampleImages.length)]);
            }}
            className="p-2 rounded-xl text-zinc-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isBangla ? 'ছবি বা প্রমাণ পাঠান' : 'Attach photo'}
          >
            <Image className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isBangla ? 'মেসেজ টাইপ করুন...' : 'Type a message...'}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() && !selectedPhoto}
            className="p-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-40 text-white transition-all shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

