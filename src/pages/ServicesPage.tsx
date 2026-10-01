import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Zap, Droplets, Wind, Refrigerator, Disc, Tv, Laptop, Smartphone, Paintbrush, Hammer, Grid, Sparkles, Cpu, Key, BatteryCharging, Camera, Wifi, Wrench, Trees, Truck, Settings } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';

const iconMap: Record<string, React.ElementType> = {
  Zap, Droplets, Wind, Refrigerator, Disc, Tv, Laptop, Smartphone,
  Paintbrush, Hammer, Grid, Sparkles, Cpu, Key, BatteryCharging,
  Camera, Wifi, Wrench, Trees, Truck, Settings
};

export const ServicesPage: React.FC = () => {
  const { categories } = useApp();
  const { t, isBangla } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'popular' | 'emergency'>('all');

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.nameBn.includes(searchTerm) ||
      cat.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterType === 'popular') return matchesSearch && cat.popular;
    if (filterType === 'emergency') return matchesSearch && cat.emergencyAvailable;
    return matchesSearch;
  });

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
          {isBangla ? 'আমাদের সকল সার্ভিস ক্যাটাগরি' : 'All Service Categories'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {isBangla
            ? 'বাসা, অফিস বা দোকানের যেকোনো কারিগরি কাজের জন্য বিশ্বস্ত অভিজ্ঞ মিস্ত্রি বুক করুন'
            : 'Explore over 21 specialized services with verified experts across Dhaka and Bangladesh'}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="max-w-2xl mx-auto mb-10 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBangla ? 'সার্ভিস খুঁজুন (যেমন: ফ্যান, এসি, প্লাম্বার)...' : 'Search services (e.g., fan, AC, plumber)...'}
            className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center justify-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
            }`}
          >
            {isBangla ? 'সকল সার্ভিস' : 'All Services'} ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('popular')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === 'popular'
                ? 'bg-orange-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
            }`}
          >
            {isBangla ? 'জনপ্রিয়' : 'Popular'}
          </button>
          <button
            type="button"
            onClick={() => setFilterType('emergency')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === 'emergency'
                ? 'bg-rose-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900'
            }`}
          >
            🚨 {isBangla ? 'জরুরি সেবা' : 'Emergency'}
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCategories.map((cat) => {
          const Icon = iconMap[cat.icon] || Wrench;
          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between hover:border-orange-500 hover:shadow-lg transition-all duration-200 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  {cat.emergencyAvailable && (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                      🚨 {isBangla ? 'জরুরি' : '24/7'}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {isBangla ? cat.nameBn : cat.nameEn}
                </h3>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed line-clamp-2">
                  {isBangla ? cat.descriptionBn : cat.descriptionEn}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{isBangla ? 'শুরু মাত্র' : 'Starts at'}:</span>
                  <span className="font-extrabold text-orange-600 dark:text-orange-400">
                    ৳{cat.startingPrice}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/professionals?category=${cat.id}`}
                    className="py-2 text-center text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    {isBangla ? 'মিস্ত্রি দেখুন' : 'View Techs'}
                  </Link>
                  <Link
                    to={`/book?categoryId=${cat.id}`}
                    className="py-2 text-center text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                  >
                    {t.actions.bookNow}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
