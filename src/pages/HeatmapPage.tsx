import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Zap,
  Info,
  CheckCircle2,
  Share2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { DHAKA_HEATMAP_ZONES, HeatmapZone } from '../data/heatmapData';
import { HeatmapWidget } from '../components/heatmap/HeatmapWidget';
import { TechnicianMap } from '../components/map/TechnicianMap';
import { useLanguage } from '../contexts/LanguageContext';

export const HeatmapPage: React.FC = () => {
  const { isBangla } = useLanguage();
  const navigate = useNavigate();

  const [pageMode, setPageMode] = useState<'NEARBY_PROS' | 'SURGE_HEATMAP'>('NEARBY_PROS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<HeatmapZone>(DHAKA_HEATMAP_ZONES[0]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TECH_GUIDE' | 'SURGE_INFO'>('OVERVIEW');

  const filteredZones = DHAKA_HEATMAP_ZONES.filter(z =>
    z.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    z.nameBn.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20">
      {/* Top Banner Hero with Animated Warm Orange Radiance */}
      <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-orange-600/10 via-amber-500/5 to-transparent pt-10 pb-8 sm:pt-14 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-4 animate-float">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{isBangla ? 'ঢাকা মেট্রো লাইভ সার্ভিস ইনটেলিজেন্স' : 'Dhaka Metro Live Service Intelligence'}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
                {isBangla ? (
                  <>
                    সার্ভিস ডিমান্ড ও <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">টেকনিশিয়ান হিটম্যাপ</span>
                  </>
                ) : (
                  <>
                    Live Service Demand & <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">Technician Heatmap</span>
                  </>
                )}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                {isBangla
                  ? 'আপনার এলাকার টেকনিশিয়ানদের রিয়েল-টাইম প্রাপ্যতা, ডিমান্ড ঘনত্ব এবং জরুরি কলের চাপ এক নজরে পর্যবেক্ষণ করুন।'
                  : 'Real-time monitoring of technician availability, surging demand density, and emergency service dispatches across all major Dhaka zones.'}
              </p>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => navigate('/book')}
                type="button"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-600/30 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isBangla ? 'তাৎক্ষণিক মিস্ত্রি বুক করুন' : 'Instant Book Technician'}</span>
              </button>

              <button
                onClick={() => navigate('/emergency')}
                type="button"
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/30 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{isBangla ? 'জরুরি হেল্পলাইন' : 'Emergency Hotline'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        
        {/* Dual Mode Switcher Tabs */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-stone-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <button
              onClick={() => setPageMode('NEARBY_PROS')}
              type="button"
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                pageMode === 'NEARBY_PROS'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{isBangla ? 'আশেপাশের মিস্ত্রি ডিসকভারি ম্যাপ' : 'Nearby Technician Discovery Map'}</span>
            </button>

            <button
              onClick={() => setPageMode('SURGE_HEATMAP')}
              type="button"
              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                pageMode === 'SURGE_HEATMAP'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>{isBangla ? 'ডিমান্ড ও আর্নিং হিটম্যাপ' : 'Metro Demand & Surge Heatmap'}</span>
            </button>
          </div>
        </div>

        {pageMode === 'NEARBY_PROS' ? (
          /* Master Nearby Technician Discovery & Service Map */
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl bg-white dark:bg-zinc-900">
            <TechnicianMap mode="standalone" height="680px" />
          </div>
        ) : (
          <>
            {/* Core Heatmap Widget with Real GPS Leaflet Map */}
            <section id="heatmap-map-section">
              <HeatmapWidget
                selectedZoneProp={selectedZone}
                onSelectZone={(z) => setSelectedZone(z)}
              />
            </section>
          </>
        )}

        {/* Insight Tabs & Zone Matrix */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs shadow-xs">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                type="button"
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'OVERVIEW'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {isBangla ? 'সকল জোনের তালিকা ও স্ট্যাটাস' : 'All Zone Matrix'}
              </button>
              <button
                onClick={() => setActiveTab('TECH_GUIDE')}
                type="button"
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'TECH_GUIDE'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {isBangla ? 'মিস্ত্রিদের জন্য বেশি আয়ের গাইড' : 'Pro Earning Hotspots'}
              </button>
              <button
                onClick={() => setActiveTab('SURGE_INFO')}
                type="button"
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'SURGE_INFO'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {isBangla ? 'সার্জ ও সময় বিশ্লেষণ' : 'Surge & Timing Guide'}
              </button>
            </div>

            {/* Zone Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBangla ? 'এলাকা খুঁজুন (মিরপুর, উত্তরা...)' : 'Search zone (Mirpur, Uttara...)'}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
          </div>

          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredZones.map(zone => (
                <div
                  key={zone.id}
                  onClick={() => {
                    setSelectedZone(zone);
                    document.getElementById('heatmap-map-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedZone.id === zone.id
                      ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/25 ring-2 ring-orange-500/30 shadow-lg'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-orange-500/50 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                        {isBangla ? 'ডিমান্ড স্কোর: ' : 'Demand: '}
                        <span className="tabular-nums font-black text-sm">{zone.demandScore}</span>/100
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        zone.status === 'HIGH_SURGE'
                          ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                          : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {zone.status === 'HIGH_SURGE' ? '🔥 সার্জ' : 'স্বাভাবিক'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-zinc-900 dark:text-white flex items-center justify-between">
                      <span>{isBangla ? zone.nameBn : zone.nameEn}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">📍 {zone.lat.toFixed(2)}, {zone.lng.toFixed(2)}</span>
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {isBangla ? zone.shortDescBn : zone.shortDescEn}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium">
                      <Users className="w-3.5 h-3.5 text-orange-500" />
                      <span>{zone.activeTechnicians} {isBangla ? 'মিস্ত্রি' : 'Pros'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{zone.avgArrivalMinutes} {isBangla ? 'মিনিট' : 'mins'}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/book?zone=${zone.id}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] transition-colors shadow-xs"
                    >
                      {isBangla ? 'ডাকুন' : 'Book'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}


          {activeTab === 'TECH_GUIDE' && (
            <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {isBangla ? 'মিস্ত্রিদের জন্য রিয়েল-টাইম আয় পরামর্শ কেন্দ্র' : 'Pro Earning & Hotspot Optimization'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isBangla
                      ? 'অ্যালগরিদমিক ডিমান্ড হিটম্যাপ অনুযায়ী কোন এলাকায় এখন কাজ বেশি এবং বাড়তি আয় সম্ভব।'
                      : 'Real-time algorithmic surge dispatch: see where customer jobs are clustering right now.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-orange-500 font-black text-xl">01</span>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mt-1">
                    {isBangla ? 'উত্তরা ও মিরপুর হাব' : 'Uttara & Mirpur Hub'}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    {isBangla
                      ? 'এই দুই জোনে বর্তমানে ১.২৫ গুণ থেকে ১.৩০ গুণ পর্যন্ত সার্জ রেট প্রযোজ্য। এসি মাস্টার ওয়াশ এবং প্লাম্বিং কলের জন্য এখনই অবস্থান নিন।'
                      : '1.25x - 1.30x surge multiplier active. Severe shortage of AC and plumbing technicians.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-amber-500 font-black text-xl">02</span>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mt-1">
                    {isBangla ? 'গুলশান ও বনানী কর্পোরেট' : 'Gulshan & Banani Prime'}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    {isBangla
                      ? 'সিসিটিভি, নেটওয়ার্ক ও জেনারেটরের ভারী কাজ চলমান। গড় প্রতি কাজে ২,৫০০+ টাকা আয়ের সম্ভাবনা।'
                      : 'Commercial networking, smart lock & generator setups averaging higher payout tickets.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-emerald-500 font-black text-xl">03</span>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mt-1">
                    {isBangla ? 'দ্রুত রেসপন্স বোনাস' : 'Fast Response Bonus'}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    {isBangla
                      ? '১৫ মিনিটের মধ্যে রিকোয়েস্ট অ্যাকসেপ্ট ও গ্রাহকের বাসায় পৌঁছালে প্ল্যাটফর্ম থেকে ইনস্ট্যান্ট ক্যাশ ইনসেন্টিভ প্রদান করা হয়।'
                      : 'Extra platform dispatch bonus for arriving at customer doorstep under 15 minutes.'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-600/10 border border-orange-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm text-orange-600 dark:text-orange-400">
                    {isBangla ? 'আপনি কি একজন দক্ষ মিস্ত্রি?' : 'Are you a verified technician?'}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {isBangla ? 'Servexa প্ল্যাটফর্মে যোগ দিয়ে প্রতিদিন ৩,০০০ থেকে ৫,০০০ টাকা পর্যন্ত আয় করুন।' : 'Join Servexa pro fleet and start accepting guaranteed local job calls.'}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/become-professional')}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shrink-0 transition-colors"
                >
                  {isBangla ? 'মিস্ত্রি হিসেবে রেজিস্টার করুন' : 'Register as Pro'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'SURGE_INFO' && (
            <div className="p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {isBangla ? 'গ্রাহকদের জন্য সার্জ রেট ও বুকিং টিপস' : 'Customer Surge Insights & Booking Tips'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isBangla
                      ? 'সার্জ চার্জ এড়িয়ে কীভাবে সেরা মূল্যে দক্ষ টেকনিশিয়ান পাবেন।'
                      : 'How to avoid peak demand pricing and get guaranteed appointments at baseline tariffs.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{isBangla ? 'সর্বোত্তম বুকিং সময় (অফ-পিক)' : 'Best Booking Times (Off-Peak)'}</span>
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                    {isBangla
                      ? 'সকাল ৯:৩০ থেকে দুপুর ১২:০০ এবং দুপুর ২:৩০ থেকে বিকাল ৪:০০ পর্যন্ত সার্ভিসের চাপ কম থাকে। এই সময়ে কোনো বাড়তি সার্জ চার্জ নেই এবং দ্রুততম সময়ে মিস্ত্রি পাওয়া যায়।'
                      : 'Between 9:30 AM - 12:00 PM and 2:30 PM - 4:00 PM, demand is steady. Zero surge multiplier and immediate dispatch.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>{isBangla ? 'পিক আওয়ার ও জরুরি কল' : 'Peak Hours & Emergency Dispatch'}</span>
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                    {isBangla
                      ? 'সন্ধ্যা ৬:০০ থেকে রাত ৯:০০ পর্যন্ত বিদ্যুৎ ও পানির জরুরি সমস্যায় সার্জ ১.১৫x থেকে ১.৩৫x হতে পারে। তবে জরুরি হেল্পলাইনে কল দিলে ১৫ মিনিটের মধ্যে টেকনিশিয়ান নিশ্চিত করা হয়।'
                      : 'Between 6:00 PM - 9:00 PM, unexpected leaks and power failures trigger a 1.15x - 1.35x emergency priority fee.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
