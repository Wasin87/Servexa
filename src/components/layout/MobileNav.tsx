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
      to: '/technician/dashboard?tab=requests',
      label: isBangla ? 'নতুন কাজ' : 'Job Feed',
      icon: Radio,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      end: true
    },
    { to: '/technician/dashboard?tab=active', label: isBangla ? 'চলতি কাজ' : 'My Jobs', icon: Briefcase },
    { to: '/heatmap', label: isBangla ? 'হটস্পট' : 'Hotspots', icon: Flame },
    { to: '/technician/dashboard?tab=earnings', label: isBangla ? 'আয়' : 'Income', icon: DollarSign },
    {
      to: '/technician/dashboard?tab=profile',
      label: isBangla ? 'প্রোফাইল' : 'Profile',
      icon: User,
      avatar: currentUser?.avatar
    },
  ];

  const getAdminItems = (): MobileNavItem[] => [
    { to: '/admin/dashboard?tab=overview', label: isBangla ? 'কেওয়াইসি' : 'KYC', icon: ShieldCheck, end: true },
    { to: '/admin/dashboard?tab=bookings', label: isBangla ? 'বুকিং' : 'Bookings', icon: Calendar },
    { to: '/admin/dashboard?tab=finance', label: isBangla ? 'ফাইন্যান্স' : 'Finance', icon: DollarSign },
    { to: '/admin/dashboard?tab=disputes', label: isBangla ? 'অভিযোগ' : 'Disputes', icon: AlertTriangle },
    { to: '/heatmap', label: isBangla ? 'হিটম্যাপ' : 'Heatmap', icon: Flame },
  ];

  const navItems =
    role === 'TECHNICIAN'
      ? getTechnicianItems()
      : role === 'ADMIN'
      ? getAdminItems()
      : getCustomerItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-200/80 dark:border-zinc-800/90 rounded-t-2xl py-1.5 px-2 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] lg:hidden transition-all safe-bottom">
      <div className="flex items-center justify-around gap-0.5 max-w-md mx-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const [itemPath, itemQuery] = item.to.split('?');
          const itemTab = itemQuery ? new URLSearchParams(itemQuery).get('tab') : null;
          const currentTab = new URLSearchParams(location.search).get('tab');
          const isItemActive = itemTab
            ? location.pathname === itemPath && (currentTab === itemTab || (!currentTab && item.end))
            : item.end
              ? location.pathname === itemPath
              : location.pathname.startsWith(itemPath) && itemPath !== '/';

          return (
            <NavLink
              key={idx}
              to={item.to}
              end={item.end}
              className={`relative flex flex-col items-center justify-center min-h-[42px] py-1 px-2 rounded-xl text-[10px] font-bold transition-colors duration-150 ${
                isItemActive
                  ? 'text-orange-600 dark:text-orange-400 bg-orange-50/90 dark:bg-orange-950/50'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {item.badge !== undefined && (
                <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                  {item.badge}
                </span>
              )}

              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.label}
                  className={`w-4 h-4 rounded-full object-cover mb-0.5 ring-1 aspect-square shrink-0 ${
                    isItemActive ? 'ring-orange-500' : 'ring-zinc-300 dark:ring-zinc-700'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Icon className={`w-4 h-4 mb-0.5 ${isItemActive ? 'stroke-[2.5]' : ''}`} />
              )}
              <span className="tracking-tight leading-none truncate max-w-[54px] text-center">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
