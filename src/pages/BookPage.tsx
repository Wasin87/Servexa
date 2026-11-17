import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  Info,
  ArrowRight,
  Upload,
  Navigation,
  Lock,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Tag,
  CreditCard
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { UrgencyLevel } from '../types';
import { resolveCustomerCoordinates, toBengaliNumber } from '../utils/geoUtils';
import {
  BANGLADESH_DIVISIONS,
  BANGLADESH_DISTRICTS,
  getDistrictsByDivision,
  findDistrict,
  findNearestBangladeshLocation
} from '../data/bangladeshLocations';
import { calculateCustomerCompletion } from '../utils/profileCompletion';
import {
  createServerBooking,
  fetchCatalogOverview,
  fetchPaymentProviders,
  fetchPriceQuote,
  getStoredAuthToken
} from '../services/financeApi';
import type { PaymentMethodCode, PriceQuoteResponse, ServiceSubcategory } from '../types/finance';

export const BookPage: React.FC = () => {
  const { categories, technicians, createBooking } = useApp();
  const { t, isBangla } = useLanguage();
  const { currentUser, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paramTechId = searchParams.get('techId') || '';
  const paramCatId = searchParams.get('categoryId') || searchParams.get('category') || 'electrical';
  const paramDesc = searchParams.get('desc') || '';
  const paramUrgent = searchParams.get('emergency') === 'true';

  const verifiedTechnicians = technicians.filter(tech => tech.skillVerified || tech.platformVerified);
  const selectableTechnicians = verifiedTechnicians.length > 0 ? verifiedTechnicians : technicians;

  const initialDivision = currentUser?.division || 'Dhaka';
  const initialDistrict = currentUser?.district || currentUser?.city || 'Dhaka';
  const initialDistrictObj = findDistrict(initialDistrict) || BANGLADESH_DISTRICTS[0];
  const initialArea = currentUser?.area || initialDistrictObj.areas[0]?.nameEn || 'Mirpur';

  // Form State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(paramCatId);
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [selectedTechId, setSelectedTechId] = useState<string>(
    paramTechId || (selectableTechnicians[0]?.id || '')
  );
  const [problemDescription, setProblemDescription] = useState<string>(paramDesc);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [customerDivision, setCustomerDivision] = useState<string>(initialDivision);
  const [customerDistrict, setCustomerDistrict] = useState<string>(initialDistrict);
  const [customerArea, setCustomerArea] = useState<string>(initialArea);
  const [customerAddress, setCustomerAddress] = useState<string>(currentUser?.address || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState<string>('02:00 PM - 04:00 PM');
  const [urgency, setUrgency] = useState<UrgencyLevel>(paramUrgent ? 'emergency' : 'today');
  const [estimatedHours, setEstimatedHours] = useState<number>(1);
  const [isNightService, setIsNightService] = useState<boolean>(false);
  const [isWeekendService, setIsWeekendService] = useState<boolean>(false);
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('cash');
  const [activePaymentMethods, setActivePaymentMethods] = useState<Record<PaymentMethodCode, boolean>>({
    bkash: true,
    nagad: true,
    rocket: true,
    card: true,
    cash: true,
  });
  const [serverQuote, setServerQuote] = useState<PriceQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);

  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingCoords, setIsDetectingCoords] = useState<boolean>(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [gateError, setGateError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.division) setCustomerDivision(currentUser.division);
      if (currentUser.district || currentUser.city) {
        setCustomerDistrict(currentUser.district || currentUser.city);
      }
      if (currentUser.area) setCustomerArea(currentUser.area);
      if (currentUser.address) setCustomerAddress(currentUser.address);
    }
  }, [currentUser?.id]);

  // Load subcategories & Admin-enabled payment methods from backend
  useEffect(() => {
    fetchCatalogOverview()
      .then((data) => {
        setSubcategories(data.subcategories || []);
      })
      .catch(() => {});
    fetchPaymentProviders()
      .then((res) => {
        if (res.activeMethods) {
          setActivePaymentMethods(res.activeMethods);
          const firstEnabled = (Object.keys(res.activeMethods) as PaymentMethodCode[]).find(
            (m) => res.activeMethods[m]
          );
          if (firstEnabled && !res.activeMethods[paymentMethod]) {
            setPaymentMethod(firstEnabled);
          }
        }
      })
      .catch(() => {});
  }, []);

  const filteredSubcategories = subcategories.filter((s) => s.categoryId === selectedCategoryId && s.active);

  useEffect(() => {
    const firstSub = filteredSubcategories[0];
    if (firstSub && !filteredSubcategories.some((s) => s.id === selectedSubcategoryId)) {
      setSelectedSubcategoryId(firstSub.id);
    } else if (filteredSubcategories.length === 0) {
      setSelectedSubcategoryId('');
    }
  }, [selectedCategoryId, subcategories.length]);

  const districtsInDivision = getDistrictsByDivision(customerDivision);
  const activeDistrictObj = findDistrict(customerDistrict) || districtsInDivision[0] || BANGLADESH_DISTRICTS[0];
  const areasInDistrict = activeDistrictObj.areas;

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const selectedTech =
    selectableTechnicians.find((t) => t.id === selectedTechId) ||
    technicians.find((t) => t.id === selectedTechId) ||
    selectableTechnicians[0];

  // Fetch transparent quote from server whenever pricing parameters change
  useEffect(() => {
    if (!selectedCategory?.id || !selectedTech?.id) return;
    setQuoteLoading(true);
    const timer = setTimeout(() => {
      fetchPriceQuote({
        categoryId: selectedCategory.id,
        subcategoryId: selectedSubcategoryId || undefined,
        technicianId: selectedTech.id,
        urgency,
        isNightService,
        isWeekendService,
        estimatedHours,
        promoCode: promoCodeInput.trim() || undefined,
      })
        .then((res) => {
          setServerQuote(res.quote);
          if (res.quote.activePaymentMethods) {
            setActivePaymentMethods(res.quote.activePaymentMethods);
          }
        })
        .catch(() => {})
        .finally(() => setQuoteLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCategory?.id, selectedSubcategoryId, selectedTech?.id, urgency, isNightService, isWeekendService, estimatedHours, promoCodeInput]);

  // Profile completion gate
  const customerCompletion = calculateCustomerCompletion(currentUser);
  const isProfileIncomplete =
    isAuthenticated && currentUser?.role === 'CUSTOMER' && !customerCompletion.isComplete;
  const canBook = isAuthenticated && !!currentUser && !isProfileIncomplete;

  // Fallback pricing calculation (synced with serverQuote when available)
  const visitingFee = serverQuote?.visitingFee ?? (
    urgency === 'emergency' ? (selectedTech?.visitingFee || 200) + 150 : (selectedTech?.visitingFee || 200)
  );
  const labourMin = serverQuote?.servicePrice ?? 300;
  const labourMax = serverQuote?.servicePrice ?? 600;
  const estimatedTotalMin = serverQuote?.estimatedTotal ?? (visitingFee + labourMin);
  const estimatedTotalMax = serverQuote?.estimatedTotal ?? (visitingFee + labourMax);

  const handleDivisionChange = (newDiv: string) => {
    setCustomerDivision(newDiv);
    const divDistricts = getDistrictsByDivision(newDiv);
    if (divDistricts.length > 0) {
      setCustomerDistrict(divDistricts[0].nameEn);
      setCustomerArea(divDistricts[0].areas[0]?.nameEn || divDistricts[0].nameEn);
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setCustomerDistrict(newDist);
    const distObj = findDistrict(newDist);
    if (distObj) {
      setCustomerArea(distObj.areas[0]?.nameEn || distObj.nameEn);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setMediaUrls((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDetectCustomerGps = () => {
    setGpsErrorMsg(null);
    setGpsStatusMsg(null);
    if (!navigator.geolocation) {
      setGpsErrorMsg(
        isBangla
          ? 'আপনার ব্রাউজার জিপিএস লোকেশন সাপোর্ট করছে না।'
          : 'Geolocation is not supported by your browser.'
      );
      return;
    }

    setIsDetectingCoords(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCustomerCoords({ lat, lng });

        const nearest = findNearestBangladeshLocation(lat, lng);
        let readableAddress = '';

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=bn,en&addressdetails=1`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const addr = data?.address || {};
            const parts = [
              addr.house_number,
              addr.road,
              addr.neighbourhood || addr.suburb || addr.quarter,
              addr.city_district || addr.town || addr.village || addr.county,
              addr.state_district || addr.city,
              addr.postcode
            ].filter(Boolean);

            readableAddress = parts.length > 0 ? parts.join(', ') : (data?.display_name || '');

            // Match district & area cleanly if within Bangladesh
            const districtCandidate = addr.state_district || addr.city || addr.county || '';
            const matchedDist = findDistrict(districtCandidate) || nearest.district;
            const matchedDiv = BANGLADESH_DIVISIONS.find(d => d.id === matchedDist.divisionId);
            if (matchedDiv) setCustomerDivision(matchedDiv.nameEn);
            setCustomerDistrict(matchedDist.nameEn);

            const areaCandidate = addr.suburb || addr.neighbourhood || addr.town || addr.city_district || '';
            const matchedArea = matchedDist.areas.find(
              a =>
                areaCandidate.toLowerCase().includes(a.nameEn.toLowerCase()) ||
                areaCandidate.includes(a.nameBn)
            );
            setCustomerArea(matchedArea ? matchedArea.nameEn : (areaCandidate || matchedDist.areas[0]?.nameEn || matchedDist.nameEn));
          }
        } catch {
          // Graceful offline fallback to nearest Bangladesh location
        }

        if (!readableAddress) {
          setCustomerDivision(nearest.division.nameEn);
          setCustomerDistrict(nearest.district.nameEn);
          setCustomerArea(nearest.areaNameEn);
          readableAddress = `${nearest.areaNameBn}, ${nearest.district.nameBn}, ${nearest.division.nameBn} (GPS: ${lat}, ${lng})`;
        }

        setCustomerAddress(readableAddress);
        setGpsStatusMsg(
          isBangla
            ? `সঠিক GPS পিন ও ঠিকানা স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে (${lat}, ${lng})`
            : `Exact GPS pin & address attached (${lat}, ${lng})`
        );
        setIsDetectingCoords(false);
      },
      (err) => {
        setIsDetectingCoords(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsErrorMsg(
            isBangla
              ? 'লোকেশন পারমিশন দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজার লোকেশন চালু করুন অথবা ঠিকানা হাতে লিখুন।'
              : 'Location permission denied. Please enable GPS or type your address manually.'
          );
        } else {
          setGpsErrorMsg(
            isBangla
              ? 'সঠিক GPS সিগন্যাল পাওয়া যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
              : 'Could not detect GPS coordinates. Please try again.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);

    if (!isAuthenticated || !currentUser) {
      setGateError(
        isBangla
          ? 'মিস্ত্রি বুক করার আগে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন বা সাইন আপ করুন।'
          : 'Please log in or sign up before booking a technician.'
      );
      return;
    }

    if (isProfileIncomplete) {
      setGateError(
        isBangla
          ? `বুকিং করার আগে আপনার প্রোফাইল ও ঠিকানা ১০০% সম্পূর্ণ করুন (বর্তমানে ${toBengaliNumber(customerCompletion.percent)}%)।`
          : `Complete 100% of your profile and address first (currently ${customerCompletion.percent}%).`
      );
      return;
    }

    if (!selectedTech) return;

    setIsSubmitting(true);
    const resolved =
      customerCoords ||
      resolveCustomerCoordinates(customerArea, customerAddress, undefined, customerDistrict);

    let serverCreatedBooking: any = null;
    if (getStoredAuthToken()) {
      try {
        const res = await createServerBooking({
          categoryId: selectedCategory.id,
          subcategoryId: selectedSubcategoryId || undefined,
          technicianId: selectedTech.id,
          urgency,
          isNightService,
          isWeekendService,
          estimatedHours,
          promoCode: promoCodeInput.trim() || undefined,
          paymentMethod,
          problemDescription: problemDescription.trim() || (isBangla ? 'সাধারণ সার্ভিস ও পরিদর্শন' : 'General service & inspection'),
          mediaUrls,
          customerDivision,
          customerDistrict,
          customerCity: customerDistrict,
          customerArea,
          customerAddress: customerAddress.trim(),
          customerLat: resolved.lat,
          customerLng: resolved.lng,
          date,
          timeSlot,
          warrantyDays: selectedTech.warrantyPeriodDays,
        });
        serverCreatedBooking = res.booking;
      } catch (err: any) {
        setIsSubmitting(false);
        setGateError(
          err?.message ||
            (isBangla
              ? 'সার্ভার ভ্যালিডেশনে বুকিং নিশ্চিত করা যায়নি।'
              : 'Booking could not be confirmed by server validation.')
        );
        return;
      }
    }

    const booking = createBooking({
      id: serverCreatedBooking?.id,
      bookingNumber: serverCreatedBooking?.bookingNumber,
      categoryId: selectedCategory.id,
      serviceNameEn: serverCreatedBooking?.serviceNameEn || serverQuote?.serviceNameEn || selectedCategory.nameEn,
      serviceNameBn: serverCreatedBooking?.serviceNameBn || serverQuote?.serviceNameBn || selectedCategory.nameBn,
      technicianId: selectedTech.id,
      technicianName: selectedTech.name,
      technicianPhone: selectedTech.phone,
      technicianAvatar: selectedTech.avatar,
      problemDescription: problemDescription.trim() || (isBangla ? 'সাধারণ সার্ভিস ও পরিদর্শন' : 'General service & inspection'),
      mediaUrls,
      customerDivision,
      customerDistrict,
      customerCity: customerDistrict,
      customerArea,
      customerAddress: customerAddress.trim(),
      customerLat: resolved.lat,
      customerLng: resolved.lng,
      date,
      timeSlot,
      urgency,
      estimatedVisitingFee: serverCreatedBooking?.estimatedVisitingFee ?? visitingFee,
      estimatedLabourMin: serverCreatedBooking?.estimatedLabourMin ?? labourMin,
      estimatedLabourMax: serverCreatedBooking?.estimatedLabourMax ?? labourMax,
      estimatedTotalMin: serverCreatedBooking?.estimatedTotalMin ?? estimatedTotalMin,
      estimatedTotalMax: serverCreatedBooking?.estimatedTotalMax ?? estimatedTotalMax,
      finalTotal: serverCreatedBooking?.finalTotal ?? serverQuote?.estimatedTotal,
      paymentMethod,
      warrantyDays: selectedTech.warrantyPeriodDays
    });

    setIsSubmitting(false);
    navigate(`/booking/${booking.id}`);
  };

  return (
    <div className="py-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
          {t.booking.title}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {t.booking.subtitle}
        </p>
      </div>

      {/* GATE 1: Login / Signup Required */}
      {!isAuthenticated || !currentUser ? (
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-orange-500/40 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-600">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">
              {isBangla ? 'বুকিং করতে লগইন প্রয়োজন' : 'Login Required to Book'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {isBangla
                ? 'নিরাপদ সেবা ও ওয়ারেন্টি সুরক্ষার জন্য মিস্ত্রি বুক করার আগে আপনার অ্যাকাউন্টে লগইন বা নতুন রেজিস্ট্রেশন করুন।'
                : 'For service safety and warranty tracking, please sign in or create an account before booking a technician.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2"
            >
              <span>{isBangla ? 'লগইন করুন' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-xs sm:text-sm hover:border-orange-500"
            >
              {isBangla ? 'নতুন একাউন্ট খুলুন' : 'Create Account'}
            </Link>
          </div>
        </div>
      ) : null}

      {/* GATE 2: Customer Profile 100% Completion Requirement */}
      {isProfileIncomplete && (
        <div className="mb-8 p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500/50 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-200">
                  {isBangla
                    ? `প্রোফাইল ১০০% সম্পূর্ণ না করলে মিস্ত্রি বুক করা যাবে না (বর্তমানে ${toBengaliNumber(customerCompletion.percent)}%)`
                    : `Complete 100% of Your Profile to Book (${customerCompletion.percent}% done)`}
                </h2>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/90">
                  {isBangla
                    ? 'বুকিং কনফার্ম করতে আপনার ড্যাশবোর্ড থেকে বিভাগ, জেলা, এলাকা ও বিস্তারিত ঠিকানা যুক্ত করে প্রোফাইল ১০০% সম্পন্ন করুন।'
                    : 'Please fill out your Division, District, Area, and detailed address in your Customer Dashboard first.'}
                </p>
              </div>
            </div>
            <Link
              to="/customer/dashboard?tab=profile"
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md shrink-0 flex items-center gap-1.5 self-start sm:self-center"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isBangla ? 'প্রোফাইল ১০০% করুন →' : 'Complete Profile →'}</span>
            </Link>
          </div>

          <div className="w-full h-2.5 rounded-full bg-amber-200/70 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-300"
              style={{ width: `${customerCompletion.percent}%` }}
            />
          </div>

          {(isBangla ? customerCompletion.missingLabelsBn : customerCompletion.missingLabelsEn).length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-bold text-amber-900 dark:text-amber-300">
                {isBangla ? 'বাকি রয়েছে:' : 'Missing:'}
              </span>
              {(isBangla ? customerCompletion.missingLabelsBn : customerCompletion.missingLabelsEn).map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-800 font-bold text-amber-800 dark:text-amber-300"
                >
                  • {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {gateError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/40 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{gateError}</span>
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className={`space-y-6 ${!canBook ? 'opacity-60 pointer-events-none select-none' : ''}`}>
        {/* Step 1 & 2: Service & Problem */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">
              {isBangla ? '১' : '1'}
            </span>
            <span>{isBangla ? 'সার্ভিস ও সমস্যার বিবরণ' : 'Service & Problem Details'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isBangla ? 'সার্ভিস ক্যাটাগরি' : 'Service Category'}
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isBangla ? c.nameBn : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isBangla ? 'নির্দিষ্ট সার্ভিস (Subcategory)' : 'Specific Service'}
              </label>
              <select
                value={selectedSubcategoryId}
                onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                {filteredSubcategories.length === 0 && (
                  <option value="">{isBangla ? 'স্ট্যান্ডার্ড ক্যাটাগরি সার্ভিস' : 'Standard Category Service'}</option>
                )}
                {filteredSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {isBangla ? sub.nameBn : sub.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t.booking.selectedTech}
              </label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                {selectableTechnicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} ({tech.primaryArea || tech.district || tech.city} · ★{tech.rating})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t.booking.problemLabel}
            </label>
            <textarea
              rows={3}
              required
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder={
                isBangla
                  ? 'কী সমস্যা হচ্ছে বা কী কাজ করাতে চান বিস্তারিত লিখুন...'
                  : 'Describe what issue you are facing or the work you need done...'
              }
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t.booking.mediaUploadLabel}
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <Upload className="w-4 h-4 text-orange-500" />
                <span>{isBangla ? 'ছবি সংযুক্ত করুন' : 'Attach Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {mediaUrls.length > 0 && (
                <div className="flex items-center gap-2">
                  {mediaUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Uploaded preview"
                      className="w-10 h-10 rounded-lg object-cover border border-orange-500"
                    />
                  ))}
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    {isBangla ? '✓ ছবি যুক্ত হয়েছে' : '✓ Photo attached'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: All-Bangladesh Location Details + GPS Auto-Fill */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">
                {isBangla ? '২' : '2'}
              </span>
              <span>{isBangla ? 'ঠিকানা ও অবস্থান (সারা বাংলাদেশ)' : 'Location & Address (All Bangladesh)'}</span>
            </h2>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              🇧🇩 {isBangla ? '৬৪টি জেলায় সেবা চালু' : 'All 64 Districts Covered'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isBangla ? 'বিভাগ (Division)' : 'Division'}
              </label>
              <select
                value={customerDivision}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                {BANGLADESH_DIVISIONS.map((div) => (
                  <option key={div.id} value={div.nameEn}>
                    {isBangla ? `${div.nameBn} (${div.nameEn})` : div.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isBangla ? 'জেলা / শহর (District)' : 'District / City'}
              </label>
              <select
                value={customerDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                {districtsInDivision.map((dist) => (
                  <option key={dist.id} value={dist.nameEn}>
                    {isBangla ? `${dist.nameBn} (${dist.nameEn})` : dist.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {isBangla ? 'এলাকা / উপজেলা (Area)' : 'Area / Upazila'}
              </label>
              <select
                value={areasInDistrict.some(a => a.nameEn === customerArea) ? customerArea : '__custom__'}
                onChange={(e) => {
                  if (e.target.value !== '__custom__') setCustomerArea(e.target.value);
                }}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                {areasInDistrict.map((a) => (
                  <option key={a.nameEn} value={a.nameEn}>
                    {isBangla ? `${a.nameBn} (${a.nameEn})` : a.nameEn}
                  </option>
                ))}
                {!areasInDistrict.some(a => a.nameEn === customerArea) && customerArea && (
                  <option value="__custom__">{customerArea}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t.booking.addressLabel}
              </label>
              <button
                type="button"
                onClick={handleDetectCustomerGps}
                disabled={isDetectingCoords}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Navigation className={`w-3.5 h-3.5 ${isDetectingCoords ? 'animate-spin' : ''}`} />
                <span>
                  {isDetectingCoords
                    ? (isBangla ? 'GPS লোকেশন নেওয়া হচ্ছে...' : 'Detecting GPS...')
                    : customerCoords
                    ? (isBangla ? '✓ সঠিক GPS লোকেশন যুক্ত হয়েছে' : '✓ Exact GPS Pin Attached')
                    : (isBangla ? 'বর্তমান GPS লোকেশন যুক্ত করুন' : 'Attach Current GPS Pin')}
                </span>
              </button>
            </div>
            <input
              type="text"
              required
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder={isBangla ? 'বাড়ি নম্বর, রোড, গ্রাম/মহল্লা, ফ্ল্যাট ইত্যাদি (বা GPS বাটনে ক্লিক করুন)...' : 'House no, road, flat, village/area...'}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            {gpsStatusMsg && (
              <p className="mt-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{gpsStatusMsg}</span>
              </p>
            )}
            {gpsErrorMsg && (
              <p className="mt-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{gpsErrorMsg}</span>
              </p>
            )}
          </div>
        </div>

        {/* Step 4: Schedule & Urgency */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs">
              {isBangla ? '৩' : '3'}
            </span>
            <span>{isBangla ? 'সময়সূচি ও অগ্রাধিকার' : 'Schedule & Priority'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t.booking.selectDate}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t.booking.selectTime}
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              >
                <option value="09:00 AM - 11:00 AM">{isBangla ? 'সকাল ০৯:০০ - ১১:০০' : '09:00 AM - 11:00 AM'}</option>
                <option value="11:00 AM - 01:00 PM">{isBangla ? 'সকাল ১১:০০ - দুপুর ০১:০০' : '11:00 AM - 01:00 PM'}</option>
                <option value="02:00 PM - 04:00 PM">{isBangla ? 'দুপুর ০২:০০ - বিকাল ০৪:০০' : '02:00 PM - 04:00 PM'}</option>
                <option value="04:00 PM - 06:00 PM">{isBangla ? 'বিকাল ০৪:০০ - সন্ধ্যা ০৬:০০' : '04:00 PM - 06:00 PM'}</option>
                <option value="07:00 PM - 09:00 PM">{isBangla ? 'সন্ধ্যা ০৭:০০ - রাত ০৯:০০' : '07:00 PM - 09:00 PM'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              {t.booking.urgencyLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                  urgency === 'normal'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-200 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>{t.booking.urgencyNormal}</span>
                <input
                  type="radio"
                  name="urgency"
                  value="normal"
                  checked={urgency === 'normal'}
                  onChange={() => setUrgency('normal')}
                  className="accent-orange-600"
                />
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                  urgency === 'today'
                    ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-200 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>{t.booking.urgencyToday}</span>
                <input
                  type="radio"
                  name="urgency"
                  value="today"
                  checked={urgency === 'today'}
                  onChange={() => setUrgency('today')}
                  className="accent-orange-600"
                />
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                  urgency === 'emergency'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 font-semibold'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>{t.booking.urgencyEmergency}</span>
                <input
                  type="radio"
                  name="urgency"
                  value="emergency"
                  checked={urgency === 'emergency'}
                  onChange={() => setUrgency('emergency')}
                  className="accent-rose-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Step 5: Promo, Surcharges, Payment Method & Transparent Pre-Booking Breakdown */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-orange-500" />
            <span>{isBangla ? 'পেমেন্ট মাধ্যম ও প্রোমো কোড' : 'Payment Method & Promo Options'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {isBangla ? 'সম্ভাব্য কাজের সময় (ঘণ্টা)' : 'Estimated Hours'}
              </label>
              <input
                type="number"
                min={1}
                max={8}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Math.max(1, Number(e.target.value)))}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {isBangla ? 'প্রোমো কোড (যেমন: SERVEXA50)' : 'Promo Code (e.g. SERVEXA50)'}
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-orange-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="SERVEXA50 / FIRST10"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-mono uppercase"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end gap-1.5">
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNightService}
                  onChange={(e) => setIsNightService(e.target.checked)}
                  className="accent-orange-600"
                />
                <span>{isBangla ? 'রাতের সার্ভিস (৯PM–৭AM)' : 'Night Shift Service'}</span>
              </label>
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWeekendService}
                  onChange={(e) => setIsWeekendService(e.target.checked)}
                  className="accent-orange-600"
                />
                <span>{isBangla ? 'সাপ্তাহিক ছুটির দিন' : 'Weekend Service'}</span>
              </label>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
              {isBangla ? 'পেমেন্ট মেথড নির্বাচন করুন (অ্যাডমিন অনুমোদিত)' : 'Select Active Payment Method'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  ['cash', isBangla ? 'কাজ শেষে নগদ (Cash)' : 'Cash on Completion'],
                  ['bkash', isBangla ? 'বিকাশ (bKash)' : 'bKash'],
                  ['nagad', isBangla ? 'নগদ (Nagad)' : 'Nagad'],
                  ['rocket', isBangla ? 'রকেট (Rocket)' : 'Rocket'],
                  ['card', isBangla ? 'ডেবিট/ক্রেডিট কার্ড' : 'Debit/Credit Card'],
                ] as [PaymentMethodCode, string][]
              ).map(([code, label]) => {
                const enabled = activePaymentMethods[code];
                return (
                  <button
                    key={code}
                    type="button"
                    disabled={!enabled}
                    onClick={() => setPaymentMethod(code)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      paymentMethod === code
                        ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cost Estimation Summary (Live Server Quote Breakdown) */}
        <div className="bg-stone-50 dark:bg-zinc-800/60 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-orange-500" />
              <span>{t.booking.costEstimation}</span>
            </h2>
            {serverQuote && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-bold">
                {isBangla ? `যাচাইকৃত মূল্য v${serverQuote.ruleVersion}` : `Verified Quote v${serverQuote.ruleVersion}`}
              </span>
            )}
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-700 text-xs">
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">
                {serverQuote
                  ? isBangla
                    ? `${serverQuote.serviceNameBn} (মূল সার্ভিস চার্জ)`
                    : `${serverQuote.serviceNameEn} (Base Price)`
                  : t.booking.labourCost}
              </span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {serverQuote ? `৳${serverQuote.servicePrice}` : `৳${labourMin}–৳${labourMax}`}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">
                {t.booking.visitingFee} ({isBangla ? 'বাসায় গিয়ে পরিদর্শন' : 'Doorstep Inspection'})
              </span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">৳{visitingFee}</span>
            </div>
            {serverQuote && serverQuote.hourlyCharge > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">{isBangla ? 'অতিরিক্ত ঘণ্টার চার্জ' : 'Additional Hours Charge'}</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">৳{serverQuote.hourlyCharge}</span>
              </div>
            )}
            {serverQuote && serverQuote.emergencyCharge > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-rose-600">{isBangla ? 'জরুরি ডিসপ্যাচ সারচার্জ' : 'Emergency Dispatch Surcharge'}</span>
                <span className="font-bold text-rose-600">৳{serverQuote.emergencyCharge}</span>
              </div>
            )}
            {serverQuote && serverQuote.nightCharge > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">{isBangla ? 'রাতের শিফট সারচার্জ' : 'Night Shift Surcharge'}</span>
                <span className="font-bold">৳{serverQuote.nightCharge}</span>
              </div>
            )}
            {serverQuote && serverQuote.weekendCharge > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">{isBangla ? 'সাপ্তাহিক ছুটির দিন সারচার্জ' : 'Weekend Surcharge'}</span>
                <span className="font-bold">৳{serverQuote.weekendCharge}</span>
              </div>
            )}
            {serverQuote && serverQuote.discountAmount > 0 && (
              <div className="flex justify-between py-2 text-emerald-600 font-bold">
                <span>
                  {isBangla ? 'প্রোমো ডিসকাউন্ট' : 'Promo Discount'} ({serverQuote.promoApplied})
                </span>
                <span>-৳{serverQuote.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-zinc-500">{t.booking.partsCost}</span>
              <span className="text-zinc-400 italic">
                {t.booking.partsNotice} ({isBangla ? 'গ্রাহকের অনুমোদন আবশ্যক' : 'Customer Approval Required'})
              </span>
            </div>
            <div className="flex justify-between py-2 pt-3 font-bold text-sm">
              <span className="text-zinc-900 dark:text-white">{t.booking.totalEstimate}</span>
              <span className="text-orange-600 dark:text-orange-400">
                {quoteLoading
                  ? isBangla
                    ? 'হিসাব করা হচ্ছে...'
                    : 'Calculating...'
                  : serverQuote
                    ? `৳${serverQuote.estimatedTotal}`
                    : `৳${estimatedTotalMin}–৳${estimatedTotalMax}`}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
            {isBangla
              ? '* বুকিং নিশ্চিত করলে এই নির্ধারিত মূল্য স্ন্যাপশট লক হয়ে যাবে। কাজের সময় কোনো অতিরিক্ত কাজ বা মালামালের খরচ যোগ করতে হলে আপনার সরাসরি অনুমোদন লাগবে।'
              : '* Confirming locks an immutable price snapshot. Any extra work or materials added during service requires your explicit approval.'}
          </p>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !canBook}
            className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-400 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? (isBangla ? 'প্রসেসিং হচ্ছে...' : 'Processing...') : t.booking.submitBooking}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
