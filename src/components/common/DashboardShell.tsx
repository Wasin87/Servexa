import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Lock, ChevronRight, User, Wrench, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserRole } from '../../types';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number | string;
  highlightCount?: boolean;
  locked?: boolean;
}

export interface DashboardNavGroup {
  id: string;
  label: string;
  items: DashboardNavItem[];
}

export interface DashboardKpiItem {
  id: string;
  label: string;
  value: string | number;
  sublabel: string;
  accent?: 'orange' | 'emerald' | 'amber' | 'rose' | 'blue' | 'neutral';
}

interface DashboardShellProps {
  portalLabel: string;
  userName: string;
  userMeta: string;
  userAvatar?: string;
  verifiedLabel?: string;
  isVerified?: boolean;
  navGroups: DashboardNavGroup[];
  activeTab: string;
  onSelectTab: (id: string, item: DashboardNavItem) => void;
  activeSectionTitle: string;
  activeSectionSubtitle?: string;
  headerActions?: React.ReactNode;
  sidebarTopSlot?: React.ReactNode;
  mobileStickyTopSlot?: React.ReactNode;
  kpis?: DashboardKpiItem[];
  banners?: React.ReactNode;
  children: React.ReactNode;
}

const KPI_VALUE_COLOR: Record<NonNullable<DashboardKpiItem['accent']>, string> = {
  orange: 'text-orange-600 dark:text-orange-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  blue: 'text-blue-600 dark:text-blue-400',
  neutral: 'text-zinc-900 dark:text-white'
};

export const DashboardShell: React.FC<DashboardShellProps> = ({
  portalLabel,
  userName,
  userMeta,
  userAvatar,
  verifiedLabel,
  isVerified = false,
  navGroups,
  activeTab,
  onSelectTab,
  activeSectionTitle,
  activeSectionSubtitle,
  headerActions,
  sidebarTopSlot,
  mobileStickyTopSlot,
  kpis,
  banners,
  children
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { role, quickDemoLogin } = useAuth();
  const { isBangla } = useLanguage();
  const navigate = useNavigate();

  const roleTargets: { id: UserRole; label: string; icon: React.ReactNode; path: string }[] = [
    {
      id: 'CUSTOMER',
      label: isBangla ? 'গ্রাহক' : 'Customer',
      icon: <User className="w-3.5 h-3.5" />,
      path: '/customer/dashboard'
    },
    {
      id: 'TECHNICIAN',
      label: isBangla ? 'মিস্ত্রি' : 'Pro',
      icon: <Wrench className="w-3.5 h-3.5" />,
      path: '/technician/dashboard'
    },
    {
      id: 'ADMIN',
      label: isBangla ? 'অ্যাডমিন' : 'Admin',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      path: '/admin/dashboard'
    }
  ];

  const handleRoleSwitch = (targetRole: UserRole, path: string) => {
    quickDemoLogin(targetRole);
    setMobileSidebarOpen(false);
    navigate(path);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Portal Identity Block */}
      <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
              {userName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10px] sm:text-[11px] font-semibold text-orange-600 dark:text-orange-400 truncate">
              {portalLabel}
            </div>
            <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
              {userName}
            </div>
            <div className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {verifiedLabel ? (
                <span className={isVerified ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                  {verifiedLabel} ·{' '}
                </span>
              ) : null}
              <span>{userMeta}</span>
            </div>
          </div>
        </div>

        {sidebarTopSlot && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            {sidebarTopSlot}
          </div>
        )}
      </div>

      {/* Grouped Vertical Navigation */}
      <nav aria-label={portalLabel} className="flex-1 p-2.5 sm:p-3 space-y-3.5 sm:space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.id} className="space-y-0.5">
            <div className="px-2.5 pb-1 text-[10px] sm:text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id, item);
                      if (!item.locked) {
                        setMobileSidebarOpen(false);
                      }
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                      item.locked
                        ? 'text-zinc-400 dark:text-zinc-600 opacity-65 cursor-not-allowed'
                        : isActive
                        ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 font-bold cursor-pointer'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white font-medium border border-transparent cursor-pointer'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {item.locked ? <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" /> : item.icon}
                      </span>
                      <span className="truncate whitespace-nowrap">{item.label}</span>
                    </span>

                    {item.count !== undefined && item.count !== '' && (
                      <span
                        className={`shrink-0 text-[10px] sm:text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                          item.highlightCount
                            ? 'bg-orange-600 text-white'
                            : isActive
                            ? 'bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-200'
                            : 'text-zinc-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer: Compact Workspace Role Switcher */}
      <div className="p-2.5 sm:p-3 border-t border-zinc-100 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-950/40 rounded-b-2xl">
        <div className="px-1 pb-1.5 text-[10px] sm:text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
          {isBangla ? 'পোর্টাল পরিবর্তন (রোল)' : 'Switch Workspace Role'}
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-stone-200/70 dark:bg-zinc-800/80">
          {roleTargets.map((r) => {
            const active = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSwitch(r.id, r.path)}
                className={`py-1.5 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1440px] mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Mobile Sticky Top Header & Live Tracking Bar */}
      <div className="lg:hidden sticky top-0 z-[2500] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 shadow-md space-y-2 mb-3">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label={isBangla ? 'বাম মেনু প্যানেল খুলুন' : 'Open left menu panel'}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer active:scale-95 transition-transform"
            >
              <Menu className="w-4 h-4 shrink-0" />
              <span>{isBangla ? 'মেনু' : 'Menu'}</span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 truncate leading-tight">
                {portalLabel}
              </div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white truncate leading-tight mt-0.5">
                {activeSectionTitle}
              </div>
            </div>
          </div>

          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-xs"
            />
          ) : null}
        </div>

        {mobileStickyTopSlot && (
          <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
            {mobileStickyTopSlot}
          </div>
        )}
      </div>

      {/* Mobile Left Slide-Over Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-[10000] lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-10 w-[264px] max-w-[82vw] h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-left duration-150">
            <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {portalLabel}
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close sidebar"
                className="min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center text-zinc-500 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderSidebarContent()}</div>
          </aside>
        </div>
      )}

      {/* Desktop Two-Column Workspace: Sticky Left Rail + Main Viewport */}
      <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-6">
        <aside className="hidden lg:flex w-[272px] shrink-0 sticky top-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-[calc(100vh-6rem)] flex-col">
          {renderSidebarContent()}
        </aside>

        <div className="flex-1 min-w-0 w-full space-y-3.5 sm:space-y-5">
          {/* Top Workspace Header & Breadcrumb Strip */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 overflow-hidden">
                <span className="shrink-0">Servexa</span>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="shrink-0">{portalLabel}</span>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {activeSectionTitle}
                </span>
              </div>
              <h1 className="text-base sm:text-xl lg:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-snug">
                {activeSectionTitle}
              </h1>
              {activeSectionSubtitle && (
                <p className="text-[11px] sm:text-sm text-zinc-500 dark:text-zinc-400 leading-snug">
                  {activeSectionSubtitle}
                </p>
              )}
            </div>

            {headerActions && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {headerActions}
              </div>
            )}
          </div>

          {/* Compact 2-Column Mobile / 4-Column Desktop KPI Metrics Strip */}
          {kpis && kpis.length > 0 && (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
              {kpis.map((kpi) => (
                <div
                  key={kpi.id}
                  className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                    {kpi.label}
                  </div>
                  <div
                    className={`text-lg sm:text-2xl font-extrabold tracking-tight tabular-nums mt-0.5 sm:mt-1 truncate ${
                      KPI_VALUE_COLOR[kpi.accent || 'neutral']
                    }`}
                  >
                    {kpi.value}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    {kpi.sublabel}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contextual Alert / Progress Banners */}
          {banners}

          {/* Active Page / Section Content */}
          <section aria-label={activeSectionTitle} className="min-w-0">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
};
