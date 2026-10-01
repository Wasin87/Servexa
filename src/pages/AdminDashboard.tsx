import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Trash2
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { RoleSwitcherBar } from '../components/common/RoleSwitcherBar';
import { Technician, Booking, ReportItem, WarrantyClaim } from '../types';

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

  const [activeTab, setActiveTab] = useState<'overview' | 'technicians' | 'bookings' | 'disputes' | 'warranties' | 'categories'>('overview');
  const [techSearch, setTechSearch] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('ALL');
  const [techToDelete, setTechToDelete] = useState<Technician | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  
  // Dispute Resolution State
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');

  // Warranty Admin Note State
  const [activeWarrantyId, setActiveWarrantyId] = useState<string | null>(null);
  const [warrantyAdminNote, setWarrantyAdminNote] = useState('অনুমোদিত - টেকনিশিয়ানকে ফ্রি রি-ডিসপ্যাচ নির্দেশ দেওয়া হয়েছে।');

  // Stats
  const totalBookings = bookings.length + 120;
  const totalVerifiedTechs = technicians.filter(t => t.platformVerified).length;
  const openDisputes = reports.filter(r => r.status === 'OPEN').length;
  const platformRevenue = Math.round((bookings.reduce((sum, b) => sum + (b.finalTotal || b.estimatedTotalMax || 600), 0) + 95000) * 0.1);

  const filteredTechs = technicians.filter(t =>
    t.name.toLowerCase().includes(techSearch.toLowerCase()) ||
    t.primaryArea.toLowerCase().includes(techSearch.toLowerCase()) ||
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

  const handleApproveWarranty = (claimId: string) => {
    updateWarrantyStatus(claimId, 'APPROVED', warrantyAdminNote);
    setActiveWarrantyId(null);
  };

  const handleRejectWarranty = (claimId: string) => {
    updateWarrantyStatus(claimId, 'REJECTED', 'অভিযোগ পর্যালোচনা শেষে ওয়ারেন্টি শর্তের আওতাধীন পাওয়া যায়নি।');
    setActiveWarrantyId(null);
  };

  return (
    <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Role Switcher Bar */}
      <RoleSwitcherBar />

      {/* Admin Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
              {isBangla ? 'সুপার অ্যাডমিন কন্ট্রোল' : 'Platform Operations Hub'}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">v2.6 Live</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mt-1">
            {isBangla ? 'প্ল্যাটফর্ম প্রশাসন ও গভর্ন্যান্স সেন্টার' : 'Platform Administration & Control'}
          </h1>
          <p className="text-xs text-zinc-500">
            {isBangla ? 'Servexa ঢাকা মেট্রো কার্যক্রম পর্যবেক্ষণ, টেকনিশিয়ান ভেরিফিকেশন ও ডিসপুট নিষ্পত্তি।' : 'Monitor dispatches, manage verified technician KYC, and resolve customer complaints.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
            🟢 {isBangla ? 'সিস্টেম নরমাল' : 'Systems Normal'}
          </span>
        </div>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'মোট সার্ভিস বুকিং' : 'Total Bookings'}</div>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">{totalBookings}</div>
          <div className="text-[10px] text-emerald-600 mt-1">{isBangla ? 'সক্রিয় মেট্রো নেটওয়ার্ক' : 'Dhaka Network'}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'ভেরিফায়েড মিস্ত্রি' : 'Verified Technicians'}</div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{totalVerifiedTechs}</div>
          <div className="text-[10px] text-zinc-400 mt-1">মোট {technicians.length} জনের মধ্যে</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'বিচারাধীন অভিযোগ' : 'Open Complaints'}</div>
          <div className="text-2xl font-black text-rose-600">{openDisputes}</div>
          <div className="text-[10px] text-rose-500 font-bold mt-1">জরুরি নিষ্পত্তি প্রয়োজন</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-xs text-zinc-500 mb-1">{isBangla ? 'প্ল্যাটফর্ম কমিশন আয় (১০%)' : 'Platform Revenue (10%)'}</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">৳{platformRevenue}</div>
          <div className="text-[10px] text-zinc-400 mt-1">মোট সার্ভিস ভলিউম থেকে</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 sm:gap-6 text-xs font-bold overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{isBangla ? 'মিস্ত্রি ভেরিফিকেশন ও KYC' : 'Technician KYC & Badges'} ({technicians.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'bookings'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{isBangla ? 'সকল বুকিং ও ডিসপ্যাচ মনিটর' : 'All Bookings'} ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'disputes'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{isBangla ? 'গ্রাহক অভিযোগ ও ডিসপুট' : 'Disputes & Complaints'} ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('warranties')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'warranties'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isBangla ? 'ওয়ারেন্টি ক্লেইম অনুমোদন' : 'Warranty Approvals'} ({warranties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'border-orange-600 text-orange-600 dark:text-orange-400 font-black'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isBangla ? 'ক্যাটাগরি ও রেট কার্ড' : 'Categories & Tariffs'} ({categories.length})</span>
        </button>
      </div>

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

          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-bold text-zinc-600 dark:text-zinc-400">
                    <th className="p-4">টেকনিশিয়ান</th>
                    <th className="p-4">ফোন যাচাই</th>
                    <th className="p-4">এনআইডি (NID)</th>
                    <th className="p-4">স্কিল টেস্ট</th>
                    <th className="p-4">প্ল্যাটফর্ম ব্যাজ</th>
                    <th className="p-4 text-right">রেটিং / কাজ</th>
                    <th className="p-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredTechs.map((tech) => (
                    <tr key={tech.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={tech.avatar} alt={tech.name} className="w-10 h-10 rounded-xl object-cover border border-orange-500/20 shrink-0" />
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                              <span>{tech.name}</span>
                              {tech.platformVerified && <span className="text-blue-500 font-bold">✓</span>}
                            </div>
                            <div className="text-[11px] text-zinc-400">📍 {tech.primaryArea} · 📞 {tech.phone}</div>
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
                          <span>{tech.phoneVerified ? 'যাচাইকৃত' : 'অননুমোদিত'}</span>
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
                          <span>{tech.nidVerified ? 'NID ভেরিফায়েড' : 'পেন্ডিং'}</span>
                        </button>
                      </td>

                      {/* Skill Verified Toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => verifyTechnicianField(tech.id, 'skillVerified', !tech.skillVerified)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
                            tech.skillVerified ? 'bg-emerald-500/15 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {tech.skillVerified ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span>{tech.skillVerified ? 'দক্ষতা উত্তীর্ণ' : 'পরীক্ষা বাকি'}</span>
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
                          <span>{tech.platformVerified ? 'ভেরিফায়েড প্রো' : 'ব্যাজ নেই'}</span>
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="font-bold text-amber-500">★ {tech.rating}</div>
                        <div className="text-[10px] text-zinc-400">{tech.completedJobs} কাজ সম্পন্ন</div>
                      </td>

                      {/* Delete Action Button */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setTechToDelete(tech)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="মিস্ত্রি মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
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
              <p className="text-xs text-zinc-500">{bookings.length} total dispatches recorded</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bookingFilterStatus}
                onChange={(e) => setBookingFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="ALL">সকল স্ট্যাটাস (All)</option>
                <option value="REQUESTED">অনুরোধকৃত (Requested)</option>
                <option value="IN_PROGRESS">চলমান (In Progress)</option>
                <option value="COMPLETED">সম্পন্ন (Completed)</option>
                <option value="CANCELLED">বাতিলকৃত (Cancelled)</option>
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
                      গ্রাহক: <span className="font-bold text-zinc-800 dark:text-zinc-200">{b.customerName}</span> ({b.customerArea}) · টেকনিশিয়ান: <span className="font-bold text-zinc-800 dark:text-zinc-200">{b.technicianName}</span>
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
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-rose-600">
                      Dispute #{rep.id}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      (Booking #{rep.bookingNumber})
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    rep.status === 'OPEN' ? 'bg-rose-500/20 text-rose-600 border border-rose-500/30 animate-pulse' : 'bg-emerald-500/15 text-emerald-600'
                  }`}>
                    {rep.status}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div>
                    অভিযোগকারী: <span className="font-bold text-zinc-900 dark:text-white">{rep.reporterName}</span> ({rep.reporterRole})
                  </div>
                  <div>
                    যার বিরুদ্ধে অভিযোগ: <span className="font-bold text-zinc-900 dark:text-white">{rep.targetName}</span> ({rep.targetRole})
                  </div>
                  <div className="text-zinc-500">
                    অভিযোগের কারণ: <span className="font-semibold text-rose-600">{rep.reason}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 italic border border-zinc-200 dark:border-zinc-700">
                  "{rep.description}"
                </div>

                {rep.adminResolution ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                    ✅ নিষ্পত্তি নোট: {rep.adminResolution}
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
          <div>
            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              {isBangla ? '৭-দিনের ফ্রি সার্ভিসিং ওয়ারেন্টি ক্লেইম অনুমোদন' : 'Warranty Claims Approval Hub'}
            </h3>
            <p className="text-xs text-zinc-500">
              {isBangla ? 'গ্রাহকদের ওয়ারেন্টি ক্লেইম রিভিউ করে ফ্রি রি-ডিসপ্যাচ অনুমোদন করুন।' : 'Review 7-day re-service claims and approve warranty coverage.'}
            </p>
          </div>

          <div className="space-y-3">
            {warranties.map((w) => (
              <div key={w.id} className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-600">Claim #{w.id}</span>
                    <span className="text-xs text-zinc-500">বুকিং নং: #{w.bookingNumber}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    w.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                  }`}>
                    {w.status}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div>সার্ভিস: <span className="font-bold text-zinc-900 dark:text-white">{w.serviceName}</span></div>
                  <div>অনুরোধের তারিখ: {w.requestDate}</div>
                  <p className="p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 italic border border-zinc-200 dark:border-zinc-700">
                    "{w.issueDescription}"
                  </p>
                </div>

                {w.status === 'REQUESTED' ? (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => handleRejectWarranty(w.id)}
                      className="px-4 py-2 rounded-xl border border-zinc-300 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      {isBangla ? 'প্রত্যাখ্যান' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApproveWarranty(w.id)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {isBangla ? 'ফ্রি রি-ডিসপ্যাচ অনুমোদন' : 'Approve Free Re-dispatch'}
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-600 font-bold">
                    স্ট্যাটাস: {w.adminNote || 'অনুমোদিত'}
                  </div>
                )}
              </div>
            ))}
          </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
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
                  <span className="text-zinc-500">শুরু মূল্য:</span>
                  <span className="font-black text-emerald-600">৳{cat.startingPrice}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispute Resolution Modal */}
      {activeReportId && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
              <h3 className="font-black text-sm text-zinc-900 dark:text-white">অ্যাডমিন বিরোধ নিষ্পত্তি নোট</h3>
              <button onClick={() => setActiveReportId(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">অ্যাডমিন সিদ্ধান্ত ও সমঝোতা নোট:</label>
                <textarea
                  rows={4}
                  required
                  value={resolutionInput}
                  onChange={(e) => setResolutionInput(e.target.value)}
                  placeholder="উভয় পক্ষের সাথে কথা বলে মিস্ত্রিকে অতিরিক্ত ২০০ টাকা গ্রাহককে ফেরত দেওয়ার নির্দেশ প্রদান করা হয়েছে এবং বিষয়টি মীমাংসিত..."
                  className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveReportId(null)} className="px-4 py-2 rounded-xl border font-bold">বাতিল</button>
                <button
                  type="button"
                  onClick={() => handleResolveReportSubmit(activeReportId)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md"
                >
                  মীমাংসা নিশ্চিত করুন (Resolve)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Technician Confirmation Modal */}
      {techToDelete && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'টেকনিশিয়ান স্থায়ীভাবে ডিলিট করুন' : 'Delete Technician'}
              </h3>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              আপনি কি নিশ্চিতভাবে <span className="font-bold text-zinc-900 dark:text-white">"{techToDelete.name}"</span> কে প্ল্যাটফর্ম থেকে মুছে ফেলতে চান? এটি মুছে ফেললে তার সকল তথ্য এবং সার্ভিস কভারেজ অপসারিত হবে।
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
                  deleteTechnician(techToDelete.id);
                  setDeleteToast(`টেকনিশিয়ান ${techToDelete.name} সফলভাবে প্ল্যাটফর্ম থেকে মুছে ফেলা হয়েছে।`);
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

      {/* Delete Toast Notification */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-[3000] px-4 py-3 rounded-2xl bg-zinc-900 text-white text-xs font-bold shadow-2xl border border-zinc-700 flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{deleteToast}</span>
        </div>
      )}

    </div>
  );
};
