import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const isBn = language === 'bn';

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={isBn ? 'বাংলা (Switch to English)' : 'English (বাংলায় পরিবর্তন করুন)'}
      aria-label="Toggle language"
      className={`relative p-1.5 sm:p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/50 transition-all cursor-pointer select-none active:scale-95 shadow-2xs ${className}`}
    >
      <Languages className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-orange-500 shrink-0" />
      <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-md bg-zinc-900 dark:bg-zinc-100 text-[9px] font-black text-white dark:text-zinc-900 border border-zinc-700 dark:border-zinc-300 tracking-tighter leading-none shadow-xs">
        {isBn ? 'বাং' : 'EN'}
      </span>
    </button>
  );
};
