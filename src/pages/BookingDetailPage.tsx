import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  CheckCircle2,
  FileText,
  MessageSquare,
  RotateCcw,
  Star,
  XCircle,
  Truck,
  ArrowLeft,
  CreditCard,
  Banknote,
  Receipt,
  Check,
  X,
  Lock
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
import {
  fetchBookingFinanceDetails,
  respondToExtraCharge,
  initiatePayment,
  fetchPaymentProviders,
} from '../services/financeApi';
import type {
  AdditionalChargeRequest,
  BookingPriceSnapshot,
  CashCollectionRecord,
  PaymentMethodCode,
  PaymentTransaction,
} from '../types/finance';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings, warranties, reviews, updateBookingStatus, submitWarrantyClaim, getUnreadChatCount } = useApp();
  const { t, isBangla } = useLanguage();
  const { currentUser, authTokenReady } = useAuth();

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [warrantyDescription, setWarrantyDescription] = useState('');
  const [warrantyFormOpen, setWarrantyFormOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [warrantySuccessMessage, setWarrantySuccessMessage] = useState(false);

  // Server finance snapshot & payment state
  const [snapshot, setSnapshot] = useState<BookingPriceSnapshot | null>(null);
  const [extraCharges, setExtraCharges] = useState<AdditionalChargeRequest[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [cashCollection, setCashCollection] = useState<CashCollectionRecord | null>(null);
  const [activeMethods, setActiveMethods] = useState<Record<PaymentMethodCode, boolean>>({
    bkash: true,
    nagad: true,
    rocket: true,
    card: true,
    cash: true,
  });
  const [selectedPayMethod, setSelectedPayMethod] = useState<PaymentMethodCode>('bkash');
  const [financeActionMsg, setFinanceActionMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [processingChargeId, setProcessingChargeId] = useState<string | null>(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  const booking = bookings.find((b) => b.id === id);
  const bookingWarranty = booking ? warranties.find(w => w.bookingId === booking.id) : undefined;
  const bookingReview = booking ? reviews.find(r => r.bookingId === booking.id) : undefined;

  const loadFinanceData = useCallback(async () => {
    if (!booking?.id) return;
    try {
      const provRes = await fetchPaymentProviders().catch(() => null);
      if (provRes?.activeMethods) {
        setActiveMethods(provRes.activeMethods);
      }
      if (authTokenReady) {
        const res = await fetchBookingFinanceDetails(booking.id);
        setSnapshot(res.snapshot);
        setExtraCharges(res.extraCharges || []);
        setPaymentTransactions(res.paymentTransactions || []);
        setCashCollection(res.cashCollection || null);
      }
    } catch {
      // Seed / local bookings without server snapshots still render seamlessly
    }
  }, [booking?.id, authTokenReady]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  useEffect(() => {
    if (booking?.paymentMethod && booking.paymentMethod !== 'cash') {
      setSelectedPayMethod(booking.paymentMethod as PaymentMethodCode);
    }
  }, [booking?.paymentMethod]);

  if (!booking) {
    return (
      <div className="py-20 text-center text-zinc-500">
        <p className="text-lg font-bold">
          {isBangla ? 'বুকিং তথ্য খুঁজে পাওয়া যায়নি।' : 'Booking details not found.'}
        </p>
        <Link to="/customer/bookings" className="mt-4 inline-block text-orange-600 underline text-sm">
          {isBangla ? 'আপনার বুকিং তালিকায় ফিরে যান' : 'Return to your bookings'}
        </Link>
      </div>
    );
  }

  const formatExtraChargeType = (ct: string) => {
    if (ct === 'EXTRA_WORK') return isBangla ? 'অতিরিক্ত কাজ' : 'Extra Work';
    if (ct === 'PARTS_MATERIAL') return isBangla ? 'পার্টস / মালামাল' : 'Parts / Material';
    if (ct === 'EMERGENCY') return isBangla ? 'জরুরি চার্জ' : 'Emergency Fee';
    return ct.replace(/_/g, ' ');
  };

  const formatExtraChargeStatus = (st: string) => {
    if (st === 'APPROVED') return isBangla ? 'অনুমোদিত' : 'Approved';
    if (st === 'REJECTED') return isBangla ? 'প্রত্যাখ্যাত' : 'Rejected';
    if (st === 'PENDING_CUSTOMER') return isBangla ? 'গ্রাহক অনুমোদনের অপেক্ষায়' : 'Pending Customer';
    return st;
  };

  const formatTxStatus = (st: string) => {
    if (st === 'PAID') return isBangla ? 'পরিশোধিত' : 'Paid';
    if (st === 'PENDING') return isBangla ? 'অপেক্ষমাণ' : 'Pending';
    if (st === 'FAILED') return isBangla ? 'ব্যর্থ' : 'Failed';
    if (st === 'INITIATED') return isBangla ? 'শুরু হয়েছে' : 'Initiated';
    if (st === 'REFUNDED') return isBangla ? 'রিফান্ড' : 'Refunded';
    return st;
  };

  const formatCashStatus = (st: string) => {
    if (st === 'COLLECTED') return isBangla ? 'সংগৃহীত' : 'Collected';
    if (st === 'DEPOSIT_SUBMITTED') return isBangla ? 'ডিপোজিট জমা' : 'Deposit Submitted';
    if (st === 'SETTLED') return isBangla ? 'সমন্বিত' : 'Settled';
    if (st === 'OVERDUE') return isBangla ? 'মেয়াদ উত্তীর্ণ' : 'Overdue';
    return st;
  };

  const formatWarrantyStatus = (st: string) => {
    if (st === 'REQUESTED') return isBangla ? 'অনুমোদনের অপেক্ষায়' : 'Pending Approval';
    if (st === 'APPROVED') return isBangla ? 'অনুমোদিত' : 'Approved';
    if (st === 'ACCEPTED') return isBangla ? 'গৃহীত' : 'Accepted';
    if (st === 'ON_THE_WAY') return isBangla ? 'রওনা হয়েছেন' : 'On The Way';
    if (st === 'RESOLVED') return isBangla ? 'সমাধান সম্পন্ন' : 'Resolved';
    if (st === 'REJECTED') return isBangla ? 'প্রত্যাখ্যাত' : 'Rejected';
    return st;
  };

  const timelineSteps: { status: BookingStatus; labelBn: string; labelEn: string }[] = [
    { status: 'REQUESTED', labelBn: 'বুকিং আবেদন', labelEn: 'Requested' },
    { status: 'ACCEPTED', labelBn: 'মিস্ত্রি গ্রহণ করেছেন', labelEn: 'Accepted' },
    { status: 'ON_THE_WAY', labelBn: 'রওনা হয়েছেন', labelEn: 'On The Way' },
    { status: 'ARRIVED', labelBn: 'ঠিকানায় পৌঁছেছেন', labelEn: 'Arrived' },
    { status: 'IN_PROGRESS', labelBn: 'কাজ চলমান', labelEn: 'In Progress' },
    { status: 'COMPLETED', labelBn: 'সম্পন্ন', labelEn: 'Completed' },
  ];

  const currentStepIndex = timelineSteps.findIndex(s => s.status === booking.status);

  const handleRespondExtraCharge = async (chargeId: string, decision: 'APPROVE' | 'REJECT') => {
    setProcessingChargeId(chargeId);
    setFinanceActionMsg(null);
    try {
      const res = await respondToExtraCharge(booking.id, chargeId, decision);
      if (res.snapshot) setSnapshot(res.snapshot);
      await loadFinanceData();
      setFinanceActionMsg({
        type: 'success',
        text:
          decision === 'APPROVE'
            ? isBangla
              ? 'অতিরিক্ত চার্জ অনুমোদিত হয়েছে এবং মূল্যের স্ন্যাপশট আপডেট হয়েছে।'
              : 'Extra charge approved and price snapshot updated.'
            : isBangla
              ? 'অতিরিক্ত চার্জের আবেদন প্রত্যাখ্যান করা হয়েছে।'
              : 'Extra charge request rejected.',
      });
    } catch (err: any) {
      setFinanceActionMsg({
        type: 'error',
        text: err?.message || (isBangla ? 'অতিরিক্ত চার্জ আপডেট করতে ব্যর্থ হয়েছে।' : 'Failed to update extra charge.'),
      });
    } finally {
      setProcessingChargeId(null);
    }
  };

  const handleInitiateOnlinePayment = async () => {
    setInitiatingPayment(true);
    setFinanceActionMsg(null);
    try {
      const res = await initiatePayment(booking.id, selectedPayMethod, `${booking.id}-${selectedPayMethod}-${Date.now()}`);
      await loadFinanceData();
      setFinanceActionMsg({
        type: res.configured ? 'success' : 'info',
        text: res.configured
          ? isBangla
            ? `পেমেন্ট সেশন শুরু হয়েছে (${res.transaction.providerTxId || res.transaction.id})। স্ট্যাটাস: ${formatTxStatus(res.transaction.status)}`
            : `Payment session initiated (${res.transaction.providerTxId || res.transaction.id}). Status: ${res.transaction.status}`
          : isBangla
            ? `${res.message} অনুপস্থিত এনভায়রনমেন্ট ভেরিয়েবল: ${(res.missingEnvVars || []).join(', ') || 'গেটওয়ে ক্রেডেনশিয়াল'}`
            : `${res.message} Missing env: ${(res.missingEnvVars || []).join(', ') || 'Gateway credentials'}`,
      });
    } catch (err: any) {
      setFinanceActionMsg({
        type: 'error',
        text: err?.message || (isBangla ? 'পেমেন্ট শুরু করতে ব্যর্থ হয়েছে।' : 'Failed to initiate payment.'),
      });
    } finally {
      setInitiatingPayment(false);
    }
  };

  const handleCancelBooking = () => {
    updateBookingStatus(booking.id, 'CANCELLED', 'Cancelled by customer', 'গ্রাহক দ্বারা বুকিং বাতিল করা হয়েছে');
    setConfirmCancelOpen(false);
  };

  const handleWarrantySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !warrantyDescription.trim()) return;
    submitWarrantyClaim({
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      customerId: currentUser?.id || booking.customerId || 'user-cust-demo',
      customerName: currentUser?.name || booking.customerName,
      customerPhone: currentUser?.phone || booking.customerPhone,
      customerArea: booking.customerArea,
      customerAddress: booking.customerAddress,
      customerLat: booking.customerLat,
      customerLng: booking.customerLng,
      technicianId: booking.technicianId,
      technicianName: booking.technicianName,
      technicianPhone: booking.technicianPhone,
      serviceName: isBangla ? booking.serviceNameBn : booking.serviceNameEn,
      issueDescription: warrantyDescription.trim()
    });
    setWarrantyDescription('');
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
              <span>{isBangla ? 'মিস্ত্রি আপনার ঠিকানার উদ্দেশ্যে রওনা হয়েছেন' : 'Technician is on the way to your address'}</span>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
              {isBangla ? 'আনুমানিক সময়: ২০-২৫ মিনিট' : 'ETA: 20-25 mins'}
            </span>
          </div>

          {/* Graphical Route Simulation */}
          <div className="p-3 bg-white/10 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>{isBangla ? 'মিরপুর হাব' : 'Mirpur Hub'}</span>
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
          {isBangla ? 'কাজের বর্তমান অগ্রগতি' : 'Live Status Timeline'}
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
              {isBangla ? booking.serviceNameBn : booking.serviceNameEn}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 block mb-1">{isBangla ? 'সমস্যার বর্ণনা:' : 'Problem Description:'}</span>
                <p className="text-zinc-800 dark:text-zinc-200 bg-stone-50 dark:bg-zinc-800/60 p-3 rounded-xl leading-relaxed">
                  {booking.problemDescription}
                </p>
              </div>

              {booking.mediaUrls.length > 0 && (
                <div>
                  <span className="text-zinc-400 block mb-1.5">{isBangla ? 'সংযুক্ত ছবি/ভিডিও:' : 'Attached Photos/Videos:'}</span>
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
                  <span className="text-zinc-400 block">{isBangla ? 'তারিখ:' : 'Date:'}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{booking.date}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">{isBangla ? 'সময় স্লট:' : 'Time Slot:'}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{booking.timeSlot}</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-zinc-400 block">{isBangla ? 'ঠিকানা:' : 'Address:'}</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {booking.customerAddress}, {booking.customerArea}, {booking.customerCity}
                </span>
              </div>
            </div>
          </div>

          {/* Extra Work / Material Approval Requests */}
          {extraCharges.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-orange-500" />
                  <span>{isBangla ? 'অতিরিক্ত কাজ ও মালামালের অনুমোদন' : 'Extra Work & Material Approval Requests'}</span>
                </h3>
                <span className="text-[11px] font-bold text-zinc-400">
                  {extraCharges.length}{isBangla ? 'টি' : ' items'}
                </span>
              </div>

              <div className="space-y-2.5">
                {extraCharges.map((chg) => (
                  <div
                    key={chg.id}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-800/40 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 mr-2">
                          {formatExtraChargeType(chg.chargeType)}
                        </span>
                        <span className="font-extrabold text-orange-600 dark:text-orange-400">
                          +৳{chg.amount}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          chg.status === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : chg.status === 'REJECTED'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {formatExtraChargeStatus(chg.status)}
                      </span>
                    </div>

                    <p className="text-zinc-700 dark:text-zinc-300">{chg.reason}</p>
                    {chg.receiptNote && (
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {isBangla ? 'রসিদ / সরবরাহকারী:' : 'Receipt / Supplier:'} {chg.receiptNote}
                      </p>
                    )}

                    {chg.status === 'PENDING_CUSTOMER' && (currentUser?.role === 'CUSTOMER' || currentUser?.role === 'ADMIN') && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={processingChargeId === chg.id}
                          onClick={() => handleRespondExtraCharge(chg.id, 'APPROVE')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isBangla ? 'অনুমোদন করুন' : 'Approve'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={processingChargeId === chg.id}
                          onClick={() => handleRespondExtraCharge(chg.id, 'REJECT')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-[11px] cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{isBangla ? 'বাতিল করুন' : 'Reject'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Updates Log */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500">
              {isBangla ? 'স্ট্যাটাস হিস্ট্রি ও নোট' : 'Status History & Notes'}
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
                  <span>{isBangla ? 'ভেরিফায়েড টেকনিশিয়ান' : 'Verified Technician'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {(() => {
                const unreadCount = getUnreadChatCount(booking.id, currentUser?.role === 'TECHNICIAN' ? 'TECHNICIAN' : 'CUSTOMER');
                return (
                  <button
                    type="button"
                    onClick={() => setChatModalOpen(true)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      unreadCount > 0
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 animate-pulse'
                        : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-500/30 hover:bg-orange-100'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isBangla ? 'মেসেজ দিন' : 'Send Message'}</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-white text-orange-600 text-[10px] font-black">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })()}
              <a
                href={`tel:${booking.technicianPhone}`}
                className="py-2 px-3 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-center"
              >
                {isBangla ? 'সরাসরি কল' : 'Call Now'}
              </a>
            </div>
          </div>

          {/* Pricing, Immutable Snapshot & Payment Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500">
                {isBangla ? 'খরচের হিসাব ও পেমেন্ট' : 'Pricing Breakdown & Payment'}
              </h3>
              {snapshot && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  <Lock className="w-3 h-3" />
                  {isBangla ? `স্ন্যাপশট v${snapshot.ruleVersion}` : `Snapshot v${snapshot.ruleVersion}`}
                </span>
              )}
            </div>

            {snapshot ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">{isBangla ? 'মূল সার্ভিস চার্জ:' : 'Base Service Charge:'}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">৳{snapshot.servicePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{isBangla ? 'ভিজিটিং ফি:' : 'Visiting Fee:'}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">৳{snapshot.visitingFee}</span>
                </div>
                {snapshot.hourlyCharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{isBangla ? 'ঘণ্টাভিত্তিক চার্জ:' : 'Hourly Charge:'}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">৳{snapshot.hourlyCharge}</span>
                  </div>
                )}
                {snapshot.emergencyCharge + snapshot.nightCharge + snapshot.weekendCharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{isBangla ? 'জরুরি / রাত / ছুটির দিন:' : 'Emergency / Night / Weekend:'}</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      ৳{snapshot.emergencyCharge + snapshot.nightCharge + snapshot.weekendCharge}
                    </span>
                  </div>
                )}
                {snapshot.materialCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">
                      {isBangla ? 'মালামাল / পার্টস' : 'Materials / Parts'}{' '}
                      {!snapshot.materialCostCommissionable ? (isBangla ? '(পাস-থ্রু)' : '(Pass-through)') : ''}:
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">৳{snapshot.materialCost}</span>
                  </div>
                )}
                {snapshot.additionalChargesTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{isBangla ? 'অনুমোদিত অতিরিক্ত কাজ:' : 'Approved Extra Work:'}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+৳{snapshot.additionalChargesTotal}</span>
                  </div>
                )}
                {snapshot.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>{isBangla ? 'ডিসকাউন্ট' : 'Discount'} {snapshot.promoCode ? `(${snapshot.promoCode})` : ''}:</span>
                    <span className="font-semibold">-৳{snapshot.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-sm font-bold">
                  <span className="text-zinc-900 dark:text-zinc-100">{isBangla ? 'চূড়ান্ত নির্ধারিত মোট:' : 'Final Agreed Total:'}</span>
                  <span className="text-orange-600 dark:text-orange-400">৳{snapshot.finalAgreedAmount}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">{isBangla ? 'ভিজিটিং ফি:' : 'Visiting Fee:'}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">৳{booking.estimatedVisitingFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{isBangla ? 'আনুমানিক শ্রম চার্জ:' : 'Estimated Labor Charge:'}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    ৳{booking.estimatedLabourMin}–৳{booking.estimatedLabourMax}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-sm font-bold">
                  <span className="text-zinc-900 dark:text-zinc-100">{isBangla ? 'সর্বমোট (আনুমানিক):' : 'Estimated Total:'}</span>
                  <span className="text-orange-600 dark:text-orange-400">
                    ৳{booking.finalTotal || booking.estimatedTotalMax}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Status & Online Payment Initiation */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">{isBangla ? 'পেমেন্ট মেথড ও স্ট্যাটাস:' : 'Payment Method & Status:'}</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">
                  {booking.paymentMethod} ·{' '}
                  <span className={booking.paymentStatus === 'PAID' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {booking.paymentStatus === 'PAID'
                      ? isBangla
                        ? 'পরিশোধিত'
                        : 'PAID'
                      : isBangla
                        ? 'বাকি'
                        : booking.paymentStatus}
                  </span>
                </span>
              </div>

              {cashCollection && (
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-200">
                      <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                      {isBangla ? 'কাজ শেষে নগদ' : 'Cash on Completion'}
                    </span>
                    <span className="text-orange-600 dark:text-orange-400">{formatCashStatus(cashCollection.status)}</span>
                  </div>
                  <div className="text-zinc-500">
                    {isBangla ? 'সংগৃহীত:' : 'Collected:'} ৳{cashCollection.amountCollected} ·{' '}
                    {isBangla ? 'Servexa শেয়ার:' : 'Servexa Share:'} ৳{cashCollection.commissionAmount}
                  </div>
                  {cashCollection.deposit?.depositReference && (
                    <div className="font-mono text-zinc-600 dark:text-zinc-300">
                      {isBangla ? 'ডিপোজিট রেফ:' : 'Deposit Ref:'} {cashCollection.deposit.depositReference} ({formatCashStatus(cashCollection.deposit.status)})
                    </div>
                  )}
                </div>
              )}

              {booking.paymentStatus !== 'PAID' &&
                booking.status !== 'CANCELLED' &&
                (currentUser?.role === 'CUSTOMER' || currentUser?.role === 'ADMIN') && (
                  <div className="p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-500/25 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="font-bold text-[11px] text-zinc-700 dark:text-zinc-300">
                        {isBangla ? 'অনলাইন পেমেন্ট মাধ্যম:' : 'Online Payment Channel:'}
                      </label>
                      <select
                        value={selectedPayMethod}
                        onChange={(e) => setSelectedPayMethod(e.target.value as PaymentMethodCode)}
                        className="px-2 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-semibold"
                      >
                        {(['bkash', 'nagad', 'rocket', 'card'] as PaymentMethodCode[])
                          .filter((m) => activeMethods[m])
                          .map((m) => (
                            <option key={m} value={m}>
                              {m.toUpperCase()}
                            </option>
                          ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={initiatingPayment}
                      onClick={handleInitiateOnlinePayment}
                      className="w-full py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>
                        {initiatingPayment
                          ? isBangla
                            ? 'শুরু হচ্ছে...'
                            : 'Initiating...'
                          : isBangla
                            ? `এখনই পেমেন্ট করুন (${selectedPayMethod.toUpperCase()}) · ৳${snapshot?.finalAgreedAmount ?? booking.finalTotal ?? booking.estimatedTotalMax}`
                            : `Pay Now (${selectedPayMethod.toUpperCase()}) · ৳${snapshot?.finalAgreedAmount ?? booking.finalTotal ?? booking.estimatedTotalMax}`}
                      </span>
                    </button>
                  </div>
                )}

              {paymentTransactions.length > 0 && (
                <div className="space-y-1.5">
                  {paymentTransactions.slice(0, 2).map((ptx) => (
                    <div
                      key={ptx.id}
                      className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-[11px] space-y-0.5"
                    >
                      <div className="flex justify-between font-bold">
                        <span className="font-mono">{ptx.id} ({ptx.method.toUpperCase()})</span>
                        <span>{formatTxStatus(ptx.status)}</span>
                      </div>
                      <div className="text-zinc-500">
                        {isBangla ? 'মোড:' : 'Mode:'} <span className="font-semibold">{ptx.providerMode}</span> · ৳{ptx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {financeActionMsg && (
                <div
                  className={`p-2.5 rounded-lg text-[11px] font-medium ${
                    financeActionMsg.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : financeActionMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {financeActionMsg.text}
                </div>
              )}
            </div>

            {booking.invoice && (
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(true)}
                className="w-full mt-3 py-2 text-xs font-bold rounded-lg border border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isBangla ? 'ডিজিটাল ইনভয়েস দেখুন' : 'View Digital Invoice'}</span>
              </button>
            )}
          </div>

          {/* Actions: Review, Warranty, Rebook, Cancel */}
          <div className="space-y-2">
            {booking.status === 'COMPLETED' && !booking.reviewed && (
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Star className="w-4 h-4" />
                <span>{isBangla ? 'মতামত, ফিডব্যাক ও রেটিং দিন' : 'Rate & Leave Feedback'}</span>
              </button>
            )}

            {bookingReview && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-zinc-900 dark:text-white flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{isBangla ? 'আপনার প্রদত্ত ফিডব্যাক' : 'Your Submitted Feedback'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white font-black text-[11px]">
                    {bookingReview.overallRating}★
                  </span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 italic">"{bookingReview.comment}"</p>
                {bookingReview.feedbackTags && bookingReview.feedbackTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bookingReview.feedbackTags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {booking.status === 'COMPLETED' && !bookingWarranty && (
              <button
                type="button"
                onClick={() => setWarrantyFormOpen(!warrantyFormOpen)}
                className="w-full py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>
                  {isBangla
                    ? `${booking.warrantyDays} দিনের ফ্রি ওয়ারেন্টি দাবি`
                    : `Claim ${booking.warrantyDays}-Day Free Warranty`}
                </span>
              </button>
            )}

            {bookingWarranty && (
              <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isBangla ? 'ওয়ারেন্টি ক্লেইম স্ট্যাটাস' : 'Warranty Claim Status'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                    {formatWarrantyStatus(bookingWarranty.status)}
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 italic">"{bookingWarranty.issueDescription}"</p>
                {bookingWarranty.adminNote && (
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    🛡️ {isBangla ? 'অ্যাডমিন:' : 'Admin:'} {bookingWarranty.adminNote}
                  </div>
                )}
                {bookingWarranty.technicianNote && (
                  <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    🔧 {isBangla ? 'টেকনিশিয়ান:' : 'Technician:'} {bookingWarranty.technicianNote}
                  </div>
                )}
              </div>
            )}

            {booking.status === 'COMPLETED' && (
              <Link
                to={`/book?techId=${booking.technicianId}&categoryId=${booking.categoryId}`}
                className="w-full py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 block text-center"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isBangla ? 'একই মিস্ত্রি আবার বুক করুন' : 'Book Same Technician Again'}</span>
              </Link>
            )}

            {warrantySuccessMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                {isBangla
                  ? `✓ ওয়ারেন্টি ক্লেইম অ্যাডমিনের কাছে জমা হয়েছে! অ্যাডমিন অনুমোদন করার পর কাজটি সরাসরি টেকনিশিয়ান ${booking.technicianName}-এর কাছে যাবে।`
                  : `✓ Warranty claim submitted to admin! After admin approval, it will be assigned directly to ${booking.technicianName}.`}
              </div>
            )}

            {['REQUESTED', 'ACCEPTED'].includes(booking.status) && (
              confirmCancelOpen ? (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs space-y-2">
                  <p className="font-semibold text-rose-800 dark:text-rose-300">
                    {isBangla ? 'আপনি কি নিশ্চিত যে বুকিং বাতিল করতে চান?' : 'Are you sure you want to cancel this booking?'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancelBooking}
                      className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold"
                    >
                      {isBangla ? 'হ্যাঁ, বাতিল করুন' : 'Yes, Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancelOpen(false)}
                      className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg"
                    >
                      {isBangla ? 'না' : 'No'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmCancelOpen(true)}
                  className="w-full py-2 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  {isBangla ? 'বুকিং বাতিল করুন' : 'Cancel Booking'}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="w-full py-1 text-center text-[11px] text-zinc-400 hover:text-rose-600 transition-colors"
            >
              {isBangla ? 'কোনো সমস্যা? অভিযোগ জানান' : 'Facing an issue? Report here'}
            </button>
          </div>
        </div>
      </div>

      {/* Warranty Form Drawer */}
      {warrantyFormOpen && (
        <div className="bg-blue-50/50 dark:bg-blue-950/20 p-5 rounded-2xl border border-blue-200 dark:border-blue-900/50 space-y-3">
          <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300">
            {isBangla
              ? 'সার্ভিস ওয়ারেন্টির আওতায় পুনরায় চেকআপের আবেদন'
              : 'Request Free Follow-up Check Under Service Warranty'}
          </h4>
          <form onSubmit={handleWarrantySubmit} className="space-y-3">
            <textarea
              rows={2}
              required
              value={warrantyDescription}
              onChange={(e) => setWarrantyDescription(e.target.value)}
              placeholder={
                isBangla
                  ? 'আগের কাজে কী সমস্যা আবার দেখা দিয়েছে বিস্তারিত লিখুন...'
                  : 'Describe what issue reappeared from the previous service...'
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWarrantyFormOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-500"
              >
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white"
              >
                {isBangla ? 'ওয়ারেন্টি জমা দিন' : 'Submit Warranty Claim'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modals */}
      {booking.invoice && (
        <InvoiceModal
          invoice={booking.invoice}
          snapshot={snapshot}
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
