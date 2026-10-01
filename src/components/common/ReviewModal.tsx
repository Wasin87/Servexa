import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { Booking } from '../../types';

interface ReviewModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ booking, isOpen, onClose }) => {
  const { t } = useLanguage();
  const { submitReview } = useApp();
  const { currentUser } = useAuth();

  const [overallRating, setOverallRating] = useState<number>(5);
  const [workQuality, setWorkQuality] = useState<number>(5);
  const [behavior, setBehavior] = useState<number>(5);
  const [punctuality, setPunctuality] = useState<number>(5);
  const [priceFairness, setPriceFairness] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    submitReview({
      bookingId: booking.id,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerAvatar: currentUser.avatar,
      technicianId: booking.technicianId,
      overallRating,
      workQuality,
      behavior,
      punctuality,
      priceFairness,
      comment: comment.trim() || 'চমৎকার ও বিশ্বস্ত সার্ভিস!',
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
          className="p-1 text-zinc-300 hover:text-amber-400 focus:outline-none transition-colors"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {t.review.title}
            </h3>
            <p className="text-xs text-zinc-500">{booking.technicianName} · {booking.serviceNameBn}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          {/* Main Rating */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{t.review.overall}</span>
            {renderStarSelector(overallRating, setOverallRating)}
          </div>

          {/* Granular Sub-metrics */}
          <div className="space-y-2.5 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">{t.review.quality}</span>
              {renderStarSelector(workQuality, setWorkQuality)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">{t.review.behavior}</span>
              {renderStarSelector(behavior, setBehavior)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">{t.review.punctuality}</span>
              {renderStarSelector(punctuality, setPunctuality)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">{t.review.priceFairness}</span>
              {renderStarSelector(priceFairness, setPriceFairness)}
            </div>
          </div>

          {/* Text feedback */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t.review.commentPlaceholder}
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="মিস্ত্রি সময়মতো এসেছিলেন? কাজের অভিজ্ঞতা কেমন ছিল লিখুন..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-colors"
            >
              {t.review.submitReview}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
