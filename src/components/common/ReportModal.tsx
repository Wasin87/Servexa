import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { Booking } from '../../types';

interface ReportModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ booking, isOpen, onClose }) => {
  const { t } = useLanguage();
  const { submitReport } = useApp();
  const { currentUser } = useAuth();

  const [reason, setReason] = useState<string>('Poor service quality');
  const [description, setDescription] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    submitReport({
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterRole: currentUser.role,
      targetId: booking.technicianId,
      targetName: booking.technicianName,
      targetRole: 'TECHNICIAN',
      reason,
      description: description.trim() || 'গ্রাহক দ্বারা অভিযোগ দায়ের করা হয়েছে।'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {t.actions.reportIssue}
            </h3>
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
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              অভিযোগের ধরণ (Reason)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            >
              <option value="Poor service quality">কাজের মান সন্তোষজনক নয় (Poor service quality)</option>
              <option value="Overcharging / Wrong pricing">অতিরিক্ত মূল্য বা অযৌক্তিক বিল (Overcharging)</option>
              <option value="No-show / Delay">মিস্ত্রি আসেননি বা চরম বিলম্ব (No-show / Delay)</option>
              <option value="Inappropriate behavior">অপেশাদার বা অসদাচরণ (Inappropriate behavior)</option>
              <option value="Damaged property">মালামালের ক্ষতিসাধন (Property damage)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              ঘটনাটির বিস্তারিত বর্ণনা (Description)
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="কী সমস্যা হয়েছে বিস্তারিত লিখুন..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-800 dark:text-amber-300">
            Servexa বিরোধ নিষ্পত্তি দল ২৪ ঘণ্টার মধ্যে উভয় পক্ষের সাথে যোগাযোগ করে ন্যায্য সমাধান করবে।
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
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors"
            >
              {t.actions.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
