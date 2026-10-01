import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { BeforeAfterSlider } from '../common/BeforeAfterSlider';
import { Sparkles } from 'lucide-react';

export const BeforeAfterShowcase: React.FC = () => {
  const { t, isBangla } = useLanguage();

  const showcaseProjects = [
    {
      id: 'show-1',
      titleEn: 'Living Room Dampproof Wall Painting & Velvet Finish',
      titleBn: 'লিভিং রুমের ড্যাম্প দেয়াল পুটি ও রয়্যাল পেইন্ট ফিনিশ',
      categoryEn: 'Painting & Decoration',
      categoryBn: 'রং মিস্ত্রি ও ডেকোরেশন',
      techName: 'শাকিল হাওলাদার (Shakil Hawlader)',
      location: 'উত্তরা সেক্টর ৭, ঢাকা',
      before: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
      after: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
      descriptionEn: 'Heavily peeled plaster removed, anti-fungal waterproofing coat applied, and finished with silk matte paint.',
      descriptionBn: 'পুরনো চটা ওঠা নোনা ধরা দেয়াল চেঁছে অ্যান্টি-ফাঙ্গাল ওয়াটারপ্রুফিং ও বার্জার লাক্সারি সিল্ক পেইন্ট দিয়ে রূপান্তর।'
    },
    {
      id: 'show-2',
      titleEn: 'Kitchen Deep Degreasing & Hood Restoration',
      titleBn: 'কিচেনের চটচটে তেল-কালি ও হুড ডিপ ক্লিন সার্ভিস',
      categoryEn: 'Deep Cleaning',
      categoryBn: 'ডিপ ক্লিনিং',
      techName: 'তানভীর হাসান (Tanveer Hasan)',
      location: 'গুলশান ২, ঢাকা',
      before: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
      after: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&auto=format&fit=crop&q=80',
      descriptionEn: 'High-temperature steam extraction dissolved 3 years of thick oil residue from tiles and exhaust filter.',
      descriptionBn: 'উচ্চ তাপমাত্রার জার্মান স্টিম মেশিনের সাহায্যে ৩ বছরের জমে থাকা তেল চিটচিটে দাগ সম্পূর্ণ মুক্ত।'
    }
  ];

  const [activeTab, setActiveTab] = useState(0);
  const current = showcaseProjects[activeTab];

  return (
    <section className="py-16 sm:py-20 bg-stone-100/60 dark:bg-zinc-900/40 border-y border-zinc-200/80 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-2 mb-10">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            {isBangla ? 'বাস্তব কাজের ফলাফল' : 'Proven Craftsmanship'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {t.portfolio.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            {t.portfolio.subtitle}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xs">
            {showcaseProjects.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === idx
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {isBangla ? p.categoryBn : p.categoryEn}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Comparison Card */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Slider */}
            <div className="lg:col-span-7">
              <BeforeAfterSlider
                beforeImage={current.before}
                afterImage={current.after}
                aspectRatio="aspect-16/11"
              />
            </div>

            {/* Project Details */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-block text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                {isBangla ? current.categoryBn : current.categoryEn}
              </div>

              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {isBangla ? current.titleBn : current.titleEn}
              </h3>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {isBangla ? current.descriptionBn : current.descriptionEn}
              </p>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">{isBangla ? 'কাজের স্থান:' : 'Location:'}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{current.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{isBangla ? 'দক্ষ মিস্ত্রি:' : 'Technician:'}</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">{current.techName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
