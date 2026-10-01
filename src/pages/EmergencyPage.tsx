import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, Clock, Zap, Droplets, Key, Wind, PhoneCall, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
    { id: 'electrical', icon: Zap, labelBn: 'বৈদ্যুতিক শর্ট সার্কিট / আগুন ঝুঁকি', labelEn: 'Electrical Short Circuit / Spark', descBn: 'মেইন ব্রেকার স্পার্ক, পোড়া গন্ধ বা পুরো বাসা বিদ্যুৎহীন' },
    { id: 'plumbing', icon: Droplets, labelBn: 'পানির পাইপ ফেটে মেঝে ডুবে যাওয়া', labelEn: 'Severe Pipe Burst / Flooding', descBn: 'পানির পাইপ ফেটে বেসিন বা বাথরুমে তীব্র পানির স্রোত' },
    { id: 'locksmith', icon: Key, labelBn: 'দরজায় তালা আটকে বাইরে বন্দি', labelEn: 'Locked Out / Broken Key', descBn: 'চাবি ভেঙে লক আটকে গেছে বা ঘরের ভেতরে বাচ্চা আটকে আছে' },
    { id: 'ac_repair', icon: Wind, labelBn: 'এসি বা ফ্রিজ তীব্র গোলযোগ', labelEn: 'Severe AC / Fridge Failure', descBn: 'গ্যাস লিক বা কম্প্রেসার থেকে শব্দ ও ধোঁয়া' },
  ];

  // Filter technicians available for emergency
  const availablePros = technicians
    .filter(t => t.skills.includes(emergencyType))
    .slice(0, 3);

  const handleEmergencyDispatch = (techId: string) => {
    navigate(`/book?techId=${techId}&categoryId=${emergencyType}&emergency=true&desc=${encodeURIComponent(problemBrief || '🚨 জরুরি অনুরোধ: ' + emergencyType)}`);
  };

  return (
    <div className="py-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Emergency Alert Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-rose-600 via-rose-700 to-red-700 text-white p-6 sm:p-8 shadow-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full w-fit">
          <AlertTriangle className="w-4 h-4 text-amber-300" />
          <span>{isBangla ? 'তাৎক্ষণিক ইমার্জেন্সি রেসপন্স' : 'Emergency 24/7 Dispatch Unit'}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          {isBangla ? 'জরুরি কারিগরি সহায়তা টিম' : 'Instant Emergency Help'}
        </h1>

        <p className="text-xs sm:text-sm text-rose-100 max-w-2xl leading-relaxed">
          {isBangla
            ? 'পানির পাইপ ফেটে যাওয়া, শর্ট সার্কিট বা তালা ভেঙে যাওয়া—আমাদের নিকটস্থ জরুরি টিম ২০-৩০ মিনিটের মধ্যে ঘটনাস্থলে পৌঁছাতে প্রস্তুত।'
            : 'Immediate priority dispatch for hazardous water leaks, electrical sparking, or broken locks within 20-30 mins.'}
        </p>

        <div className="pt-2 text-xs text-amber-200 font-semibold flex items-center gap-2">
          <span>* জরুরি সেবার জন্য সাধারণ চার্জের সাথে অতিরিক্ত ১৫০ টাকা ইমার্জেন্সি ফি প্রযোজ্য।</span>
        </div>
      </div>

      {/* Step 1: Select Emergency Hazard Type */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          ১. আপনার জরুরি পরিস্থিতি নির্বাচন করুন
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {emergencyOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = emergencyType === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setEmergencyType(opt.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-rose-600 text-white' : 'bg-stone-100 dark:bg-zinc-800 text-zinc-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                    {isBangla ? opt.labelBn : opt.labelEn}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    {opt.descBn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Location and details */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          ২. আপনার এলাকা ও সংক্ষিপ্ত পরিস্থিতি
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              এলাকা (Dhaka Area)
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
            >
              <option value="Mirpur">মিরপুর (Mirpur)</option>
              <option value="Dhanmondi">ধানমন্ডি (Dhanmondi)</option>
              <option value="Uttara">উত্তরা (Uttara)</option>
              <option value="Mohammadpur">মোহাম্মদপুর (Mohammadpur)</option>
              <option value="Gulshan">গুলশান (Gulshan)</option>
              <option value="Farmgate">ফার্মগেট (Farmgate)</option>
              <option value="Badda">বাড্ডা (Badda)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              পরিস্থিতি সংক্ষেপে লিখুন (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={problemBrief}
              onChange={(e) => setProblemBrief(e.target.value)}
              placeholder="যেমন: মেইন সুইচে স্পার্ক করছে বা ধোঁয়া উঠছে..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* Step 3: Instant Dispatch Available Pros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>নিকটস্থ সক্রিয় জরুরি টেকনিশিয়ান</span>
          </h2>
          <span className="text-xs text-zinc-500">গড় পৌঁছানোর সময়: ২৫ মিনিট</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {availablePros.map((tech) => (
            <div
              key={tech.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-rose-200 dark:border-rose-900/50 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={tech.avatar}
                    alt={tech.name}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-rose-500"
                  />
                  <div>
                    <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {tech.name}
                    </h3>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {tech.primaryArea}, ঢাকা
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold">
                      ✓ এখন রেডি
                    </div>
                  </div>
                </div>

                <div className="text-xs text-zinc-600 dark:text-zinc-400 py-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                  <div className="flex justify-between">
                    <span>জরুরি ভিজিট ফি:</span>
                    <strong className="text-rose-600">৳{tech.visitingFee + 150}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>সফল কাজ:</span>
                    <span>{tech.completedJobs}+</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEmergencyDispatch(tech.id)}
                className="w-full mt-3 py-2.5 text-center text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors"
              >
                🚨 দ্রুত কল ও বুক করুন
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
