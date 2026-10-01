import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Menu,
  X,
  AlertOctagon,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Calendar,
  Sparkles,
  Shield,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageToggle } from '../common/LanguageToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

export const Navbar: React.FC = () => {
  const { t, isBangla } = useLanguage();
  const { currentUser, role, logout, quickDemoLogin } = useAuth();
  const { notifications, markAllNotificationsRead } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const isActive = (path: string) => location.pathname === path;

  const getDashboardLink = () => {
    if (role === 'TECHNICIAN') return '/technician/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';
    return '/customer/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Logo showTagline={false} size="md" />

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
          <Link
            to="/services"
            className={`transition-colors hover:text-orange-600 dark:hover:text-orange-400 ${
              isActive('/services') ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {t.nav.services}
          </Link>
          <Link
            to="/professionals"
            className={`transition-colors hover:text-orange-600 dark:hover:text-orange-400 ${
              isActive('/professionals') ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {t.nav.findPros}
          </Link>
          <Link
            to="/map"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              isActive('/map')
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400'
            }`}
          >
            <span>🗺️</span>
            <span className="font-bold">{isBangla ? 'লাইভ ম্যাপ' : 'Nearby Map'}</span>
          </Link>
          <Link
            to="/heatmap"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              isActive('/heatmap')
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <span className="font-bold">{isBangla ? 'হিটম্যাপ' : 'Heatmap'}</span>
          </Link>
          <Link
            to="/how-it-works"
            className={`transition-colors hover:text-orange-600 dark:hover:text-orange-400 ${
              isActive('/how-it-works') ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {t.nav.howItWorks}
          </Link>
          <Link
            to="/safety"
            className={`transition-colors hover:text-orange-600 dark:hover:text-orange-400 ${
              isActive('/safety') ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {t.nav.safety}
          </Link>

          {/* Emergency Quick Action */}
          <Link
            to="/emergency"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition-colors animate-pulse"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="font-bold">{t.nav.emergency}</span>
          </Link>
        </nav>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Language Switcher - 1 Button Toggle */}
          <LanguageToggle />

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setUserMenuOpen(false);
                setDemoMenuOpen(false);
              }}
              type="button"
              className="relative p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-600 rounded-full ring-2 ring-white dark:ring-zinc-950" />
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    {isBangla ? 'নোটিফিকেশন' : 'Notifications'} ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      {isBangla ? 'সব পড়া হয়েছে' : 'Mark all read'}
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      কোনো নোটিফিকেশন নেই
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-orange-50/40 dark:bg-orange-950/20' : ''
                        }`}
                        onClick={() => {
                          setNotifDropdownOpen(false);
                          if (n.link) navigate(n.link);
                        }}
                      >
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">
                          {isBangla ? n.titleBn : n.titleEn}
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                          {isBangla ? n.messageBn : n.messageEn}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role / Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setDemoMenuOpen(!demoMenuOpen);
                setUserMenuOpen(false);
                setNotifDropdownOpen(false);
              }}
              type="button"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-orange-500 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{role || 'GUEST'}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {demoMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {isBangla ? 'রোল পরিবর্তন করুন (ডেমো)' : 'Switch Role (Demo)'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    quickDemoLogin('CUSTOMER');
                    setDemoMenuOpen(false);
                    navigate('/customer/dashboard');
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                    role === 'CUSTOMER' ? 'font-bold text-orange-600' : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span>👤 গ্রাহক (Customer)</span>
                  {role === 'CUSTOMER' && <span className="text-orange-600">✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    quickDemoLogin('TECHNICIAN');
                    setDemoMenuOpen(false);
                    navigate('/technician/dashboard');
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                    role === 'TECHNICIAN' ? 'font-bold text-orange-600' : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span>👷 মিস্ত্রি (Technician)</span>
                  {role === 'TECHNICIAN' && <span className="text-orange-600">✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    quickDemoLogin('ADMIN');
                    setDemoMenuOpen(false);
                    navigate('/admin/dashboard');
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                    role === 'ADMIN' ? 'font-bold text-orange-600' : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span>👨‍💼 অ্যাডমিন (Admin)</span>
                  {role === 'ADMIN' && <span className="text-orange-600">✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* User Profile / Dashboard Avatar */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setNotifDropdownOpen(false);
                  setDemoMenuOpen(false);
                }}
                type="button"
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-orange-500/50 transition-all"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {currentUser.email}
                    </p>
                  </div>

                  <Link
                    to={getDashboardLink()}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    <LayoutDashboard className="w-4 h-4 text-orange-500" />
                    <span>{t.nav.dashboard}</span>
                  </Link>

                  {role === 'CUSTOMER' && (
                    <Link
                      to="/customer/bookings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>{t.nav.bookings}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                      navigate('/');
                    }}
                    type="button"
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-t border-zinc-100 dark:border-zinc-800 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.nav.logout}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-orange-600 transition-colors"
              >
                {t.nav.login}
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-colors"
              >
                {t.nav.register}
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="lg:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs text-zinc-500 font-medium">{isBangla ? 'থিম মোড:' : 'Theme Mode:'}</span>
            <ThemeToggle showLabel />
          </div>

          {/* Mobile Role Switcher */}
          <div className="p-2.5 rounded-2xl bg-stone-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {isBangla ? 'রোল পরিবর্তন (সুইচ ড্যাশবোর্ড):' : 'Switch Role Dashboard:'}
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  quickDemoLogin('CUSTOMER');
                  setMobileMenuOpen(false);
                  navigate('/customer/dashboard');
                }}
                className={`py-1.5 px-2 rounded-xl text-center cursor-pointer ${
                  role === 'CUSTOMER' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                👤 গ্রাহক
              </button>
              <button
                type="button"
                onClick={() => {
                  quickDemoLogin('TECHNICIAN');
                  setMobileMenuOpen(false);
                  navigate('/technician/dashboard');
                }}
                className={`py-1.5 px-2 rounded-xl text-center cursor-pointer ${
                  role === 'TECHNICIAN' ? 'bg-orange-600 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                👷 মিস্ত্রি
              </button>
              <button
                type="button"
                onClick={() => {
                  quickDemoLogin('ADMIN');
                  setMobileMenuOpen(false);
                  navigate('/admin/dashboard');
                }}
                className={`py-1.5 px-2 rounded-xl text-center cursor-pointer ${
                  role === 'ADMIN' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                👨‍💼 অ্যাডমিন
              </button>
            </div>
          </div>

          <nav className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-zinc-800 dark:text-zinc-200 hover:text-orange-600"
            >
              {t.nav.services}
            </Link>
            <Link
              to="/professionals"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-zinc-800 dark:text-zinc-200 hover:text-orange-600"
            >
              {t.nav.findPros}
            </Link>
            <Link
              to="/heatmap"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>{isBangla ? 'লাইভ ডিমান্ড হিটম্যাপ' : 'Live Demand Heatmap'}</span>
            </Link>
            <Link
              to="/emergency"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>{t.nav.emergency}</span>
            </Link>
            <Link
              to="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-zinc-800 dark:text-zinc-200 hover:text-orange-600"
            >
              {t.nav.howItWorks}
            </Link>
            <Link
              to="/safety"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-zinc-800 dark:text-zinc-200 hover:text-orange-600"
            >
              {t.nav.safety}
            </Link>
            <Link
              to="/become-professional"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-orange-600 dark:text-orange-400 font-semibold"
            >
              {t.nav.becomePro}
            </Link>
            {currentUser && (
              <Link
                to={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 font-bold text-zinc-900 dark:text-zinc-100 border-t border-zinc-100 dark:border-zinc-800 pt-2"
              >
                {t.nav.dashboard}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
