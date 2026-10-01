import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wrench, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const CTASection: React.FC = () => {
  const { t, isBangla } = useLanguage();

  return (
    <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-orange-400/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-white uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Servexa Bangladesh</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
            {t.tagline}
          </h2>

          <p className="text-xs sm:text-sm text-orange-100 leading-relaxed max-w-lg">
            {isBangla
              ? 'আর অযথা দোকানে খোঁজাখুঁজি নয়। আপনার এলাকার বিশ্বস্ত ও রেটেড মিস্ত্রি এখন এক ক্লিকেই প্রস্তুত।'
              : 'No more searching local street corners. Book top-rated, background-checked craftsmen in seconds.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-black text-xs sm:text-sm shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{t.hero.ctaPrimary}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/heatmap"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-white/60 bg-black/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all"
            >
              <span>{isBangla ? 'লাইভ হিটম্যাপ' : 'Live Heatmap'}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>

  );
};
