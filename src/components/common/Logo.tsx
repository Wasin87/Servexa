import React, { useId } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  clickable?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
  clickable = true
}) => {
  const { isBangla } = useLanguage();
  const rawId = useId().replace(/:/g, '');
  const pinMaskId = `pinMask_${rawId}`;
  const wrenchMaskId = `wrenchJawMask_${rawId}`;

  // Dimension scaling - Bolder, stronger visual presence
  const dimensions = {
    xs: { icon: 32, text: 'text-base', tag: 'text-[9px]' },
    sm: { icon: 38, text: 'text-lg', tag: 'text-[10px]' },
    md: { icon: 46, text: 'text-xl sm:text-2xl', tag: 'text-[11px]' },
    lg: { icon: 56, text: 'text-2xl sm:text-3xl', tag: 'text-xs' },
    xl: { icon: 72, text: 'text-3xl sm:text-4xl', tag: 'text-sm' },
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* 
        Bold, High-Impact 1:1 Match to User's Uploaded Logo (1791832364679.jpg):
        - Bolder house roof with strong chimney
        - Chunky, solid wrench with heavier handle and head
        - Bold, tight-fitting map pin teardrop outline
        - Solid warm orange color (#FA4D00)
      */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-105"
        style={{ width: dimensions.icon, height: dimensions.icon }}
      >
        <svg
          viewBox="10 2 80 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-xs"
        >
          <defs>
            {/* Mask for negative space (circle window + handle slits through lower-left pin wall) */}
            <mask id={pinMaskId}>
              <rect x="0" y="0" width="100" height="100" fill="white" />
              {/* Central circular window cutout */}
              <circle cx="50" cy="46" r="28" fill="black" />
              {/* Two slits flanking the bold handle at 45° angle */}
              <g transform="translate(50, 46) rotate(-45)">
                <rect x="-42" y="-11.5" width="24" height="5.5" rx="0.5" fill="black" />
                <rect x="-42" y="6" width="24" height="5.5" rx="0.5" fill="black" />
              </g>
            </mask>

            {/* Mask for the open-ended wrench jaw slot */}
            <mask id={wrenchMaskId}>
              <rect x="-50" y="-50" width="100" height="100" fill="white" />
              {/* Jaw throat inner circular cutout */}
              <circle cx="9" cy="0" r="7" fill="black" />
              {/* Jaw opening slot towards +X (up-right at 45°) */}
              <rect x="9" y="-7" width="18" height="14" rx="1" fill="black" />
            </mask>
          </defs>

          {/* 1. Bold House-Pin Body with Central Cutout & Handle Slits */}
          <path
            d="M 50 3
               L 11 36
               L 14.5 40
               C 18.5 38 19 44 19 50
               C 19 62 36 78 50 97
               C 64 78 81 62 81 50
               C 81 44 81.5 38 85.5 40
               L 89 36
               L 76 25
               L 76 9.5
               L 64 9.5
               L 64 15.5
               Z"
            fill="#FA4D00"
            mask={`url(#${pinMaskId})`}
          />

          {/* 2. Bold Orange Wrench inside and entering from lower-left */}
          <g transform="translate(50, 46) rotate(-45)">
            {/* Bold Wrench Handle entering from lower-left */}
            <rect
              x="-38"
              y="-6"
              width="47"
              height="12"
              fill="#FA4D00"
            />
            {/* Bold Wrench Head with Open-End Jaw Cutout */}
            <g mask={`url(#${wrenchMaskId})`}>
              <circle
                cx="9"
                cy="0"
                r="14"
                fill="#FA4D00"
              />
            </g>
          </g>
        </svg>
      </div>

      {/* Bold & Authoritative Typography Lockup */}
      <div className="flex flex-col leading-none font-['Outfit','Plus_Jakarta_Sans',sans-serif]">
        <div className="flex items-center">
          {/* Main Brand Title - Bold & Strong */}
          <span className={`font-black tracking-[-0.035em] text-zinc-900 dark:text-white ${dimensions.text} flex items-center`}>
            <span className="font-black text-zinc-950 dark:text-white">
              Serv
            </span>
            <span className="text-[#FA4D00] font-black tracking-[-0.02em]">
              exa
            </span>
          </span>
        </div>

        {/* Sub-tagline */}
        {showTagline ? (
          <span className={`font-extrabold uppercase tracking-[0.14em] text-[#FA4D00] mt-1 flex items-center gap-1.5 ${dimensions.tag}`}>
            <span>{isBangla ? 'স্মার্ট হোম মিস্ত্রি সেবা' : 'Smart Home Service Platform'}</span>
          </span>
        ) : (
          <span className="text-[9.5px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 mt-0.5 hidden sm:block">
            {isBangla ? 'স্মার্ট হোম সার্ভিস' : 'Home Service Platform'}
          </span>
        )}
      </div>
    </div>
  );

  if (!clickable) {
    return content;
  }

  return (
    <Link to="/" className="inline-flex cursor-pointer transition-transform active:scale-98">
      {content}
    </Link>
  );
};
