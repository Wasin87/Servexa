import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Award,
  CheckCircle2,
  Sparkles,
  Calendar,
  Heart,
  Scale,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Zap,
  ThumbsUp,
  UserCheck,
  Check
} from 'lucide-react';
import { Technician } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { HealthScoreCard } from './HealthScoreCard';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { ChatModal } from './ChatModal';

interface TechnicianDetailModalProps {
  technician: Technician | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'pricing' | 'trust' | 'portfolio' | 'reviews';

export const TechnicianDetailModal: React.FC<TechnicianDetailModalProps> = ({
  technician,
  isOpen,
  onClose
}) => {
  const { categories, reviews, toggleFavorite, isFavorite, addToCompare, removeFromCompare, comparedTechIds, bookings } = useApp();
  const { t, isBangla } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [chatOpen, setChatOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset tab on tech change
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen, technician?.id]);

  if (!isOpen || !technician) return null;

  const isSaved = isFavorite(technician.id);
  const isCompared = comparedTechIds.includes(technician.id);
  const techReviews = reviews.filter((r) => r.technicianId === technician.id);

  // Active or dummy booking for quick chat
  const chatBooking = bookings.find((b) => b.technicianId === technician.id) || {
    id: `book-chat-${technician.id}`,
    bookingNumber: 'SRV-CHAT',
    customerId: 'user-cust-demo',
    customerName: 'Customer',
    customerPhone: '01700-000000',
    customerCity: technician.city,
    customerArea: technician.primaryArea,
    customerAddress: 'Direct Inquiry',
    technicianId: technician.id,
    technicianName: technician.name,
    technicianPhone: technician.phone,
    technicianAvatar: technician.avatar,
    categoryId: technician.skills[0] || 'electrical',
    serviceNameEn: 'General Consultation',
    serviceNameBn: 'সাধারণ কারিগরি পরামর্শ',
    problemDescription: 'In-app chat inquiry',
    mediaUrls: [],
    date: new Date().toISOString().split('T')[0],
    timeSlot: 'Now',
    urgency: 'normal' as const,
    estimatedVisitingFee: technician.visitingFee,
    estimatedLabourMin: 300,
    estimatedLabourMax: 600,
    estimatedTotalMin: technician.visitingFee + 300,
    estimatedTotalMax: technician.visitingFee + 600,
    status: 'ACCEPTED' as const,
    statusHistory: [],
    paymentStatus: 'PENDING' as const,
    paymentMethod: 'cash' as const,
    warrantyDays: technician.warrantyPeriodDays,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return catId;
    return isBangla ? cat.nameBn : cat.nameEn;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Hero Banner & Profile Header */}
          <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white p-5 sm:p-6 pb-6">
            {/* Action buttons on top right */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={() => toggleFavorite(technician.id)}
                title={isSaved ? 'ফেভারিট থেকে সরান' : 'ফেভারিটে যোগ করুন'}
                aria-label={isSaved ? 'Remove from favorites' : 'Add to favorites'}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors cursor-pointer"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-300 text-rose-300' : 'text-white'}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isCompared) {
                    removeFromCompare(technician.id);
                  } else {
                    addToCompare(technician.id);
                  }
                }}
                title="তুলনা করুন"
                aria-label="Compare"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isCompared ? 'bg-white text-orange-600 shadow-md font-bold' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <Scale className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar & Primary Badges */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pr-24">
              <div className="relative shrink-0">
                <img
                  src={technician.avatar}
                  alt={technician.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover border-2 border-white shadow-xl"
                  referrerPolicy="no-referrer"
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white dark:border-zinc-900 ${
                    technician.availability === 'available'
                      ? 'bg-emerald-400 animate-pulse'
                      : technician.availability === 'busy'
                      ? 'bg-amber-400'
                      : 'bg-zinc-400'
                  }`}
                  title={technician.availability}
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-xs">
                    {technician.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-emerald-700 px-2.5 py-0.5 rounded-full shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.tech.verifiedPro}</span>
                  </span>
                  {technician.emergencyAvailable && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3" />
                      <span>{isBangla ? 'জরুরি কল প্রস্তুত' : 'Emergency Ready'}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-orange-100">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                    <span>{technician.primaryArea}, {technician.city}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                    <span>{technician.workingHours}</span>
                  </span>
                </div>

                {/* Quick Score Metrics in Header */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <div className="inline-flex items-center gap-1 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-lg font-bold text-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    <span>{technician.rating}</span>
                    <span className="text-orange-200 text-[11px] font-normal">({technician.reviewCount} {t.tech.reviews})</span>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white font-medium">
                    <Award className="w-3.5 h-3.5 text-amber-300" />
                    <span>{technician.experienceYears} {isBangla ? 'বছর অভিজ্ঞতা' : 'Years Exp'}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-lg text-emerald-200 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{technician.completedJobs}+ {isBangla ? 'কাজ সম্পন্ন' : 'Jobs Done'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/90 px-4 sm:px-6 overflow-x-auto scrollbar-none gap-1 sm:gap-2">
            {[
              { id: 'overview', labelBn: 'সারসংক্ষেপ ও প্রোফাইল', labelEn: 'Overview & Bio' },
              { id: 'pricing', labelBn: 'খরচ ও সার্ভিস রেট', labelEn: 'Pricing & Rates' },
              { id: 'trust', labelBn: 'নিরাপত্তা ও হেলথ স্কোর', labelEn: 'Trust & Verification' },
              { id: 'portfolio', labelBn: `কাজের নমুনা (${technician.portfolio?.length || 0})`, labelEn: `Portfolio (${technician.portfolio?.length || 0})` },
              { id: 'reviews', labelBn: `রিভিউ (${techReviews.length})`, labelEn: `Reviews (${techReviews.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-3 px-3 sm:px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {isBangla ? tab.labelBn : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Tab Content Container */}
          <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Short Bio */}
                <div className="bg-stone-50 dark:bg-zinc-800/60 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>{isBangla ? 'মিস্ত্রির সংক্ষিপ্ত পরিচিতি' : 'Professional Biography'}</span>
                  </h3>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    {isBangla ? technician.bioBn : technician.bioEn}
                  </p>
                  {(technician.aboutBn || technician.aboutEn) && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                      {isBangla ? technician.aboutBn : technician.aboutEn}
                    </p>
                  )}
                </div>

                {/* Key Attributes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80">
                    <span className="text-[11px] text-zinc-400 block">{t.tech.visitingFee}</span>
                    <span className="text-base font-black text-zinc-900 dark:text-white mt-0.5 block">
                      ৳{technician.visitingFee}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80">
                    <span className="text-[11px] text-zinc-400 block">{t.tech.startingPrice}</span>
                    <span className="text-base font-black text-orange-600 dark:text-orange-400 mt-0.5 block">
                      ৳{technician.startingPrice}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80">
                    <span className="text-[11px] text-zinc-400 block">{isBangla ? 'ফ্রি ওয়ারেন্টি' : 'Warranty Guarantee'}</span>
                    <span className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
                      {technician.warrantyPeriodDays} {isBangla ? 'দিন' : 'Days'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80">
                    <span className="text-[11px] text-zinc-400 block">{isBangla ? 'রেসপন্স রেট' : 'Response Rate'}</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {technician.healthScore.responseRate}%
                    </span>
                  </div>
                </div>

                {/* Skills & Categories */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {isBangla ? 'দক্ষতা ও কাজের ক্ষেত্র' : 'Expertise & Specialized Skills'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {technician.skills.map((skillId) => (
                      <span
                        key={skillId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-xs font-bold text-orange-700 dark:text-orange-300"
                      >
                        <Check className="w-3.5 h-3.5 text-orange-600" />
                        <span>{getCategoryName(skillId)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Service Coverage Areas */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {isBangla ? 'সার্ভিস এরিয়া কভারেজ' : 'Service Coverage Areas'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {technician.serviceAreas.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        <MapPin className="w-3 h-3 text-orange-500" />
                        <span>{area}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Spoken Languages */}
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{isBangla ? 'ভাষা:' : 'Languages:'}</span>
                  <span>{technician.languages.join(', ')}</span>
                </div>
              </div>
            )}

            {/* 2. PRICING & GUARANTEE TAB */}
            {activeTab === 'pricing' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm mb-1">
                    <Shield className="w-4 h-4" />
                    <span>{isBangla ? 'Servexa স্বচ্ছ মূল্যনীতি গ্যারান্টি' : 'Servexa Transparent Pricing Guarantee'}</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {isBangla
                      ? 'কোনো গোপন বা বাড়তি চার্জ নেই। কাজ শুরুর পূর্বে টেকনিশিয়ান সমস্যা পরীক্ষা করে চূড়ান্ত কোটেশন প্রদান করবেন। কাজ সম্পন্ন ও সন্তুষ্টির পর বিল পরিশোধ করুন।'
                      : 'No surprise charges. Technician diagnoses the issue on-site and provides an itemized quote before starting work.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">{t.tech.visitingFee}</span>
                      <span className="text-lg font-black text-zinc-900 dark:text-white">৳{technician.visitingFee}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {isBangla ? 'বাসায় গিয়ে সমস্যা পরিদর্শন ও যাচাই করার প্রারম্ভিক ফি।' : 'Initial home inspection and diagnostic charge.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">{t.tech.startingPrice}</span>
                      <span className="text-lg font-black text-orange-600 dark:text-orange-400">৳{technician.startingPrice}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {isBangla ? 'সাধারণ সার্ভিসিং ও ছোটখাটো মেরামতের ন্যূনতম মজুরি।' : 'Base labor charge for standard maintenance tasks.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    <span>{technician.warrantyPeriodDays} {isBangla ? 'দিনের ফ্রি সার্ভিস রিপেয়ার গ্যারান্টি' : 'Days Free Service Warranty'}</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {isBangla
                      ? 'সার্ভিস নেওয়ার পর নির্দিষ্ট মেয়াদের মধ্যে একই সমস্যায় পুনরায় বিনামূল্যে টেকনিশিয়ান সার্ভিস প্রদান করা হবে।'
                      : 'If the same issue reoccurs within the warranty period, free inspection and re-service are provided.'}
                  </p>
                </div>
              </div>
            )}

            {/* 3. TRUST & HEALTH SCORE TAB */}
            {activeTab === 'trust' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* KYC Verification Checklist */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {isBangla ? 'ভেরিফিকেশন ও নিরাপত্তা ছাড়পত্র' : 'Identity & Background Verification'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                          {isBangla ? 'জাতীয় পরিচয়পত্র (NID) ভেরিফায়েড' : 'National ID (NID) Verified'}
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                          {isBangla ? 'ফিজিক্যাল এনআইডি ও বায়োমেট্রিক তথ্য যাচাইকৃত' : 'Government Identity Authenticated'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                      <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                          {isBangla ? 'ব্যবহারিক কারিগরি দক্ষতা যাচাই' : 'Practical Skill Assessment'}
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                          {isBangla ? 'বিশেষজ্ঞ টিম দ্বারা কাজের মান অনুমোদিত' : 'Field tested by Senior Master Technicians'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                      <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                          {isBangla ? 'সক্রিয় মোবাইল নম্বর ও ওটিপি ভেরিফাইড' : 'Mobile Phone OTP Verified'}
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                          {isBangla ? 'সার্বক্ষণিক যোগাযোগ নিশ্চিত' : 'Active and reachable line'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                      <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                          {isBangla ? 'Servexa প্ল্যাটফর্ম ক্লিয়ারেন্স' : 'Platform Trust Clearance'}
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                          {isBangla ? 'অভিযোগ ও শৃঙ্খলা নীতিমালা মেনে চলার চুক্তি' : 'Clean record & zero safety violations'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health Score Component */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {isBangla ? 'পারফরম্যান্স ও হেলথ স্কোর মেট্রিক্স' : 'Technician Health Score Metrics'}
                  </h3>
                  <HealthScoreCard score={technician.healthScore} compact={false} />
                </div>
              </div>
            )}

            {/* 4. PORTFOLIO TAB */}
            {activeTab === 'portfolio' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {technician.portfolio && technician.portfolio.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {technician.portfolio.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 overflow-hidden shadow-xs space-y-3 p-3"
                      >
                        <BeforeAfterSlider
                          beforeImage={item.beforeImage}
                          afterImage={item.afterImage}
                          aspectRatio="aspect-16/10"
                        />
                        <div className="px-1">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                            {isBangla ? item.titleBn : item.titleEn}
                          </h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                            {isBangla ? item.descriptionBn : item.descriptionEn}
                          </p>
                          <span className="text-[10px] text-zinc-400 mt-1.5 block">
                            {isBangla ? 'সম্পন্নের তারিখ: ' : 'Completed: '} {item.completedDate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-400">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-500" />
                    <p className="text-xs">{isBangla ? 'বর্তমানে কোনো কাজের স্যাম্পল ছবি যুক্ত নেই।' : 'No portfolio samples uploaded yet.'}</p>
                  </div>
                )}
              </div>
            )}

            {/* 5. REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                      {technician.rating}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 block">
                        {technician.reviewCount} {isBangla ? 'জন সন্তুষ্ট গ্রাহকের রেটিং' : 'Verified Reviews'}
                      </span>
                    </div>
                  </div>
                </div>

                {techReviews.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-xs">
                    {isBangla ? 'এখনো কোনো বিস্তারিত লিখিত রিভিউ নেই।' : 'No written reviews yet.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {techReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {rev.customerAvatar && (
                              <img
                                src={rev.customerAvatar}
                                alt={rev.customerName}
                                className="w-6 h-6 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <span className="font-bold text-xs text-zinc-900 dark:text-white">
                              {rev.customerName}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full font-bold">
                              {isBangla ? 'ভেরিফায়েড গ্রাহক' : 'Verified Customer'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{rev.overallRating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {rev.comment}
                        </p>
                        <span className="text-[10px] text-zinc-400 block pt-1">
                          {rev.createdAt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Sticky Action Bar */}
          <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`tel:${technician.phone}`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isBangla ? 'সরাসরি কল' : 'Call'}</span>
              </a>

              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBangla ? 'মেসেজ' : 'Chat'}</span>
              </button>

              <Link
                to={`/professionals/${technician.id}`}
                onClick={onClose}
                className="hidden md:inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors px-2"
              >
                <span>{isBangla ? 'ফুল প্রোফাইল' : 'Full Page'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {isBangla ? 'বন্ধ করুন' : 'Close'}
              </button>

              <Link
                to={`/book?techId=${technician.id}`}
                onClick={onClose}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-transform active:scale-95"
              >
                <span>{t.actions.bookNow}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {chatOpen && (
        <ChatModal
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          booking={chatBooking as any}
        />
      )}
    </>
  );
};
