import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, MapPin, ArrowRight, Scale, User, Wrench } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CompareModal } from '../common/CompareModal';

export const FeaturedTechnicians: React.FC = () => {
  const { technicians, categories, addToCompare, removeFromCompare, comparedTechIds } = useApp();
  const { t, isBangla } = useLanguage();
  const navigate = useNavigate();
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const featured = technicians.slice(0, 4);

  const getCategoryName = (skillId: string) => {
    const cat = categories.find((c) => c.id === skillId);
    if (!cat) return isBangla ? 'টেকনিশিয়ান' : 'Technician';
    return isBangla ? cat.nameBn : cat.nameEn;
  };

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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 cursor-pointer"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {featured.map((tech) => {
          const isBeingCompared = comparedTechIds.includes(tech.id);
          const primarySkill = tech.skills[0] ? getCategoryName(tech.skills[0]) : '';

          return (
            <div
              key={tech.id}
              onClick={() => navigate(`/professionals/${tech.id}`)}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between hover:shadow-xl hover:border-orange-500/60 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Top Avatar & Badges */}
                <div className="flex items-start gap-3.5 mb-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={tech.avatar}
                      alt={tech.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-orange-500/20 group-hover:ring-orange-500 transition-all shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                        tech.availability === 'available'
                          ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                          : tech.availability === 'busy'
                          ? 'bg-amber-500'
                          : 'bg-zinc-400'
                      }`}
                      title={tech.availability}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 transition-colors truncate">
                        {tech.name}
                      </h3>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                        <span>ভেরিফায়েড</span>
                      </span>
                    </div>

                    {primarySkill && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                        <Wrench className="w-3 h-3 text-orange-500" />
                        <span>{primarySkill}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{tech.rating}</span>
                      <span className="text-zinc-400 font-normal">({tech.reviewCount})</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-3 bg-stone-50 dark:bg-zinc-800/60 px-2.5 py-1 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span className="truncate">{tech.primaryArea}, {tech.city}</span>
                </div>
              </div>

              {/* Price & Action Buttons */}
              <div
                className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-zinc-500 text-[11px]">{t.tech.startingPrice}</span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                    ৳{tech.startingPrice}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/book?techId=${tech.id}`}
                    className="py-2 text-center text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-xs"
                  >
                    {t.actions.bookNow}
                  </Link>
                  <Link
                    to={`/professionals/${tech.id}`}
                    className="inline-flex items-center justify-center gap-1 py-2 text-center text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{t.actions.viewProfile}</span>
                  </Link>
                </div>

                {/* Compare Checkbox */}
                <button
                  type="button"
                  onClick={() => {
                    if (isBeingCompared) {
                      removeFromCompare(tech.id);
                    } else {
                      addToCompare(tech.id);
                    }
                  }}
                  className={`w-full text-center text-[11px] font-medium transition-colors flex items-center justify-center gap-1 py-1 rounded-lg cursor-pointer ${
                    isBeingCompared
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold'
                      : 'text-zinc-500 hover:text-orange-600'
                  }`}
                >
                  <Scale className="w-3 h-3" />
                  <span>{isBeingCompared ? 'তুলনা তালিকা থেকে সরান' : 'তুলনা করতে যোগ করুন'}</span>
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
