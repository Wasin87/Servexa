import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserRole } from '../../types';
import { User, Wrench, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export const RoleSwitcherBar: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { role, quickDemoLogin } = useAuth();
  const { isBangla } = useLanguage();
  const navigate = useNavigate();

  const roles: {
    id: UserRole;
    labelEn: string;
    labelBn: string;
    descEn: string;
    descBn: string;
    icon: React.ReactNode;
    color: string;
    activeBorder: string;
    path: string;
  }[] = [
    {
      id: 'CUSTOMER',
      labelEn: 'Customer',
      labelBn: 'গ্রাহক মোড',
      descEn: 'Book services, track live technician, view invoices & warranties',
      descBn: 'সার্ভিস বুকিং, লাইভ ট্র্যাকিং, ইনভয়েস ও ওয়ারেন্টি ক্লেইম',
      icon: <User className="w-4 h-4" />,
      color: 'bg-blue-500',
      activeBorder: 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30',
      path: '/customer/dashboard'
    },
    {
      id: 'TECHNICIAN',
      labelEn: 'Technician',
      labelBn: 'মিস্ত্রি মোড',
      descEn: 'Accept job requests, update dispatch status, generate bills & track earnings',
      descBn: 'কাজের রিকোয়েস্ট গ্রহণ, স্ট্যাটাস আপডেট, বিল তৈরি ও আয় হিসেব',
      icon: <Wrench className="w-4 h-4" />,
      color: 'bg-orange-500',
      activeBorder: 'border-orange-500 bg-orange-50/80 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/30',
      path: '/technician/dashboard'
    },
    {
      id: 'ADMIN',
      labelEn: 'Platform Admin',
      labelBn: 'অ্যাডমিন মোড',
      descEn: 'KYC verification, monitor all bookings, resolve disputes & manage platform',
      descBn: 'টেকনিশিয়ান যাচাই, সকল বুকিং মনিটর, অভিযোগ সমাধান ও প্ল্যাটফর্ম কন্ট্রোল',
      icon: <ShieldCheck className="w-4 h-4" />,
      color: 'bg-emerald-500',
      activeBorder: 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30',
      path: '/admin/dashboard'
    }
  ];

  const handleSwitch = (targetRole: UserRole, targetPath: string) => {
    quickDemoLogin(targetRole);
    navigate(targetPath);
  };

  return (
    <div className={`w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 sm:p-4 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              {isBangla ? 'রোল-ভিত্তিক ড্যাশবোর্ড সুইচিং কন্ট্রোল' : 'Role-Based Dashboard Switcher'}
            </h4>
            <p className="text-[11px] text-zinc-500">
              {isBangla
                ? 'এক ক্লিকে রোল পরিবর্তন করে গ্রাহক, টেকনিশিয়ান বা অ্যাডমিনের ডেডিকেটেড ফিচার পরীক্ষা করুন'
                : 'Switch between Customer, Technician, and Admin roles to manage role-specific workflows'}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400">
          <span>{isBangla ? 'বর্তমান সক্রিয় রোল:' : 'Active Role:'}</span>
          <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
            {role || 'CUSTOMER'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {roles.map((r) => {
          const isActive = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSwitch(r.id, r.path)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                isActive
                  ? r.activeBorder
                  : 'border-zinc-200 dark:border-zinc-800 bg-stone-50/60 dark:bg-zinc-950/60 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className={`p-2 rounded-lg text-white ${r.color} shadow-xs shrink-0`}>
                  {r.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-zinc-900 dark:text-white">
                      {isBangla ? r.labelBn : r.labelEn}
                    </span>
                    {isActive && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500 text-white">
                        {isBangla ? 'সক্রিয়' : 'Active'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {isBangla ? r.descBn : r.descEn}
                  </p>
                </div>
              </div>

              <ArrowRight className={`w-3.5 h-3.5 mt-1 shrink-0 transition-transform ${isActive ? 'text-current translate-x-0.5' : 'text-zinc-400 opacity-50'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
