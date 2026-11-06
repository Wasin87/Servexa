import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ShieldCheck,
  MapPin,
  Search,
  Scale,
  Wrench,
  Check,
  User,
  ArrowRight,
  Sparkles,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CompareModal } from '../components/common/CompareModal';
import { toBengaliNumber } from '../utils/geoUtils';

export const ProfessionalsPage: React.FC = () => {
  const { technicians, categories, addToCompare, removeFromCompare, comparedTechIds } = useApp();
  const { t, isBangla } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialCat = searchParams.get('category') || 'all';
  const initialArea = searchParams.get('area') || 'all';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'jobs' | 'experience'>('rating');
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Responsive device check: Mobile (<768px) vs Desktop (>=768px)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedArea, availabilityFilter, searchQuery, sortBy, isMobile]);

  const areas = ['all', 'Mirpur', 'Dhanmondi', 'Uttara', 'Mohammadpur', 'Gulshan', 'Banani', 'Bashundhara', 'Farmgate', 'Badda'];

  const getCategoryName = (skillId: string) => {
    const cat = categories.find((c) => c.id === skillId);
    if (!cat) return isBangla ? 'টেকনিশিয়ান' : 'Technician';
    return isBangla ? cat.nameBn : cat.nameEn;
  };

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

  // Per user requirements:
  // Desktop: 9 professionals per page (3 columns x 3 rows = 9)
  // Mobile: 8 professionals per page (2 columns x 4 rows = 8)
  const itemsPerPage = isMobile ? 8 : 9;
  const totalPages = Math.max(1, Math.ceil(filteredTechnicians.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTechnicians = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * itemsPerPage;
    return filteredTechnicians.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredTechnicians, safeCurrentPage, itemsPerPage]);

  const startIndexNumber = filteredTechnicians.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endIndexNumber = Math.min(safeCurrentPage * itemsPerPage, filteredTechnicians.length);

  return (
    <div className="py-6 sm:py-10 max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>{isBangla ? 'যাচাইকৃত পেশাদার মিস্ত্রি নেটওয়ার্ক' : 'Verified Technician Network'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {isBangla ? 'দক্ষ মিস্ত্রি খুঁজুন' : 'Find Verified Professionals'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isBangla
              ? 'আইডি ও স্কিল ভেরিফাইড টেকনিশিয়ানদের রেটিং, অভিজ্ঞতা ও এলাকা দেখে সরাসরি বেছে নিন'
              : 'Browse background-checked specialists by trade, area, rating, and transparent price.'}
          </p>
        </div>

        {comparedTechIds.length > 0 && (
          <button
            onClick={() => setCompareModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-colors shrink-0 cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>{t.compare.title} ({comparedTechIds.length}/3)</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-zinc-900 p-3 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs mb-6 sm:mb-8 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBangla ? 'নাম বা কাজের ধরন...' : 'Search name or skill...'}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-medium cursor-pointer"
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
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-medium cursor-pointer"
            >
              <option value="all">{t.search.allLocations}</option>
              {areas.filter(a => a !== 'all').map((a) => (
                <option key={a} value={a}>
                  {a}, Dhaka
                </option>
              ))}
            </select>
          </div>

          {/* Availability & Sort */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-medium cursor-pointer"
            >
              <option value="all">{isBangla ? 'সকল প্রাপ্যতা' : 'All Availability'}</option>
              <option value="available">🟢 {isBangla ? 'এখনই এভেইলেবল' : t.tech.available}</option>
              <option value="busy">🟡 {isBangla ? 'কাজে ব্যস্ত' : t.tech.busy}</option>
              <option value="emergency">⚡ {isBangla ? 'জরুরি প্রস্তুত' : 'Emergency Ready'}</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 font-medium cursor-pointer"
            >
              <option value="rating">★ {t.search.sortRating}</option>
              <option value="price">৳ {t.search.sortPriceLow}</option>
              <option value="jobs">✓ {t.search.sortJobs}</option>
              <option value="experience">⏱️ {t.search.sortExperience}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Display:
          Mobile: grid-cols-2 (2 cards per row, 4 rows = 8 items per page)
          Desktop: md:grid-cols-3 (3 cards per row, 3 rows = 9 items per page) */}
      {filteredTechnicians.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-sm">
          <p>{t.search.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6">
          {paginatedTechnicians.map((tech) => {
            const isCompared = comparedTechIds.includes(tech.id);
            const primarySkill = tech.skills[0] ? getCategoryName(tech.skills[0]) : '';

            return (
              <div
                key={tech.id}
                onClick={() => navigate(`/professionals/${tech.id}`)}
                className="group relative rounded-xl sm:rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 sm:p-5 flex flex-col justify-between hover:shadow-xl hover:border-orange-500/60 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
              >
                {/* Top Subtle Hover Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Top Profile Header: Circle Image + Details */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-start gap-2 sm:gap-3.5 mb-2 sm:mb-4">
                    {/* Circle Profile Image with Availability Indicator */}
                    <div className="relative shrink-0 mx-auto sm:mx-0">
                      <img
                        src={tech.avatar}
                        alt={tech.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-orange-500/20 group-hover:ring-orange-500 transition-all shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-zinc-900 ${
                          tech.availability === 'available'
                            ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                            : tech.availability === 'busy'
                            ? 'bg-amber-500'
                            : 'bg-zinc-400'
                        }`}
                        title={tech.availability}
                      />
                    </div>

                    {/* Name, Category & Verified Badge */}
                    <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-between gap-1">
                        <h3 className="font-bold text-xs sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 transition-colors truncate">
                          {tech.name}
                        </h3>

                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isBangla ? 'ভেরিফায়েড' : 'Verified'}</span>
                        </span>
                      </div>

                      {/* Primary Category / Trade Tag */}
                      {primarySkill && (
                        <div className="inline-flex items-center justify-center sm:justify-start gap-1 text-[11px] sm:text-xs font-semibold text-orange-600 dark:text-orange-400 mt-0.5 truncate w-full">
                          <Wrench className="w-3 h-3 text-orange-500 shrink-0" />
                          <span className="truncate">{primarySkill}</span>
                        </div>
                      )}

                      {/* Rating & Review Count */}
                      <div className="flex items-center justify-center sm:justify-start gap-1 text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span>{tech.rating}</span>
                        <span className="text-zinc-400 font-normal">({toBengaliNumber(tech.reviewCount)})</span>
                        <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">·</span>
                        <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400 font-medium">
                          {toBengaliNumber(tech.experienceYears)} {isBangla ? 'বছর' : 'yrs'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mb-2.5 sm:mb-4 bg-stone-50 dark:bg-zinc-800/60 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-zinc-100 dark:border-zinc-800 truncate">
                    <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                    <span className="truncate">{tech.primaryArea}, {tech.city}</span>
                  </div>
                </div>

                {/* Price and Action Buttons */}
                <div
                  className="pt-2 sm:pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 sm:space-y-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Transparent Price Row */}
                  <div className="flex items-center justify-between text-[10px] sm:text-xs px-0.5">
                    <div>
                      <span className="text-zinc-400 text-[9px] sm:text-[11px]">{t.tech.visitingFee}: </span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">৳{toBengaliNumber(tech.visitingFee)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[9px] sm:text-[11px]">{t.tech.startingPrice}: </span>
                      <span className="font-bold text-orange-600 dark:text-orange-400 text-xs sm:text-sm">৳{toBengaliNumber(tech.startingPrice)}</span>
                    </div>
                  </div>

                  {/* Book Now & View Profile Action Buttons */}
                  <div className="grid grid-cols-2 gap-1 sm:gap-2">
                    <Link
                      to={`/book?techId=${tech.id}`}
                      className="py-1.5 sm:py-2.5 text-center text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-xs active:scale-98 truncate"
                    >
                      {t.actions.bookNow}
                    </Link>

                    <Link
                      to={`/professionals/${tech.id}`}
                      className="inline-flex items-center justify-center gap-1 py-1.5 sm:py-2.5 text-center text-[10px] sm:text-xs font-semibold rounded-lg sm:rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors truncate"
                    >
                      <User className="w-3 h-3 text-zinc-500 shrink-0 hidden sm:inline" />
                      <span className="truncate">{t.actions.viewProfile}</span>
                    </Link>
                  </div>

                  {/* Compare Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompared) {
                        removeFromCompare(tech.id);
                      } else {
                        addToCompare(tech.id);
                      }
                    }}
                    className={`w-full py-1 text-center text-[9px] sm:text-[11px] font-medium rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer border ${
                      isCompared
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/60 font-bold'
                        : 'text-zinc-500 hover:text-orange-600 border-transparent hover:bg-stone-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Scale className="w-3 h-3" />
                    <span className="truncate">{isCompared ? (isBangla ? 'তালিকা থেকে বাদ' : 'Remove') : (isBangla ? 'তুলনা করুন' : 'Compare')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredTechnicians.length > itemsPerPage && (
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          {/* Results Summary Info */}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {isBangla
              ? `মোট ${toBengaliNumber(filteredTechnicians.length)} জন মিস্ত্রির মধ্যে ${toBengaliNumber(startIndexNumber)}-${toBengaliNumber(endIndexNumber)} প্রদর্শিত হচ্ছে`
              : `Showing ${startIndexNumber}-${endIndexNumber} of ${filteredTechnicians.length} professionals`}
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

      {/* Compare Modal */}
      {compareModalOpen && (
        <CompareModal isOpen={compareModalOpen} onClose={() => setCompareModalOpen(false)} />
      )}
    </div>
  );
};
