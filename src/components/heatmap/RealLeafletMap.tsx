import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DHAKA_HEATMAP_ZONES, HeatmapZone, TechnicianLocation } from '../../data/heatmapData';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toBengaliNumber } from '../../utils/geoUtils';
import {
  Layers,
  Navigation,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Phone,
  Flame,
  Users,
  AlertTriangle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type MapTileLayerType = 'VOYAGER' | 'STREET' | 'DARK' | 'SATELLITE';

interface RealLeafletMapProps {
  selectedZone: HeatmapZone;
  onSelectZone: (zone: HeatmapZone) => void;
  activeMode: 'DEMAND_INTENSITY' | 'PRO_DENSITY' | 'EMERGENCY_HOTSPOTS';
  className?: string;
}

const TILE_CONFIGS: Record<
  MapTileLayerType,
  { url: string; attribution: string; subdomains?: string; labelBn: string; labelEn: string }
> = {
  VOYAGER: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    labelBn: 'ওপেনস্ট্রিটম্যাপ (স্ট্রিট)',
    labelEn: 'OpenStreetMap'
  },
  STREET: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    labelBn: 'ওপেনস্ট্রিটম্যাপ (বাংলাদেশ)',
    labelEn: 'OpenStreetMap Street'
  },
  DARK: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; OpenStreetMap',
    labelBn: 'ডার্ক নাইট মোড',
    labelEn: 'Dark Matter'
  },
  SATELLITE: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; OpenStreetMap',
    labelBn: 'স্যাটেলাইট ভিউ',
    labelEn: 'Satellite Imagery'
  }
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

  const isDark = theme === 'dark';
  const [manualLayerType, setManualLayerType] = useState<MapTileLayerType | null>(null);
  const mapType: MapTileLayerType = manualLayerType ?? (isDark ? 'DARK' : 'STREET');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [selectedTechState, setSelectedTechState] = useState<{ zoneId: string; tech: TechnicianLocation } | null>(null);
  const selectedTech =
    selectedTechState && selectedTechState.zoneId === selectedZone?.id ? selectedTechState.tech : null;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectZoneRef = useRef(onSelectZone);
  onSelectZoneRef.current = onSelectZone;

  // 1. Mount Leaflet map ONCE (no moveend->setState loop!)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const initialLat = Number.isFinite(selectedZone?.lat) ? selectedZone.lat : 23.7806;
    const initialLng = Number.isFinite(selectedZone?.lng) ? selectedZone.lng : 90.398;

    const map = L.map(container, {
      center: [initialLat, initialLng],
      zoom: 12,
      minZoom: 6,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true
    });

    map.attributionControl.setPrefix(false);

    const cfg = TILE_CONFIGS[mapType];
    const initialTile = L.tileLayer(cfg.url, {
      maxZoom: 19,
      attribution: cfg.attribution,
      ...(cfg.subdomains ? { subdomains: cfg.subdomains } : {})
    }).addTo(map);

    const overlayLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    tileLayerRef.current = initialTile;
    overlayLayerRef.current = overlayLayer;
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Ensure crisp tiles after CSS transitions or tab reveal
    const invalidateTimer = window.setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 120);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ animate: false });
        }
      });
      observer.observe(container);
    }

    return () => {
      window.clearTimeout(invalidateTimer);
      observer?.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      overlayLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // 2. Swap Tile Layer dynamically without recreating the map or panning
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_CONFIGS[mapType];
    const nextTile = L.tileLayer(cfg.url, {
      maxZoom: 19,
      attribution: cfg.attribution,
      ...(cfg.subdomains ? { subdomains: cfg.subdomains } : {})
    }).addTo(map);

    tileLayerRef.current = nextTile;
  }, [mapType]);

  // 3. Smoothly pan ONLY when selectedZone.id changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedZone) return;
    if (!Number.isFinite(selectedZone.lat) || !Number.isFinite(selectedZone.lng)) return;

    map.flyTo([selectedZone.lat, selectedZone.lng], 13, {
      duration: 0.65,
      easeLinearity: 0.25
    });
  }, [selectedZone?.id]);

  // 4. Render Heatmap Circles, Zone Pills & Nearby Tech Markers (pure DOM layer update, zero setView)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const overlayLayer = overlayLayerRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !overlayLayer || !markersLayer) return;

    overlayLayer.clearLayers();
    markersLayer.clearLayers();

    DHAKA_HEATMAP_ZONES.forEach((zone) => {
      if (!Number.isFinite(zone.lat) || !Number.isFinite(zone.lng)) return;

      const isSelected = selectedZone?.id === zone.id;
      const intensityRatio = Math.min(1, Math.max(0.35, zone.demandScore / 100));

      let circleColor = '#f97316';
      let circleRadius = 1150 + intensityRatio * 650;
      if (activeMode === 'PRO_DENSITY') {
        circleColor = '#10b981';
        circleRadius = 1000 + Math.min(40, zone.activeTechnicians) * 28;
      } else if (activeMode === 'EMERGENCY_HOTSPOTS') {
        circleColor = zone.emergencyCallsToday >= 16 ? '#e11d48' : '#f59e0b';
        circleRadius = 950 + Math.min(30, zone.emergencyCallsToday) * 42;
      } else if (zone.status === 'HIGH_SURGE') {
        circleColor = '#ea580c';
      }

      // Outer soft heat glow circle
      L.circle([zone.lat, zone.lng], {
        radius: circleRadius * (isSelected ? 1.2 : 1),
        color: circleColor,
        weight: isSelected ? 2 : 1,
        opacity: isSelected ? 0.75 : 0.35,
        fillColor: circleColor,
        fillOpacity: isSelected ? 0.28 : 0.16,
        interactive: false
      }).addTo(overlayLayer);

      // Inner dense core circle
      L.circle([zone.lat, zone.lng], {
        radius: circleRadius * 0.48,
        color: 'transparent',
        weight: 0,
        fillColor: circleColor,
        fillOpacity: isSelected ? 0.36 : 0.24,
        interactive: false
      }).addTo(overlayLayer);

      const labelText = isBangla
        ? zone.nameBn.split('(')[0].trim()
        : zone.nameEn.split('(')[0].trim();

      const scoreBadge =
        activeMode === 'DEMAND_INTENSITY'
          ? `${isBangla ? toBengaliNumber(zone.demandScore) : zone.demandScore}%`
          : activeMode === 'PRO_DENSITY'
          ? `${isBangla ? toBengaliNumber(zone.activeTechnicians) : zone.activeTechnicians} ${isBangla ? 'জন' : 'pros'}`
          : `${isBangla ? toBengaliNumber(zone.emergencyCallsToday) : zone.emergencyCallsToday} ${isBangla ? 'কল' : 'calls'}`;

      const bgHex = isSelected
        ? activeMode === 'PRO_DENSITY'
          ? '#059669'
          : activeMode === 'EMERGENCY_HOTSPOTS'
          ? '#be123c'
          : '#c2410c'
        : activeMode === 'PRO_DENSITY'
        ? '#10b981'
        : activeMode === 'EMERGENCY_HOTSPOTS'
        ? '#e11d48'
        : '#f97316';

      const zoneIcon = L.divIcon({
        className: 'custom-leaflet-marker-clean',
        html: `
          <div style="display:inline-flex;align-items:center;gap:6px;background:${bgHex};color:#ffffff;padding:5px 11px;border-radius:9999px;font-size:11px;font-weight:800;box-shadow:0 8px 18px rgba(0,0,0,0.32);border:2px solid ${isSelected ? '#fef08a' : '#ffffff'};white-space:nowrap;cursor:pointer;transform:translate(-50%,-50%);transition:transform 0.15s ease;">
            <span style="width:7px;height:7px;border-radius:50%;background:${isSelected ? '#fef08a' : '#ffffff'};flex-shrink:0;"></span>
            <span>${labelText}</span>
            <span style="background:rgba(0,0,0,0.32);padding:1px 6px;border-radius:9999px;font-size:10px;font-weight:700;">${scoreBadge}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const zoneMarker = L.marker([zone.lat, zone.lng], {
        icon: zoneIcon,
        zIndexOffset: isSelected ? 500 : 100
      });

      zoneMarker.on('click', () => {
        onSelectZoneRef.current(zone);
      });

      zoneMarker.addTo(markersLayer);
    });

    // Nearby Technicians inside currently selected zone
    if (selectedZone?.nearbyTechs?.length) {
      selectedZone.nearbyTechs.forEach((tech) => {
        if (!Number.isFinite(tech.lat) || !Number.isFinite(tech.lng)) return;

        const isActiveTech = selectedTech?.id === tech.id;
        const techIcon = L.divIcon({
          className: 'custom-leaflet-marker-clean',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-85%);cursor:pointer;">
              <div style="position:relative;width:34px;height:34px;border-radius:50%;background:${isActiveTech ? '#ea580c' : '#10b981'};color:#ffffff;border:2.5px solid #ffffff;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 6px 14px rgba(0,0,0,0.35);">
                🛠️
                <span style="position:absolute;top:-2px;right:-2px;width:9px;height:9px;border-radius:50%;background:#22c55e;border:1.5px solid #ffffff;"></span>
              </div>
              <span style="margin-top:2px;background:#09090b;color:#ffffff;font-size:9px;font-weight:800;padding:1px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                ~${isBangla ? toBengaliNumber(tech.etaMins) : tech.etaMins}m
              </span>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const techMarker = L.marker([tech.lat, tech.lng], {
          icon: techIcon,
          zIndexOffset: 650
        });
        techMarker.on('click', () => setSelectedTechState({ zoneId: selectedZone.id, tech }));
        techMarker.addTo(markersLayer);
      });
    }
  }, [selectedZone, activeMode, isBangla, selectedTech?.id]);

  return (
    <div
      className={`relative w-full h-[460px] sm:h-[520px] lg:h-[580px] rounded-3xl overflow-hidden border border-orange-500/20 shadow-inner bg-stone-200 dark:bg-zinc-900 select-none ${className}`}
    >
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Top Left OSM Badge */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex items-center gap-2 text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping shrink-0" />
        <span className="font-bold text-zinc-900 dark:text-zinc-100">
          {isBangla ? 'ওপেনস্ট্রিটম্যাপ লাইভ হিটম্যাপ' : 'OpenStreetMap Live Heatmap'}
        </span>
      </div>

      {/* Top Right Layer Switcher & Zoom Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col items-end gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu((v) => !v)}
            className="px-2.5 py-2 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-lg hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
            title={isBangla ? 'ম্যাপ লেয়ার পরিবর্তন করুন' : 'Change Map Layer'}
          >
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline">
              {isBangla ? TILE_CONFIGS[mapType].labelBn : TILE_CONFIGS[mapType].labelEn}
            </span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1.5 space-y-1 z-[450]">
              {(Object.keys(TILE_CONFIGS) as MapTileLayerType[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setManualLayerType(key);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    mapType === key
                      ? 'bg-orange-600 text-white'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {isBangla ? TILE_CONFIGS[key].labelBn : TILE_CONFIGS[key].labelEn}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col bg-white/95 dark:bg-zinc-900/95 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            type="button"
            aria-label="Zoom in"
            className="p-2 text-zinc-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            type="button"
            aria-label="Zoom out"
            className="p-2 text-zinc-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.flyTo([23.7806, 90.398], 12, { duration: 0.6 })}
            type="button"
            aria-label="Recenter Dhaka"
            title={isBangla ? 'ঢাকা কেন্দ্রে ফিরুন' : 'Recenter Dhaka'}
            className="p-2 text-zinc-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Left Compact Mode Legend */}
      <div className="hidden sm:flex absolute bottom-3 left-3 z-[400] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md items-center gap-3 text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
        {activeMode === 'DEMAND_INTENSITY' && (
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            {isBangla ? 'বৃত্ত যত বড় ও গাঢ় = সার্ভিস চাহিদা বেশি' : 'Larger circle = Higher service demand'}
          </span>
        )}
        {activeMode === 'PRO_DENSITY' && (
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            {isBangla ? 'সবুজ বৃত্ত = নিকটবর্তী সক্রিয় টেকনিশিয়ান সংখ্যা' : 'Green radius = Active pros in zone'}
          </span>
        )}
        {activeMode === 'EMERGENCY_HOTSPOTS' && (
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            {isBangla ? 'লাল জোন = আজকের জরুরি সার্ভিস হটস্পট' : 'Red pulse = Urgent emergency call hotspot'}
          </span>
        )}
      </div>

      {/* Selected Nearby Technician Card Popup */}
      {selectedTech && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[450] bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md p-4 rounded-2xl border border-orange-500/35 shadow-2xl animate-in slide-in-from-bottom-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h5 className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>{selectedTech.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </h5>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isBangla ? selectedTech.tradeBn : selectedTech.tradeEn}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTechState(null)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs py-2 border-y border-zinc-100 dark:border-zinc-800 my-2">
            <span className="text-amber-500 font-bold">
              ★ {isBangla ? toBengaliNumber(selectedTech.rating) : selectedTech.rating}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              ~{isBangla ? `${toBengaliNumber(selectedTech.etaMins)} মিনিটে পৌঁছাবেন` : `${selectedTech.etaMins} mins ETA`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                navigate(`/book?zone=${selectedZone.id}&tech=${encodeURIComponent(selectedTech.name)}`)
              }
              type="button"
              className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors shadow-md text-center cursor-pointer"
            >
              {isBangla ? 'এখনই বুক করুন' : 'Book Instantly'}
            </button>
            <a
              href={`tel:${selectedTech.phone}`}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-500/15 hover:text-emerald-600"
              title={isBangla ? 'কল করুন' : 'Call'}
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
