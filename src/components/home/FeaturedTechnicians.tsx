import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, MapPin, Clock, ArrowRight, MessageSquare, Scale, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { HealthScoreCard } from '../common/HealthScoreCard';
import { CompareModal } from '../common/CompareModal';

export const FeaturedTechnicians: React.FC = () => {
  const { technicians, addToCompare, comparedTechIds } = useApp();
  const { t, isBangla } = useLanguage();
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const featured = technicians.slice(0, 4);

  return (
    <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">
            {isBangla ? 'শীর্ষ দক্ষ ও বিশ্বস্ত কর্মী' : 'Top Verified Technicians'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {isBangla ? '১০০% আইডি ও স্কিল ভেরিফায়েড মিস্ত্রি' : 'Certified Hands You Can Rely On'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            {isBangla
              ? 'কাজের পূর্ব অভিজ্ঞতা, বাস্তব গ্রাহক রিভিউ এবং স্বচ্ছ স্বাস্থ্য স্কোরের ভিত্তিতে নির্বাচিত।'
              : 'Handpicked based on verified background check, job history, and transparent health metrics.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {comparedTechIds.length > 0 && (
            <button
              onClick={() => setCompareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{t.compare.title} ({comparedTechIds.length})</span>
            </button>
          )}

          <Link
            to="/professionals"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 transition-colors"
          >
            <span>{isBangla ? 'সকল মিস্ত্রি তালিকা' : 'View all professionals'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Grid of Technician Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featured.map((tech) => {
          const isBeingCompared = comparedTechIds.includes(tech.id);

          return (
            <div
              key={tech.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between hover:shadow-lg hover:border-orange-500/50 transition-all duration-200 group"
            >
              <div>
                {/* Top Avatar & Badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="relative">
                    <img
                      src={tech.avatar}
                      alt={tech.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-700 group-hover:border-orange-500 transition-colors"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 ${
                        tech.availability === 'available'
                          ? 'bg-emerald-500'
                          : tech.availability === 'busy'
                          ? 'bg-amber-500'
                          : 'bg-zinc-400'
                      }`}
                      title={tech.availability}
                    />
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t.tech.verifiedPro}</span>
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1">
                      {tech.experienceYears} {isBangla ? 'বছরের অভিজ্ঞতা' : 'Yrs Exp'}
                    </span>
                  </div>
                </div>

                {/* Name & Area */}
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  <Link to={`/professionals/${tech.id}`}>
                    {tech.name}
                  </Link>
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{tech.primaryArea}, {tech.city}</span>
                </div>

                {/* Rating & Completed Jobs */}
                <div className="flex items-center gap-3 py-3 my-3 border-y border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{tech.rating}</span>
                    <span className="text-zinc-400 font-normal">({tech.reviewCount})</span>
                  </div>
                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                  <div className="text-zinc-600 dark:text-zinc-400">
                    <strong>{tech.completedJobs}+</strong> {isBangla ? 'টি কাজ' : 'jobs'}
                  </div>
                </div>

                {/* Transparent Health score compact */}
                <div className="mb-4">
                  <HealthScoreCard score={tech.healthScore} compact={true} />
                </div>
              </div>

              {/* Price & Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{t.tech.startingPrice}</span>
                  <span className="text-base font-extrabold text-orange-600 dark:text-orange-400">
                    ৳{tech.startingPrice}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/book?techId=${tech.id}`}
                    className="py-2 text-center text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-xs"
                  >
                    {t.actions.bookNow}
                  </Link>
                  <Link
                    to={`/professionals/${tech.id}`}
                    className="py-2 text-center text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    {t.actions.viewProfile}
                  </Link>
                </div>

                {/* Compare Checkbox */}
                <button
                  type="button"
                  onClick={() => {
                    if (isBeingCompared) {
                      setCompareModalOpen(true);
                    } else {
                      addToCompare(tech.id);
                      setCompareModalOpen(true);
                    }
                  }}
                  className="w-full text-center text-[11px] font-medium text-zinc-500 hover:text-orange-600 transition-colors flex items-center justify-center gap-1 pt-1"
                >
                  <Scale className="w-3 h-3" />
                  <span>{isBeingCompared ? 'তুলনা তালিকায় যুক্ত রয়েছে' : 'তুলনা করতে যোগ করুন'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {compareModalOpen && (
        <CompareModal isOpen={compareModalOpen} onClose={() => setCompareModalOpen(false)} />
      )}
    </section>
  );
};
