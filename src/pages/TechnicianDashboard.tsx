import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
  Sparkles,
  MessageSquare,
  Navigation,
  Route as RouteIcon,
  Lock,
  FileCheck2
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { DashboardShell, DashboardNavGroup, DashboardNavItem, DashboardKpiItem } from '../components/common/DashboardShell';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { ChatModal } from '../components/common/ChatModal';
import { ImageUploader } from '../components/common/ImageUploader';
import { ConfettiCelebration } from '../components/common/ConfettiCelebration';
import { TechnicianRouteMap } from '../components/map/TechnicianRouteMap';
import { BANGLADESH_DIVISIONS, BANGLADESH_DISTRICTS, getDistrictsByDivision, findDistrict } from '../data/bangladeshLocations';
import { calculateTechnicianCompletion } from '../utils/profileCompletion';
import { AvailabilityStatus, Booking, Invoice, PortfolioItem, Technician, WarrantyClaim } from '../types';
import { TechnicianPricingSection } from '../components/technician/TechnicianPricingSection';
import { TechnicianWalletSection } from '../components/technician/TechnicianWalletSection';
import { collectCashOnCompletion, fetchWalletDashboard, getStoredAuthToken, submitExtraChargeRequest, updateServerBookingStatus } from '../services/financeApi';
import type { AdditionalChargeRequest } from '../types/finance';

export const TechnicianDashboard: React.FC = () => {
  const {
    bookings,
    technicians,
    categories,
    warranties,
    reviews,
    updateBookingStatus,
    updateWarrantyStatus,
    generateInvoice,
    updateTechnicianAvailability,
    updateTechnicianProfile,
    addTechnicianPortfolio,
    deleteTechnicianPortfolio,
    getUnreadChatCount
  } = useApp();
  const { currentUser, authTokenReady, switchDemoTechnician, updateProfile } = useAuth();
  const { t, isBangla } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Active technician selection (defaults to logged-in user's linked tech or tech-1)
  const matchedUserTech = technicians.find(tech => tech.userId === currentUser?.id);
  const defaultTechId = matchedUserTech?.id || 'tech-1';
  const [selectedTechId, setSelectedTechId] = useState<string>(defaultTechId);
  const currentTech: Technician = technicians.find(tech => tech.id === selectedTechId) || matchedUserTech || technicians[0];
  const [serverPeriodStats, setServerPeriodStats] = useState<{
    todayEarnings: number;
    todayCompletedCount: number;
    weekEarnings: number;
    monthEarnings: number;
    monthCompletedCount: number;
    totalCompletedCount: number;
  } | null>(null);

  const validTabs = ['requests', 'active', 'warranties', 'completed', 'reviews', 'earnings', 'profile', 'skills', 'portfolio'] as const;
  const resolveTabFromLocation = (): typeof validTabs[number] => {
    const tabParam = searchParams.get('tab');
    if (tabParam && validTabs.includes(tabParam as any)) {
      return tabParam as typeof validTabs[number];
    }
    if (location.pathname.endsWith('/earnings')) return 'earnings';
    if (location.pathname.endsWith('/portfolio')) return 'portfolio';
    if (location.pathname.endsWith('/jobs') || location.pathname.endsWith('/messages')) return 'active';
    return 'requests';
  };

  const [activeTab, setActiveTab] = useState<typeof validTabs[number]>(resolveTabFromLocation);
  const [invoiceModalBooking, setInvoiceModalBooking] = useState<Booking | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [chatBookingModal, setChatBookingModal] = useState<Booking | null>(null);
  const [expandedRouteMapIds, setExpandedRouteMapIds] = useState<Record<string, boolean>>({});
  const [fullscreenRouteBooking, setFullscreenRouteBooking] = useState<Booking | null>(null);
  const [warrantyNotesInput, setWarrantyNotesInput] = useState<Record<string, string>>({});
  const [showConfetti, setShowConfetti] = useState(false);

  const completion = calculateTechnicianCompletion(currentTech);
  const isSkillApproved = !!currentTech.skillVerified && completion.isMinReady;

  const isRouteMapOpen = (job: Booking) => {
    if (expandedRouteMapIds[job.id] !== undefined) {
      return expandedRouteMapIds[job.id];
    }
    return job.status === 'ON_THE_WAY';
  };

  const toggleRouteMap = (job: Booking) => {
    const currentlyOpen = isRouteMapOpen(job);
    setExpandedRouteMapIds((prev) => ({
      ...prev,
      [job.id]: !currentlyOpen
    }));
  };

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

  // Extra Charge / Material Cost Request Modal
  const [extraChargeBooking, setExtraChargeBooking] = useState<Booking | null>(null);
  const [extraChargeType, setExtraChargeType] = useState<AdditionalChargeRequest['chargeType']>('EXTRA_WORK');
  const [extraChargeAmount, setExtraChargeAmount] = useState<number>(250);
  const [extraChargeReason, setExtraChargeReason] = useState<string>('');
  const [extraChargeReceipt, setExtraChargeReceipt] = useState<string>('');
  const [extraChargeSubmitting, setExtraChargeSubmitting] = useState<boolean>(false);

  // Profile Form State
  const [nameInput, setNameInput] = useState(currentTech.name);
  const [phoneInput, setPhoneInput] = useState(currentTech.phone);
  const [avatarInput, setAvatarInput] = useState(currentTech.avatar);
  const [divisionInput, setDivisionInput] = useState(currentTech.division || '');
  const [districtInput, setDistrictInput] = useState(currentTech.district || currentTech.city || '');
  const [areaInput, setAreaInput] = useState(currentTech.primaryArea || '');
  const [experienceInput, setExperienceInput] = useState(currentTech.experienceYears);
  const [workingHoursInput, setWorkingHoursInput] = useState(currentTech.workingHours);
  const [bioBnInput, setBioBnInput] = useState(currentTech.bioBn);
  const [bioEnInput, setBioEnInput] = useState(currentTech.bioEn);
  const [aboutBnInput, setAboutBnInput] = useState(currentTech.aboutBn || '');
  const [nidFrontInput, setNidFrontInput] = useState(currentTech.nidFrontImage || '');
  const [nidBackInput, setNidBackInput] = useState(currentTech.nidBackImage || '');

  // Skills & Rates Form State
  const [visitingFeeInput, setVisitingFeeInput] = useState(currentTech.visitingFee || 200);
  const [startingPriceInput, setStartingPriceInput] = useState(currentTech.startingPrice || 350);
  const [radiusInput, setRadiusInput] = useState(currentTech.serviceRadiusKm || 15);
  const [emergencyAvailableInput, setEmergencyAvailableInput] = useState(currentTech.emergencyAvailable ?? true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentTech.skills || []);

  // Add Portfolio Modal State
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [portTitleBn, setPortTitleBn] = useState('');
  const [portTitleEn, setPortTitleEn] = useState('');
  const [portCategory, setPortCategory] = useState('ac_repair');
  const [portBeforeImg, setPortBeforeImg] = useState('https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&auto=format&fit=crop&q=80');
  const [portAfterImg, setPortAfterImg] = useState('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80');
  const [portDescBn, setPortDescBn] = useState('');

  // Auto-select logged-in technician record when user changes
  useEffect(() => {
    const owned = technicians.find(tech => tech.userId === currentUser?.id);
    if (owned) {
      setSelectedTechId(owned.id);
    }
  }, [currentUser?.id, technicians.length]);

  // Fetch strictly per-technician periodStats from backend wallet API once JWT session is ready
  useEffect(() => {
    if (!authTokenReady || !currentUser || !['TECHNICIAN', 'ADMIN'].includes(currentUser.role)) {
      setServerPeriodStats(null);
      return;
    }
    let cancelled = false;
    const targetParam = currentUser.role === 'ADMIN' ? currentTech.id : undefined;
    fetchWalletDashboard(targetParam)
      .then((res) => {
        if (!cancelled) {
          setServerPeriodStats(res.periodStats || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerPeriodStats(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authTokenReady, currentUser?.id, currentUser?.role, currentTech.id, bookings.length]);

  // Sync URL query tab / pathname & enforce verification gate on restricted tabs
  useEffect(() => {
    const param = searchParams.get('tab');
    let nextTab: typeof validTabs[number] | null = null;
    if (param && validTabs.includes(param as any)) {
      nextTab = param as typeof validTabs[number];
    } else if (location.pathname.endsWith('/earnings')) {
      nextTab = 'earnings';
    } else if (location.pathname.endsWith('/portfolio')) {
      nextTab = 'portfolio';
    } else if (location.pathname.endsWith('/jobs') || location.pathname.endsWith('/messages')) {
      nextTab = 'active';
    }

    if (nextTab) {
      if (!isSkillApproved && !['profile', 'skills', 'portfolio'].includes(nextTab)) {
        setActiveTab('profile');
      } else {
        setActiveTab(nextTab);
      }
    } else if (!isSkillApproved && !['profile', 'skills', 'portfolio'].includes(activeTab)) {
      setActiveTab('profile');
    }
  }, [searchParams, location.pathname, isSkillApproved]);

  // Sync inputs when currentTech updates
  useEffect(() => {
    if (currentTech) {
      setNameInput(currentTech.name);
      setPhoneInput(currentTech.phone);
      setAvatarInput(currentTech.avatar);
      setDivisionInput(currentTech.division || '');
      setDistrictInput(currentTech.district || currentTech.city || '');
      setAreaInput(currentTech.primaryArea || '');
      setExperienceInput(currentTech.experienceYears);
      setWorkingHoursInput(currentTech.workingHours);
      setBioBnInput(currentTech.bioBn);
      setBioEnInput(currentTech.bioEn);
      setAboutBnInput(currentTech.aboutBn || '');
      setNidFrontInput(currentTech.nidFrontImage || '');
      setNidBackInput(currentTech.nidBackImage || '');
      setVisitingFeeInput(currentTech.visitingFee || 200);
      setStartingPriceInput(currentTech.startingPrice || 350);
      setRadiusInput(currentTech.serviceRadiusKm || 15);
      setEmergencyAvailableInput(currentTech.emergencyAvailable ?? true);
      setSelectedSkills(currentTech.skills || []);
    }
  }, [currentTech.id]);

  const districtsInDivision = getDistrictsByDivision(divisionInput || undefined);
  const activeDistrictObj = findDistrict(districtInput) || districtsInDivision[0] || BANGLADESH_DISTRICTS[0];
  const areasInDistrict = districtInput ? activeDistrictObj.areas : [];

  // Filter bookings strictly for this technician
  const techBookings = bookings.filter(b => b.technicianId === currentTech.id);
  const pendingRequests = techBookings.filter(b => b.status === 'REQUESTED');
  const activeJobs = techBookings.filter(b => ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(b.status));
  const completedJobs = techBookings.filter(b => b.status === 'COMPLETED');

  // Admin-approved Warranty Claims strictly assigned to this technician
  const techWarranties = warranties.filter(
    w => w.technicianId === currentTech.id && ['APPROVED', 'ACCEPTED', 'ON_THE_WAY', 'RESOLVED'].includes(w.status)
  );
  const pendingTechWarranties = techWarranties.filter(w => w.status === 'APPROVED');
  const activeTechWarranties = techWarranties.filter(w => ['ACCEPTED', 'ON_THE_WAY'].includes(w.status));
  const unreadWarrantyCount = pendingTechWarranties.length + activeTechWarranties.length;

  // Customer feedback / reviews for this technician
  const techReviews = reviews.filter(r => r.technicianId === currentTech.id);

  // Total unread chat messages for active jobs
  const activeJobsUnreadCount = activeJobs.reduce((acc, job) => acc + getUnreadChatCount(job.id, 'TECHNICIAN'), 0);

  // Strictly per-technician earnings calculation (server ledger-derived with local tech-filtered fallback)
  const todayIsoDate = new Date().toISOString().split('T')[0];
  const monthIsoPrefix = todayIsoDate.slice(0, 7);
  const localTodayCompleted = completedJobs.filter(b => b.date === todayIsoDate);
  const localMonthCompleted = completedJobs.filter(b => (b.date || '').startsWith(monthIsoPrefix));
  const localTodayEarnings = localTodayCompleted.reduce((acc, b) => acc + (b.finalTotal || b.estimatedTotalMax || 0), 0);
  const localMonthEarnings = localMonthCompleted.reduce((acc, b) => acc + (b.finalTotal || b.estimatedTotalMax || 0), 0);

  const todayEarnings = serverPeriodStats ? serverPeriodStats.todayEarnings : localTodayEarnings;
  const todayCompletedCount = serverPeriodStats ? serverPeriodStats.todayCompletedCount : localTodayCompleted.length;
  const monthEarnings = serverPeriodStats ? serverPeriodStats.monthEarnings : localMonthEarnings;
  const monthCompletedCount = serverPeriodStats ? serverPeriodStats.monthCompletedCount : localMonthCompleted.length;

  const buildWarrantyBooking = (claim: WarrantyClaim): Booking => {
    const original = bookings.find(b => b.id === claim.bookingId);
    if (original) {
      return {
        ...original,
        id: claim.id,
        bookingNumber: claim.bookingNumber,
        customerName: claim.customerName || original.customerName,
        customerPhone: claim.customerPhone || original.customerPhone,
        customerArea: claim.customerArea || original.customerArea,
        customerAddress: claim.customerAddress || original.customerAddress,
        customerLat: claim.customerLat ?? original.customerLat,
        customerLng: claim.customerLng ?? original.customerLng,
        status: claim.status === 'ON_THE_WAY' ? 'ON_THE_WAY' : 'ACCEPTED'
      };
    }
    return {
      id: claim.id,
      bookingNumber: claim.bookingNumber,
      customerId: claim.customerId,
      customerName: claim.customerName || 'গ্রাহক',
      customerPhone: claim.customerPhone || '01700-000000',
      customerCity: 'Dhaka',
      customerArea: claim.customerArea || 'Dhanmondi',
      customerAddress: claim.customerAddress || 'Dhanmondi, Dhaka',
      customerLat: claim.customerLat,
      customerLng: claim.customerLng,
      technicianId: currentTech.id,
      technicianName: currentTech.name,
      technicianPhone: currentTech.phone,
      technicianAvatar: currentTech.avatar,
      categoryId: 'repair',
      serviceNameEn: claim.serviceName,
      serviceNameBn: claim.serviceName,
      problemDescription: claim.issueDescription,
      mediaUrls: [],
      date: claim.requestDate,
      timeSlot: 'Warranty Re-Service',
      urgency: 'today',
      estimatedVisitingFee: 0,
      estimatedLabourMin: 0,
      estimatedLabourMax: 0,
      estimatedTotalMin: 0,
      estimatedTotalMax: 0,
      status: claim.status === 'ON_THE_WAY' ? 'ON_THE_WAY' : 'ACCEPTED',
      statusHistory: [],
      paymentStatus: 'PAID',
      paymentMethod: 'cash',
      warrantyDays: 7,
      createdAt: claim.requestDate,
      updatedAt: claim.requestDate
    };
  };

  const handleWarrantyAction = (claim: WarrantyClaim, nextStatus: WarrantyClaim['status']) => {
    if (!isSkillApproved) {
      showToast(
        isBangla
          ? 'অ্যাডমিনের "দক্ষতা উত্তীর্ণ" অনুমোদন না পাওয়া পর্যন্ত কাজ পিক করা যাবে না।'
          : 'You cannot pick jobs until Admin approves your Skill Test.'
      );
      return;
    }
    const customNote = (warrantyNotesInput[claim.id] || '').trim();
    if (nextStatus === 'ACCEPTED') {
      updateWarrantyStatus(
        claim.id,
        'ACCEPTED',
        isBangla ? 'টেকনিশিয়ান ওয়ারেন্টি ক্লেইম পিক করেছেন।' : 'Technician picked up the warranty claim.'
      );
      setExpandedRouteMapIds(prev => ({ ...prev, [claim.id]: true }));
      showToast(
        isBangla
          ? `ওয়ারেন্টি কাজ #${claim.bookingNumber} পিক করা হয়েছে!`
          : `Warranty job #${claim.bookingNumber} picked!`
      );
    } else if (nextStatus === 'ON_THE_WAY') {
      updateWarrantyStatus(
        claim.id,
        'ON_THE_WAY',
        isBangla ? 'টেকনিশিয়ান গ্রাহকের ঠিকানায় রওনা হয়েছেন।' : 'Technician is on the way to the customer.'
      );
      setExpandedRouteMapIds(prev => ({ ...prev, [claim.id]: true }));
      showToast(
        isBangla
          ? 'রওনা শুরু! ম্যাপ অনুসরণ করে গ্রাহকের বাসায় পৌঁছে ফ্রি ওয়ারেন্টি সার্ভিস দিন।'
          : 'Journey started! Follow the map to reach the customer for free warranty service.'
      );
    } else if (nextStatus === 'RESOLVED') {
      updateWarrantyStatus(
        claim.id,
        'RESOLVED',
        customNote ||
          (isBangla
            ? 'সমস্যা পরীক্ষা করে ফ্রি ওয়ারেন্টি সার্ভিসিং সফলভাবে সম্পন্ন করা হয়েছে।'
            : 'Issue inspected and free warranty servicing completed successfully.')
      );
      showToast(
        isBangla
          ? `ওয়ারেন্টি সার্ভিস #${claim.bookingNumber} সম্পন্ন হিসেবে মার্ক করা হয়েছে!`
          : `Warranty service #${claim.bookingNumber} marked as resolved!`
      );
    }
  };

  const handleStatusAdvance = (bookingId: string, currentStatus: string) => {
    if (!isSkillApproved) {
      showToast(
        isBangla
          ? 'আগে বায়োডাটা সম্পূর্ণ (৯০%–১০০%) করে অ্যাডমিনের "দক্ষতা উত্তীর্ণ" অনুমোদন নিন!'
          : 'Complete your biodata (90%–100%) and get Admin Skill Approval first!'
      );
      return;
    }
    switch (currentStatus) {
      case 'REQUESTED':
        updateBookingStatus(bookingId, 'ACCEPTED', 'Technician accepted the job', 'মিস্ত্রি কাজ গ্রহণ করেছেন');
        setExpandedRouteMapIds((prev) => ({ ...prev, [bookingId]: true }));
        setActiveTab('active');
        showToast(
          isBangla
            ? 'কাজটি গ্রহণ করা হয়েছে! গ্রাহকের লোকেশন ম্যাপে দেখুন।'
            : 'Job accepted! View the customer location on the map.'
        );
        break;
      case 'ACCEPTED':
        updateBookingStatus(bookingId, 'ON_THE_WAY', 'Technician is on the way to address', 'মিস্ত্রি ঠিকানার উদ্দেশ্যে রওনা হয়েছেন');
        setExpandedRouteMapIds((prev) => ({ ...prev, [bookingId]: true }));
        showToast(
          isBangla
            ? 'রওনা শুরু! হলুদ-কমলা সংক্ষিপ্ত পথ অনুসরণ করে গ্রাহকের ঠিকানায় যান।'
            : 'Journey started! Follow the shortest highlighted route to the customer address.'
        );
        break;
      case 'ON_THE_WAY':
        updateBookingStatus(bookingId, 'ARRIVED', 'Technician arrived at location', 'মিস্ত্রি ঠিকানায় পৌঁছে গেছেন');
        showToast(isBangla ? 'স্ট্যাটাস: ঠিকানায় পৌঁছে গেছেন' : 'Status: Arrived at customer location');
        break;
      case 'ARRIVED':
        updateBookingStatus(bookingId, 'IN_PROGRESS', 'Work started by technician', 'কাজ শুরু হয়েছে');
        showToast(isBangla ? 'স্ট্যাটাস: সার্ভিস কাজ শুরু হয়েছে' : 'Status: Service work started');
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
      paymentStatus: paymentMethodInput === 'cash' ? 'CASH_ON_SERVICE' : 'PAID'
    });

    if (paymentMethodInput === 'cash' && getStoredAuthToken()) {
      void collectCashOnCompletion(invoiceModalBooking.id).catch(() => {});
    } else if (getStoredAuthToken()) {
      void updateServerBookingStatus(
        invoiceModalBooking.id,
        'COMPLETED',
        'Invoice generated and job completed',
        'ইনভয়েস তৈরি ও কাজ সম্পন্ন হয়েছে'
      ).catch(() => {});
    }

    setInvoiceModalBooking(null);
    showToast(isBangla ? 'অফিসিয়াল ইনভয়েস তৈরি এবং কাজ সমাপ্ত হয়েছে!' : 'Official invoice generated & job completed!');
    setActiveTab('completed');
  };

  const handleSubmitExtraCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraChargeBooking) return;
    setExtraChargeSubmitting(true);
    try {
      await submitExtraChargeRequest(extraChargeBooking.id, {
        chargeType: extraChargeType,
        amount: extraChargeAmount,
        reason: extraChargeReason.trim(),
        receiptNote: extraChargeReceipt.trim() || undefined,
      });
      setExtraChargeBooking(null);
      setExtraChargeReason('');
      setExtraChargeReceipt('');
      showToast(
        isBangla
          ? 'অতিরিক্ত কাজ/মালামাল চার্জ গ্রাহকের অনুমোদনের জন্য পাঠানো হয়েছে!'
          : 'Extra work/material charge request sent for customer approval!'
      );
    } catch (err: any) {
      showToast(err?.message || (isBangla ? 'অতিরিক্ত চার্জ পাঠানো যায়নি।' : 'Failed to send extra charge request.'));
    } finally {
      setExtraChargeSubmitting(false);
    }
  };

  const handleTechDivisionChange = (newDiv: string) => {
    setDivisionInput(newDiv);
    if (!newDiv) {
      setDistrictInput('');
      setAreaInput('');
      return;
    }
    const divDistricts = getDistrictsByDivision(newDiv);
    if (divDistricts.length > 0) {
      setDistrictInput(divDistricts[0].nameEn);
      setAreaInput(divDistricts[0].areas[0]?.nameEn || divDistricts[0].nameEn);
    }
  };

  const handleTechDistrictChange = (newDist: string) => {
    setDistrictInput(newDist);
    if (!newDist) {
      setAreaInput('');
      return;
    }
    const distObj = findDistrict(newDist);
    if (distObj) {
      setAreaInput(distObj.areas[0]?.nameEn || distObj.nameEn);
    }
  };

  // 1. SAVE PROFILE HANDLER
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const distObj = findDistrict(districtInput);
    const updatedProfile = {
      name: nameInput.trim(),
      phone: phoneInput.trim(),
      avatar: avatarInput.trim(),
      division: divisionInput,
      district: districtInput,
      city: districtInput,
      primaryArea: areaInput,
      latitude: distObj ? distObj.lat : currentTech.latitude,
      longitude: distObj ? distObj.lng : currentTech.longitude,
      experienceYears: Number(experienceInput),
      workingHours: workingHoursInput.trim(),
      bioBn: bioBnInput.trim(),
      bioEn: bioEnInput.trim() || bioBnInput.trim(),
      aboutBn: aboutBnInput.trim(),
      nidFrontImage: nidFrontInput.trim(),
      nidBackImage: nidBackInput.trim()
    };
    // Update technician record in AppContext
    updateTechnicianProfile(currentTech.id, updatedProfile);
    // Update auth user in AuthContext if this technician belongs to currentUser
    if (currentUser?.id === currentTech.userId) {
      updateProfile({
        name: nameInput.trim(),
        phone: phoneInput.trim(),
        avatar: avatarInput.trim(),
        division: divisionInput,
        district: districtInput,
        city: districtInput,
        area: areaInput
      });
    }

    const nextComp = calculateTechnicianCompletion({ ...currentTech, ...updatedProfile });
    if (nextComp.isComplete) {
      setShowConfetti(true);
      showToast(
        isBangla
          ? 'অভিনন্দন! আপনার বায়োডাটা ১০০% সম্পূর্ণ হয়েছে — অ্যাডমিন যাচাই করে "দক্ষতা উত্তীর্ণ" অনুমোদন দেবেন।'
          : 'Congratulations! Your biodata is 100% complete — Admin will verify and approve your Skill Test.'
      );
    } else {
      showToast(
        isBangla
          ? `প্রোফাইল সংরক্ষিত হয়েছে (${nextComp.percent}% সম্পূর্ণ)`
          : `Profile saved (${nextComp.percent}% complete)`
      );
    }
  };

  // 2. SAVE SKILLS & RATES HANDLER
  const handleSaveSkillsAndRates = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkills.length === 0) {
      showToast(isBangla ? 'কমপক্ষে একটি কাজের দক্ষতা নির্বাচন করুন!' : 'Please select at least one service skill!');
      return;
    }
    const updatedSkillsPayload = {
      visitingFee: Number(visitingFeeInput),
      startingPrice: Number(startingPriceInput),
      serviceRadiusKm: Number(radiusInput),
      emergencyAvailable: emergencyAvailableInput,
      skills: selectedSkills
    };
    updateTechnicianProfile(currentTech.id, updatedSkillsPayload);
    const nextComp = calculateTechnicianCompletion({ ...currentTech, ...updatedSkillsPayload });
    if (nextComp.isComplete) {
      setShowConfetti(true);
      showToast(
        isBangla
          ? 'অভিনন্দন! আপনার প্রোফাইল ও দক্ষতা ১০০% সম্পূর্ণ হয়েছে!'
          : 'Congratulations! Your profile & skills are 100% complete!'
      );
    } else {
      showToast(
        isBangla
          ? `দক্ষতা ও সার্ভিস রেট সংরক্ষিত হয়েছে! (মোট বায়োডাটা ${nextComp.percent}%)`
          : `Skills & service tariffs saved! (Profile ${nextComp.percent}% complete)`
      );
    }
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
      descriptionEn: portDescBn.trim() || 'Successfully repaired and tested.',
      completedDate: new Date().toISOString().split('T')[0]
    });

    setShowAddPortfolioModal(false);
    setPortTitleBn('');
    setPortTitleEn('');
    setPortDescBn('');
    showToast(isBangla ? 'নতুন কাজের ছবি পোর্টফোলিওতে সফলভাবে যোগ করা হয়েছে!' : 'Work portfolio photo added successfully!');
  };

  const handleDeletePortfolioItem = (itemId: string) => {
    deleteTechnicianPortfolio(currentTech.id, itemId);
    showToast(isBangla ? 'পোর্টফোলিও আইটেম অপসারিত হয়েছে!' : 'Portfolio item removed!');
  };

  const techNavGroups: DashboardNavGroup[] = [
    {
      id: 'dispatch',
      label: isBangla ? 'কাজ ও ডিসপ্যাচ' : 'Job Dispatch',
      items: [
        {
          id: 'requests',
          label: isBangla ? 'নতুন অনুরোধ' : 'New Requests',
          icon: <Bell className="w-4 h-4" />,
          count: pendingRequests.length,
          highlightCount: pendingRequests.length > 0,
          locked: !isSkillApproved
        },
        {
          id: 'active',
          label: isBangla ? 'চলমান কাজ ও ম্যাপ' : 'Active Jobs',
          icon: <Truck className="w-4 h-4" />,
          count: activeJobsUnreadCount > 0 ? `${activeJobs.length} · ${activeJobsUnreadCount}` : activeJobs.length,
          highlightCount: activeJobsUnreadCount > 0,
          locked: !isSkillApproved
        },
        {
          id: 'warranties',
          label: isBangla ? 'ওয়ারেন্টি ক্লেইম' : 'Warranty Claims',
          icon: <ShieldCheck className="w-4 h-4" />,
          count: techWarranties.length,
          highlightCount: unreadWarrantyCount > 0,
          locked: !isSkillApproved
        },
        {
          id: 'completed',
          label: isBangla ? 'সম্পন্ন কাজের হিস্ট্রি' : 'Completed Jobs',
          icon: <CheckCircle2 className="w-4 h-4" />,
          count: completedJobs.length,
          locked: !isSkillApproved
        }
      ]
    },
    {
      id: 'finance',
      label: isBangla ? 'আয় ও মূল্যায়ন' : 'Earnings & Reviews',
      items: [
        {
          id: 'earnings',
          label: isBangla ? 'আয় ও পেমেন্ট হিসাব' : 'Earnings & Payouts',
          icon: <DollarSign className="w-4 h-4" />,
          locked: !isSkillApproved
        },
        {
          id: 'reviews',
          label: isBangla ? 'গ্রাহক ফিডব্যাক' : 'Customer Reviews',
          icon: <Star className="w-4 h-4" />,
          count: techReviews.length,
          locked: !isSkillApproved
        }
      ]
    },
    {
      id: 'setup',
      label: isBangla ? 'প্রোফাইল ও সেটআপ' : 'Biodata & Setup',
      items: [
        {
          id: 'profile',
          label: isBangla ? 'প্রোফাইল, বায়ো ও NID' : 'Profile, Bio & NID',
          icon: <User className="w-4 h-4" />,
          count: `${completion.percent}%`,
          highlightCount: !completion.isComplete
        },
        {
          id: 'skills',
          label: isBangla ? 'দক্ষতা ও রেট কার্ড' : 'Skills & Rates',
          icon: <Wrench className="w-4 h-4" />
        },
        {
          id: 'portfolio',
          label: isBangla ? 'কাজের পোর্টফোলিও' : 'Work Portfolio',
          icon: <Camera className="w-4 h-4" />,
          count: currentTech.portfolio?.length || 0
        }
      ]
    }
  ];

  const techSectionMeta: Record<typeof activeTab, { title: string; subtitle: string }> = {
    requests: {
      title: isBangla ? 'নতুন কাজের অনুরোধ' : 'Incoming Job Requests',
      subtitle: isBangla
        ? 'গ্রাহকদের কাছ থেকে আসা নতুন কলগুলো পর্যালোচনা করে গ্রহণ করুন।'
        : 'Review incoming service requests, inspect customer routes, and accept jobs.'
    },
    active: {
      title: isBangla ? 'চলমান কাজ ও লাইভ ডিসপ্যাচ' : 'Active Jobs & Dispatch',
      subtitle: isBangla
        ? 'কাজের ধাপ আপডেট, গ্রাহকের সাথে চ্যাট, ম্যাপ রুট এবং চূড়ান্ত বিল তৈরি করুন।'
        : 'Advance job status, navigate customer routes, chat, and generate invoices.'
    },
    warranties: {
      title: isBangla ? 'অনুমোদিত ওয়ারেন্টি ক্লেইম' : 'Assigned Warranty Claims',
      subtitle: isBangla
        ? 'অ্যাডমিন অনুমোদিত ফ্রি ওয়ারেন্টি রি-সার্ভিস কাজগুলো পিক ও সমাধান করুন।'
        : 'Pick and resolve admin-approved free warranty re-service claims.'
    },
    completed: {
      title: isBangla ? 'সম্পন্ন কাজের হিস্ট্রি' : 'Completed Jobs History',
      subtitle: isBangla
        ? 'আপনার সম্পন্ন করা সকল কাজের রেকর্ড এবং ইস্যুকৃত ইনভয়েস দেখুন।'
        : 'Browse completed dispatches and review itemized client invoices.'
    },
    reviews: {
      title: isBangla ? 'গ্রাহক রিভিউ ও মূল্যায়ন' : 'Customer Reviews & Ratings',
      subtitle: isBangla
        ? 'গ্রাহকদের প্রদত্ত রেটিং ও মতামত পর্যালোচনা করুন।'
        : 'Track service ratings and verified feedback from your customers.'
    },
    earnings: {
      title: isBangla ? 'আয়, ওয়ালেট ও পেমেন্ট হিসাব' : 'Earnings, Wallet & Payouts',
      subtitle: isBangla
        ? 'আপনার নিজস্ব মোট আয়, উত্তোলনযোগ্য ব্যালেন্স, নগদ জমা ও উইথড্রয়াল হিসাব।'
        : 'Your personal earnings ledger, withdrawable balance, cash reconciliation, and payouts.'
    },
    profile: {
      title: isBangla ? 'প্রোফাইল, বায়োডাটা ও NID যাচাই' : 'Profile, Biodata & NID Verification',
      subtitle: isBangla
        ? 'অ্যাডমিনের দক্ষতা অনুমোদনের জন্য বায়োডাটা, ঠিকানা ও NID ছবি সম্পূর্ণ করুন।'
        : 'Complete your biodata, coverage area, and NID photos for Admin verification.'
    },
    skills: {
      title: isBangla ? 'দক্ষতা, সার্ভিস ও রেট কার্ড' : 'Skills, Services & Tariffs',
      subtitle: isBangla
        ? 'ভিজিটিং ফি, কভারেজ ব্যাসার্ধ ও আপনার নির্ধারিত সার্ভিস তালিকা ম্যানেজ করুন।'
        : 'Configure your service catalog tariffs, visiting fees, and coverage radius.'
    },
    portfolio: {
      title: isBangla ? 'কাজের পোর্টফোলিও শোকেস' : 'Work Portfolio Showcase',
      subtitle: isBangla
        ? 'কাজের আগের ও পরের ছবি যুক্ত করে গ্রাহকদের আস্থা বাড়ান।'
        : 'Upload before-and-after repair photos to highlight your craftsmanship.'
    }
  };

  const techKpis: DashboardKpiItem[] = [
    {
      id: 'requests',
      label: isBangla ? 'নতুন অনুরোধ' : 'Job Requests',
      value: pendingRequests.length,
      sublabel: isBangla ? 'তাৎক্ষণিক রেসপন্স প্রয়োজন' : 'Needs response',
      accent: 'orange'
    },
    {
      id: 'active',
      label: isBangla ? 'চলমান সার্ভিস' : 'Active Dispatches',
      value: activeJobs.length,
      sublabel: isBangla ? 'কাজ চলছে' : 'In progress',
      accent: 'amber'
    },
    {
      id: 'today-earnings',
      label: isBangla ? 'আজকের নিট আয়' : "Today's Net Earnings",
      value: `৳${todayEarnings.toLocaleString()}`,
      sublabel: isBangla ? `${todayCompletedCount}টি কাজ আজ সম্পন্ন` : `${todayCompletedCount} jobs today`,
      accent: 'emerald'
    },
    {
      id: 'month-earnings',
      label: isBangla ? 'চলতি মাসের নিট আয়' : 'Monthly Net Earnings',
      value: `৳${monthEarnings.toLocaleString()}`,
      sublabel: isBangla ? `${monthCompletedCount}টি কাজ এই মাসে` : `${monthCompletedCount} jobs this month`,
      accent: 'neutral'
    }
  ];

  const handleNavSelect = (id: string, item: DashboardNavItem) => {
    if (item.locked) {
      showToast(
        isBangla
          ? 'আগে ৯০%–১০০% বায়োডাটা ও NID আপলোড সম্পূর্ণ করুন এবং অ্যাডমিনের "দক্ষতা উত্তীর্ণ" অনুমোদনের জন্য অপেক্ষা করুন।'
          : 'Complete 90%–100% biodata & NID upload and wait for Admin Skill Approval first.'
      );
      return;
    }
    setActiveTab(id as typeof activeTab);
  };

  const techSidebarSwitcher = (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        {isBangla ? 'সক্রিয় টেকনিশিয়ান অ্যাকাউন্ট' : 'Active Technician Profile'}
      </label>
      <select
        value={currentTech.id}
        onChange={(e) => {
          const nextId = e.target.value;
          setSelectedTechId(nextId);
          setServerPeriodStats(null);
          const targetTech = technicians.find(tech => tech.id === nextId);
          if (targetTech && currentUser?.role !== 'ADMIN') {
            switchDemoTechnician(targetTech);
          }
        }}
        className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
      >
        {technicians.map(tech => {
          const techWarCount = tech.id === currentTech.id
            ? warranties.filter(
                w => w.technicianId === tech.id && ['APPROVED', 'ACCEPTED', 'ON_THE_WAY'].includes(w.status)
              ).length
            : 0;
          return (
            <option key={tech.id} value={tech.id} className="bg-white dark:bg-zinc-900">
              {tech.name}{techWarCount > 0 ? ` (${techWarCount} warranty)` : ''}
            </option>
          );
        })}
      </select>
    </div>
  );

  const techBanners = (
    <div className="space-y-3 sm:space-y-4">
      {(!isSkillApproved || !completion.isComplete || searchParams.get('onboarding') === '1') && (
        <div
          className={`p-3.5 sm:p-5 rounded-2xl border space-y-2.5 sm:space-y-3 ${
            isSkillApproved && completion.isComplete
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/40'
              : 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-500/40'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {!isSkillApproved ? (
                  <Lock className="w-4 h-4 text-orange-600 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {isSkillApproved
                    ? isBangla
                      ? 'আপনার বায়োডাটা ও দক্ষতা অনুমোদিত!'
                      : 'Profile & Skill Test Approved!'
                    : isBangla
                    ? 'বায়োডাটা ও NID সম্পূর্ণ করুন (কাজ পিক করার জন্য আবশ্যক)'
                    : 'Complete Biodata & Wait for Admin Skill Approval'}
                </h2>
                <span
                  className={`text-xs font-extrabold tabular-nums ${
                    completion.isComplete
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : completion.isMinReady
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }`}
                >
                  · {completion.percent}% {isBangla ? 'সম্পূর্ণ' : 'Complete'}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {!completion.isMinReady
                  ? isBangla
                    ? `কাজ পিক করা ও ওয়েবসাইটের সকল ফিচার ব্যবহারের আগে কমপক্ষে ৯০%–১০০% বায়োডাটা এবং NID কার্ডের উভয় পাশের ছবি আপলোড করুন (${completion.completedCount}/${completion.totalCount} ধাপ সম্পন্ন)।`
                    : `Complete at least 90%–100% of your biodata and upload both sides of your NID card before accepting jobs (${completion.completedCount}/${completion.totalCount} steps done).`
                  : !currentTech.skillVerified
                  ? isBangla
                    ? 'দারুণ! আপনার বায়োডাটা ও NID জমা হয়েছে। এখন অ্যাডমিন আপনার তথ্য যাচাই করে "দক্ষতা উত্তীর্ণ" অনুমোদন দিলেই সব মেনু ব্যবহার করতে পারবেন।'
                    : 'Your biodata & NID have been submitted. Once Admin approves your Skill Test, all dispatch tabs unlock.'
                  : isBangla
                  ? 'আপনার সম্পূর্ণ বায়োডাটা ১০০% সম্পন্ন করতে বাকি অংশগুলো যুক্ত করে সেভ করুন।'
                  : 'Fill in remaining details to reach 100% completion.'}
              </p>
              {(isBangla ? completion.missingLabelsBn : completion.missingLabelsEn).length > 0 && (
                <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 pt-0.5">
                  {isBangla ? 'বাকি তথ্য:' : 'Missing:'}{' '}
                  {(isBangla ? completion.missingLabelsBn : completion.missingLabelsEn).join(' · ')}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                {isBangla ? 'বায়োডাটা ও NID পূরণ করুন' : 'Edit Biodata & NID'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('skills')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer hover:border-orange-500 whitespace-nowrap"
              >
                {isBangla ? 'দক্ষতা ও রেট সেট করুন' : 'Set Skills & Rates'}
              </button>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completion.isComplete ? 'bg-emerald-500' : 'bg-orange-600'
              }`}
              style={{ width: `${completion.percent}%` }}
            />
          </div>
        </div>
      )}

      {pendingTechWarranties.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-blue-500">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <div className="font-bold text-xs sm:text-sm">
                {isBangla
                  ? `অ্যাডমিন-অনুমোদিত ${pendingTechWarranties.length}টি ওয়ারেন্টি ক্লেইম আপনার কাছে পাঠানো হয়েছে`
                  : `${pendingTechWarranties.length} Admin-Approved Warranty Claim(s) assigned to you`}
              </div>
              <p className="text-[11px] opacity-90">
                {isBangla
                  ? 'এটি ফ্রি ওয়ারেন্টি রি-সার্ভিস কাজ। ওয়ারেন্টি ক্লেইম অপশন থেকে কাজটি পিক করুন।'
                  : 'Open Warranty Claims from the left menu to pick up and resolve.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('warranties')}
            className="px-4 py-2 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-stone-100 cursor-pointer shrink-0 whitespace-nowrap self-start sm:self-auto"
          >
            {isBangla ? 'ওয়ারেন্টি ক্লেইম দেখুন' : 'View Claims'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-[3000] px-4 py-3 rounded-2xl bg-zinc-900 text-white text-xs font-bold shadow-2xl border border-orange-500/50 flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <DashboardShell
        portalLabel={isBangla ? 'টেকনিশিয়ান পোর্টাল' : 'Technician Portal'}
        userName={currentTech.name}
        userMeta={`${currentTech.primaryArea ? `${currentTech.primaryArea}, ` : ''}${currentTech.district || currentTech.city || (isBangla ? 'বাংলাদেশ' : 'Bangladesh')} · ★ ${currentTech.rating}`}
        userAvatar={currentTech.avatar}
        verifiedLabel={isSkillApproved ? (isBangla ? 'দক্ষতা উত্তীর্ণ' : 'Skill Verified') : (isBangla ? 'অনুমোদন বাকি' : 'Pending Approval')}
        isVerified={isSkillApproved}
        sidebarTopSlot={techSidebarSwitcher}
        navGroups={techNavGroups}
        activeTab={activeTab}
        onSelectTab={handleNavSelect}
        activeSectionTitle={techSectionMeta[activeTab].title}
        activeSectionSubtitle={techSectionMeta[activeTab].subtitle}
        kpis={techKpis}
        banners={techBanners}
        mobileStickyTopSlot={
          activeJobs.length > 0 ? (
            <div className="flex items-center justify-between gap-2 text-xs py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping shrink-0" />
                <div className="min-w-0">
                  <span className="font-extrabold text-zinc-900 dark:text-white truncate text-[11px] block">
                    {isBangla ? activeJobs[0].serviceNameBn : activeJobs[0].serviceNameEn}
                  </span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono truncate block">
                    #{activeJobs[0].bookingNumber} · {activeJobs[0].customerArea}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-orange-600 text-white font-bold text-[10px] whitespace-nowrap shrink-0">
                {activeJobs[0].status}
              </span>
            </div>
          ) : undefined
        }
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Availability Segmented Control */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (!isSkillApproved) {
                    showToast(
                      isBangla
                        ? 'দক্ষতা উত্তীর্ণ হওয়ার আগে লাইভ স্ট্যাটাস চালু করা যাবে না।'
                        : 'Live status cannot be enabled before Skill Test approval.'
                    );
                    return;
                  }
                  updateTechnicianAvailability(currentTech.id, 'available');
                  showToast(isBangla ? 'আপনার স্ট্যাটাস এখন প্রস্তুত (Ready)' : 'Your status is now Ready');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !isSkillApproved
                    ? 'opacity-50 cursor-not-allowed text-zinc-500'
                    : currentTech.availability === 'available'
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {isBangla ? 'প্রস্তুত' : 'Ready'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isSkillApproved) {
                    showToast(
                      isBangla
                        ? 'দক্ষতা উত্তীর্ণ হওয়ার আগে স্ট্যাটাস পরিবর্তন করা যাবে না।'
                        : 'Status cannot be changed before Skill Test approval.'
                    );
                    return;
                  }
                  updateTechnicianAvailability(currentTech.id, 'busy');
                  showToast(isBangla ? 'আপনার স্ট্যাটাস এখন কাজে ব্যস্ত (Busy)' : 'Your status is now Busy');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !isSkillApproved
                    ? 'opacity-50 cursor-not-allowed text-zinc-500'
                    : currentTech.availability === 'busy'
                    ? 'bg-amber-500 text-white'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {isBangla ? 'ব্যস্ত' : 'Busy'}
              </button>
              <button
                type="button"
                onClick={() => {
                  updateTechnicianAvailability(currentTech.id, 'offline');
                  showToast(isBangla ? 'আপনার স্ট্যাটাস এখন অফলাইন (Offline)' : 'Your status is now Offline');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  currentTech.availability === 'offline'
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {isBangla ? 'অফলাইন' : 'Offline'}
              </button>
            </div>
          </div>
        }
      >

      {/* TAB 1: PENDING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              {isBangla ? 'গ্রাহকদের নিকট থেকে আসা নতুন কাজের রিকোয়েস্ট' : 'Incoming Customer Requests'}
            </h3>
            <span className="text-xs text-orange-600 font-bold font-mono">
              {pendingRequests.length} {isBangla ? 'টি অপেক্ষমাণ' : 'pending'}
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-7 sm:p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'বর্তমানে কোনো পেন্ডিং রিকোয়েস্ট নেই' : 'No pending requests right now'}
              </h4>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'আপনার লাইভ স্ট্যাটাস "প্রস্তুত" থাকলে আশেপাশে নতুন কল আসলেই নোটিফিকেশন পাবেন।' : 'Keep your status Ready to receive nearby dispatches.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 sm:p-5 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border-2 border-orange-500/50 shadow-md space-y-3 sm:space-y-4"
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
                      {req.urgency === 'emergency'
                        ? isBangla
                          ? '⚡ জরুরি (Emergency)'
                          : '⚡ Emergency'
                        : isBangla
                        ? 'সাধারণ (Today)'
                        : 'Standard (Today)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2 bg-stone-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
                      <div className="font-bold text-zinc-900 dark:text-white">
                        {isBangla ? 'গ্রাহক:' : 'Customer:'} {req.customerName}
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
                        <div className="text-zinc-500 font-semibold mb-1">
                          {isBangla ? 'সমস্যার বর্ণনা:' : 'Problem Description:'}
                        </div>
                        <p className="font-medium text-zinc-800 dark:text-zinc-200 italic">
                          "{req.problemDescription}"
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-200 dark:border-zinc-700">
                        <span className="text-zinc-500">{isBangla ? 'প্রত্যাশিত বিল:' : 'Estimated Bill:'}</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          ৳{req.estimatedTotalMin} - ৳{req.estimatedTotalMax}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isRouteMapOpen(req) && (
                    <div className="pt-1 animate-in fade-in duration-200">
                      <TechnicianRouteMap
                        booking={req}
                        technician={currentTech}
                        height="300px"
                        compact
                        onExpandModal={() => setFullscreenRouteBooking(req)}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => toggleRouteMap(req)}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border transition-colors ${
                        isRouteMapOpen(req)
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>
                        {isRouteMapOpen(req)
                          ? (isBangla ? 'ম্যাপ লুকান' : 'Hide Map')
                          : (isBangla ? 'ম্যাপে গ্রাহকের লোকেশন ও রুট দেখুন' : 'View Customer Route on Map')}
                      </span>
                    </button>

                    <div className="flex items-center gap-2 ml-auto">
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
            <span className="text-xs text-amber-500 font-bold">
              {activeJobs.length} {isBangla ? 'টি চলমান' : 'in progress'}
            </span>
          </div>

          {/* High-Visibility Message Alert Banner */}
          {activeJobsUnreadCount > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white font-bold text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-orange-600/30 border border-orange-400">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
                <MessageSquare className="w-5 h-5 shrink-0 fill-current" />
                <div>
                  <span className="font-black block sm:inline">
                    {isBangla ? `কাস্টমারের নিকট থেকে ${activeJobsUnreadCount}টি নতুন মেসেজ এসেছে!` : `${activeJobsUnreadCount} new unread message(s) from customer!`}
                  </span>
                  <span className="text-xs font-normal opacity-90 block sm:inline sm:ml-2">
                    {isBangla ? 'কাজের স্থান বা পৌঁছানোর সময় সমন্বয়ের জন্য নিচে কার্ড থেকে উত্তর দিন।' : 'Reply below from job cards.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeJobs.length === 0 ? (
            <div className="p-7 sm:p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
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
                    className="p-3.5 sm:p-5 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3.5 sm:space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <div className="text-xs font-mono font-bold text-orange-600">
                          #{job.bookingNumber} · {job.date}
                        </div>
                        <h4 className="font-black text-sm sm:text-base text-zinc-900 dark:text-white mt-0.5">
                          {isBangla ? job.serviceNameBn : job.serviceNameEn}
                        </h4>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>

                    {/* Progress Stepper for Technician */}
                    <div className="p-3 sm:p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700">
                      <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2.5 sm:mb-3">
                        {isBangla ? 'কাজের ধাপ অগ্রগতি:' : 'Job Lifecycle Progress:'}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-bold">
                        <div className={`p-2 rounded-xl border ${currentStep >= 1 ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}>
                          {isBangla ? '১. গ্রহণ' : '1. Accepted'}
                        </div>
                        <div className={`p-2 rounded-xl border ${currentStep >= 2 ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}>
                          {isBangla ? '২. রওয়ানা' : '2. On Way'}
                        </div>
                        <div className={`p-2 rounded-xl border ${currentStep >= 3 ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}>
                          {isBangla ? '৩. পৌঁছা' : '3. Arrived'}
                        </div>
                        <div className={`p-2 rounded-xl border ${currentStep >= 4 ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'}`}>
                          {isBangla ? '৪. কাজ চলমান' : '4. Working'}
                        </div>
                      </div>
                    </div>

                    {/* Customer Info & Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                        <div className="font-bold text-zinc-900 dark:text-white">
                          {isBangla ? 'গ্রাহক:' : 'Customer:'} {job.customerName}
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400">
                          {isBangla ? 'ঠিকানা:' : 'Address:'} {job.customerAddress}
                        </div>
                        <a href={`tel:${job.customerPhone}`} className="inline-flex items-center gap-1 text-orange-600 font-bold hover:underline">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{isBangla ? 'কল করুন:' : 'Call:'} {job.customerPhone}</span>
                        </a>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-zinc-700 dark:text-zinc-300">
                            {isBangla ? 'সমস্যা:' : 'Issue:'}
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-400 italic">"{job.problemDescription}"</p>
                        </div>
                        <Link to={`/booking/${job.id}`} className="text-orange-600 font-bold mt-2 hover:underline inline-flex items-center gap-1">
                          <span>{isBangla ? 'লাইভ চ্যাট ও গ্রাহক মেসেজ' : 'Live Chat & Customer Messages'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Technician-Only Live Customer Route & Shortest Path Navigation Map */}
                    {isRouteMapOpen(job) && (
                      <div className="animate-in fade-in duration-200">
                        <TechnicianRouteMap
                          booking={job}
                          technician={currentTech}
                          height="340px"
                          onExpandModal={() => setFullscreenRouteBooking(job)}
                        />
                      </div>
                    )}

                    {/* Advance Step Action Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Toggle Customer Location & Shortest Route Map */}
                        <button
                          type="button"
                          onClick={() => toggleRouteMap(job)}
                          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isRouteMapOpen(job)
                              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-500 shadow-md shadow-amber-500/20'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-100'
                          }`}
                        >
                          <RouteIcon className="w-4 h-4" />
                          <span>
                            {isRouteMapOpen(job)
                              ? (isBangla ? 'রুট ম্যাপ বন্ধ করুন' : 'Hide Route Map')
                              : (isBangla ? 'গ্রাহকের লোকেশন ও রুট ম্যাপ' : 'Customer Route Map')}
                          </span>
                        </button>

                        {/* Direct Chat with Customer */}
                        {(() => {
                          const unreadCount = getUnreadChatCount(job.id, 'TECHNICIAN');
                          return (
                            <button
                              type="button"
                              onClick={() => setChatBookingModal(job)}
                              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                                unreadCount > 0
                                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 animate-pulse'
                                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-500/30 hover:bg-orange-100'
                              }`}
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>{isBangla ? 'কাস্টমারকে মেসেজ দিন' : 'Message Customer'}</span>
                              {unreadCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-white text-orange-600 text-[10px] font-black">
                                  {unreadCount}
                                </span>
                              )}
                            </button>
                          );
                        })()}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {['ARRIVED', 'IN_PROGRESS'].includes(job.status) && (
                          <button
                            type="button"
                            onClick={() => setExtraChargeBooking(job)}
                            className="px-4 py-2.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 font-extrabold text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{isBangla ? 'অতিরিক্ত কাজ / মালামাল চার্জ যোগ' : 'Request Extra / Material Charge'}</span>
                          </button>
                        )}

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
                            <span>{isBangla ? 'বিল প্রস্তুত ও কাজ সম্পন্ন' : 'Generate Bill'}</span>
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

      {/* TAB: WARRANTY CLAIMS (ADMIN APPROVED -> ASSIGNED TECHNICIAN) */}
      {activeTab === 'warranties' && (
        <div className="space-y-4">
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600/10 via-indigo-500/5 to-orange-500/10 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{isBangla ? 'ওয়ারেন্টি ক্লেইম কাজসমূহ (অ্যাডমিন অনুমোদিত)' : 'Approved Warranty Claim Jobs'}</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {isBangla
                  ? 'আপনার পূর্বের সম্পন্ন করা যেসব কাজে গ্রাহক ওয়ারেন্টি ক্লেইম করেছেন এবং অ্যাডমিন অনুমোদন দিয়েছেন — সেগুলো এখান থেকে পিক করে গ্রাহকের বাসায় ফ্রি সার্ভিস দিন।'
                  : 'Warranty claims approved by Admin for your previous jobs appear here. Pick the warranty job and navigate to resolve.'}
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs shrink-0 self-start">
              🛡️ {isBangla ? 'ফ্রি ওয়ারেন্টি সার্ভিস (৳০ ফি)' : 'Free Warranty Service (৳0 Fee)'}
            </span>
          </div>

          {techWarranties.length === 0 ? (
            <div className="p-7 sm:p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <ShieldCheck className="w-10 h-10 text-zinc-400 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'বর্তমানে আপনার কোনো অনুমোদিত ওয়ারেন্টি ক্লেইম নেই' : 'No approved warranty claims for you right now'}
              </h4>
              <p className="text-xs text-zinc-500">
                {isBangla
                  ? 'কোনো গ্রাহক আপনার কাজের ওপর ওয়ারেন্টি ক্লেইম করলে অ্যাডমিনের অনুমোদনের পর তা সরাসরি এখানে চলে আসবে।'
                  : 'Once an admin approves a customer warranty claim for your job, it will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {techWarranties.map((w) => {
                const relatedBooking = bookings.find(b => b.id === w.bookingId);
                const warrantyAsBooking = buildWarrantyBooking(w);
                const isMapExpanded =
                  expandedRouteMapIds[w.id] !== undefined
                    ? expandedRouteMapIds[w.id]
                    : w.status === 'ACCEPTED' || w.status === 'ON_THE_WAY';

                const stepNumber =
                  w.status === 'APPROVED' ? 1 :
                  w.status === 'ACCEPTED' ? 2 :
                  w.status === 'ON_THE_WAY' ? 3 : 4;

                const statusTextMap: Record<WarrantyClaim['status'], string> = {
                  REQUESTED: isBangla ? 'অনুমোদনের অপেক্ষায়' : 'Pending Approval',
                  APPROVED: isBangla ? 'অ্যাডমিন অনুমোদিত · পিক করার অপেক্ষায়' : 'Admin Approved · Awaiting Pickup',
                  ACCEPTED: isBangla ? 'আপনি পিক করেছেন (Picked)' : 'Picked by You',
                  ON_THE_WAY: isBangla ? 'গ্রাহকের বাসায় রওনা হয়েছেন' : 'On the Way to Customer',
                  RESOLVED: isBangla ? 'ওয়ারেন্টি সার্ভিস সম্পন্ন' : 'Warranty Service Resolved',
                  REJECTED: isBangla ? 'প্রত্যাখ্যাত' : 'Rejected',
                };

                const statusColorMap: Record<WarrantyClaim['status'], string> = {
                  REQUESTED: 'bg-amber-500/15 text-amber-600',
                  APPROVED: 'bg-blue-600 text-white',
                  ACCEPTED: 'bg-indigo-600 text-white',
                  ON_THE_WAY: 'bg-orange-600 text-white',
                  RESOLVED: 'bg-emerald-600 text-white',
                  REJECTED: 'bg-rose-600 text-white'
                };

                return (
                  <div
                    key={w.id}
                    className={`p-3.5 sm:p-5 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-sm space-y-3.5 sm:space-y-5 border-2 ${
                      w.status === 'APPROVED'
                        ? 'border-blue-500/70'
                        : w.status === 'RESOLVED'
                        ? 'border-emerald-500/40'
                        : 'border-orange-500/60'
                    }`}
                  >
                    {/* Header with clear "ওয়ারেন্টি ক্লেইম" / "Warranty Claim" identity */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-black flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isBangla ? 'ওয়ারেন্টি ক্লেইম' : 'Warranty Claim'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono font-black text-xs">
                          #{w.id}
                        </span>
                        <span className="font-mono font-bold text-[11px] text-zinc-500">
                          ({isBangla ? `সার্ভিস: #${w.bookingNumber}` : `Booking: #${w.bookingNumber}`})
                        </span>
                        <h4 className="font-black text-base text-zinc-900 dark:text-white">
                          {w.serviceName}
                        </h4>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black self-start sm:self-auto ${statusColorMap[w.status]}`}>
                        {statusTextMap[w.status]}
                      </span>
                    </div>

                    {/* 4-Step Warranty Stepper */}
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] font-bold">
                        <div className={`p-2 rounded-xl border ${stepNumber >= 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-zinc-900 text-zinc-400'}`}>
                          {isBangla ? '১. অ্যাডমিন অনুমোদন' : '1. Admin Approved'}
                        </div>
                        <div className={`p-2 rounded-xl border ${stepNumber >= 2 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-zinc-900 text-zinc-400'}`}>
                          {isBangla ? '২. কাজ পিক (Picked)' : '2. Job Picked'}
                        </div>
                        <div className={`p-2 rounded-xl border ${stepNumber >= 3 ? 'bg-orange-600 text-white border-orange-600' : 'bg-white dark:bg-zinc-900 text-zinc-400'}`}>
                          {isBangla ? '৩. বাসায় রওনা (On Way)' : '3. On the Way'}
                        </div>
                        <div className={`p-2 rounded-xl border ${stepNumber >= 4 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-zinc-900 text-zinc-400'}`}>
                          {isBangla ? '৪. সার্ভিস সম্পন্ন' : '4. Resolved'}
                        </div>
                      </div>
                    </div>

                    {/* Customer & Problem Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                        <div className="text-[11px] font-bold text-zinc-400 uppercase">
                          {isBangla ? 'গ্রাহকের তথ্য ও লোকেশন' : 'Customer Info & Location'}
                        </div>
                        <div className="font-black text-zinc-900 dark:text-white">
                          {warrantyAsBooking.customerName}
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-300 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                          <span>{warrantyAsBooking.customerAddress} ({warrantyAsBooking.customerArea})</span>
                        </div>
                        <a
                          href={`tel:${warrantyAsBooking.customerPhone}`}
                          className="inline-flex items-center gap-1 text-orange-600 font-bold hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{isBangla ? 'কল করুন:' : 'Call:'} {warrantyAsBooking.customerPhone}</span>
                        </a>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                        <div>
                          <div className="font-bold text-zinc-700 dark:text-zinc-300 mb-0.5">
                            {isBangla ? 'গ্রাহকের পুনরাবৃত্ত সমস্যা:' : 'Customer Recurring Issue:'}
                          </div>
                          <p className="text-zinc-700 dark:text-zinc-200 italic">"{w.issueDescription}"</p>
                        </div>
                        {w.adminNote && (
                          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                            🛡️ {isBangla ? 'অ্যাডমিন নোট:' : 'Admin Note:'} {w.adminNote}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Technician Route Map for Warranty Visit */}
                    {isMapExpanded && w.status !== 'RESOLVED' && (
                      <div className="animate-in fade-in duration-200">
                        <TechnicianRouteMap
                          booking={warrantyAsBooking}
                          technician={currentTech}
                          height="320px"
                          onExpandModal={() => setFullscreenRouteBooking(warrantyAsBooking)}
                        />
                      </div>
                    )}

                    {/* Optional Technician Resolution Note when ON_THE_WAY */}
                    {w.status === 'ON_THE_WAY' && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2 text-xs">
                        <label className="font-bold text-emerald-800 dark:text-emerald-300 block">
                          {isBangla
                            ? 'সমাধানের নোট (গ্রাহক ও অ্যাডমিন দেখতে পাবেন):'
                            : 'Resolution Note (Visible to Customer & Admin):'}
                        </label>
                        <input
                          type="text"
                          value={warrantyNotesInput[w.id] ?? ''}
                          onChange={(e) => setWarrantyNotesInput(prev => ({ ...prev, [w.id]: e.target.value }))}
                          placeholder={
                            isBangla
                              ? 'যেমন: পাইপের জয়েন্ট নতুন করে সিল করে দেওয়া হয়েছে এবং সম্পূর্ণ লিকেজমুক্ত।'
                              : 'e.g., Re-sealed the pipe joint and verified zero leakage.'
                          }
                          className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-zinc-900"
                        />
                      </div>
                    )}

                    {w.status === 'RESOLVED' && w.technicianNote && (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                        ✔️ {isBangla ? 'সম্পন্ন নোট' : 'Resolution Note'} ({w.resolvedDate}): {w.technicianNote}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center gap-2">
                        {w.status !== 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() => setExpandedRouteMapIds(prev => ({ ...prev, [w.id]: !isMapExpanded }))}
                            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border transition-colors ${
                              isMapExpanded
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-500/40'
                            }`}
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>
                              {isMapExpanded
                                ? isBangla
                                  ? 'রুট ম্যাপ লুকান'
                                  : 'Hide Route Map'
                                : isBangla
                                ? 'গ্রাহকের লোকেশন ও রুট দেখুন'
                                : 'View Customer Route'}
                            </span>
                          </button>
                        )}

                        {relatedBooking && (
                          <button
                            type="button"
                            onClick={() => setChatBookingModal(relatedBooking)}
                            className="px-3.5 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-orange-100"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{isBangla ? 'গ্রাহককে মেসেজ দিন' : 'Message Customer'}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {w.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleWarrantyAction(w, 'ACCEPTED')}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isBangla ? '✅ ওয়ারেন্টি কাজ পিক করুন (Pick Warranty Job)' : 'Pick Warranty Job'}</span>
                          </button>
                        )}

                        {w.status === 'ACCEPTED' && (
                          <button
                            type="button"
                            onClick={() => handleWarrantyAction(w, 'ON_THE_WAY')}
                            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <Truck className="w-4 h-4" />
                            <span>{isBangla ? '🚚 গ্রাহকের বাসায় রওনা হোন (Start Journey)' : 'Start Warranty Journey'}</span>
                          </button>
                        )}

                        {w.status === 'ON_THE_WAY' && (
                          <button
                            type="button"
                            onClick={() => handleWarrantyAction(w, 'RESOLVED')}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>{isBangla ? '✔️ ওয়ারেন্টি সার্ভিস সম্পন্ন করুন' : 'Mark Warranty Resolved'}</span>
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
                      {isBangla ? 'গ্রাহক:' : 'Customer:'} {job.customerName} · {isBangla ? 'এলাকা:' : 'Area:'}{' '}
                      {job.customerArea} · {isBangla ? 'তারিখ:' : 'Date:'} {job.date}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ৳{job.finalTotal || job.estimatedTotalMax}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {isBangla ? 'আদায়কৃত মোট' : 'Total Collected'}
                      </div>
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

      {/* TAB: CUSTOMER REVIEWS & FEEDBACK RECEIVED */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
            <div>
              <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-current shrink-0" />
                <span>{isBangla ? 'গ্রাহকদের দেওয়া রিভিউ ও ফিডব্যাক' : 'Customer Reviews & Ratings'}</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isBangla ? 'আপনার সম্পন্ন হওয়া কাজের ওপর গ্রাহকদের সরাসরি মূল্যায়ন ও মতামত।' : 'Verified customer ratings and feedback for your completed work.'}
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 self-start sm:self-auto">
              <div className="text-xl sm:text-2xl font-black text-amber-500 tabular-nums">★ {currentTech.rating}</div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                <div className="font-bold">{isBangla ? 'গড় রেটিং' : 'Avg Rating'}</div>
                <div>
                  {currentTech.reviewCount}
                  {isBangla ? 'টি মোট রিভিউ' : ' total reviews'}
                </div>
              </div>
            </div>
          </div>

          {techReviews.length === 0 ? (
            <div className="p-7 sm:p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <Star className="w-10 h-10 text-zinc-400 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'এখনও কোনো নতুন গ্রাহক ফিডব্যাক জমা পড়েনি' : 'No written reviews yet'}
              </h4>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'গ্রাহকরা কাজ শেষে বা ওয়ারেন্টি সমাধানের পর ফিডব্যাক দিলে এখানে প্রদর্শিত হবে।' : 'Customer feedback will appear here once submitted.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {techReviews.map((rev) => (
                <div key={rev.id} className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img src={rev.customerAvatar} alt={rev.customerName} className="w-10 h-10 rounded-full object-cover border border-orange-500/30" />
                      <div>
                        <div className="font-black text-xs text-zinc-900 dark:text-white">{rev.customerName}</div>
                        <div className="text-[11px] text-zinc-400">{rev.serviceName} · {rev.createdAt}</div>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{rev.overallRating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-stone-50 dark:bg-zinc-800/70 p-3 rounded-2xl italic border border-zinc-200 dark:border-zinc-700/60">
                    "{rev.comment}"
                  </p>

                  {rev.feedbackTags && rev.feedbackTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rev.feedbackTags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center text-[10px] text-zinc-500">
                    <div>
                      {isBangla ? 'মান:' : 'Quality:'}{' '}
                      <span className="font-black text-zinc-800 dark:text-zinc-200">{rev.workQuality}★</span>
                    </div>
                    <div>
                      {isBangla ? 'আচরণ:' : 'Behavior:'}{' '}
                      <span className="font-black text-zinc-800 dark:text-zinc-200">{rev.behavior}★</span>
                    </div>
                    <div>
                      {isBangla ? 'সময়:' : 'Time:'}{' '}
                      <span className="font-black text-zinc-800 dark:text-zinc-200">{rev.punctuality}★</span>
                    </div>
                    <div>
                      {isBangla ? 'মূল্য:' : 'Price:'}{' '}
                      <span className="font-black text-zinc-800 dark:text-zinc-200">{rev.priceFairness}★</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EARNINGS, WALLET, RESERVE & CASH DEPOSITS */}
      {activeTab === 'earnings' && (
        <TechnicianWalletSection technicianId={currentTech.id} />
      )}

      {/* TAB 5: PROFILE, BIODATA & NID VERIFICATION MANAGEMENT */}
      {activeTab === 'profile' && (
        <form id="profile-section" onSubmit={handleSaveProfile} className="max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 space-y-4 sm:space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-500" />
                <span>{isBangla ? 'টেকনিশিয়ান বায়োডাটা, ঠিকানা ও NID আপলোড' : 'Technician Biodata, Location & NID Verification'}</span>
              </h3>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'সারা বাংলাদেশের আপনার বিভাগ/জেলা/এলাকা, প্রোফাইল ছবি ও NID কার্ডের ছবি যুক্ত করুন।' : 'Complete your Bangladesh location, bio, and NID front/back photos for Admin approval.'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-xl text-xs font-black tabular-nums self-start ${
              completion.isComplete ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30' : 'bg-orange-500/15 text-orange-600 border border-orange-500/30'
            }`}>
              {completion.percent}% {isBangla ? 'সম্পূর্ণ' : 'Complete'}
            </span>
          </div>

          <div className="space-y-5 text-xs">
            {/* Direct Device Image Uploader */}
            <ImageUploader
              currentImage={avatarInput}
              onImageChange={setAvatarInput}
              label={isBangla ? 'নিজস্ব প্রোফাইল ছবি (ডিভাইস থেকে সরাসরি আপলোড করুন):' : 'Profile Photo (Direct Device Upload):'}
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

            {/* All-Bangladesh Division / District / Area Cascading Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'বিভাগ (Division):' : 'Division:'}
                </label>
                <select
                  required
                  value={divisionInput}
                  onChange={(e) => handleTechDivisionChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
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
                  value={districtInput}
                  onChange={(e) => handleTechDistrictChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
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
                  {isBangla ? 'প্রধান এলাকা / উপজেলা:' : 'Primary Area / Upazila:'}
                </label>
                <select
                  required
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'অভিজ্ঞতার বছর:' : 'Experience (Years):'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  required
                  value={experienceInput || ''}
                  onChange={(e) => setExperienceInput(Number(e.target.value))}
                  placeholder={isBangla ? 'যেমন: ৩' : 'e.g. 3'}
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
                  placeholder={isBangla ? 'সকাল ৮:০০ - রাত ৯:০০' : '8:00 AM - 9:00 PM'}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                {isBangla ? 'সংক্ষিপ্ত টাইটেল / বায়ো (বাংলা):' : 'Short Title / Bio:'}
              </label>
              <input
                type="text"
                required
                value={bioBnInput}
                onChange={(e) => setBioBnInput(e.target.value)}
                placeholder={
                  isBangla
                    ? 'এসি ও রেফ্রিজারেশন বিশেষজ্ঞ · ৭+ বছরের অভিজ্ঞতা'
                    : 'AC & Refrigeration Specialist · 7+ years experience'
                }
                className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                {isBangla ? 'বিস্তারিত কাজের বর্ণনা ও বিশেষত্ব:' : 'Detailed Description & Specialization:'}
              </label>
              <textarea
                rows={3}
                required
                value={aboutBnInput}
                onChange={(e) => setAboutBnInput(e.target.value)}
                placeholder={
                  isBangla
                    ? 'আমি ইনভার্টার এসি, কমার্শিয়াল চিলার, ও পাইপলাইন লিকেজের যাবতীয় জটিল সমস্যা ১০০% গ্যারান্টির সাথে সমাধান করে থাকি...'
                    : 'I specialize in inverter AC servicing, commercial chillers, and leak repair with 100% guarantee...'
                }
                className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-medium"
              />
            </div>

            {/* Mandatory NID Front & Back Photo Uploaders */}
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-orange-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-black text-zinc-900 dark:text-white text-xs sm:text-sm">
                  <FileCheck2 className="w-4 h-4 text-orange-500" />
                  <span>{isBangla ? 'জাতীয় পরিচয়পত্র (NID) সামনের ও পেছনের ছবি (বাধ্যতামূলক)' : 'National ID (NID) Front & Back Photos (Required)'}</span>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full self-start ${
                  nidFrontInput && nidBackInput ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                }`}>
                  {nidFrontInput && nidBackInput
                    ? isBangla
                      ? '✓ উভয় অংশ আপলোড সম্পন্ন'
                      : '✓ Both Sides Uploaded'
                    : isBangla
                    ? '২টি ছবিই প্রয়োজন'
                    : 'Both photos required'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUploader
                  currentImage={nidFrontInput}
                  onImageChange={setNidFrontInput}
                  onRemove={() => setNidFrontInput('')}
                  label={isBangla ? 'NID সামনের অংশ (Front Page Photo):' : 'NID Front Photo:'}
                  shape="banner"
                  showPresets={false}
                />
                <ImageUploader
                  currentImage={nidBackInput}
                  onImageChange={setNidBackInput}
                  onRemove={() => setNidBackInput('')}
                  label={isBangla ? 'NID পেছনের অংশ (Back Page Photo):' : 'NID Back Photo:'}
                  shape="banner"
                  showPresets={false}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>{isBangla ? 'বায়োডাটা ও NID তথ্য সংরক্ষণ করুন' : 'Save Biodata & NID'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('skills')}
                className="px-5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs hover:border-orange-500 cursor-pointer"
              >
                {isBangla ? 'পরবর্তী: দক্ষতা ও রেট কার্ড →' : 'Next: Skills & Rates →'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 6: SKILLS & ADMIN-GOVERNED SERVICE PRICING */}
      {activeTab === 'skills' && (
        <div className="space-y-4 sm:space-y-6">
          <TechnicianPricingSection technicianId={currentTech.id} />
          <form onSubmit={handleSaveSkillsAndRates} className="max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 space-y-4 sm:space-y-6 shadow-sm">
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
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  {isBangla ? 'পরিদর্শন ও ডায়াগনোসিস ফি' : 'Inspection & diagnosis fee'}
                </span>
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
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  {isBangla ? 'মিনিমাম কাজের চার্জ' : 'Minimum base service charge'}
                </span>
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
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  {isBangla ? 'বর্তমান অবস্থান থেকে দূরত্ব' : 'Distance from current location'}
                </span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                {[
                  { id: 'ac_repair', labelBn: 'এসি মেরামত ও সার্ভিস', labelEn: 'AC Repair & Servicing', icon: '❄️' },
                  { id: 'plumbing', labelBn: 'প্লাম্বিং ও পাইপ লিকেজ', labelEn: 'Plumbing & Pipe Leak', icon: '🔧' },
                  { id: 'electrical', labelBn: 'ইলেকট্রিক্যাল ও শর্ট সার্কিট', labelEn: 'Electrical & Wiring', icon: '⚡' },
                  { id: 'appliance', labelBn: 'ফ্রিজ ও ওয়াশিং মেশিন', labelEn: 'Fridge & Washing Machine', icon: '🧺' },
                  { id: 'generator', labelBn: 'জেনারেটর ও মোটর', labelEn: 'Generator & Motor', icon: '⚙️' },
                  { id: 'cctv', labelBn: 'সিসিটিভি ও সিকিউরিটি লক', labelEn: 'CCTV & Security Lock', icon: '📹' },
                  { id: 'carpentry', labelBn: 'কাঠমিস্ত্রি ও ফার্নিচার', labelEn: 'Carpentry & Furniture', icon: '🪚' },
                  { id: 'painting', labelBn: 'রংমিস্ত্রি ও দেয়াল ডেকোরেশন', labelEn: 'Painting & Wall Decor', icon: '🎨' },
                  { id: 'water_purifier', labelBn: 'ওয়াটার ফিল্টার ও আরও', labelEn: 'Water Purifier & RO', icon: '🚰' }
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
                      <span className="truncate">{isBangla ? skill.labelBn : skill.labelEn}</span>
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
        </div>
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
            <div className="p-7 sm:p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
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
                        {isBangla ? 'তারিখ:' : 'Date:'} {item.completedDate}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePortfolioItem(item.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
                      title={isBangla ? 'মুছে ফেলুন' : 'Delete'}
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
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
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
                  {isBangla ? 'কাজের শিরোনাম:' : 'Work Title:'}
                </label>
                <input
                  type="text"
                  required
                  value={portTitleBn}
                  onChange={(e) => setPortTitleBn(e.target.value)}
                  placeholder={
                    isBangla
                      ? 'যেমন: মিরপুর ২ টনের ইনভার্টার এসি জেট ওয়াশ সার্ভিসিং'
                      : 'e.g., Mirpur 2-Ton Inverter AC Jet Wash Servicing'
                  }
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    {isBangla ? 'ক্যাটাগরি:' : 'Category:'}
                  </label>
                  <select
                    value={portCategory}
                    onChange={(e) => setPortCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold"
                  >
                    <option value="ac_repair">{isBangla ? 'এসি সার্ভিসিং' : 'AC Servicing'}</option>
                    <option value="plumbing">{isBangla ? 'প্লাম্বিং ও পাইপ' : 'Plumbing & Pipe'}</option>
                    <option value="electrical">{isBangla ? 'ইলেকট্রিক্যাল' : 'Electrical'}</option>
                    <option value="appliance">{isBangla ? 'হোম অ্যাপ্লায়েন্স' : 'Home Appliance'}</option>
                    <option value="generator">{isBangla ? 'জেনারেটর' : 'Generator'}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    {isBangla ? 'কাজের বিবরণ:' : 'Work Description:'}
                  </label>
                  <input
                    type="text"
                    value={portDescBn}
                    onChange={(e) => setPortDescBn(e.target.value)}
                    placeholder={
                      isBangla
                        ? 'ধুলো জমে থাকা কয়েল সম্পূর্ণ পরিষ্কার ও গ্যাস লেভেল চেক...'
                        : 'Full coil jet cleaning and refrigerant pressure check...'
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ImageUploader
                  currentImage={portBeforeImg}
                  onImageChange={setPortBeforeImg}
                  label={isBangla ? 'কাজের পূর্বের ছবি (Before Photo):' : 'Before Work Photo:'}
                  shape="banner"
                  showPresets={false}
                />
                <ImageUploader
                  currentImage={portAfterImg}
                  onImageChange={setPortAfterImg}
                  label={isBangla ? 'কাজের পরের ছবি (After Photo):' : 'After Work Photo:'}
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
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                <FilePlus className="w-4 h-4 text-orange-500" />
                <span>{isBangla ? 'অফিসিয়াল ইনভয়েস ও বিল তৈরি করুন' : 'Generate Final Invoice'}</span>
              </h3>
              <button onClick={() => setInvoiceModalBooking(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {isBangla ? 'বুকিং:' : 'Booking:'}{' '}
              <span className="font-bold text-orange-600 font-mono">#{invoiceModalBooking.bookingNumber}</span> ·{' '}
              {isBangla ? 'গ্রাহক:' : 'Customer:'} <span className="font-bold">{invoiceModalBooking.customerName}</span>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    {isBangla ? 'ভিজিটিং ফি (ফিক্সড):' : 'Visiting Fee (Fixed):'}
                  </label>
                  <input type="number" disabled value={invoiceModalBooking.estimatedVisitingFee || 200} className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 font-bold" />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    {isBangla ? 'লেবার / সার্ভিস চার্জ (৳):' : 'Labour / Service Charge (৳):'}
                  </label>
                  <input type="number" required value={labourCostInput} onChange={(e) => setLabourCostInput(Number(e.target.value))} className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    {isBangla ? 'যন্ত্রাংশ খরচ (যদি থাকে):' : 'Spare Parts Cost (Optional):'}
                  </label>
                  <input type="number" value={partsCostInput} onChange={(e) => setPartsCostInput(Number(e.target.value))} className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold" />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    {isBangla ? 'ছাড় / ডিসকাউন্ট (৳):' : 'Discount (৳):'}
                  </label>
                  <input type="number" value={discountInput} onChange={(e) => setDiscountInput(Number(e.target.value))} className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold" />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'পেমেন্ট মেথড:' : 'Payment Method:'}
                </label>
                <select value={paymentMethodInput} onChange={(e) => setPaymentMethodInput(e.target.value as any)} className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold">
                  <option value="cash">{isBangla ? 'নগদ ক্যাশ (Cash)' : 'Cash on Completion'}</option>
                  <option value="bkash">{isBangla ? 'বিকাশ (bKash)' : 'bKash'}</option>
                  <option value="nagad">{isBangla ? 'নগদ (Nagad)' : 'Nagad'}</option>
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  {isBangla ? 'সর্বমোট বিল:' : 'Total Invoice Amount:'}
                </span>
                <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                  ৳{(invoiceModalBooking.estimatedVisitingFee || 200) + labourCostInput + partsCostInput - discountInput}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setInvoiceModalBooking(null)} className="px-4 py-2 rounded-xl border font-bold">
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md cursor-pointer">
                  {isBangla ? 'ইনভয়েস ইস্যু ও কাজ শেষ করুন' : 'Issue Invoice & Complete Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extra Work / Material Cost Request Modal */}
      {extraChargeBooking && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'অতিরিক্ত কাজ / মালামাল চার্জ অনুরোধ' : 'Request Extra / Material Charge'}
              </h3>
              <button type="button" onClick={() => setExtraChargeBooking(null)} className="text-zinc-400">✕</button>
            </div>
            <p className="text-[11px] text-zinc-500">
              {isBangla
                ? 'কাস্টমার অনুমোদন (Approve) না করলে এই অতিরিক্ত চার্জ বিলের সাথে যুক্ত হবে না।'
                : 'This additional charge will only be added to the final bill once approved by the customer.'}
            </p>
            <form onSubmit={handleSubmitExtraCharge} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">{isBangla ? 'চার্জের ধরন:' : 'Charge Type:'}</label>
                <select
                  value={extraChargeType}
                  onChange={(e) => setExtraChargeType(e.target.value as AdditionalChargeRequest['chargeType'])}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-bold"
                >
                  <option value="EXTRA_WORK">
                    {isBangla ? 'অতিরিক্ত কাজ (কমিশনযোগ্য)' : 'Extra Work (Commissionable)'}
                  </option>
                  <option value="PARTS_MATERIAL">
                    {isBangla ? 'খুচরা যন্ত্রাংশ / মালামাল (কমিশনমুক্ত)' : 'Spare Parts / Material (Non-Commissionable Pass-through)'}
                  </option>
                  <option value="EMERGENCY">
                    {isBangla ? 'জরুরি কল সারচার্জ' : 'Emergency Call Surcharge'}
                  </option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">{isBangla ? 'পরিমাণ (৳):' : 'Amount (৳):'}</label>
                <input
                  type="number"
                  required
                  min={10}
                  value={extraChargeAmount}
                  onChange={(e) => setExtraChargeAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 font-black"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">{isBangla ? 'স্পষ্ট কারণ / বিবরণ:' : 'Clear Reason / Description:'}</label>
                <input
                  type="text"
                  required
                  placeholder={isBangla ? 'যেমন: নতুন ক্যাপাসিটর বা অতিরিক্ত ক্যাবল লাগবে' : 'e.g., New capacitor or extra wiring cable needed'}
                  value={extraChargeReason}
                  onChange={(e) => setExtraChargeReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">
                  {isBangla
                    ? 'রশিদ / দোকান নোট (ঐচ্ছিক, ৳৫০০+ মালামালের জন্য আবশ্যক):'
                    : 'Receipt / Store Note (Optional, required for ৳500+ materials):'}
                </label>
                <input
                  type="text"
                  placeholder={isBangla ? 'রশিদ বা দোকানের নাম/মেমো' : 'Receipt / Supplier memo'}
                  value={extraChargeReceipt}
                  onChange={(e) => setExtraChargeReceipt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setExtraChargeBooking(null)} className="px-4 py-2 rounded-xl border font-bold">
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" disabled={extraChargeSubmitting} className="px-5 py-2 rounded-xl bg-orange-600 text-white font-black cursor-pointer">
                  {extraChargeSubmitting
                    ? isBangla
                      ? 'পাঠানো হচ্ছে...'
                      : 'Submitting...'
                    : isBangla
                    ? 'গ্রাহকের অনুমোদনে পাঠান'
                    : 'Send for Customer Approval'}
                </button>
              </div>
            </form>
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

      {/* Live Messenger Chat Modal */}
      {chatBookingModal && (
        <ChatModal
          booking={chatBookingModal}
          isOpen={!!chatBookingModal}
          onClose={() => setChatBookingModal(null)}
        />
      )}

      {/* Fullscreen Technician Route Navigation Modal */}
      {fullscreenRouteBooking && (
        <div className="fixed inset-0 z-[3200] bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <TechnicianRouteMap
              booking={fullscreenRouteBooking}
              technician={currentTech}
              height="55vh"
              onCloseModal={() => setFullscreenRouteBooking(null)}
            />
          </div>
        </div>
      )}
      </DashboardShell>
    </>
  );
};
