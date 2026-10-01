import React, { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  aspectRatio?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
  className = '',
  aspectRatio = 'aspect-4/3'
}) => {
  const { t } = useLanguage();
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const bLabel = beforeLabel || t.portfolio.before;
  const aLabel = afterLabel || t.portfolio.after;

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && e.buttons !== 1) return;
    handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 ${aspectRatio} ${className} cursor-ew-resize group`}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* After image (Base layer) */}
      <img
        src={afterImage}
        alt={aLabel}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute top-3 right-3 bg-zinc-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md pointer-events-none">
        {aLabel}
      </div>

      {/* Before image (Clipped layer) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={bLabel}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md pointer-events-none">
          {bLabel}
        </div>
      </div>

      {/* Slider dividing line & handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white dark:bg-zinc-900 rounded-full shadow-md border-2 border-orange-500 flex items-center justify-center text-orange-600 dark:text-orange-400">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="8 7 3 12 8 17" />
            <polyline points="16 7 21 12 16 17" />
          </svg>
        </div>
      </div>
    </div>
  );
};
