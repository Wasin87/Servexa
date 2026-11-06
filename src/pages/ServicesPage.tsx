import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Zap,
  Droplets,
  Wind,
  Refrigerator,
  Disc,
  Tv,
  Laptop,
  Smartphone,
  Paintbrush,
  Hammer,
  Grid,
  Sparkles,
  Cpu,
  Key,
  BatteryCharging,
  Camera,
  Wifi,
  Wrench,
  Trees,
  Truck,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toBengaliNumber } from '../utils/geoUtils';

const iconMap: Record<string, React.ElementType> = {
  Zap, Droplets, Wind, Refrigerator, Disc, Tv, Laptop, Smartphone,
  Paintbrush, Hammer, Grid, Sparkles, Cpu, Key, BatteryCharging,
  Camera, Wifi, Wrench, Trees, Truck, Settings
};

export const CATEGORY_BANNERS: Record<string, string> = {
  electrical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  plumbing: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
  ac_repair: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
  refrigerator: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
  washing_machine: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80',
  tv_repair: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
  computer_repair: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
  mobile_repair: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=600&q=80',
  painting: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
  carpentry: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
  masonry: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  home_cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  appliance_repair: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
  locksmith: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
  generator_service: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
  cctv_installation: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
  internet_wifi: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
  mechanic: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
  gardening: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
  moving_transport: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=600&q=80',
  other_services: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
};

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';

export const ServicesPage: React.FC = () => {
  const { categories } = useApp();
  const { t, isBangla } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'popular' | 'emergency'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Responsive device detector (mobile vs desktop)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, isMobile]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesSearch =
        cat.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.nameBn.includes(searchTerm) ||
        cat.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      if (filterType === 'popular') return matchesSearch && cat.popular;
      if (filterType === 'emergency') return matchesSearch && cat.emergencyAvailable;
      return matchesSearch;
    });
  }, [categories, searchTerm, filterType]);

  // Specific per-device pagination limits:
  // Desktop: 8 services per page (4 cols x 2 rows = 8)
  // Mobile: 9 services per page (3 cols x 3 rows = 9)
  const itemsPerPage = isMobile ? 9 : 8;
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCategories = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * itemsPerPage;
    return filteredCategories.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredCategories, safeCurrentPage, itemsPerPage]);

  const startIndexNumber = filteredCategories.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endIndexNumber = Math.min(safeCurrentPage * itemsPerPage, filteredCategories.length);

  return (
    <div className="py-6 sm:py-10 max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>{isBangla ? '২১+ কারিগরি ক্যাটাগরি' : '21+ Verified Categories'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
          {isBangla ? 'আমাদের সকল সার্ভিস ক্যাটাগরি' : 'All Service Categories'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
          {isBangla
            ? 'বাসা, অফিস বা দোকানের যেকোনো কারিগরি কাজের জন্য প্রতিটি সার্ভিসের দক্ষ ও পেশাদার মিস্ত্রি বুক করুন'
            : 'Explore specialized services with transparent pricing, verified experts, and fast dispatch across Dhaka'}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="max-w-2xl mx-auto mb-6 sm:mb-8 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBangla ? 'সার্ভিস খুঁজুন (যেমন: ফ্যান, এসি, প্লাম্বার, পেইন্ট)...' : 'Search services (e.g., fan, AC, plumber, paint)...'}
            className="w-full pl-10 pr-8 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-xs transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {isBangla ? 'সকল সার্ভিস' : 'All Services'} ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('popular')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterType === 'popular'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            ⭐ {isBangla ? 'জনপ্রিয়' : 'Popular'}
          </button>
          <button
            type="button"
            onClick={() => setFilterType('emergency')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterType === 'emergency'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            🚨 {isBangla ? 'জরুরি সেবা' : 'Emergency 24/7'}
          </button>
        </div>
      </div>

      {/* Services Grid:
          Mobile: grid-cols-3 (3 cards per row, 3 rows = 9 items per page)
          Desktop: md:grid-cols-4 (4 cards per row, 2 rows = 8 items per page) */}
      {filteredCategories.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-sm">
          <p>{t.search.noResults}</p>
          <button
            onClick={() => { setSearchTerm(''); setFilterType('all'); }}
            className="mt-3 px-4 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold"
          >
            {isBangla ? 'সব সার্ভিস দেখুন' : 'Show all services'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-5">
          {paginatedCategories.map((cat) => {
            const Icon = iconMap[cat.icon] || Wrench;
            const bannerUrl = CATEGORY_BANNERS[cat.id] || DEFAULT_BANNER;

            return (
              <div
                key={cat.id}
                className="group relative rounded-xl sm:rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden hover:border-orange-500 dark:hover:border-orange-500/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                {/* Professional Category Banner Section */}
                <div className="relative w-full h-20 sm:h-36 overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                  <img
                    src={bannerUrl}
                    alt={cat.nameEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Subtle Gradient Scrim on Top of Banner */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Floating Category Icon Badge */}
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-lg border border-orange-500/30 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </div>

                  {/* Emergency / Popular Badges */}
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex flex-col gap-1 items-end">
                    {cat.emergencyAvailable && (
                      <span className="text-[8px] sm:text-[10px] font-black text-white bg-rose-600/90 backdrop-blur-xs px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
                        {isBangla ? '🚨 জরুরি' : '🚨 24/7'}
                      </span>
                    )}
                    {cat.popular && !cat.emergencyAvailable && (
                      <span className="text-[8px] sm:text-[10px] font-black text-white bg-orange-600/90 backdrop-blur-xs px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
                        ⭐ {isBangla ? 'সেরা' : 'Top'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-2 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Service Name */}
                    <h3 className="font-bold text-xs sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 leading-snug">
                      {isBangla ? cat.nameBn : cat.nameEn}
                    </h3>

                    {/* Service Description (hidden on ultra compact mobile or clamped to 1 line, multi-line on desktop) */}
                    <p className="text-[9px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 sm:mt-1.5 leading-tight sm:leading-relaxed line-clamp-1 sm:line-clamp-2">
                      {isBangla ? cat.descriptionBn : cat.descriptionEn}
                    </p>
                  </div>

                  {/* Price and Buttons Container */}
                  <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5 sm:space-y-2.5">
                    {/* Price Row */}
                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                      <span className="text-zinc-400 dark:text-zinc-500 font-medium hidden sm:inline">
                        {isBangla ? 'শুরু মাত্র' : 'Starts at'}:
                      </span>
                      <span className="font-extrabold text-orange-600 dark:text-orange-400 text-xs sm:text-sm">
                        ৳{toBengaliNumber(cat.startingPrice)}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                        {toBengaliNumber(cat.activeProfessionals || 50)} {isBangla ? 'মিস্ত্রি' : 'pros'}
                      </span>
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="grid grid-cols-2 gap-1 sm:gap-2">
                      <Link
                        to={`/professionals?category=${cat.id}`}
                        className="py-1 sm:py-2 text-center text-[9px] sm:text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors truncate"
                        title={isBangla ? 'মিস্ত্রি দেখুন' : 'View Technicians'}
                      >
                        {isBangla ? 'মিস্ত্রি' : 'Pros'}
                      </Link>
                      <Link
                        to={`/book?categoryId=${cat.id}`}
                        className="py-1 sm:py-2 text-center text-[9px] sm:text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-xs truncate"
                        title={t.actions.bookNow}
                      >
                        {t.actions.bookNow}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredCategories.length > itemsPerPage && (
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          {/* Results Summary Info */}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {isBangla
              ? `মোট ${toBengaliNumber(filteredCategories.length)}টি সার্ভিসের মধ্যে ${toBengaliNumber(startIndexNumber)}-${toBengaliNumber(endIndexNumber)} দেখানো হচ্ছে`
              : `Showing ${startIndexNumber}-${endIndexNumber} of ${filteredCategories.length} services`}
          </div>

          {/* Numbered Pagination Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isBangla ? 'আগের পৃষ্ঠা' : 'Prev'}</span>
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
              const isActive = pageNum === safeCurrentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {toBengaliNumber(pageNum)}
                </button>
              );
            })}

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <span className="hidden sm:inline">{isBangla ? 'পরের পৃষ্ঠা' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
