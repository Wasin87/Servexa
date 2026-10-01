import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Award,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Heart
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { HealthScoreCard } from '../components/common/HealthScoreCard';
import { BeforeAfterSlider } from '../components/common/BeforeAfterSlider';
import { ChatModal } from '../components/common/ChatModal';

export const ProfessionalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { technicians, categories, reviews, toggleFavorite, isFavorite, bookings } = useApp();
  const { t, isBangla } = useLanguage();

  const [chatOpen, setChatOpen] = useState(false);

  const technician = technicians.find((tech) => tech.id === id);

  if (!technician) {
    return (
      <div className="py-20 text-center text-zinc-500">
        <p className="text-lg font-bold">মিস্ত্রি প্রোফাইল খুঁজে পাওয়া যায়নি।</p>
        <Link to="/professionals" className="mt-4 inline-block text-orange-600 underline text-sm">
          সকল মিস্ত্রিদের তালিকায় ফিরে যান
        </Link>
      </div>
    );
  }

  const techReviews = reviews.filter((r) => r.technicianId === technician.id);
  const isSaved = isFavorite(technician.id);

  // Fake dummy active booking if user wants to chat directly
  const activeBooking = bookings.find((b) => b.technicianId === technician.id) || {
    id: `book-chat-${technician.id}`,
    bookingNumber: 'KGO-CHAT',
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

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t.actions.back}</span>
      </button>

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-8 items-start">
          {/* Avatar and Info */}
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <div className="relative">
              <img
                src={technician.avatar}
                alt={technician.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-orange-500 shadow-md"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 ${
                  technician.availability === 'available'
                    ? 'bg-emerald-500'
                    : technician.availability === 'busy'
                    ? 'bg-amber-500'
                    : 'bg-zinc-400'
                }`}
                title={technician.availability}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                  {technician.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t.tech.verifiedPro}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{technician.primaryArea}, {technician.city}</span>
                <span>·</span>
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{technician.workingHours}</span>
              </div>

              {/* Rating and Experience Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{technician.rating}</span>
                  <span className="text-zinc-400 font-normal">({technician.reviewCount} {t.tech.reviews})</span>
                </div>
                <span>·</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {technician.experienceYears} {t.tech.experience}
                </span>
                <span>·</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {technician.warrantyPeriodDays} {t.tech.warranty}
                </span>
              </div>
            </div>
          </div>

          {/* Action Callouts */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            <div className="text-left lg:text-right">
              <div className="text-xs text-zinc-400">{t.tech.visitingFee}</div>
              <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-500">
                ৳{technician.visitingFee}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/book?techId=${technician.id}`}
                className="flex-1 lg:flex-initial px-6 py-3 text-center text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-md transition-all hover:scale-102"
              >
                {t.actions.bookNow}
              </Link>
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                title={t.actions.sendMessage}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(technician.id)}
                className={`p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                  isSaved ? 'text-rose-500' : 'text-zinc-400'
                }`}
                title="Save Favorite"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Verification Status Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{t.tech.phoneVerified}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{t.tech.nidVerified}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{t.tech.skillVerified}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{t.tech.platformVerified}</span>
          </div>
        </div>
      </div>

      {/* Grid: Details, Health Score & Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: About & Skills */}
        <div className="lg:col-span-7 space-y-6">
          {/* About */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {t.tech.about}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {isBangla ? technician.aboutBn : technician.aboutEn}
            </p>
          </div>

          {/* Skills & Service Areas */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500 mb-2">
                {t.tech.skills}
              </h3>
              <div className="flex flex-wrap gap-2">
                {technician.skills.map((skillId) => {
                  const cat = categories.find((c) => c.id === skillId);
                  return (
                    <span
                      key={skillId}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/40"
                    >
                      {cat ? (isBangla ? cat.nameBn : cat.nameEn) : skillId}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500 mb-2">
                {t.tech.serviceAreas}
              </h3>
              <div className="flex flex-wrap gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                {technician.serviceAreas.map((area, idx) => (
                  <span key={area} className="bg-stone-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio (Before / After) */}
          {technician.portfolio.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {t.tech.portfolio}
              </h3>

              <div className="space-y-6">
                {technician.portfolio.map((item) => (
                  <div key={item.id} className="space-y-3">
                    <h4 className="font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
                      {isBangla ? item.titleBn : item.titleEn}
                    </h4>
                    <BeforeAfterSlider
                      beforeImage={item.beforeImage}
                      afterImage={item.afterImage}
                    />
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {isBangla ? item.descriptionBn : item.descriptionEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Health Score Card & Customer Reviews */}
        <div className="lg:col-span-5 space-y-6">
          {/* Health Score Component */}
          <HealthScoreCard score={technician.healthScore} />

          {/* Verified Customer Reviews */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {t.tech.reviews} ({techReviews.length})
              </h3>
              <div className="flex items-center gap-1 font-bold text-xs text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{technician.rating} / 5.0</span>
              </div>
            </div>

            {techReviews.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">
                এখনও কোনো রিভিউ যুক্ত করা হয়নি।
              </p>
            ) : (
              <div className="space-y-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                {techReviews.map((rev) => (
                  <div key={rev.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.customerAvatar}
                          alt={rev.customerName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                          {rev.customerName}
                        </span>
                      </div>
                      <div className="flex items-center text-amber-400 text-xs">
                        {[...Array(rev.overallRating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                      "{rev.comment}"
                    </p>

                    <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                      <span>{rev.serviceName}</span>
                      <span>{rev.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {chatOpen && (
        <ChatModal
          booking={activeBooking as any}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
};
