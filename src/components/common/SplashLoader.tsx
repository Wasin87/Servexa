import React, { useEffect, useState } from 'react';

interface SplashLoaderProps {
  onComplete?: () => void;
  minDuration?: number; // Minimum time in ms to stay visible (default: 2100ms)
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({
  onComplete,
  minDuration = 2100
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsHidden(true);
        if (onComplete) onComplete();
      }, 550);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  if (isHidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-stone-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-all duration-500 ease-out select-none px-4 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Deep Ambient Radial Warm Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent pointer-events-none" />

      {/* Grid Pattern overlay for tech aesthetic */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#FA4D00 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center max-w-[85vw]">
        
        {/* 1. Location Pin Drop & Spring Bounce Container */}
        <div className="relative z-20 animate-pin-drop flex flex-col items-center">
          <div className="relative w-22 h-22 sm:w-28 sm:h-28 flex items-center justify-center drop-shadow-[0_16px_32px_rgba(250,77,0,0.45)]">
            <svg
              viewBox="10 2 80 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <defs>
                <mask id="splashPinMask">
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <circle cx="50" cy="46" r="28" fill="black" />
                  <g transform="translate(50, 46) rotate(-45)">
                    <rect x="-42" y="-11.5" width="24" height="5.5" rx="0.5" fill="black" />
                    <rect x="-42" y="6" width="24" height="5.5" rx="0.5" fill="black" />
                  </g>
                </mask>

                <mask id="splashWrenchMask">
                  <rect x="-50" y="-50" width="100" height="100" fill="white" />
                  <circle cx="9" cy="0" r="7" fill="black" />
                  <rect x="9" y="-7" width="18" height="14" rx="1" fill="black" />
                </mask>
              </defs>

              {/* Main House-Pin Body - Deep Rich Warm Orange */}
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
                mask="url(#splashPinMask)"
              />

              {/* Wrench inside Pin */}
              <g transform="translate(50, 46) rotate(-45)">
                <rect x="-38" y="-6" width="47" height="12" fill="#FA4D00" />
                <g mask="url(#splashWrenchMask)">
                  <circle cx="9" cy="0" r="14" fill="#FA4D00" />
                </g>
              </g>
            </svg>

            {/* Pulsing Center Beacon */}
            <div className="absolute top-[38px] left-[40px] sm:top-[48px] sm:left-[51px] w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-amber-300 rounded-full animate-ping opacity-90" />
          </div>
        </div>

        {/* 2. Concentric Ground Oval Ripples (Anchored STRICTLY under the pin's pointy bottom tip) */}
        <div className="relative -mt-3.5 w-40 sm:w-56 h-12 sm:h-14 flex items-center justify-center pointer-events-none">
          
          {/* Deep Contact Point Glow Floor Shadow */}
          <div className="absolute w-16 sm:w-20 h-3 sm:h-4 bg-[#FA4D00]/70 dark:bg-[#FA4D00]/80 rounded-[100%] blur-sm animate-pulse" />

          {/* Deep Color Concentric Expanding Ground Ripple 1 */}
          <div className="absolute w-20 sm:w-24 h-5 sm:h-6 border-[2.5px] border-[#FA4D00] rounded-[100%] animate-ground-ripple shadow-[0_0_20px_rgba(250,77,0,0.7)]" />

          {/* Deep Color Concentric Expanding Ground Ripple 2 */}
          <div className="absolute w-28 sm:w-36 h-7 sm:h-9 border-[2.5px] border-[#FA4D00]/90 rounded-[100%] animate-ground-ripple [animation-delay:450ms] shadow-[0_0_24px_rgba(250,77,0,0.55)]" />

          {/* Deep Color Concentric Expanding Ground Ripple 3 */}
          <div className="absolute w-36 sm:w-44 h-9 sm:h-11 border-[2px] border-[#FA4D00]/75 rounded-[100%] animate-ground-ripple [animation-delay:900ms]" />
        </div>

        {/* 3. Servexa Brand Typography Lockup */}
        <div className="mt-5 sm:mt-7 flex items-center text-3xl sm:text-4xl font-black tracking-tight font-['Outfit','Plus_Jakarta_Sans',sans-serif]">
          <span className="text-zinc-950 dark:text-white">Serv</span>
          <span className="text-[#FA4D00] ml-0.5">exa</span>
        </div>

      </div>
    </div>
  );
};
