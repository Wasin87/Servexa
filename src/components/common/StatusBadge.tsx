import React from 'react';
import { BookingStatus, PaymentStatus } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface StatusBadgeProps {
  status: BookingStatus | PaymentStatus;
  type?: 'booking' | 'payment';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'booking', className = '' }) => {
  const { t } = useLanguage();

  let label = '';
  let dotColor = 'bg-zinc-400';
  let textColor = 'text-zinc-600 dark:text-zinc-400';

  if (type === 'booking') {
    label = t.status[status as BookingStatus] || status;
    switch (status) {
      case 'REQUESTED':
        dotColor = 'bg-amber-500';
        textColor = 'text-amber-700 dark:text-amber-400';
        break;
      case 'ACCEPTED':
        dotColor = 'bg-blue-500';
        textColor = 'text-blue-700 dark:text-blue-400';
        break;
      case 'ON_THE_WAY':
        dotColor = 'bg-orange-500 animate-pulse';
        textColor = 'text-orange-700 dark:text-orange-400 font-medium';
        break;
      case 'ARRIVED':
        dotColor = 'bg-indigo-500';
        textColor = 'text-indigo-700 dark:text-indigo-400';
        break;
      case 'IN_PROGRESS':
        dotColor = 'bg-cyan-500 animate-pulse';
        textColor = 'text-cyan-700 dark:text-cyan-400 font-medium';
        break;
      case 'COMPLETED':
        dotColor = 'bg-emerald-500';
        textColor = 'text-emerald-700 dark:text-emerald-400 font-medium';
        break;
      case 'CANCELLED':
        dotColor = 'bg-rose-500';
        textColor = 'text-rose-700 dark:text-rose-400';
        break;
      case 'DISPUTED':
        dotColor = 'bg-purple-500';
        textColor = 'text-purple-700 dark:text-purple-400';
        break;
    }
  } else {
    label = t.payment[status as PaymentStatus] || status;
    switch (status) {
      case 'PAID':
        dotColor = 'bg-emerald-500';
        textColor = 'text-emerald-700 dark:text-emerald-400 font-medium';
        break;
      case 'PENDING':
      case 'CASH_ON_SERVICE':
        dotColor = 'bg-amber-500';
        textColor = 'text-amber-700 dark:text-amber-400 font-medium';
        break;
      case 'REFUNDED':
        dotColor = 'bg-zinc-500';
        textColor = 'text-zinc-600 dark:text-zinc-400';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${textColor} ${className}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
