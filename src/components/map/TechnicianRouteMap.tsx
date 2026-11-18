import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Navigation, Maximize2, X, Clock, Route } from 'lucide-react';
import { Booking, Technician } from '../../types';
import {
  buildFallbackDhakaRoute,
  formatDistanceExact,
  formatDurationMinutes,
  resolveCustomerCoordinates
} from '../../utils/geoUtils';

export interface TechnicianRouteMapProps {
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  originLabel?: string;
  destLabel?: string;
  travelMode?: 'driving' | 'walking' | 'bicycling';
  height?: string;
  className?: string;
  booking?: Booking;
  technician?: Technician;
  compact?: boolean;
  onExpandModal?: () => void;
  onCloseModal?: () => void;
  onRouteComputed?: (summary: {
    distanceMeters: number;
    durationMinutes: number;
    source: string;
    steps: { instruction: string; distanceText: string; durationText: string; directionKey: string }[];
  }) => void;
}

export const TechnicianRouteMap: React.FC<TechnicianRouteMapProps> = ({
  originLat,
  originLng,
  destLat,
  destLng,
  originLabel,
  destLabel,
  travelMode = 'driving',
  height = '320px',
  className = '',
  booking,
  technician,
  compact = false,
  onExpandModal,
  onCloseModal,
  onRouteComputed
}) => {
  const { isBangla } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const onRouteComputedRef = useRef(onRouteComputed);
  onRouteComputedRef.current = onRouteComputed;

  // Safely resolve finite coordinates
  const fallbackCustomer = booking
    ? resolveCustomerCoordinates(booking.customerArea, booking.customerAddress, booking.id)
    : { lat: 23.7461, lng: 90.3742, matchedAreaBn: 'ধানমন্ডি', matchedAreaEn: 'Dhanmondi' };

  const rawLat1 = Number(originLat ?? technician?.latitude ?? 23.7806);
  const rawLng1 = Number(originLng ?? technician?.longitude ?? 90.398);
  const rawLat2 = Number(destLat ?? booking?.customerLat ?? fallbackCustomer.lat);
  const rawLng2 = Number(destLng ?? booking?.customerLng ?? fallbackCustomer.lng);

  const lat1 = Number.isFinite(rawLat1) ? rawLat1 : 23.7806;
  const lng1 = Number.isFinite(rawLng1) ? rawLng1 : 90.398;
  const lat2 = Number.isFinite(rawLat2) ? rawLat2 : 23.7461;
  const lng2 = Number.isFinite(rawLng2) ? rawLng2 : 90.3742;

  const resolvedOriginLabel =
    originLabel || technician?.name || (isBangla ? 'টেকনিশিয়ান অবস্থান' : 'Technician Location');
  const resolvedDestLabel =
    destLabel || booking?.customerAddress || booking?.customerArea || (isBangla ? 'গ্রাহকের ঠিকানা' : 'Customer Destination');

  const [routeSummary, setRouteSummary] = useState<{
    distanceMeters: number;
    durationMinutes: number;
    firstStep: string;
    isLiveOsm: boolean;
  }>({
    distanceMeters: 0,
    durationMinutes: 0,
    firstStep: '',
    isLiveOsm: false
  });

  // 1. Mount Leaflet map ONCE
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const map = L.map(container, {
      center: [(lat1 + lat2) / 2, (lng1 + lng2) / 2],
      zoom: 13,
      minZoom: 6,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true
    });
    map.attributionControl.setPrefix(false);

    const tileUrl = isDark
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tile = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: isDark ? '&copy; Esri &copy; OpenStreetMap' : '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const routeLayer = L.layerGroup().addTo(map);

    tileLayerRef.current = tile;
    routeLayerRef.current = routeLayer;
    mapInstanceRef.current = map;

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
      routeLayerRef.current = null;
    };
  }, []);

  // 2. Sync tile theme dynamically without recreating map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const nextTile = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: isDark ? '&copy; OpenStreetMap &copy; CARTO' : '&copy; OpenStreetMap contributors',
      ...(isDark ? { subdomains: 'abcd' } : {})
    }).addTo(map);

    tileLayerRef.current = nextTile;
  }, [isDark]);

  // 3. Draw Route Geometry + Fetch OSRM OSM Live Shortest Path
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    const controller = new AbortController();

    const drawRoute = (
      coords: [number, number][],
      distanceMeters: number,
      durationMinutes: number,
      source: string,
      steps: { instruction: string; distanceText: string; durationText: string; directionKey: string }[]
    ) => {
      routeLayer.clearLayers();

      // Glowing outer line + inner road stroke
      L.polyline(coords, {
        color: '#c2410c',
        weight: 8,
        opacity: 0.28,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(routeLayer);

      L.polyline(coords, {
        color: '#f97316',
        weight: 4.5,
        opacity: 0.95,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(routeLayer);

      const originIcon = L.divIcon({
        className: 'custom-leaflet-marker-clean',
        html: `<div style="background:#10b981;color:#ffffff;width:32px;height:32px;border-radius:50%;border:2.5px solid #ffffff;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 6px 14px rgba(0,0,0,0.35);transform:translate(-50%,-50%);">🛵</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const destIcon = L.divIcon({
        className: 'custom-leaflet-marker-clean',
        html: `<div style="background:#ea580c;color:#ffffff;width:32px;height:32px;border-radius:50%;border:2.5px solid #ffffff;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 6px 14px rgba(0,0,0,0.35);transform:translate(-50%,-50%);">📍</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      L.marker([lat1, lng1], { icon: originIcon }).bindPopup(resolvedOriginLabel).addTo(routeLayer);
      L.marker([lat2, lng2], { icon: destIcon }).bindPopup(resolvedDestLabel).addTo(routeLayer);

      const bounds = L.latLngBounds(coords);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [44, 44], maxZoom: 15, animate: false });
      }

      setRouteSummary({
        distanceMeters,
        durationMinutes,
        firstStep: steps[0]?.instruction || resolvedDestLabel,
        isLiveOsm: source === 'osrm_osm'
      });

      if (onRouteComputedRef.current) {
        onRouteComputedRef.current({
          distanceMeters,
          durationMinutes,
          source,
          steps
        });
      }
    };

    // Instant arterial route baseline first so UI never flashes blank
    const fallback = buildFallbackDhakaRoute(
      { lat: lat1, lng: lng1 },
      { lat: lat2, lng: lng2 },
      booking?.customerArea || (isBangla ? 'গন্তব্য এলাকা' : 'Destination Area'),
      resolvedDestLabel,
      travelMode === 'walking' ? 'WALKING' : travelMode === 'bicycling' ? 'TWO_WHEELER' : 'DRIVING',
      isBangla
    );

    drawRoute(
      fallback.path.map((p) => [p.lat, p.lng]),
      fallback.distanceMeters,
      fallback.durationMinutes,
      'dhaka_arterial_fallback',
      fallback.steps
    );

    // Fetch real OpenStreetMap road polyline via OSRM
    const profile = travelMode === 'walking' ? 'foot' : travelMode === 'bicycling' ? 'bike' : 'driving';
    const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson&steps=true`;

    const timeoutId = window.setTimeout(() => controller.abort(), 4500);

    fetch(osrmUrl, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || data.code !== 'Ok' || !Array.isArray(data.routes) || !data.routes[0]) return;
        const route = data.routes[0];
        const rawCoords = route.geometry?.coordinates;
        if (!Array.isArray(rawCoords) || rawCoords.length < 2) return;

        const osmCoords: [number, number][] = rawCoords
          .filter((pair: unknown): pair is [number, number] => Array.isArray(pair) && pair.length >= 2)
          .map(([lng, lat]) => [lat, lng]);

        if (osmCoords.length < 2) return;

        const distanceMeters = Math.round(route.distance || fallback.distanceMeters);
        const rawDurMins = Math.max(2, Math.round((route.duration || fallback.durationMinutes * 60) / 60));

        const legSteps = Array.isArray(route.legs?.[0]?.steps)
          ? route.legs[0].steps.slice(0, 6).map((s: any) => ({
              instruction:
                s.name && String(s.name).trim()
                  ? isBangla
                    ? `${s.name} সড়ক ধরে চলুন`
                    : `Continue along ${s.name}`
                  : isBangla
                  ? 'নির্দেশিত সড়ক ধরে এগিয়ে যান'
                  : 'Proceed along route',
              distanceText: formatDistanceExact(s.distance || 200, isBangla),
              durationText: formatDurationMinutes(Math.max(1, Math.round((s.duration || 60) / 60)), isBangla),
              directionKey: s.maneuver?.modifier?.includes('left')
                ? 'left'
                : s.maneuver?.modifier?.includes('right')
                ? 'right'
                : 'straight'
            }))
          : fallback.steps;

        drawRoute(osmCoords, distanceMeters, rawDurMins, 'osrm_osm', legSteps);
      })
      .catch(() => {
        // Fallback already rendered cleanly
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [lat1, lng1, lat2, lng2, resolvedOriginLabel, resolvedDestLabel, travelMode, isBangla, booking?.customerArea]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md bg-stone-200 dark:bg-zinc-900 ${className}`}
      style={{ height }}
    >
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* Top HUD Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[400] flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-zinc-800 dark:text-zinc-200 min-w-0">
          <Navigation className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span className="truncate">
            {isBangla ? 'ওপেনস্ট্রিটম্যাপ রুট' : 'OSM Live Route'}
          </span>
          {routeSummary.distanceMeters > 0 && (
            <>
              <span className="text-zinc-400">·</span>
              <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 shrink-0">
                <Route className="w-3 h-3" />
                {formatDistanceExact(routeSummary.distanceMeters, isBangla)}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Clock className="w-3 h-3" />
                ~{formatDurationMinutes(routeSummary.durationMinutes, isBangla)}
              </span>
            </>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
          {onExpandModal && (
            <button
              onClick={onExpandModal}
              type="button"
              className="p-2 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 shadow-lg text-zinc-700 dark:text-zinc-200 hover:text-orange-500 cursor-pointer"
              title={isBangla ? 'বড় করে দেখুন' : 'Expand Map'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onCloseModal && (
            <button
              onClick={onCloseModal}
              type="button"
              className="p-2 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 shadow-lg text-zinc-700 dark:text-zinc-200 hover:text-rose-500 cursor-pointer"
              title={isBangla ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Compact Route Guidance */}
      {!compact && routeSummary.firstStep && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[400] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg flex items-center justify-between gap-2 text-[11px]">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            🧭 {routeSummary.firstStep}
          </span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
            {routeSummary.isLiveOsm ? 'OSRM OSM' : 'Dhaka Arterial'}
          </span>
        </div>
      )}
    </div>
  );
};
