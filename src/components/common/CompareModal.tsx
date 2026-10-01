import React from 'react';
import { X, Star, ShieldCheck, Check, Clock, Phone, Award } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose }) => {
  const { technicians, comparedTechIds, removeFromCompare, clearCompare } = useApp();
  const { t, isBangla } = useLanguage();

  if (!isOpen) return null;

  const comparedList = technicians.filter(tech => comparedTechIds.includes(tech.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {t.compare.title}
            </h3>
            <p className="text-xs text-zinc-500">
              {t.compare.subtitle} ({comparedList.length}/3)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {comparedList.length > 0 && (
              <button
                onClick={clearCompare}
                type="button"
                className="text-xs text-zinc-500 hover:text-rose-600 transition-colors mr-2"
              >
                {t.search.clearFilters}
              </button>
            )}
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {comparedList.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Award className="w-10 h-10 text-orange-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">কোনো মিস্ত্রি নির্বাচিত করা হয়নি।</p>
              <p className="text-xs mt-1 text-zinc-400">
                মিস্ত্রির কার্ডে গিয়ে 'তুলনা করুন' বাটনে ক্লিক করে সর্বোচ্চ ৩ জন যোগ করুন।
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[600px]">
                {comparedList.map(tech => (
                  <div
                    key={tech.id}
                    className="relative p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/60 flex flex-col justify-between"
                  >
                    <button
                      onClick={() => removeFromCompare(tech.id)}
                      className="absolute top-3 right-3 text-zinc-400 hover:text-rose-500 p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                      title="সরিয়ে ফেলুন"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div>
                      {/* Avatar & Name */}
                      <div className="flex items-center gap-3 mb-4">
                        <img
                          src={tech.avatar}
                          alt={tech.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-orange-500 shadow-xs"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {tech.name}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{tech.rating} ({tech.reviewCount})</span>
                          </div>
                          <div className="text-[11px] text-zinc-500">{tech.primaryArea}, {tech.city}</div>
                        </div>
                      </div>

                      {/* Attribute Rows */}
                      <div className="space-y-2.5 text-xs border-t border-b border-zinc-200 dark:border-zinc-800 py-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{t.compare.experience}:</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{tech.experienceYears} {isBangla ? 'বছর' : 'Years'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{t.compare.jobs}:</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{tech.completedJobs}+</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{t.compare.startingPrice}:</span>
                          <span className="font-bold text-orange-600 dark:text-orange-400">৳{tech.startingPrice}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{t.compare.visitingFee}:</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">৳{tech.visitingFee}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{t.compare.response}:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{tech.responseRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500">{t.compare.warranty}:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{tech.warrantyPeriodDays} {isBangla ? 'দিন' : 'Days'}</span>
                        </div>
                      </div>

                      {/* Verification Badges */}
                      <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400 mb-4">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>জাতীয় পরিচয়পত্র ভেরিফায়েড</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>দক্ষতা ও ট্রেনিং টেস্ট সম্পন্ন</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/book?techId=${tech.id}`}
                      onClick={onClose}
                      className="w-full py-2.5 text-center text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-xs"
                    >
                      {t.actions.bookNow}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
