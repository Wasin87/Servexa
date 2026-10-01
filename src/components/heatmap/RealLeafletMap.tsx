import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { DHAKA_HEATMAP_ZONES, HeatmapZone, TechnicianLocation } from '../../data/heatmapData';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Layers, Navigation, ZoomIn, ZoomOut, ShieldCheck, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type MapTileLayerType = 'THEMED' | 'SATELLITE' | 'TERRAIN';

interface RealLeafletMapProps {
  selectedZone: HeatmapZone;
  onSelectZone: (zone: HeatmapZone) => void;
  activeMode: 'DEMAND_INTENSITY' | 'PRO_DENSITY' | 'EMERGENCY_HOTSPOTS';
  className?: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_DEMO_KEY || "AIzaSyCeuvMJN64ZFTFVf-Vc9IXfkpFiGi3F5l8";

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1e1e24" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e1e24" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a93" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#fb923c" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#fb923c" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#182c25" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#34d399" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d34" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a1f" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#a1a1aa" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ea580c" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1a1a1f" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1524" }] },
];

// Helper component to control map panning and zooming declaratively
const MapController = ({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
};

export const RealLeafletMap: React.FC<RealLeafletMapProps> = ({
  selectedZone,
  onSelectZone,
  activeMode,
  className = ''
}) => {
  const { theme } = useTheme();
  const { isBangla } = useLanguage();
  const navigate = useNavigate();

  const [mapType, setMapType] = useState<MapTileLayerType>('THEMED');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [selectedTech, setSelectedTech] = useState<TechnicianLocation | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 23.7806, lng: 90.3980 });

  const isDark = theme === 'dark';

  // Smooth pan when selectedZone changes
  useEffect(() => {
    if (selectedZone) {
      setMapCenter({ lat: selectedZone.lat, lng: selectedZone.lng });
      setZoomLevel(13);
    }
  }, [selectedZone.id]);

  // Determine colors based on mode and zone
  const getZoneColors = (zone: HeatmapZone) => {
    if (activeMode === 'DEMAND_INTENSITY') {
      if (zone.demandScore >= 90) return { hex: '#ea580c', borderHex: '#f97316', textHex: '#ffffff', badgeBg: '#ea580c' };
      if (zone.demandScore >= 80) return { hex: '#f97316', borderHex: '#fb923c', textHex: '#ffffff', badgeBg: '#f97316' };
      return { hex: '#f59e0b', borderHex: '#fbbf24', textHex: '#ffffff', badgeBg: '#f59e0b' };
    }
    if (activeMode === 'PRO_DENSITY') {
      if (zone.activeTechnicians >= 25) return { hex: '#10b981', borderHex: '#34d399', textHex: '#ffffff', badgeBg: '#10b981' };
      if (zone.activeTechnicians >= 18) return { hex: '#f97316', borderHex: '#fb923c', textHex: '#ffffff', badgeBg: '#f97316' };
      return { hex: '#6366f1', borderHex: '#818cf8', textHex: '#ffffff', badgeBg: '#6366f1' };
    }
    // EMERGENCY_HOTSPOTS
    if (zone.emergencyCallsToday >= 18) return { hex: '#e11d48', borderHex: '#f43f5e', textHex: '#ffffff', badgeBg: '#e11d48' };
    if (zone.emergencyCallsToday >= 12) return { hex: '#f97316', borderHex: '#fb923c', textHex: '#ffffff', badgeBg: '#f97316' };
    return { hex: '#f59e0b', borderHex: '#fcd34d', textHex: '#ffffff', badgeBg: '#f59e0b' };
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 1, 10));
  const handleRecenter = () => {
    setMapCenter({ lat: 23.7806, lng: 90.3980 });
    setZoomLevel(12);
  };

  const currentMapTypeId = mapType === 'SATELLITE' ? 'hybrid' : mapType === 'TERRAIN' ? 'terrain' : 'roadmap';

  return (
    <div className={`relative w-full h-[460px] sm:h-[520px] lg:h-[580px] rounded-2xl overflow-hidden border border-orange-500/20 shadow-inner select-none ${className}`}>
      
      {/* Real Google Map Loader and Node */}
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <div className="w-full h-full absolute inset-0 z-0">
          <Map
            mapId="DEMO_MAP_ID"
            style={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={zoomLevel}
            onCenterChanged={(e) => {
              if (e.detail.center) {
                setMapCenter(e.detail.center);
              }
            }}
            onZoomChanged={(e) => {
              if (typeof e.detail.zoom === 'number') {
                setZoomLevel(e.detail.zoom);
              }
            }}
            gestureHandling="greedy"
            disableDefaultUI
            mapTypeId={currentMapTypeId}
            styles={isDark && mapType === 'THEMED' ? DARK_MAP_STYLE : []}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            <MapController center={mapCenter} zoom={zoomLevel} />

            {/* Render Dhaka Heat Zones */}
            {DHAKA_HEATMAP_ZONES.map(zone => {
              const colors = getZoneColors(zone);
              const isSelected = selectedZone.id === zone.id;
              const labelText = isBangla ? zone.nameBn.split('(')[0].trim() : zone.nameEn.split('(')[0].trim();
              const scoreBadge = activeMode === 'DEMAND_INTENSITY'
                ? `${zone.demandScore}%`
                : activeMode === 'PRO_DENSITY'
                ? `${zone.activeTechnicians} pros`
                : `${zone.emergencyCallsToday} calls`;

              return (
                <AdvancedMarker
                  key={zone.id}
                  position={{ lat: zone.lat, lng: zone.lng }}
                  onClick={() => onSelectZone(zone)}
                >
                  <div className="flex items-center justify-center relative cursor-pointer group" style={{ transform: 'translate(0, 0)' }}>
                    {/* Concentrated pulsing aura of heat */}
                    <div 
                      className="absolute rounded-full animate-pulse shrink-0" 
                      style={{ 
                        width: isSelected ? '140px' : '90px', 
                        height: isSelected ? '140px' : '90px',
                        backgroundColor: colors.hex, 
                        opacity: isSelected ? 0.35 : 0.22,
                        transform: 'translate(-50%, -50%)',
                        transition: 'all 0.3s ease-out'
                      }} 
                    />
                    <div 
                      className="absolute rounded-full shrink-0" 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        backgroundColor: colors.hex, 
                        opacity: isSelected ? 0.65 : 0.45,
                        transform: 'translate(-50%, -50%)'
                      }} 
                    />

                    {/* Zone Info Label Marker */}
                    <div className="absolute flex flex-col items-center z-10" style={{ transform: 'translate(-50%, -100%)', top: '-16px' }}>
                      <div 
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black shadow-xl ring-2 ring-white whitespace-nowrap transition-transform duration-300 ${
                          isSelected ? 'scale-110 ring-orange-500 ring-offset-1' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: colors.hex, color: colors.textHex }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full bg-white ${isSelected ? 'animate-ping' : ''}`} />
                        <span>{labelText}</span>
                        <span className="bg-black/35 px-1.5 py-0.5 rounded-full text-[9px] font-mono">{scoreBadge}</span>
                      </div>
                      {/* Spike */}
                      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px]" style={{ borderTopColor: colors.hex }} />
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Render Live Technicians for selected zone */}
            {selectedZone && selectedZone.nearbyTechs && selectedZone.nearbyTechs.map(tech => {
              const isAvail = tech.available;

              return (
                <AdvancedMarker
                  key={tech.id}
                  position={{ lat: tech.lat, lng: tech.lng }}
                  onClick={() => setSelectedTech(tech)}
                >
                  <div className="flex items-center justify-center cursor-pointer" style={{ transform: 'translate(-50%, -50%)' }}>
                    <div className={`relative w-8 h-8 rounded-full shadow-lg border-2 ${
                      isAvail
                        ? 'bg-emerald-600 border-white ring-2 ring-emerald-400'
                        : 'bg-zinc-700 border-zinc-300'
                    } flex items-center justify-center text-white transition-all hover:scale-125`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                      </svg>
                      {isAvail && <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white animate-pulse" />}
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}
          </Map>
        </div>
      </APIProvider>

      {/* Real-time Status Overlay Badge (Top Left) */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center gap-2 pointer-events-auto text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
          </span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {isBangla ? 'রিয়েল-টাইম জিপিএস গুগল ম্যাপ' : 'Live GPS Google Map'}
          </span>
          <span className="text-zinc-400">·</span>
          <span className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
            {isBangla ? '১২টি হটস্পট জোন' : '12 Hotspot Zones'}
          </span>
        </div>
      </div>

      {/* Floating Map Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
        {/* Layer Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            type="button"
            title={isBangla ? 'ম্যাপ লেয়ার পরিবর্তন' : 'Switch Map Layer'}
            className="p-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all cursor-pointer active:scale-95"
          >
            <Layers className="w-4 h-4" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-1.5 z-20 text-xs animate-in fade-in">
              <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {isBangla ? 'ম্যাপ স্টাইল' : 'Map Tiles'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMapType('THEMED');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-orange-50 dark:hover:bg-zinc-800 transition-colors ${
                  mapType === 'THEMED' ? 'font-bold text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>🗺️ {isDark ? 'ডার্ক ম্যাটার' : 'লাইট রোডম্যাপ'}</span>
                {mapType === 'THEMED' && <span>✓</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMapType('SATELLITE');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-orange-50 dark:hover:bg-zinc-800 transition-colors ${
                  mapType === 'SATELLITE' ? 'font-bold text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>🛰️ স্যাটেলাইট ইমেজারি</span>
                {mapType === 'SATELLITE' && <span>✓</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMapType('TERRAIN');
                  setShowLayerMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-orange-50 dark:hover:bg-zinc-800 transition-colors ${
                  mapType === 'TERRAIN' ? 'font-bold text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <span>⛰️ টেরাইন ম্যাপ</span>
                {mapType === 'TERRAIN' && <span>✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Zoom & Recenter Stack */}
        <div className="flex flex-col bg-white/95 dark:bg-zinc-900/95 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
          <button
            onClick={handleZoomIn}
            type="button"
            className="p-2 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            type="button"
            className="p-2 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleRecenter}
            type="button"
            className="p-2 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isBangla ? 'ঢাকা মেট্রো সেন্টারে ফিরুন' : 'Recenter Dhaka'}
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Technician Quick Card when a tech marker is clicked */}
      {selectedTech && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-20 bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md p-4 rounded-2xl border border-orange-500/30 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold flex items-center justify-center shadow-md">
                {selectedTech.name.charAt(0)}
              </div>
              <div>
                <h5 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>{selectedTech.name}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                </h5>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isBangla ? selectedTech.tradeBn : selectedTech.tradeEn}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTech(null)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold p-1"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between text-xs py-2 border-y border-zinc-100 dark:border-zinc-800 my-2">
            <span className="text-amber-500 font-bold flex items-center gap-1">
              ★ {selectedTech.rating} / 5.0
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              ⚡ ~{selectedTech.etaMins} {isBangla ? 'মিনিটে আগমন' : 'mins ETA'}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => navigate(`/book?zone=${selectedZone.id}&tech=${encodeURIComponent(selectedTech.name)}`)}
              type="button"
              className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors shadow-md shadow-orange-600/20 text-center"
            >
              {isBangla ? 'এখনই বুক করুন' : 'Book Instantly'}
            </button>
            <a
              href={`tel:${selectedTech.phone}`}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Call"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Bottom Map Footnote */}
      <div className="absolute bottom-2 left-3 z-10 hidden sm:flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 pointer-events-none">
        <span>📍 {isBangla ? 'জোনে ক্লিক করে জুম করুন ও লাইভ টেকনিশিয়ান দেখুন' : 'Click any zone to zoom in & view live dispatchers'}</span>
      </div>
    </div>
  );
};
