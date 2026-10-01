import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const FAQSection: React.FC = () => {
  const { isBangla } = useLanguage();

  const faqs = [
    {
      qEn: 'How are technicians verified on Servexa?',
      qBn: 'Servexa-তে টেকনিশিয়ানরা কীভাবে ভেরিফায়েড হন?',
      aEn: 'Every technician undergoes physical NID verification, active phone verification, police record clearance, and a practical technical skills assessment before receiving platform approval.',
      aBn: 'আমাদের প্রতিটি টেকনিশিয়ানের জাতীয় পরিচয়পত্র (NID), পুলিশ ক্লিয়ারেন্স ও মোবাইল নম্বর সরাসরি যাচাইয়ের পাশাপাশি সংশ্লিষ্ট কাজে ব্যবহারিক দক্ষতার টেস্ট নেওয়া হয়।'
    },
    {
      qEn: 'What is the Visiting Fee policy?',
      qBn: 'ভিজিটিং ফি সংক্রান্ত নিয়ম কী?',
      aEn: 'The visiting fee covers the technician travelling to your doorstep and diagnosing the physical issue. If you proceed with the repair work, only the agreed labour/parts cost applies.',
      aBn: 'ভিজিটিং ফি হলো টেকনিশিয়ানের বাসায় এসে সমস্যাটি খতিয়ে দেখার প্রাথমিক চার্জ। টেকনিশিয়ান সরাসরি দেখে কাজের পরিধি ও পার্টস লাগলে তার সঠিক খরচ জানাবেন।'
    },
    {
      qEn: 'How does the Service Warranty work?',
      qBn: 'সার্ভিস ওয়ারেন্টি কীভাবে কাজ করে?',
      aEn: 'All eligible completed jobs come with a 7 to 30-day free service warranty. If the exact same issue reoccurs within this period, the technician will re-inspect and fix it at zero extra labour cost.',
      aBn: 'কাজের ধরনের ওপর ভিত্তি করে ৭ থেকে ৩০ দিনের ফ্রি সার্ভিস ওয়ারেন্টি প্রদান করা হয়। ওয়ারেন্টি চলাকালীন একই সমস্যা পুনরায় দেখা দিলে কোনো অতিরিক্ত শ্রম মজুরি ছাড়াই সমাধান করা হবে।'
    },
    {
      qEn: 'Can I pay via bKash or Nagad instead of cash?',
      qBn: 'আমি কি ক্যাশের বদলে বিকাশ বা নগদে পেমেন্ট করতে পারব?',
      aEn: 'Yes! While Cash-on-Service is fully supported, you can easily transfer the invoice total directly to the technician or platform bKash/Nagad merchant number.',
      aBn: 'হ্যাঁ! ক্যাশের পাশাপাশি বিকাশ, নগদ বা ব্যাংকের মাধ্যমে সহজেই ইনভয়েস অ্যামাউন্ট পরিশোধ করা যায়।'
    }
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-16 sm:py-20 bg-stone-100/50 dark:bg-zinc-900/40 border-t border-zinc-200/80 dark:border-zinc-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            {isBangla ? 'সাধারণ প্রশ্নোত্তর' : 'FAQ'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {isBangla ? 'আপনার মনে থাকা প্রশ্নগুলোর উত্তর' : 'Frequently Asked Questions'}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <span>{isBangla ? faq.qBn : faq.qEn}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-orange-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                    {isBangla ? faq.aBn : faq.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
