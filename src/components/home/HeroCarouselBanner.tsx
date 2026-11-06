import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface CarouselSlide {
  id: string;
  badgeBn: string;
  badgeEn: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  ctaTextBn: string;
  ctaTextEn: string;
  ctaLink: string;
  secondaryBtnBn?: string;
  secondaryBtnEn?: string;
  secondaryBtnLink?: string;
  bgGradient: string;
  image: string;
  tag: string;
}

const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: 'ac-master',
    badgeBn: '❄️ এসি স্পেশালিস্ট কেয়ার',
    badgeEn: '❄️ AC Specialist Care',
    titleBn: 'এসি মাস্টার সার্ভিস ও হাই-প্রেসার জেট ওয়াশ',
    titleEn: 'AC Master Service & High-Pressure Jet Wash',
    subtitleBn: 'ইনডোর-আউটডোর ডিপ কয়েল ওয়াশ, গ্যাস চার্জিং ও কুলিং টেস্ট।',
    subtitleEn: 'Deep indoor-outdoor jet cleaning, gas charging & cooling test.',
    ctaTextBn: 'এসি সার্ভিস বুক করুন',
    ctaTextEn: 'Book AC Service',
    ctaLink: '/book?category=ac_repair',
    secondaryBtnBn: 'প্রফেশনাল দেখুন',
    secondaryBtnEn: 'View Technicians',
    secondaryBtnLink: '/professionals?category=ac_repair',
    bgGradient: 'from-blue-950 via-zinc-900 to-sky-950',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80',
    tag: '১৫ মিনিটের রেসপন্স'
  },
  {
    id: 'electrical-short',
    badgeBn: '⚡ ২৪/৭ জরুরি ইলেকট্রিক',
    badgeEn: '⚡ 24/7 Emergency Electrical',
    titleBn: 'শর্ট সার্কিট লিক, সার্কিট ব্রেকার ও ওয়্যারিং সমাধান',
    titleEn: 'Short Circuit, Circuit Breakers & Rewiring',
    subtitleBn: 'জরুরি পাওয়ার ট্রিপিং, ডিবি বক্স ও মিটার ক্যাবলিং ফিক্স।',
    subtitleEn: 'Instant dispatch for trip fixes & power restoration.',
    ctaTextBn: 'ইলেকট্রিশিয়ান ডাকুন',
    ctaTextEn: 'Call Electrician',
    ctaLink: '/book?category=electrical',
    secondaryBtnBn: 'জরুরি হেল্পলাইন',
    secondaryBtnEn: 'Emergency Call',
    secondaryBtnLink: '/emergency',
    bgGradient: 'from-amber-950 via-zinc-900 to-orange-950',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    tag: 'ফ্রি ভিজিটিং গ্যারান্টি'
  },
  {
    id: 'plumbing-leak',
    badgeBn: '💧 প্লাম্বিং সমাধান',
    badgeEn: '💧 Plumbing Solutions',
    titleBn: 'হাই-প্রেসার পাইপ লিক বন্ধ ও ওয়াটার পাম্প রিপেয়ার',
    titleEn: 'High Pressure Pipe Leak Stop & Pump Repair',
    subtitleBn: 'বেসিন, কমোড, সিঙ্ক ও সিক্রেট ওয়াল পাইপ লিকেজ কাজ।',
    subtitleEn: 'Secret wall leaks, basin, commode & pump motor fix.',
    ctaTextBn: 'প্লাম্বার বুক করুন',
    ctaTextEn: 'Book Plumber',
    ctaLink: '/book?category=plumbing',
    secondaryBtnBn: 'ডিমান্ড হিটম্যাপ',
    secondaryBtnEn: 'View Heatmap',
    secondaryBtnLink: '/heatmap',
    bgGradient: 'from-cyan-950 via-zinc-900 to-teal-950',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80',
    tag: '১৪ দিনের ওয়ারেন্টি'
  },
  {
    id: 'cctv-smartlock',
    badgeBn: '🛡️ স্মার্ট সিকিউরিটি',
    badgeEn: '🛡️ Smart Security',
    titleBn: 'স্মার্ট ফিঙ্গারপ্রিন্ট ডোর লক ও সিসিটিভি ইনস্টলেশন',
    titleEn: 'Smart Door Locks & CCTV Surveillance',
    subtitleBn: 'হোম ও অফিস সিকিউরিটি ক্যামেরা ও বায়োমেট্রিক সিস্টেম।',
    subtitleEn: 'Commercial IP cameras & biometric smart locks.',
    ctaTextBn: 'সিকিউরিটি ফিটিং',
    ctaTextEn: 'Security Setup',
    ctaLink: '/book?category=cctv_installation',
    bgGradient: 'from-slate-950 via-zinc-900 to-indigo-950',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80',
    tag: 'অ্যাডভান্সড সেটআপ'
  },
  {
    id: 'customer-guide',
    badgeBn: '📱 গ্রাহকদের জন্য গাইড',
    badgeEn: '📱 Customer Booking Guide',
    titleBn: 'মাত্র ৩০ সেকেন্ডে কাছের বিশ্বস্ত মিস্ত্রি খুঁজে বুক করুন',
    titleEn: 'Find & Book Nearby Verified Pros in 30 Seconds',
    subtitleBn: 'লাইভ জিপিএস ম্যাপ দেখে সরাসরি পেশাদারদের রেট চেক করুন।',
    subtitleEn: 'Browse local pros via real-time map & transparent fees.',
    ctaTextBn: 'লাইভ ম্যাপে মিস্ত্রি দেখুন',
    ctaTextEn: 'Find Pros on Map',
    ctaLink: '/map',
    bgGradient: 'from-orange-950 via-stone-900 to-zinc-950',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    tag: 'সহজ চ্যাট ও বুকিং'
  },
  {
    id: 'technician-join',
    badgeBn: '👷 মিস্ত্রিদের জন্য ইনকাম গাইড',
    badgeEn: '👷 Technician Earning Opportunity',
    titleBn: 'Servexa-তে যোগ দিয়ে প্রতিদিন ৩,০০০+ টাকা আয় করুন',
    titleEn: 'Join Servexa Pro Fleet & Earn ৳3000+/Day Locally',
    subtitleBn: 'লাইভ জব ফিড ও ডিমান্ড হিটম্যাপে স্থানীয় কাজের রিকোয়েস্ট পান।',
    subtitleEn: 'Access local demand hotspots & get guaranteed job calls.',
    ctaTextBn: 'টেকনিশিয়ান রেজিস্টার',
    ctaTextEn: 'Register as Pro',
    ctaLink: '/become-professional',
    bgGradient: 'from-emerald-950 via-zinc-900 to-teal-950',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
    tag: 'গ্যারান্টেড ইনকাম'
  }
];

export const HeroCarouselBanner: React.FC = () => {
  const { isBangla } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fast & lively auto-scroll (2500ms delay)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const currentSlide = CAROUSEL_SLIDES[currentIndex];

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 pb-8 sm:pb-12 border-b border-zinc-200/60 dark:border-zinc-800/80">
      {/* Low Height, Wide Aspect Ratio Sleek Banner Container */}
      <div className="relative w-full h-[220px] sm:h-[250px] md:h-[270px] rounded-2xl sm:rounded-3xl overflow-hidden border border-orange-500/25 dark:border-orange-500/30 shadow-2xl transition-all duration-300 group">
        
        {/* Slide Content Container */}
        <div className="absolute inset-0 bg-stone-100 dark:bg-zinc-950 transition-all duration-500 flex items-center justify-between overflow-hidden">
          
          {/* Left Text Content Area (Responsive width on mobile & desktop so right image is never blank) */}
          <div className="relative z-10 w-3/5 sm:w-7/12 md:w-3/5 h-full px-3.5 sm:px-8 lg:px-10 py-3.5 sm:py-6 flex flex-col justify-between bg-gradient-to-r from-orange-100/95 via-amber-50/90 to-transparent dark:from-zinc-950/95 dark:via-zinc-900/85 dark:to-transparent backdrop-blur-md">
            <div>
              {/* Badge & Guarantee tag */}
              <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2.5">
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-orange-500/15 dark:bg-orange-500/20 border border-orange-500/40 text-orange-800 dark:text-orange-400 font-extrabold text-[9px] sm:text-xs uppercase tracking-wider backdrop-blur-md truncate max-w-[180px] sm:max-w-none">
                  {isBangla ? currentSlide.badgeBn : currentSlide.badgeEn}
                </span>

                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30 dark:border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{currentSlide.tag}</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm sm:text-2xl md:text-3xl font-black text-zinc-950 dark:text-white leading-snug sm:leading-tight tracking-tight line-clamp-2">
                {isBangla ? currentSlide.titleBn : currentSlide.titleEn}
              </h3>

              {/* Subtitle */}
              <p className="text-[10px] sm:text-xs md:text-sm text-zinc-700 dark:text-zinc-300 font-medium mt-1 sm:mt-2 leading-relaxed line-clamp-2 max-w-xl">
                {isBangla ? currentSlide.subtitleBn : currentSlide.subtitleEn}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2">
              <Link
                to={currentSlide.ctaLink}
                className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-[11px] sm:text-sm shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
              >
                <span>{isBangla ? currentSlide.ctaTextBn : currentSlide.ctaTextEn}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>

              {currentSlide.secondaryBtnBn && currentSlide.secondaryBtnLink && (
                <Link
                  to={currentSlide.secondaryBtnLink}
                  className="hidden sm:inline-flex px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/90 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 border border-zinc-300/80 dark:border-white/20 text-zinc-900 dark:text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-colors shrink-0 shadow-xs"
                >
                  {isBangla ? currentSlide.secondaryBtnBn : currentSlide.secondaryBtnEn}
                </Link>
              )}
            </div>
          </div>

          {/* Right Side Photo - 100% Visible & Responsive on Mobile & Desktop */}
          <div className="absolute top-0 right-0 bottom-0 w-2/5 sm:w-5/12 md:w-2/5 overflow-hidden">
            <img
              src={currentSlide.image}
              alt={currentSlide.titleEn}
              className="w-full h-full object-cover object-center shadow-2xl transition-transform duration-500"
            />
            {/* Left Edge Smooth Vignette for Seamless Text Overlay */}
            <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-orange-100/90 via-amber-50/40 to-transparent dark:from-zinc-950 dark:via-zinc-900/60 dark:to-transparent" />
          </div>

        </div>

        {/* Carousel Controls: Previous / Next Arrows */}
        <button
          onClick={handlePrev}
          type="button"
          aria-label="Previous slide"
          className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-orange-600 text-white backdrop-blur-md flex items-center justify-center opacity-80 hover:opacity-100 transition-all cursor-pointer border border-white/20"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={handleNext}
          type="button"
          aria-label="Next slide"
          className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-orange-600 text-white backdrop-blur-md flex items-center justify-center opacity-80 hover:opacity-100 transition-all cursor-pointer border border-white/20"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </button>

        {/* Carousel Dot Indicators */}
        <div className="absolute bottom-2 right-3 sm:bottom-3 sm:right-6 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-white/10">
          {CAROUSEL_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? 'w-4 sm:w-6 bg-orange-500'
                  : 'w-1 sm:w-2 bg-white/40 hover:bg-white/80'
              }`}
              title={isBangla ? slide.badgeBn : slide.badgeEn}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
