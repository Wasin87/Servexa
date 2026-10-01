import React from 'react';
import { HowItWorks } from '../components/home/HowItWorks';
import { ShieldCheck, CheckCircle2, PhoneCall, HelpCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

export const HowItWorksPage: React.FC = () => {
  const { isBangla } = useLanguage();

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
          {isBangla ? 'Servexa কীভাবে কাজ করে?' : 'How Servexa Works'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
          {isBangla
            ? 'বাসা ও অফিসের দৈনন্দিন মেরামতে শতভাগ নির্ভরযোগ্য, ঝামেলামুক্ত এবং আধুনিক ডিজিটাল মিস্ত্রি বুকিং ব্যবস্থা।'
            : 'Reliable, transparent and seamless doorstep home maintenance services in Bangladesh.'}
        </p>
      </div>

      <HowItWorks />

      {/* Deep-dive FAQ / Guarantees */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          আমাদের স্বচ্ছ সেবার নীতিমালা
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>নির্ধারিত ভিজিটিং ফি</span>
            </h3>
            <p className="leading-relaxed">
              টেকনিশিয়ান সরাসরি উপস্থিত হয়ে সমস্যা চিহ্নিত করার জন্য নির্ধারিত ভিজিটিং ফি প্রদর্শিত থাকে। কোনো গোপন বা অযৌক্তিক সারপ্রাইজ ফি নেই।
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>৭ থেকে ৩০ দিনের ফ্রি ওয়ারেন্টি</span>
            </h3>
            <p className="leading-relaxed">
              সার্ভিস সম্পন্ন হওয়ার পর প্রতিটি কাজের নির্দিষ্ট ওয়ারেন্টি কার্যকর থাকে। কোনো সমস্যা দেখা দিলে সরাসরি অ্যাপ থেকে ১ ক্লিকে ওয়ারেন্টি রি-ভিজিট আবেদন করতে পারবেন।
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>ডিজিটাল ইনভয়েস ও স্বচ্ছ হিসাব</span>
            </h3>
            <p className="leading-relaxed">
              কাজ শেষ হওয়ার সাথে সাথে সিস্টেম থেকে বিস্তারিত ডিজিটাল ইনভয়েস ইস্যু করা হয়। শ্রম মজুরি ও মালামালের পৃথক হিসাব প্রিন্ট বা ডাউনলোড করা যায়।
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>সহজ বিরোধ নিষ্পত্তি (Dispute Support)</span>
            </h3>
            <p className="leading-relaxed">
              কাজের মান নিয়ে কোনো দ্বিধা থাকলে আমাদের নিরপেক্ষ আরবিট্রেশন টিম ২৪ ঘণ্টার মধ্যে অভিযোগ খতিয়ে দেখে সমাধান করে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
