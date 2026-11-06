import React, { useState } from 'react';
import {
  Search,
  Users,
  CheckCircle,
  Receipt,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  HelpCircle,
  Sparkles,
  Zap,
  Lock,
  Clock,
  ThumbsUp,
  Award,
  ChevronDown,
  Wrench,
  DollarSign,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

export const HowItWorksPage: React.FC = () => {
  const { t, isBangla } = useLanguage();
  const [activeAudience, setActiveAudience] = useState<'customer' | 'technician'>('customer');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const customerSteps = [
    {
      num: '01',
      titleEn: 'Describe Your Issue or Choose Category',
      titleBn: 'সমস্যা লিখুন অথবা সার্ভিস নির্বাচন করুন',
      descEn: 'Type your repair problem in simple everyday Bengali or English, or browse our 21+ certified home maintenance trades.',
      descBn: 'সহজ বাংলা বা ইংরেজিতে আপনার সমস্যাটি লিখুন অথবা আমাদের ২১+ গৃহস্থালি ও কারিগরি সার্ভিস তালিকা থেকে বেছে নিন।',
      icon: Search,
      highlightEn: 'Instant AI Smart Suggestion',
      highlightBn: 'তাৎক্ষণিক এআই সমস্যা বিশ্লেষণ'
    },
    {
      num: '02',
      titleEn: 'Select & Compare Verified Specialists',
      titleBn: 'যাচাইকৃত মিস্ত্রি তুলনা ও পছন্দ করুন',
      descEn: 'Inspect NID-checked badges, authentic client star ratings, transparent visiting rates, and live health metrics.',
      descBn: 'জাতীয় পরিচয়পত্র যাচাইকৃত ব্যাজ, বাস্তব গ্রাহকদের ৫-স্টার রেটিং, কাজের পূর্ব অভিজ্ঞতা ও স্বচ্ছ ভিজিটিং ফি দেখে মিস্ত্রি বেছে নিন।',
      icon: Users,
      highlightEn: '100% Background Checked',
      highlightBn: '১০০% আইডি ও স্কিল ভেরিফাইড'
    },
    {
      num: '03',
      titleEn: 'Doorstep Service at Your Preferred Slot',
      titleBn: 'আপনার সুবিধাজনক সময়ে দোরগোড়ায় সেবা',
      descEn: 'The professional arrives on time with modern diagnostic tools and safety equipment. Track status live in-app.',
      descBn: 'নির্ধারিত সময়ে মিস্ত্রি প্রয়োজনীয় যন্ত্রপাতি ও সেফটি গিয়ার নিয়ে আপনার ঠিকানায় পৌঁছাবেন। লাইভ স্ট্যাটাস অ্যাপে ট্র্যাক করুন।',
      icon: CheckCircle,
      highlightEn: 'Real-Time Status Updates',
      highlightBn: 'লাইভ স্ট্যাটাস ট্র্যাকিং'
    },
    {
      num: '04',
      titleEn: 'Digital Invoice & 7-30 Days Free Warranty',
      titleBn: 'ডিজিটাল ইনভয়েস ও ফ্রি ওয়ারেন্টি গ্যারান্টি',
      descEn: 'Pay securely after full satisfaction via Cash or bKash. Enjoy up to 30 days of hassle-free service warranty.',
      descBn: 'কাজ সম্পূর্ণ ও সন্তুষ্টির পর ক্যাশ বা বিকাশে বিল পরিশোধ করুন। প্রতিটি কাজের সাথে পাচ্ছেন ৭ থেকে ৩০ দিনের ফ্রি ওয়ারেন্টি।',
      icon: Receipt,
      highlightEn: '100% Money Safety Escrow',
      highlightBn: 'স্বচ্ছ মূল্য ও ওয়ারেন্টি গ্যারান্টি'
    }
  ];

  const technicianSteps = [
    {
      num: '01',
      titleEn: 'Free Online Registration & KYC Verification',
      titleBn: 'বিনামূল্যে অ্যাকাউন্ট ও এনআইডি ভেরিফিকেশন',
      descEn: 'Sign up with your phone number, submit your NID and trade skills to become a certified Servexa partner.',
      descBn: 'মোবাইল নম্বর দিয়ে সাইন আপ করুন, জাতীয় পরিচয়পত্র (NID) ও দক্ষতার বিবরণ জমা দিয়ে ভেরিফায়েড পার্টনার হন।',
      icon: UserCheck,
      highlightEn: 'Zero Joining Fee',
      highlightBn: 'কোনো জয়েনিং ফি নেই'
    },
    {
      num: '02',
      titleEn: 'Receive Instant Nearby Job Requests',
      titleBn: 'কাছাকাছি এলাকা থেকে সরাসরি কাজের রিকোয়েস্ট',
      descEn: 'Get notified of customer repair jobs in your neighborhood. Choose and accept jobs matching your schedule.',
      descBn: 'আপনার সার্ভিস এরিয়ার মধ্যে গ্রাহকদের সরাসরি বুকিং রিকোয়েস্ট গ্রহণ করুন এবং সুবিধাজনক সময়ে কাজ করুন।',
      icon: Zap,
      highlightEn: 'Direct Client Booking',
      highlightBn: 'সরাসরি কাস্টমার কানেকশন'
    },
    {
      num: '03',
      titleEn: 'Provide Professional Service & Issue Invoices',
      titleBn: 'কাজ সম্পন্ন করুন ও ডিজিটাল ইনভয়েস তৈরি করুন',
      descEn: 'Diagnose problems, provide fair labor quotes, complete repairs and generate itemized digital receipts in-app.',
      descBn: 'সরাসরি পরিদর্শন করে উপযুক্ত কোটেশন দিন, কাজ সম্পন্ন করে অ্যাপ থেকেই এক ক্লিকে ডিজিটাল ইনভয়েস তৈরি করুন।',
      icon: Wrench,
      highlightEn: 'Itemized Billing Tool',
      highlightBn: 'স্বয়ংক্রিয় ইনভয়েস জেনারেটর'
    },
    {
      num: '04',
      titleEn: 'Instant Earnings Payout & Reputation Growth',
      titleBn: 'দ্রুত পেমেন্ট ও বিশ্বস্ত প্রোফাইল তৈরি',
      descEn: 'Receive direct payments from customers, build authentic 5-star reviews, and grow your daily income reliably.',
      descBn: 'কাজের শেষে সরাসরি পেমেন্ট নিন, ৫-স্টার রিভিউ অর্জন করে আপনার প্রোফাইল রেটিং ও প্রতিদিনের আয় বৃদ্ধি করুন।',
      icon: DollarSign,
      highlightEn: '100% Direct Income',
      highlightBn: 'স্বচ্ছ ও নিরাপদ আয়'
    }
  ];

  const guarantees = [
    {
      titleEn: 'Transparent Fixed Visiting Fee',
      titleBn: 'নির্ধারিত স্বচ্ছ ভিজিটিং ফি',
      descEn: 'Every technician lists their visiting charge upfront. Zero hidden travel surprises or unexpected fees.',
      descBn: 'সমস্যা পরীক্ষা ও পরিদর্শনের প্রারম্ভিক চার্জ আগেই নির্ধারিত থাকে। কোনো প্রকার গোপন বা অপ্রত্যাশিত চার্জ নেই।',
      icon: DollarSign
    },
    {
      titleEn: '7 to 30 Days Free Warranty',
      titleBn: '৭ থেকে ৩০ দিনের ফ্রি ওয়ারেন্টি',
      descEn: 'If the same problem reoccurs within the warranty window, we dispatch free re-service with priority.',
      descBn: 'সার্ভিস নেওয়ার পর নির্দিষ্ট মেয়াদের মধ্যে একই সমস্যায় পুনরায় বিনামূল্যে টেকনিশিয়ান রি-ভিজিট গ্যারান্টি।',
      icon: ShieldCheck
    },
    {
      titleEn: 'Digital Itemized Invoicing',
      titleBn: 'ডিজিটাল ইনভয়েস ও স্বচ্ছ হিসাব',
      descEn: 'Official breakdown of labor charges and spare parts cost issued directly to your app account and SMS.',
      descBn: 'শ্রম মজুরি ও মালামালের পৃথক ডিজিটাল রসিদ সরাসরি আপনার প্রোফাইলে সংরক্ষিত থাকে এবং ডাউনলোড করা যায়।',
      icon: Receipt
    },
    {
      titleEn: 'Dispute Arbitration Support',
      titleBn: 'নিরপেক্ষ বিরোধ নিষ্পত্তি টিম',
      descEn: 'Our dedicated support team reviews customer and technician disputes within 24 hours to ensure fair resolution.',
      descBn: 'কাজের মান বা চার্জ নিয়ে কোনো অসন্তোষ থাকলে ২৪ ঘণ্টার মধ্যে নিরপেক্ষ সাপোর্ট টিম সমস্যা সমাধান করে।',
      icon: Lock
    }
  ];

  const faqs = [
    {
      qEn: 'How is the service charge determined?',
      qBn: 'সার্ভিসের মোট বিল কীভাবে নির্ধারিত হয়?',
      aEn: 'The technician inspects the problem upon arrival, charges the fixed visiting fee, and provides an itemized labor + spare parts estimate for your approval before starting repair.',
      aBn: 'টেকনিশিয়ান উপস্থিত হয়ে সমস্যা পরীক্ষা করার পর নির্ধারিত ভিজিটিং ফি এবং কাজের মোট শ্রম মজুরি ও মালামালের খরচ জানিয়ে আপনার সম্মতি নিয়ে কাজ শুরু করেন।'
    },
    {
      qEn: 'What if the problem is not fixed properly?',
      qBn: 'কাজ সম্পন্ন হওয়ার পর পুনরায় একই সমস্যা হলে কী করব?',
      aEn: 'Every completed service includes a 7 to 30 days warranty. Simply click "Claim Warranty" on your booking card, and a technician will re-visit free of charge.',
      aBn: 'প্রতিটি সার্ভিসে ৭ থেকে ৩০ দিনের ফ্রি ওয়ারেন্টি রয়েছে। অ্যাপের বুকিং হিস্ট্রি থেকে "ওয়ারেন্টি ক্লেইম" বাটনে ক্লিক করলেই ফ্রি রি-সার্ভিস দেওয়া হবে।'
    },
    {
      qEn: 'Are technicians background checked and verified?',
      qBn: 'টেকনিশিয়ানরা কি বিশ্বস্ত এবং ভেরিফায়েড?',
      aEn: 'Yes! Every technician undergoes physical National ID (NID) authentication, active phone OTP verification, and practical skills testing before being activated on Servexa.',
      aBn: 'হ্যাঁ! Servexa-এর প্রতিটি টেকনিশিয়ানের জাতীয় পরিচয়পত্র (NID), পুলিশ ক্লিয়ারেন্স ও প্র্যাকটিক্যাল কাজের দক্ষতা যাচাই করার পরেই আইডি সক্রিয় করা হয়।'
    },
    {
      qEn: 'Can I pay online using bKash or Nagad?',
      qBn: 'পেমেন্ট কি বিকাশ বা নগদে করা যাবে?',
      aEn: 'Yes, you can pay directly to the technician via Cash on Service or using bKash and Nagad mobile payments.',
      aBn: 'হ্যাঁ, কাজ শেষে সন্তুষ্ট হওয়ার পর সরাসরি ক্যাশে অথবা বিকাশ ও নগদের মাধ্যমে খুব সহজেই বিল পরিশোধ করতে পারবেন।'
    }
  ];

  const activeSteps = activeAudience === 'customer' ? customerSteps : technicianSteps;

  return (
    <div className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Hero Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 text-xs font-bold border border-orange-200 dark:border-orange-800">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>{isBangla ? 'স্বচ্ছ ও আধুনিক সেবার মডেল' : 'Transparent & Modern Process'}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
          {isBangla ? 'Servexa কীভাবে কাজ করে?' : 'How Servexa Works'}
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {isBangla
            ? 'বাসা ও অফিসের দৈনন্দিন মেরামতে শতভাগ নির্ভরযোগ্য, ঝামেলামুক্ত এবং প্রযুক্তি-চালিত আধুনিক মিস্ত্রি বুকিং ব্যবস্থা।'
            : 'Reliable, transparent and seamless doorstep home & technical maintenance ecosystem in Bangladesh.'}
        </p>

        {/* Audience Toggle Tabs (Customer vs Technician) */}
        <div className="inline-flex p-1.5 rounded-2xl bg-stone-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-inner mt-4">
          <button
            type="button"
            onClick={() => setActiveAudience('customer')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeAudience === 'customer'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            👤 {isBangla ? 'গ্রাহকদের জন্য (For Customers)' : 'For Customers'}
          </button>
          <button
            type="button"
            onClick={() => setActiveAudience('technician')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeAudience === 'technician'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            👷 {isBangla ? 'টেকনিশিয়ানদের জন্য (For Technicians)' : 'For Technicians'}
          </button>
        </div>
      </div>

      {/* 4 Step Process Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeSteps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="relative p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-xl hover:border-orange-500/50 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-3xl font-black text-zinc-200 dark:text-zinc-800 select-none tracking-tighter">
                    {step.num}
                  </span>
                </div>

                <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md mb-2">
                  {isBangla ? step.highlightBn : step.highlightEn}
                </div>

                <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 mb-2 leading-snug">
                  {isBangla ? step.titleBn : step.titleEn}
                </h3>

                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {isBangla ? step.descBn : step.descEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Standards Section */}
      <div className="bg-stone-50 dark:bg-zinc-900/60 rounded-3xl p-6 sm:p-10 border border-zinc-200 dark:border-zinc-800 space-y-8">
        <div className="max-w-2xl">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">
            {isBangla ? 'গ্রাহক সুরক্ষা ও নীতি' : 'Customer Protection & Policies'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {isBangla ? 'আমাদের ৪টি অনন্য সেবামূলক প্রতিশ্রুতি' : 'Our 4 Core Service Guarantees'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guarantees.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 flex items-start gap-4 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white mb-1">
                    {isBangla ? g.titleBn : g.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {isBangla ? g.descBn : g.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-1.5">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            {isBangla ? 'সাধারণ জিজ্ঞাসা' : 'Got Questions?'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {isBangla ? 'সচরাচর জিজ্ঞাসিত প্রশ্নোত্তর' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  <span>{isBangla ? faq.qBn : faq.qEn}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                    {isBangla ? faq.aBn : faq.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action CTA Banner */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isBangla ? 'আজই সঠিক মিস্ত্রি বুক করুন' : 'Ready to Experience Hassle-Free Repair?'}
          </h3>
          <p className="text-xs sm:text-sm text-orange-100 max-w-xl">
            {isBangla
              ? 'আইডি ও স্কিল ভেরিফাইড টেকনিশিয়ানদের রেটিং ও স্বচ্ছ ভিজিটিং ফি দেখে এখনই সেবা নিন।'
              : 'Browse 21+ verified service categories or get immediate emergency technician dispatch in Dhaka.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/professionals"
            className="px-6 py-3 rounded-xl bg-white text-orange-700 font-bold text-xs sm:text-sm shadow-md hover:bg-orange-50 transition-transform active:scale-95"
          >
            {isBangla ? 'মিস্ত্রি তালিকা দেখুন' : 'Browse Professionals'}
          </Link>
          <Link
            to="/become-professional"
            className="px-6 py-3 rounded-xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-xs transition-colors"
          >
            {isBangla ? 'মিস্ত্রি হিসেবে যোগ দিন' : 'Join as Pro'}
          </Link>
        </div>
      </div>
    </div>
  );
};
