import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showTagline = false }) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 40 : 32;
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Custom Geometric S + Spark Emblem */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4 drop-shadow-sm"
        >
          {/* Stylized S with modern tech curves */}
          <path
            d="M23 10C23 7.79086 21.2091 6 19 6H13C10.7909 6 9 7.79086 9 10C9 12.2091 10.7909 13.8 13 14H19C21.2091 14.2 23 15.7909 23 18C23 20.2091 21.2091 22 19 22H13C10.7909 22 9 20.2091 9 18"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="23" cy="7" r="2" fill="#FEF08A" />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span className={`font-black tracking-tight text-zinc-900 dark:text-white ${textSize}`}>
          Serv<span className="text-orange-600 dark:text-orange-500">exa</span>
        </span>
        {showTagline && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold tracking-normal mt-0.5">
            স্মার্ট মিস্ত্রি সেবা
          </span>
        )}
      </div>
    </Link>
  );
};
