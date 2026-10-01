import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  FileText,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Star,
  Printer,
  XCircle,
  Truck,
  Wrench,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { ReviewModal } from '../components/common/ReviewModal';
import { ReportModal } from '../components/common/ReportModal';
import { ChatModal } from '../components/common/ChatModal';
import { BookingStatus } from '../types';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings, updateBookingStatus, submitWarrantyClaim } = useApp();
  const { t, isBangla } = useLanguage();
  const { currentUser } = useAuth();

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [warrantyDescription, setWarrantyDescription] = useState('');
  const [warrantyFormOpen, setWarrantyFormOpen] = useState(false);

  const booking = bookings.find((b) => b.id === id);

  if (!booking) {
    return (
      <div className="py-20 text-center text-zinc-500">
        <p className="text-lg font-bold">বুকিং তথ্য খুঁজে পাওয়া যায়নি।</p>
        <Link to="/customer/bookings" className="mt-4 inline-block text-orange-600 underline text-sm">
          আপনার বুকিং তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  const timelineSteps: { status: BookingStatus; labelBn: string; labelEn: string }[] = [
    { status: 'REQUESTED', labelBn: 'বুকিং আবেদন', labelEn: 'Requested' },
    { status: 'ACCEPTED', labelBn: 'মিস্ত্রি গ্রহণ করেছেন', labelEn: 'Accepted' },
    { status: 'ON_THE_WAY', labelBn: 'রওনা হয়েছেন', labelEn: 'On The Way' },
    { status: 'ARRIVED', labelBn: 'ঠিকানায় পৌঁছেছেন', labelEn: 'Arrived' },
    { status: 'IN_PROGRESS', labelBn: 'কাজ চলমান', labelEn: 'In Progress' },
    { status: 'COMPLETED', labelBn: 'সম্পন্ন', labelEn: 'Completed' },
  ];

  const currentStepIndex = timelineSteps.findIndex(s => s.status === booking.status);

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [warrantySuccessMessage, setWarrantySuccessMessage] = useState(false);

  const handleCancelBooking = () => {
    updateBookingStatus(booking.id, 'CANCELLED', 'Cancelled by customer', 'গ্রাহক দ্বারা বুকিং বাতিল করা হয়েছে');
    setConfirmCancelOpen(false);
  };

  const handleWarrantySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    submitWarrantyClaim({
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      customerId: currentUser.id,
      technicianId: booking.technicianId,
      serviceName: booking.serviceNameBn,
      issueDescription: warrantyDescription
    });
    setWarrantyFormOpen(false);
    setWarrantySuccessMessage(true);
    setTimeout(() => setWarrantySuccessMessage(false), 5000);
  };

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Bar Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.actions.back}</span>
        </button>

        <div className="flex items-center gap-3">
          <StatusBadge status={booking.status} type="booking" className="text-sm font-bold" />
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
            {booking.bookingNumber}
          </span>
        </div>
      </div>

      {/* Live Map / Technician Status Simulation Bar */}
      {booking.status === 'ON_THE_WAY' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-orange-600 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Truck className="w-5 h-5 animate-bounce" />
              <span>মিস্ত্রি আপনার ঠিকানার উদ্দেশ্যে রওনা হয়েছেন</span>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
              আনুমানিক সময়: ২০-২৫ মিনিট
            </span>
          </div>

          {/* Graphical Route Simulation */}
          <div className="p-3 bg-white/10 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>মিরপুর হাব</span>
            </div>
            <div className="flex-1 mx-4 h-1 bg-white/30 rounded-full relative overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 bg-white w-2/3 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>{booking.customerArea}</span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Status Timeline */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500 mb-6">
          কাজের বর্তমান অগ্রগতি (Status Timeline)
        </h3>

        <div className="relative">
          <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 z-0" />
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
            {timelineSteps.map((step, idx) => {
              const isPast = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step.status} className="flex flex-col items-center text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-orange-600 text-white ring-4 ring-orange-100 dark:ring-orange-950/60'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isPast && !isCurrent ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] mt-2 font-medium leading-tight ${
                      isCurrent
                        ? 'text-orange-600 dark:text-orange-400 font-bold'
                        : isPast
                        ? 'text-zinc-800 dark:text-zinc-200'
                        : 'text-zinc-400'
                    }`}
                  >
                    {isBangla ? step.labelBn : step.labelEn}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Technician Info & Booking Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-7 space-y-6">
          {/* Service Details Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              {booking.serviceNameBn}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 block mb-1">সমস্যার বর্ণনা:</span>
                <p className="text-zinc-800 dark:text-zinc-200 bg-stone-50 dark:bg-zinc-800/60 p-3 rounded-xl leading-relaxed">
                  {booking.problemDescription}
                </p>
              </div>

              {booking.mediaUrls.length > 0 && (
                <div>
                  <span className="text-zinc-400 block mb-1.5">সংযুক্ত ছবি/ভিডিও:</span>
                  <div className="flex gap-2">
                    {booking.mediaUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Evidence"
                        className="w-16 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-zinc-400 block">তারিখ:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{booking.date}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">সময় স্লট:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{booking.timeSlot}</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-zinc-400 block">ঠিকানা:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {booking.customerAddress}, {booking.customerArea}, {booking.customerCity}
                </span>
              </div>
            </div>
          </div>

          {/* Status Updates Log */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500">
              স্ট্যাটাস হিস্ট্রি ও নোট
            </h3>
            <div className="space-y-2 text-xs divide-y divide-zinc-100 dark:divide-zinc-800">
              {booking.statusHistory.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex justify-between items-start gap-4">
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {isBangla ? item.noteBn : item.noteEn}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Technician Card, Invoices & Actions */}
        <div className="md:col-span-5 space-y-6">
          {/* Assigned Technician */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={booking.technicianAvatar}
                alt={booking.technicianName}
                className="w-14 h-14 rounded-2xl object-cover border border-orange-500"
              />
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {booking.technicianName}
                </h4>
                <div className="text-xs text-zinc-500 font-mono mt-0.5">
                  {booking.technicianPhone}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ভেরিফায়েড টেকনিশিয়ান</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setChatModalOpen(true)}
                className="py-2 px-3 text-xs font-semibold rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>মেসেজ দিন</span>
              </button>
              <a
                href={`tel:${booking.technicianPhone}`}
                className="py-2 px-3 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-center"
              >
                সরাসরি কল
              </a>
            </div>
          </div>

          {/* Pricing & Invoice Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500">
              খরচের হিসাব ও পেমেন্ট
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">ভিজিটিং ফি:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">৳{booking.estimatedVisitingFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">আনুমানিক শ্রম চার্জ:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  ৳{booking.estimatedLabourMin}–৳{booking.estimatedLabourMax}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-sm font-bold">
                <span className="text-zinc-900 dark:text-zinc-100">সর্বমোট (আনুমানিক):</span>
                <span className="text-orange-600 dark:text-orange-400">
                  ৳{booking.finalTotal || booking.estimatedTotalMax}
                </span>
              </div>
            </div>

            {booking.invoice && (
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(true)}
                className="w-full mt-3 py-2 text-xs font-bold rounded-lg border border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ডিজিটাল ইনভয়েস দেখুন</span>
              </button>
            )}
          </div>

          {/* Actions: Review, Warranty, Rebook, Cancel */}
          <div className="space-y-2">
            {booking.status === 'COMPLETED' && !booking.reviewed && (
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Star className="w-4 h-4" />
                <span>মতামত ও রেটিং দিন</span>
              </button>
            )}

            {booking.status === 'COMPLETED' && (
              <button
                type="button"
                onClick={() => setWarrantyFormOpen(!warrantyFormOpen)}
                className="w-full py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>{booking.warrantyDays} দিনের ফ্রি ওয়ারেন্টি দাবি</span>
              </button>
            )}

            {booking.status === 'COMPLETED' && (
              <Link
                to={`/book?techId=${booking.technicianId}&categoryId=${booking.categoryId}`}
                className="w-full py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 block text-center"
              >
                <RotateCcw className="w-4 h-4" />
                <span>একই মিস্ত্রি আবার বুক করুন (Rebook)</span>
              </Link>
            )}

            {warrantySuccessMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                ✓ ওয়ারেন্টি আবেদন সফলভাবে জমা হয়েছে! টেকনিশিয়ান ২৪ ঘণ্টার মধ্যে যোগাযোগ করবেন।
              </div>
            )}

            {['REQUESTED', 'ACCEPTED'].includes(booking.status) && (
              confirmCancelOpen ? (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs space-y-2">
                  <p className="font-semibold text-rose-800 dark:text-rose-300">
                    আপনি কি নিশ্চিত যে বুকিং বাতিল করতে চান?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancelBooking}
                      className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold"
                    >
                      হ্যাঁ, বাতিল করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancelOpen(false)}
                      className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg"
                    >
                      না
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancelOpen(true)}
                  className="w-full py-2 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  বুকিং বাতিল করুন
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="w-full py-1 text-center text-[11px] text-zinc-400 hover:text-rose-600 transition-colors"
            >
              কোনো সমস্যা? অভিযোগ জানান
            </button>
          </div>
        </div>
      </div>

      {/* Warranty Form Drawer */}
      {warrantyFormOpen && (
        <div className="bg-blue-50/50 dark:bg-blue-950/20 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 space-y-3">
          <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300">
            সার্ভিস ওয়ারেন্টির আওতায় পুনরায় চেকআপের আবেদন
          </h4>
          <form onSubmit={handleWarrantySubmit} className="space-y-3">
            <textarea
              rows={2}
              required
              value={warrantyDescription}
              onChange={(e) => setWarrantyDescription(e.target.value)}
              placeholder="আগের কাজে কী সমস্যা আবার দেখা দিয়েছে বিস্তারিত লিখুন..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWarrantyFormOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-500"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white"
              >
                ওয়ারেন্টি জমা দিন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modals */}
      {booking.invoice && (
        <InvoiceModal
          invoice={booking.invoice}
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
        />
      )}

      {reviewModalOpen && (
        <ReviewModal
          booking={booking}
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
        />
      )}

      {reportModalOpen && (
        <ReportModal
          booking={booking}
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      )}

      {chatModalOpen && (
        <ChatModal
          booking={booking}
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
        />
      )}
    </div>
  );
};
