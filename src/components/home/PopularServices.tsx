import React from 'react';
import { Link } from 'react-router-dom';
import {
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
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CATEGORY_BANNERS } from '../../pages/ServicesPage';

const iconMap: Record<string, React.ElementType> = {
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
  Settings
};

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';

export const PopularServices: React.FC = () => {
  const { categories } = useApp();
  const { isBangla } = useLanguage();

  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>{isBangla ? 'পপুলার সার্ভিস ক্যাটাগরি' : 'Popular Categories'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {isBangla ? 'যে কোনো সমস্যায়, বিশ্বস্ত সমাধান' : 'Skilled Specialists for Every Need'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            {isBangla
              ? 'নির্ধারিত ভিজিটিং ফি এবং স্বচ্ছ রেটের সাথে যাচাইকৃত অভিজ্ঞ টেকনিশিয়ান বেছে নিন।'
              : 'Choose verified technicians with transparent visiting fees and guaranteed satisfaction.'}
          </p>
        </div>

        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 transition-colors shrink-0"
        >
          <span>{isBangla ? 'সকল ২১টি সার্ভিস দেখুন' : 'View all 21 services'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid of Categories - Same Professional Banner Cards as Services Page */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {categories.slice(0, 8).map((cat) => {
          const IconComponent = iconMap[cat.icon] || Wrench;
          const bannerUrl = CATEGORY_BANNERS[cat.id] || DEFAULT_BANNER;

          return (
            <Link
              key={cat.id}
              to={`/professionals?category=${cat.id}`}
              className="group relative rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden hover:border-orange-500 dark:hover:border-orange-500/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-250 flex flex-col justify-between"
            >
              {/* Professional Category Banner Section */}
              <div className="relative w-full h-28 sm:h-36 overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                <img
                  src={bannerUrl}
                  alt={cat.nameEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Subtle Gradient Scrim on Top of Banner */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                {/* Floating Category Icon Badge */}
                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-lg border border-orange-500/30 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                {/* Emergency / Popular Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {cat.emergencyAvailable && (
                    <span className="text-[9px] sm:text-[10px] font-black text-white bg-rose-600/90 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs">
                      {isBangla ? '🚨 জরুরি' : '🚨 24/7'}
                    </span>
                  )}
                  {cat.popular && !cat.emergencyAvailable && (
                    <span className="text-[9px] sm:text-[10px] font-black text-white bg-orange-600/90 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs">
                      ⭐ {isBangla ? 'জনপ্রিয়' : 'Top'}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Content Body */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-xs sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 leading-snug">
                    {isBangla ? cat.nameBn : cat.nameEn}
                  </h3>

                  <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                    {isBangla ? cat.descriptionBn : cat.descriptionEn}
                  </p>
                </div>

                {/* Price & Professional Availability Footer */}
                <div className="pt-2.5 sm:pt-3 mt-2 sm:mt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-400 font-medium">{isBangla ? 'ভিজিটিং চার্জ' : 'Visiting Fee'}</span>
                    <span className="font-black text-zinc-900 dark:text-white text-xs sm:text-sm">
                      ৳{cat.startingPrice}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-bold text-orange-600 dark:text-orange-400 text-[11px] bg-orange-50 dark:bg-orange-950/40 px-2 py-1 rounded-lg border border-orange-500/20">
                    <span>{cat.activeProfessionals}</span>
                    <span>{isBangla ? 'জন প্রস্তুত' : 'Pros'}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
