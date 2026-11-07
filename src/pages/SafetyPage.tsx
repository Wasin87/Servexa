import React from 'react';
import { ShieldCheck, AlertTriangle, Lock, PhoneCall, CheckCircle2, FileText, UserCheck, ShieldAlert, Sparkles, HeartHandshake } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

export const SafetyPage: React.FC = () => {
  const { isBangla } = useLanguage();

  const verificationPillars = [
    {
      icon: UserCheck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      border: 'border-emerald-500/30',
      titleBn: '১. জাতীয় পরিচয়পত্র (NID) যাচাই',
      titleEn: '1. National ID (NID) Verification',
      descBn: 'আমাদের প্রতিটি টেকনিশিয়ানের তথ্য বাংলাদেশ সরকারের জাতীয় পরিচয়পত্র ডাটাবেস ও বায়োমেট্রিক তথ্যের সাথে সরাসরি যাচাই করা হয়।',
      descEn: 'Every technician is strictly cross-referenced against the official National ID database, background checks, and verified credentials.',
      pointBn: '১০০% বায়োমেট্রিক ও এনআইডি ভেরিফাইড',
      pointEn: '100% Biometric & NID Verified'
    },
    {
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      border: 'border-blue-500/30',
      titleBn: '২. কারিগরি দক্ষতার প্র্যাকটিক্যাল টেস্ট',
      titleEn: '2. Practical Technical Assessment',
      descBn: 'অনুমোদন পাওয়ার আগে টেকনিশিয়ানকে ইলেকট্রিক্যাল, প্লাম্বিং বা এসি রিপেয়ার কাজের বাস্তব পরীক্ষা ও নিরাপত্তা গিয়ার পরিধানের প্রমাণ দিতে হয়।',
      descEn: 'Before onboarding, technicians undergo practical skill assessments and strictly follow standard household safety equipment protocols.',
      pointBn: 'সার্টিফাইড স্কিল ও সেফটি গিয়ার',
      pointEn: 'Certified Skill & Safety Gear'
    },
    {
      icon: Lock,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      border: 'border-orange-500/30',
      titleBn: '৩. গ্রাহকের ডাটা ও প্রাইভেসির পূর্ণ সুরক্ষা',
      titleEn: '3. Data Privacy & Customer Protection',
      descBn: 'গ্রাহকের ফোন নম্বর ও ঠিকানা শুধুমাত্র বুকিং চলাকালীন জরুরি প্রয়োজনে ব্যবহার হয় এবং সম্পূর্ণ গোপনীয় ও সুরক্ষিত রাখা হয়।',
      descEn: 'Your contact info and address are encrypted and only accessible during an active booking window, ensuring utmost privacy.',
      pointBn: 'সম্পূর্ণ এনক্রিপ্টেড ও সুরক্ষিত ডাটা',
      pointEn: 'Fully Encrypted & Private Data'
    }
  ];

  const safetyGuidelines = [
    {
      titleBn: 'প্রোফাইল ফটো ও এনআইডি ব্যাজ মিলিয়ে নিন',
      titleEn: 'Verify Profile Photo & ID Badge',
      descBn: 'মিস্ত্রি বাসায় পৌঁছালে Servexa অ্যাপে প্রদর্শিত ছবি, নাম এবং নিরাপত্তা ব্যাজের সাথে চেহারা মিলিয়ে নিশ্চিত হোন।',
      descEn: 'When the expert arrives, match their photo, name, and safety badge directly against your Servexa app booking card.'
    },
    {
      titleBn: 'কাজের পূর্বেই খরচ ও পার্টস স্পষ্ট করুন',
      titleEn: 'Transparent Quotes Before Work Begins',
      descBn: 'কাজ শুরুর পূর্বেই আনুমানিক সার্ভিস চার্জ ও প্রয়োজনীয় যন্ত্রাংশের মূল্য নিয়ে টেকনিশিয়ানের সাথে খোলামেলা আলোচনা করে নিন।',
      descEn: 'Clarify estimated labor charges and replacement component pricing with the technician before work commences.'
    },
    {
      titleBn: 'ডিজিটাল ইনভয়েস দেখে অর্থ পরিশোধ',
      titleEn: 'Pay via Verified Digital Invoice',
      descBn: 'কাজ সন্তোষজনকভাবে সম্পন্ন হওয়ার পর অ্যাপের তৈরি ডিজিটাল ইনভয়েস যাচাই করে ক্যাশ বা বিকাশে সহজে পে করুন।',
      descEn: 'After the job is thoroughly tested and inspected, confirm the final automated digital invoice and pay via Cash or bKash.'
    },
    {
      titleBn: '২৪/৭ সাপোর্ট ও সার্ভিস ওয়ারেন্টি',
      titleEn: '24/7 Dedicated Support & Warranty',
      descBn: 'যেকোনো অসঙ্গতি বা সেবায় ত্রুটি হলে তাৎক্ষণিক আমাদের হেল্পলাইনে জানান। Servexa-এর প্রতিটি কাজের সাথে রয়েছে ফ্রি ওয়ারেন্টি।',
      descEn: 'Report any issues instantly to our support hotline. All eligible repairs include 7-30 days guaranteed warranty protection.'
    }
  ];

  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-3.5">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black tracking-wide border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4" />
          <span>{isBangla ? 'Servexa নিরাপত্তা ও সুরক্ষা কেন্দ্র' : 'Servexa Trust & Safety Center'}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
          {isBangla ? 'গ্রাহক ও কর্মীর নিরাপত্তা নীতিমালা' : 'Customer & Professional Safety Standards'}
        </h1>
        <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {isBangla
            ? 'আপনার বাসাবাড়িতে কারিগরি সেবা গ্রহণের সময় নিরাপত্তা ও আস্থা আমাদের সর্বোচ্চ অগ্রাধিকার। জেনে নিন কীভাবে আমরা শতভাগ নিরাপত্তা নিশ্চিত করি।'
            : 'Your family and home safety are our highest priorities. Discover how our multi-tier verification and warranty systems keep you protected.'}
        </p>
      </div>

      {/* Fraud Prevention Security Alert Box */}
      <div className="p-6 sm:p-7 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 dark:border-amber-500/40 flex flex-col sm:flex-row items-start gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 text-xs sm:text-sm text-amber-950 dark:text-amber-200">
          <h3 className="font-black text-sm sm:text-base flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <span>🚨 {isBangla ? 'জরুরি আর্থিক ও ওটিপি সতর্কতা' : 'Crucial Financial & OTP Fraud Warning'}</span>
          </h3>
          <p className="leading-relaxed">
            {isBangla
              ? 'কোনো টেকনিশিয়ান বা প্ল্যাটফর্ম প্রতিনিধির সাথে আপনার বিকাশ/নগদ পিন (PIN), ওটিপি (OTP), ব্যাংক কার্ড নম্বর বা পাসওয়ার্ড কখনো শেয়ার করবেন না। Servexa কখনোই কোনো গ্রাহকের গোপন পিন বা ওটিপি জানতে চায় না।'
              : 'Never share your bKash/Nagad PIN, SMS OTP, credit card credentials, or personal passwords with any technician or caller. Servexa representatives will NEVER ask for your confidential PIN or OTP.'}
          </p>
        </div>
      </div>

      {/* Verification Pillars Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {verificationPillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className={`p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4`}
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl ${pillar.bg} ${pillar.color} flex items-center justify-center mb-4 shadow-xs`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-white mb-2 leading-snug">
                  {isBangla ? pillar.titleBn : pillar.titleEn}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {isBangla ? pillar.descBn : pillar.descEn}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isBangla ? pillar.pointBn : pillar.pointEn}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safe Booking Guidelines Grid */}
      <div className="p-6 sm:p-9 rounded-3xl bg-stone-100/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white">
              {isBangla ? 'গ্রাহকদের জন্য নিরাপদ বুকিং নির্দেশিকা' : 'Safe Doorstep Service Guidelines'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              {isBangla ? 'প্রতিটি সার্ভিস ভিজিটের সময় এই ৪টি বিষয় অনুসরণ করুন' : 'Keep these 4 best practices in mind during every home service visit'}
            </p>
          </div>
          <Link
            to="/emergency"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all shrink-0"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isBangla ? 'জরুরি হেল্পলাইন' : 'Emergency Hotline'}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {safetyGuidelines.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
                {idx + 1}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                  {isBangla ? item.titleBn : item.titleEn}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {isBangla ? item.descBn : item.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
