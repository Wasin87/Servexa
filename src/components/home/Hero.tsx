import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Star, Zap, Search, MapPin, ArrowRight, Flame, Sparkles, CheckCircle2, Radio } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';

export const Hero: React.FC = () => {
  const { t, isBangla } = useLanguage();
  const { categories } = useApp();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>('electrical');
  const [selectedArea, setSelectedArea] = useState<string>('Mirpur');

  const handleQuickFind = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/professionals?category=${selectedCategory}&area=${selectedArea}`);
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-stone-50 dark:from-orange-950/20 dark:via-zinc-950 dark:to-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800">
      {/* Radiant Orange Glow Ambient Halo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-orange-500/15 dark:bg-orange-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Live Indicator Banner */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-xs font-bold text-orange-600 dark:text-orange-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                <span>{isBangla ? 'বাংলাদেশের ১ নম্বর অন-ডিমান্ড টেকনিশিয়ান নেটওয়ার্ক' : '#1 On-Demand Technician Network in Bangladesh'}</span>
              </div>

              <Link
                to="/heatmap"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600 text-white text-xs font-bold shadow-sm shadow-orange-600/30 hover:bg-orange-500 transition-colors animate-float"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{isBangla ? 'ঢাকা লাইভ হিটম্যাপ' : 'Live Heatmap'}</span>
              </Link>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight leading-[1.12]">
              {t.hero.title1}{' '}
              <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent block sm:inline">
                {t.hero.title2}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
              {t.hero.desc}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/professionals"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-xl shadow-orange-600/30 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <span>{t.hero.ctaPrimary}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/heatmap"
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-2xl border border-orange-500/40 bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all"
              >
                <Flame className="w-4 h-4 text-orange-500" />
                <span>{isBangla ? 'ডিমান্ড হিটম্যাপ দেখুন' : 'View Demand Heatmap'}</span>
              </Link>
            </div>

            {/* Trust Proof Points */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 max-w-lg text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">{t.hero.badgeVerified}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">{t.hero.badgeRating}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">{t.hero.badgeEmergency}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Composition & Floating Quick Booking Card */}
          <div className="lg:col-span-5 relative">
            {/* Visual Collage of skilled professionals */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-orange-500/20 dark:border-orange-500/30 bg-zinc-900 group">
              <img
                src="/src/assets/images/kormigo_technician_hero_1790621728174.jpg"
                alt="Servexa Technician Service"
                className="w-full h-[430px] object-cover opacity-90 group-hover:scale-102 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

              {/* Service Badges over picture */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-xs">
                <div className="bg-zinc-900/85 backdrop-blur-md text-white font-medium px-3 py-1.5 rounded-xl border border-zinc-700/50 flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isBangla ? '২৪৩+ মিস্ত্রি ঢাকায় প্রস্তুত' : '243+ Pros Ready in Dhaka'}</span>
                </div>
                <div className="bg-gradient-to-r from-orange-600 to-amber-600 backdrop-blur-md text-white font-black px-3 py-1 rounded-lg text-xs shadow-md">
                  KORMI GO
                </div>
              </div>

              {/* Bottom Card Overlay: Quick Booking Form */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.hero.cardTitle}
                  </h3>
                  <span className="text-[11px] text-zinc-500 font-medium">Dhaka Metro</span>
                </div>

                <form onSubmit={handleQuickFind} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Service Category */}
                    <div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                      >
                        {categories.slice(0, 10).map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {isBangla ? cat.nameBn : cat.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dhaka Area */}
                    <div>
                      <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                      >
                        <option value="Mirpur">মিরপুর (Mirpur)</option>
                        <option value="Dhanmondi">ধানমন্ডি (Dhanmondi)</option>
                        <option value="Uttara">উত্তরা (Uttara)</option>
                        <option value="Mohammadpur">মোহাম্মদপুর (Mohammadpur)</option>
                        <option value="Gulshan">গুলশান (Gulshan)</option>
                        <option value="Banani">বনানী (Banani)</option>
                        <option value="Bashundhara">বসুন্ধরা (Bashundhara)</option>
                        <option value="Farmgate">ফার্মগেট (Farmgate)</option>
                        <option value="Badda">বাড্ডা (Badda)</option>
                        <option value="Old Dhaka">পুরান ঢাকা (Old Dhaka)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{t.hero.findBtn}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Floating Trust Badge */}
            <div className="hidden sm:flex absolute -top-4 -right-4 bg-white dark:bg-zinc-800 p-3 rounded-2xl shadow-xl border border-orange-500/25 items-center gap-2.5 animate-float">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">৭-৩০ দিনের ওয়ারেন্টি</p>
                <p className="text-[10px] text-zinc-500">১০০% ফ্রি সার্ভিস নিশ্চয়তা</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

