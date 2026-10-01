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
      title={isBn ? 'Switch to English' : 'বাংলা ভাষায় পরিবর্তন করুন'}
      aria-label="Toggle language"
      className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-all cursor-pointer select-none active:scale-95 shadow-2xs ${className}`}
    >
      <Languages className="w-3.5 h-3.5 text-orange-500 shrink-0" />
      <span className="text-xs font-extrabold tracking-tight flex items-center gap-0.5">
        <span>{isBn ? 'বাং' : 'EN'}</span>
        <span className="text-[10px]">{isBn ? '🇧🇩' : '🇬🇧'}</span>
      </span>
    </button>
  );
};
