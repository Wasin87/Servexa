import React from 'react';
import { Search, Users, CheckCircle, ShieldCheck, ArrowRight, Sparkles, Clock, Star, MapPin, Award } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from 'react-router-dom';

export const HowItWorks: React.FC = () => {
  const { isBangla } = useLanguage();

  const steps = [
    {
      num: '01',
      titleEn: 'Describe Problem or Pick Category',
      titleBn: 'সমস্যা লিখুন অথবা সার্ভিস বেছে নিন',
      descEn: 'Tell us in simple Bengali or English what is wrong or choose from 21+ certified home service categories.',
      descBn: 'সহজ বাংলা বা ইংরেজিতে আপনার সমস্যাটি লিখুন অথবা আমাদের ২১+ সার্ভিস ক্যাটাগরি থেকে সহজে বেছে নিন।',
      icon: Search,
      tagBn: 'ধাপ ১',
      tagEn: 'Step 1',
      perkBn: '১ মিনিটে ইনস্ট্যান্ট ম্যাচিং',
      perkEn: 'Instant 1-min matching',
      perkIcon: Clock,
      gradient: 'from-orange-500 to-amber-500'
    },
    {
      num: '02',
      titleEn: 'Compare & Choose Verified Expert',
      titleBn: 'মিস্ত্রি প্রোফাইল ও রিভিউ তুলনা করুন',
      descEn: 'Check NID-verified credentials, transparent ratings, customer reviews, and genuine visiting fees.',
      descBn: 'এনআইডি যাচাইকৃত প্রোফাইল, কাজের স্টার রিভিউ, পূর্বের কাজের পোর্টফোলিও ও রেট দেখে পছন্দের মিস্ত্রি বাছুন।',
      icon: Users,
      tagBn: 'ধাপ ২',
      tagEn: 'Step 2',
      perkBn: '১০০% এনআইডি ভেরিফাইড',
      perkEn: '100% NID Verified',
      perkIcon: ShieldCheck,
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      num: '03',
      titleEn: 'Doorstep Service at Your Schedule',
      titleBn: 'নির্ধারিত সময়ে দোরগোড়ায় সেবা',
      descEn: 'Technician arrives with proper safety equipment & tools. Track live dispatch status on map.',
      descBn: 'টেকনিশিয়ান প্রয়োজনীয় সেফটি গিয়ার ও টুলস নিয়ে আপনার ঠিকানায় পৌঁছাবেন। লাইভ স্ট্যাটাস দেখুন।',
      icon: CheckCircle,
      tagBn: 'ধাপ ৩',
      tagEn: 'Step 3',
      perkBn: 'লাইভ ম্যাপ ট্র্যাকিং',
      perkEn: 'Live GPS Tracking',
      perkIcon: MapPin,
      gradient: 'from-orange-600 to-rose-500'
    },
    {
      num: '04',
      titleEn: 'Digital Invoice & Free Warranty',
      titleBn: 'ডিজিটাল ইনভয়েস ও ফ্রি ওয়ারেন্টি',
      descEn: 'Pay via cash or bKash after work completion. Enjoy up to 30 days guaranteed free service warranty.',
      descBn: 'কাজ সন্তোষজনকভাবে সম্পন্নের পর ক্যাশ বা বিকাশে পে করুন। নিশ্চিত ৭-৩০ দিনের ফ্রি সার্ভিস ওয়ারেন্টি পান।',
      icon: Award,
      tagBn: 'ধাপ ৪',
      tagEn: 'Step 4',
      perkBn: '৩০ দিনের ফ্রি ওয়ারেন্টি',
      perkEn: '30-Day Free Warranty',
      perkIcon: Star,
      gradient: 'from-rose-500 to-amber-500'
    }
  ];

  return (
    <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Ambient Radials */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-3 mb-12 sm:mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/30 text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isBangla ? 'সহজ ও নিরাপদ ৪টি ধাপ' : 'Effortless 4-Step Process'}</span>
        </div>

        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
          {isBangla ? (
            <>
              কীভাবে <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">Servexa</span> কাজ করে?
            </>
          ) : (
            <>
              How <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">Servexa</span> Works
            </>
          )}
        </h2>

        <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
          {isBangla
            ? 'ঝামেলাহীন, শতভাগ স্বচ্ছ ও প্রযুক্তিবান্ধব উপায়ে মাত্র ১ মিনিটে মিস্ত্রি বুকিং ও নিশ্চিত সার্ভিস উপভোগ করুন'
            : 'From reporting your issue to guaranteed doorstep service with complete transparency and warranty.'}
        </p>
      </div>

      {/* 4 Professional Elevated Step Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const PerkIcon = step.perkIcon;
          return (
            <div
              key={idx}
              className={`group relative p-6 sm:p-7 rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm hover:shadow-2xl hover:border-orange-500/60 transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between overflow-hidden animate-fade-in-up animation-delay-${(idx + 1) * 100}`}
            >
              {/* Card Top Animated Gradient Highlight Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Faint Oversized Watermark Number */}
              <div className="absolute -top-3 -right-2 text-6xl sm:text-7xl font-black text-zinc-900/[0.04] dark:text-white/[0.04] select-none pointer-events-none font-mono tracking-tighter">
                {step.num}
              </div>

              <div>
                {/* Header: Icon & Step Badge */}
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${step.gradient} text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Distinct Step Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-extrabold text-xs">
                    <span>{isBangla ? step.tagBn : step.tagEn}</span>
                    <span className="font-mono text-sm opacity-80">#{step.num}</span>
                  </div>
                </div>

                {/* Step Title */}
                <h3 className="font-black text-base sm:text-lg text-zinc-900 dark:text-white mb-2.5 leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {isBangla ? step.titleBn : step.titleEn}
                </h3>

                {/* Step Description */}
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                  {isBangla ? step.descBn : step.descEn}
                </p>
              </div>

              {/* Card Footer: Perk Pill & Arrow */}
              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between relative z-10">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg">
                  <PerkIcon className="w-3.5 h-3.5 text-orange-500" />
                  <span>{isBangla ? step.perkBn : step.perkEn}</span>
                </div>

                <div className="w-7 h-7 rounded-full bg-orange-500/10 group-hover:bg-orange-500 text-orange-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA Action Button */}
      <div className="mt-12 sm:mt-16 text-center relative z-10">
        <Link
          to="/book"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm sm:text-base shadow-xl shadow-orange-600/30 transition-all hover:scale-102 active:scale-98 cursor-pointer"
        >
          <span>{isBangla ? 'এখনই মিস্ত্রি বুক করুন' : 'Start Your Booking Now'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};
