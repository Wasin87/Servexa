import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Star, ShieldCheck, MapPin, Clock, Search, Filter, Scale, Check, Phone, ArrowUpDown } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { HealthScoreCard } from '../components/common/HealthScoreCard';
import { CompareModal } from '../components/common/CompareModal';

export const ProfessionalsPage: React.FC = () => {
  const { technicians, categories, addToCompare, removeFromCompare, comparedTechIds } = useApp();
  const { t, isBangla } = useLanguage();
  const [searchParams] = useSearchParams();

  const initialCat = searchParams.get('category') || 'all';
  const initialArea = searchParams.get('area') || 'all';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'jobs' | 'experience'>('rating');
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const areas = ['all', 'Mirpur', 'Dhanmondi', 'Uttara', 'Mohammadpur', 'Gulshan', 'Banani', 'Bashundhara', 'Farmgate', 'Badda'];

  const filteredTechnicians = useMemo(() => {
    return technicians
      .filter((tech) => {
        const matchesCategory =
          selectedCategory === 'all' || tech.skills.includes(selectedCategory);
        const matchesArea =
          selectedArea === 'all' ||
          tech.primaryArea.toLowerCase() === selectedArea.toLowerCase() ||
          tech.serviceAreas.some(a => a.toLowerCase() === selectedArea.toLowerCase());
        const matchesAvailability =
          availabilityFilter === 'all' || tech.availability === availabilityFilter;
        const matchesSearch =
          !searchQuery.trim() ||
          tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.bioEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.bioBn.includes(searchQuery);

        return matchesCategory && matchesArea && matchesAvailability && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'price') return a.startingPrice - b.startingPrice;
        if (sortBy === 'jobs') return b.completedJobs - a.completedJobs;
        if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
        return 0;
      });
  }, [technicians, selectedCategory, selectedArea, availabilityFilter, searchQuery, sortBy]);

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {isBangla ? 'যাচাইকৃত দক্ষ মিস্ত্রি খুঁজুন' : 'Find Verified Professionals'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isBangla
              ? 'আইডি ও স্কিল ভেরিফাইড টেকনিশিয়ানদের রেটিং, অভিজ্ঞতা ও দূরত্ব দেখে বেছে নিন'
              : 'Browse background-checked specialists by trade, area, rating, and transparent price.'}
          </p>
        </div>

        {comparedTechIds.length > 0 && (
          <button
            onClick={() => setCompareModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-colors shrink-0"
          >
            <Scale className="w-4 h-4" />
            <span>{t.compare.title} ({comparedTechIds.length}/3)</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs mb-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBangla ? 'নাম বা কাজের ধরন...' : 'Search name or skill...'}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
            >
              <option value="all">{t.search.allCategories}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {isBangla ? c.nameBn : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Area Dropdown */}
          <div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
            >
              <option value="all">{t.search.allLocations}</option>
              {areas.filter(a => a !== 'all').map((a) => (
                <option key={a} value={a}>
                  {a}, Dhaka
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
            >
              <option value="rating">{t.search.sortRating}</option>
              <option value="price">{t.search.sortPriceLow}</option>
              <option value="jobs">{t.search.sortJobs}</option>
              <option value="experience">{t.search.sortExperience}</option>
            </select>
          </div>
        </div>

        {/* Status count */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span>
            {filteredTechnicians.length} {t.search.resultsFound}
          </span>
          {(selectedCategory !== 'all' || selectedArea !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedArea('all');
                setSearchQuery('');
              }}
              className="text-orange-600 dark:text-orange-400 hover:underline font-semibold"
            >
              {t.search.clearFilters}
            </button>
          )}
        </div>
      </div>

      {/* Technicians List Grid */}
      {filteredTechnicians.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-sm">
          <p>{t.search.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTechnicians.map((tech) => {
            const isCompared = comparedTechIds.includes(tech.id);

            return (
              <div
                key={tech.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between hover:shadow-lg hover:border-orange-500/60 transition-all duration-200"
              >
                <div>
                  {/* Top Row: Avatar & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={tech.avatar}
                          alt={tech.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                            tech.availability === 'available'
                              ? 'bg-emerald-500'
                              : tech.availability === 'busy'
                              ? 'bg-amber-500'
                              : 'bg-zinc-400'
                          }`}
                        />
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          <Link to={`/professionals/${tech.id}`} className="hover:text-orange-600 transition-colors">
                            {tech.name}
                          </Link>
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{tech.rating}</span>
                          <span className="text-zinc-400 font-normal">({tech.reviewCount})</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>ভেরিফায়েড</span>
                      </span>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {tech.experienceYears} বছর অভিজ্ঞতা
                      </span>
                    </div>
                  </div>

                  {/* Location & Areas */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>{tech.primaryArea}, {tech.city}</span>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="text-[11px] truncate max-w-[140px]">
                      {tech.serviceAreas.slice(0, 3).join(', ')}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                    {isBangla ? tech.bioBn : tech.bioEn}
                  </p>

                  {/* Health Score Summary */}
                  <div className="mb-4">
                    <HealthScoreCard score={tech.healthScore} compact={true} />
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-zinc-400">{t.tech.visitingFee}: </span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">৳{tech.visitingFee}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400">{t.tech.startingPrice}: </span>
                      <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">৳{tech.startingPrice}</span>
                    </div>
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

                  {/* Compare action button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompared) {
                        removeFromCompare(tech.id);
                      } else {
                        addToCompare(tech.id);
                      }
                    }}
                    className={`w-full py-1 text-center text-[11px] font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
                      isCompared
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                        : 'text-zinc-500 hover:text-orange-600'
                    }`}
                  >
                    <Scale className="w-3 h-3" />
                    <span>{isCompared ? 'তুলনা তালিকা থেকে সরান' : 'তুলনা করতে যোগ করুন'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {compareModalOpen && (
        <CompareModal isOpen={compareModalOpen} onClose={() => setCompareModalOpen(false)} />
      )}
    </div>
  );
};
