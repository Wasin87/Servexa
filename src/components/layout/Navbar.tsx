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
  ChevronDown,
  Wrench,
  MapPin,
  Flame,
  HelpCircle,
  ShieldCheck,
  Radio,
  DollarSign,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageToggle } from '../common/LanguageToggle';
import { PWAInstallButton } from '../common/PWAInstallButton';
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
    <header className="sticky top-0 z-[9999] w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0c0806]/95 backdrop-blur-xl shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Logo */}
        <div className="shrink-0 flex items-center">
          <Logo showTagline={false} size="md" />
        </div>

        {/* Desktop Navigation Links - STRICTLY ROLE FILTERED */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
          {/* CUSTOMER (OR GUEST) NAVIGATION */}
          {(!role || role === 'CUSTOMER') && (
            <>
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
            </>
          )}

          {/* TECHNICIAN SPECIFIC NAVIGATION */}
          {role === 'TECHNICIAN' && (
            <>
              <Link
                to="/technician/dashboard"
                className={`inline-flex items-center gap-1.5 transition-colors hover:text-orange-600 dark:hover:text-orange-400 ${
                  isActive('/technician/dashboard') ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                <span>{isBangla ? 'লাইভ কাজের রিকোয়েস্ট' : 'Live Job Feed'}</span>
              </Link>
              <Link
                to="/heatmap"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  isActive('/heatmap')
                    ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400'
                }`}
              >
                <span>🔥</span>
                <span className="font-bold">{isBangla ? 'কাজের চাহিদা হিটম্যাপ' : 'Demand Hotspots'}</span>
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
                <span>{isBangla ? 'সার্ভিস ম্যাপ' : 'Live Map'}</span>
              </Link>
              <Link
                to="/safety"
                className={`transition-colors hover:text-orange-600 dark:hover:text-orange-400 ${
                  isActive('/safety') ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {isBangla ? 'সেফটি ও নিরাপত্তা' : 'Safety Guidelines'}
              </Link>
            </>
          )}

          {/* ADMIN SPECIFIC NAVIGATION */}
          {role === 'ADMIN' && (
            <>
              <Link
                to="/admin/dashboard"
                className={`inline-flex items-center gap-1.5 transition-colors hover:text-orange-600 dark:hover:text-orange-400 ${
                  isActive('/admin/dashboard') ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                <span>{isBangla ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Console'}</span>
              </Link>
              <Link
                to="/heatmap"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  isActive('/heatmap')
                    ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400'
                }`}
              >
                <span>🔥</span>
                <span className="font-bold">{isBangla ? 'ডিমান্ড অ্যানালিটিক্স' : 'Live Heatmap'}</span>
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
                <span>{isBangla ? 'লাইভ টেকনিশিয়ান ম্যাপ' : 'Live Fleet Map'}</span>
              </Link>
              <Link
                to="/safety"
                className={`transition-colors hover:text-orange-600 dark:hover:text-orange-400 ${
                  isActive('/safety') ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {isBangla ? 'কমপ্লায়েন্স ও নিরাপত্তা' : 'Compliance & Safety'}
              </Link>
            </>
          )}

          {/* Emergency Quick Action - Icon Only */}
          <Link
            to="/emergency"
            title={t.nav.emergency}
            aria-label={t.nav.emergency}
            className="relative p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition-all hover:scale-105 active:scale-95 group shadow-2xs"
          >
            <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          </Link>
        </nav>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Language Switcher - 1 Button Toggle */}
          <LanguageToggle className="scale-90 sm:scale-100 origin-right" />

          {/* Theme Switcher */}
          <ThemeToggle className="scale-90 sm:scale-100 origin-right p-1.5 sm:p-2" />

          {/* Notifications Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                setUserMenuOpen(false);
                setDemoMenuOpen(false);
              }}
              type="button"
              className="relative p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-orange-600 rounded-full ring-2 ring-white dark:ring-zinc-950" />
              )}
            </button>

            {notifDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-[998]"
                  onClick={() => setNotifDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 py-2 z-[999] animate-in fade-in duration-150">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {isBangla ? 'নোটিফিকেশন' : 'Notifications'} ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                      >
                        {isBangla ? 'সব পড়া হয়েছে' : 'Mark all read'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-500">
                        {isBangla ? 'কোনো নোটিফিকেশন নেই' : 'No notifications'}
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
              </>
            )}
          </div>

          {/* Role / Switcher Dropdown (Desktop) */}
          <div className="relative hidden md:block shrink-0">
            <button
              onClick={() => {
                setDemoMenuOpen(!demoMenuOpen);
                setUserMenuOpen(false);
                setNotifDropdownOpen(false);
              }}
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-orange-500 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{role || 'GUEST'}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {demoMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[998]"
                  onClick={() => setDemoMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-[999] text-xs">
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
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                      role === 'CUSTOMER' ? 'font-bold text-orange-600' : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span>👤 {isBangla ? 'গ্রাহক (Customer)' : 'Customer'}</span>
                    {role === 'CUSTOMER' && <span className="text-orange-600">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      quickDemoLogin('TECHNICIAN');
                      setDemoMenuOpen(false);
                      navigate('/technician/dashboard');
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                      role === 'TECHNICIAN' ? 'font-bold text-orange-600' : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span>👷 {isBangla ? 'মিস্ত্রি (Technician)' : 'Technician'}</span>
                    {role === 'TECHNICIAN' && <span className="text-orange-600">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      quickDemoLogin('ADMIN');
                      setDemoMenuOpen(false);
                      navigate('/admin/dashboard');
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                      role === 'ADMIN' ? 'font-bold text-orange-600' : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span>👨‍💼 {isBangla ? 'অ্যাডমিন (Admin)' : 'Admin'}</span>
                    {role === 'ADMIN' && <span className="text-orange-600">✓</span>}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Profile / Dashboard Avatar */}
          {currentUser ? (
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setNotifDropdownOpen(false);
                  setDemoMenuOpen(false);
                }}
                type="button"
                className="flex items-center justify-center p-0.5 rounded-full ring-2 ring-orange-500/40 hover:ring-orange-500 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 shrink-0"
                aria-label="User menu"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 aspect-square shadow-xs"
                  referrerPolicy="no-referrer"
                />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[998]"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-64 max-w-xs bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 py-2 z-[999] animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500 shrink-0 aspect-square"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {currentUser.email}
                        </p>
                        <span className="inline-block text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-1.5 py-0.5 rounded-md mt-1">
                          {role === 'TECHNICIAN' ? (isBangla ? '👷 মিস্ত্রি' : '👷 Technician') : role === 'ADMIN' ? (isBangla ? '👨‍💼 অ্যাডমিন' : '👨‍💼 Admin') : (isBangla ? '👤 গ্রাহক' : '👤 Customer')}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={getDashboardLink()}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>{t.nav.dashboard}</span>
                    </Link>

                    {role === 'CUSTOMER' && (
                      <Link
                        to="/customer/bookings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
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
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-t border-zinc-100 dark:border-zinc-800 mt-1 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>{t.nav.logout}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/login"
                className="px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:text-orange-500 transition-colors"
              >
                {t.nav.login}
              </Link>
              <Link
                to="/register"
                className="px-3.5 sm:px-4 py-1.5 text-xs font-black rounded-full bg-[#FA4D00] hover:bg-orange-600 text-white shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center gap-1"
              >
                <span>{t.nav.register}</span>
                <span className="text-[10px]">←</span>
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (STRICTLY ROLE FILTERED) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3.5 animate-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* User Profile Header in Mobile Drawer */}
          {currentUser && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-orange-500 shrink-0 aspect-square shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {currentUser.name}
                </h4>
                <p className="text-[11px] text-zinc-500 truncate">{currentUser.email}</p>
                <span className="inline-block text-[10px] font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                  {role === 'TECHNICIAN' ? (isBangla ? '👷 ভেরিফায়েড টেকনিশিয়ান' : '👷 Verified Technician') : role === 'ADMIN' ? (isBangla ? '👨‍💼 সিস্টেম অ্যাডমিন' : '👨‍💼 System Admin') : (isBangla ? '👤 ভেরিফায়েড গ্রাহক' : '👤 Verified Customer')}
                </span>
              </div>
            </div>
          )}

          {/* Mobile Role Switcher */}
          <div className="p-3 rounded-2xl bg-stone-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
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
                className={`py-2 px-1.5 rounded-xl text-center cursor-pointer transition-colors ${
                  role === 'CUSTOMER' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                👤 {isBangla ? 'গ্রাহক' : 'Customer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  quickDemoLogin('TECHNICIAN');
                  setMobileMenuOpen(false);
                  navigate('/technician/dashboard');
                }}
                className={`py-2 px-1.5 rounded-xl text-center cursor-pointer transition-colors ${
                  role === 'TECHNICIAN' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                👷 {isBangla ? 'মিস্ত্রি' : 'Tech'}
              </button>
              <button
                type="button"
                onClick={() => {
                  quickDemoLogin('ADMIN');
                  setMobileMenuOpen(false);
                  navigate('/admin/dashboard');
                }}
                className={`py-2 px-1.5 rounded-xl text-center cursor-pointer transition-colors ${
                  role === 'ADMIN' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                👨‍💼 {isBangla ? 'অ্যাডমিন' : 'Admin'}
              </button>
            </div>
          </div>

          <nav className="flex flex-col space-y-1 text-sm font-medium pt-1">
            {/* ROLE SPECIFIC MOBILE LINKS */}
            {(!role || role === 'CUSTOMER') && (
              <>
                <Link
                  to="/services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  {t.nav.services}
                </Link>
                <Link
                  to="/professionals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  {t.nav.findPros}
                </Link>
                <Link
                  to="/heatmap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span>{isBangla ? 'লাইভ ডিমান্ড হিটম্যাপ' : 'Live Demand Heatmap'}</span>
                </Link>
                <Link
                  to="/how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  {t.nav.howItWorks}
                </Link>
                <Link
                  to="/become-professional"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl text-orange-600 dark:text-orange-400 font-semibold hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                >
                  {t.nav.becomePro}
                </Link>
              </>
            )}

            {role === 'TECHNICIAN' && (
              <>
                <Link
                  to="/technician/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                >
                  <Radio className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span>{isBangla ? 'লাইভ জব রিকোয়েস্ট' : 'Live Job Feed'}</span>
                </Link>
                <Link
                  to="/heatmap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2"
                >
                  <span>🔥</span>
                  <span>{isBangla ? 'কাজের চাহিদা হটস্পট' : 'Demand Hotspots'}</span>
                </Link>
                <Link
                  to="/map"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2"
                >
                  <span>🗺️</span>
                  <span>{isBangla ? 'সার্ভিস ম্যাপ' : 'Live Map'}</span>
                </Link>
              </>
            )}

            {role === 'ADMIN' && (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                >
                  <Layers className="w-4 h-4 text-orange-500" />
                  <span>{isBangla ? 'অ্যাডমিন কনসোল' : 'Admin Console'}</span>
                </Link>
                <Link
                  to="/heatmap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2"
                >
                  <span>🔥</span>
                  <span>{isBangla ? 'ডিমান্ড অ্যানালিটিক্স' : 'Demand Analytics'}</span>
                </Link>
                <Link
                  to="/map"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors flex items-center gap-2"
                >
                  <span>🗺️</span>
                  <span>{isBangla ? 'লাইভ টেকনিশিয়ান ম্যাপ' : 'Fleet Map'}</span>
                </Link>
              </>
            )}

            <Link
              to="/safety"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl text-zinc-800 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {t.nav.safety}
            </Link>

            <Link
              to="/emergency"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>{t.nav.emergency}</span>
            </Link>

            {currentUser && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-orange-500" />
                  <span>{t.nav.dashboard}</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  type="button"
                  className="w-full text-left py-2 px-3 rounded-xl text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.nav.logout}</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
