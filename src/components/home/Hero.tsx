import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Search, ArrowRight, Flame, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';
import heroExactLogoLightImg from '../../assets/images/servexa_hero_exact_uploaded_logo_light_1794059467651.jpg';
import heroExactLogoDarkImg from '../../assets/images/servexa_hero_exact_uploaded_logo_dark_1794059468280.jpg';

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
    <section className="relative overflow-hidden min-h-[420px] sm:min-h-[500px] lg:min-h-[580px] flex items-center border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300 select-none">
      
      {/* 1. Theme-Adaptive Exact Uploaded Logo Branded Hero Banner Background */}
      <div className="absolute inset-0 z-0">
        {/* Light Mode Branded Banner */}
        <img
          src={heroExactLogoLightImg}
          alt="Servexa Light Mode Branded Home Service Banner"
          className="w-full h-full object-cover object-[72%_center] sm:object-[70%_center] lg:object-center select-none dark:hidden"
          loading="eager"
          decoding="async"
        />

        {/* Dark Mode Branded Banner */}
        <img
          src={heroExactLogoDarkImg}
          alt="Servexa Dark Mode Branded Home Service Banner"
          className="w-full h-full object-cover object-[72%_center] sm:object-[70%_center] lg:object-center select-none hidden dark:block"
          loading="eager"
          decoding="async"
        />

        {/* Rich Orange & Theme-Adaptive Gradient Overlays on Left Side */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-100/95 via-stone-50/90 to-transparent dark:from-zinc-950/98 dark:via-zinc-950/80 dark:to-transparent sm:from-orange-100/90 sm:via-amber-50/70 sm:to-transparent sm:dark:from-zinc-950/95 sm:dark:via-zinc-950/60 sm:dark:to-transparent pointer-events-none" />
        
        {/* Left Side Vibrant Orange Radial Electrical Glow Accent */}
        <div className="absolute top-0 left-0 w-full sm:w-2/3 h-full bg-[radial-gradient(circle_at_20%_40%,rgba(249,115,22,0.22),transparent_70%)] dark:bg-[radial-gradient(circle_at_20%_40%,rgba(249,115,22,0.30),transparent_70%)] pointer-events-none" />

        {/* Subtle Electrical Circuit & Grid Accent Lines on Left Side */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-1/2 opacity-15 dark:opacity-25 pointer-events-none overflow-hidden">
          <svg className="w-full h-full text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 400 400" preserveAspectRatio="none">
            <path d="M0 50 H 120 L 160 90 H 300" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M0 180 H 90 L 140 230 H 250" stroke="currentColor" strokeWidth="1.5" />
            <path d="M0 320 H 180 L 220 280 H 350" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
            <circle cx="160" cy="90" r="4" fill="currentColor" />
            <circle cx="140" cy="230" r="4" fill="currentColor" />
            <circle cx="220" cy="280" r="4" fill="currentColor" />
          </svg>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-stone-100 via-transparent to-stone-100/40 dark:from-zinc-950 dark:via-transparent dark:to-zinc-950/30 sm:hidden pointer-events-none" />
      </div>

      {/* 2. Content Overlay: Cleanly Separated from Banner Art, Mobile Compact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-8 sm:py-14 lg:py-18">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* Left Column: Typography, Badges & Instant Service Finder */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-5 text-left">
            
            {/* Top Rating Trust Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500/30 bg-white/95 dark:bg-zinc-950/85 backdrop-blur-md text-[11px] sm:text-xs font-bold text-orange-700 dark:text-amber-300 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
              <span>
                <strong className="text-zinc-900 dark:text-white font-black">4.9+</strong> {isBangla ? 'স্টার রেটিং | ভেরিফাইড এক্সপার্ট' : 'Star Rating | Verified Experts'}
              </span>
            </div>

            {/* Professional Headline - Compact on mobile, Platform on next line */}
            <h1 className="text-[22px] sm:text-4xl lg:text-5xl font-black text-zinc-950 dark:text-white tracking-tight leading-[1.15]">
              {isBangla ? (
                <>
                  স্মার্ট হোম সার্ভিস{' '}
                  <br className="sm:hidden" />
                  <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-300 bg-clip-text text-transparent">
                    প্ল্যাটফর্ম
                  </span>
                </>
              ) : (
                <>
                  Smart Home Services{' '}
                  <br className="sm:hidden" />
                  <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-300 bg-clip-text text-transparent">
                    platform
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle - Hidden on small mobile to ensure banner visualization */}
            <p className="hidden sm:block text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 max-w-lg leading-relaxed font-medium">
              {t.hero.desc}
            </p>

            {/* Action Buttons - Compact icon-based on mobile */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                to="/professionals"
                className="px-3.5 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-[11px] sm:text-sm shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-2.5 h-2.5 text-white" />
                </div>
                <span>{isBangla ? 'মিস্ত্রি খুঁজুন' : 'Get Started'}</span>
              </Link>

              <Link
                to="/heatmap"
                className="px-3 sm:px-5 py-2 sm:py-3 rounded-full border border-orange-500/40 hover:border-orange-500 bg-white/90 dark:bg-zinc-950/70 text-zinc-900 dark:text-white font-bold text-[11px] sm:text-sm backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <Flame className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 animate-pulse" />
                <span>{isBangla ? 'হিটম্যাপ' : 'Heatmap'}</span>
              </Link>
            </div>

            {/* Compact Instant Service Finder Box - Ultra Slim on mobile */}
            <div className="pt-0.5 sm:pt-1">
              <div className="p-1 sm:p-4 rounded-xl sm:rounded-2xl bg-white/98 dark:bg-zinc-950/90 backdrop-blur-xl border border-orange-500/30 max-w-[215px] sm:max-w-lg shadow-xl space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between text-[8px] sm:text-[11px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 dark:text-amber-400" />
                    {isBangla ? 'ইনস্ট্যান্ট ফাইন্ডার' : 'Instant Finder'}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-normal text-[7px] sm:text-[10px]">Dhaka</span>
                </div>

                <form onSubmit={handleQuickFind} className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                  <div className="sm:col-span-5">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-1.5 py-0.5 sm:px-2.5 sm:py-2 text-[9px] sm:text-xs rounded-md sm:rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    >
                      {categories.slice(0, 10).map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                          {isBangla ? cat.nameBn : cat.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="w-full px-1.5 py-0.5 sm:px-2.5 sm:py-2 text-[9px] sm:text-xs rounded-md sm:rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
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
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="w-full py-1 px-1.5 sm:py-2 sm:px-3 text-[9px] sm:text-xs font-black rounded-md sm:rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Search className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>{isBangla ? 'খুঁজুন' : 'Search'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>

          {/* Right Column: Spacer for technician visibility */}
          <div className="lg:col-span-5 hidden lg:block pointer-events-none" />

        </div>
      </div>
    </section>
  );
};
