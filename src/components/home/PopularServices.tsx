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

export const PopularServices: React.FC = () => {
  const { categories } = useApp();
  const { t, isBangla } = useLanguage();

  return (
    <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">
            {isBangla ? 'জনপ্রিয় সার্ভিসসমূহ' : 'Popular Categories'}
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 transition-colors"
        >
          <span>{isBangla ? 'সকল ২১টি সার্ভিস দেখুন' : 'View all 21 services'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {categories.slice(0, 8).map((cat) => {
          const IconComponent = iconMap[cat.icon] || Wrench;
          return (
            <Link
              key={cat.id}
              to={`/professionals?category=${cat.id}`}
              className="group relative p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/80 dark:hover:border-orange-500/80 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-200">
                  <IconComponent className="w-6 h-6" />
                </div>

                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {isBangla ? cat.nameBn : cat.nameEn}
                </h3>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {isBangla ? cat.descriptionBn : cat.descriptionEn}
                </p>
              </div>

              {/* Price and Tech count footer */}
              <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  ৳{cat.startingPrice} <span className="text-[10px] text-zinc-400 font-normal">থেকে শুরু</span>
                </span>
                <span className="text-[11px] text-zinc-500">
                  {cat.activeProfessionals} {isBangla ? 'জন প্রস্তুত' : 'Active'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
