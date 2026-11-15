import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  APIProvider,
  Map as GoogleMapView,
  AdvancedMarker,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  Navigation,
  MapPin,
  Clock,
  Route as RouteIcon,
  LocateFixed,
  Bike,
  Car,
  Footprints,
  ExternalLink,
  RefreshCw,
  Phone,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Flag,
  Layers,
  Maximize2,
  X,
  Compass
} from 'lucide-react';
import { Booking, Technician } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { GOOGLE_MAPS_API_KEY } from './TechnicianMap';
import {
  DHAKA_CENTER,
  resolveCustomerCoordinates,
  formatDistanceExact,
  formatDurationMinutes,
  buildFallbackDhakaRoute,
  toBengaliNumber
} from '../../utils/geoUtils';

export type RouteTravelMode = 'TWO_WHEELER' | 'DRIVING' | 'WALKING';

export interface RouteStepSummary {
  instruction: string;
  distanceText: string;
  durationText: string;
  directionKey: 'straight' | 'left' | 'right' | 'destination';
}

export interface ComputedRouteSummary {
  distanceMeters: number;
  durationMinutes: number;
  source: 'google_routes' | 'dhaka_estimate';
  steps: RouteStepSummary[];
}

export interface TechnicianRouteMapProps {
  booking: Booking;
  technician: Technician;
  height?: string;
  compact?: boolean;
  onExpandModal?: () => void;
  onCloseModal?: () => void;
}

const DARK_ROUTE_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#14171f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e1016' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2b3242' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#fbbf24' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#14261f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#272d3b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1b202b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3b4358' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1428' }] }
];

function stripHtmlTags(raw: string): string {
  return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function classifyDirectionKey(maneuver?: string, instruction?: string): RouteStepSummary['directionKey'] {
  const m = (maneuver || instruction || '').toLowerCase();
  if (m.includes('left')) return 'left';
  if (m.includes('right')) return 'right';
  if (m.includes('arrive') || m.includes('destination')) return 'destination';
  return 'straight';
}

interface ShortestRouteLayerProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  travelMode: RouteTravelMode;
  customerArea: string;
  customerAddress: string;
  isBangla: boolean;
  recenterSignal: number;
  onRouteComputed: (summary: ComputedRouteSummary) => void;
}

interface PolylineInstance {
  setMap: (map: unknown) => void;
  setOptions: (opts: Record<string, unknown>) => void;
}

interface LatLngLiteral {
  lat: number;
  lng: number;
}

const getGoogleMaps = (): any => {
  return (window as unknown as { google?: { maps?: any } }).google?.maps;
};

const ShortestRouteLayer: React.FC<ShortestRouteLayerProps> = ({
  origin,
  destination,
  travelMode,
  customerArea,
  customerAddress,
  isBangla,
  recenterSignal,
  onRouteComputed
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<PolylineInstance[]>([]);

  useEffect(() => {
    if (!map) return;

    const clearPolylines = () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };

    const fitBothPoints = (viewportBounds?: unknown) => {
      if (viewportBounds) {
        map.fitBounds(viewportBounds as any, { top: 48, right: 48, bottom: 48, left: 48 });
        return;
      }
      const gm = getGoogleMaps();
      if (gm?.LatLngBounds) {
        const bounds = new gm.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
      }
    };

    const drawYellowOrangePath = (pathCoords: LatLngLiteral[] | unknown[]) => {
      clearPolylines();
      const gm = getGoogleMaps();
      if (!gm?.Polyline || pathCoords.length < 2) return;

      // Outer rich orange glow casing
      const outerCasing: PolylineInstance = new gm.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#ea580c',
        strokeOpacity: 0.45,
        strokeWeight: 11,
        zIndex: 40,
        map
      });

      // Core bright yellow-orange shortest route path
      const innerPath: PolylineInstance = new gm.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#f59e0b',
        strokeOpacity: 1.0,
        strokeWeight: 5.5,
        zIndex: 41,
        icons: gm.SymbolPath
          ? [
              {
                icon: {
                  path: gm.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: '#ffffff',
                  fillColor: '#fbbf24',
                  fillOpacity: 1
                },
                offset: '20%',
                repeat: '95px'
              }
            ]
          : undefined,
        map
      });

      polylinesRef.current = [outerCasing, innerPath];
    };

    const applyFallbackRoute = () => {
      const fallback = buildFallbackDhakaRoute(
        origin,
        destination,
        customerArea,
        customerAddress,
        travelMode,
        isBangla
      );
      drawYellowOrangePath(fallback.path);
      fitBothPoints();
      onRouteComputed({
        distanceMeters: fallback.distanceMeters,
        durationMinutes: fallback.durationMinutes,
        source: 'dhaka_estimate',
        steps: fallback.steps
      });
    };

    let cancelled = false;

    const computeWithModernRoutesSdk = async () => {
      if (!routesLib || !(routesLib as any).Route?.computeRoutes) {
        applyFallbackRoute();
        return;
      }

      const executeRequest = async (modeToTry: RouteTravelMode) => {
        const request: Record<string, unknown> = {
          origin,
          destination,
          travelMode: modeToTry,
          computeAlternativeRoutes: true,
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs']
        };
        if (modeToTry !== 'WALKING') {
          request.routingPreference = 'TRAFFIC_AWARE';
        }
        return (routesLib as any).Route.computeRoutes(request);
      };

      try {
        let response;
        try {
          response = await executeRequest(travelMode);
        } catch {
          // Some regions or SDK versions reject TWO_WHEELER; retry safely with DRIVING
          if (travelMode === 'TWO_WHEELER') {
            response = await executeRequest('DRIVING');
          } else {
            throw new Error('Route computation failed');
          }
        }

        if (cancelled) return;

        const candidates: any[] = response?.routes || [];
        if (candidates.length === 0) {
          applyFallbackRoute();
          return;
        }

        // Pick the shortest route by distanceMeters (tie-break by durationMillis)
        const shortestRoute = [...candidates].sort((a, b) => {
          const distDiff = (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
          if (distDiff !== 0) return distDiff;
          return (a.durationMillis ?? Infinity) - (b.durationMillis ?? Infinity);
        })[0];

        if (shortestRoute.path && shortestRoute.path.length > 1) {
          drawYellowOrangePath(shortestRoute.path);
        } else if (typeof shortestRoute.createPolylines === 'function') {
          clearPolylines();
          const outerLines: PolylineInstance[] = shortestRoute.createPolylines();
          outerLines.forEach((p) => {
            p.setOptions({
              strokeColor: '#ea580c',
              strokeOpacity: 0.45,
              strokeWeight: 11,
              zIndex: 40
            });
            p.setMap(map);
          });
          const innerLines: PolylineInstance[] = shortestRoute.createPolylines();
          innerLines.forEach((p) => {
            p.setOptions({
              strokeColor: '#f59e0b',
              strokeOpacity: 1.0,
              strokeWeight: 5.5,
              zIndex: 41
            });
            p.setMap(map);
          });
          polylinesRef.current = [...outerLines, ...innerLines];
        } else {
          applyFallbackRoute();
          return;
        }

        fitBothPoints(shortestRoute.viewport);

        const totalDist = shortestRoute.distanceMeters ?? 0;
        const durationMillis = shortestRoute.durationMillis ?? 0;
        const durationMinutes = Math.max(1, Math.round(durationMillis / 60000));

        const rawSteps: any[] = shortestRoute.legs?.[0]?.steps || [];
        const parsedSteps: RouteStepSummary[] = rawSteps
          .map((s) => {
            const rawInstr = s?.instructions || s?.navigationInstruction?.instructions || '';
            const cleanInstr = stripHtmlTags(rawInstr);
            const stepMeters = s?.distanceMeters ?? 0;
            const stepMins = Math.max(1, Math.round((s?.durationMillis ?? s?.staticDurationMillis ?? 60000) / 60000));
            return {
              instruction: cleanInstr,
              distanceText: formatDistanceExact(stepMeters, isBangla),
              durationText: formatDurationMinutes(stepMins, isBangla),
              directionKey: classifyDirectionKey(s?.maneuver || s?.navigationInstruction?.maneuver, cleanInstr)
            };
          })
          .filter((st) => st.instruction.length > 0);

        const fallbackGuide = buildFallbackDhakaRoute(
          origin,
          destination,
          customerArea,
          customerAddress,
          travelMode,
          isBangla
        );

        onRouteComputed({
          distanceMeters: totalDist || fallbackGuide.distanceMeters,
          durationMinutes: durationMinutes || fallbackGuide.durationMinutes,
          source: 'google_routes',
          steps: parsedSteps.length > 0 ? parsedSteps : fallbackGuide.steps
        });
      } catch {
        if (!cancelled) {
          applyFallbackRoute();
        }
      }
    };

    computeWithModernRoutesSdk();

    return () => {
      cancelled = true;
      clearPolylines();
    };
  }, [
    map,
    routesLib,
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng,
    travelMode,
    customerArea,
    customerAddress,
    isBangla,
    recenterSignal
  ]);

  return null;
};

export const TechnicianRouteMap: React.FC<TechnicianRouteMapProps> = ({
  booking,
  technician,
  height = '360px',
  compact = false,
  onExpandModal,
  onCloseModal
}) => {
  const { isBangla } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Destination: Customer's booked address coordinates
  const customerLocation = useMemo(() => {
    if (
      typeof booking.customerLat === 'number' &&
      typeof booking.customerLng === 'number' &&
      !isNaN(booking.customerLat) &&
      !isNaN(booking.customerLng)
    ) {
      return {
        lat: booking.customerLat,
        lng: booking.customerLng,
        areaLabel: booking.customerArea
      };
    }
    const resolved = resolveCustomerCoordinates(
      booking.customerArea,
      booking.customerAddress,
      booking.id
    );
    return {
      lat: resolved.lat,
      lng: resolved.lng,
      areaLabel: isBangla ? resolved.matchedAreaBn : resolved.matchedAreaEn
    };
  }, [booking, isBangla]);

  // Default fallback Technician hub coordinates if GPS unavailable
  const fallbackTechLocation = useMemo(() => {
    if (
      typeof technician.latitude === 'number' &&
      typeof technician.longitude === 'number' &&
      !isNaN(technician.latitude) &&
      !isNaN(technician.longitude)
    ) {
      return { lat: technician.latitude, lng: technician.longitude };
    }
    const resolvedTechArea = resolveCustomerCoordinates(technician.primaryArea || 'Mirpur', '', technician.id);
    return { lat: resolvedTechArea.lat, lng: resolvedTechArea.lng };
  }, [technician]);

  const [techPos, setTechPos] = useState<{ lat: number; lng: number }>(fallbackTechLocation);
  const [gpsStatus, setGpsStatus] = useState<'gps_live' | 'locating' | 'area_fallback'>('locating');
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState<boolean>(true);
  const [travelMode, setTravelMode] = useState<RouteTravelMode>('TWO_WHEELER');
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [recenterSignal, setRecenterSignal] = useState<number>(0);
  const [showAllSteps, setShowAllSteps] = useState<boolean>(!compact);
  const [routeSummary, setRouteSummary] = useState<ComputedRouteSummary | null>(null);

  // Live GPS acquisition & watchPosition for technician's exact location
  useEffect(() => {
    if (!navigator.geolocation) {
      setTechPos(fallbackTechLocation);
      setGpsStatus('area_fallback');
      return;
    }

    setGpsStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isNaN(latitude) && !isNaN(longitude)) {
          setTechPos({ lat: latitude, lng: longitude });
          setGpsStatus('gps_live');
        }
      },
      () => {
        setTechPos(fallbackTechLocation);
        setGpsStatus('area_fallback');
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 15000 }
    );

    if (!liveTrackingEnabled) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isNaN(latitude) && !isNaN(longitude)) {
          setTechPos({ lat: latitude, lng: longitude });
          setGpsStatus('gps_live');
        }
      },
      () => {
        // Keep current position silently on watch glitch
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [fallbackTechLocation, liveTrackingEnabled]);

  const handleManualGpsRefresh = () => {
    if (!navigator.geolocation) {
      setTechPos(fallbackTechLocation);
      setGpsStatus('area_fallback');
      setRecenterSignal((s) => s + 1);
      return;
    }
    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTechPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus('gps_live');
        setRecenterSignal((s) => s + 1);
      },
      () => {
        setTechPos(fallbackTechLocation);
        setGpsStatus('area_fallback');
        setRecenterSignal((s) => s + 1);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  // Compute expected arrival clock time
  const estimatedArrivalClock = useMemo(() => {
    if (!routeSummary) return null;
    const etaDate = new Date(Date.now() + routeSummary.durationMinutes * 60 * 1000);
    return etaDate.toLocaleTimeString(isBangla ? 'bn-BD' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [routeSummary, isBangla]);

  const externalDirectionsUrl = useMemo(() => {
    const modeParam =
      travelMode === 'WALKING' ? 'walking' : travelMode === 'TWO_WHEELER' ? 'two-wheeler' : 'driving';
    return `https://www.google.com/maps/dir/?api=1&origin=${techPos.lat},${techPos.lng}&destination=${customerLocation.lat},${customerLocation.lng}&travelmode=${modeParam}`;
  }, [techPos, customerLocation, travelMode]);

  const renderStepIcon = (key: RouteStepSummary['directionKey']) => {
    switch (key) {
      case 'left':
        return <CornerUpLeft className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'right':
        return <CornerUpRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'destination':
        return <Flag className="w-3.5 h-3.5 text-orange-600 shrink-0" />;
      default:
        return <ArrowUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    }
  };

  return (
    <div className="rounded-2xl border-2 border-amber-500/40 bg-white dark:bg-zinc-950 overflow-hidden shadow-lg">
      {/* Top Technician Route Header */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black tracking-tight flex items-center gap-1.5 truncate">
              <span>{isBangla ? 'গ্রাহকের লোকেশন ও সংক্ষিপ্ত রুট নেভিগেশন' : 'Customer Route Navigation'}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-black/25 text-[10px] font-mono">
                #{booking.bookingNumber}
              </span>
            </div>
            <div className="text-[11px] text-orange-50 truncate">
              📍 {booking.customerName} · {booking.customerAddress}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* GPS Status Indicator */}
          <button
            type="button"
            onClick={handleManualGpsRefresh}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title={isBangla ? 'আমার লাইভ GPS আপডেট করুন' : 'Refresh Live GPS'}
          >
            <LocateFixed className={`w-3.5 h-3.5 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
            <span>
              {gpsStatus === 'gps_live'
                ? (isBangla ? 'লাইভ GPS চালু' : 'Live GPS')
                : gpsStatus === 'locating'
                ? (isBangla ? 'খুঁজছে...' : 'Locating...')
                : (isBangla ? `${technician.primaryArea} হাব` : `${technician.primaryArea} Hub`)}
            </span>
          </button>

          {onExpandModal && (
            <button
              type="button"
              onClick={onExpandModal}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer transition-colors"
              title={isBangla ? 'বড় স্ক্রিনে দেখুন' : 'Full Screen Map'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer transition-colors"
              title={isBangla ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Summary Strip: Distance, ETA, Shortest Route Indicator */}
      <div className="grid grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-800 bg-amber-50/70 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800">
        <div className="p-2.5 sm:p-3 text-center sm:text-left">
          <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center justify-center sm:justify-start gap-1">
            <RouteIcon className="w-3 h-3 text-orange-500" />
            <span>{isBangla ? 'মোট দূরত্ব' : 'Total Distance'}</span>
          </div>
          <div className="text-sm sm:text-base font-black text-zinc-900 dark:text-white mt-0.5">
            {routeSummary ? formatDistanceExact(routeSummary.distanceMeters, isBangla) : '...'}
          </div>
        </div>

        <div className="p-2.5 sm:p-3 text-center sm:text-left">
          <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center justify-center sm:justify-start gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>{isBangla ? 'পৌঁছাতে সময় লাগবে' : 'Est. Travel Time'}</span>
          </div>
          <div className="text-sm sm:text-base font-black text-orange-600 dark:text-amber-400 mt-0.5">
            {routeSummary ? formatDurationMinutes(routeSummary.durationMinutes, isBangla) : '...'}
          </div>
          {estimatedArrivalClock && (
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {isBangla ? `সম্ভাব্য পৌঁছানো: ~${estimatedArrivalClock}` : `ETA ~${estimatedArrivalClock}`}
            </div>
          )}
        </div>

        <div className="p-2.5 sm:p-3 text-center sm:text-left">
          <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center justify-center sm:justify-start gap-1">
            <span className="w-3 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-600 inline-block" />
            <span>{isBangla ? 'সংক্ষিপ্ত রুট' : 'Shortest Path'}</span>
          </div>
          <div className="text-[11px] sm:text-xs font-extrabold text-amber-700 dark:text-amber-300 mt-1">
            {isBangla ? 'হলুদ-কমলা পথ অনুসরণ করুন' : 'Yellow-Orange Route'}
          </div>
        </div>
      </div>

      {/* Mode Switcher & Map Controls Bar */}
      <div className="px-3 py-2 bg-stone-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTravelMode('TWO_WHEELER')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all ${
              travelMode === 'TWO_WHEELER'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>{isBangla ? 'মোটরবাইক' : 'Bike'}</span>
          </button>

          <button
            type="button"
            onClick={() => setTravelMode('DRIVING')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all ${
              travelMode === 'DRIVING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>{isBangla ? 'গাড়ি' : 'Car'}</span>
          </button>

          <button
            type="button"
            onClick={() => setTravelMode('WALKING')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all ${
              travelMode === 'WALKING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>{isBangla ? 'হাঁটা' : 'Walk'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLiveTrackingEnabled((v) => !v)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer border transition-colors ${
              liveTrackingEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${liveTrackingEnabled ? 'bg-emerald-500 animate-ping' : 'bg-zinc-400'}`} />
            <span>{isBangla ? (liveTrackingEnabled ? 'অটো ট্র্যাকিং' : 'ট্র্যাকিং অফ') : 'Auto Track'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMapType((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3 h-3 text-orange-500" />
            <span>{mapType === 'hybrid' ? (isBangla ? 'ম্যাপ' : 'Map') : (isBangla ? 'স্যাটেলাইট' : 'Satellite')}</span>
          </button>

          <button
            type="button"
            onClick={() => setRecenterSignal((s) => s + 1)}
            className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:border-orange-500"
            title={isBangla ? 'উভয় লোকেশন দেখুন' : 'Fit Route'}
          >
            <RefreshCw className="w-3 h-3 text-orange-500" />
            <span className="hidden sm:inline">{isBangla ? 'ফিট রুট' : 'Fit'}</span>
          </button>
        </div>
      </div>

      {/* Real Google Maps Viewport */}
      <div className="relative w-full" style={{ height }}>
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language={isBangla ? 'bn' : 'en'} region="BD">
          <GoogleMapView
            mapId="DEMO_MAP_ID"
            style={{ width: '100%', height: '100%' }}
            defaultCenter={{
              lat: (techPos.lat + customerLocation.lat) / 2 || DHAKA_CENTER.lat,
              lng: (techPos.lng + customerLocation.lng) / 2 || DHAKA_CENTER.lng
            }}
            defaultZoom={13}
            gestureHandling="greedy"
            disableDefaultUI
            zoomControl
            mapTypeId={mapType}
            styles={isDark && mapType === 'roadmap' ? DARK_ROUTE_MAP_STYLE : undefined}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            <ShortestRouteLayer
              origin={techPos}
              destination={{ lat: customerLocation.lat, lng: customerLocation.lng }}
              travelMode={travelMode}
              customerArea={booking.customerArea}
              customerAddress={booking.customerAddress}
              isBangla={isBangla}
              recenterSignal={recenterSignal}
              onRouteComputed={setRouteSummary}
            />

            {/* Marker 1: Technician Exact Live Location */}
            <AdvancedMarker
              position={techPos}
              zIndex={60}
              title={isBangla ? 'আপনার বর্তমান অবস্থান (টেকনিশিয়ান)' : 'Your Current Location (Technician)'}
            >
              <div className="relative flex flex-col items-center -translate-y-2 select-none">
                <div className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-lg border border-white whitespace-nowrap mb-1 flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5 fill-current" />
                  <span>{isBangla ? 'আপনি (টেকনিশিয়ান)' : 'You (Tech)'}</span>
                </div>
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-10 h-10 rounded-full bg-emerald-500/35 animate-ping" />
                  <div className="w-9 h-9 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center overflow-hidden">
                    <img
                      src={technician.avatar}
                      alt={technician.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
            </AdvancedMarker>

            {/* Marker 2: Customer Booked Destination Location Icon */}
            <AdvancedMarker
              position={{ lat: customerLocation.lat, lng: customerLocation.lng }}
              zIndex={70}
              title={isBangla ? `গ্রাহকের ঠিকানা: ${booking.customerAddress}` : `Customer: ${booking.customerAddress}`}
            >
              <div className="relative flex flex-col items-center -translate-y-4 select-none">
                <div className="px-2.5 py-1 rounded-xl bg-zinc-950/95 text-amber-300 text-[10px] font-black shadow-xl border border-amber-400/70 whitespace-nowrap mb-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>
                    {isBangla ? 'গ্রাহক:' : 'Customer:'} {booking.customerName.split('(')[0].trim()}
                  </span>
                </div>
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-12 h-12 rounded-full bg-amber-500/35 animate-ping" />
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 border-2 border-white shadow-2xl flex items-center justify-center text-white">
                    <MapPin className="w-5 h-5 fill-white text-orange-600" />
                  </div>
                </div>
                <div className="w-2.5 h-2.5 bg-orange-600 rotate-45 -mt-1.5 border-r border-b border-white" />
              </div>
            </AdvancedMarker>
          </GoogleMapView>
        </APIProvider>

        {/* Bottom Floating Map Legend */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 pointer-events-none flex flex-wrap items-center justify-between gap-2">
          <div className="pointer-events-auto inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 shadow-lg text-[10px] font-bold text-zinc-800 dark:text-zinc-200">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>{isBangla ? 'আপনার লোকেশন' : 'Your Location'}</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-orange-500" />
              <span>{isBangla ? 'গ্রাহকের লোকেশন' : 'Customer Pin'}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-600 inline-block" />
              <span className="text-amber-600 dark:text-amber-400">
                {isBangla ? 'সবচেয়ে কম দূরত্বের পথ' : 'Shortest Path'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Route Directions & Customer Actions */}
      <div className="p-3.5 bg-stone-50/80 dark:bg-zinc-900/70 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowAllSteps((prev) => !prev)}
            className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 cursor-pointer hover:text-orange-600"
          >
            <RouteIcon className="w-4 h-4 text-amber-500" />
            <span>
              {isBangla ? 'কোন পথে যাবেন (রুট নির্দেশনা)' : 'Turn-by-Turn Directions'}
              {routeSummary ? ` (${toBengaliNumber(routeSummary.steps.length)} ধাপ)` : ''}
            </span>
            <span className="text-[10px] font-bold text-orange-600 dark:text-amber-400 ml-1">
              {showAllSteps ? (isBangla ? '▲ লুকান' : '▲ Hide') : (isBangla ? '▼ দেখুন' : '▼ Show')}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${booking.customerPhone}`}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold flex items-center gap-1 hover:border-orange-500"
            >
              <Phone className="w-3 h-3 text-orange-500" />
              <span>{isBangla ? 'গ্রাহককে কল' : 'Call'}</span>
            </a>
            <a
              href={externalDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-[11px] font-black flex items-center gap-1 shadow-sm"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{isBangla ? 'Google Maps নেভিগেশন' : 'Open in Google Maps'}</span>
            </a>
          </div>
        </div>

        {showAllSteps && routeSummary && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {routeSummary.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2.5 p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 text-xs"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {isBangla ? toBengaliNumber(idx + 1) : idx + 1}
                  </span>
                  <div className="mt-0.5">{renderStepIcon(step.directionKey)}</div>
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium leading-snug">
                    {step.instruction}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-black text-orange-600 dark:text-amber-400">
                    {step.distanceText}
                  </div>
                  <div className="text-[10px] text-zinc-400">{step.durationText}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
