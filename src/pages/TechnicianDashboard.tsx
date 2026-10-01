import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  DollarSign,
  Star,
  Users,
  AlertCircle,
  FilePlus,
  Truck,
  ArrowRight,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Phone,
  Radio,
  Zap,
  Briefcase,
  Layers,
  Wrench,
  Camera,
  Award,
  CreditCard,
  Plus,
  Trash2,
  Bell,
  Check,
  User,
  Image as ImageIcon,
  Edit3,
  Sparkles
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { RoleSwitcherBar } from '../components/common/RoleSwitcherBar';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { ImageUploader } from '../components/common/ImageUploader';
import { AvailabilityStatus, Booking, Invoice, PortfolioItem, Technician } from '../types';

export const TechnicianDashboard: React.FC = () => {
  const {
    bookings,
    technicians,
    categories,
    updateBookingStatus,
    generateInvoice,
    updateTechnicianAvailability,
    updateTechnicianProfile,
    addTechnicianPortfolio,
    deleteTechnicianPortfolio
  } = useApp();
  const { currentUser, updateProfile } = useAuth();
  const { t, isBangla } = useLanguage();
  const navigate = useNavigate();

  // Find technician record
  const currentTech: Technician = technicians.find(t => t.id === 'tech-1' || t.userId === currentUser?.id) || technicians[0];

  const [activeTab, setActiveTab] = useState<'requests' | 'active' | 'completed' | 'earnings' | 'profile' | 'skills' | 'portfolio'>('requests');
  const [invoiceModalBooking, setInvoiceModalBooking] = useState<Booking | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Invoice creation form inputs
  const [labourCostInput, setLabourCostInput] = useState(450);
  const [partsCostInput, setPartsCostInput] = useState(0);
  const [discountInput, setDiscountInput] = useState(0);
  const [paymentMethodInput, setPaymentMethodInput] = useState<'cash' | 'bkash' | 'nagad'>('cash');

  // Withdrawal modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(2500);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Profile Form State
  const [nameInput, setNameInput] = useState(currentTech.name);
  const [phoneInput, setPhoneInput] = useState(currentTech.phone);
  const [avatarInput, setAvatarInput] = useState(currentTech.avatar);
  const [areaInput, setAreaInput] = useState(currentTech.primaryArea);
  const [experienceInput, setExperienceInput] = useState(currentTech.experienceYears);
  const [workingHoursInput, setWorkingHoursInput] = useState(currentTech.workingHours);
  const [bioBnInput, setBioBnInput] = useState(currentTech.bioBn);
  const [bioEnInput, setBioEnInput] = useState(currentTech.bioEn);
  const [aboutBnInput, setAboutBnInput] = useState(currentTech.aboutBn || '');

  // Skills & Rates Form State
  const [visitingFeeInput, setVisitingFeeInput] = useState(currentTech.visitingFee || 200);
  const [startingPriceInput, setStartingPriceInput] = useState(currentTech.startingPrice || 350);
  const [radiusInput, setRadiusInput] = useState(currentTech.serviceRadiusKm || 15);
  const [emergencyAvailableInput, setEmergencyAvailableInput] = useState(currentTech.emergencyAvailable ?? true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentTech.skills || ['ac_repair', 'plumbing']);

  // Add Portfolio Modal State
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [portTitleBn, setPortTitleBn] = useState('');
  const [portTitleEn, setPortTitleEn] = useState('');
  const [portCategory, setPortCategory] = useState('ac_repair');
  const [portBeforeImg, setPortBeforeImg] = useState('https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&auto=format&fit=crop&q=80');
  const [portAfterImg, setPortAfterImg] = useState('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80');
  const [portDescBn, setPortDescBn] = useState('');

  // Sync inputs when currentTech updates
  useEffect(() => {
    if (currentTech) {
      setNameInput(currentTech.name);
      setPhoneInput(currentTech.phone);
      setAvatarInput(currentTech.avatar);
      setAreaInput(currentTech.primaryArea);
      setExperienceInput(currentTech.experienceYears);
      setWorkingHoursInput(currentTech.workingHours);
      setBioBnInput(currentTech.bioBn);
      setBioEnInput(currentTech.bioEn);
      setAboutBnInput(currentTech.aboutBn || '');
      setVisitingFeeInput(currentTech.visitingFee || 200);
      setStartingPriceInput(currentTech.startingPrice || 350);
      setRadiusInput(currentTech.serviceRadiusKm || 15);
      setEmergencyAvailableInput(currentTech.emergencyAvailable ?? true);
      setSelectedSkills(currentTech.skills || ['ac_repair', 'plumbing']);
    }
  }, [currentTech.id]);

  // Filter bookings for this technician
  const techBookings = bookings.filter(b => b.technicianId === currentTech.id || true);
  const pendingRequests = techBookings.filter(b => b.status === 'REQUESTED');
  const activeJobs = techBookings.filter(b => ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(b.status));
  const completedJobs = techBookings.filter(b => b.status === 'COMPLETED');

  // Simulated earnings calculation
  const totalEarnings = completedJobs.reduce((acc, b) => acc + (b.finalTotal || b.estimatedTotalMax || 650), 0) + 14500;
  const todayEarnings = 1450;
  const weekEarnings = 7800;
  const monthEarnings = 31200;

  const handleStatusAdvance = (bookingId: string, currentStatus: string) => {
    switch (currentStatus) {
      case 'REQUESTED':
        updateBookingStatus(bookingId, 'ACCEPTED', 'Technician accepted the job', 'মিস্ত্রি কাজ গ্রহণ করেছেন');
        showToast('কাজটি সফলভাবে গ্রহণ করা হয়েছে!');
        break;
      case 'ACCEPTED':
        updateBookingStatus(bookingId, 'ON_THE_WAY', 'Technician is on the way to address', 'মিস্ত্রি ঠিকানার উদ্দেশ্যে রওনা হয়েছেন');
        showToast('স্ট্যাটাস: গ্রাহকের ঠিকানায় রওয়ানা হয়েছেন');
        break;
      case 'ON_THE_WAY':
        updateBookingStatus(bookingId, 'ARRIVED', 'Technician arrived at location', 'মিস্ত্রি ঠিকানায় পৌঁছে গেছেন');
        showToast('স্ট্যাটাস: ঠিকানায় পৌঁছে গেছেন');
        break;
      case 'ARRIVED':
        updateBookingStatus(bookingId, 'IN_PROGRESS', 'Work started by technician', 'কাজ শুরু হয়েছে');
        showToast('স্ট্যাটাস: সার্ভিস কাজ শুরু হয়েছে');
        break;
      case 'IN_PROGRESS':
        const b = bookings.find(item => item.id === bookingId);
        if (b) {
          setLabourCostInput(b.estimatedLabourMin || 400);
          setInvoiceModalBooking(b);
        }
        break;
    }
  };

  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceModalBooking) return;

    generateInvoice(invoiceModalBooking.id, {
      visitingFee: invoiceModalBooking.estimatedVisitingFee || currentTech.visitingFee || 200,
      labourCost: labourCostInput,
      partsCost: partsCostInput,
      discount: discountInput,
      paymentMethod: paymentMethodInput,
      paymentStatus: 'PAID'
    });

    setInvoiceModalBooking(null);
    showToast('অফিসিয়াল ইনভয়েস তৈরি এবং কাজ সমাপ্ত হয়েছে!');
    setActiveTab('completed');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawSuccess(false);
      setShowWithdrawModal(false);
      showToast('টাকা পাঠানোর রিকোয়েস্ট সফলভাবে গ্রহণ করা হয়েছে!');
    }, 2000);
  };

  // 1. SAVE PROFILE HANDLER
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = {
      name: nameInput.trim(),
      phone: phoneInput.trim(),
      avatar: avatarInput.trim(),
      primaryArea: areaInput,
      experienceYears: Number(experienceInput),
      workingHours: workingHoursInput.trim(),
      bioBn: bioBnInput.trim(),
      bioEn: bioEnInput.trim(),
      aboutBn: aboutBnInput.trim()
    };
    // Update technician record in AppContext
    updateTechnicianProfile(currentTech.id, updatedProfile);
    // Update auth user in AuthContext so Navbar avatar and details update immediately
    updateProfile({
      name: nameInput.trim(),
      phone: phoneInput.trim(),
      avatar: avatarInput.trim(),
      area: areaInput
    });
    showToast('প্রোফাইল ছবি ও তথ্য সফলভাবে সংরক্ষিত ও আপডেট হয়েছে!');
  };

  // 2. SAVE SKILLS & RATES HANDLER
  const handleSaveSkillsAndRates = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkills.length === 0) {
      alert('কমপক্ষে একটি কাজের দক্ষতা নির্বাচন করুন!');
      return;
    }
    updateTechnicianProfile(currentTech.id, {
      visitingFee: Number(visitingFeeInput),
      startingPrice: Number(startingPriceInput),
      serviceRadiusKm: Number(radiusInput),
      emergencyAvailable: emergencyAvailableInput,
      skills: selectedSkills
    });
    showToast('দক্ষতা ও সার্ভিস রেট কার্ড সফলভাবে সংরক্ষিত হয়েছে!');
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]
    );
  };

  // 3. ADD PORTFOLIO HANDLER
  const handleAddPortfolioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portTitleBn.trim()) return;

    addTechnicianPortfolio(currentTech.id, {
      titleBn: portTitleBn.trim(),
      titleEn: portTitleEn.trim() || portTitleBn.trim(),
      category: portCategory,
      beforeImage: portBeforeImg.trim(),
      afterImage: portAfterImg.trim(),
      descriptionBn: portDescBn.trim() || 'নিখুঁতভাবে মেরামত ও ওয়াশ সম্পন্ন করা হয়েছে।',
      descriptionEn: 'Successfully repaired and tested.',
      completedDate: new Date().toISOString().split('T')[0]
    });

    setShowAddPortfolioModal(false);
    setPortTitleBn('');
    setPortTitleEn('');
    setPortDescBn('');
    showToast('নতুন কাজের ছবি পোর্টফোলিওতে সফলভাবে যোগ করা হয়েছে!');
  };

  const handleDeletePortfolioItem = (itemId: string) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই পোর্টফোলিও ছবিটি মুছে ফেলতে চান?')) {
      deleteTechnicianPortfolio(currentTech.id, itemId);
      showToast('পোর্টফোলিও আইটেম অপসারিত হয়েছে!');
    }
  };

  return (
    <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[3000] px-4 py-3 rounded-2xl bg-zinc-900 text-white text-xs font-bold shadow-2xl border border-orange-500/50 flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Role Switcher Bar */}
      <RoleSwitcherBar />

      {/* Top Banner with Profile & Availability Toggle */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentTech.avatar}
              alt={currentTech.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500 shadow-sm"
            />
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${
              currentTech.availability === 'available' ? 'bg-emerald-500 animate-pulse' : currentTech.availability === 'busy' ? 'bg-amber-500' : 'bg-zinc-500'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-orange-600 dark:text-orange-400 font-extrabold uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded-md">
                {isBangla ? 'পেশাদার টেকনিশিয়ান ড্যাশবোর্ড' : 'Technician Dashboard'}
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isBangla ? 'প্ল্যাটফর্ম ভেরিফায়েড' : 'Verified Pro'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {currentTech.name}
            </h1>
            <p className="text-xs text-zinc-500">
              📍 {currentTech.primaryArea}, ঢাকা · 📞 {currentTech.phone} · ⭐ {currentTech.rating} ({currentTech.reviewCount} reviews) · ৳{currentTech.visitingFee} Visiting Fee
            </p>
          </div>
        </div>

        {/* Availability Switch */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-stone-50 dark:bg-zinc-800/80 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>{isBangla ? 'লাইভ প্রাপ্যতা:' : 'Live Status:'}</span>
          </span>
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => {
                updateTechnicianAvailability(currentTech.id, 'available');
                showToast('আপনার স্ট্যাটাস এখন প্রস্তুত (Ready)');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                currentTech.availability === 'available'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              🟢 {isBangla ? 'প্রস্তুত' : 'Ready'}
            </button>
            <button
              onClick={() => {
                updateTechnicianAvailability(currentTech.id, 'busy');
                showToast('আপনার স্ট্যাটাস এখন কাজে ব্যস্ত (Busy)');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                currentTech.availability === 'busy'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              🟡 {isBangla ? 'ব্যস্ত' : 'Busy'}
            </button>
            <button
              onClick={() => {
                updateTechnicianAvailability(currentTech.id, 'offline');
                showToast('আপনার স্ট্যাটাস এখন অফলাইন (Offline)');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                currentTech.availability === 'offline'
                  ? 'bg-zinc-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              🔴 {isBangla ? 'অফলাইন' : 'Offline'}
            </button>
          </div>
        </div>
      </div>

      {/* High Level Pro Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'নতুন অনুরোধ' : 'Job Requests'}</div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
            {pendingRequests.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">{isBangla ? 'তাৎক্ষণিক রেসপন্স করুন' : 'Needs response'}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'চলমান সার্ভিস' : 'Active Dispatches'}</div>
          <div className="text-2xl font-black text-amber-500">
            {activeJobs.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">{isBangla ? 'কাজ চলছে' : 'In progress'}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'আজকের মোট আয়' : "Today's Earnings"}</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ৳{todayEarnings}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">{isBangla ? '৩টি কাজ সম্পন্ন' : '3 jobs today'}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'চলতি মাসের মোট আয়' : 'Monthly Earnings'}</div>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">
            ৳{monthEarnings}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">
            +২২% বৃদ্ধি
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 sm:gap-6 text-xs font-bold overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>{isBangla ? 'নতুন অনুরোধ' : 'New Requests'} ({pendingRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'active'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{isBangla ? 'চলমান কাজ ও লাইফসাইকেল' : 'Active Jobs'} ({activeJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'completed'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isBangla ? 'সম্পন্ন কাজের হিস্ট্রি' : 'Completed Jobs'} ({completedJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'earnings'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>{isBangla ? 'আয় ও পেমেন্ট হিসেব' : 'Earnings & Payouts'}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{isBangla ? 'প্রোফাইল তথ্য ও বায়ো' : 'Profile & Bio'}</span>
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'skills'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>{isBangla ? 'দক্ষতা ও রেট কার্ড' : 'Skills & Rates'}</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'portfolio'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>{isBangla ? 'কাজের পোর্টফোলিও' : 'Work Portfolio'} ({currentTech.portfolio?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: PENDING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              {isBangla ? 'গ্রাহকদের নিকট থেকে আসা নতুন কাজের রিকোয়েস্ট' : 'Incoming Customer Requests'}
            </h3>
            <span className="text-xs text-orange-600 font-bold font-mono">{pendingRequests.length} pending</span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'বর্তমানে কোনো পেন্ডিং রিকোয়েস্ট নেই' : 'No pending requests right now'}
              </h4>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'আপনার লাইভ স্ট্যাটাস "প্রস্তুত" থাকলে আশেপাশে নতুন কল আসলেই নোটিফিকেশন পাবেন।' : 'Keep your status Ready to receive nearby dispatches.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border-2 border-orange-500/50 shadow-md space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-600 text-white font-mono text-xs font-black">
                        #{req.bookingNumber}
                      </span>
                      <h4 className="font-black text-base text-zinc-900 dark:text-white">
                        {isBangla ? req.serviceNameBn : req.serviceNameEn}
                      </h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      req.urgency === 'emergency' ? 'bg-rose-600 text-white animate-pulse' : 'bg-orange-500/20 text-orange-600'
                    }`}>
                      {req.urgency === 'emergency' ? '⚡ জরুরি (Emergency)' : 'সাধারণ (Today)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2 bg-stone-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                      <div className="font-bold text-zinc-900 dark:text-white">
                        গ্রাহক: {req.customerName}
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <Phone className="w-3.5 h-3.5 text-orange-500" />
                        <a href={`tel:${req.customerPhone}`} className="hover:underline font-bold text-orange-600">{req.customerPhone}</a>
                      </div>
                      <div className="flex items-start gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                        <span>{req.customerAddress}</span>
                      </div>
                    </div>

                    <div className="space-y-2 bg-stone-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 flex flex-col justify-between">
                      <div>
                        <div className="text-zinc-500 font-semibold mb-1">সমস্যার বর্ণনা:</div>
                        <p className="font-medium text-zinc-800 dark:text-zinc-200 italic">
                          "{req.problemDescription}"
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-200 dark:border-zinc-700">
                        <span className="text-zinc-500">প্রত্যাশিত বিল:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          ৳{req.estimatedTotalMin} - ৳{req.estimatedTotalMax}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => updateBookingStatus(req.id, 'CANCELLED', 'Technician unavailable', 'মিস্ত্রি ব্যস্ত থাকার কারণে বাতিল')}
                      className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 cursor-pointer"
                    >
                      {isBangla ? 'বাতিল করুন' : 'Decline'}
                    </button>
                    <button
                      onClick={() => handleStatusAdvance(req.id, 'REQUESTED')}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 cursor-pointer active:scale-95"
                    >
                      {isBangla ? '✅ কাজ গ্রহণ করুন (Accept)' : 'Accept Job'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE JOBS & DISPATCH LIFECYCLE */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              {isBangla ? 'চলমান কাজের অগ্রগতি ও স্ট্যাটাস নিয়ন্ত্রণ' : 'Active Dispatches & Lifecycle'}
            </h3>
            <span className="text-xs text-amber-500 font-bold">{activeJobs.length} in progress</span>
          </div>

          {activeJobs.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <Truck className="w-10 h-10 text-zinc-400 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'বর্তমানে কোনো কাজ চলমান নেই' : 'No active jobs in progress'}
              </h4>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'নতুন অনুরোধ ট্যাব থেকে কাজ গ্রহণ করুন।' : 'Accept a job from the New Requests tab.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job) => {
                const getStepIndex = (status: string) => {
                  switch (status) {
                    case 'ACCEPTED': return 1;
                    case 'ON_THE_WAY': return 2;
                    case 'ARRIVED': return 3;
                    case 'IN_PROGRESS': return 4;
                    case 'COMPLETED': return 5;
                    default: return 0;
                  }
                };
                const currentStep = getStepIndex(job.status);

                return (
                  <div
                    key={job.id}
                    className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <div className="text-xs font-mono font-bold text-orange-600">
                          #{job.bookingNumber} · {job.date}
                        </div>
                        <h4 className="font-black text-base text-zinc-900 dark:text-white mt-0.5">
                          {isBangla ? job.serviceNameBn : job.serviceNameEn}
                        </h4>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>

                    {/* Progress Stepper for Technician */}
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700">
                      <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3">
                        {isBangla ? 'কাজের ধাপ অগ্রগতি:' : 'Job Lifecycle Progress:'}
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
                        <div className={`p-2 rounded-xl border ${currentStep >= 1 ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}>
                          ১. গ্রহণ (Accepted)
                        </div>
                        <div className={`p-2 rounded-xl border ${currentStep >= 2 ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}>
                          ২. রওয়ানা (On Way)
                        </div>
                        <div className={`p-2 rounded-xl border ${currentStep >= 3 ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}>
                          ৩. পৌঁছা (Arrived)
                        </div>
                        <div className={`p-2 rounded-xl border ${currentStep >= 4 ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}>
                          ৪. কাজ চলমান (Working)
                        </div>
                      </div>
                    </div>

                    {/* Customer Info & Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                        <div className="font-bold text-zinc-900 dark:text-white">
                          গ্রাহক: {job.customerName}
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400">
                          ঠিকানা: {job.customerAddress}
                        </div>
                        <a href={`tel:${job.customerPhone}`} className="inline-flex items-center gap-1 text-orange-600 font-bold hover:underline">
                          <Phone className="w-3.5 h-3.5" />
                          <span>কল করুন: {job.customerPhone}</span>
                        </a>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-zinc-700 dark:text-zinc-300">সমস্যা:</div>
                          <p className="text-zinc-600 dark:text-zinc-400 italic">"{job.problemDescription}"</p>
                        </div>
                        <Link to={`/booking/${job.id}`} className="text-orange-600 font-bold mt-2 hover:underline inline-flex items-center gap-1">
                          <span>লাইভ চ্যাট ও গ্রাহক মেসেজ</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Advance Step Action Button */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      {job.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleStatusAdvance(job.id, 'ACCEPTED')}
                          className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Truck className="w-4 h-4" />
                          <span>{isBangla ? 'রওয়ানা হয়েছি (Start Journey)' : 'Start Journey'}</span>
                        </button>
                      )}

                      {job.status === 'ON_THE_WAY' && (
                        <button
                          onClick={() => handleStatusAdvance(job.id, 'ON_THE_WAY')}
                          className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <MapPin className="w-4 h-4" />
                          <span>{isBangla ? 'ঠিকানায় পৌঁছেছি (Mark Arrived)' : 'Mark Arrived'}</span>
                        </button>
                      )}

                      {job.status === 'ARRIVED' && (
                        <button
                          onClick={() => handleStatusAdvance(job.id, 'ARRIVED')}
                          className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <Wrench className="w-4 h-4" />
                          <span>{isBangla ? 'কাজ শুরু করেছি (Start Work)' : 'Start Work'}</span>
                        </button>
                      )}

                      {job.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusAdvance(job.id, 'IN_PROGRESS')}
                          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isBangla ? 'কাজ শেষ ও বিল তৈরি করুন' : 'Complete & Generate Bill'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPLETED JOBS */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              {isBangla ? 'সম্পন্ন হওয়া কাজের বিবরণ ও ইনভয়েস' : 'Completed Jobs History'}
            </h3>
            <span className="text-xs text-zinc-500">{completedJobs.length} {isBangla ? 'টি কাজ সম্পন্ন' : 'jobs'}</span>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {completedJobs.map((job) => (
                <div key={job.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-orange-600">
                        #{job.bookingNumber}
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {isBangla ? job.serviceNameBn : job.serviceNameEn}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      গ্রাহক: {job.customerName} · এলাকা: {job.customerArea} · তারিখ: {job.date}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ৳{job.finalTotal || job.estimatedTotalMax}
                      </div>
                      <div className="text-[10px] text-zinc-400">আদায়কৃত মোট</div>
                    </div>

                    {job.invoice && (
                      <button
                        onClick={() => setViewInvoice(job.invoice!)}
                        className="px-3.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold hover:bg-zinc-100 cursor-pointer"
                      >
                        {isBangla ? 'বিল দেখুন' : 'View Bill'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EARNINGS & PAYOUTS */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-600 to-amber-600 text-white space-y-3 shadow-lg shadow-orange-600/20">
              <div className="text-xs font-bold uppercase tracking-wider opacity-90">
                {isBangla ? 'উত্তোলনযোগ্য ব্যালেন্স' : 'Withdrawable Balance'}
              </div>
              <div className="text-3xl font-black tabular-nums">৳৮,৪৫০</div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="w-full py-2.5 rounded-xl bg-white text-orange-600 font-black text-xs hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
              >
                {isBangla ? 'বিকাশ / নগদে টাকা তুলুন' : 'Request Payout (bKash/Nagad)'}
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="text-xs text-zinc-500 font-bold uppercase">{isBangla ? 'এই সপ্তাহের আয়' : 'This Week'}</div>
              <div className="text-3xl font-black text-emerald-600 tabular-nums">৳{weekEarnings}</div>
              <p className="text-[11px] text-zinc-400">মোট ১০টি সফল কাজ থেকে অর্জিত</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="text-xs text-zinc-500 font-bold uppercase">{isBangla ? 'প্ল্যাটফর্ম কমিশন রেট' : 'Platform Commission'}</div>
              <div className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums">১০%</div>
              <p className="text-[11px] text-emerald-600 font-bold">৯০% সরাসরি টেকনিশিয়ানের আয়</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-sm font-black text-zinc-900 dark:text-white">
              {isBangla ? 'সাম্প্রতিক পেমেন্ট ট্রানজ্যাকশন হিস্ট্রি' : 'Recent Payout History'}
            </h4>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-zinc-900 dark:text-white">বিকাশ ক্যাশআউট (01700-000000)</div>
                  <div className="text-[11px] text-zinc-400">তারিখ: ২৭ সেপ্টেম্বর ২০২৬ · ট্রানজ্যাকশন ID: BK99481</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-600">৳৫,০০০</div>
                  <div className="text-[10px] text-emerald-600 font-bold">সফল (Completed)</div>
                </div>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-zinc-900 dark:text-white">নগদ ওয়ালেট ট্রান্সফার (01700-000000)</div>
                  <div className="text-[11px] text-zinc-400">তারিখ: ২০ সেপ্টেম্বর ২০২৬ · ট্রানজ্যাকশন ID: NG28491</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-600">৳৪,২০০</div>
                  <div className="text-[10px] text-emerald-600 font-bold">সফল (Completed)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE & BIO MANAGEMENT */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-orange-500" />
              <span>{isBangla ? 'টেকনিশিয়ান প্রোফাইল ও ব্যক্তিগত তথ্য ব্যবস্থাপনা' : 'Technician Profile & Personal Info'}</span>
            </h3>
            <p className="text-xs text-zinc-500">
              {isBangla ? 'গ্রাহকদের সামনে আপনার নাম, ছবি, কাজের অভিজ্ঞতা ও যোগাযোগের তথ্য আপডেট করুন।' : 'Update your public name, photo, phone, experience years, and bio.'}
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Direct Device Image Uploader */}
            <ImageUploader
              currentImage={avatarInput}
              onImageChange={setAvatarInput}
              label={isBangla ? 'প্রোফাইল ছবি পরিবর্তন (ডিভাইস থেকে সরাসরি আপলোড করুন):' : 'Profile Photo (Direct Device Upload):'}
              shape="square"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'পূর্ণ নাম:' : 'Full Name:'}
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'মোবাইল নম্বর:' : 'Phone Number:'}
                </label>
                <input
                  type="text"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'প্রধান এলাকা:' : 'Primary Area:'}
                </label>
                <select
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                >
                  <option value="Mirpur">মিরপুর (Mirpur)</option>
                  <option value="Uttara">উত্তরা (Uttara)</option>
                  <option value="Dhanmondi">ধানমন্ডি (Dhanmondi)</option>
                  <option value="Gulshan">গুলশান (Gulshan)</option>
                  <option value="Banani">বনানী (Banani)</option>
                  <option value="Mohammadpur">মোহাম্মদপুর (Mohammadpur)</option>
                  <option value="Badda">বাড্ডা (Badda)</option>
                  <option value="Old Dhaka">পুরান ঢাকা (Old Dhaka)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'অভিজ্ঞতার বছর:' : 'Experience (Years):'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  required
                  value={experienceInput}
                  onChange={(e) => setExperienceInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'কাজের সময়সীমা:' : 'Working Hours:'}
                </label>
                <input
                  type="text"
                  required
                  value={workingHoursInput}
                  onChange={(e) => setWorkingHoursInput(e.target.value)}
                  placeholder="সকাল ৮:০০ - রাত ৯:০০"
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                {isBangla ? 'সংক্ষিপ্ত টাইটেল / বায়ো (বাংলা):' : 'Short Bio (Bengali):'}
              </label>
              <input
                type="text"
                required
                value={bioBnInput}
                onChange={(e) => setBioBnInput(e.target.value)}
                placeholder="এসি ও রেফ্রিজারেশন বিশেষজ্ঞ · ৭+ বছরের অভিজ্ঞতা"
                className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                {isBangla ? 'বিস্তারিত কাজের বর্ণনা ও বিশেষত্ব:' : 'Detailed Description & Specialization:'}
              </label>
              <textarea
                rows={3}
                value={aboutBnInput}
                onChange={(e) => setAboutBnInput(e.target.value)}
                placeholder="আমি ইনভার্টার এসি, কমার্শিয়াল চিলার, ও পাইপলাইন লিকেজের যাবতীয় জটিল সমস্যা ১০০% গ্যারান্টির সাথে সমাধান করে থাকি..."
                className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-medium"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>{isBangla ? 'প্রোফাইল তথ্য সংরক্ষণ করুন' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: SKILLS & RATES */}
      {activeTab === 'skills' && (
        <form onSubmit={handleSaveSkillsAndRates} className="max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" />
              <span>{isBangla ? 'সেবা দক্ষতা ও প্রাথমিক চার্জ সেটিংস' : 'Skills & Service Tariff Settings'}</span>
            </h3>
            <p className="text-xs text-zinc-500">
              {isBangla ? 'আপনার সার্ভিস ক্যাটাগরি, ভিজিটিং ফি ও প্রাথমিক রেট পরিবর্তন করে সংরক্ষণ করুন।' : 'Configure your active skill categories, visiting fees, and hourly rates.'}
            </p>
          </div>

          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'ভিজিটিং ফি (৳):' : 'Visiting Fee (BDT):'}
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  max="2000"
                  value={visitingFeeInput}
                  onChange={(e) => setVisitingFeeInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-black text-sm"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">পরিদর্শন ও ডায়াগনোসিস ফি</span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'ন্যূনতম কাজের প্রারম্ভিক মূল্য (৳):' : 'Starting Service Price:'}
                </label>
                <input
                  type="number"
                  required
                  min="200"
                  max="5000"
                  value={startingPriceInput}
                  onChange={(e) => setStartingPriceInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-black text-sm"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">মিনিমাম কাজের চার্জ</span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'কভারেজ ব্যাসার্ধ (কিমি):' : 'Service Radius (KM):'}
                </label>
                <input
                  type="number"
                  required
                  min="2"
                  max="50"
                  value={radiusInput}
                  onChange={(e) => setRadiusInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-black text-sm"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">বর্তমান অবস্থান থেকে দূরত্ব</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-zinc-900 dark:text-white">
                  {isBangla ? 'জরুরি কল ও নাইট শিফট সেবা প্রদান' : 'Emergency & Night Shift Support'}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {isBangla ? 'জরুরি সেবায় ১.২৫x পর্যন্ত বাড়তি চার্জ যোগ হবে।' : 'Emergency dispatches include 1.25x surge incentive.'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={emergencyAvailableInput}
                onChange={(e) => setEmergencyAvailableInput(e.target.checked)}
                className="w-5 h-5 accent-orange-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
                {isBangla ? 'আপনি যে যে কাজের সেবা প্রদান করেন (দক্ষতা নির্বাচন):' : 'Select Service Skills You Provide:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'ac_repair', label: 'এসি মেরামত ও সার্ভিস', icon: '❄️' },
                  { id: 'plumbing', label: 'প্লাম্বিং ও পাইপ লিকেজ', icon: '🔧' },
                  { id: 'electrical', label: 'ইলেকট্রিক্যাল ও শর্ট সার্কিট', icon: '⚡' },
                  { id: 'appliance', label: 'ফ্রিজ ও ওয়াশিং মেশিন', icon: '🧺' },
                  { id: 'generator', label: 'জেনারেটর ও মোটর', icon: '⚙️' },
                  { id: 'cctv', label: 'সিসিটিভি ও সিকিউরিটি লক', icon: '📹' },
                  { id: 'carpentry', label: 'কাঠমিস্ত্রি ও ফার্নিচার', icon: '🪚' },
                  { id: 'painting', label: 'রংমিস্ত্রি ও দেয়াল ডেকোরেশন', icon: '🎨' },
                  { id: 'water_purifier', label: 'ওয়াটার ফিল্টার ও আরও', icon: '🚰' }
                ].map((skill) => {
                  const isChecked = selectedSkills.includes(skill.id);
                  return (
                    <label
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold ring-1 ring-orange-500/30'
                          : 'border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="accent-orange-600 cursor-pointer"
                      />
                      <span>{skill.icon}</span>
                      <span className="truncate">{skill.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>{isBangla ? 'দক্ষতা ও চার্জ রেট সংরক্ষণ করুন' : 'Save Skills & Tariffs'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 7: WORK PORTFOLIO */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-500" />
                <span>{isBangla ? 'কাজের ছবি ও পোর্টফোলিও শোকেস' : 'Work Portfolio & Showcase'}</span>
              </h3>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'কাজের আগের ও পরের ছবি আপলোড করে গ্রাহকদের আস্থা ও বুকিং দ্বিগুণ করুন।' : 'Showcase your before & after repair photos to get 2x more bookings.'}
              </p>
            </div>
            <button
              onClick={() => setShowAddPortfolioModal(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-md shadow-orange-600/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isBangla ? 'নতুন ছবি যোগ করুন (Add Photo)' : 'Add Photo'}</span>
            </button>
          </div>

          {(!currentTech.portfolio || currentTech.portfolio.length === 0) ? (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <Camera className="w-10 h-10 text-zinc-400 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'কোনো কাজের ছবি এখনও যুক্ত করা হয়নি' : 'No portfolio photos added yet'}
              </h4>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'আপনার সম্পন্ন হওয়া কাজের ছবি আপলোড করতে উপরের বাটনে ক্লিক করুন।' : 'Click Add Photo above to showcase your completed works.'}
              </p>
              <button
                onClick={() => setShowAddPortfolioModal(true)}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs"
              >
                {isBangla ? 'ছবি আপলোড করুন' : 'Upload Photos'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentTech.portfolio.map((item) => (
                <div key={item.id} className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3 relative group">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative overflow-hidden rounded-xl">
                      <img src={item.beforeImage} alt="Before Work" className="w-full h-32 object-cover border border-zinc-200 dark:border-zinc-700" />
                      <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/75 text-white text-[9px] font-black rounded-md">
                        {isBangla ? 'আগে (Before)' : 'Before'}
                      </span>
                    </div>
                    <div className="relative overflow-hidden rounded-xl">
                      <img src={item.afterImage} alt="After Work" className="w-full h-32 object-cover border-2 border-emerald-500" />
                      <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md">
                        {isBangla ? 'পরে (After)' : 'After'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-xs text-zinc-900 dark:text-white">
                        {isBangla ? item.titleBn : item.titleEn}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                        {isBangla ? item.descriptionBn : item.descriptionEn}
                      </p>
                      <div className="text-[10px] text-zinc-400 mt-1">
                        তারিখ: {item.completedDate}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePortfolioItem(item.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD PORTFOLIO MODAL */}
      {showAddPortfolioModal && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-orange-500" />
                <span>{isBangla ? 'কাজের নতুন ছবি পোর্টফোলিওতে যোগ করুন' : 'Add Work Portfolio Photo'}</span>
              </h3>
              <button onClick={() => setShowAddPortfolioModal(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <form onSubmit={handleAddPortfolioSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'কাজের শিরোনাম (বাংলা):' : 'Work Title (Bengali):'}
                </label>
                <input
                  type="text"
                  required
                  value={portTitleBn}
                  onChange={(e) => setPortTitleBn(e.target.value)}
                  placeholder="যেমন: মিরপুর ২ টনের ইনভার্টার এসি জেট ওয়াশ সার্ভিসিং"
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">ক্যাটাগরি:</label>
                  <select
                    value={portCategory}
                    onChange={(e) => setPortCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold"
                  >
                    <option value="ac_repair">এসি সার্ভিসিং</option>
                    <option value="plumbing">প্লাম্বিং ও পাইপ</option>
                    <option value="electrical">ইলেকট্রিক্যাল</option>
                    <option value="appliance">হোম অ্যাপ্লায়েন্স</option>
                    <option value="generator">জেনারেটর</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">কাজের বিবরণ:</label>
                  <input
                    type="text"
                    value={portDescBn}
                    onChange={(e) => setPortDescBn(e.target.value)}
                    placeholder="ধুলো জমে থাকা কয়েল সম্পূর্ণ পরিষ্কার ও গ্যাস লেভেল চেক..."
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ImageUploader
                  currentImage={portBeforeImg}
                  onImageChange={setPortBeforeImg}
                  label="কাজের পূর্বের ছবি (Before Photo):"
                  shape="banner"
                  showPresets={false}
                />
                <ImageUploader
                  currentImage={portAfterImg}
                  onImageChange={setPortAfterImg}
                  label="কাজের পরের ছবি (After Photo):"
                  shape="banner"
                  showPresets={false}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddPortfolioModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 font-bold"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black shadow-md cursor-pointer"
                >
                  {isBangla ? 'ছবি সেভ করুন' : 'Save Work Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      {invoiceModalBooking && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                <FilePlus className="w-4 h-4 text-orange-500" />
                <span>{isBangla ? 'অফিসিয়াল ইনভয়েস ও বিল তৈরি করুন' : 'Generate Final Invoice'}</span>
              </h3>
              <button onClick={() => setInvoiceModalBooking(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              বুকিং: <span className="font-bold text-orange-600 font-mono">#{invoiceModalBooking.bookingNumber}</span> · গ্রাহক: <span className="font-bold">{invoiceModalBooking.customerName}</span>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">ভিজিটিং ফি (ফিক্সড):</label>
                  <input type="number" disabled value={invoiceModalBooking.estimatedVisitingFee || 200} className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 font-bold" />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">লেবার / সার্ভিস চার্জ (৳):</label>
                  <input type="number" required value={labourCostInput} onChange={(e) => setLabourCostInput(Number(e.target.value))} className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">যন্ত্রাংশ খরচ (যদি থাকে):</label>
                  <input type="number" value={partsCostInput} onChange={(e) => setPartsCostInput(Number(e.target.value))} className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold" />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">ছাড় / ডিসকাউন্ট (৳):</label>
                  <input type="number" value={discountInput} onChange={(e) => setDiscountInput(Number(e.target.value))} className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold" />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">পেমেন্ট মেথড:</label>
                <select value={paymentMethodInput} onChange={(e) => setPaymentMethodInput(e.target.value as any)} className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold">
                  <option value="cash">নগদ ক্যাশ (Cash)</option>
                  <option value="bkash">বিকাশ (bKash)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">সর্বমোট বিল:</span>
                <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                  ৳{(invoiceModalBooking.estimatedVisitingFee || 200) + labourCostInput + partsCostInput - discountInput}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setInvoiceModalBooking(null)} className="px-4 py-2 rounded-xl border font-bold">বাতিল</button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md cursor-pointer">ইনভয়েস ইস্যু ও কাজ শেষ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white">উত্তোলন রিকোয়েস্ট</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            {withdrawSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <h4 className="font-bold text-sm">টাকা পাঠানোর রিকোয়েস্ট সফল!</h4>
                <p className="text-xs">১০ মিনিটের মধ্যে আপনার বিকাশ ওয়ালেটে টাকা জমা হবে।</p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">টাকার পরিমাণ (৳):</label>
                  <input type="number" required max={8450} min={500} value={withdrawAmount} onChange={(e) => setWithdrawAmount(Number(e.target.value))} className="w-full p-2.5 rounded-xl border border-zinc-300 font-bold" />
                </div>
                <div>
                  <label className="font-bold block mb-1 text-zinc-700 dark:text-zinc-300">বিকাশ/নগদ পার্সোনাল নম্বর:</label>
                  <input type="text" required defaultValue="01700-000000" className="w-full p-2.5 rounded-xl border border-zinc-300 font-bold" />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-orange-600 text-white font-black shadow-md cursor-pointer">উত্তোলন নিশ্চিত করুন</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {viewInvoice && (
        <InvoiceModal
          invoice={viewInvoice}
          isOpen={!!viewInvoice}
          onClose={() => setViewInvoice(null)}
        />
      )}

    </div>
  );
};
