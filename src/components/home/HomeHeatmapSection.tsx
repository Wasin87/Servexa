import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { HeatmapWidget } from '../heatmap/HeatmapWidget';
import { useLanguage } from '../../contexts/LanguageContext';

export const HomeHeatmapSection: React.FC = () => {
  const { isBangla } = useLanguage();

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{isBangla ? 'রিয়েল-টাইম মেট্রো হিটম্যাপ' : 'Live Metro Heatmap'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
            {isBangla ? (
              <>
                আপনার এলাকায় প্রস্তুত <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">মিস্ত্রিদের সরাসরি দেখুন</span>
              </>
            ) : (
              <>
                Track Live <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">Technician Availability</span> Near You
              </>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-2xl">
            {isBangla
              ? 'ঢাকার ১২টি জোনে কোথায় কতজন টেকনিশিয়ান প্রস্তুত এবং কোন এলাকায় কাজের চাপ বেশি—লাইভ মনিটর করুন।'
              : 'Monitor real-time technician readiness, average arrival ETA, and surging repair demand across all Dhaka zones.'}
          </p>
        </div>

        <Link
          to="/heatmap"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600/10 hover:bg-orange-600/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold text-xs transition-colors shrink-0"
        >
          <span>{isBangla ? 'পূর্ণাঙ্গ হিটম্যাপ দেখুন' : 'Explore Full Heatmap'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Embedded Heatmap Widget */}
      <HeatmapWidget />

      {/* Footnote reassurance */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 px-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{isBangla ? '১০০% পুলিশ ভেরিফাইড ও এনআইডি পরীক্ষিত মিস্ত্রি' : '100% NID verified & background-checked technicians'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-500" />
          <span>{isBangla ? 'জরুরি প্রয়োজনে ১৫ মিনিটের মধ্যে রেসপন্স গ্যারান্টি' : 'Guaranteed 15-minute response in emergency zones'}</span>
        </div>
      </div>
    </section>
  );
};
