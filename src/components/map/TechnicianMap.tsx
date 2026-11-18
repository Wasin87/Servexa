import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  Navigation,
  Layers,
  Star,
  RotateCcw,
  X,
  Sparkles,
  ZoomIn,
  ZoomOut,
  LocateFixed,
  List,
  MapPin
} from 'lucide-react';
import { Technician } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { DHAKA_HEATMAP_ZONES } from '../../data/heatmapData';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshLocations';
import { diagnoseWithAI } from '../../services/geminiService';
import { DiagnosisResult } from '../../services/problemDiagnosis';
import {
  DHAKA_CENTER,
  DHAKA_AREAS,
  calculateHaversineDistance,
  formatDistance,
  toBengaliNumber,
  detectServiceCategoryFromQuery,
  CATEGORY_VISUAL_MAP,
  calculateRecommendationScore,
  getRecommendationReasons
} from '../../utils/geoUtils';

export interface TechnicianMapProps {
  mode?: 'standalone' | 'embedded';
  initialCategory?: string;
  initialRadiusKm?: number;
  height?: string;
  onSelectTechnician?: (tech: Technician) => void;
  selectedTechId?: string;
  className?: string;
  showListToggle?: boolean;
}

type MapMode = 'PROS' | 'HEATMAP';
type TileLayerType = 'STREET' | 'VOYAGER' | 'DARK' | 'SATELLITE';
type SortOption = 'recommended' | 'nearest' | 'rating' | 'experience' | 'price' | 'available_first';

const TILE_CONFIGS: Record<
  TileLayerType,
  { url: string; attribution: string; subdomains?: string; labelBn: string; labelEn: string }
> = {
  STREET: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    labelBn: 'ওপেনস্ট্রিটম্যাপ (বাংলাদেশ)',
    labelEn: 'OpenStreetMap Street'
  },
  VOYAGER: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    labelBn: 'ওপেনস্ট্রিটম্যাপ (স্ট্রিট)',
    labelEn: 'OpenStreetMap'
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

const QUICK_BD_HUBS = [
  { id: 'dhaka_center', nameEn: 'Dhaka Center', nameBn: 'ঢাকা কেন্দ্র', lat: DHAKA_CENTER.lat, lng: DHAKA_CENTER.lng, zoom: 12 },
  ...DHAKA_AREAS.slice(0, 7).map((a) => ({
    id: `area_${a.nameEn.toLowerCase()}`,
    nameEn: a.nameEn,
    nameBn: a.nameBn,
    lat: a.lat,
    lng: a.lng,
    zoom: 14
  })),
  ...BANGLADESH_DISTRICTS.filter((d) =>
    ['chattogram', 'sylhet', 'gazipur', 'narayanganj', 'khulna', 'rajshahi'].includes(d.id)
  ).map((d) => ({
    id: `dist_${d.id}`,
    nameEn: d.nameEn,
    nameBn: d.nameBn,
    lat: d.lat,
    lng: d.lng,
    zoom: 12
  }))
];

function getCategoryVisualDetails(skill: string, isBangla: boolean) {
  const map: Record<string, { labelBn: string; labelEn: string; iconSvg: string }> = {
    plumbing: {
      labelBn: 'প্লাম্বিং ও স্যানিটারি',
      labelEn: 'Plumbing & Sanitary',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 4.5 4.5-2.5 2.5-4.5-4.5Z"/><path d="m9.5 6.5 2.5 2.5"/><path d="M14 4 4 14l2 2 10-10"/><path d="m10 18 4 4 2-2-4-4"/></svg>'
    },
    electrical: {
      labelBn: 'বৈদ্যুতিক সার্ভিস',
      labelEn: 'Electrical Service',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
    },
    ac_repair: {
      labelBn: 'এসি মেরামত ও গ্যাস',
      labelEn: 'AC Repair & Service',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>'
    },
    refrigerator: {
      labelBn: 'ফ্রিজ সার্ভিসিং',
      labelEn: 'Refrigerator Service',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M4 10h16"/><path d="M15 6h.01"/><path d="M15 14h.01"/></svg>'
    },
    washing_machine: {
      labelBn: 'ওয়াশিং মেশিন সার্ভিস',
      labelEn: 'Washing Machine Repair',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="20" x="3" y="2" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M12 11a2 2 0 1 0 2 2"/></svg>'
    },
    tv_repair: {
      labelBn: 'টিভি মেরামত সার্ভিস',
      labelEn: 'TV Repair Service',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="20" height="15" x="2" y="7" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>'
    },
    computer_repair: {
      labelBn: 'কম্পিউটার/ল্যাপটপ',
      labelEn: 'Computer & Laptop',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="12" x="3" y="4" rx="2"/><path d="M2 20h20"/></svg>'
    },
    mobile_repair: {
      labelBn: 'মোবাইল সার্ভিসিং',
      labelEn: 'Mobile Repair',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>'
    },
    painting: {
      labelBn: 'রং মিস্ত্রি সার্ভিস',
      labelEn: 'Painting Service',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/></svg>'
    },
    carpentry: {
      labelBn: 'কাঠ মিস্ত্রি ও ফার্নিচার',
      labelEn: 'Carpentry & Woodwork',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 3.26-6.55 6.55"/></svg>'
    },
    home_cleaning: {
      labelBn: 'ডিপ ক্লিনিং সার্ভিস',
      labelEn: 'Deep Home Cleaning',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/></svg>'
    },
    cctv_installation: {
      labelBn: 'সিসিটিভি ক্যামেরা',
      labelEn: 'CCTV Camera',
      iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"/><rect width="18" height="14" x="3" y="5" rx="2"/></svg>'
    }
  };

  const entry = map[skill];
  if (entry) {
    return {
      label: isBangla ? entry.labelBn : entry.labelEn,
      iconSvg: entry.iconSvg
    };
  }
  const fallbackMeta = CATEGORY_VISUAL_MAP[skill] || CATEGORY_VISUAL_MAP.other_services;
  return {
    label: isBangla ? (fallbackMeta.nameBn || 'অন্যান্য কারিগরি') : (fallbackMeta.nameEn || 'Handyman'),
    iconSvg: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
  };
}

function getAvailabilityDetails(availability: string, isBangla: boolean) {
  if (availability === 'available') {
    return {
      label: isBangla ? 'এখনই প্রস্তুত' : 'Available Now',
      bg: '#062617',
      border: '#065f46',
      text: '#34d399',
      dot: '#10b981'
    };
  }
  if (availability === 'busy') {
    return {
      label: isBangla ? 'কাজে ব্যস্ত' : 'Busy Now',
      bg: '#27170c',
      border: '#7c2d12',
      text: '#fbbf24',
      dot: '#f59e0b'
    };
  }
  return {
    label: isBangla ? 'অফলাইন' : 'Offline',
    bg: '#1c1917',
    border: '#44403c',
    text: '#a8a29e',
    dot: '#78716c'
  };
}

export const TechnicianMap: React.FC<TechnicianMapProps> = ({
  initialCategory = 'all',
  initialRadiusKm = 15,
  height = '600px',
  onSelectTechnician,
  selectedTechId,
  className = '',
  showListToggle = true
}) => {
  const navigate = useNavigate();
  const { categories, technicians } = useApp();
  const { isBangla } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [mapMode, setMapMode] = useState<MapMode>('PROS');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [radiusKm, setRadiusKm] = useState<number>(initialRadiusKm);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');

  // Search origin state (updated ONLY by explicit user location selection/GPS/recenter, NEVER on moveend)
  const [searchOrigin, setSearchOrigin] = useState<{ lat: number; lng: number }>({
    lat: DHAKA_CENTER.lat,
    lng: DHAKA_CENTER.lng
  });
  const [selectedLocationName, setSelectedLocationName] = useState<string>('Dhaka Center');

  const [manualTileLayer, setManualTileLayer] = useState<TileLayerType | null>(null);
  const tileLayerType: TileLayerType = manualTileLayer ?? (isDark ? 'DARK' : 'STREET');
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [showProsDrawer, setShowProsDrawer] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Active popup state
  const [activePopupTechId, setActivePopupTechId] = useState<string | null>(selectedTechId || null);

  // AI Problem Diagnosis state
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiProblemQuery, setAiProblemQuery] = useState<string>('');
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<DiagnosisResult | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerInstancesRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectTechnicianRef = useRef(onSelectTechnician);
  onSelectTechnicianRef.current = onSelectTechnician;

  // Sync external selectedTechId prop if passed
  useEffect(() => {
    if (selectedTechId) {
      setActivePopupTechId(selectedTechId);
    }
  }, [selectedTechId]);

  // Imperative helper to move origin & pan map cleanly
  const focusLocation = (lat: number, lng: number, label: string, zoom = 13) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setSearchOrigin({ lat, lng });
    setSelectedLocationName(label);
    mapInstanceRef.current?.flyTo([lat, lng], zoom, { duration: 0.65 });
  };

  // Filtered & ranked technicians relative to searchOrigin
  const filteredTechnicians = useMemo(() => {
    return technicians
      .filter((tech) => {
        if (!tech) return false;
        const lat = Number(tech.latitude);
        const lng = Number(tech.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

        if (selectedCategory !== 'all') {
          const matchesSkill = tech.skills.some((s) => s.toLowerCase() === selectedCategory.toLowerCase());
          if (!matchesSkill) return false;
        }

        if (onlyAvailable && tech.availability !== 'available') return false;

        if (selectedDistrictId !== 'all') {
          const distObj = BANGLADESH_DISTRICTS.find((d) => d.id === selectedDistrictId);
          if (distObj) {
            const techDist = (tech.district || tech.city || '').toLowerCase();
            if (
              !techDist.includes(distObj.nameEn.toLowerCase()) &&
              !techDist.includes(distObj.nameBn) &&
              calculateHaversineDistance(distObj.lat, distObj.lng, lat, lng) > 45
            ) {
              return false;
            }
          }
        }

        // Skip radius clamp if radiusKm >= 250 ("All Bangladesh")
        const dist = calculateHaversineDistance(searchOrigin.lat, searchOrigin.lng, lat, lng);
        if (radiusKm < 250 && dist > radiusKm) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = tech.name.toLowerCase().includes(q);
          const matchesArea = `${tech.primaryArea || ''} ${tech.district || ''} ${tech.city || ''}`.toLowerCase().includes(q);
          const matchesTrade = tech.skills.some((s) => s.toLowerCase().includes(q));
          if (!matchesName && !matchesArea && !matchesTrade) return false;
        }

        return true;
      })
      .map((tech) => {
        const lat = Number(tech.latitude);
        const lng = Number(tech.longitude);
        const distance = calculateHaversineDistance(searchOrigin.lat, searchOrigin.lng, lat, lng);
        const recScore = calculateRecommendationScore(tech, searchOrigin.lat, searchOrigin.lng);
        const recReasons = getRecommendationReasons(tech, searchOrigin.lat, searchOrigin.lng, isBangla);
        return { ...tech, latitude: lat, longitude: lng, distance, recScore, recReasons };
      })
      .sort((a, b) => {
        if (sortBy === 'nearest') return a.distance - b.distance;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
        if (sortBy === 'price') return a.startingPrice - b.startingPrice;
        if (sortBy === 'available_first') {
          if (a.availability === 'available' && b.availability !== 'available') return -1;
          if (b.availability === 'available' && a.availability !== 'available') return 1;
          return b.recScore - a.recScore;
        }
        return b.recScore - a.recScore;
      });
  }, [
    technicians,
    selectedCategory,
    onlyAvailable,
    selectedDistrictId,
    radiusKm,
    searchQuery,
    searchOrigin.lat,
    searchOrigin.lng,
    sortBy,
    isBangla
  ]);

  // 1. Mount Leaflet Map ONCE (no moveend->setState loop, includes ResizeObserver)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapInstanceRef.current) return;

    const map = L.map(container, {
      center: [DHAKA_CENTER.lat, DHAKA_CENTER.lng],
      zoom: 12,
      minZoom: 6,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true
    });

    map.attributionControl.setPrefix(false);

    const cfg = TILE_CONFIGS[tileLayerType];
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

  // 2. Swap Tile Layer without recreating the map or panning
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_CONFIGS[tileLayerType];
    const nextTile = L.tileLayer(cfg.url, {
      maxZoom: 19,
      attribution: cfg.attribution,
      ...(cfg.subdomains ? { subdomains: cfg.subdomains } : {})
    }).addTo(map);

    tileLayerRef.current = nextTile;
  }, [tileLayerType]);

  // 3. Render Radius Ring, Origin Pin & Technician / Heatmap Markers (pure layer mutation, ZERO setView!)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const overlayLayer = overlayLayerRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !overlayLayer || !markersLayer) return;

    overlayLayer.clearLayers();
    markersLayer.clearLayers();
    markerInstancesRef.current.clear();

    if (mapMode === 'PROS') {
      // Search Radius Circle & Origin Marker
      if (radiusKm < 250 && Number.isFinite(searchOrigin.lat) && Number.isFinite(searchOrigin.lng)) {
        L.circle([searchOrigin.lat, searchOrigin.lng], {
          radius: radiusKm * 1000,
          color: '#f97316',
          weight: 1.5,
          dashArray: '6, 6',
          opacity: 0.55,
          fillColor: '#f97316',
          fillOpacity: 0.06,
          interactive: false
        }).addTo(overlayLayer);

        const originIcon = L.divIcon({
          className: 'custom-leaflet-marker-clean',
          html: `
            <div style="width:14px;height:14px;border-radius:50%;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 4px rgba(37,99,235,0.28);pointer-events:none;"></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        const oLat = Number(searchOrigin.lat);
        const oLng = Number(searchOrigin.lng);
        if (Number.isFinite(oLat) && Number.isFinite(oLng)) {
          L.marker([oLat, oLng], { icon: originIcon, interactive: false }).addTo(markersLayer);
        }
      }

      // Technician Markers
      filteredTechnicians.forEach((tech) => {
        if (!Number.isFinite(tech.latitude) || !Number.isFinite(tech.longitude)) return;

        const isActive = activePopupTechId === tech.id;
        const primarySkill = tech.skills[0] || 'other_services';
        const visualMeta = CATEGORY_VISUAL_MAP[primarySkill] || CATEGORY_VISUAL_MAP.other_services;
        const isAvailable = tech.availability === 'available';
        const statusColor = isAvailable ? '#10b981' : tech.availability === 'busy' ? '#f59e0b' : '#71717a';

        if (isActive) {
          L.circle([tech.latitude, tech.longitude], {
            radius: (tech.serviceRadiusKm || 5) * 350,
            color: '#ea580c',
            weight: 1.5,
            opacity: 0.6,
            fillColor: '#ea580c',
            fillOpacity: 0.14,
            interactive: false
          }).addTo(overlayLayer);
        }

        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker-clean',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;${isActive ? 'transform:scale(1.12);' : ''}transition:transform 0.15s ease;">
              <div style="position:relative;background:${isActive ? '#ea580c' : isDark ? '#18181b' : '#ffffff'};border:2.5px solid ${isActive ? '#fef08a' : '#ea580c'};border-radius:14px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 8px 18px rgba(0,0,0,0.34);">
                ${visualMeta.emoji}
                <span style="position:absolute;top:-4px;right:-4px;width:11px;height:11px;background:${statusColor};border:2px solid #ffffff;border-radius:50%;"></span>
              </div>
              <div style="background:${isActive ? '#ea580c' : '#09090b'};color:#ffffff;padding:1.5px 7px;border-radius:7px;font-size:10px;font-weight:800;margin-top:2px;box-shadow:0 3px 8px rgba(0,0,0,0.28);white-space:nowrap;">
                ৳${isBangla ? toBengaliNumber(tech.startingPrice) : tech.startingPrice}
              </div>
            </div>
          `,
          iconSize: [42, 58],
          iconAnchor: [21, 58]
        });

        const tLat = Number(tech.latitude);
        const tLng = Number(tech.longitude);
        if (!Number.isFinite(tLat) || !Number.isFinite(tLng)) return;

        const marker = L.marker([tLat, tLng], {
          icon: customIcon,
          zIndexOffset: isActive ? 700 : 200
        });

        const distKm = (tech.latitude && tech.longitude && Number.isFinite(searchOrigin.lat) && Number.isFinite(searchOrigin.lng))
          ? calculateHaversineDistance(searchOrigin.lat, searchOrigin.lng, tech.latitude, tech.longitude)
          : (typeof (tech as any).distance === 'number' ? (tech as any).distance : null);
        const distFormatted = distKm !== null
          ? (isBangla ? toBengaliNumber(distKm.toFixed(1)) : distKm.toFixed(1))
          : (isBangla ? '৪.২' : '4.2');
        const distText = isBangla ? `${distFormatted} কিমি দূরে` : `${distFormatted} km away`;

        const catMeta = getCategoryVisualDetails(primarySkill, isBangla);
        const availMeta = getAvailabilityDetails(tech.availability, isBangla);

        const tooltipHtml = `
          <div class="tech-hover-card" style="width:315px;max-width:92vw;background:#18181b;color:#f4f4f5;padding:14px;border-radius:18px;border:1px solid #27272a;box-shadow:0 20px 45px rgba(0,0,0,0.7);box-sizing:border-box;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:left;pointer-events:auto;user-select:none;line-height:1.4;">
            <!-- Row 1: Badges -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;">
              <!-- Category Badge -->
              <div style="display:inline-flex;align-items:center;gap:6px;background:#2b1810;border:1px solid #7c2d12;color:#f97316;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:700;line-height:1;box-sizing:border-box;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:5px;background:#2563eb;color:#ffffff;font-size:11px;flex-shrink:0;">
                  ${catMeta.iconSvg}
                </span>
                <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${catMeta.label}</span>
              </div>
              <!-- Availability Badge -->
              <div style="display:inline-flex;align-items:center;gap:6px;background:${availMeta.bg};border:1px solid ${availMeta.border};color:${availMeta.text};padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:700;line-height:1;box-sizing:border-box;flex-shrink:0;">
                <span style="width:7px;height:7px;border-radius:50%;background:${availMeta.dot};flex-shrink:0;"></span>
                <span style="white-space:nowrap;">${availMeta.label}</span>
              </div>
            </div>

            <!-- Row 2: Profile Info -->
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <div style="position:relative;width:52px;height:52px;flex-shrink:0;">
                <img src="${tech.avatar}" alt="${tech.name}" style="width:52px;height:52px;border-radius:15px;object-fit:cover;border:2px solid #ea580c;display:block;" />
                <span style="position:absolute;bottom:-3px;right:-3px;width:18px;height:18px;border-radius:50%;background:#2563eb;border:2px solid #18181b;display:flex;align-items:center;justify-content:center;color:#ffffff;box-shadow:0 2px 4px rgba(0,0,0,0.5);">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              </div>
              <div style="flex:1;min-width:0;text-align:left;">
                <div style="font-size:17px;font-weight:800;color:#ffffff;line-height:1.25;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  ${tech.name}
                </div>
                <div style="display:flex;align-items:center;gap:4px;font-size:12px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span style="color:#a1a1aa;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tech.primaryArea}</span>
                  <span style="color:#71717a;margin:0 2px;flex-shrink:0;">·</span>
                  <span style="color:#f97316;font-weight:800;white-space:nowrap;flex-shrink:0;">${distText}</span>
                </div>
              </div>
            </div>

            <!-- Row 3: Stats Box (3 columns) -->
            <div style="background:#131316;border:1px solid #27272a;border-radius:14px;padding:9px 6px;display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;text-align:center;margin-bottom:12px;box-sizing:border-box;">
              <!-- Col 1: Rating -->
              <div style="border-right:1px solid #27272a;padding:0 4px;">
                <div style="display:flex;align-items:center;justify-content:center;gap:3px;font-size:14px;font-weight:800;color:#fbbf24;line-height:1.2;">
                  ★ <span>${isBangla ? toBengaliNumber(tech.rating) : tech.rating}</span>
                </div>
                <div style="font-size:10.5px;color:#a1a1aa;font-weight:500;margin-top:3px;line-height:1;white-space:nowrap;">
                  ${isBangla ? toBengaliNumber(tech.reviewCount) : tech.reviewCount} ${isBangla ? 'রিভিউ' : 'reviews'}
                </div>
              </div>

              <!-- Col 2: Experience -->
              <div style="border-right:1px solid #27272a;padding:0 4px;">
                <div style="font-size:14px;font-weight:800;color:#ffffff;line-height:1.2;white-space:nowrap;">
                  ${isBangla ? toBengaliNumber(tech.experienceYears || 5) : (tech.experienceYears || 5)} ${isBangla ? 'বছর' : 'yrs'}
                </div>
                <div style="font-size:10.5px;color:#a1a1aa;font-weight:500;margin-top:3px;line-height:1;white-space:nowrap;">
                  ${isBangla ? 'অভিজ্ঞতা' : 'Experience'}
                </div>
              </div>

              <!-- Col 3: Price -->
              <div style="padding:0 4px;">
                <div style="font-size:14px;font-weight:800;color:#fb923c;line-height:1.2;white-space:nowrap;">
                  ৳${isBangla ? toBengaliNumber(tech.startingPrice) : tech.startingPrice}
                </div>
                <div style="font-size:10.5px;color:#a1a1aa;font-weight:500;margin-top:3px;line-height:1;white-space:nowrap;">
                  ${isBangla ? 'শুরু মূল্য' : 'Starting'}
                </div>
              </div>
            </div>

            <!-- Row 4: Action Buttons -->
            <div style="display:flex;gap:10px;align-items:center;">
              <button id="map-prof-${tech.id}" data-map-action="profile" data-tech-id="${tech.id}" type="button" style="flex:1;background:#202024;color:#ffffff;border:1px solid #3f3f46;border-radius:12px;padding:10px 8px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background 0.15s ease;box-sizing:border-box;">
                <span>${isBangla ? 'প্রোফাইল দেখুন' : 'View Profile'}</span>
                <span style="color:#f97316;font-size:14px;font-weight:800;">→</span>
              </button>
              <button id="map-book-${tech.id}" data-map-action="book" data-tech-id="${tech.id}" type="button" style="flex:1;background:linear-gradient(135deg,#ea580c 0%,#f97316 100%);color:#ffffff;border:none;border-radius:12px;padding:10px 8px;font-size:14px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(234,88,12,0.4);transition:opacity 0.15s ease;box-sizing:border-box;">
                ${isBangla ? 'বুক করুন' : 'Book Now'}
              </button>
            </div>
          </div>
        `;

        marker.bindTooltip(tooltipHtml, {
          direction: 'auto',
          offset: [0, -15],
          opacity: 1,
          interactive: true,
          className: 'custom-leaflet-tech-tooltip'
        });

        markerInstancesRef.current.set(tech.id, marker);

        marker.on('tooltipopen', () => {
          const profBtn = document.getElementById(`map-prof-${tech.id}`);
          const bookBtn = document.getElementById(`map-book-${tech.id}`);
          if (profBtn) {
            profBtn.onclick = (e) => {
              e.stopPropagation();
              e.preventDefault();
              setActivePopupTechId(tech.id);
              if (onSelectTechnicianRef.current) onSelectTechnicianRef.current(tech);
              navigate(`/professionals/${tech.id}`);
            };
          }
          if (bookBtn) {
            bookBtn.onclick = (e) => {
              e.stopPropagation();
              e.preventDefault();
              navigate(`/book?technicianId=${tech.id}&service=${tech.skills[0] || 'electrical'}`);
            };
          }
        });

        marker.on('click', () => {
          setActivePopupTechId(tech.id);
          if (onSelectTechnicianRef.current) onSelectTechnicianRef.current(tech);
          marker.openTooltip();
          mapInstanceRef.current?.flyTo([tLat, tLng], Math.max(map.getZoom(), 14), {
            duration: 0.45
          });
        });

        marker.addTo(markersLayer);

        if (isActive) {
          marker.openTooltip();
        }
      });
    } else {
      // HEATMAP MODE Zones
      DHAKA_HEATMAP_ZONES.forEach((zone) => {
        if (!Number.isFinite(zone.lat) || !Number.isFinite(zone.lng)) return;

        L.circle([zone.lat, zone.lng], {
          radius: 1200 + zone.demandScore * 8,
          color: '#ea580c',
          weight: 1.5,
          opacity: 0.5,
          fillColor: '#f97316',
          fillOpacity: 0.2,
          interactive: false
        }).addTo(overlayLayer);

        const labelText = isBangla ? zone.nameBn.split('(')[0].trim() : zone.nameEn.split('(')[0].trim();
        const zoneIcon = L.divIcon({
          className: 'custom-leaflet-marker-clean',
          html: `
            <div style="display:inline-flex;align-items:center;gap:5px;background:#ea580c;color:#ffffff;padding:5px 11px;border-radius:9999px;font-size:11px;font-weight:800;box-shadow:0 8px 18px rgba(0,0,0,0.32);border:2px solid #ffffff;white-space:nowrap;cursor:pointer;transform:translate(-50%,-50%);">
              <span style="width:6px;height:6px;background:#ffffff;border-radius:50%;"></span>
              <span>${labelText}</span>
              <span style="background:rgba(0,0,0,0.32);padding:1px 6px;border-radius:9999px;font-size:9px;">${isBangla ? toBengaliNumber(zone.demandScore) : zone.demandScore}%</span>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const zLat = Number(zone.lat);
        const zLng = Number(zone.lng);
        if (!Number.isFinite(zLat) || !Number.isFinite(zLng)) return;

        const marker = L.marker([zLat, zLng], { icon: zoneIcon });
        marker.on('click', () => {
          setSearchQuery('');
          setRadiusKm(10);
          setMapMode('PROS');
          focusLocation(zLat, zLng, isBangla ? zone.nameBn : zone.nameEn, 14);
        });

        marker.addTo(markersLayer);
      });
    }
  }, [
    filteredTechnicians,
    searchOrigin.lat,
    searchOrigin.lng,
    radiusKm,
    mapMode,
    activePopupTechId,
    isDark,
    isBangla
  ]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        focusLocation(
          pos.coords.latitude,
          pos.coords.longitude,
          isBangla ? 'আপনার বর্তমান অবস্থান' : 'Your GPS Location',
          14
        );
      },
      () => {
        setIsLocating(false);
        focusLocation(DHAKA_CENTER.lat, DHAKA_CENTER.lng, isBangla ? 'ঢাকা কেন্দ্র' : 'Dhaka Center', 13);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setRadiusKm(15);
    setOnlyAvailable(false);
    setSelectedDistrictId('all');
    setActivePopupTechId(null);
    focusLocation(DHAKA_CENTER.lat, DHAKA_CENTER.lng, isBangla ? 'ঢাকা কেন্দ্র' : 'Dhaka Center', 12);
  };

  const handleSelectTechnician = (tech: Technician) => {
    setActivePopupTechId(tech.id);
    if (onSelectTechnician) onSelectTechnician(tech);
    navigate(`/professionals/${tech.id}`);
  };

  const handleAiDiagnosisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiProblemQuery.trim()) return;

    setIsDiagnosing(true);
    setAiDiagnosis(null);
    try {
      const result = await diagnoseWithAI(aiProblemQuery, categories);
      setAiDiagnosis(result);
      const catId = result?.categoryId || detectServiceCategoryFromQuery(aiProblemQuery);
      if (catId) {
        setSelectedCategory(catId);
      }
    } catch {
      const fallbackCat = detectServiceCategoryFromQuery(aiProblemQuery);
      if (fallbackCat) setSelectedCategory(fallbackCat);
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-stone-200 dark:bg-zinc-900 shadow-xl ${className}`}
      style={{ height }}
    >
      {/* Top Control Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[450] flex flex-col gap-2 pointer-events-none">
        {/* Row 1: Search, AI Doctor, Pros/Hotspots Toggle */}
        <div className="pointer-events-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBangla ? 'মিরপুর, এসি সার্ভিস, প্লাম্বার খুঁজুন...' : 'Search area, service, or pro...'}
                className="w-full pl-9 pr-7 py-2 rounded-xl bg-stone-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{isBangla ? 'এআই ডায়াগনোসিস' : 'AI Doctor'}</span>
              <span className="xs:hidden">{isBangla ? 'AI' : 'AI'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center p-1 rounded-xl bg-stone-100 dark:bg-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setMapMode('PROS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  mapMode === 'PROS' ? 'bg-orange-600 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {isBangla ? 'টেকনিশিয়ান' : 'Pros'}
              </button>
              <button
                type="button"
                onClick={() => setMapMode('HEATMAP')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  mapMode === 'HEATMAP' ? 'bg-orange-600 text-white shadow-xs' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {isBangla ? 'হটস্পট জোন' : 'Hotspots'}
              </button>
            </div>

            {showListToggle && (
              <button
                type="button"
                onClick={() => setShowProsDrawer((v) => !v)}
                className="px-2.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 border border-zinc-700"
              >
                <List className="w-3.5 h-3.5 text-orange-400" />
                <span>{isBangla ? toBengaliNumber(filteredTechnicians.length) : filteredTechnicians.length}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Bangladesh Area Quick Chips + Filters */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/92 dark:bg-zinc-900/92 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-lg text-[11px]">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold text-[11px] focus:outline-none cursor-pointer"
          >
            <option value="all">{isBangla ? 'সকল ক্যাটাগরি' : 'All Services'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {isBangla ? c.nameBn : c.nameEn}
              </option>
            ))}
          </select>

          {/* Bangladesh 64 Districts Selector */}
          <select
            value={selectedDistrictId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedDistrictId(id);
              if (id === 'all') {
                setRadiusKm(300);
                focusLocation(23.7806, 90.398, isBangla ? 'সমগ্র বাংলাদেশ' : 'All Bangladesh', 7);
              } else {
                const dist = BANGLADESH_DISTRICTS.find((d) => d.id === id);
                if (dist) {
                  setRadiusKm(35);
                  focusLocation(dist.lat, dist.lng, isBangla ? dist.nameBn : dist.nameEn, 12);
                }
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold text-[11px] focus:outline-none cursor-pointer"
          >
            <option value="all">{isBangla ? '৬৪ জেলা (বাংলাদেশ)' : 'All 64 Districts'}</option>
            {BANGLADESH_DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {isBangla ? d.nameBn : d.nameEn}
              </option>
            ))}
          </select>

          {/* Radius Selector */}
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold text-[11px] focus:outline-none cursor-pointer"
          >
            <option value={5}>{isBangla ? '৫ কিমি ব্যাসার্ধ' : '5 km radius'}</option>
            <option value={10}>{isBangla ? '১০ কিমি ব্যাসার্ধ' : '10 km radius'}</option>
            <option value={15}>{isBangla ? '১৫ কিমি ব্যাসার্ধ' : '15 km radius'}</option>
            <option value={35}>{isBangla ? '৩৫ কিমি ব্যাসার্ধ' : '35 km radius'}</option>
            <option value={300}>{isBangla ? 'সারা বাংলাদেশ' : 'All Bangladesh'}</option>
          </select>

          {/* Available Only Toggle */}
          <button
            type="button"
            onClick={() => setOnlyAvailable((v) => !v)}
            className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
              onlyAvailable
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {isBangla ? '● ফ্রি মিস্ত্রি' : '● Available Now'}
          </button>

          {/* Sort Option */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="hidden md:block px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold text-[11px] focus:outline-none cursor-pointer"
          >
            <option value="recommended">{isBangla ? 'সেরা ম্যাচ' : 'Recommended'}</option>
            <option value="nearest">{isBangla ? 'নিকটতম দূরত্ব' : 'Nearest First'}</option>
            <option value="rating">{isBangla ? 'সর্বোচ্চ রেটিং' : 'Top Rated'}</option>
            <option value="price">{isBangla ? 'কম ভিজিট চার্জ' : 'Lowest Price'}</option>
          </select>

          {/* Quick Bangladesh/Dhaka Area Chips */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-[140px]">
            {QUICK_BD_HUBS.map((hub) => (
              <button
                key={hub.id}
                type="button"
                onClick={() => {
                  setSelectedDistrictId('all');
                  if (radiusKm >= 250) setRadiusKm(15);
                  focusLocation(hub.lat, hub.lng, isBangla ? hub.nameBn : hub.nameEn, hub.zoom);
                }}
                className={`px-2 py-0.5 rounded-lg font-bold whitespace-nowrap border transition-colors cursor-pointer ${
                  selectedLocationName === (isBangla ? hub.nameBn : hub.nameEn)
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-stone-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-orange-500/50'
                }`}
              >
                {isBangla ? hub.nameBn : hub.nameEn}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            title={isBangla ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
            className="p-1.5 rounded-lg bg-stone-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-orange-600 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Right Floating Map Tools (Layer Switcher, GPS Locate, Zoom, Recenter) */}
      <div className="absolute bottom-6 right-4 z-[450] flex flex-col items-end gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu((v) => !v)}
            className="p-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 shadow-xl hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title={isBangla ? 'ম্যাপের ধরন' : 'Map Layers'}
          >
            <Layers className="w-4 h-4 text-orange-500" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 bottom-12 w-48 rounded-2xl bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1.5 space-y-1 z-[500]">
              {(Object.keys(TILE_CONFIGS) as TileLayerType[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setManualTileLayer(key);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    tileLayerType === key
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

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="p-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 text-blue-600 dark:text-blue-400 shadow-xl hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
          title={isBangla ? 'আমার বর্তমান জিপিএস অবস্থান' : 'Locate Me via GPS'}
        >
          <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
        </button>

        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-xl hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-xl hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => focusLocation(DHAKA_CENTER.lat, DHAKA_CENTER.lng, isBangla ? 'ঢাকা কেন্দ্র' : 'Dhaka Center', 12)}
          className="p-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-xl hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
          title={isBangla ? 'ঢাকা কেন্দ্রে ফিরুন' : 'Recenter Dhaka'}
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsible Nearby Pros List Drawer */}
      {showProsDrawer && (
        <div className="absolute top-32 sm:top-28 left-3 bottom-6 w-[calc(100%-1.5rem)] sm:w-80 z-[460] bg-white/97 dark:bg-zinc-900/97 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="text-xs font-extrabold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>
                {isBangla
                  ? `${toBengaliNumber(filteredTechnicians.length)} জন ভেরিফাইড মিস্ত্রি`
                  : `${filteredTechnicians.length} Verified Pros Nearby`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowProsDrawer(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredTechnicians.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 space-y-2">
                <p>{isBangla ? 'এই এলাকায় বা ফিল্টারে কোনো মিস্ত্রি পাওয়া যায়নি।' : 'No technicians matched current filters.'}</p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold text-xs cursor-pointer"
                >
                  {isBangla ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                </button>
              </div>
            ) : (
              filteredTechnicians.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => {
                    setActivePopupTechId(tech.id);
                    if (onSelectTechnician) onSelectTechnician(tech);
                    mapInstanceRef.current?.flyTo([tech.latitude, tech.longitude], 14, { duration: 0.5 });
                    const m = markerInstancesRef.current.get(tech.id);
                    if (m) m.openTooltip();
                    if (window.innerWidth < 640) setShowProsDrawer(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer ${
                    activePopupTechId === tech.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-orange-500/40 bg-stone-50/70 dark:bg-zinc-950/60'
                  }`}
                >
                  <img
                    src={tech.avatar}
                    alt={tech.name}
                    className="w-10 h-10 rounded-xl object-cover border border-orange-500/40 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-zinc-900 dark:text-white truncate">{tech.name}</span>
                      <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 shrink-0">
                        ৳{isBangla ? toBengaliNumber(tech.startingPrice) : tech.startingPrice}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      {tech.primaryArea} · {formatDistance(tech.distance, isBangla)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      <span className="text-amber-500 font-bold">★ {tech.rating}</span>
                      <span className={tech.availability === 'available' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-500'}>
                        {tech.availability === 'available' ? (isBangla ? '● ফ্রি' : '● Free') : (isBangla ? '● ব্যস্ত' : '● Busy')}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* AI Doctor Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                  {isBangla ? 'এআই সার্ভিস ডায়াগনোসিস ও মিস্ত্রি ফাইন্ডার' : 'AI Service Diagnosis & Pro Finder'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAiDiagnosisSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {isBangla
                    ? 'আপনার কি সমস্যা হচ্ছে তা লিখুন (যেমন: এসি ঠান্ডা হচ্ছে না, পাইপ লিক):'
                    : 'Describe your problem (e.g. AC not cooling, water leak):'}
                </label>
                <textarea
                  value={aiProblemQuery}
                  onChange={(e) => setAiProblemQuery(e.target.value)}
                  rows={3}
                  placeholder={isBangla ? 'এখানে বিস্তারিত লিখুন...' : 'Type problem details here...'}
                  className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={isDiagnosing || !aiProblemQuery.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black text-xs shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isDiagnosing
                  ? isBangla
                    ? 'বিশ্লেষণ করা হচ্ছে...'
                    : 'Analyzing with AI...'
                  : isBangla
                  ? 'এআই সমাধান ও মিস্ত্রি খুঁজুন'
                  : 'Diagnose & Find Pro'}
              </button>
            </form>

            {aiDiagnosis && (
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-500/40 space-y-2 text-xs">
                <div className="font-black text-orange-700 dark:text-orange-300">
                  {isBangla ? aiDiagnosis.reasoningBn : aiDiagnosis.reasoningEn}
                </div>
                <div className="text-zinc-600 dark:text-zinc-300">
                  <span className="font-bold">{isBangla ? 'প্রস্তাবিত সার্ভিস:' : 'Suggested Service:'}</span>{' '}
                  {isBangla ? aiDiagnosis.categoryNameBn : aiDiagnosis.categoryNameEn}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="mt-1 px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold text-xs cursor-pointer"
                >
                  {isBangla ? 'ম্যাপে এই মিস্ত্রিদের দেখুন' : 'Show Matching Pros on Map'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
