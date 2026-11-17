import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Award,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  Layers,
  Wrench,
  Check,
  X,
  Phone,
  ArrowRight,
  Sparkles,
  Zap,
  Tag,
  Trash2,
  Eye,
  FileCheck2,
  MapPin,
  Sliders,
  Banknote,
  Map,
  Flame
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { DashboardShell, DashboardNavGroup, DashboardKpiItem } from '../components/common/DashboardShell';
import { calculateTechnicianCompletion } from '../utils/profileCompletion';
import { Technician, Booking, ReportItem, WarrantyClaim } from '../types';
import { AdminRulesManagement } from '../components/admin/AdminRulesManagement';
import { AdminFinancialDashboard } from '../components/admin/AdminFinancialDashboard';
import { fetchAdminFinanceOverview } from '../services/financeApi';

export const AdminDashboard: React.FC = () => {
  const {
    technicians,
    bookings,
    reports,
    warranties,
    categories,
    verifyTechnicianField,
    resolveReport,
    updateWarrantyStatus,
    updateBookingStatus,
    deleteTechnician
  } = useApp();
  const { t, isBangla } = useLanguage();
  const { authTokenReady, currentUser } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const validTabs = ['overview', 'bookings', 'disputes', 'warranties', 'categories', 'rules', 'finance'] as const;
  const resolveTabFromLocation = (): typeof validTabs[number] => {
    const tabParam = searchParams.get('tab');
    if (tabParam && validTabs.includes(tabParam as any)) {
      return tabParam as typeof validTabs[number];
    }
    if (location.pathname.endsWith('/bookings')) return 'bookings';
    if (location.pathname.endsWith('/reports')) return 'disputes';
    if (location.pathname.endsWith('/technicians')) return 'overview';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'disputes' | 'warranties' | 'categories' | 'rules' | 'finance'>(resolveTabFromLocation);
  const [techSearch, setTechSearch] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('ALL');
  const [techToDelete, setTechToDelete] = useState<Technician | null>(null);
  const [inspectTechId, setInspectTechId] = useState<string | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const [livePlatformCommission, setLivePlatformCommission] = useState<number | null>(null);
  
  // Dispute Resolution State
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');

  // Warranty Admin Note State
  const [warrantyNotes, setWarrantyNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const param = searchParams.get('tab');
    if (param && validTabs.includes(param as any)) {
      setActiveTab(param as typeof validTabs[number]);
    } else if (location.pathname.endsWith('/bookings')) {
      setActiveTab('bookings');
    } else if (location.pathname.endsWith('/reports')) {
      setActiveTab('disputes');
    } else if (location.pathname.endsWith('/technicians')) {
      setActiveTab('overview');
    }
  }, [searchParams, location.pathname]);

  useEffect(() => {
    if (authTokenReady && currentUser?.role === 'ADMIN') {
      fetchAdminFinanceOverview()
        .then((res) => {
          setLivePlatformCommission(res.summary.totalPlatformCommission);
        })
        .catch(() => {});
    }
  }, [authTokenReady, currentUser?.role, activeTab]);

  // Stats
  const totalBookings = bookings.length + 120;
  const totalVerifiedTechs = technicians.filter(t => t.platformVerified).length;
  const openDisputes = reports.filter(r => r.status === 'OPEN').length;
  const pendingWarrantiesCount = warranties.filter(w => w.status === 'REQUESTED').length;
  const platformRevenue = livePlatformCommission ?? Math.round((bookings.reduce((sum, b) => sum + (b.finalTotal || b.estimatedTotalMax || 600), 0)) * 0.1);

  const inspectedTech = inspectTechId ? technicians.find(t => t.id === inspectTechId) || null : null;

  const filteredTechs = technicians.filter(t =>
    t.name.toLowerCase().includes(techSearch.toLowerCase()) ||
    t.primaryArea.toLowerCase().includes(techSearch.toLowerCase()) ||
    (t.district || '').toLowerCase().includes(techSearch.toLowerCase()) ||
    (t.city || '').toLowerCase().includes(techSearch.toLowerCase()) ||
    t.phone.includes(techSearch)
  );

  const filteredBookings = bookings.filter(b => {
    if (bookingFilterStatus === 'ALL') return true;
    return b.status === bookingFilterStatus;
  });

  const handleResolveReportSubmit = (reportId: string) => {
    if (!resolutionInput.trim()) return;
    resolveReport(reportId, resolutionInput.trim());
    setActiveReportId(null);
    setResolutionInput('');
  };

  const handleApproveWarranty = (claim: WarrantyClaim) => {
    const defaultNote = isBangla
      ? 'অনুমোদিত - টেকনিশিয়ানকে ফ্রি ওয়ারেন্টি সার্ভিসের জন্য পাঠানো হয়েছে।'
      : 'Approved - Dispatched to the original technician for free warranty service.';
    const note = (warrantyNotes[claim.id] || '').trim() || defaultNote;
    updateWarrantyStatus(claim.id, 'APPROVED', note);
    const assignedTech =
      technicians.find(t => t.id === claim.technicianId)?.name ||
      claim.technicianName ||
      (isBangla ? 'টেকনিশিয়ান' : 'Technician');
    setDeleteToast(
      isBangla
        ? `ওয়ারেন্টি ক্লেইম #${claim.id} অনুমোদন করে শুধু ${assignedTech}-এর ড্যাশবোর্ডে পাঠানো হয়েছে!`
        : `Warranty claim #${claim.id} approved and dispatched exclusively to ${assignedTech}'s dashboard!`
    );
    setTimeout(() => setDeleteToast(null), 4000);
  };

  const handleRejectWarranty = (claim: WarrantyClaim) => {
    const defaultNote = isBangla
      ? 'অভিযোগ পর্যালোচনা শেষে ওয়ারেন্টি শর্তের আওতাধীন পাওয়া যায়নি।'
      : 'Reviewed and found outside free warranty coverage policy.';
    const note = (warrantyNotes[claim.id] || '').trim() || defaultNote;
    updateWarrantyStatus(claim.id, 'REJECTED', note);
    setDeleteToast(
      isBangla ? `ওয়ারেন্টি ক্লেইম #${claim.id} প্রত্যাখ্যান করা হয়েছে।` : `Warranty claim #${claim.id} rejected.`
    );
    setTimeout(() => setDeleteToast(null), 3500);
  };

  const adminNavGroups: DashboardNavGroup[] = [
    {
      id: 'operations',
      label: isBangla ? 'অপারেশন ও মনিটরিং' : 'Operations & Oversight',
      items: [
        {
          id: 'overview',
          label: isBangla ? 'মিস্ত্রি ভেরিফিকেশন ও KYC' : 'Technician KYC',
          icon: <Award className="w-4 h-4" />,
          count: technicians.length
        },
        {
          id: 'bookings',
          label: isBangla ? 'সকল বুকিং মনিটর' : 'All Bookings',
          icon: <Calendar className="w-4 h-4" />,
          count: bookings.length
        },
        {
          id: 'warranties',
          label: isBangla ? 'ওয়ারেন্টি অনুমোদন' : 'Warranty Approvals',
          icon: <ShieldCheck className="w-4 h-4" />,
          count: pendingWarrantiesCount > 0 ? pendingWarrantiesCount : warranties.length,
          highlightCount: pendingWarrantiesCount > 0
        },
        {
          id: 'disputes',
          label: isBangla ? 'অভিযোগ ও ডিসপুট' : 'Disputes & Reports',
          icon: <AlertTriangle className="w-4 h-4" />,
          count: openDisputes > 0 ? openDisputes : reports.length,
          highlightCount: openDisputes > 0
        }
      ]
    },
    {
      id: 'governance',
      label: isBangla ? 'ফাইন্যান্স ও নীতিমালা' : 'Platform & Finance',
      items: [
        {
          id: 'finance',
          label: isBangla ? 'ফাইন্যান্স ও রিকনসিলিয়েশন' : 'Financial Management',
          icon: <Banknote className="w-4 h-4" />
        },
        {
          id: 'rules',
          label: isBangla ? 'রুলেস ও প্রাইসিং কন্ট্রোল' : 'Rules & Pricing',
          icon: <Sliders className="w-4 h-4" />
        },
        {
          id: 'categories',
          label: isBangla ? 'ক্যাটাগরি ও রেট কার্ড' : 'Categories & Tariffs',
          icon: <Layers className="w-4 h-4" />,
          count: categories.length
        }
      ]
    }
  ];

  const adminSectionMeta: Record<typeof activeTab, { title: string; subtitle: string }> = {
    overview: {
      title: isBangla ? 'টেকনিশিয়ান ভেরিফিকেশন ও KYC কেন্দ্র' : 'Technician KYC & Verification',
      subtitle: isBangla
        ? 'এনআইডি, ফোন ও স্কিল টেস্ট যাচাই করে ভেরিফায়েড প্রো ব্যাজ ও কাজের অনুমোদন দিন।'
        : 'Inspect technician biodata, NID photos, and grant verification or skill approval.'
    },
    bookings: {
      title: isBangla ? 'সকল বুকিং ও লাইভ ডিসপ্যাচ মনিটর' : 'All Bookings Dispatch Monitor',
      subtitle: isBangla
        ? 'সারা বাংলাদেশের চলমান ও সম্পন্ন সকল সার্ভিস বুকিংয়ের অবস্থা পর্যবেক্ষণ করুন।'
        : 'Track active dispatches, service billing status, and regional booking flow.'
    },
    warranties: {
      title: isBangla ? '৭-দিনের ওয়ারেন্টি ক্লেইম অনুমোদন' : 'Warranty Claim Approvals',
      subtitle: isBangla
        ? 'গ্রাহকের ওয়ারেন্টি আবেদন পর্যালোচনা করে সংশ্লিষ্ট টেকনিশিয়ানের কাছে ডিসপ্যাচ করুন।'
        : 'Review customer warranty claims and route approved re-service jobs to technicians.'
    },
    disputes: {
      title: isBangla ? 'গ্রাহক অভিযোগ ও ডিসপুট সমাধান' : 'Disputes & Complaint Resolution',
      subtitle: isBangla
        ? 'গ্রাহক ও টেকনিশিয়ানের মধ্যকার বিরোধ পর্যালোচনা করে প্রশাসনিক সিদ্ধান্ত দিন।'
        : 'Investigate open complaints and record administrative dispute resolutions.'
    },
    finance: {
      title: isBangla ? 'ফাইন্যান্স, কমিশন ও ক্যাশ রিকনসিলিয়েশন' : 'Financial Operations & Payouts',
      subtitle: isBangla
        ? 'প্ল্যাটফর্ম কমিশন, উইথড্রয়াল রিকোয়েস্ট, নগদ বকেয়া ও লেজার অডিট পরিচালনা করুন।'
        : 'Manage platform commissions, payout approvals, cash reconciliation, and reserve balances.'
    },
    rules: {
      title: isBangla ? 'কেন্দ্রীয় নীতিমালা ও প্রাইসিং কন্ট্রোল' : 'Platform Rules & Pricing Control',
      subtitle: isBangla
        ? 'সার্ভিস ক্যাটালগ, কমিশন হার, রিজার্ভ ব্যালেন্স সীমা ও পেমেন্ট মেথড নির্ধারণ করুন।'
        : 'Configure service pricing rules, commission tiers, reserve limits, and payment settings.'
    },
    categories: {
      title: isBangla ? 'সার্ভিস ক্যাটাগরি ও স্ট্যান্ডার্ড ট্যারিফ' : 'Service Categories & Tariff Matrix',
      subtitle: isBangla
        ? 'প্রতিটি সার্ভিস ক্যাটাগরির প্রারম্ভিক মূল্য এবং সক্রিয় টেকনিশিয়ান কাভারেজ দেখুন।'
        : 'Monitor service category baseline pricing and active technician distribution.'
    }
  };

  const adminKpis: DashboardKpiItem[] = [
    {
      id: 'total-bookings',
      label: isBangla ? 'মোট সার্ভিস বুকিং' : 'Total Bookings',
      value: totalBookings,
      sublabel: isBangla ? 'সারা বাংলাদেশ (৬৪ জেলা)' : 'All-Bangladesh network',
      accent: 'neutral'
    },
    {
      id: 'verified-techs',
      label: isBangla ? 'ভেরিফায়েড মিস্ত্রি' : 'Verified Technicians',
      value: totalVerifiedTechs,
      sublabel: isBangla ? `মোট ${technicians.length} জনের মধ্যে` : `of ${technicians.length} registered`,
      accent: 'orange'
    },
    {
      id: 'open-disputes',
      label: isBangla ? 'বিচারাধীন অভিযোগ' : 'Open Complaints',
      value: openDisputes,
      sublabel: openDisputes > 0 ? (isBangla ? 'নিষ্পত্তি প্রয়োজন' : 'Needs review') : (isBangla ? 'সব নিষ্পন্ন' : 'All clear'),
      accent: 'rose'
    },
    {
      id: 'platform-revenue',
      label: isBangla ? 'প্ল্যাটফর্ম কমিশন আয়' : 'Platform Revenue',
      value: `৳${platformRevenue.toLocaleString()}`,
      sublabel: isBangla ? 'মোট সার্ভিস ভলিউম থেকে' : 'From gross volume',
      accent: 'emerald'
    }
  ];

  return (
    <>
      <DashboardShell
        portalLabel={isBangla ? 'অ্যাডমিন কন্ট্রোল' : 'Admin Operations'}
        userName={currentUser?.name || (isBangla ? 'প্ল্যাটফর্ম অ্যাডমিন' : 'Platform Admin')}
        userMeta={isBangla ? '৬৪ জেলা অপারেশনস হাব' : '64-District Operations Hub'}
        userAvatar={currentUser?.avatar}
        verifiedLabel={isBangla ? 'সুপার অ্যাডমিন' : 'Administrator'}
        isVerified
        navGroups={adminNavGroups}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as typeof activeTab)}
        activeSectionTitle={adminSectionMeta[activeTab].title}
        activeSectionSubtitle={adminSectionMeta[activeTab].subtitle}
        kpis={adminKpis}
        mobileStickyTopSlot={
          <div className="flex items-center justify-between gap-2 text-xs py-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-extrabold text-zinc-900 dark:text-white truncate text-[11px]">
                {isBangla ? 'অ্যাডমিন সিস্টেম লাইভ ও সুরক্ষিত' : 'System Live & Secure'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-orange-600 dark:text-orange-400">
              {bookings.length} {isBangla ? 'বুকিং' : 'Bookings'}
            </span>
          </div>
        }
        headerActions={
          <>
            <Link
              to="/map"
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs hover:border-orange-500 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Map className="w-4 h-4 text-orange-500" />
              <span>{isBangla ? 'লাইভ ফ্লিট ম্যাপ' : 'Live Fleet Map'}</span>
            </Link>
            <Link
              to="/heatmap"
              className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-orange-600 hover:bg-zinc-800 dark:hover:bg-orange-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Flame className="w-4 h-4" />
              <span>{isBangla ? 'ডিমান্ড হিটম্যাপ' : 'Demand Heatmap'}</span>
            </Link>
          </>
        }
      >

      {/* TAB 1: TECHNICIAN VERIFICATION & KYC */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                {isBangla ? 'মিস্ত্রি ভেরিফিকেশন ও এনআইডি অনুমোদন কেন্দ্র' : 'Technician KYC & Badge Management'}
              </h3>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'এনআইডি, ফোন ও স্কিল যাচাই করে প্ল্যাটফর্ম ট্রাস্ট ব্যাজ প্রদান করুন।' : 'Toggle verification status for phone, NID, and skill testing.'}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                placeholder={isBangla ? 'নাম বা এলাকা দিয়ে খুঁজুন...' : 'Search pro by name/area...'}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-bold text-zinc-600 dark:text-zinc-400">
                    <th className="p-2.5 sm:p-4">{isBangla ? 'টেকনিশিয়ান' : 'Technician'}</th>
                    <th className="p-2.5 sm:p-4">{isBangla ? 'বায়োডাটা %' : 'Profile %'}</th>
                    <th className="p-2.5 sm:p-4">{isBangla ? 'ফোন যাচাই' : 'Phone'}</th>
                    <th className="p-2.5 sm:p-4">{isBangla ? 'এনআইডি (NID)' : 'NID'}</th>
                    <th className="p-2.5 sm:p-4">{isBangla ? 'স্কিল টেস্ট' : 'Skill Test'}</th>
                    <th className="p-2.5 sm:p-4">{isBangla ? 'প্ল্যাটফর্ম ব্যাজ' : 'Platform Badge'}</th>
                    <th className="p-2.5 sm:p-4 text-right">{isBangla ? 'রেটিং / কাজ' : 'Rating / Jobs'}</th>
                    <th className="p-2.5 sm:p-4 text-center">{isBangla ? 'তথ্য ও অ্যাকশন' : 'Inspect & Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredTechs.map((tech) => {
                    const comp = calculateTechnicianCompletion(tech);
                    const hasBothNid = !!(tech.nidFrontImage && tech.nidBackImage);
                    return (
                      <tr key={tech.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={tech.avatar} alt={tech.name} className="w-10 h-10 rounded-xl object-cover border border-orange-500/20 shrink-0" />
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                                <span>{tech.name}</span>
                                {tech.platformVerified && <span className="text-blue-500 font-bold">✓</span>}
                                {!tech.skillVerified && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 text-[9px] font-black">
                                    {isBangla ? 'নতুন' : 'New'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400">
                                📍 {tech.primaryArea ? `${tech.primaryArea}, ` : ''}
                                {tech.district || tech.city || (isBangla ? 'ঠিকানা নেই' : 'No address')} · 📞 {tech.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Biodata Completion % */}
                        <td className="p-4">
                          <div className="w-24 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-black tabular-nums">
                              <span className={comp.isMinReady ? 'text-emerald-600' : 'text-amber-600'}>
                                {comp.percent}%
                              </span>
                              <span className="text-[9px] text-zinc-400">
                                {hasBothNid || tech.nidVerified ? 'NID ✓' : isBangla ? 'NID বাকি' : 'NID Pending'}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${comp.isMinReady ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                style={{ width: `${comp.percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Phone Verified Toggle */}
                        <td className="p-4">
                          <button
                            onClick={() => verifyTechnicianField(tech.id, 'phoneVerified', !tech.phoneVerified)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
                              tech.phoneVerified ? 'bg-emerald-500/15 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {tech.phoneVerified ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>
                              {tech.phoneVerified
                                ? isBangla
                                  ? 'যাচাইকৃত'
                                  : 'Verified'
                                : isBangla
                                ? 'অননুমোদিত'
                                : 'Unverified'}
                            </span>
                          </button>
                        </td>

                        {/* NID Verified Toggle */}
                        <td className="p-4">
                          <button
                            onClick={() => verifyTechnicianField(tech.id, 'nidVerified', !tech.nidVerified)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
                              tech.nidVerified ? 'bg-emerald-500/15 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {tech.nidVerified ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>
                              {tech.nidVerified
                                ? isBangla
                                  ? 'NID ভেরিফায়েড'
                                  : 'NID Verified'
                                : isBangla
                                ? 'পেন্ডিং'
                                : 'Pending'}
                            </span>
                          </button>
                        </td>

                        {/* Skill Verified Toggle */}
                        <td className="p-4">
                          <button
                            onClick={() => verifyTechnicianField(tech.id, 'skillVerified', !tech.skillVerified)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
                              tech.skillVerified ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                            }`}
                          >
                            {tech.skillVerified ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            <span>
                              {tech.skillVerified
                                ? isBangla
                                  ? 'দক্ষতা উত্তীর্ণ'
                                  : 'Skill Passed'
                                : isBangla
                                ? 'পরীক্ষা বাকি'
                                : 'Pending Test'}
                            </span>
                          </button>
                        </td>

                        {/* Platform Verified Badge Toggle */}
                        <td className="p-4">
                          <button
                            onClick={() => verifyTechnicianField(tech.id, 'platformVerified', !tech.platformVerified)}
                            className={`px-3 py-1 rounded-xl font-black text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
                              tech.platformVerified
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              {tech.platformVerified
                                ? isBangla
                                  ? 'ভেরিফায়েড প্রো'
                                  : 'Verified Pro'
                                : isBangla
                                ? 'ব্যাজ নেই'
                                : 'No Badge'}
                            </span>
                          </button>
                        </td>

                        <td className="p-4 text-right">
                          <div className="font-bold text-amber-500">★ {tech.rating}</div>
                          <div className="text-[10px] text-zinc-400">
                            {tech.completedJobs} {isBangla ? 'কাজ সম্পন্ন' : 'jobs done'}
                          </div>
                        </td>

                        {/* Inspect & Delete Action Buttons */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectTechId(tech.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                              title={isBangla ? 'সম্পূর্ণ বায়োডাটা ও NID দেখুন' : 'Inspect Full Biodata & NID'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isBangla ? 'বিস্তারিত ও NID' : 'Inspect'}</span>
                            </button>
                            <button
                              onClick={() => setTechToDelete(tech)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={isBangla ? 'মিস্ত্রি মুছে ফেলুন' : 'Delete Technician'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL BOOKINGS MONITOR */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                {isBangla ? 'প্ল্যাটফর্মের সকল ডিসপ্যাচ ও বুকিং লাইভ মনিটর' : 'All Bookings Live Monitor'}
              </h3>
              <p className="text-xs text-zinc-500">
                {isBangla ? `মোট ${bookings.length}টি ডিসপ্যাচ রেকর্ড করা হয়েছে` : `${bookings.length} total dispatches recorded`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bookingFilterStatus}
                onChange={(e) => setBookingFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="ALL">{isBangla ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
                <option value="REQUESTED">{isBangla ? 'অনুরোধকৃত' : 'Requested'}</option>
                <option value="IN_PROGRESS">{isBangla ? 'চলমান' : 'In Progress'}</option>
                <option value="COMPLETED">{isBangla ? 'সম্পন্ন' : 'Completed'}</option>
                <option value="CANCELLED">{isBangla ? 'বাতিলকৃত' : 'Cancelled'}</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredBookings.map((b) => (
                <div key={b.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-stone-50 dark:hover:bg-zinc-800/40">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-orange-600">
                        #{b.bookingNumber}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <h4 className="font-black text-xs sm:text-sm text-zinc-900 dark:text-white">
                      {isBangla ? b.serviceNameBn : b.serviceNameEn}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {isBangla ? 'গ্রাহক:' : 'Customer:'}{' '}
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{b.customerName}</span> ({b.customerArea}) ·{' '}
                      {isBangla ? 'টেকনিশিয়ান:' : 'Technician:'}{' '}
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{b.technicianName}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0">
                    <div className="text-right">
                      <div className="font-black text-emerald-600 text-sm">৳{b.finalTotal || b.estimatedTotalMax}</div>
                      <div className="text-[10px] text-zinc-400">{b.paymentStatus}</div>
                    </div>

                    <Link
                      to={`/booking/${b.id}`}
                      className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold hover:bg-zinc-100"
                    >
                      {isBangla ? 'বিস্তারিত' : 'View'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISPUTES & COMPLAINTS */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              {isBangla ? 'গ্রাহক ও টেকনিশিয়ান বিরোধ নিষ্পত্তি কেন্দ্র' : 'Dispute & Complaint Resolution'}
            </h3>
            <p className="text-xs text-zinc-500">
              {isBangla ? 'অভিযোগ পর্যালোচনা করে সমাধান দিন বা রিফান্ড ইস্যু করুন।' : 'Review customer dispute cases and issue administrative resolution.'}
            </p>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-rose-600">
                      {isBangla ? `অভিযোগ #${rep.id}` : `Dispute #${rep.id}`}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      ({isBangla ? `বুকিং #${rep.bookingNumber}` : `Booking #${rep.bookingNumber}`})
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    rep.status === 'OPEN' ? 'bg-rose-500/20 text-rose-600 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-600'
                  }`}>
                    {rep.status === 'OPEN'
                      ? isBangla
                        ? 'চলমান'
                        : 'OPEN'
                      : isBangla
                      ? 'নিষ্পত্তি হয়েছে'
                      : 'RESOLVED'}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div>
                    {isBangla ? 'অভিযোগকারী:' : 'Complainant:'}{' '}
                    <span className="font-bold text-zinc-900 dark:text-white">{rep.reporterName}</span> ({rep.reporterRole})
                  </div>
                  <div>
                    {isBangla ? 'যার বিরুদ্ধে অভিযোগ:' : 'Reported Against:'}{' '}
                    <span className="font-bold text-zinc-900 dark:text-white">{rep.targetName}</span> ({rep.targetRole})
                  </div>
                  <div className="text-zinc-500">
                    {isBangla ? 'অভিযোগের কারণ:' : 'Reason:'}{' '}
                    <span className="font-semibold text-rose-600">{rep.reason}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 italic border border-zinc-200 dark:border-zinc-700">
                  "{rep.description}"
                </div>

                {rep.adminResolution ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                    ✅ {isBangla ? 'নিষ্পত্তি নোট:' : 'Resolution Note:'} {rep.adminResolution}
                  </div>
                ) : (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setActiveReportId(rep.id)}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      {isBangla ? 'অভিযোগ সমাধান করুন' : 'Resolve Dispute'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WARRANTY CLAIMS APPROVAL */}
      {activeTab === 'warranties' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                {isBangla ? '৭-দিনের ফ্রি সার্ভিসিং ওয়ারেন্টি ক্লেইম অনুমোদন ও ডিসপ্যাচ' : 'Warranty Claims Approval & Technician Dispatch'}
              </h3>
              <p className="text-xs text-zinc-500">
                {isBangla
                  ? 'অ্যাপ্রুভ করলে ক্লেইমটি সরাসরি মূল টেকনিশিয়ানের ড্যাশবোর্ডে "ওয়ারেন্টি ক্লেইম" হিসেবে চলে যাবে।'
                  : 'Approving a claim routes it directly to the original technician for free warranty service.'}
              </p>
            </div>
            {pendingWarrantiesCount > 0 && (
              <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black self-start">
                ⏳{' '}
                {isBangla
                  ? `${pendingWarrantiesCount} টি ক্লেইম অনুমোদনের অপেক্ষায়`
                  : `${pendingWarrantiesCount} claim(s) pending approval`}
              </span>
            )}
          </div>

          {warranties.length === 0 ? (
            <div className="p-7 sm:p-10 text-center bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <ShieldCheck className="w-10 h-10 text-zinc-400 mx-auto" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'কোনো ওয়ারেন্টি ক্লেইম জমা পড়েনি' : 'No warranty claims submitted yet'}
              </h4>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'গ্রাহকরা কোনো সম্পন্ন কাজের ওপর ওয়ারেন্টি ক্লেইম করলে এখানে অনুমোদনের জন্য প্রদর্শিত হবে।' : 'Customer warranty claims will appear here for review.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {warranties.map((w) => {
                const relatedBooking = bookings.find(b => b.id === w.bookingId);
                const relatedTech = technicians.find(t => t.id === w.technicianId);
                const customerName = w.customerName || relatedBooking?.customerName || (isBangla ? 'গ্রাহক' : 'Customer');
                const customerPhone = w.customerPhone || relatedBooking?.customerPhone || '';
                const customerAddress = w.customerAddress || relatedBooking?.customerAddress || w.customerArea || relatedBooking?.customerArea || '';
                const techName = w.technicianName || relatedBooking?.technicianName || relatedTech?.name || (isBangla ? 'টেকনিশিয়ান' : 'Technician');
                const techPhone = w.technicianPhone || relatedBooking?.technicianPhone || relatedTech?.phone || '';

                const statusBadgeLabel: Record<WarrantyClaim['status'], string> = {
                  REQUESTED: isBangla ? 'অনুমোদনের অপেক্ষায় (Pending)' : 'Pending Approval',
                  APPROVED: isBangla ? 'অনুমোদিত · টেকনিশিয়ানের কাছে পাঠানো হয়েছে' : 'Approved · Sent to Technician',
                  ACCEPTED: isBangla ? 'টেকনিশিয়ান পিক করেছেন' : 'Accepted by Technician',
                  ON_THE_WAY: isBangla ? 'টেকনিশিয়ান পথে আছেন' : 'Technician On The Way',
                  RESOLVED: isBangla ? 'সার্ভিস সম্পন্ন (Resolved)' : 'Resolved',
                  REJECTED: isBangla ? 'প্রত্যাখ্যাত' : 'Rejected',
                };

                const statusBadgeStyle: Record<WarrantyClaim['status'], string> = {
                  REQUESTED: 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
                  APPROVED: 'bg-blue-500/15 text-blue-600 border border-blue-500/30',
                  ACCEPTED: 'bg-indigo-500/15 text-indigo-600 border border-indigo-500/30',
                  ON_THE_WAY: 'bg-orange-500/15 text-orange-600 border border-orange-500/30',
                  RESOLVED: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
                  REJECTED: 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                };

                const defaultApprovalPlaceholder = isBangla
                  ? 'অনুমোদিত - টেকনিশিয়ানকে ফ্রি ওয়ারেন্টি সার্ভিসের জন্য পাঠানো হয়েছে।'
                  : 'Approved - Dispatched to the original technician for free warranty service.';

                return (
                  <div key={w.id} className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3.5 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 font-mono text-xs font-black">
                          {isBangla ? `ওয়্যারেন্টি আইডি: #${w.id}` : `Warranty ID: #${w.id}`}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono font-bold">
                          {isBangla ? `সার্ভিস নং: #${w.bookingNumber}` : `Booking No: #${w.bookingNumber}`}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black self-start sm:self-auto ${statusBadgeStyle[w.status]}`}>
                        {statusBadgeLabel[w.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
                        <div className="text-[11px] font-bold text-zinc-400 uppercase">
                          {isBangla ? 'গ্রাহকের তথ্য' : 'Customer Info'}
                        </div>
                        <div className="font-black text-zinc-900 dark:text-white">{customerName}</div>
                        {customerPhone && <div className="text-zinc-600 dark:text-zinc-300">📞 {customerPhone}</div>}
                        {customerAddress && <div className="text-zinc-500">📍 {customerAddress}</div>}
                      </div>

                      <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 space-y-1">
                        <div className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>
                            {isBangla
                              ? 'নির্ধারিত টেকনিশিয়ান (যার কাছে কাজ যাবে)'
                              : 'Assigned Technician (Direct Dispatch)'}
                          </span>
                        </div>
                        <div className="font-black text-zinc-900 dark:text-white">{techName}</div>
                        {techPhone && <div className="text-zinc-600 dark:text-zinc-300">📞 {techPhone}</div>}
                        <div className="text-[11px] text-zinc-500">
                          {isBangla ? 'সার্ভিস:' : 'Service:'}{' '}
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{w.serviceName}</span> ·{' '}
                          {isBangla ? 'তারিখ:' : 'Date:'} {w.requestDate}
                        </div>
                      </div>
                    </div>

                    <p className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 italic border border-zinc-200 dark:border-zinc-700">
                      {isBangla ? 'সমস্যার বিবরণ:' : 'Issue Description:'} "{w.issueDescription}"
                    </p>

                    {w.status === 'REQUESTED' ? (
                      <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                            {isBangla
                              ? 'অ্যাডমিন অনুমোদন নোট / টেকনিশিয়ানের জন্য নির্দেশনা:'
                              : 'Admin Approval Note / Technician Instructions:'}
                          </label>
                          <input
                            type="text"
                            value={warrantyNotes[w.id] ?? ''}
                            placeholder={defaultApprovalPlaceholder}
                            onChange={(e) => setWarrantyNotes(prev => ({ ...prev, [w.id]: e.target.value }))}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            onClick={() => handleRejectWarranty(w)}
                            className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          >
                            {isBangla ? 'প্রত্যাখ্যান' : 'Reject'}
                          </button>
                          <button
                            onClick={() => handleApproveWarranty(w)}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {isBangla ? `অ্যাপ্রুভ ও ${techName}-কে পাঠান` : `Approve & Dispatch to ${techName}`}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                        {w.adminNote && (
                          <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                            ✅ {isBangla ? 'অ্যাডমিন নোট:' : 'Admin Note:'} {w.adminNote}
                          </div>
                        )}
                        {w.technicianNote && (
                          <div className="text-blue-600 dark:text-blue-400 font-bold">
                            🔧 {isBangla ? 'টেকনিশিয়ান আপডেট:' : 'Technician Update:'} {w.technicianNote}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CATEGORIES & TARIFFS */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                {isBangla ? 'সার্ভিস ক্যাটাগরি ও স্ট্যান্ডার্ড ট্যারিফ রেট' : 'Service Categories & Tariff Matrix'}
              </h3>
              <p className="text-xs text-zinc-500">
                {isBangla ? 'প্ল্যাটফর্মের প্রারম্ভিক প্রাইসিং ও সক্রিয় টেকনিশিয়ান সংখ্যা পর্যবেক্ষণ।' : 'Manage baseline starting tariffs and monitor professional coverage.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{cat.icon || '🔧'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                    {cat.activeProfessionals}+ {isBangla ? 'মিস্ত্রি' : 'Pros'}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                  {isBangla ? cat.nameBn : cat.nameEn}
                </h4>
                <p className="text-xs text-zinc-500 line-clamp-2">
                  {isBangla ? cat.descriptionBn : cat.descriptionEn}
                </p>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">{isBangla ? 'শুরু মূল্য:' : 'Starting at:'}</span>
                  <span className="font-black text-emerald-600">৳{cat.startingPrice}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CENTRAL RULES, PRICING & GOVERNANCE */}
      {activeTab === 'rules' && <AdminRulesManagement />}

      {/* TAB 7: FINANCIAL MANAGEMENT, WITHDRAWALS & CASH RECONCILIATION */}
      {activeTab === 'finance' && <AdminFinancialDashboard />}

      {/* Dispute Resolution Modal */}
      {activeReportId && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'অ্যাডমিন বিরোধ নিষ্পত্তি নোট' : 'Admin Dispute Resolution Note'}
              </h3>
              <button onClick={() => setActiveReportId(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  {isBangla ? 'অ্যাডমিন সিদ্ধান্ত ও সমঝোতা নোট:' : 'Admin Decision & Settlement Note:'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionInput}
                  onChange={(e) => setResolutionInput(e.target.value)}
                  placeholder={
                    isBangla
                      ? 'উভয় পক্ষের সাথে কথা বলে মিস্ত্রিকে অতিরিক্ত ২০০ টাকা গ্রাহককে ফেরত দেওয়ার নির্দেশ প্রদান করা হয়েছে এবং বিষয়টি মীমাংসিত...'
                      : 'Spoke with both parties, instructed a ৳200 refund to the customer, and marked the dispute resolved...'
                  }
                  className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveReportId(null)} className="px-4 py-2 rounded-xl border font-bold">
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveReportSubmit(activeReportId)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md"
                >
                  {isBangla ? 'মীমাংসা নিশ্চিত করুন (Resolve)' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Technician Confirmation Modal */}
      {techToDelete && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'টেকনিশিয়ান স্থায়ীভাবে ডিলিট করুন' : 'Delete Technician'}
              </h3>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {isBangla ? (
                <>
                  আপনি কি নিশ্চিতভাবে <span className="font-bold text-zinc-900 dark:text-white">"{techToDelete.name}"</span> কে প্ল্যাটফর্ম থেকে মুছে ফেলতে চান? এটি মুছে ফেললে তার সকল তথ্য এবং সার্ভিস কভারেজ অপসারিত হবে।
                </>
              ) : (
                <>
                  Are you sure you want to permanently remove <span className="font-bold text-zinc-900 dark:text-white">"{techToDelete.name}"</span> from the platform? This removes their profile and service coverage.
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setTechToDelete(null)}
                className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
              >
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const deletedName = techToDelete.name;
                  deleteTechnician(techToDelete.id);
                  setDeleteToast(
                    isBangla
                      ? `টেকনিশিয়ান ${deletedName} সফলভাবে প্ল্যাটফর্ম থেকে মুছে ফেলা হয়েছে।`
                      : `Technician ${deletedName} successfully removed from the platform.`
                  );
                  setTechToDelete(null);
                  setTimeout(() => setDeleteToast(null), 3500);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {isBangla ? 'হ্যাঁ, ডিলিট করুন' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technician Full Biodata & NID Inspection Modal */}
      {inspectedTech && (() => {
        const comp = calculateTechnicianCompletion(inspectedTech);
        const missingLabels = isBangla ? comp.missingLabelsBn : comp.missingLabelsEn;
        return (
          <div className="fixed inset-0 z-[3200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={inspectedTech.avatar}
                    alt={inspectedTech.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500 shadow-sm shrink-0"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                        {inspectedTech.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black tabular-nums ${
                        comp.isMinReady ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                      }`}>
                        {isBangla ? `বায়োডাটা ${comp.percent}% সম্পূর্ণ` : `Biodata ${comp.percent}% Complete`}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      📞 {inspectedTech.phone} {inspectedTech.email ? `· ✉️ ${inspectedTech.email}` : ''}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      <span>
                        {[inspectedTech.primaryArea, inspectedTech.district || inspectedTech.city, inspectedTech.division].filter(Boolean).join(', ') ||
                          (isBangla ? 'লোকেশন যুক্ত করা হয়নি' : 'Location not added')}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectTechId(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Completion Bar & Missing fields */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {isBangla ? 'প্রোফাইল ও কাগজপত্রের অগ্রগতি:' : 'Profile & Document Progress:'}
                  </span>
                  <span className={comp.isMinReady ? 'text-emerald-600' : 'text-orange-600'}>
                    {comp.completedCount}/{comp.totalCount} {isBangla ? 'ধাপ' : 'steps'} ({comp.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${comp.isComplete ? 'bg-emerald-500' : 'bg-orange-500'}`}
                    style={{ width: `${comp.percent}%` }}
                  />
                </div>
                {missingLabels.length > 0 && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    {isBangla ? 'বাকি থাকা তথ্য:' : 'Missing fields:'} {missingLabels.join(', ')}
                  </div>
                )}
              </div>

              {/* Biodata & Tariff Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                  <div className="font-black text-zinc-800 dark:text-zinc-200">
                    {isBangla ? 'পেশাগত বায়োডাটা' : 'Professional Biodata'}
                  </div>
                  <div>
                    {isBangla ? 'অভিজ্ঞতা:' : 'Experience:'}{' '}
                    <span className="font-bold">
                      {inspectedTech.experienceYears || 0} {isBangla ? 'বছর' : 'years'}
                    </span>
                  </div>
                  <div>
                    {isBangla ? 'কাজের সময়সীমা:' : 'Working Hours:'}{' '}
                    <span className="font-bold">
                      {inspectedTech.workingHours || (isBangla ? 'নির্ধারিত নয়' : 'Not specified')}
                    </span>
                  </div>
                  <div>
                    {isBangla ? 'ভিজিটিং ফি:' : 'Visiting Fee:'}{' '}
                    <span className="font-bold">৳{inspectedTech.visitingFee || 0}</span> ·{' '}
                    {isBangla ? 'প্রারম্ভিক মূল্য:' : 'Starting Price:'}{' '}
                    <span className="font-bold">৳{inspectedTech.startingPrice || 0}</span>
                  </div>
                  <div>
                    {isBangla ? 'কভারেজ ব্যাসার্ধ:' : 'Coverage Radius:'}{' '}
                    <span className="font-bold">
                      {inspectedTech.serviceRadiusKm || 0} {isBangla ? 'কিমি' : 'km'}
                    </span>
                  </div>
                  <div>
                    {isBangla ? 'পোর্টফোলিও ছবি:' : 'Portfolio Photos:'}{' '}
                    <span className="font-bold">
                      {inspectedTech.portfolio?.length || 0}
                      {isBangla ? 'টি' : ''}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                  <div className="font-black text-zinc-800 dark:text-zinc-200">
                    {isBangla ? 'বায়ো ও দক্ষতা (Skills)' : 'Bio & Skills'}
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 font-semibold">
                    {(isBangla ? inspectedTech.bioBn : inspectedTech.bioEn || inspectedTech.bioBn) ||
                      (isBangla ? 'বায়ো যুক্ত করা হয়নি' : 'Bio not added')}
                  </p>
                  {(inspectedTech.aboutBn || inspectedTech.aboutEn) && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                      "{isBangla ? inspectedTech.aboutBn || inspectedTech.aboutEn : inspectedTech.aboutEn || inspectedTech.aboutBn}"
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {inspectedTech.skills.length > 0 ? inspectedTech.skills.map(sk => (
                      <span key={sk} className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-[10px]">
                        {sk}
                      </span>
                    )) : (
                      <span className="text-[11px] text-rose-500">
                        {isBangla ? 'কোনো দক্ষতা নির্বাচন করা হয়নি' : 'No skills selected'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* NID Front & Back Images */}
              <div className="space-y-2">
                <div className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-orange-500" />
                  <span>{isBangla ? 'জাতীয় পরিচয়পত্র (NID) যাচাইকরণ ছবি' : 'National ID (NID) Verification Photos'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/50 space-y-2">
                    <div className="font-bold text-zinc-700 dark:text-zinc-300">
                      {isBangla ? 'NID সামনের অংশ (Front)' : 'NID Front Side'}
                    </div>
                    {inspectedTech.nidFrontImage ? (
                      <img
                        src={inspectedTech.nidFrontImage}
                        alt="NID Front"
                        className="w-full h-40 object-cover rounded-xl border border-zinc-300 dark:border-zinc-700"
                      />
                    ) : (
                      <div className="h-32 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
                        {isBangla ? 'সামনের অংশ আপলোড করা হয়নি' : 'Front image not uploaded'}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/50 space-y-2">
                    <div className="font-bold text-zinc-700 dark:text-zinc-300">
                      {isBangla ? 'NID পেছনের অংশ (Back)' : 'NID Back Side'}
                    </div>
                    {inspectedTech.nidBackImage ? (
                      <img
                        src={inspectedTech.nidBackImage}
                        alt="NID Back"
                        className="w-full h-40 object-cover rounded-xl border border-zinc-300 dark:border-zinc-700"
                      />
                    ) : (
                      <div className="h-32 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
                        {isBangla ? 'পেছনের অংশ আপলোড করা হয়নি' : 'Back image not uploaded'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Verification Toggles & 1-Click Pass */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => verifyTechnicianField(inspectedTech.id, 'nidVerified', !inspectedTech.nidVerified)}
                    className={`px-3 py-2 rounded-xl font-bold cursor-pointer border ${
                      inspectedTech.nidVerified
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {inspectedTech.nidVerified
                      ? isBangla
                        ? '✓ NID ভেরিফায়েড'
                        : '✓ NID Verified'
                      : isBangla
                      ? 'NID ভেরিফাই করুন'
                      : 'Verify NID'}
                  </button>

                  <button
                    type="button"
                    onClick={() => verifyTechnicianField(inspectedTech.id, 'skillVerified', !inspectedTech.skillVerified)}
                    className={`px-3 py-2 rounded-xl font-bold cursor-pointer border ${
                      inspectedTech.skillVerified
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-amber-500 text-white border-amber-500'
                    }`}
                  >
                    {inspectedTech.skillVerified
                      ? isBangla
                        ? '✓ দক্ষতা উত্তীর্ণ'
                        : '✓ Skill Passed'
                      : isBangla
                      ? 'দক্ষতা উত্তীর্ণ করুন'
                      : 'Pass Skill Test'}
                  </button>

                  <button
                    type="button"
                    onClick={() => verifyTechnicianField(inspectedTech.id, 'platformVerified', !inspectedTech.platformVerified)}
                    className={`px-3 py-2 rounded-xl font-bold cursor-pointer border ${
                      inspectedTech.platformVerified
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {inspectedTech.platformVerified
                      ? isBangla
                        ? '✓ ভেরিফায়েড প্রো'
                        : '✓ Verified Pro'
                      : isBangla
                      ? 'ভেরিফায়েড ব্যাজ দিন'
                      : 'Grant Verified Badge'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    verifyTechnicianField(inspectedTech.id, 'phoneVerified', true);
                    verifyTechnicianField(inspectedTech.id, 'nidVerified', true);
                    verifyTechnicianField(inspectedTech.id, 'skillVerified', true);
                    verifyTechnicianField(inspectedTech.id, 'platformVerified', true);
                    setDeleteToast(
                      isBangla
                        ? `${inspectedTech.name}-কে "দক্ষতা উত্তীর্ণ" ও সম্পূর্ণ অনুমোদন দেওয়া হয়েছে! এখন তিনি কাজ পিক করতে পারবেন।`
                        : `${inspectedTech.name} has been marked "Skill Passed" and fully verified! They can now accept jobs.`
                    );
                    setTimeout(() => setDeleteToast(null), 4000);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBangla ? '১-ক্লিকে সম্পূর্ণ অনুমোদন ও দক্ষতা উত্তীর্ণ' : 'Approve All & Pass Skill Test'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Toast Notification */}
      {deleteToast && (
        <div className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-[3000] px-4 py-3 rounded-2xl bg-zinc-900 text-white text-xs font-bold shadow-2xl border border-zinc-700 flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{deleteToast}</span>
        </div>
      )}
      </DashboardShell>
    </>
  );
};
