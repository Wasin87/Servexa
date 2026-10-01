import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Phone, ArrowRight, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const EmergencyBanner: React.FC = () => {
  const { t, isBangla } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 text-white p-6 sm:p-8 shadow-2xl border border-orange-400/30">
        {/* Subtle patterned overlay */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-white uppercase tracking-wider animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>{isBangla ? 'জরুরি অন-ডিমান্ড রেসকিউ' : 'Emergency 24/7 Dispatch'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {t.emergency.bannerTitle}
            </h2>

            <p className="text-xs sm:text-sm text-orange-100 leading-relaxed">
              {t.emergency.bannerSubtitle} {t.emergency.disclaimer}
            </p>

            <div className="flex items-center gap-4 pt-1 text-xs text-orange-100">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-amber-300" />
                {t.emergency.etaTitle} <strong className="text-white">{t.emergency.etaValue}</strong>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-300" />
                {isBangla ? 'তাৎক্ষণিক সংযোগ' : 'Direct Dispatch'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/emergency"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-orange-700 hover:bg-orange-50 text-xs sm:text-sm font-black shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{t.emergency.btnText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>

  );
};
