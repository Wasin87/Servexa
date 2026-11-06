import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Flame,
  User,
  MapPin,
  Wrench,
  DollarSign,
  Briefcase,
  ShieldCheck,
  Radio,
  FileCheck,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

interface MobileNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: number | string;
  avatar?: string;
}

export const MobileNav: React.FC = () => {
  const { isBangla } = useLanguage();
  const { currentUser, role } = useAuth();
  const { bookings } = useApp();
  const location = useLocation();

  // Active bookings count for badge
  const pendingRequestsCount = bookings.filter(b => b.status === 'REQUESTED').length;

  const getCustomerItems = (): MobileNavItem[] => [
    { to: '/', label: isBangla ? 'হোম' : 'Home', icon: Home, end: true },
    { to: '/professionals', label: isBangla ? 'মিস্ত্রি' : 'Pros', icon: Wrench },
    { to: '/heatmap', label: isBangla ? 'হিটম্যাপ' : 'Heatmap', icon: Flame },
    { to: '/customer/bookings', label: isBangla ? 'বুকিং' : 'Bookings', icon: Calendar },
    {
      to: currentUser ? '/customer/dashboard' : '/login',
      label: isBangla ? 'প্রোফাইল' : 'Profile',
      icon: User,
      avatar: currentUser?.avatar
    },
  ];

  const getTechnicianItems = (): MobileNavItem[] => [
    {
      to: '/technician/dashboard',
      label: isBangla ? 'নতুন কাজ' : 'Job Feed',
      icon: Radio,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      end: true
    },
    { to: '/technician/dashboard', label: isBangla ? 'চলতি কাজ' : 'My Jobs', icon: Briefcase },
    { to: '/heatmap', label: isBangla ? 'হটস্পট' : 'Hotspots', icon: Flame },
    { to: '/technician/dashboard', label: isBangla ? 'আয়' : 'Income', icon: DollarSign },
    {
      to: '/technician/dashboard',
      label: isBangla ? 'প্রোফাইল' : 'Profile & Bio',
      icon: User,
      avatar: currentUser?.avatar
    },
  ];

  const getAdminItems = (): MobileNavItem[] => [
    { to: '/admin/dashboard', label: isBangla ? 'ওভারভিউ' : 'Overview', icon: Layers, end: true },
    { to: '/admin/dashboard', label: isBangla ? 'কেওয়াইসি' : 'KYC Approvals', icon: ShieldCheck },
    { to: '/admin/dashboard', label: isBangla ? 'অভিযোগ' : 'Disputes', icon: AlertTriangle },
    { to: '/heatmap', label: isBangla ? 'হিটম্যাপ' : 'Heatmap', icon: Flame },
    {
      to: '/admin/dashboard',
      label: isBangla ? 'অ্যাডমিন' : 'Admin',
      icon: User,
      avatar: currentUser?.avatar
    },
  ];

  const navItems =
    role === 'TECHNICIAN'
      ? getTechnicianItems()
      : role === 'ADMIN'
      ? getAdminItems()
      : getCustomerItems();

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 max-w-md mx-auto bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/90 rounded-3xl py-2 px-2 shadow-2xl lg:hidden transition-all safe-bottom">
      <div className="flex items-center justify-around gap-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isItemActive =
            item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && item.to !== '/';

          return (
            <NavLink
              key={idx}
              to={item.to}
              end={item.end}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl text-[10px] font-bold transition-all duration-200 ${
                isItemActive
                  ? 'text-orange-600 dark:text-orange-400 bg-orange-50/80 dark:bg-orange-950/50 shadow-xs scale-105'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {/* Notification badge */}
              {item.badge !== undefined && (
                <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              )}

              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.label}
                  className={`w-5 h-5 rounded-full object-cover mb-0.5 ring-2 aspect-square shrink-0 ${
                    isItemActive ? 'ring-orange-500 shadow-xs' : 'ring-zinc-300 dark:ring-zinc-700'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Icon className={`w-4 h-4 mb-0.5 ${isItemActive ? 'stroke-[2.5]' : ''}`} />
              )}
              <span className="tracking-tight leading-none truncate max-w-[56px] text-center">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
