import React from 'react';
import { ShieldCheck, AlertTriangle, Lock, PhoneCall, CheckCircle2, FileText, UserCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const SafetyPage: React.FC = () => {
  const { isBangla } = useLanguage();

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Servexa Trust & Safety</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
          {isBangla ? 'গ্রাহক ও কর্মীর নিরাপত্তা নীতিমালা' : 'Customer & Professional Safety Center'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          {isBangla
            ? 'আপনার বাসাবাড়িতে অপরিচিত কাউকে প্রবেশ করানোর সময় নিরাপত্তা সর্বোচ্চ প্রাধান্য পায়। জেনে নিন আমরা কীভাবে নিরাপত্তা ও বিশ্বাসযোগ্যতা নিশ্চিত করি।'
            : 'Your family and home safety are our top priority. Learn how our multi-tier verification protects you.'}
        </p>
      </div>

      {/* Prominent Red-Amber Security Alert Box */}
      <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/80 flex items-start gap-4">
        <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
        <div className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
          <h3 className="font-extrabold text-sm">
            🚨 জরুরি আর্থিক সতর্কতা (Fraud Prevention Notice)
          </h3>
          <p className="leading-relaxed">
            কোনো টেকনিশিয়ান বা প্ল্যাটফর্ম প্রতিনিধির সাথে আপনার বিকাশ/নগদ পিন (PIN), ওটিপি (OTP), ব্যাংক কার্ড নম্বর বা ব্যক্তিগত পাসওয়ার্ড কখনো শেয়ার করবেন না। Servexa কখনোই কোনো গ্রাহকের পিন বা ওটিপি জানতে চায় না।
          </p>
        </div>
      </div>

      {/* Verification Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <UserCheck className="w-8 h-8 text-emerald-600" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            ১. জাতীয় পরিচয়পত্র (NID) যাচাই
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            আমাদের প্রতিটি টেকনিশিয়ানের সরকারি জাতীয় পরিচয়পত্রের ডাটাবেইজের সাথে তথ্য সরাসরি মিলিয়ে নিশ্চিত করা হয়।
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            ২. কারিগরি দক্ষতার পরীক্ষা
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            অনুমোদন পাওয়ার আগে টেকনিশিয়ানকে বৈদ্যুতিক, প্লাম্বিং বা এসি কাজের বাস্তব টেস্ট ও সেফটি প্রোটোকল মেনে চলার প্রমাণ দিতে হয়।
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <Lock className="w-8 h-8 text-orange-600" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            ৩. গোপনীয়তা ও ডাটা সুরক্ষা
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            গ্রাহকের ফোন নম্বর ও ঠিকানা শুধুমাত্র বুকিং চলাকালীন প্রয়োজনীয় কাজের জন্য ব্যবহার করা হয় এবং সম্পূর্ণ সুরক্ষিত রাখা হয়।
          </p>
        </div>
      </div>

      {/* Safe Booking Guidelines */}
      <div className="p-6 sm:p-8 rounded-3xl bg-stone-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          গ্রাহকদের জন্য নিরাপদ বুকিং নির্দেশিকা
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-700 dark:text-zinc-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>মিস্ত্রি বাসায় পৌঁছালে অ্যাপে থাকা ছবি ও নামের সাথে চেহারা মিলিয়ে নিশ্চিত হোন।</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>কাজ শুরুর পূর্বে আনুমানিক খরচ ও পার্টসের মূল্য নিয়ে টেকনিশিয়ানের সাথে স্পষ্ট আলোচনা করুন।</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>কাজ সম্পন্ন হওয়ার পর অ্যাপের তৈরি ডিজিটাল ইনভয়েস যাচাই করে অর্থ পরিশোধ করুন।</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>যেকোনো ধরনের অপেশাদার আচরণের ক্ষেত্রে সাথে সাথে আমাদের সাপোর্ট টিমে রিপোর্ট করুন।</span>
          </div>
        </div>
      </div>
    </div>
  );
};
