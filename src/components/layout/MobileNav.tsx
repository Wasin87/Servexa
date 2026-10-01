import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Flame, User, MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

export const MobileNav: React.FC = () => {
  const { isBangla } = useLanguage();
  const { currentUser, role } = useAuth();

  const getDashboardLink = () => {
    if (!currentUser) return '/login';
    if (role === 'TECHNICIAN') return '/technician/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';
    return '/customer/dashboard';
  };

  const navItems = [
    { to: '/', label: isBangla ? 'হোম' : 'Home', icon: Home, end: true },
    { to: '/map', label: isBangla ? 'ম্যাপ' : 'Map', icon: MapPin },
    { to: '/heatmap', label: isBangla ? 'হিটম্যাপ' : 'Heatmap', icon: Flame },
    { to: getDashboardLink(), label: isBangla ? (role === 'TECHNICIAN' ? 'কাজের রিকোয়েস্ট' : 'বুকিং') : 'Bookings', icon: Calendar },
    { to: getDashboardLink(), label: isBangla ? 'প্রোফাইল' : 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 lg:hidden py-1 px-1 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold transition-all ${
                  isActive
                    ? 'text-orange-600 dark:text-orange-400 scale-105'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="tracking-tight leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
