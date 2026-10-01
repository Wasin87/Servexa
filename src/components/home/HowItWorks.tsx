import React from 'react';
import { Search, Users, CheckCircle, Receipt, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from 'react-router-dom';

export const HowItWorks: React.FC = () => {
  const { isBangla } = useLanguage();

  const steps = [
    {
      num: '০১',
      titleEn: 'Describe Problem or Pick Category',
      titleBn: 'সমস্যা লিখুন অথবা সার্ভিস বাছুন',
      descEn: 'Tell us in simple Bengali or English what is wrong or choose from 21+ home service categories.',
      descBn: 'সহজ বাংলা বা ইংরেজিতে আপনার সমস্যাটি লিখুন অথবা আমাদের ২১+ সার্ভিস থেকে বেছে নিন।',
      icon: Search
    },
    {
      num: '০২',
      titleEn: 'Compare & Choose Verified Expert',
      titleBn: 'মিস্ত্রি যাচাই ও রেটিং তুলনা করুন',
      descEn: 'Check verified credentials, transparent health score, ratings, and genuine visiting fees.',
      descBn: 'যাচাইকৃত জাতীয় পরিচয়পত্র, স্বাস্থ্য স্কোর, পূর্বের কাজের রিভিউ ও ভিজিটিং ফি দেখে মিস্ত্রি বেছে নিন।',
      icon: Users
    },
    {
      num: '০৩',
      titleEn: 'Doorstep Service at Your Time',
      titleBn: 'নির্ধারিত সময়ে দোরগোড়ায় সেবা',
      descEn: 'Technician arrives with proper safety equipment and tools. Track status live in app.',
      descBn: 'টেকনিশিয়ান প্রয়োজনীয় যন্ত্রপাতি নিয়ে আপনার ঠিকানায় উপস্থিত হবেন। অ্যাপে লাইভ স্ট্যাটাস দেখুন।',
      icon: CheckCircle
    },
    {
      num: '০৪',
      titleEn: 'Digital Invoice & Free Warranty',
      titleBn: 'ডিজিটাল ইনভয়েস ও সার্ভিস ওয়ারেন্টি',
      descEn: 'Pay via cash or bKash after work is done. Enjoy up to 30 days free service warranty.',
      descBn: 'কাজ শেষে ক্যাশ বা বিকাশে পরিশোধ করুন। নিশ্চিত ৭-৩০ দিনের ফ্রি সার্ভিস ওয়ারেন্টির সুবিধা পান।',
      icon: Receipt
    }
  ];

  return (
    <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center space-y-2 mb-12">
        <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
          {isBangla ? 'সহজ ৪টি ধাপ' : 'Effortless Process'}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          {isBangla ? 'কীভাবে Servexa কাজ করে?' : 'How Servexa Works'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {isBangla
            ? 'ঝামেলাহীন, স্বচ্ছ ও প্রযুক্তিবান্ধব প্রক্রিয়ায় মিস্ত্রি বুকিং'
            : 'From reporting your issue to getting guaranteed service at your doorstep.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="relative p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-base">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-zinc-200 dark:text-zinc-800 select-none">
                    {step.num}
                  </span>
                </div>

                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">
                  {isBangla ? step.titleBn : step.titleEn}
                </h3>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {isBangla ? step.descBn : step.descEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Link
          to="/book"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-102"
        >
          <span>{isBangla ? 'এখনই বুক করুন' : 'Start Your Booking'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};
