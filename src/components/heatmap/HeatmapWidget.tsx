import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Radio,
  Star,
  CheckCircle2,
  ChevronRight,
  Activity,
  Layers,
  Map as MapIcon
} from 'lucide-react';
import { DHAKA_HEATMAP_ZONES, HeatmapZone, INITIAL_LIVE_ACTIVITIES, LiveActivityItem } from '../../data/heatmapData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { RealLeafletMap } from './RealLeafletMap';

type HeatmapMode = 'DEMAND_INTENSITY' | 'PRO_DENSITY' | 'EMERGENCY_HOTSPOTS';

interface HeatmapWidgetProps {
  compact?: boolean;
  className?: string;
  selectedZoneProp?: HeatmapZone;
  onSelectZone?: (zone: HeatmapZone) => void;
}

export const HeatmapWidget: React.FC<HeatmapWidgetProps> = ({
  compact = false,
  className = '',
  selectedZoneProp,
  onSelectZone
}) => {
  const { isBangla } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [selectedZone, setSelectedZone] = useState<HeatmapZone>(selectedZoneProp || DHAKA_HEATMAP_ZONES[0]);
  const [activeMode, setActiveMode] = useState<HeatmapMode>('DEMAND_INTENSITY');
  const [liveActivities, setLiveActivities] = useState<LiveActivityItem[]>(INITIAL_LIVE_ACTIVITIES);

  useEffect(() => {
    if (selectedZoneProp && selectedZoneProp.id !== selectedZone.id) {
      setSelectedZone(selectedZoneProp);
    }
  }, [selectedZoneProp]);

  // Periodic simulation of new activity
  useEffect(() => {
    const activityInterval = setInterval(() => {
      const randomZone = DHAKA_HEATMAP_ZONES[Math.floor(Math.random() * DHAKA_HEATMAP_ZONES.length)];
      const categories = [
        { bn: 'এসি জেট ওয়াশ সার্ভিস', en: 'AC Jet Wash Service' },
        { bn: 'বৈদ্বুতিক শর্ট সার্কিট চেক', en: 'Electrical Short Circuit' },
        { bn: 'পাইপ লিকেজ জরুরি মেরামত', en: 'Urgent Pipe Leak Fix' },
        { bn: 'স্মার্ট লক ফিটিং', en: 'Smart Door Lock Fitting' },
        { bn: 'ফ্রিজ গ্যাস চার্জ কুলিং', en: 'Refrigerator Gas Refill' }
      ];
      const randomCat = categories[Math.floor(Math.random() * categories.length)];
      const newAct: LiveActivityItem = {
        id: `act-${Date.now()}`,
        zoneId: randomZone.id,
        zoneNameBn: randomZone.nameBn.split('(')[0].trim(),
        zoneNameEn: randomZone.nameEn.split('(')[0].trim(),
        categoryBn: randomCat.bn,
        categoryEn: randomCat.en,
        timestamp: isBangla ? 'এইমাত্র' : 'Just now',
        type: Math.random() > 0.65 ? 'EMERGENCY' : 'DISPATCHED',
        etaMinutes: Math.floor(Math.random() * 8) + 7
      };
      setLiveActivities(prev => [newAct, ...prev.slice(0, 5)]);
    }, 8500);
    return () => clearInterval(activityInterval);
  }, [isBangla]);

  const handleZoneClick = (zone: HeatmapZone) => {
    setSelectedZone(zone);
    if (onSelectZone) onSelectZone(zone);
  };

  const totalOnlinePros = DHAKA_HEATMAP_ZONES.reduce((acc, z) => acc + z.activeTechnicians, 0);
  const totalActiveRequests = DHAKA_HEATMAP_ZONES.reduce((acc, z) => acc + z.activeRequests, 0);
  const avgArrival = Math.round(
    DHAKA_HEATMAP_ZONES.reduce((acc, z) => acc + z.avgArrivalMinutes, 0) / DHAKA_HEATMAP_ZONES.length
  );

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-orange-200 dark:border-orange-500/25 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl transition-colors duration-250 ${className}`}>
      {/* Radiant Orange Ambient Backdrop */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-orange-500/10 dark:bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-amber-400/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar - Fully Adaptive Theme Colors */}
      <div className="relative z-10 px-5 sm:px-8 py-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/90 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
              {isBangla ? 'রিয়েল-টাইম লাইভ জিপিএস হিটম্যাপ' : 'Real-Time Live GPS Heatmap'}
            </span>
            <span className="text-zinc-400">·</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              {isBangla ? 'ঢাকা মেট্রো ও পার্শ্ববর্তী এলাকা' : 'Dhaka Metro Hotspots'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            {isBangla ? 'সার্ভিস ডিমান্ড ও টেকনিশিয়ান উপস্থিতি' : 'Service Demand & Technician Density'}
          </h3>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs shadow-xs">
          <button
            onClick={() => setActiveMode('DEMAND_INTENSITY')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeMode === 'DEMAND_INTENSITY'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isBangla ? 'ডিমান্ড হটস্পট' : 'Demand Heat'}</span>
          </button>
          <button
            onClick={() => setActiveMode('PRO_DENSITY')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeMode === 'PRO_DENSITY'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isBangla ? 'মিস্ত্রি ঘনত্ব' : 'Pro Density'}</span>
          </button>
          <button
            onClick={() => setActiveMode('EMERGENCY_HOTSPOTS')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeMode === 'EMERGENCY_HOTSPOTS'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isBangla ? 'জরুরি কল' : 'Emergency'}</span>
          </button>
        </div>
      </div>

      {/* Quick Macro Stats Bar - Adaptive Theme */}
      <div className="px-5 sm:px-8 py-3 bg-stone-50/50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400 text-[10px] font-medium">{isBangla ? 'অনলাইন টেকনিশিয়ান' : 'Active Technicians'}</div>
            <div className="font-extrabold text-zinc-900 dark:text-white tabular-nums">{totalOnlinePros}+ {isBangla ? 'জন সক্রিয়' : 'Ready'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400 text-[10px] font-medium">{isBangla ? 'চলমান সার্ভিস কল' : 'Active Calls'}</div>
            <div className="font-extrabold text-zinc-900 dark:text-white tabular-nums">{totalActiveRequests} {isBangla ? 'টি কাজ চলমান' : 'In Progress'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400 text-[10px] font-medium">{isBangla ? 'গড় আগমন সময়' : 'Avg Arrival ETA'}</div>
            <div className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">~{avgArrival} {isBangla ? 'মিনিট' : 'mins'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-zinc-500 dark:text-zinc-400 text-[10px] font-medium">{isBangla ? 'শীর্ষ চাহিদার জোন' : 'Top Hotspot'}</div>
            <div className="font-extrabold text-orange-600 dark:text-orange-400 truncate">উত্তরা ও মিরপুর</div>
          </div>
        </div>
      </div>

      {/* Main Heatmap Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
        {/* Left Real Leaflet Map Viewport (8 Cols) */}
        <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col justify-between overflow-hidden bg-stone-100/60 dark:bg-zinc-950/70 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 transition-colors">
          {/* Real Leaflet Map Component with Live Tiles & GPS Markers */}
          <RealLeafletMap
            selectedZone={selectedZone}
            onSelectZone={handleZoneClick}
            activeMode={activeMode}
          />

          {/* Real-Time Live Activity Ticker Bar */}
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3 overflow-hidden text-xs">
            <div className="flex items-center gap-1.5 shrink-0 font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider text-[10px]">
              <Activity className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              <span>{isBangla ? 'লাইভ ডিসপ্যাচ ফিড:' : 'Live Feed:'}</span>
            </div>
            <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-3 whitespace-nowrap">
              {liveActivities.slice(0, 3).map(act => (
                <div
                  key={act.id}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 shadow-xs"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${act.type === 'EMERGENCY' ? 'bg-rose-500' : 'bg-orange-500'}`} />
                  <span className="font-bold text-zinc-900 dark:text-white">{isBangla ? act.zoneNameBn : act.zoneNameEn}</span>
                  <span className="text-zinc-400">·</span>
                  <span className="text-zinc-600 dark:text-zinc-400">{isBangla ? act.categoryBn : act.categoryEn}</span>
                  {act.etaMinutes && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[10px]">({act.etaMinutes}m ETA)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Zone Deep-Dive Inspection Panel (4 Cols) - Fully Responsive Theme */}
        <div className="lg:col-span-4 p-5 sm:p-6 bg-stone-50/80 dark:bg-zinc-900/90 flex flex-col justify-between transition-colors">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedZone.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Zone Title Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs font-bold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isBangla ? 'নির্বাচিত এলাকা' : 'Selected Zone'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedZone.status === 'HIGH_SURGE'
                      ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {selectedZone.status === 'HIGH_SURGE'
                      ? (isBangla ? '🔥 উচ্চ চাপ (সার্জ)' : '🔥 Surge Area')
                      : (isBangla ? 'স্বাভাবিক' : 'Normal')}
                  </span>
                </div>
                <h4 className="text-xl font-black text-zinc-900 dark:text-white">
                  {isBangla ? selectedZone.nameBn : selectedZone.nameEn}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  {isBangla ? selectedZone.shortDescBn : selectedZone.shortDescEn}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 font-medium">{isBangla ? 'ডিমান্ড ইনডেক্স' : 'Demand Score'}</div>
                  <div className="text-2xl font-black text-orange-600 dark:text-orange-500 tabular-nums">
                    {selectedZone.demandScore}<span className="text-xs text-zinc-400 font-normal">/100</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedZone.demandScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5 font-medium">{isBangla ? 'কাছের মিস্ত্রি' : 'Nearby Pros'}</div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums">
                    {selectedZone.activeTechnicians} <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">{isBangla ? 'জন' : 'Pros'}</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    {isBangla ? 'গড় আগমন: ' : 'Avg ETA: '}{selectedZone.avgArrivalMinutes} {isBangla ? 'মিনিট' : 'min'}
                  </div>
                </div>
              </div>

              {/* Top Service in Demand */}
              <div className="p-3.5 rounded-2xl bg-orange-500/10 dark:bg-orange-950/20 border border-orange-500/25">
                <div className="text-[10px] uppercase tracking-wider font-black text-orange-600 dark:text-orange-400 mb-1">
                  {isBangla ? 'বর্তমানে সর্বাধিক চাহিদাসম্পন্ন কাজ' : 'Top In-Demand Category'}
                </div>
                <div className="text-sm font-black text-zinc-900 dark:text-white flex items-center justify-between">
                  <span>{isBangla ? selectedZone.topCategoryBn : selectedZone.topCategory}</span>
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-bold tabular-nums">
                    {selectedZone.activeRequests} {isBangla ? 'কল রিকোয়েস্ট' : 'Active Calls'}
                  </span>
                </div>
              </div>

              {/* Zone Dispatch Readiness Indicator */}
              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {isBangla ? 'লাইভ ডিসপ্যাচ প্রস্তুতি' : 'Live Dispatch Readiness'}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {selectedZone.activeTechnicians} {isBangla ? 'জন মিস্ত্রি প্রস্তুত' : 'Pros Ready'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {isBangla
                    ? 'এই এলাকায় কল দেওয়ার সাথে সাথে নিকটতম ভেরিফায়েড টেকনিশিয়ানকে অ্যাসাইন করা হবে।'
                    : 'Dispatch requests in this zone are automatically assigned to nearest verified pros.'}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <button
              onClick={() => navigate(`/book?zone=${selectedZone.id}&service=${selectedZone.topCategory}`)}
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <span>{isBangla ? `${selectedZone.nameBn.split('(')[0].trim()} জোনে মিস্ত্রি ডাকুন` : `Book Pro in ${selectedZone.nameEn.split('(')[0].trim()}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/professionals')}
              type="button"
              className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-bold text-xs border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isBangla ? 'সকল প্রফেশনাল তালিকা দেখুন' : 'Explore All Technicians in Dhaka'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
