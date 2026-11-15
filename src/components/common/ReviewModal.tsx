import React, { useState } from 'react';
import { Star, X, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { Booking } from '../../types';

interface ReviewModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

const FEEDBACK_QUICK_TAGS_BN = [
  'সময়মতো এসেছেন',
  'নিখুঁত কাজ',
  'ভদ্র ব্যবহার',
  'ন্যায্য মূল্য',
  'পরিচ্ছন্নতা বজায় রেখেছেন'
];

export const ReviewModal: React.FC<ReviewModalProps> = ({ booking, isOpen, onClose }) => {
  const { t, isBangla } = useLanguage();
  const { submitReview } = useApp();
  const { currentUser } = useAuth();

  const [overallRating, setOverallRating] = useState<number>(5);
  const [workQuality, setWorkQuality] = useState<number>(5);
  const [behavior, setBehavior] = useState<number>(5);
  const [punctuality, setPunctuality] = useState<number>(5);
  const [priceFairness, setPriceFairness] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['সময়মতো এসেছেন', 'নিখুঁত কাজ']);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    submitReview({
      bookingId: booking.id,
      customerId: currentUser?.id || booking.customerId || 'user-cust-demo',
      customerName: currentUser?.name || booking.customerName || 'গ্রাহক',
      customerAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      technicianId: booking.technicianId,
      overallRating,
      workQuality,
      behavior,
      punctuality,
      priceFairness,
      feedbackTags: selectedTags,
      comment: comment.trim() || 'চমৎকার ও বিশ্বস্ত সার্ভিস! সমস্যার দ্রুত ও স্থায়ী সমাধান পেয়েছি।',
      serviceName: booking.serviceNameBn
    });

    setIsSubmitting(false);
    onClose();
  };

  const renderStarSelector = (value: number, onChange: (val: number) => void) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5 text-zinc-300 hover:text-amber-400 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
        >
          <Star
            className={`w-5 h-5 ${
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'text-zinc-300 dark:text-zinc-600'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[3100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="font-black text-base text-zinc-900 dark:text-zinc-100">
              {t.review.title}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">{booking.technicianName} · {booking.serviceNameBn}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          {/* Main Rating */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40">
            <div>
              <span className="font-black text-xs text-zinc-900 dark:text-zinc-100 block">{t.review.overall}</span>
              <span className="text-[11px] text-orange-600 font-bold">{overallRating} / 5 স্টার</span>
            </div>
            {renderStarSelector(overallRating, setOverallRating)}
          </div>

          {/* Granular Sub-metrics */}
          <div className="space-y-2.5 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400 font-semibold">{t.review.quality}</span>
              {renderStarSelector(workQuality, setWorkQuality)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400 font-semibold">{t.review.behavior}</span>
              {renderStarSelector(behavior, setBehavior)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400 font-semibold">{t.review.punctuality}</span>
              {renderStarSelector(punctuality, setPunctuality)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400 font-semibold">{t.review.priceFairness}</span>
              {renderStarSelector(priceFairness, setPriceFairness)}
            </div>
          </div>

          {/* Quick Feedback Tags */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              {isBangla ? 'দ্রুত ফিডব্যাক ট্যাগ নির্বাচন করুন:' : 'Quick Feedback Highlights:'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_QUICK_TAGS_BN.map(tag => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                      active
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-stone-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text feedback */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t.review.commentPlaceholder}
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="মিস্ত্রি সময়মতো এসেছিলেন? কাজের অভিজ্ঞতা কেমন ছিল লিখুন..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-black rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-md transition-colors cursor-pointer"
            >
              {t.review.submitReview}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
