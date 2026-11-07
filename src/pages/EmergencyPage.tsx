import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Zap, Droplets, Key, Wind, PhoneCall, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';

export const EmergencyPage: React.FC = () => {
  const { categories, technicians } = useApp();
  const { t, isBangla } = useLanguage();
  const navigate = useNavigate();

  const [emergencyType, setEmergencyType] = useState<string>('electrical');
  const [selectedArea, setSelectedArea] = useState<string>('Mirpur');
  const [problemBrief, setProblemBrief] = useState<string>('');

  const emergencyOptions = [
    {
      id: 'electrical',
      icon: Zap,
      labelBn: 'বৈদ্যুতিক শর্ট সার্কিট / আগুন ঝুঁকি',
      labelEn: 'Electrical Short Circuit / Fire Risk',
      descBn: 'মেইন ব্রেকার স্পার্ক, পোড়া গন্ধ বা পুরো বাসা বিদ্যুৎহীন হয়ে যাওয়া',
      descEn: 'Main breaker sparking, burning odor, or total sudden home blackout'
    },
    {
      id: 'plumbing',
      icon: Droplets,
      labelBn: 'পানির পাইপ ফেটে মেঝে ডুবে যাওয়া',
      labelEn: 'Severe Pipe Burst / Flooding',
      descBn: 'পানির পাইপ বা ভালভ ফেটে বেসিন বা বাথরুমে তীব্র পানির স্রোত',
      descEn: 'High-pressure water pipe rupture, flooding kitchen or bathroom'
    },
    {
      id: 'locksmith',
      icon: Key,
      labelBn: 'দরজায় তালা আটকে বাইরে বন্দি',
      labelEn: 'Locked Out / Broken Key Emergency',
      descBn: 'চাবি ভেঙে লক আটকে গেছে বা ঘরের ভেতরে বাচ্চা আটকা পড়েছে',
      descEn: 'Key snapped inside lock mechanism or child locked inside room'
    },
    {
      id: 'ac_repair',
      icon: Wind,
      labelBn: 'এসি বা ফ্রিজ তীব্র গোলযোগ',
      labelEn: 'AC / Refrigerator Severe Failure',
      descBn: 'কম্প্রেসার থেকে অস্বাভাবিক ধোঁয়া, বিকট শব্দ বা গ্যাস লিক হওয়া',
      descEn: 'Severe gas leak, toxic chemical smell, or compressor sparking'
    },
  ];

  const dhakaAreas = [
    { value: 'Mirpur', labelBn: 'মিরপুর (Mirpur)', labelEn: 'Mirpur' },
    { value: 'Dhanmondi', labelBn: 'ধানমন্ডি (Dhanmondi)', labelEn: 'Dhanmondi' },
    { value: 'Uttara', labelBn: 'উত্তরা (Uttara)', labelEn: 'Uttara' },
    { value: 'Mohammadpur', labelBn: 'মোহাম্মদপুর (Mohammadpur)', labelEn: 'Mohammadpur' },
    { value: 'Gulshan', labelBn: 'গুলশান (Gulshan)', labelEn: 'Gulshan' },
    { value: 'Banani', labelBn: 'বনানী (Banani)', labelEn: 'Banani' },
    { value: 'Farmgate', labelBn: 'ফার্মগেট (Farmgate)', labelEn: 'Farmgate' },
    { value: 'Badda', labelBn: 'বাড্ডা (Badda)', labelEn: 'Badda' },
    { value: 'Old Dhaka', labelBn: 'পুরান ঢাকা (Old Dhaka)', labelEn: 'Old Dhaka' }
  ];

  // Filter technicians available for emergency
  const availablePros = technicians
    .filter(t => t.skills.includes(emergencyType))
    .slice(0, 3);

  const handleEmergencyDispatch = (techId: string) => {
    navigate(`/book?techId=${techId}&categoryId=${emergencyType}&emergency=true&desc=${encodeURIComponent(problemBrief || (isBangla ? '🚨 জরুরি অনুরোধ: ' : '🚨 Emergency Request: ') + emergencyType)}`);
  };

  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in-up">
      {/* Emergency Alert Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 text-white p-6 sm:p-9 shadow-2xl space-y-3.5">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-white/20 px-3.5 py-1.5 rounded-full w-fit backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>{isBangla ? 'তাৎক্ষণিক ইমার্জেন্সি রেসপন্স ইউনিট' : '24/7 Priority Emergency Dispatch Unit'}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
          {isBangla ? 'জরুরি কারিগরি সহায়তা টিম' : 'Instant Emergency Technical Rescue'}
        </h1>

        <p className="text-xs sm:text-sm text-rose-100 max-w-2xl leading-relaxed">
          {isBangla
            ? 'পানির পাইপ ফেটে যাওয়া, শর্ট সার্কিট বা দরজার লক আটকে যাওয়া—আমাদের নিকটস্থ জরুরি টিম ২০-৩০ মিনিটের মধ্যে ঘটনাস্থলে পৌঁছাতে প্রস্তুত।'
            : 'Immediate priority dispatch for hazardous water leaks, electrical short-circuits, or broken door locks within 20-30 minutes.'}
        </p>

        <div className="pt-2 text-xs text-amber-200 font-semibold flex items-center gap-2">
          <span>{isBangla ? '* জরুরি সেবার জন্য সাধারণ চার্জের সাথে অতিরিক্ত ১৫০ টাকা ইমার্জেন্সি ফি প্রযোজ্য।' : '* A standardized priority dispatch fee of ৳150 applies for rapid emergency response.'}</span>
        </div>
      </div>

      {/* Step 1: Select Emergency Hazard Type */}
      <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">
          {isBangla ? '১. আপনার জরুরি পরিস্থিতি নির্বাচন করুন' : '1. Select Your Emergency Hazard Type'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {emergencyOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = emergencyType === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setEmergencyType(opt.id)}
                className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/30 shadow-md'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-stone-50/50 dark:bg-zinc-850'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-rose-600 text-white shadow-sm' : 'bg-stone-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-white">
                    {isBangla ? opt.labelBn : opt.labelEn}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {isBangla ? opt.descBn : opt.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Location and details */}
      <div className="bg-white dark:bg-zinc-900 p-6 sm:p-7 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">
          {isBangla ? '২. আপনার এলাকা ও সংক্ষিপ্ত পরিস্থিতি' : '2. Your Location & Situation Overview'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isBangla ? 'এলাকা (ঢাকা)' : 'Area (Dhaka)'}
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
              {dhakaAreas.map(a => (
                <option key={a.value} value={a.value}>
                  {isBangla ? a.labelBn : a.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {isBangla ? 'পরিস্থিতি সংক্ষেপে লিখুন (ঐচ্ছিক)' : 'Briefly Describe Situation (Optional)'}
            </label>
            <input
              type="text"
              value={problemBrief}
              onChange={(e) => setProblemBrief(e.target.value)}
              placeholder={isBangla ? 'যেমন: মেইন সুইচে স্পার্ক করছে বা ধোঁয়া উঠছে...' : 'e.g. Main switch sparking or bathroom flooding...'}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>
        </div>
      </div>

      {/* Step 3: Instant Dispatch Available Pros */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{isBangla ? 'নিকটস্থ সক্রিয় জরুরি টেকনিশিয়ান' : 'Nearest Active Emergency Technicians'}</span>
          </h2>
          <span className="text-xs font-semibold text-zinc-500">
            {isBangla ? 'গড় পৌঁছানোর সময়: ২০-৩০ মিনিট' : 'Estimated Arrival: 20-30 mins'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {availablePros.map((tech) => (
            <div
              key={tech.id}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-rose-200 dark:border-rose-900/50 shadow-md flex flex-col justify-between hover:shadow-xl transition-all"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={tech.avatar}
                    alt={tech.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-500 shadow-xs"
                  />
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-white">
                      {tech.name}
                    </h3>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {tech.primaryArea}, {isBangla ? 'ঢাকা' : 'Dhaka'}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{isBangla ? 'এখনই প্রস্তুত' : 'Ready for Dispatch'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-zinc-600 dark:text-zinc-400 py-2.5 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>{isBangla ? 'জরুরি ভিজিট ফি:' : 'Emergency Visit Fee:'}</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-black">৳{tech.visitingFee + 150}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{isBangla ? 'সফল কাজ:' : 'Completed Jobs:'}</span>
                    <span className="font-bold">{tech.completedJobs}+</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEmergencyDispatch(tech.id)}
                className="w-full mt-3.5 py-3 text-center text-xs font-black rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-600/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>🚨 {isBangla ? 'দ্রুত কল ও বুক করুন' : 'Instant Dispatch & Book'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
