import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  Heart,
  Bell,
  Star,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Settings,
  Phone,
  AlertTriangle,
  Receipt,
  User,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { RoleSwitcherBar } from '../components/common/RoleSwitcherBar';
import { ImageUploader } from '../components/common/ImageUploader';
import { Invoice, Booking, Review, WarrantyClaim } from '../types';

export const CustomerDashboard: React.FC = () => {
  const {
    bookings,
    technicians,
    favorites,
    maintenanceReminders,
    addMaintenanceReminder,
    deleteMaintenanceReminder,
    submitReview,
    submitWarrantyClaim,
    warranties
  } = useApp();
  const { currentUser, updateProfile } = useAuth();
  const { t, isBangla } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'bookings' | 'reminders' | 'favorites' | 'invoices' | 'warranties' | 'profile'>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [ratingWorkQuality, setRatingWorkQuality] = useState(5);
  const [ratingBehavior, setRatingBehavior] = useState(5);
  const [ratingPunctuality, setRatingPunctuality] = useState(5);
  const [ratingPriceFairness, setRatingPriceFairness] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Warranty Claim Modal State
  const [warrantyBooking, setWarrantyBooking] = useState<Booking | null>(null);
  const [warrantyIssue, setWarrantyIssue] = useState('');

  // New Reminder modal/input state
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remCategory, setRemCategory] = useState('ac_repair');
  const [remMonths, setRemMonths] = useState(6);

  // Profile Edit State
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80');
  const [profileArea, setProfileArea] = useState(currentUser?.area || 'Dhanmondi');
  const [profileAddress, setProfileAddress] = useState(currentUser?.address || 'House 24, Road 7/A, Dhanmondi, Dhaka');
  const [profileSaved, setProfileSaved] = useState(false);

  const customerBookings = bookings.filter(b => b.customerId === currentUser?.id || currentUser?.role === 'CUSTOMER');
  const activeBookings = customerBookings.filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status));
  const completedBookings = customerBookings.filter(b => b.status === 'COMPLETED');

  const filteredBookingsList = customerBookings.filter(b => {
    if (bookingFilter === 'ACTIVE') return !['COMPLETED', 'CANCELLED'].includes(b.status);
    if (bookingFilter === 'COMPLETED') return b.status === 'COMPLETED';
    return true;
  });

  const favoriteTechs = technicians.filter(t => favorites.includes(t.id));
  const customerInvoices = customerBookings.map(b => b.invoice).filter((inv): inv is Invoice => !!inv);
  const customerWarranties = warranties.filter(w => w.customerId === currentUser?.id || true);

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim()) return;

    const today = new Date();
    const dueDate = new Date();
    dueDate.setMonth(today.getMonth() + remMonths);

    addMaintenanceReminder({
      customerId: currentUser?.id || 'cust',
      categoryId: remCategory,
      titleEn: remTitle,
      titleBn: remTitle,
      frequencyMonths: remMonths,
      lastServiceDate: today.toISOString().split('T')[0],
      nextDueDate: dueDate.toISOString().split('T')[0]
    });

    setRemTitle('');
    setShowAddReminder(false);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;

    const overallRating = Number(((ratingWorkQuality + ratingBehavior + ratingPunctuality + ratingPriceFairness) / 4).toFixed(1));

    submitReview({
      bookingId: reviewBooking.id,
      customerId: currentUser?.id || 'user-customer',
      customerName: currentUser?.name || 'গ্রাহক',
      customerAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      technicianId: reviewBooking.technicianId,
      overallRating,
      workQuality: ratingWorkQuality,
      behavior: ratingBehavior,
      punctuality: ratingPunctuality,
      priceFairness: ratingPriceFairness,
      comment: reviewComment || (isBangla ? 'চমৎকার এবং সন্তোষজনক কাজ হয়েছে।' : 'Great and satisfactory work.'),
      serviceName: reviewBooking.serviceNameBn || reviewBooking.serviceNameEn
    });

    setReviewBooking(null);
    setReviewComment('');
  };

  const handleWarrantySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyBooking || !warrantyIssue.trim()) return;

    submitWarrantyClaim({
      bookingId: warrantyBooking.id,
      bookingNumber: warrantyBooking.bookingNumber,
      customerId: currentUser?.id || 'user-customer',
      technicianId: warrantyBooking.technicianId,
      serviceName: isBangla ? warrantyBooking.serviceNameBn : warrantyBooking.serviceNameEn,
      issueDescription: warrantyIssue.trim()
    });

    setWarrantyBooking(null);
    setWarrantyIssue('');
    setActiveTab('warranties');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: profileName,
      phone: profilePhone,
      avatar: profileAvatar,
      area: profileArea,
      address: profileAddress
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Role Switcher Bar */}
      <RoleSwitcherBar />

      {/* Customer Header Banner */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
              alt={currentUser?.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[9px] text-white font-black">
              ✓
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-md">
                {isBangla ? 'গ্রাহক ড্যাশবোর্ড' : 'Customer Account'}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isBangla ? 'এনআইডি ভেরিফাইড' : 'Verified'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {currentUser?.name}
            </h1>
            <p className="text-xs text-zinc-500">
              📍 {currentUser?.area || 'Dhanmondi'}, {currentUser?.city || 'Dhaka'} · 📞 {currentUser?.phone}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/map"
            className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs hover:border-orange-500 transition-colors flex items-center gap-1.5"
          >
            <span>🗺️</span>
            <span>{isBangla ? 'লাইভ মিস্ত্রি খুঁজুন' : 'Find Nearby Pro'}</span>
          </Link>
          <Link
            to="/book"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isBangla ? 'নতুন সার্ভিস বুক করুন' : 'Book New Service'}</span>
          </Link>
        </div>
      </div>

      {/* Quick KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'চলমান বুকিং' : 'Active Bookings'}</div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
            {activeBookings.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">{isBangla ? 'লাইভ ট্র্যাকিং চলমান' : 'Live in progress'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'সম্পন্ন বুকিং' : 'Completed Jobs'}</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {completedBookings.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">{isBangla ? '৭ দিন ওয়ারেন্টি আওতাভুক্ত' : 'Warranty protected'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'সংরক্ষিত মিস্ত্রি' : 'Favorite Pros'}</div>
          <div className="text-2xl font-black text-rose-500">
            {favoriteTechs.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">{isBangla ? 'বুকমার্ক করা' : 'Bookmarked'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'রক্ষণাবেক্ষণ রিমাইন্ডার' : 'Reminders'}</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {maintenanceReminders.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">{isBangla ? 'পরবর্তী সার্ভিস নোটিফিকেশন' : 'Scheduled health checks'}</div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 sm:gap-6 text-xs font-bold overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'bookings'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{isBangla ? 'আমার বুকিং হিস্ট্রি' : 'My Bookings'} ({customerBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reminders'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{isBangla ? 'রক্ষণাবেক্ষণ রিমাইন্ডার' : 'Appliance Reminders'} ({maintenanceReminders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'favorites'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>{isBangla ? 'পছন্দের মিস্ত্রি' : 'Favorite Pros'} ({favoriteTechs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'invoices'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{isBangla ? 'ইনভয়েস ও রসিদ' : 'Invoices'} ({customerInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('warranties')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'warranties'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isBangla ? 'ওয়ারেন্টি ক্লেইম' : 'Warranty Claims'}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{isBangla ? 'ঠিকানা ও প্রোফাইল' : 'Profile & Addresses'}</span>
        </button>
      </div>

      {/* TAB 1: BOOKINGS LIST */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Sub-filter pills */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setBookingFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                bookingFilter === 'ALL' ? 'bg-orange-600 text-white' : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {isBangla ? 'সকল বুকিং' : 'All'} ({customerBookings.length})
            </button>
            <button
              onClick={() => setBookingFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                bookingFilter === 'ACTIVE' ? 'bg-orange-600 text-white' : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {isBangla ? 'চলমান' : 'Active'} ({activeBookings.length})
            </button>
            <button
              onClick={() => setBookingFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                bookingFilter === 'COMPLETED' ? 'bg-orange-600 text-white' : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {isBangla ? 'সম্পন্ন' : 'Completed'} ({completedBookings.length})
            </button>
          </div>

          {filteredBookingsList.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <Calendar className="w-10 h-10 text-zinc-400 mx-auto" />
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'কোনো বুকিং পাওয়া যায়নি' : 'No bookings found'}
              </h3>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'আপনার প্রয়োজনের জন্য এখনই দক্ষ টেকনিশিয়ান বুক করুন।' : 'Book a verified technician for any home service.'}
              </p>
              <Link
                to="/book"
                className="inline-block px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
              >
                {isBangla ? 'সার্ভিস বুক করুন' : 'Book a Service'}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookingsList.map((booking) => {
                const isCompleted = booking.status === 'COMPLETED';

                return (
                  <div
                    key={booking.id}
                    className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4 transition-all hover:border-orange-500/40"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-900/50">
                          {booking.bookingNumber}
                        </span>
                        <h3 className="font-black text-sm sm:text-base text-zinc-900 dark:text-white">
                          {isBangla ? booking.serviceNameBn : booking.serviceNameEn}
                        </h3>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Technician Info */}
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                        <img
                          src={booking.technicianAvatar}
                          alt={booking.technicianName}
                          className="w-12 h-12 rounded-xl object-cover border border-orange-500/30 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-zinc-900 dark:text-white truncate">
                            {booking.technicianName}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {isBangla ? 'বরাদ্দকৃত টেকনিশিয়ান' : 'Assigned Technician'}
                          </div>
                          <a
                            href={`tel:${booking.technicianPhone}`}
                            className="inline-flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400 font-bold mt-0.5 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{booking.technicianPhone}</span>
                          </a>
                        </div>
                      </div>

                      {/* Date & Address */}
                      <div className="space-y-1.5 p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-orange-500" />
                          <span>{booking.date} · {booking.timeSlot}</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-zinc-600 dark:text-zinc-400">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{booking.customerAddress}</span>
                        </div>
                      </div>

                      {/* Price & Billing */}
                      <div className="space-y-1 p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{isBangla ? 'ভিজিটিং ফি:' : 'Visiting Fee:'}</span>
                          <span className="font-bold">৳{booking.estimatedVisitingFee}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500">{isBangla ? 'মোট বিল:' : 'Total Cost:'}</span>
                          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                            ৳{booking.finalTotal || `${booking.estimatedTotalMin} - ৳${booking.estimatedTotalMax}`}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                          <span>{booking.paymentStatus === 'PAID' ? '✅ পরিশোধিত' : '⏳ পেমেন্ট বাকি'}</span>
                          <span>৭ দিন ফ্রি ওয়ারেন্টি</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                      <Link
                        to={`/booking/${booking.id}`}
                        className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                      >
                        <span>{isBangla ? 'লাইভ ডিসপ্যাচ ও ট্র্যাকিং বিস্তারিত' : 'Live Tracking & Chat'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <div className="flex items-center gap-2">
                        {booking.invoice && (
                          <button
                            onClick={() => setSelectedInvoice(booking.invoice!)}
                            className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isBangla ? 'ইনভয়েস' : 'View Bill'}</span>
                          </button>
                        )}

                        {isCompleted && !booking.reviewed && (
                          <button
                            onClick={() => setReviewBooking(booking)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/25 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{isBangla ? 'রিভিউ দিন' : 'Rate & Review'}</span>
                          </button>
                        )}

                        {isCompleted && (
                          <button
                            onClick={() => setWarrantyBooking(booking)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{isBangla ? 'ওয়ারেন্টি ক্লেইম' : 'Claim Warranty'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MAINTENANCE REMINDERS */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                {isBangla ? 'গৃহস্থালি অ্যাপ্লায়েন্স রক্ষণাবেক্ষণ ক্যালেন্ডার' : 'Home Appliance Care & Reminders'}
              </h3>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'নিয়মিত সার্ভিসিংয়ের মাধ্যমে এসি ও হোম ইকুইপমেন্টের স্থায়িত্ব ও নিরাপত্তা বৃদ্ধি করুন।' : 'Schedule recurring health checks for AC, water filter, fridge, and plumbing.'}
              </p>
            </div>
            <button
              onClick={() => setShowAddReminder(true)}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isBangla ? 'নতুন রিমাইন্ডার' : 'Add Reminder'}</span>
            </button>
          </div>

          {showAddReminder && (
            <form onSubmit={handleCreateReminder} className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-orange-500/40 shadow-lg space-y-4 animate-in fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600">
                {isBangla ? 'নতুন অ্যাপ্লায়েন্স রিমাইন্ডার সেট করুন' : 'Add New Maintenance Reminder'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    {isBangla ? 'কাজের নাম:' : 'Title:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={remTitle}
                    onChange={(e) => setRemTitle(e.target.value)}
                    placeholder={isBangla ? 'যেমন: ড্রয়িংরুম এসি মাস্টার ওয়াশ' : 'e.g. Master Bed AC Jet Wash'}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    {isBangla ? 'ক্যাটাগরি:' : 'Category:'}
                  </label>
                  <select
                    value={remCategory}
                    onChange={(e) => setRemCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
                  >
                    <option value="ac_repair">এসি সার্ভিসিং (AC Repair)</option>
                    <option value="plumbing">প্লাম্বিং ও পাইপলাইন (Plumbing)</option>
                    <option value="electrical">ইলেকট্রিক্যাল ও শর্ট সার্কিট (Electrical)</option>
                    <option value="appliance">ফ্রিজ ও ওয়াশিং মেশিন (Appliance)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    {isBangla ? 'কত মাস পরপর:' : 'Frequency:'}
                  </label>
                  <select
                    value={remMonths}
                    onChange={(e) => setRemMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
                  >
                    <option value={3}>প্রতি ৩ মাস অন্তর (Quarterly)</option>
                    <option value={6}>প্রতি ৬ মাস অন্তর (Bi-annual)</option>
                    <option value={12}>প্রতি ১২ মাস অন্তর (Annual)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReminder(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 text-xs font-bold"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs"
                >
                  {isBangla ? 'সংরক্ষণ করুন' : 'Save Reminder'}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenanceReminders.map((rem) => (
              <div
                key={rem.id}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">
                      {rem.frequencyMonths} মাস পর
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      শেষ সার্ভিস: {rem.lastServiceDate}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                    {isBangla ? rem.titleBn : rem.titleEn}
                  </h4>
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>পরবর্তী সার্ভিসিং তারিখ: {rem.nextDueDate}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    to={`/book?category=${rem.categoryId}`}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs text-center shadow-xs"
                  >
                    {isBangla ? 'এখনই বুক করুন' : 'Book Pro'}
                  </Link>
                  <button
                    onClick={() => deleteMaintenanceReminder(rem.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors self-center"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FAVORITES */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              {isBangla ? 'আপনার বিশ্বস্ত সংরক্ষিত টেকনিশিয়ানবৃন্দ' : 'Bookmarked Technicians'}
            </h3>
            <span className="text-xs text-zinc-500">{favoriteTechs.length} {isBangla ? 'জন সংরক্ষিত' : 'pros'}</span>
          </div>

          {favoriteTechs.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <Heart className="w-10 h-10 text-zinc-400 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'কোনো পছন্দের মিস্ত্রি সংরক্ষিত নেই' : 'No favorite pros yet'}
              </h4>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'টেকনিশিয়ানের প্রোফাইলে গিয়ে লাভ আইকনে ক্লিক করে সংরক্ষণ করতে পারবেন।' : 'Click the heart icon on any technician profile to bookmark them.'}
              </p>
              <Link to="/professionals" className="inline-block px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs">
                {isBangla ? 'মিস্ত্রি তালিকা দেখুন' : 'Browse Technicians'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteTechs.map((tech) => (
                <div
                  key={tech.id}
                  className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-500/40 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <img src={tech.avatar} alt={tech.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500/30 shrink-0" />
                    <div>
                      <h4 className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span>{tech.name}</span>
                        {tech.platformVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                      </h4>
                      <div className="text-xs text-orange-600 dark:text-orange-400 font-bold mt-0.5">
                        {isBangla ? tech.bioBn.split('।')[0] : tech.bioEn}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">
                        ★ {tech.rating} ({tech.reviewCount} reviews) · {tech.primaryArea}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Link
                      to={`/professionals/${tech.id}`}
                      className="flex-1 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs text-center hover:bg-zinc-50"
                    >
                      {isBangla ? 'প্রোফাইল' : 'Profile'}
                    </Link>
                    <Link
                      to={`/book?techId=${tech.id}`}
                      className="flex-1 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs text-center shadow-xs hover:bg-orange-500"
                    >
                      {isBangla ? 'বুক করুন' : 'Book Now'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              {isBangla ? 'ইনভয়েস ও পেমেন্ট রসিদ হিস্ট্রি' : 'Invoices & Receipts'}
            </h3>
            <span className="text-xs text-zinc-500">{customerInvoices.length} {isBangla ? 'টি রসিদ' : 'invoices'}</span>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {customerInvoices.map((inv) => (
                <div key={inv.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-zinc-900 dark:text-white">
                          #{inv.invoiceNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                          {inv.paymentStatus === 'PAID' ? 'PAID' : 'CASH ON SERVICE'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
                        {inv.serviceName} · টেকনিশিয়ান: {inv.technicianName}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        তারিখ: {inv.issueDate} · মেথড: {inv.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ৳{inv.total}
                      </div>
                      <div className="text-[10px] text-zinc-400">ভ্যাটসহ মোট</div>
                    </div>
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      {isBangla ? 'রসিদ প্রিন্ট' : 'Print / View'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WARRANTIES */}
      {activeTab === 'warranties' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-gradient-to-r from-orange-600/10 via-amber-500/5 to-transparent border border-orange-500/30">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
              <span>{isBangla ? 'Servexa ৭-দিনের ফ্রি সার্ভিস সুরক্ষা গ্যারান্টি' : 'Servexa 7-Day Free Warranty Guarantee'}</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              {isBangla
                ? 'কাজ সম্পন্ন হওয়ার ৭ দিনের মধ্যে একই ধরণের সমস্যা পুনরাবৃত্তি হলে প্ল্যাটফর্ম থেকে কোনো ফি ছাড়া ফ্রি সার্ভিসিং নিশ্চিত করা হয়।'
                : 'If the same issue reoccurs within 7 days of service completion, a technician is dispatched free of cost under platform warranty.'}
            </p>
          </div>

          <div className="space-y-3">
            {customerWarranties.map((w) => (
              <div key={w.id} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-orange-600">
                    Claim #{w.id} (Booking #{w.bookingNumber})
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    w.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                  }`}>
                    {w.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  সার্ভিস: {w.serviceName} · অনুরোধ তারিখ: {w.requestDate}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-stone-50 dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  অভিযোগ বিবরণ: "{w.issueDescription}"
                </p>
                {w.adminNote && (
                  <div className="text-[11px] text-emerald-600 font-bold">
                    অ্যাডমিন মন্তব্য: {w.adminNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PROFILE & ADDRESSES */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              {isBangla ? 'গ্রাহক প্রোফাইল ও ঠিকানা ব্যবস্থাপনা' : 'Customer Profile & Address'}
            </h3>
            <p className="text-xs text-zinc-500">
              {isBangla ? 'আপনার সেবার ঠিকানা ও জরুরি যোগাযোগের নম্বর আপডেট করুন।' : 'Update your delivery address and emergency phone number.'}
            </p>
          </div>

          {profileSaved && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
              ✅ {isBangla ? 'প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে!' : 'Profile updated successfully!'}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* Direct Device Image Uploader */}
            <ImageUploader
              currentImage={profileAvatar}
              onImageChange={setProfileAvatar}
              label={isBangla ? 'প্রোফাইল ছবি (ডিভাইস থেকে সরাসরি আপলোড করুন):' : 'Profile Photo (Direct Device Upload):'}
              shape="circle"
            />

            <div>
              <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                {isBangla ? 'পূর্ণ নাম:' : 'Full Name:'}
              </label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                {isBangla ? 'ফোন নম্বর:' : 'Phone Number:'}
              </label>
              <input
                type="text"
                required
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                {isBangla ? 'ঢাকা মেট্রো এলাকা:' : 'Dhaka Metro Area:'}
              </label>
              <select
                value={profileArea}
                onChange={(e) => setProfileArea(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-medium"
              >
                <option value="Dhanmondi">ধানমন্ডি (Dhanmondi)</option>
                <option value="Mirpur">মিরপুর (Mirpur)</option>
                <option value="Uttara">উত্তরা (Uttara)</option>
                <option value="Gulshan">গুলশান (Gulshan)</option>
                <option value="Banani">বনানী (Banani)</option>
                <option value="Mohammadpur">মোহাম্মদপুর (Mohammadpur)</option>
                <option value="Badda">বাড্ডা (Badda)</option>
                <option value="Old Dhaka">পুরান ঢাকা (Old Dhaka)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                {isBangla ? 'বিস্তারিত ঠিকানা (বাড়ি / রোড / ফ্ল্যাট):' : 'Full Detailed Address:'}
              </label>
              <textarea
                rows={3}
                required
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 cursor-pointer"
            >
              {isBangla ? 'তথ্য হালনাগাদ করুন' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span>{isBangla ? 'কাজের রেটিং ও রিভিউ প্রদান' : 'Review & Rate Technician'}</span>
              </h3>
              <button onClick={() => setReviewBooking(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              টেকনিশিয়ান: <span className="font-bold text-zinc-900 dark:text-white">{reviewBooking.technicianName}</span> · সার্ভিস: <span className="font-bold">{reviewBooking.serviceNameBn}</span>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">কাজের মান (Quality): {ratingWorkQuality}/5</label>
                  <input type="range" min="1" max="5" value={ratingWorkQuality} onChange={(e) => setRatingWorkQuality(Number(e.target.value))} className="w-full accent-amber-500" />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">আচরণ (Behavior): {ratingBehavior}/5</label>
                  <input type="range" min="1" max="5" value={ratingBehavior} onChange={(e) => setRatingBehavior(Number(e.target.value))} className="w-full accent-amber-500" />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">সময়ানুবর্তিতা (Punctuality): {ratingPunctuality}/5</label>
                  <input type="range" min="1" max="5" value={ratingPunctuality} onChange={(e) => setRatingPunctuality(Number(e.target.value))} className="w-full accent-amber-500" />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">মূল্য যথার্থতা (Price): {ratingPriceFairness}/5</label>
                  <input type="range" min="1" max="5" value={ratingPriceFairness} onChange={(e) => setRatingPriceFairness(Number(e.target.value))} className="w-full accent-amber-500" />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">আপনার ব্যক্তিগত মতামত বা অভিজ্ঞতা:</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="মিস্ত্রি সময়মতো এসেছিলেন এবং সততার সাথে নিখুঁত কাজ সম্পন্ন করেছেন..."
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewBooking(null)} className="px-4 py-2 rounded-xl border text-xs font-bold">বাতিল</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-md">রিভিউ পোস্ট করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warranty Claim Modal */}
      {warrantyBooking && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span>{isBangla ? '৭-দিনের ফ্রি ওয়ারেন্টি ক্লেইম সাবমিট' : 'Submit 7-Day Warranty Claim'}</span>
              </h3>
              <button onClick={() => setWarrantyBooking(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              বুকিং নং: <span className="font-bold text-orange-600 font-mono">#{warrantyBooking.bookingNumber}</span> · সার্ভিস: <span className="font-bold">{warrantyBooking.serviceNameBn}</span>
            </div>

            <form onSubmit={handleWarrantySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">সমস্যার বিশদ বিবরণ লিখে জানান:</label>
                <textarea
                  rows={4}
                  required
                  value={warrantyIssue}
                  onChange={(e) => setWarrantyIssue(e.target.value)}
                  placeholder="কাজ করার পর আবার পাইপ থেকে পানি চুইয়ে পড়ছে বা এসি কুলিং কমে গেছে..."
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-orange-500/10 text-[11px] text-zinc-700 dark:text-zinc-300">
                💡 ওয়ারেন্টি ক্লেইম সাবমিটের পর অ্যাডমিন টিম অবিলম্বে পর্যালোচনা করে ফ্রি রি-ডিসপ্যাচ অনুমোদন করবে।
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setWarrantyBooking(null)} className="px-4 py-2 rounded-xl border text-xs font-bold">বাতিল</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md">ক্লেইম সাবমিট করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

    </div>
  );
};
