import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import {
  Search,
  Navigation,
  Layers,
  Flame,
  Users,
  Filter,
  Star,
  ShieldCheck,
  Zap,
  Clock,
  RotateCcw,
  X,
  Phone,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Info,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Technician } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { diagnoseWithAI } from '../../services/geminiService';
import { DiagnosisResult } from '../../services/problemDiagnosis';
import {
  DHAKA_CENTER,
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
type TileLayerType = 'THEMED' | 'SATELLITE' | 'TERRAIN';
type SortOption = 'recommended' | 'nearest' | 'rating' | 'experience' | 'price' | 'available_first';

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

const MapController = ({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center && !isNaN(center.lat) && !isNaN(center.lng)) {
      map.panTo(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
};

export const TechnicianMap: React.FC<TechnicianMapProps> = ({
  mode = 'standalone',
  initialCategory = 'all',
  initialRadiusKm = 10,
  height = 'calc(100vh - 120px)',
  onSelectTechnician,
  selectedTechId: externalSelectedTechId,
  className = ''
}) => {
  const { technicians, categories } = useApp();
  const { isBangla } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  // State
  const [mapMode, setMapMode] = useState<MapMode>('PROS');
  const [tileType, setTileType] = useState<TileLayerType>('THEMED');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'busy' | 'emergency'>('all');
  const [distanceRadiusKm, setDistanceRadiusKm] = useState<number>(initialRadiusKm);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  // User Geolocation
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationToast, setLocationToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Selected Technician & Popup
  const [selectedTechId, setSelectedTechId] = useState<string | null>(externalSelectedTechId || null);
  const [activePopupTechId, setActivePopupTechId] = useState<string | null>(null);

  // Dynamic Camera Center & Zoom state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: DHAKA_CENTER.lat, lng: DHAKA_CENTER.lng });
  const [zoomLevel, setZoomLevel] = useState<number>(12);

  // Gemini AI Smart Diagnostics State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<DiagnosisResult | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);

  // Sync external selection if prop changes
  useEffect(() => {
    if (externalSelectedTechId && externalSelectedTechId !== selectedTechId) {
      setSelectedTechId(externalSelectedTechId);
      setActivePopupTechId(externalSelectedTechId);
      const matched = technicians.find(t => t.id === externalSelectedTechId);
      if (matched && matched.latitude && matched.longitude) {
        setMapCenter({ lat: matched.latitude, lng: matched.longitude });
        setZoomLevel(15);
      }
    }
  }, [externalSelectedTechId]);

  // Request user location safely
  useEffect(() => {
    handleRequestLocation(false);
  }, []);

  // Geolocation Handler
  const handleRequestLocation = (showErrorToast = true) => {
    if (!navigator.geolocation) {
      if (showErrorToast) {
        setLocationToast({
          message: isBangla ? 'আপনার ব্রাউজারে লোকেশন সার্ভিস সমর্থিত নয়।' : 'Geolocation is not supported by your browser.',
          type: 'error'
        });
      }
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
          setUserLocation({ lat: latitude, lng: longitude, accuracy });
          setMapCenter({ lat: latitude, lng: longitude });
          setZoomLevel(14);
          setIsLocating(false);

          setLocationToast({
            message: isBangla ? 'আপনার বর্তমান অবস্থান সফলভাবে চিহ্নিত হয়েছে।' : 'Current location detected successfully.',
            type: 'success'
          });
        } else {
          setIsLocating(false);
          if (showErrorToast) {
            setLocationToast({
              message: isBangla ? 'সঠিক লোকেশন পাওয়া যায়নি।' : 'Invalid location received.',
              type: 'error'
            });
          }
        }
      },
      (err) => {
        setIsLocating(false);
        if (showErrorToast) {
          let msg = isBangla ? 'লোকেশন অ্যাক্সেস পাওয়া যায়নি। ঢাকার কেন্দ্রস্থল প্রদর্শিত হচ্ছে।' : 'Location permission denied. Showing central Dhaka.';
          if (err.code === 2) {
            msg = isBangla ? 'লোকেশন সিগন্যাল পাওয়া যায়নি।' : 'Location signal unavailable.';
          }
          setLocationToast({ message: msg, type: 'info' });
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Toast Auto-clear
  useEffect(() => {
    if (locationToast) {
      const timer = setTimeout(() => setLocationToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [locationToast]);

  // Keyword-based auto-suggestion
  useEffect(() => {
    if (searchQuery.trim().length > 3) {
      const detected = detectServiceCategoryFromQuery(searchQuery);
      setDetectedCategory(detected);
    } else {
      setDetectedCategory(null);
    }
  }, [searchQuery]);

  // AI Diagnostic Search Trigger
  const handleAIDiagnosis = async () => {
    if (!searchQuery.trim()) {
      setLocationToast({
        message: isBangla ? 'প্রথমে আপনার সমস্যাটি লিখে জানান!' : 'Please describe your problem first!',
        type: 'info'
      });
      return;
    }

    setIsDiagnosing(true);
    setAiDiagnosis(null);
    try {
      const result = await diagnoseWithAI(searchQuery, categories);
      setAiDiagnosis(result);
      if (result.categoryId && result.categoryId !== 'other_services') {
        setSelectedCategory(result.categoryId);
        const categoryPros = technicians.filter(t => t.skills.includes(result.categoryId));
        if (categoryPros.length > 0) {
          const firstPro = categoryPros[0];
          setMapCenter({ lat: firstPro.latitude || DHAKA_CENTER.lat, lng: firstPro.longitude || DHAKA_CENTER.lng });
          setZoomLevel(13.5);
        }
      }
      setLocationToast({
        message: isBangla ? 'Servexa AI সমস্যা সফলভাবে বিশ্লেষণ করেছে।' : 'Servexa AI successfully analyzed your issue.',
        type: 'success'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Filter and Sort Technicians
  const filteredTechnicians = useMemo(() => {
    const centerLat = userLocation?.lat || DHAKA_CENTER.lat;
    const centerLng = userLocation?.lng || DHAKA_CENTER.lng;

    return technicians
      .map(tech => {
        const tLat = tech.latitude || DHAKA_CENTER.lat;
        const tLng = tech.longitude || DHAKA_CENTER.lng;
        const distKm = calculateHaversineDistance(centerLat, centerLng, tLat, tLng);
        const recScore = calculateRecommendationScore(tech, centerLat, centerLng);
        const recReasons = getRecommendationReasons(tech, centerLat, centerLng, isBangla);

        return {
          ...tech,
          calculatedDistanceKm: distKm,
          recommendationScore: recScore,
          recommendationReasons: recReasons
        };
      })
      .filter(tech => {
        if (selectedCategory !== 'all') {
          const hasSkill = tech.skills.includes(selectedCategory);
          if (!hasSkill) return false;
        }

        if (distanceRadiusKm < 50 && tech.calculatedDistanceKm > distanceRadiusKm) {
          return false;
        }

        if (availabilityFilter === 'available' && tech.availability !== 'available') return false;
        if (availabilityFilter === 'busy' && tech.availability !== 'busy') return false;
        if (availabilityFilter === 'emergency' && !tech.emergencyAvailable) return false;

        if (minRating > 0 && tech.rating < minRating) return false;

        if (tech.startingPrice > maxPrice) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatches = tech.name.toLowerCase().includes(q);
          const areaMatches = tech.primaryArea.toLowerCase().includes(q) || tech.serviceAreas.some(a => a.toLowerCase().includes(q));
          const bioMatches = tech.bioEn.toLowerCase().includes(q) || tech.bioBn.includes(q);
          const skillMatches = tech.skills.some(s => s.toLowerCase().includes(q));

          if (!nameMatches && !areaMatches && !bioMatches && !skillMatches) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recommended') return b.recommendationScore - a.recommendationScore;
        if (sortBy === 'nearest') return a.calculatedDistanceKm - b.calculatedDistanceKm;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
        if (sortBy === 'price') return a.startingPrice - b.startingPrice;
        if (sortBy === 'available_first') {
          if (a.availability === 'available' && b.availability !== 'available') return -1;
          if (b.availability === 'available' && a.availability !== 'available') return 1;
          return b.rating - a.rating;
        }
        return 0;
      });
  }, [technicians, userLocation, selectedCategory, distanceRadiusKm, availabilityFilter, minRating, maxPrice, searchQuery, sortBy, isBangla]);

  // Grouped clusters for Heatmap Mode
  const heatmapClusters = useMemo(() => {
    const areaClusters: Record<string, { lat: number; lng: number; count: number; name: string }> = {};
    filteredTechnicians.forEach(tech => {
      const areaKey = tech.primaryArea || 'Dhaka';
      if (!areaClusters[areaKey]) {
        areaClusters[areaKey] = {
          lat: tech.latitude || DHAKA_CENTER.lat,
          lng: tech.longitude || DHAKA_CENTER.lng,
          count: 0,
          name: tech.primaryArea
        };
      }
      areaClusters[areaKey].count += 1;
    });
    return Object.values(areaClusters);
  }, [filteredTechnicians]);

  const handleSelectTechnician = (tech: Technician) => {
    setSelectedTechId(tech.id);
    setActivePopupTechId(tech.id);
    if (onSelectTechnician) onSelectTechnician(tech);

    if (tech.latitude && tech.longitude) {
      setMapCenter({ lat: tech.latitude, lng: tech.longitude });
      setZoomLevel(15);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setAvailabilityFilter('all');
    setDistanceRadiusKm(25);
    setMinRating(0);
    setMaxPrice(5000);
    setSearchQuery('');
    setSortBy('recommended');
    setDetectedCategory(null);
    setAiDiagnosis(null);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 1, 10));
  const handleRecenter = () => {
    setMapCenter({ lat: DHAKA_CENTER.lat, lng: DHAKA_CENTER.lng });
    setZoomLevel(12);
  };

  const currentMapTypeId = tileType === 'SATELLITE' ? 'hybrid' : tileType === 'TERRAIN' ? 'terrain' : 'roadmap';

  return (
    <div
      className={`kormigo-technician-map-root relative flex flex-col w-full h-full min-h-[500px] overflow-hidden ${className}`}
      style={{ height: height, minHeight: typeof height === 'number' ? `${height}px` : height }}
    >
      
      {/* Toast Notification */}
      {locationToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[2000] px-4 py-2 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 backdrop-blur-md animate-in slide-in-from-top-4 duration-200 bg-white/95 dark:bg-zinc-900/95 border border-orange-500/40 text-zinc-900 dark:text-zinc-100">
          <Navigation className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span>{locationToast.message}</span>
          <button onClick={() => setLocationToast(null)} className="ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">✕</button>
        </div>
      )}

      {/* FLOATING TOP FILTER & CONTROL BAR */}
      <div className="relative z-[1000] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Smart Problem Search Input with AI Diagnosis Button */}
          <div className="relative flex-1 min-w-[200px] max-w-xl flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBangla ? 'কী সেবা প্রয়োজন? যেমন: পাইপ লিক, এসি...' : 'What service do you need? e.g. pipe leak, AC...'}
                className="w-full pl-8 pr-7 py-1.5 sm:py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs">✕</button>
              )}
            </div>

            {/* AI Diagnosis Search Button */}
            <button
              onClick={handleAIDiagnosis}
              disabled={isDiagnosing}
              title={isBangla ? 'সমস্যা বিশ্লেষণ করুন' : 'AI Diagnostic Search'}
              className="py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center gap-1 shrink-0 transition-all shadow-md shadow-orange-500/10 cursor-pointer active:scale-95 disabled:opacity-75"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isBangla ? 'এআই ডায়াগনোসিস' : 'AI Diagnosis'}</span>
              <span className="sm:hidden">{isBangla ? 'এআই' : 'AI'}</span>
            </button>
          </div>

          {/* Quick Dropdown Selectors on Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">{isBangla ? 'সব সেবা (All Services)' : 'All Services'}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {CATEGORY_VISUAL_MAP[cat.id]?.emoji || '🔧'} {isBangla ? cat.nameBn : cat.nameEn}
                </option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">{isBangla ? 'সকল প্রাপ্যতা' : 'All Availability'}</option>
              <option value="available">🟢 {isBangla ? 'এখনই এভেইলেবল' : 'Available Now'}</option>
              <option value="busy">🟡 {isBangla ? 'কাজে ব্যস্ত' : 'Busy'}</option>
              <option value="emergency">⚡ {isBangla ? 'জরুরি প্রস্তুত' : 'Emergency Ready'}</option>
            </select>

            <select
              value={distanceRadiusKm}
              onChange={(e) => setDistanceRadiusKm(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value={1}>{isBangla ? '১ কিমি ভেতরে' : 'Within 1 km'}</option>
              <option value={3}>{isBangla ? '৩ কিমি ভেতরে' : 'Within 3 km'}</option>
              <option value={5}>{isBangla ? '৫ কিমি ভেতরে' : 'Within 5 km'}</option>
              <option value={10}>{isBangla ? '১০ কিমি ভেতরে' : 'Within 10 km'}</option>
              <option value={25}>{isBangla ? '২৫ কিমি ভেতরে' : 'Within 25 km'}</option>
              <option value={50}>{isBangla ? 'পুরো ঢাকা মেট্রো' : 'All Dhaka'}</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="recommended">⭐ {isBangla ? 'সেরা প্রস্তাবিত' : 'Recommended'}</option>
              <option value="nearest">📍 {isBangla ? 'সবচেয়ে কাছে' : 'Nearest First'}</option>
              <option value="rating">★ {isBangla ? 'উচ্চ রেটিং' : 'Highest Rated'}</option>
              <option value="available_first">🟢 {isBangla ? 'এভেইলেবল আগে' : 'Available First'}</option>
              <option value="price">৳ {isBangla ? 'কম খরচ' : 'Lowest Price'}</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-stone-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setMapMode('PROS')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  mapMode === 'PROS' ? 'bg-orange-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isBangla ? 'পেশাজীবী পিন' : 'Pros'}</span>
              </button>
              <button
                onClick={() => setMapMode('HEATMAP')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  mapMode === 'HEATMAP' ? 'bg-orange-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isBangla ? 'হিটম্যাপ' : 'Density'}</span>
              </button>
            </div>

            <button
              onClick={() => handleRequestLocation(true)}
              className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isBangla ? 'আমার অবস্থান' : 'My Location'}</span>
            </button>

            <button onClick={() => setShowFilterDrawer(true)} className="lg:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-700 hover:text-orange-500">
              <Filter className="w-4 h-4" />
            </button>

            {(selectedCategory !== 'all' || availabilityFilter !== 'all' || searchQuery || distanceRadiusKm < 25 || aiDiagnosis) && (
              <button onClick={handleResetFilters} className="p-2 rounded-xl text-zinc-400 hover:text-orange-500 transition-colors" title={isBangla ? 'রিসেট' : 'Reset'}>
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Professionals Count Bar */}
        <div className="flex items-center justify-between text-xs mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              {isBangla
                ? `ম্যাপে ${toBengaliNumber(filteredTechnicians.length)} জন প্রস্তুত পেশাজীবী প্রদর্শিত হচ্ছে`
                : `Showing ${filteredTechnicians.length} active professionals on live map`}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {isBangla ? 'যেকোনো মার্কারে ক্লিক করে সরাসরি বুকিং করুন' : 'Click any marker to view details & book'}
          </span>
        </div>
      </div>

      {/* FULL-WIDTH MAP VIEWPORT CONTAINER */}
      <div className="relative flex-1 w-full h-full min-h-[450px] overflow-hidden">
        
        {/* Real Google Maps Provider & Viewport */}
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <div className="w-full h-full absolute inset-0 z-0">
            <Map
              mapId="DEMO_MAP_ID"
              style={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={zoomLevel}
              onCenterChanged={(e) => { if (e.detail.center) setMapCenter(e.detail.center); }}
              onZoomChanged={(e) => { if (typeof e.detail.zoom === 'number') setZoomLevel(e.detail.zoom); }}
              gestureHandling="greedy"
              disableDefaultUI
              mapTypeId={currentMapTypeId}
              styles={isDark && tileType === 'THEMED' ? DARK_MAP_STYLE : []}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              <MapController center={mapCenter} zoom={zoomLevel} />

              {/* Heatmap density mode visualization */}
              {mapMode === 'HEATMAP' && heatmapClusters.map((cluster, i) => {
                const intensity = Math.min(cluster.count / 4, 1);
                const color = intensity > 0.6 ? '#dc2626' : intensity > 0.3 ? '#ea580c' : '#f59e0b';

                return (
                  <AdvancedMarker
                    key={i}
                    position={{ lat: cluster.lat, lng: cluster.lng }}
                  >
                    <div className="flex items-center justify-center relative select-none">
                      <div className="absolute rounded-full animate-pulse" style={{ width: '90px', height: '90px', backgroundColor: color, opacity: 0.35 }} />
                      <div className="absolute rounded-full" style={{ width: '24px', height: '24px', backgroundColor: color, opacity: 0.7 }} />
                      
                      <div className="absolute flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-600 border border-white text-white text-xs font-black shadow-2xl whitespace-nowrap" style={{ transform: 'translate(-50%, -100%)', top: '-12px' }}>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>{cluster.name}</span>
                        <span className="bg-black/40 px-1.5 py-0.5 rounded-full text-[10px] font-mono">{cluster.count} {isBangla ? 'জন' : 'pros'}</span>
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* User Location Marker */}
              {userLocation && !isNaN(userLocation.lat) && !isNaN(userLocation.lng) && (
                <AdvancedMarker
                  position={{ lat: userLocation.lat, lng: userLocation.lng }}
                >
                  <div className="relative flex items-center justify-center" style={{ transform: 'translate(0, 0)' }}>
                    <span className="absolute w-10 h-10 rounded-full bg-orange-500 opacity-60 animate-ping"></span>
                    <div className="relative w-6 h-6 rounded-full bg-orange-600 border-2 border-white shadow-2xl flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                    </div>
                  </div>
                </AdvancedMarker>
              )}

              {/* Normal pros markers mode */}
              {mapMode === 'PROS' && filteredTechnicians.map(tech => {
                const lat = tech.latitude || DHAKA_CENTER.lat;
                const lng = tech.longitude || DHAKA_CENTER.lng;
                if (isNaN(lat) || isNaN(lng)) return null;

                const isSelected = selectedTechId === tech.id;
                const primarySkill = tech.skills[0] || 'other_services';
                const visualMeta = CATEGORY_VISUAL_MAP[primarySkill] || CATEGORY_VISUAL_MAP.other_services;

                const isAvailable = tech.availability === 'available';
                const isBusy = tech.availability === 'busy';
                const statusDotColor = isAvailable ? 'bg-emerald-500' : isBusy ? 'bg-amber-500' : 'bg-zinc-400';

                return (
                  <AdvancedMarker
                    key={tech.id}
                    position={{ lat, lng }}
                    onClick={() => handleSelectTechnician(tech)}
                  >
                    <div className="flex flex-col items-center cursor-pointer transition-transform duration-200 group" style={{ transform: 'translate(0, 0)' }}>
                      <div className={`relative w-10 h-10 rounded-2xl ${
                        isSelected
                          ? 'bg-orange-600 ring-4 ring-orange-500/60 scale-125 shadow-2xl text-white'
                          : 'bg-white dark:bg-zinc-900 border-2 border-orange-500 text-zinc-900 dark:text-white shadow-xl hover:scale-110'
                      } flex items-center justify-center`}>
                        <span className="text-base select-none">{visualMeta.emoji}</span>
                        <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${statusDotColor} border-2 border-white shadow-sm ${isAvailable ? 'animate-pulse' : ''}`} />
                      </div>
                      {/* Cost Tag */}
                      <div className="mt-1 px-1.5 py-0.5 rounded-md bg-zinc-950 text-white text-[9px] font-black font-mono tracking-tight shadow-md">
                        ৳{tech.startingPrice}
                      </div>
                      {/* Spike */}
                      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-zinc-950 -mt-0.5" />
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* Anchored InfoWindow Popup */}
              {activePopupTechId && technicians.find(t => t.id === activePopupTechId) && (() => {
                const tech = technicians.find(t => t.id === activePopupTechId)!;
                const lat = tech.latitude || DHAKA_CENTER.lat;
                const lng = tech.longitude || DHAKA_CENTER.lng;
                const primarySkill = tech.skills[0] || 'other_services';
                const visualMeta = CATEGORY_VISUAL_MAP[primarySkill] || CATEGORY_VISUAL_MAP.other_services;
                const categoryName = isBangla
                  ? (categories.find(c => c.id === primarySkill)?.nameBn || visualMeta.nameBn)
                  : (categories.find(c => c.id === primarySkill)?.nameEn || visualMeta.nameEn);

                return (
                  <InfoWindow
                    position={{ lat, lng }}
                    onCloseClick={() => {
                      setActivePopupTechId(null);
                      setSelectedTechId(null);
                    }}
                    maxWidth={320}
                  >
                    <div className="kormigo-popup-card p-3.5 max-w-[280px] text-zinc-900 font-sans">
                      <div className="flex items-start gap-3">
                        <img src={tech.avatar} alt={tech.name} className="w-12 h-12 rounded-xl object-cover border border-orange-500/30 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-sm text-zinc-900 flex items-center gap-1 leading-tight">
                            <span>{tech.name}</span>
                            {tech.platformVerified && <span className="text-[10px] text-blue-500 font-bold">✓</span>}
                          </h4>
                          <div className="flex items-center gap-1 mt-0.5 text-orange-600 text-xs font-bold">
                            <span>{visualMeta.emoji}</span>
                            <span className="truncate">{categoryName}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            📍 {formatDistance(calculateHaversineDistance(userLocation?.lat || DHAKA_CENTER.lat, userLocation?.lng || DHAKA_CENTER.lng, lat, lng), isBangla)} ({tech.primaryArea})
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 mt-3 py-1.5 bg-stone-50 border border-zinc-200/60 rounded-xl text-center text-[10px]">
                        <div>
                          <div className="font-bold text-amber-500">★ {tech.rating}</div>
                          <div className="text-[8px] text-zinc-400">{tech.reviewCount} reviews</div>
                        </div>
                        <div className="border-x border-zinc-200 px-1">
                          <div className="font-bold text-zinc-700">{tech.experienceYears} {isBangla ? 'বছর' : 'yrs'}</div>
                          <div className="text-[8px] text-zinc-400">experience</div>
                        </div>
                        <div>
                          <div className="font-bold text-orange-600">{tech.completedJobs}</div>
                          <div className="text-[8px] text-zinc-400">jobs done</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-zinc-100">
                        <button
                          onClick={() => navigate(`/professionals/${tech.id}`)}
                          className="w-full py-2 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-bold text-xs text-center cursor-pointer"
                        >
                          {isBangla ? 'প্রোফাইল' : 'Profile'}
                        </button>
                        <button
                          onClick={() => navigate(`/book?techId=${tech.id}`)}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs text-center shadow-md hover:from-orange-500 hover:to-amber-500 cursor-pointer"
                        >
                          {isBangla ? 'বুক করুন' : 'Book Now'}
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                );
              })()}
            </Map>
          </div>
        </APIProvider>

        {/* AI DIAGNOSIS FLOATING OVERLAY CARD (TOP-LEFT OF MAP) */}
        {aiDiagnosis && (
          <div className="absolute top-4 left-4 z-[950] max-w-sm bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-4 rounded-2xl border border-orange-500/40 shadow-2xl animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between gap-2 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-wider mb-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Servexa AI Diagnosis</span>
              </div>
              <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">{aiDiagnosis.confidence}% Match</span>
            </div>
            <p className="text-xs text-zinc-800 dark:text-zinc-200 font-bold leading-snug">
              {isBangla ? aiDiagnosis.reasoningBn : aiDiagnosis.reasoningEn}
            </p>
            {aiDiagnosis.keySymptoms && aiDiagnosis.keySymptoms.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {aiDiagnosis.keySymptoms.map((sym, idx) => (
                  <span key={idx} className="bg-orange-500/15 border border-orange-500/25 text-[10px] text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-lg font-bold">
                    🔍 {sym}
                  </span>
                ))}
              </div>
            )}
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span>Urgency: <span className="text-rose-600 uppercase font-black">{aiDiagnosis.recommendedUrgency}</span></span>
              <button onClick={() => setAiDiagnosis(null)} className="text-zinc-400 hover:text-rose-600 underline cursor-pointer">✕ Dismiss</button>
            </div>
          </div>
        )}

        {/* Floating Map Controls (Top Right) */}
        <div className="absolute top-4 right-4 z-[900] flex flex-col items-end gap-2">
          {/* Layer Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="p-2.5 rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-xl hover:text-orange-500 transition-colors cursor-pointer"
              title={isBangla ? 'ম্যাপ লেয়ার পরিবর্তন' : 'Change Map Layer'}
            >
              <Layers className="w-4 h-4" />
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5 space-y-1 text-xs font-semibold z-20">
                <button
                  onClick={() => { setTileType('THEMED'); setShowLayerMenu(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg cursor-pointer ${tileType === 'THEMED' ? 'bg-orange-500 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                >
                  🎨 {isDark ? 'Dark Theme' : 'Light Theme'}
                </button>
                <button
                  onClick={() => { setTileType('SATELLITE'); setShowLayerMenu(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg cursor-pointer ${tileType === 'SATELLITE' ? 'bg-orange-500 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                >
                  🛰️ Satellite
                </button>
                <button
                  onClick={() => { setTileType('TERRAIN'); setShowLayerMenu(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg cursor-pointer ${tileType === 'TERRAIN' ? 'bg-orange-500 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
                >
                  ⛰️ Terrain
                </button>
              </div>
            )}
          </div>

          {/* Zoom & Recenter Stack */}
          <div className="flex flex-col bg-white/95 dark:bg-zinc-900/95 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
            <button
              onClick={handleZoomIn}
              type="button"
              className="p-2.5 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              type="button"
              className="p-2.5 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleRecenter}
              type="button"
              className="p-2.5 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={isBangla ? 'ঢাকা সেন্টারে ফিরুন' : 'Recenter Dhaka'}
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floating Map Legend (Bottom Right) */}
        <div className="hidden sm:block absolute bottom-6 right-4 z-[900] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-2.5 shadow-lg text-[10px] space-y-1 max-w-[200px]">
          <div className="font-bold text-zinc-700 dark:text-zinc-300 pb-1 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span>{isBangla ? 'চিহ্ন পরিচিতি' : 'Map Legend'}</span>
            <span className="text-[9px] text-orange-500 font-mono">Servexa</span>
          </div>
          
          {mapMode === 'HEATMAP' ? (
            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>{isBangla ? 'উচ্চ চাহিদা ও কল' : 'High Surge Demand'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>{isBangla ? 'মাঝারি চাহিদা' : 'Moderate Activity'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>{isBangla ? 'এখনই প্রস্তুত (Available)' : 'Available Now'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600 flex items-center justify-center text-[7px] text-white">📍</span>
                <span>{isBangla ? 'আপনার অবস্থান (You)' : 'Your Location'}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MOBILE FILTER MODAL / DRAWER */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-sm h-full bg-white dark:bg-zinc-900 p-5 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">{isBangla ? 'ফিল্টার এবং অপশন' : 'Filters & Options'}</h3>
                <button onClick={() => setShowFilterDrawer(false)} className="p-1.5 text-zinc-400 hover:text-zinc-600">✕</button>
              </div>

              {/* Slider for Distance */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{isBangla ? 'দূরত্ব ব্যাসার্ধ:' : 'Distance Radius:'}</label>
                <div className="flex items-center justify-between text-sm font-black text-zinc-900 dark:text-white">
                  <span>{distanceRadiusKm < 50 ? `${toBengaliNumber(distanceRadiusKm)} কিমি` : (isBangla ? 'পুরো ঢাকা' : 'All Dhaka')}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={distanceRadiusKm}
                  onChange={(e) => setDistanceRadiusKm(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
              </div>

              {/* Sorting Options */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{isBangla ? 'সাজানোর ধরন:' : 'Sort By:'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['recommended', 'nearest', 'rating', 'price'] as SortOption[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setSortBy(opt)}
                      className={`p-2 rounded-xl text-xs font-bold border text-center capitalize cursor-pointer transition-colors ${
                        sortBy === opt ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFilterDrawer(false)}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              {isBangla ? 'ফিল্টার প্রয়োগ করুন' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
