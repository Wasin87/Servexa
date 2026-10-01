import React from 'react';
import { HealthScore } from '../../types';
import { CheckCircle2, Clock, RotateCcw, Award, Star } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface HealthScoreCardProps {
  score: HealthScore;
  className?: string;
  compact?: boolean;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ score, className = '', compact = false }) => {
  const { t, isBangla } = useLanguage();

  if (compact) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs ${className}`}>
        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span>{score.responseRate}% {isBangla ? 'রেসপন্স' : 'Response'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>{score.onTimeRate}% {isBangla ? 'সময়নিষ্ঠ' : 'On-Time'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <RotateCcw className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>{score.repeatRate}% {isBangla ? 'পুনরাবৃত্তি' : 'Repeat'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{score.completedJobs} {isBangla ? 'কাজ' : 'Jobs'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-stone-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {t.tech.healthScore}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t.tech.healthTransparency}
          </p>
        </div>
        <div className="flex items-center gap-1 font-bold text-sm text-amber-600 dark:text-amber-400">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{score.reviewScore.toFixed(1)} / 5.0</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-orange-500" />
            {t.tech.responseRate}
          </div>
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {score.responseRate}%
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${score.responseRate}%` }} />
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {t.tech.onTimeRate}
          </div>
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {score.onTimeRate}%
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${score.onTimeRate}%` }} />
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
            {t.tech.repeatRate}
          </div>
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {score.repeatRate}%
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${score.repeatRate}%` }} />
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            {t.tech.completedJobs}
          </div>
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {score.completedJobs}+ {isBangla ? 'টি' : ''}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {isBangla ? '১০০% যাচাইকৃত' : '100% verified'}
          </div>
        </div>
      </div>
    </div>
  );
};
