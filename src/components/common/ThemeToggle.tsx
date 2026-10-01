import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const { isBangla } = useLanguage();

  const isDark = theme === 'dark';
  const labelText = isDark
    ? (isBangla ? 'লাইট মোড' : 'Light Mode')
    : (isBangla ? 'ডার্ক মোড' : 'Dark Mode');
  const tooltip = isDark
    ? (isBangla ? 'লাইট মোডে পরিবর্তন করুন' : 'Switch to Light Mode')
    : (isBangla ? 'ডার্ক মোডে পরিবর্তন করুন' : 'Switch to Dark Mode');

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={tooltip}
      aria-label={tooltip}
      className={`inline-flex items-center gap-2 p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all focus-visible:outline-2 focus-visible:outline-orange-500 cursor-pointer active:scale-95 ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400 transition-transform rotate-0 scale-100 duration-200" />
        ) : (
          <Moon className="w-5 h-5 text-zinc-700 dark:text-zinc-300 transition-transform rotate-0 scale-100 duration-200" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {labelText}
        </span>
      )}
    </button>
  );
};

