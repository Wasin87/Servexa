import React from 'react';
import { Search, Users, CheckCircle, Receipt, ArrowRight, Sparkles } from 'lucide-react';
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
      descBn: 'সহজ বাংলা বা ইংরেজিতে আপনার সমস্যাটি লিখুন অথবা আমাদের ২১+ সার্ভিস ক্যাটাগরি থেকে বেছে নিন।',
      icon: Search,
      tagBn: 'ধাপ ১',
      tagEn: 'Step 1'
    },
    {
      num: '02',
      titleEn: 'Compare & Choose Verified Expert',
      titleBn: 'মিস্ত্রি প্রোফাইল ও রিভিউ তুলনা করুন',
      descEn: 'Check NID-verified credentials, transparent ratings, customer reviews, and genuine visiting fees.',
      descBn: 'এনআইডি যাচাইকৃত প্রোফাইল, কাজের স্টার রিভিউ, পূর্বের কাজের পোর্লিও ও ভিজিটিং ফি দেখে মিস্ত্রি বাছুন।',
      icon: Users,
      tagBn: 'ধাপ ২',
      tagEn: 'Step 2'
    },
    {
      num: '03',
      titleEn: 'Doorstep Service at Your Schedule',
      titleBn: 'নির্ধারিত সময়ে দোরগোড়ায় সেবা',
      descEn: 'Technician arrives with proper safety equipment & tools. Track live dispatch status on map.',
      descBn: 'টেকনিশিয়ান প্রয়োজনীয় সেফটি গিয়ার ও টুলস নিয়ে আপনার ঠিকানায় পৌঁছাবেন। লাইভ স্ট্যাটাস দেখুন।',
      icon: CheckCircle,
      tagBn: 'ধাপ ৩',
      tagEn: 'Step 3'
    },
    {
      num: '04',
      titleEn: 'Digital Invoice & Free Warranty',
      titleBn: 'ডিজিটাল ইনভয়েস ও ফ্রি ওয়ারেন্টি',
      descEn: 'Pay via cash or bKash after work completion. Enjoy up to 30 days guaranteed free service warranty.',
      descBn: 'কাজ সন্তোষজনকভাবে সম্পন্নের পর ক্যাশ বা বিকাশে পে করুন। নিশ্চিত ৭-৩০ দিনের ফ্রি সার্ভিস ওয়ারেন্টি পান।',
      icon: Receipt,
      tagBn: 'ধাপ ৪',
      tagEn: 'Step 4'
    }
  ];

  return (
    <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center space-y-2 mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isBangla ? 'সহজ ৪টি ধাপ' : 'Effortless Process'}</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
          {isBangla ? 'কীভাবে Servexa কাজ করে?' : 'How Servexa Works'}
        </h2>

        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
          {isBangla
            ? 'ঝামেলাহীন, শতভাগ স্বচ্ছ ও প্রযুক্তিবান্ধব উপায়ে মাত্র ১ মিনিটে মিস্ত্রি বুকিং'
            : 'From reporting your issue to getting guaranteed service at your doorstep in minutes.'}
        </p>
      </div>

      {/* 4 Professional Step Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="group relative p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-2xl hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
            >
              {/* Card Top Accent Glow Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-[#FA4D00] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div>
                {/* Header Badge & Large Numbering Visualizer */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Distinct High-Contrast Step Number Badge */}
                  <div className="flex items-center gap-1.5 bg-gradient-to-br from-orange-600 to-amber-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md">
                    <span className="opacity-90">{isBangla ? step.tagBn : step.tagEn}</span>
                    <span className="text-amber-200 font-mono text-sm ml-0.5">{step.num}</span>
                  </div>
                </div>

                {/* Step Title */}
                <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white mb-2 leading-snug">
                  {isBangla ? step.titleBn : step.titleEn}
                </h3>

                {/* Step Description */}
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {isBangla ? step.descBn : step.descEn}
                </p>
              </div>

              {/* Step Flow Footprint Indicator */}
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-bold text-orange-600 dark:text-orange-400">
                <span>{isBangla ? `ধাপ ${idx + 1} / ৪` : `Step ${idx + 1} of 4`}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA Action */}
      <div className="mt-10 sm:mt-14 text-center">
        <Link
          to="/book"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-orange-600/30 transition-all hover:scale-102 active:scale-98 cursor-pointer"
        >
          <span>{isBangla ? 'এখনই মিস্ত্রি বুক করুন' : 'Start Your Booking Now'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};
