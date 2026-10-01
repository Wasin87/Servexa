import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Star, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';
import { diagnoseProblemWithRules, DiagnosisResult } from '../../services/problemDiagnosis';

export const ProblemWizardSection: React.FC = () => {
  const { t, isBangla } = useLanguage();
  const { categories, technicians } = useApp();
  const navigate = useNavigate();

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const samplePrompts = [
    { bn: 'আমার বাসার পানির পাইপ থেকে পানি লিক করছে', en: 'Water leaking from bathroom pipe', cat: 'plumbing' },
    { bn: 'আমার AC চালু হচ্ছে কিন্তু ঠান্ডা বাতাস দিচ্ছে না', en: 'AC turns on but not cooling', cat: 'ac_repair' },
    { bn: 'সিলিং ফ্যান ঘুরছে না এবং মেইন ব্রেকার ট্রিপ করছে', en: 'Ceiling fan stopped and circuit breaker tripping', cat: 'electrical' },
    { bn: 'বাসার দরজার তালা আটকে গেছে চাবি খুলছে না', en: 'Door lock jammed and key stuck', cat: 'locksmith' },
  ];

  const handleDiagnose = (queryToUse?: string) => {
    const text = queryToUse !== undefined ? queryToUse : inputQuery;
    if (!text.trim()) return;

    setIsDiagnosing(true);
    setTimeout(() => {
      const result = diagnoseProblemWithRules(text, categories);
      setDiagnosis(result);
      setIsDiagnosing(false);
    }, 400);
  };

  // Find technicians matching the diagnosed category
  const matchedTechs = diagnosis
    ? technicians.filter(t => t.skills.includes(diagnosis.categoryId)).slice(0, 3)
    : [];

  return (
    <section className="py-16 sm:py-20 bg-stone-100/70 dark:bg-zinc-900/40 border-y border-zinc-200/80 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.wizard.badge}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {t.wizard.title}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            {t.wizard.subtitle}
          </p>
        </div>

        {/* Input Card */}
        <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
          <div className="space-y-4">
            <div className="relative">
              <textarea
                rows={3}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={t.wizard.placeholder}
                className="w-full p-4 text-sm sm:text-base rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none leading-relaxed"
              />
            </div>

            {/* Quick Sample Problem Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-400">
                {t.wizard.samplePrompts}
              </span>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const text = isBangla ? p.bn : p.en;
                      setInputQuery(text);
                      handleDiagnose(text);
                    }}
                    className="text-xs text-left px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-orange-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 transition-colors border border-zinc-200 dark:border-zinc-700"
                  >
                    "{isBangla ? p.bn : p.en}"
                  </button>
                ))}
              </div>
            </div>

            {/* Diagnose Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleDiagnose()}
                disabled={isDiagnosing || !inputQuery.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isDiagnosing ? t.wizard.diagnosing : t.wizard.diagnoseBtn}</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Result Container */}
          {diagnosis && (
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-4 sm:p-5 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-200/60 dark:border-orange-900/40">
                  <div>
                    <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                      {t.wizard.detectedService}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {isBangla ? diagnosis.categoryNameBn : diagnosis.categoryNameEn}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {diagnosis.confidence}% {isBangla ? 'ম্যাচ নিশ্চিততা' : 'Confidence'}
                    </span>
                    <span className="text-zinc-400">·</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {diagnosis.recommendedUrgency === 'emergency' ? '🚨 অতি জরুরি' : 'আজকের শিডিউল'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">
                  {isBangla ? diagnosis.reasoningBn : diagnosis.reasoningEn}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <span>
                    ভিজিটিং ফি: <strong className="text-zinc-900 dark:text-white">৳{diagnosis.estimatedCostRange.visitingFee}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    আনুমানিক শ্রম মজুরি: <strong className="text-zinc-900 dark:text-white">৳{diagnosis.estimatedCostRange.labourMin}–৳{diagnosis.estimatedCostRange.labourMax}</strong>
                  </span>
                </div>
              </div>

              {/* Matched Technicians for this diagnosis */}
              <div>
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">
                  {t.wizard.matchedPros}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {matchedTechs.map((tech) => (
                    <div
                      key={tech.id}
                      className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <img
                            src={tech.avatar}
                            alt={tech.name}
                            className="w-10 h-10 rounded-full object-cover border border-orange-500"
                          />
                          <div>
                            <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                              {tech.name}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{tech.rating}</span>
                              <span className="text-zinc-400 font-normal">({tech.completedJobs} কাজ)</span>
                            </div>
                          </div>
                        </div>

                        {/* Match reasons */}
                        <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400 mb-3">
                          <div className="text-emerald-600 dark:text-emerald-400 font-medium">✓ ৯২% স্মার্ট ম্যাচ স্কোর</div>
                          <div>✓ {tech.primaryArea}, ঢাকা</div>
                          <div>✓ {tech.warrantyPeriodDays} দিনের ফ্রি ওয়ারেন্টি</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/book?techId=${tech.id}&categoryId=${diagnosis.categoryId}&desc=${encodeURIComponent(inputQuery)}`)}
                        className="w-full py-2 text-center text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                      >
                        {t.actions.bookNow}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 mt-4 text-center">
                {t.wizard.aiDisclaimer}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
