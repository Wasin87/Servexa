import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Search, ArrowRight, Flame, ShieldCheck, CheckCircle2, Sparkles, Wrench } from 'lucide-react';
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
    <section className="relative overflow-hidden bg-gradient-to-r from-orange-100/90 via-stone-50 to-zinc-200/90 dark:from-black dark:via-zinc-950 dark:to-orange-950/30 text-zinc-900 dark:text-white py-10 sm:py-14 lg:py-18 min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] flex items-center border-b border-zinc-300/80 dark:border-orange-500/30 transition-colors duration-300">
      
      {/* Light Mode Soft Orange-to-Gray Gradiation / Dark Mode Cinematic Glows */}
      <div className="absolute top-0 right-0 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-400/20 via-zinc-300/30 to-transparent dark:from-[#FA4D00]/30 dark:via-orange-950/20 dark:to-transparent blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-200/40 via-transparent to-transparent blur-[100px] pointer-events-none z-0" />

      {/* Subtle Tech Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(#FA4D00 1.5px, transparent 1.5px)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Text & Instant Selector */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
            
            {/* Top Rating Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-orange-500/30 bg-white/90 dark:bg-black/60 backdrop-blur-md text-[11px] sm:text-xs font-bold text-orange-700 dark:text-orange-300 shadow-md">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>
                <strong className="text-zinc-950 dark:text-white font-extrabold">4.9+</strong> {isBangla ? 'স্টার রেটিং | ২৫০+ ভেরিফাইড এক্সপার্ট' : 'Star Rating | 250+ Verified Experts'}
              </span>
            </div>

            {/* Professional Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-zinc-950 dark:text-white tracking-tight leading-[1.12] font-['Outfit','Plus_Jakarta_Sans',sans-serif]">
              {isBangla ? (
                <>
                  স্মার্ট হোম সার্ভিসের জন্য <br className="hidden sm:inline" />
                  সেরা <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-300 bg-clip-text text-transparent">প্রফেশনাল মিস্ত্রি।</span>
                </>
              ) : (
                <>
                  Smart Home Services by <br className="hidden sm:inline" />
                  Verified <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-300 bg-clip-text text-transparent">Technician Pros.</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 max-w-lg leading-relaxed font-normal">
              {t.hero.desc}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/professionals"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FA4D00] to-amber-600 hover:from-orange-600 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                <span>{isBangla ? 'এখনই মিস্ত্রি খুঁজুন' : 'Get Started'}</span>
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
              </Link>

              <Link
                to="/map"
                className="px-5 py-3 rounded-full border border-orange-500/40 hover:border-orange-500 bg-white/90 dark:bg-black/40 text-zinc-900 dark:text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
              >
                <Flame className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 animate-pulse" />
                <span>{isBangla ? 'লাইভ ম্যাপ' : 'Live Map'}</span>
              </Link>
            </div>

            {/* Compact Instant Service Finder Box */}
            <div className="pt-1">
              <div className="p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-black/80 backdrop-blur-xl border border-orange-500/30 max-w-lg shadow-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isBangla ? 'ইনস্ট্যান্ট সার্ভিস সিলেক্টর' : 'Instant Service Finder'}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-normal text-[10px]">Dhaka Metro</span>
                </div>

                <form onSubmit={handleQuickFind} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-orange-500/30 bg-stone-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FA4D00] font-medium"
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
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-orange-500/30 bg-stone-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FA4D00] font-medium"
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
                      className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-[#FA4D00] to-amber-600 hover:from-orange-600 hover:to-amber-500 text-white shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isBangla ? 'খুঁজুন' : 'Search'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>

          {/* Right Column: Professional Technicians Team / Experts with Helmets & Uniform */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
            
            <div className="relative w-full max-w-[420px] lg:max-w-none h-[340px] sm:h-[420px] lg:h-[460px] rounded-3xl overflow-hidden shadow-2xl border border-orange-500/30 group bg-zinc-900">
              
              {/* Professional Team of Technicians with Helmets and Safety Gear working */}
              <img
                src="https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1000&q=85"
                alt="Professional Home Service Expert Team with Helmets"
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-103"
              />

              {/* Gentle Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

              {/* Floating Live Badge */}
              <div className="absolute top-3 left-3 z-20">
                <div className="bg-black/85 backdrop-blur-md text-white font-semibold px-3 py-1 rounded-full border border-orange-500/40 flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px]">{isBangla ? '২৪৩+ এক্সপার্ট লাইভ' : '243+ Experts Live'}</span>
                </div>
              </div>

              {/* Floating Bottom Trust Badge */}
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-2xl bg-black/85 backdrop-blur-xl border border-orange-500/40 text-white flex items-center justify-between shadow-xl z-20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-amber-300">{isBangla ? 'স্মার্ট হোম সার্ভিস টিম' : 'Smart Service Expert Team'}</p>
                    <p className="text-[10px] text-zinc-300">{isBangla ? 'নিরাপত্তা হ্যাট ও ইউনিফর্ম পরিহিত' : 'Verified with Safety Helmets'}</p>
                  </div>
                </div>
                <span className="text-sm">⭐</span>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
