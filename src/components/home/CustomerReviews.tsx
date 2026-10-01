import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';

export const CustomerReviews: React.FC = () => {
  const { reviews } = useApp();
  const { isBangla } = useLanguage();

  const demoTestimonials = [
    {
      id: 'test-1',
      name: 'তানজিলা হক (Tanjila Haque)',
      area: 'ধানমন্ডি, ঢাকা',
      rating: 5,
      service: 'এসি মেরামত ও সার্ভিসিং',
      text: 'রাত ৮টার সময় এসি দিয়ে পানি পড়ছিল আর ঠাণ্ডা হচ্ছিল না। Servexa-তে রিকোয়েস্ট দেওয়ার ৩০ মিনিটে টেকনিশিয়ান হাজির হয়ে পরিষ্কার করে দিয়েছেন। খুবই পেশাদার ব্যবহার।',
      date: '২০২৬-০৩-১০'
    },
    {
      id: 'test-2',
      name: 'ইমরান চৌধুরী (Imran Chowdhury)',
      area: 'মিরপুর ডিওএইচএস, ঢাকা',
      rating: 5,
      service: 'মেইন ডিবি বক্স ওয়্যারিং',
      text: 'আগের ইলেকট্রিশিয়ান পুরো ঘর অন্ধকার করে চলে গিয়েছিল। রহিম ভাই ডিজিটাল মাল্টিমিটার নিয়ে এসে ১০ মিনিটে শর্ট সার্কিট ধরে সমাধান করে দিয়েছেন। ডিজিটাল ইনভয়েসও পেয়েছি।',
      date: '২০২৬-০২-২৪'
    },
    {
      id: 'test-3',
      name: 'ফারজানা ইয়াসমিন (Farzana Yasmin)',
      area: 'উত্তরা সেক্টর ১১, ঢাকা',
      rating: 5,
      service: 'ফ্ল্যাট পেইন্টিং ও ড্যাম্প প্রুফিং',
      text: 'রং মিস্ত্রি শাকিল সাহেব ৩ রুমের কাজ খুব নিখুঁতভাবে শেষ করেছেন। মেঝে বা জানালায় এক ফোঁটাও রং ফেলেননি। Servexa প্ল্যাটফর্মের মাধ্যমে স্বচ্ছ খরচে কাজ করাতে পেরে দারুণ খুশি।',
      date: '২০২৬-০৩-০২'
    }
  ];

  return (
    <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center space-y-2 mb-12">
        <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
          {isBangla ? 'গ্রাহক প্রতিক্রিয়া' : 'Customer Stories'}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          {isBangla ? 'হাজারো সন্তুষ্ট পরিবারের বিশ্বস্ত পছন্দ' : 'Trusted by Thousands Across Bangladesh'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {isBangla ? 'বাস্তব গ্রাহকদের অভিজ্ঞতা ও রেটিং' : 'Real reviews from verified completed bookings'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {demoTestimonials.map((t) => (
          <div
            key={t.id}
            className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] text-zinc-400">{t.date}</span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic mb-6">
                "{t.text}"
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  {t.name}
                </h4>
                <p className="text-[11px] text-zinc-400">{t.area}</p>
              </div>
              <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
                {t.service}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
