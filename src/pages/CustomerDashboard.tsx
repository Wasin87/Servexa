import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  ExternalLink,
  MessageSquare,
  Map
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { ChatModal } from '../components/common/ChatModal';
import { DashboardShell, DashboardNavGroup, DashboardKpiItem } from '../components/common/DashboardShell';
import { ImageUploader } from '../components/common/ImageUploader';
import { ConfettiCelebration } from '../components/common/ConfettiCelebration';
import { BANGLADESH_DIVISIONS, BANGLADESH_DISTRICTS, getDistrictsByDivision, findDistrict } from '../data/bangladeshLocations';
import { calculateCustomerCompletion } from '../utils/profileCompletion';
import { Invoice, Booking, Review, WarrantyClaim } from '../types';

const FEEDBACK_QUICK_TAGS = [
  { bn: 'সময়মতো এসেছেন', en: 'Arrived on time' },
  { bn: 'নিখুঁত কাজ', en: 'Quality workmanship' },
  { bn: 'ভদ্র ব্যবহার', en: 'Polite behavior' },
  { bn: 'ন্যায্য মূল্য', en: 'Fair pricing' },
  { bn: 'পরিচ্ছন্নতা বজায় রেখেছেন', en: 'Clean work area' }
];

export const CustomerDashboard: React.FC = () => {
  const {
    bookings,
    technicians,
    favorites,
    reviews,
    maintenanceReminders,
    addMaintenanceReminder,
    deleteMaintenanceReminder,
    submitReview,
    submitWarrantyClaim,
    warranties,
    getUnreadChatCount
  } = useApp();
  const { currentUser, updateProfile } = useAuth();
  const { t, isBangla } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const validTabs = ['bookings', 'feedback', 'reminders', 'favorites', 'invoices', 'warranties', 'profile'] as const;
  const resolveTabFromLocation = (): typeof validTabs[number] => {
    const tabParam = searchParams.get('tab');
    if (tabParam && validTabs.includes(tabParam as any)) {
      return tabParam as typeof validTabs[number];
    }
    if (location.pathname.endsWith('/favorites')) return 'favorites';
    if (location.pathname.endsWith('/bookings')) return 'bookings';
    return 'bookings';
  };

  const [activeTab, setActiveTab] = useState<'bookings' | 'feedback' | 'reminders' | 'favorites' | 'invoices' | 'warranties' | 'profile'>(resolveTabFromLocation);
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [chatModalBooking, setChatModalBooking] = useState<Booking | null>(null);
  const [customerToast, setCustomerToast] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const showToast = (msg: string) => {
    setCustomerToast(msg);
    setTimeout(() => setCustomerToast(null), 4000);
  };

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [ratingWorkQuality, setRatingWorkQuality] = useState(5);
  const [ratingBehavior, setRatingBehavior] = useState(5);
  const [ratingPunctuality, setRatingPunctuality] = useState(5);
  const [ratingPriceFairness, setRatingPriceFairness] = useState(5);
  const [selectedFeedbackTags, setSelectedFeedbackTags] = useState<string[]>(['সময়মতো এসেছেন', 'নিখুঁত কাজ']);
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
  const [profileDivision, setProfileDivision] = useState(currentUser?.division || '');
  const [profileDistrict, setProfileDistrict] = useState(currentUser?.district || currentUser?.city || '');
  const [profileArea, setProfileArea] = useState(currentUser?.area || '');
  const [profileAddress, setProfileAddress] = useState(currentUser?.address || '');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    const param = searchParams.get('tab');
    if (param && validTabs.includes(param as any)) {
      setActiveTab(param as typeof validTabs[number]);
    } else if (location.pathname.endsWith('/favorites')) {
      setActiveTab('favorites');
    } else if (location.pathname.endsWith('/bookings')) {
      setActiveTab('bookings');
    }
  }, [searchParams, location.pathname]);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfilePhone(currentUser.phone || '');
      setProfileAvatar(currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80');
      setProfileDivision(currentUser.division || '');
      setProfileDistrict(currentUser.district || currentUser.city || '');
      setProfileArea(currentUser.area || '');
      setProfileAddress(currentUser.address || '');
    }
  }, [currentUser?.id]);

  const customerCompletion = calculateCustomerCompletion(currentUser);
  const districtsInDivision = getDistrictsByDivision(profileDivision || undefined);
  const activeDistrictObj = findDistrict(profileDistrict) || districtsInDivision[0] || BANGLADESH_DISTRICTS[0];
  const areasInDistrict = profileDistrict ? activeDistrictObj.areas : [];

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
  const customerWarranties = warranties.filter(w => w.customerId === currentUser?.id || currentUser?.role === 'CUSTOMER');
  const pendingFeedbackBookings = completedBookings.filter(b => !b.reviewed);

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
      customerName: currentUser?.name || (isBangla ? 'গ্রাহক' : 'Customer'),
      customerAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      technicianId: reviewBooking.technicianId,
      overallRating,
      workQuality: ratingWorkQuality,
      behavior: ratingBehavior,
      punctuality: ratingPunctuality,
      priceFairness: ratingPriceFairness,
      feedbackTags: selectedFeedbackTags,
      comment: reviewComment.trim() || (isBangla ? 'চমৎকার এবং সন্তোষজনক কাজ হয়েছে।' : 'Great and satisfactory work.'),
      serviceName: isBangla ? (reviewBooking.serviceNameBn || reviewBooking.serviceNameEn) : (reviewBooking.serviceNameEn || reviewBooking.serviceNameBn)
    });

    setReviewBooking(null);
    setReviewComment('');
    showToast(
      isBangla
        ? 'আপনার মূল্যবান ফিডব্যাক ও রেটিং সফলভাবে জমা হয়েছে!'
        : 'Your feedback and rating have been submitted successfully!'
    );
  };

  const handleWarrantySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyBooking || !warrantyIssue.trim()) return;

    submitWarrantyClaim({
      bookingId: warrantyBooking.id,
      bookingNumber: warrantyBooking.bookingNumber,
      customerId: currentUser?.id || warrantyBooking.customerId || 'user-customer',
      customerName: currentUser?.name || warrantyBooking.customerName,
      customerPhone: currentUser?.phone || warrantyBooking.customerPhone,
      customerArea: warrantyBooking.customerArea,
      customerAddress: warrantyBooking.customerAddress,
      customerLat: warrantyBooking.customerLat,
      customerLng: warrantyBooking.customerLng,
      technicianId: warrantyBooking.technicianId,
      technicianName: warrantyBooking.technicianName,
      technicianPhone: warrantyBooking.technicianPhone,
      serviceName: isBangla ? warrantyBooking.serviceNameBn : warrantyBooking.serviceNameEn,
      issueDescription: warrantyIssue.trim()
    });

    setWarrantyBooking(null);
    setWarrantyIssue('');
    setActiveTab('warranties');
    showToast(
      isBangla
        ? 'ওয়ারেন্টি ক্লেইম অ্যাডমিনের কাছে পাঠানো হয়েছে! অনুমোদনের পর নির্ধারিত টেকনিশিয়ানের কাছে যাবে।'
        : 'Warranty claim sent to admin! After approval, it will be assigned to your technician.'
    );
  };

  const handleCustomerDivisionChange = (newDiv: string) => {
    setProfileDivision(newDiv);
    if (!newDiv) {
      setProfileDistrict('');
      setProfileArea('');
      return;
    }
    const divDistricts = getDistrictsByDivision(newDiv);
    if (divDistricts.length > 0) {
      setProfileDistrict(divDistricts[0].nameEn);
      setProfileArea(divDistricts[0].areas[0]?.nameEn || divDistricts[0].nameEn);
    }
  };

  const handleCustomerDistrictChange = (newDist: string) => {
    setProfileDistrict(newDist);
    if (!newDist) {
      setProfileArea('');
      return;
    }
    const distObj = findDistrict(newDist);
    if (distObj) {
      setProfileArea(distObj.areas[0]?.nameEn || distObj.nameEn);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedFields = {
      name: profileName.trim(),
      phone: profilePhone.trim(),
      avatar: profileAvatar.trim(),
      division: profileDivision,
      district: profileDistrict,
      city: profileDistrict,
      area: profileArea,
      address: profileAddress.trim()
    };
    updateProfile(updatedFields);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3500);

    const nextCompletion = calculateCustomerCompletion({
      ...currentUser,
      ...updatedFields
    });
    if (nextCompletion.isComplete) {
      setShowConfetti(true);
      showToast(
        isBangla
          ? 'অভিনন্দন! আপনার গ্রাহক প্রোফাইল ১০০% সম্পূর্ণ হয়েছে — এখন সার্ভিস বুক করতে পারবেন!'
          : 'Congratulations! Your customer profile is 100% complete — you can now book services!'
      );
    } else {
      showToast(
        isBangla
          ? `প্রোফাইল সংরক্ষিত হয়েছে (${nextCompletion.percent}% সম্পূর্ণ)`
          : `Profile saved (${nextCompletion.percent}% complete)`
      );
    }
  };

  const customerNavGroups: DashboardNavGroup[] = [
    {
      id: 'activity',
      label: isBangla ? 'সেবা ও বুকিং কার্যক্রম' : 'Services & Activity',
      items: [
        {
          id: 'bookings',
          label: isBangla ? 'আমার বুকিং হিস্ট্রি' : 'My Bookings',
          icon: <Calendar className="w-4 h-4" />,
          count: customerBookings.length
        },
        {
          id: 'feedback',
          label: isBangla ? 'ফিডব্যাক ও রিভিউ' : 'Feedback & Reviews',
          icon: <Star className="w-4 h-4" />,
          count: pendingFeedbackBookings.length > 0 ? pendingFeedbackBookings.length : reviews.length,
          highlightCount: pendingFeedbackBookings.length > 0
        },
        {
          id: 'warranties',
          label: isBangla ? 'ওয়ারেন্টি ক্লেইম' : 'Warranty Claims',
          icon: <ShieldCheck className="w-4 h-4" />,
          count: customerWarranties.length
        },
        {
          id: 'invoices',
          label: isBangla ? 'ইনভয়েস ও রসিদ' : 'Invoices & Receipts',
          icon: <Receipt className="w-4 h-4" />,
          count: customerInvoices.length
        }
      ]
    },
    {
      id: 'account',
      label: isBangla ? 'পছন্দ ও অ্যাকাউন্ট' : 'Preferences & Account',
      items: [
        {
          id: 'favorites',
          label: isBangla ? 'পছন্দের মিস্ত্রি' : 'Favorite Pros',
          icon: <Heart className="w-4 h-4" />,
          count: favoriteTechs.length
        },
        {
          id: 'reminders',
          label: isBangla ? 'রক্ষণাবেক্ষণ রিমাইন্ডার' : 'Appliance Reminders',
          icon: <Clock className="w-4 h-4" />,
          count: maintenanceReminders.length
        },
        {
          id: 'profile',
          label: isBangla ? 'ঠিকানা ও প্রোফাইল' : 'Profile & Addresses',
          icon: <Settings className="w-4 h-4" />,
          count: `${customerCompletion.percent}%`,
          highlightCount: !customerCompletion.isComplete
        }
      ]
    }
  ];

  const customerSectionMeta: Record<typeof activeTab, { title: string; subtitle: string }> = {
    bookings: {
      title: isBangla ? 'আমার বুকিং ও লাইভ ট্র্যাকিং' : 'My Service Bookings',
      subtitle: isBangla
        ? 'চলমান কাজের অগ্রগতি, মিস্ত্রির সাথে চ্যাট ও সম্পন্ন কাজের হিসাব দেখুন।'
        : 'Track active technician dispatches, message pros, and review past service records.'
    },
    feedback: {
      title: isBangla ? 'ফিডব্যাক ও ৫-স্টার রিভিউ' : 'Feedback & Reviews',
      subtitle: isBangla
        ? 'সম্পন্ন হওয়া কাজের মান যাচাই করে রেটিং ও মূল্যবান মতামত প্রদান করুন।'
        : 'Rate completed services and browse your submitted technician feedback.'
    },
    reminders: {
      title: isBangla ? 'অ্যাপ্লায়েন্স রক্ষণাবেক্ষণ রিমাইন্ডার' : 'Appliance Maintenance Reminders',
      subtitle: isBangla
        ? 'এসি, ফ্রিজ, ওয়াটার ফিল্টার এবং হোম ইকুইপমেন্টের নিয়মিত সার্ভিসিং শিডিউল করুন।'
        : 'Schedule recurring health checks and service reminders for your home appliances.'
    },
    favorites: {
      title: isBangla ? 'সংরক্ষিত পছন্দের মিস্ত্রিবৃন্দ' : 'Favorite Technicians',
      subtitle: isBangla
        ? 'আপনার বিশ্বস্ত ও পূর্বপরিচিত টেকনিশিয়ানদের দ্রুত পুনরায় বুক করুন।'
        : 'Quickly re-book trusted technicians you have bookmarked.'
    },
    invoices: {
      title: isBangla ? 'ইনভয়েস ও পেমেন্ট রসিদ' : 'Invoices & Payment Receipts',
      subtitle: isBangla
        ? 'প্রতিটি সম্পন্ন সার্ভিসের অফিসিয়াল বিল ও পেমেন্ট রসিদ ডাউনলোড বা প্রিন্ট করুন।'
        : 'View and print official itemized service invoices and payment records.'
    },
    warranties: {
      title: isBangla ? '৭-দিনের ওয়ারেন্টি ক্লেইম সেন্টার' : '7-Day Warranty Claims',
      subtitle: isBangla
        ? 'কাজ সম্পন্ন হওয়ার ৭ দিনের মধ্যে পুনরায় সমস্যা দেখা দিলে ফ্রি রি-সার্ভিস ক্লেইম করুন।'
        : 'Track or submit free warranty re-service claims within 7 days of job completion.'
    },
    profile: {
      title: isBangla ? 'গ্রাহক প্রোফাইল ও ঠিকানা ব্যবস্থাপনা' : 'Profile & Service Addresses',
      subtitle: isBangla
        ? 'আপনার বিভাগ, জেলা, এলাকা ও বিস্তারিত ঠিকানা হালনাগাদ রাখুন।'
        : 'Keep your Bangladesh division, district, area, and service address up to date.'
    }
  };

  const customerKpis: DashboardKpiItem[] = [
    {
      id: 'active',
      label: isBangla ? 'চলমান বুকিং' : 'Active Bookings',
      value: activeBookings.length,
      sublabel: isBangla ? 'লাইভ ট্র্যাকিং চলমান' : 'Live in progress',
      accent: 'orange'
    },
    {
      id: 'completed',
      label: isBangla ? 'সম্পন্ন বুকিং' : 'Completed Jobs',
      value: completedBookings.length,
      sublabel: isBangla ? '৭ দিন ওয়ারেন্টি আওতাভুক্ত' : 'Warranty protected',
      accent: 'emerald'
    },
    {
      id: 'favorites',
      label: isBangla ? 'সংরক্ষিত মিস্ত্রি' : 'Favorite Pros',
      value: favoriteTechs.length,
      sublabel: isBangla ? 'বুকমার্ক করা টেকনিশিয়ান' : 'Bookmarked pros',
      accent: 'rose'
    },
    {
      id: 'reminders',
      label: isBangla ? 'রক্ষণাবেক্ষণ রিমাইন্ডার' : 'Reminders',
      value: maintenanceReminders.length,
      sublabel: isBangla ? 'পরবর্তী সার্ভিস শিডিউল' : 'Scheduled checks',
      accent: 'blue'
    }
  ];

  const customerCompletionBanner = (!customerCompletion.isComplete || searchParams.get('onboarding') === '1') ? (
    <div
      className={`p-3.5 sm:p-5 rounded-2xl border space-y-2.5 sm:space-y-3 ${
        customerCompletion.isComplete
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/40'
          : 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-500/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${customerCompletion.isComplete ? 'text-emerald-600' : 'text-orange-600'}`} />
            <span className="font-bold text-sm text-zinc-900 dark:text-white">
              {customerCompletion.isComplete
                ? isBangla
                  ? 'আপনার প্রোফাইল ১০০% সম্পূর্ণ!'
                  : 'Profile 100% Complete!'
                : isBangla
                ? 'প্রোফাইল ও ঠিকানা সম্পূর্ণ করুন (১০০% আবশ্যক)'
                : 'Complete Your Profile & Address (100% Required)'}
            </span>
            <span
              className={`text-xs font-extrabold tabular-nums ${
                customerCompletion.isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
              }`}
            >
              · {customerCompletion.percent}%
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            {customerCompletion.isComplete
              ? isBangla
                ? 'সারা বাংলাদেশের যেকোনো জেলায় এখনই ভেরিফায়েড মিস্ত্রি বুক করতে পারবেন।'
                : 'You can now book verified technicians anywhere in Bangladesh.'
              : isBangla
              ? `সার্ভিস বুকিং করার জন্য বাকি তথ্য যুক্ত করুন (${customerCompletion.completedCount}/${customerCompletion.totalCount} সম্পূর্ণ): ${customerCompletion.missingLabelsBn.join(', ')}`
              : `Complete remaining fields to unlock booking: ${customerCompletion.missingLabelsEn.join(', ')}`}
          </p>
        </div>
        {activeTab !== 'profile' && !customerCompletion.isComplete && (
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer shrink-0 whitespace-nowrap self-start sm:self-auto"
          >
            {isBangla ? 'প্রোফাইল সম্পূর্ণ করুন' : 'Complete Profile'}
          </button>
        )}
      </div>
      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            customerCompletion.isComplete ? 'bg-emerald-500' : 'bg-orange-600'
          }`}
          style={{ width: `${customerCompletion.percent}%` }}
        />
      </div>
    </div>
  ) : null;

  return (
    <>
      <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Toast Notification */}
      {customerToast && (
        <div className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-[3100] px-4 py-3 rounded-2xl bg-zinc-900 text-white text-xs font-bold shadow-2xl border border-orange-500/50 flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{customerToast}</span>
        </div>
      )}

      <DashboardShell
        portalLabel={isBangla ? 'গ্রাহক ড্যাশবোর্ড' : 'Customer Portal'}
        userName={currentUser?.name || (isBangla ? 'গ্রাহক' : 'Customer')}
        userMeta={`${currentUser?.area ? `${currentUser.area}, ` : ''}${currentUser?.district || currentUser?.city || (isBangla ? 'ঠিকানা অসম্পূর্ণ' : 'Address Incomplete')}`}
        userAvatar={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
        verifiedLabel={isBangla ? 'ভেরিফাইড অ্যাকাউন্ট' : 'Verified'}
        isVerified
        navGroups={customerNavGroups}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as typeof activeTab)}
        activeSectionTitle={customerSectionMeta[activeTab].title}
        activeSectionSubtitle={customerSectionMeta[activeTab].subtitle}
        kpis={customerKpis}
        banners={customerCompletionBanner}
        mobileStickyTopSlot={
          activeBookings.length > 0 ? (
            <div className="flex items-center justify-between gap-2 text-xs py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping shrink-0" />
                <div className="min-w-0">
                  <span className="font-extrabold text-zinc-900 dark:text-white truncate text-[11px] block">
                    {isBangla ? activeBookings[0].serviceNameBn : activeBookings[0].serviceNameEn}
                  </span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono truncate block">
                    #{activeBookings[0].bookingNumber} · {activeBookings[0].technicianName}
                  </span>
                </div>
              </div>
              <Link
                to={`/booking/${activeBookings[0].id}`}
                className="px-2.5 py-1 rounded-lg bg-orange-600 text-white font-bold text-[10px] whitespace-nowrap shrink-0"
              >
                {isBangla ? 'লাইভ ট্র্যাকিং' : 'Track'}
              </Link>
            </div>
          ) : undefined
        }
        headerActions={
          <>
            <Link
              to="/map"
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs hover:border-orange-500 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Map className="w-4 h-4 text-orange-500" />
              <span>{isBangla ? 'লাইভ মিস্ত্রি খুঁজুন' : 'Find Nearby Pro'}</span>
            </Link>
            <Link
              to="/book"
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isBangla ? 'নতুন সার্ভিস বুক করুন' : 'Book New Service'}</span>
            </Link>
          </>
        }
      >

      {/* TAB 1: BOOKINGS LIST */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Sub-filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
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
            <div className="p-7 sm:p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
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
            <div className="space-y-3 sm:space-y-4">
              {filteredBookingsList.map((booking) => {
                const isCompleted = booking.status === 'COMPLETED';

                return (
                  <div
                    key={booking.id}
                    className="p-3.5 sm:p-5 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3 sm:space-y-4 transition-all hover:border-orange-500/40"
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
                          <span>
                            {booking.paymentStatus === 'PAID'
                              ? isBangla
                                ? '✅ পরিশোধিত'
                                : '✅ Paid'
                              : isBangla
                                ? '⏳ পেমেন্ট বাকি'
                                : '⏳ Payment Due'}
                          </span>
                          <span>{isBangla ? '৭ দিন ফ্রি ওয়ারেন্টি' : '7-Day Free Warranty'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/booking/${booking.id}`}
                          className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                        >
                          <span>{isBangla ? 'লাইভ ডিসপ্যাচ ও ট্র্যাকিং' : 'Live Tracking'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        {/* Direct Chat Button with Unread Badge */}
                        {(() => {
                          const unreadCount = getUnreadChatCount(booking.id, 'CUSTOMER');
                          return (
                            <button
                              type="button"
                              onClick={() => setChatModalBooking(booking)}
                              className={`relative px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                unreadCount > 0
                                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 animate-pulse'
                                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-500/30 hover:bg-orange-100'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{isBangla ? 'মেসেজ ও চ্যাট' : 'Message Pro'}</span>
                              {unreadCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white text-orange-600 text-[10px] font-black">
                                  {unreadCount}
                                </span>
                              )}
                            </button>
                          );
                        })()}
                      </div>

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
                            <span>{isBangla ? 'ফিডব্যাক ও রিভিউ দিন' : 'Rate & Feedback'}</span>
                          </button>
                        )}

                        {isCompleted && booking.reviewed && (() => {
                          const existingReview = reviews.find(r => r.bookingId === booking.id);
                          return (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>
                                {existingReview
                                  ? `${existingReview.overallRating}★ ${isBangla ? 'ফিডব্যাক প্রদত্ত' : 'Feedback Given'}`
                                  : isBangla
                                    ? 'ফিডব্যাক প্রদত্ত'
                                    : 'Feedback Given'}
                              </span>
                            </span>
                          );
                        })()}

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

      {/* TAB: FEEDBACK & REVIEWS */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Pending Feedback Section */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-current" />
                <span>{isBangla ? 'ফিডব্যাক প্রদানের অপেক্ষায় থাকা সম্পন্ন কাজ' : 'Completed Jobs Awaiting Your Feedback'}</span>
              </h3>
              <p className="text-xs text-zinc-500">
                {isBangla
                  ? 'আপনার প্রতিটি রিভিউ ও ফিডব্যাক দক্ষ টেকনিশিয়ানদের উৎসাহিত করে এবং সেবার মান নিশ্চিত করে।'
                  : 'Rate completed bookings to help other customers choose trusted technicians.'}
              </p>
            </div>

            {pendingFeedbackBookings.length === 0 ? (
              <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isBangla
                    ? 'আপনার সকল সম্পন্ন বুকিংয়ের ফিডব্যাক প্রদান করা হয়ে গেছে! ধন্যবাদ।'
                    : 'All your completed bookings have been reviewed. Thank you!'}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {pendingFeedbackBookings.map(b => (
                  <div key={b.id} className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-2 border-amber-400/50 shadow-sm flex flex-col justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3">
                      <img src={b.technicianAvatar} alt={b.technicianName} className="w-12 h-12 rounded-2xl object-cover border border-orange-500/30 shrink-0" />
                      <div>
                        <span className="text-[11px] font-mono font-bold text-orange-600">#{b.bookingNumber}</span>
                        <h4 className="font-black text-sm text-zinc-900 dark:text-white">
                          {isBangla ? b.serviceNameBn : b.serviceNameEn}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {isBangla ? 'টেকনিশিয়ান:' : 'Technician:'}{' '}
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{b.technicianName}</span> ·{' '}
                          {isBangla ? 'তারিখ:' : 'Date:'} {b.date}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewBooking(b)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Star className="w-4 h-4 fill-current" />
                      <span>{isBangla ? 'এখনই ফিডব্যাক ও ৫-স্টার রেটিং দিন' : 'Submit Feedback & Rating'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submitted Feedback History */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-zinc-900 dark:text-white">
              {isBangla ? 'আপনার প্রদানকৃত রিভিউ ও ফিডব্যাক হিস্ট্রি' : 'Your Submitted Feedback History'} ({reviews.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {reviews.map(rev => {
                const tech = technicians.find(item => item.id === rev.technicianId);
                return (
                  <div key={rev.id} className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-black text-xs text-zinc-900 dark:text-white">{rev.serviceName}</div>
                        <div className="text-[11px] text-zinc-500">
                          {isBangla ? 'টেকনিশিয়ান:' : 'Technician:'}{' '}
                          <span className="font-bold text-orange-600">{tech?.name || (isBangla ? 'টেকনিশিয়ান' : 'Technician')}</span> · {rev.createdAt}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{rev.overallRating}</span>
                      </span>
                    </div>

                    <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-stone-50 dark:bg-zinc-800/70 p-3 rounded-2xl italic border border-zinc-200 dark:border-zinc-700/60">
                      "{rev.comment}"
                    </p>

                    {rev.feedbackTags && rev.feedbackTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {rev.feedbackTags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center text-[10px] text-zinc-500">
                      <div>{isBangla ? 'কাজের মান:' : 'Quality:'} <span className="font-black text-zinc-800 dark:text-zinc-200">{rev.workQuality}★</span></div>
                      <div>{isBangla ? 'আচরণ:' : 'Behavior:'} <span className="font-black text-zinc-800 dark:text-zinc-200">{rev.behavior}★</span></div>
                      <div>{isBangla ? 'সময়ানুবর্তিতা:' : 'Punctuality:'} <span className="font-black text-zinc-800 dark:text-zinc-200">{rev.punctuality}★</span></div>
                      <div>{isBangla ? 'মূল্য:' : 'Price:'} <span className="font-black text-zinc-800 dark:text-zinc-200">{rev.priceFairness}★</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
            <form onSubmit={handleCreateReminder} className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-orange-500/40 shadow-lg space-y-3.5 sm:space-y-4 animate-in fade-in">
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
                    <option value="ac_repair">{isBangla ? 'এসি সার্ভিসিং' : 'AC Repair & Servicing'}</option>
                    <option value="plumbing">{isBangla ? 'প্লাম্বিং ও পাইপলাইন' : 'Plumbing & Pipeline'}</option>
                    <option value="electrical">{isBangla ? 'ইলেকট্রিক্যাল ও শর্ট সার্কিট' : 'Electrical & Wiring'}</option>
                    <option value="appliance">{isBangla ? 'ফ্রিজ ও ওয়াশিং মেশিন' : 'Fridge & Washing Machine'}</option>
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
                    <option value={3}>{isBangla ? 'প্রতি ৩ মাস অন্তর' : 'Every 3 Months (Quarterly)'}</option>
                    <option value={6}>{isBangla ? 'প্রতি ৬ মাস অন্তর' : 'Every 6 Months (Bi-annual)'}</option>
                    <option value={12}>{isBangla ? 'প্রতি ১২ মাস অন্তর' : 'Every 12 Months (Annual)'}</option>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {maintenanceReminders.map((rem) => (
              <div
                key={rem.id}
                className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-3 sm:gap-4 shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">
                      {isBangla ? `প্রতি ${rem.frequencyMonths} মাস পর` : `Every ${rem.frequencyMonths} mos`}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {isBangla ? 'শেষ সার্ভিস:' : 'Last Service:'} {rem.lastServiceDate}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                    {isBangla ? rem.titleBn : rem.titleEn}
                  </h4>
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isBangla ? 'পরবর্তী সার্ভিসিং তারিখ:' : 'Next Due Date:'} {rem.nextDueDate}</span>
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
            <div className="p-7 sm:p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {favoriteTechs.map((tech) => (
                <div
                  key={tech.id}
                  className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between space-y-3.5 sm:space-y-4 hover:border-orange-500/40 transition-all"
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
                          {inv.paymentStatus === 'PAID'
                            ? isBangla
                              ? 'পরিশোধিত'
                              : 'PAID'
                            : isBangla
                              ? 'কাজ শেষে নগদ'
                              : 'CASH ON SERVICE'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
                        {inv.serviceName} · {isBangla ? 'টেকনিশিয়ান:' : 'Technician:'} {inv.technicianName}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {isBangla ? 'তারিখ:' : 'Date:'} {inv.issueDate} · {isBangla ? 'মেথড:' : 'Method:'} {inv.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ৳{inv.total}
                      </div>
                      <div className="text-[10px] text-zinc-400">{isBangla ? 'ভ্যাটসহ মোট' : 'Total incl. VAT'}</div>
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
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-600/10 via-amber-500/5 to-transparent border border-orange-500/30">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
              <span>{isBangla ? 'Servexa ৭-দিনের ফ্রি সার্ভিস সুরক্ষা গ্যারান্টি' : 'Servexa 7-Day Free Warranty Guarantee'}</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              {isBangla
                ? 'কাজ সম্পন্ন হওয়ার ৭ দিনের মধ্যে একই ধরণের সমস্যা পুনরাবৃত্তি হলে প্ল্যাটফর্ম থেকে কোনো ফি ছাড়া ফ্রি সার্ভিসিং নিশ্চিত করা হয়।'
                : 'If the same issue reoccurs within 7 days of service completion, a technician is dispatched free of cost under platform warranty.'}
            </p>
          </div>

          {customerWarranties.length === 0 ? (
            <div className="p-7 sm:p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <ShieldCheck className="w-10 h-10 text-zinc-400 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'কোনো ওয়ারেন্টি ক্লেইম পাওয়া যায়নি' : 'No warranty claims yet'}
              </h4>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'সম্পন্ন হওয়া কোনো বুকিংয়ে সমস্যা দেখা দিলে বুকিং কার্ড থেকে "ওয়ারেন্টি ক্লেইম" করতে পারবেন।' : 'Submit a warranty claim from any completed booking card.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerWarranties.map((w) => {
                const relatedBooking = bookings.find(b => b.id === w.bookingId);
                const techName = w.technicianName || relatedBooking?.technicianName || (isBangla ? 'টেকনিশিয়ান' : 'Technician');
                const warrantyStep =
                  w.status === 'REQUESTED' ? 1 :
                  w.status === 'APPROVED' ? 2 :
                  w.status === 'ACCEPTED' || w.status === 'ON_THE_WAY' ? 3 :
                  w.status === 'RESOLVED' ? 4 : 1;

                const statusLabelMap: Record<WarrantyClaim['status'], string> = {
                  REQUESTED: isBangla ? 'অ্যাডমিন অনুমোদনের অপেক্ষায়' : 'Awaiting Admin Approval',
                  APPROVED: isBangla ? 'অ্যাডমিন অনুমোদিত · টেকনিশিয়ানের কাছে পাঠানো হয়েছে' : 'Admin Approved · Dispatched to Tech',
                  ACCEPTED: isBangla ? 'টেকনিশিয়ান কাজ পিক করেছেন' : 'Technician Accepted Job',
                  ON_THE_WAY: isBangla ? 'টেকনিশিয়ান বাসায় রওনা হয়েছেন' : 'Technician On The Way',
                  RESOLVED: isBangla ? 'সার্ভিস সম্পন্ন' : 'Resolved',
                  REJECTED: isBangla ? 'প্রত্যাখ্যাত' : 'Rejected'
                };

                const statusBadgeStyle: Record<WarrantyClaim['status'], string> = {
                  REQUESTED: 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
                  APPROVED: 'bg-blue-500/15 text-blue-600 border border-blue-500/30',
                  ACCEPTED: 'bg-indigo-500/15 text-indigo-600 border border-indigo-500/30',
                  ON_THE_WAY: 'bg-orange-500/15 text-orange-600 border border-orange-500/30 animate-pulse',
                  RESOLVED: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
                  REJECTED: 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                };

                return (
                  <div key={w.id} className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="font-mono text-xs font-black text-orange-600">
                        {isBangla ? 'ওয়্যারেন্টি আইডি:' : 'Warranty ID:'} #{w.id} · {isBangla ? 'সার্ভিস নং' : 'Booking'} #{w.bookingNumber}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black self-start sm:self-auto ${statusBadgeStyle[w.status]}`}>
                        {statusLabelMap[w.status]}
                      </span>
                    </div>

                    {w.status !== 'REJECTED' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-bold">
                        <div className={`p-2 rounded-xl border ${warrantyStep >= 1 ? 'bg-orange-600 text-white border-orange-600' : 'bg-stone-50 dark:bg-zinc-800 text-zinc-400'}`}>
                          {isBangla ? '১. আবেদন জমা' : '1. Claim Submitted'}
                        </div>
                        <div className={`p-2 rounded-xl border ${warrantyStep >= 2 ? 'bg-blue-600 text-white border-blue-600' : 'bg-stone-50 dark:bg-zinc-800 text-zinc-400'}`}>
                          {isBangla ? '২. অ্যাডমিন অনুমোদন' : '2. Admin Approved'}
                        </div>
                        <div className={`p-2 rounded-xl border ${warrantyStep >= 3 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-stone-50 dark:bg-zinc-800 text-zinc-400'}`}>
                          {isBangla ? '৩. টেকনিশিয়ান পিক ও রওনা' : '3. Tech Dispatched'}
                        </div>
                        <div className={`p-2 rounded-xl border ${warrantyStep >= 4 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-stone-50 dark:bg-zinc-800 text-zinc-400'}`}>
                          {isBangla ? '৪. সার্ভিস সম্পন্ন' : '4. Resolved'}
                        </div>
                      </div>
                    )}

                    <div className="text-xs space-y-1">
                      <div className="font-bold text-zinc-900 dark:text-white">
                        {isBangla ? 'সার্ভিস:' : 'Service:'} {w.serviceName} ·{' '}
                        {isBangla ? 'নির্ধারিত টেকনিশিয়ান:' : 'Assigned Tech:'}{' '}
                        <span className="text-orange-600">{techName}</span>
                      </div>
                      <div className="text-zinc-500">
                        {isBangla ? 'আবেদনের তারিখ:' : 'Applied:'} {w.requestDate}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-stone-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 italic">
                      {isBangla ? 'অভিযোগ বিবরণ:' : 'Issue:'} "{w.issueDescription}"
                    </p>

                    {w.adminNote && (
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                        🛡️ {isBangla ? 'অ্যাডমিন নোট:' : 'Admin Note:'} {w.adminNote}
                      </div>
                    )}
                    {w.technicianNote && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        🔧 {isBangla ? 'টেকনিশিয়ান আপডেট:' : 'Tech Update:'} {w.technicianNote}
                      </div>
                    )}

                    {w.status === 'RESOLVED' && relatedBooking && !relatedBooking.reviewed && (
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setReviewBooking(relatedBooking)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{isBangla ? 'ওয়ারেন্টি সার্ভিস ফিডব্যাক দিন' : 'Rate Warranty Service'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PROFILE & ADDRESSES */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                {isBangla ? 'গ্রাহক প্রোফাইল ও ঠিকানা ব্যবস্থাপনা' : 'Customer Profile & Address'}
              </h3>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'সারা বাংলাদেশের বিভাগ, জেলা, এলাকা ও বিস্তারিত ঠিকানা সংরক্ষণ করুন।' : 'Update your Bangladesh division, district, area, and full delivery address.'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-xl text-xs font-black tabular-nums self-start ${
              customerCompletion.isComplete ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' : 'bg-orange-500/15 text-orange-600 border border-orange-500/30'
            }`}>
              {customerCompletion.percent}% {isBangla ? 'সম্পূর্ণ' : 'Complete'}
            </span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'বিভাগ (Division):' : 'Division:'}
                </label>
                <select
                  required
                  value={profileDivision}
                  onChange={(e) => handleCustomerDivisionChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-medium"
                >
                  <option value="">{isBangla ? '-- বিভাগ নির্বাচন --' : '-- Select Division --'}</option>
                  {BANGLADESH_DIVISIONS.map(div => (
                    <option key={div.id} value={div.nameEn}>
                      {isBangla ? div.nameBn : div.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'জেলা (৬৪ জেলা):' : 'District (64):'}
                </label>
                <select
                  required
                  value={profileDistrict}
                  onChange={(e) => handleCustomerDistrictChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-medium"
                >
                  <option value="">{isBangla ? '-- জেলা নির্বাচন --' : '-- Select District --'}</option>
                  {districtsInDivision.map(dist => (
                    <option key={dist.id} value={dist.nameEn}>
                      {isBangla ? `${dist.nameBn} (${dist.nameEn})` : dist.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'এলাকা / উপজেলা:' : 'Area / Upazila:'}
                </label>
                <select
                  required
                  value={profileArea}
                  onChange={(e) => setProfileArea(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-medium"
                >
                  <option value="">{isBangla ? '-- এলাকা নির্বাচন --' : '-- Select Area --'}</option>
                  {areasInDistrict.map(a => (
                    <option key={a.nameEn} value={a.nameEn}>
                      {isBangla ? `${a.nameBn} (${a.nameEn})` : a.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                {isBangla ? 'বিস্তারিত ঠিকানা (বাড়ি / রোড / মহল্লা):' : 'Full Detailed Address:'}
              </label>
              <textarea
                rows={3}
                required
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                placeholder={isBangla ? 'যেমন: বাড়ি ২৪, রোড ৭/এ, ব্লক বি (জেলা ও থানা সহ লিখুন)' : 'House, Road, Block, Landmark'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-medium"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 cursor-pointer"
              >
                {isBangla ? 'তথ্য সংরক্ষণ ও হালনাগাদ করুন' : 'Save & Update Profile'}
              </button>
              {customerCompletion.isComplete && (
                <Link
                  to="/book"
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs text-center shadow-md"
                >
                  {isBangla ? 'সার্ভিস বুক করুন →' : 'Book Service →'}
                </Link>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span>{isBangla ? 'কাজের ফিডব্যাক ও ৫-স্টার রেটিং প্রদান' : 'Rate & Feedback Technician'}</span>
              </h3>
              <button onClick={() => setReviewBooking(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">✕</button>
            </div>

            <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 flex items-center justify-between text-xs">
              <div>
                <div className="font-black text-zinc-900 dark:text-white">{reviewBooking.technicianName}</div>
                <div className="text-[11px] text-zinc-500">
                  {isBangla ? reviewBooking.serviceNameBn : reviewBooking.serviceNameEn}
                </div>
              </div>
              <div className="px-3 py-1 rounded-xl bg-amber-500 text-white font-black text-xs">
                ★ {((ratingWorkQuality + ratingBehavior + ratingPunctuality + ratingPriceFairness) / 4).toFixed(1)}
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: isBangla ? 'কাজের মান' : 'Work Quality', val: ratingWorkQuality, setVal: setRatingWorkQuality },
                  { label: isBangla ? 'আচরণ' : 'Behavior', val: ratingBehavior, setVal: setRatingBehavior },
                  { label: isBangla ? 'সময়ানুবর্তিতা' : 'Punctuality', val: ratingPunctuality, setVal: setRatingPunctuality },
                  { label: isBangla ? 'মূল্য যথার্থতা' : 'Price Fairness', val: ratingPriceFairness, setVal: setRatingPriceFairness }
                ].map((metric, idx) => (
                  <div key={idx} className="p-2.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">{metric.label}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => metric.setVal(star)}
                          className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                        >
                          <Star className={`w-4 h-4 ${star <= metric.val ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="font-bold block mb-1.5 text-zinc-700 dark:text-zinc-300">
                  {isBangla ? 'দ্রুত ফিডব্যাক ট্যাগ (ঐচ্ছিক):' : 'Quick Feedback Tags (Optional):'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FEEDBACK_QUICK_TAGS.map(item => {
                    const tagLabel = isBangla ? item.bn : item.en;
                    const active = selectedFeedbackTags.includes(item.bn) || selectedFeedbackTags.includes(item.en);
                    return (
                      <button
                        key={item.en}
                        type="button"
                        onClick={() => {
                          if (active) {
                            setSelectedFeedbackTags(prev => prev.filter(t => t !== item.bn && t !== item.en));
                          } else {
                            setSelectedFeedbackTags(prev => [...prev, tagLabel]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          active
                            ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                            : 'bg-stone-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {active ? '✓ ' : ''}{tagLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                  {isBangla ? 'আপনার ব্যক্তিগত মতামত বা অভিজ্ঞতা:' : 'Your Personal Feedback & Experience:'}
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    isBangla
                      ? 'মিস্ত্রি সময়মতো এসেছিলেন এবং সততার সাথে নিখুঁত কাজ সম্পন্ন করেছেন...'
                      : 'The technician arrived on time and completed the work cleanly...'
                  }
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewBooking(null)} className="px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer">
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md cursor-pointer">
                  {isBangla ? 'ফিডব্যাক জমা দিন' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warranty Claim Modal */}
      {warrantyBooking && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span>{isBangla ? '৭-দিনের ফ্রি ওয়ারেন্টি ক্লেইম সাবমিট' : 'Submit 7-Day Warranty Claim'}</span>
              </h3>
              <button onClick={() => setWarrantyBooking(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {isBangla ? 'বুকিং নং:' : 'Booking No:'}{' '}
              <span className="font-bold text-orange-600 font-mono">#{warrantyBooking.bookingNumber}</span> ·{' '}
              {isBangla ? 'সার্ভিস:' : 'Service:'}{' '}
              <span className="font-bold">{isBangla ? warrantyBooking.serviceNameBn : warrantyBooking.serviceNameEn}</span>
            </div>

            <form onSubmit={handleWarrantySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">
                  {isBangla ? 'সমস্যার বিশদ বিবরণ লিখে জানান:' : 'Describe the recurring issue in detail:'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={warrantyIssue}
                  onChange={(e) => setWarrantyIssue(e.target.value)}
                  placeholder={
                    isBangla
                      ? 'কাজ করার পর আবার পাইপ থেকে পানি চুইয়ে পড়ছে বা এসি কুলিং কমে গেছে...'
                      : 'e.g. Water is leaking from the pipe again or AC cooling dropped...'
                  }
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-orange-500/10 text-[11px] text-zinc-700 dark:text-zinc-300">
                {isBangla
                  ? '💡 ওয়ারেন্টি ক্লেইম সাবমিটের পর অ্যাডমিন টিম অবিলম্বে পর্যালোচনা করে ফ্রি রি-ডিসপ্যাচ অনুমোদন করবে।'
                  : '💡 Once submitted, the admin team will review and approve a free technician re-dispatch immediately.'}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setWarrantyBooking(null)} className="px-4 py-2 rounded-xl border text-xs font-bold">
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md">
                  {isBangla ? 'ক্লেইম সাবমিট করুন' : 'Submit Claim'}
                </button>
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

      {/* Live Messenger Chat Modal */}
      {chatModalBooking && (
        <ChatModal
          booking={chatModalBooking}
          isOpen={!!chatModalBooking}
          onClose={() => setChatModalBooking(null)}
        />
      )}
      </DashboardShell>
    </>
  );
};
