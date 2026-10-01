import React from 'react';
import { ShieldCheck, Lock, Clock, AlertTriangle, FileCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const TrustSafety: React.FC = () => {
  const { t, isBangla } = useLanguage();

  return (
    <section className="py-16 sm:py-20 bg-stone-100/60 dark:bg-zinc-900/40 border-y border-zinc-200/80 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-2 mb-12">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            {isBangla ? 'সুরক্ষা ও আস্থার নিশ্চয়তা' : 'Trust & Safety'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {t.safety.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {t.safety.subtitle}
          </p>
        </div>

        {/* 3 Pillars of Trust */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">
              {t.safety.nidTitle}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t.safety.nidDesc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">
              {t.safety.priceTitle}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t.safety.priceDesc}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-2">
              {t.safety.warrantyTitle}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t.safety.warrantyDesc}
            </p>
          </div>
        </div>

        {/* Prominent Safety Warning Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
              {t.safety.warningTitle}
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {t.safety.warningDesc} {isBangla ? 'যেকোনো সন্দেহজনক পরিস্থিতিতে তাৎক্ষণিকভাবে আমাদের হেল্পলাইনে জানান।' : 'Contact our hotline immediately in case of any suspicious request.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
