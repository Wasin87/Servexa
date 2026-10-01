import React from 'react';
import { TechnicianMap } from '../components/map/TechnicianMap';
import { useLanguage } from '../contexts/LanguageContext';
import { Compass, ShieldCheck, Zap } from 'lucide-react';

export const MapPage: React.FC = () => {
  const { isBangla } = useLanguage();

  return (
    <div className="flex flex-col h-screen bg-stone-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Sub-header Banner */}
      <div className="bg-gradient-to-r from-orange-600/10 via-amber-500/5 to-transparent border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400">
              <Compass className="w-4 h-4" />
            </span>
            <h1 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
              {isBangla ? 'আশেপাশের দক্ষ টেকনিশিয়ান ডিসকভারি ম্যাপ' : 'Nearby Technician Discovery & Live Service Map'}
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="hidden sm:inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              {isBangla ? '১০০% আইডি ও স্কিল ভেরিফাইড' : '100% ID & Skill Verified'}
            </span>
            <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
              <Zap className="w-3.5 h-3.5 fill-current" />
              {isBangla ? 'তাৎক্ষণিক বুকিং' : 'Instant Booking'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Map Component */}
      <div className="flex-1 w-full h-full min-h-[500px] relative overflow-hidden">
        <TechnicianMap mode="standalone" height="100%" />
      </div>
    </div>
  );
};
