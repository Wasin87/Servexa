import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
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
  ZoomOut,
  MapPin
} from 'lucide-react';
import { Technician } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { DHAKA_HEATMAP_ZONES } from '../../data/heatmapData';
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
  { elementType: "geometry", stylers: [{ color: "#181a20" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#121418" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#282d38" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#fb923c" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#fb923c" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#162822" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#34d399" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c3240" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1e222c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#111317" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ea580c" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#181a20" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#262b36" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1527" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#93c5fd" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#0c1527" }] },
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

export const DHAKA_LOCATIONS: { nameBn: string; nameEn: string; keywords: string[]; lat: number; lng: number; zoom: number }[] = [
  { nameBn: 'মিরপুর', nameEn: 'Mirpur', keywords: ['mirpur', 'মিরপুর', 'mirpur 10', 'mirpur 1', 'mirpur 2', 'mirpur 12', 'mirpur 11', 'dohs mirpur', 'pallabi', 'পল্লবী', 'shewrapara', 'শেওড়াপাড়া', 'kazipara', 'কাজীপাড়া', 'rokeya sarani'], lat: 23.8069, lng: 90.3687, zoom: 14.5 },
  { nameBn: 'উত্তরা', nameEn: 'Uttara', keywords: ['uttara', 'উত্তরা', 'uttora', 'sector 1', 'sector 3', 'sector 7', 'sector 10', 'sector 11', 'sector 12', 'sector 13', 'sector 14', 'diabari', 'দিয়াবাড়ি', 'airport', 'বিমানবন্দর', 'abdullahpur', 'আব্দুল্লাহপুর'], lat: 23.8759, lng: 90.3795, zoom: 14.5 },
  { nameBn: 'ধানমন্ডি', nameEn: 'Dhanmondi', keywords: ['dhanmondi', 'ধানমন্ডি', 'dhanmandi', 'kalabagan', 'কলাবাগান', 'shankhar', 'zigatola', 'জিগাতলা', 'panthapath', 'পান্থপথ', 'science lab', 'সাইন্স ল্যাব'], lat: 23.7461, lng: 90.3742, zoom: 14.8 },
  { nameBn: 'গুলশান', nameEn: 'Gulshan', keywords: ['gulshan', 'গুলশান', 'gulshan 1', 'gulshan 2', 'gulshan-1', 'gulshan-2', 'niketan', 'নিকেতন', 'police plaza'], lat: 23.7925, lng: 90.4078, zoom: 14.8 },
  { nameBn: 'বনানী', nameEn: 'Banani', keywords: ['banani', 'বনানী', 'banani dohs', 'chairman bari', 'kemal ataturk'], lat: 23.7937, lng: 90.4043, zoom: 14.8 },
  { nameBn: 'মোহাম্মদপুর', nameEn: 'Mohammadpur', keywords: ['mohammadpur', 'মোহাম্মদপুর', 'mohamadpur', 'adabor', 'আদাবর', 'salimullah', 'tajmahal road', 'tajmahal', 'bosila', 'বসিলা', 'ring road', 'town hall'], lat: 23.7658, lng: 90.3584, zoom: 14.8 },
  { nameBn: 'বাড্ডা', nameEn: 'Badda', keywords: ['badda', 'বাড্ডা', 'middle badda', 'north badda', 'south badda', 'merul badda', 'মেরুল বাড্ডা', 'aftabnagar', 'আফতাবনগর'], lat: 23.7805, lng: 90.4267, zoom: 14.2 },
  { nameBn: 'ফার্মগেট', nameEn: 'Farmgate', keywords: ['farmgate', 'ফার্মগেট', 'framgate', 'monipuripara', 'green road', 'গ্রিন রোড', 'kawran bazar', 'karwan bazar', 'কারওয়ান বাজার'], lat: 23.7570, lng: 90.3888, zoom: 14.8 },
  { nameBn: 'মহাখালী', nameEn: 'Mohakhali', keywords: ['mohakhali', 'মহাখালী', 'mohakhali dohs', 'wireless', 'ওয়ারলেস', 'amtoli'], lat: 23.7776, lng: 90.4054, zoom: 14.8 },
  { nameBn: 'মতিঝিল', nameEn: 'Motijheel', keywords: ['motijheel', 'মতিঝিল', 'dilkusha', 'দিলকুশা', 'paltan', 'পল্টন', 'kakrail', 'কাকরাইল', 'arambagh'], lat: 23.7330, lng: 90.4172, zoom: 14.8 },
  { nameBn: 'পুরান ঢাকা', nameEn: 'Old Dhaka', keywords: ['old dhaka', 'পুরান ঢাকা', 'lalbagh', 'লালবাগ', 'sadarghat', 'সদরঘাট', 'chawkbazar', 'চকবাজার', 'wari', 'ওয়ারী', 'sutrapur', 'সূত্রাপুর', 'armanitola'], lat: 23.7150, lng: 90.4020, zoom: 14.2 },
  { nameBn: 'বসুন্ধরা', nameEn: 'Bashundhara R/A', keywords: ['bashundhara', 'বসুন্ধরা', 'bashundhara r/a', 'bashundhara residential', 'kuratoli', 'baridhara', 'বারিধারা'], lat: 23.8151, lng: 90.4255, zoom: 14.5 },
  { nameBn: 'তেজগাঁও', nameEn: 'Tejgaon', keywords: ['tejgaon', 'তেজগাঁও', 'nabiket', 'industrial area', 'ইন্ডাস্ট্রিয়াল এরিয়া'], lat: 23.7639, lng: 90.3980, zoom: 14.5 },
  { nameBn: 'মালিবাগ ও খিলগাঁও', nameEn: 'Malibagh & Khilgaon', keywords: ['malibagh', 'মালিবাগ', 'khilgaon', 'খিলগাঁও', 'shantinagar', 'শান্তিনগর', 'mouchak', 'মৌচাক', 'goran', 'গোড়ান'], lat: 23.7480, lng: 90.4180, zoom: 14.2 },
  { nameBn: 'রামপুরা ও বনশ্রী', nameEn: 'Rampura & Banasree', keywords: ['rampura', 'রামপুরা', 'banasree', 'বনশ্রী', 'hatirjheel', 'হাতিরঝিল', 'aftab nagar'], lat: 23.7610, lng: 90.4280, zoom: 14.5 },
  { nameBn: 'কুড়িল ও খিলক্ষেত', nameEn: 'Kuril & Khilkhet', keywords: ['kuril', 'কুড়িল', 'khilkhet', 'খিলক্ষেত', 'nikunja', 'নিকুঞ্জ', 'le meridien'], lat: 23.8240, lng: 90.4220, zoom: 14.5 }
];

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
  const [hoveredTechId, setHoveredTechId] = useState<string | null>(null);
  const [hoveredClusterIndex, setHoveredClusterIndex] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Camera Center & Zoom state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: DHAKA_CENTER.lat, lng: DHAKA_CENTER.lng });
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  const [searchedLocationPin, setSearchedLocationPin] = useState<{ lat: number; lng: number; name: string } | null>(null);

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

  // Location / Service Search Handler (Pans map camera to searched Dhaka location or technician)
  const handleLocationOrServiceSearch = (rawQuery?: string) => {
    const raw = (rawQuery !== undefined ? rawQuery : searchQuery);
    const q = raw.toLowerCase().trim();
    const cleanQ = q.replace(/[-_,./]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanQ) {
      setLocationToast({
        message: isBangla ? 'অনুগ্রহ করে সার্ভিস বা ঢাকার এলাকার নাম লিখুন!' : 'Please enter a service or Dhaka area name!',
        type: 'info'
      });
      return;
    }

    // 1. Exact or partial match for popular Dhaka locations
    const matchedLoc = DHAKA_LOCATIONS.find(loc => {
      const bnMatch = loc.nameBn.includes(cleanQ) || cleanQ.includes(loc.nameBn);
      const enMatch = loc.nameEn.toLowerCase().includes(cleanQ) || cleanQ.includes(loc.nameEn.toLowerCase());
      const kwMatch = loc.keywords.some(k => {
        const cleanK = k.toLowerCase().replace(/[-_,./]/g, ' ').trim();
        return cleanQ.includes(cleanK) || cleanK.includes(cleanQ);
      });
      return bnMatch || enMatch || kwMatch;
    });

    if (matchedLoc) {
      setMapCenter({ lat: matchedLoc.lat, lng: matchedLoc.lng });
      setZoomLevel(matchedLoc.zoom || 15);
      setSearchedLocationPin({
        lat: matchedLoc.lat,
        lng: matchedLoc.lng,
        name: isBangla ? matchedLoc.nameBn : matchedLoc.nameEn
      });
      setLocationToast({
        message: isBangla
          ? `📍 ${matchedLoc.nameBn} এলাকায় ম্যাপ এবং লোকেশন আইকন মুভ করা হয়েছে!`
          : `📍 Map and location pin moved to ${matchedLoc.nameEn}!`,
        type: 'success'
      });
      return;
    }

    // 2. Check fallback Dhaka Heatmap zones
    const matchedZone = DHAKA_HEATMAP_ZONES.find(z =>
      z.nameEn.toLowerCase().includes(cleanQ) ||
      z.nameBn.includes(cleanQ) ||
      cleanQ.includes(z.nameEn.toLowerCase()) ||
      cleanQ.includes(z.nameBn)
    );

    if (matchedZone) {
      setMapCenter({ lat: matchedZone.lat, lng: matchedZone.lng });
      setZoomLevel(15);
      setSearchedLocationPin({
        lat: matchedZone.lat,
        lng: matchedZone.lng,
        name: isBangla ? matchedZone.nameBn : matchedZone.nameEn
      });
      setLocationToast({
        message: isBangla
          ? `📍 ${matchedZone.nameBn} এলাকায় ম্যাপ মুভ করা হয়েছে!`
          : `📍 Map moved to ${matchedZone.nameEn}!`,
        type: 'success'
      });
      return;
    }

    // 3. Check if query matches technician name or service area
    const matchedTech = technicians.find(t =>
      t.name.toLowerCase().includes(cleanQ) ||
      t.primaryArea.toLowerCase().includes(cleanQ) ||
      t.serviceAreas.some(a => a.toLowerCase().includes(cleanQ))
    );

    if (matchedTech && matchedTech.latitude && matchedTech.longitude) {
      setMapCenter({ lat: matchedTech.latitude, lng: matchedTech.longitude });
      setZoomLevel(15);
      setSelectedTechId(matchedTech.id);
      setActivePopupTechId(matchedTech.id);
      setSearchedLocationPin({
        lat: matchedTech.latitude,
        lng: matchedTech.longitude,
        name: `${matchedTech.name} (${matchedTech.primaryArea})`
      });
      setLocationToast({
        message: isBangla
          ? `👨‍🔧 ${matchedTech.name} (${matchedTech.primaryArea}) এর লোকেশনে পিন মুভ করা হয়েছে`
          : `👨‍🔧 Pinned at ${matchedTech.name} (${matchedTech.primaryArea})`,
        type: 'success'
      });
      return;
    }

    // 3. Category detection & nearest technician jump
    const detected = detectServiceCategoryFromQuery(q);
    if (detected && detected !== 'other_services') {
      setSelectedCategory(detected);
      const categoryPros = technicians.filter(t => t.skills.includes(detected));
      if (categoryPros.length > 0) {
        setMapCenter({ lat: categoryPros[0].latitude || DHAKA_CENTER.lat, lng: categoryPros[0].longitude || DHAKA_CENTER.lng });
        setZoomLevel(13.5);
        setLocationToast({
          message: isBangla ? `ক্যাটাগরি অনুযায়ী নিকটস্থ টেকনিশিয়ান প্রদর্শিত হচ্ছে` : `Showing nearest technicians for category`,
          type: 'success'
        });
        return;
      }
    }

    // 4. Fallback to AI diagnosis
    handleAIDiagnosis();
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

  const handleTechMouseEnter = (techId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredTechId(techId);
  };

  const handleTechMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTechId(null);
    }, 280);
  };

  const handleCardMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleCardMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTechId(null);
    }, 280);
  };

  const handleSelectTechnician = (tech: Technician) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setSelectedTechId(tech.id);
    setActivePopupTechId(prev => prev === tech.id ? null : tech.id);
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 backdrop-blur-md animate-in slide-in-from-top-4 duration-200 bg-white/95 dark:bg-zinc-900/95 border border-orange-500/40 text-zinc-900 dark:text-zinc-100">
          <Navigation className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span>{locationToast.message}</span>
          <button onClick={() => setLocationToast(null)} className="ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">✕</button>
        </div>
      )}

      {/* FLOATING TOP FILTER & CONTROL BAR */}
      <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Smart Problem & Location Search Input with Direct Jump */}
          <div className="relative flex-1 min-w-[260px] max-w-xl flex items-center gap-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLocationOrServiceSearch();
              }}
              className="relative flex-1 flex items-center"
            >
              <button
                type="button"
                onClick={() => handleLocationOrServiceSearch()}
                title={isBangla ? 'সার্চ করুন বা এলাকায় যান' : 'Search or Fly to Location'}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-600 transition-colors cursor-pointer p-0.5"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLocationOrServiceSearch();
                  }
                }}
                placeholder={isBangla ? 'কী সেবা বা ঢাকার এলাকা? যেমন: মিরপুর, ধানমন্ডি, এসি...' : 'Service or Dhaka Area? e.g. Mirpur, Dhanmondi, AC...'}
                className="w-full pl-8 pr-7 py-1.5 sm:py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs px-1">✕</button>
              )}
            </form>

            {/* Dedicated Search Action Button */}
            <button
              type="button"
              onClick={() => handleLocationOrServiceSearch()}
              title={isBangla ? 'লোকেশন বা সেবা খুঁজুন' : 'Search Location or Service'}
              className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/20 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isBangla ? 'সার্চ' : 'Search'}</span>
            </button>

            {/* AI Diagnosis Search Button */}
            <button
              onClick={handleAIDiagnosis}
              disabled={isDiagnosing}
              title={isBangla ? 'সমস্যা বিশ্লেষণ করুন' : 'AI Diagnostic Search'}
              className="py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs flex items-center gap-1 shrink-0 transition-all shadow-md shadow-amber-500/15 cursor-pointer active:scale-95 disabled:opacity-75"
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

        {/* Quick Dhaka Location Jump Pills */}
        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-zinc-500 shrink-0 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-orange-500" />
            <span>{isBangla ? 'দ্রুত এলাকায় যান:' : 'Quick Jump:'}</span>
          </span>
          {['মিরপুর', 'উত্তরা', 'ধানমন্ডি', 'গুলশান', 'বনানী', 'মোহাম্মদপুর', 'ফার্মগেট', 'পুরান ঢাকা'].map((place) => (
            <button
              key={place}
              type="button"
              onClick={() => {
                setSearchQuery(place);
                handleLocationOrServiceSearch(place);
              }}
              className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 hover:bg-orange-500/15 hover:text-orange-600 dark:hover:text-orange-400 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] shrink-0 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer active:scale-95"
            >
              {place}
            </button>
          ))}
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
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              <MapController center={mapCenter} zoom={zoomLevel} />

              {/* Heatmap density mode visualization */}
              {mapMode === 'HEATMAP' && heatmapClusters.map((cluster, i) => {
                const intensity = Math.min(cluster.count / 4, 1);
                const color = intensity > 0.6 ? '#dc2626' : intensity > 0.3 ? '#ea580c' : '#f59e0b';
                const isHovered = hoveredClusterIndex === i;

                return (
                  <AdvancedMarker
                    key={i}
                    position={{ lat: cluster.lat, lng: cluster.lng }}
                  >
                    <div
                      className="flex items-center justify-center relative select-none cursor-pointer"
                      onMouseEnter={() => setHoveredClusterIndex(i)}
                      onMouseLeave={() => setHoveredClusterIndex(null)}
                      onClick={() => {
                        setSelectedCategory('all');
                        setSearchQuery(cluster.name);
                        setMapMode('PROS');
                        setMapCenter({ lat: cluster.lat, lng: cluster.lng });
                        setZoomLevel(14);
                      }}
                    >
                      <div className="absolute rounded-full animate-pulse" style={{ width: '90px', height: '90px', backgroundColor: color, opacity: 0.35 }} />
                      <div className="absolute rounded-full" style={{ width: '28px', height: '28px', backgroundColor: color, opacity: 0.7 }} />
                      
                      <div className="absolute flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-600 border-2 border-white text-white text-xs font-black shadow-2xl whitespace-nowrap" style={{ transform: 'translate(-50%, -100%)', top: '-12px' }}>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>{cluster.name}</span>
                        <span className="bg-black/40 px-1.5 py-0.5 rounded-full text-[10px] font-mono">{cluster.count} {isBangla ? 'জন' : 'pros'}</span>
                      </div>

                      {/* Cluster Circle Hover Card */}
                      {isHovered && (
                        <div
                          className="absolute bottom-full mb-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-64 rounded-2xl bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-orange-500/40 shadow-2xl p-3.5 text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400">
                              {isBangla ? 'সার্ভিস হটস্পট জোন' : 'Service Hotspot'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                              {intensity > 0.6 ? '🔥 উচ্চ চাহিদা' : 'মাঝারি চাহিদা'}
                            </span>
                          </div>
                          <h4 className="font-black text-sm text-zinc-900 dark:text-white">{cluster.name}</h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {isBangla
                              ? `${cluster.count} জন পেশাজীবী এই জোনে সেবায় প্রস্তুত আছেন।`
                              : `${cluster.count} verified professionals active in this coverage area.`}
                          </p>
                          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSearchQuery(cluster.name);
                                setMapMode('PROS');
                                setMapCenter({ lat: cluster.lat, lng: cluster.lng });
                                setZoomLevel(14);
                              }}
                              className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs text-center shadow-md hover:from-orange-500 hover:to-amber-500 cursor-pointer"
                            >
                              {isBangla ? 'মিস্ত্রিদের বিস্তারিত দেখুন' : 'View Area Technicians'}
                            </button>
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-zinc-900 drop-shadow-sm" />
                        </div>
                      )}
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

              {/* Searched Location Pin with Pulsing Radar and Custom Location Icon */}
              {searchedLocationPin && !isNaN(searchedLocationPin.lat) && !isNaN(searchedLocationPin.lng) && (
                <AdvancedMarker
                  position={{ lat: searchedLocationPin.lat, lng: searchedLocationPin.lng }}
                  zIndex={10000}
                >
                  <div className="relative flex flex-col items-center select-none" style={{ transform: 'translate(0, -100%)' }}>
                    {/* Glowing Ping Rings */}
                    <span className="absolute bottom-0 w-16 h-16 rounded-full bg-orange-500/40 animate-ping pointer-events-none" />
                    <span className="absolute bottom-0 w-28 h-28 rounded-full bg-amber-500/20 animate-pulse pointer-events-none" />

                    {/* Place Name Badge Label */}
                    <div className="mb-2 px-3.5 py-1.5 rounded-full bg-zinc-950 text-white border-2 border-orange-500 shadow-2xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap animate-bounce">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                      <span>{searchedLocationPin.name}</span>
                    </div>

                    {/* Prominent High-Visibility Location Pin Icon */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-orange-500/40">
                      <MapPin className="w-6 h-6 fill-current" />
                    </div>

                    {/* Pin Tip Arrow */}
                    <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-orange-600 -mt-0.5" />
                  </div>
                </AdvancedMarker>
              )}

              {/* Normal pros markers mode with interactive service circles and hover/click cards */}
              {mapMode === 'PROS' && filteredTechnicians.map(tech => {
                const lat = tech.latitude || DHAKA_CENTER.lat;
                const lng = tech.longitude || DHAKA_CENTER.lng;
                if (isNaN(lat) || isNaN(lng)) return null;

                const isSelected = selectedTechId === tech.id;
                const isHovered = hoveredTechId === tech.id;
                const isCardOpen = isHovered || activePopupTechId === tech.id;

                const primarySkill = tech.skills[0] || 'other_services';
                const visualMeta = CATEGORY_VISUAL_MAP[primarySkill] || CATEGORY_VISUAL_MAP.other_services;
                const categoryName = isBangla
                  ? (categories.find(c => c.id === primarySkill)?.nameBn || visualMeta.nameBn)
                  : (categories.find(c => c.id === primarySkill)?.nameEn || visualMeta.nameEn);

                const isAvailable = tech.availability === 'available';
                const isBusy = tech.availability === 'busy';
                const statusDotColor = isAvailable ? 'bg-emerald-500' : isBusy ? 'bg-amber-500' : 'bg-zinc-400';

                return (
                  <AdvancedMarker
                    key={tech.id}
                    position={{ lat, lng }}
                    zIndex={isCardOpen ? 9999 : isSelected ? 1000 : 100}
                  >
                    <div className="relative flex items-center justify-center select-none" style={{ transform: 'translate(0, 0)' }}>
                      
                      {/* SERVICE COVERAGE CIRCLE - Hovering & clicking triggers information card */}
                      <div
                        className={`absolute rounded-full transition-all duration-300 pointer-events-auto cursor-pointer ${
                          isCardOpen
                            ? 'scale-115 opacity-80 ring-2 ring-orange-500/60 bg-orange-500/20 shadow-lg'
                            : 'opacity-40 hover:opacity-75 bg-orange-500/10 hover:bg-orange-500/20 border-2 border-orange-500/30 hover:border-orange-500'
                        }`}
                        style={{
                          width: '110px',
                          height: '110px',
                          transform: 'translate(-50%, -50%)',
                          top: '0px',
                          left: '0px'
                        }}
                        onMouseEnter={() => handleTechMouseEnter(tech.id)}
                        onMouseLeave={handleTechMouseLeave}
                        onClick={() => handleSelectTechnician(tech)}
                        title={isBangla ? `${tech.name} - ${categoryName} সার্ভিস জোন` : `${tech.name} - ${categoryName} Coverage Zone`}
                      >
                        {/* Subtle pulse ring inside service circle */}
                        <span className="absolute inset-0 rounded-full border border-orange-400/30 animate-ping opacity-20 pointer-events-none" />
                      </div>

                      {/* Central Technician Pin Marker */}
                      <div
                        className="relative z-10 flex flex-col items-center cursor-pointer transition-transform duration-200 group"
                        onMouseEnter={() => handleTechMouseEnter(tech.id)}
                        onMouseLeave={handleTechMouseLeave}
                        onClick={() => handleSelectTechnician(tech)}
                        style={{ transform: 'translate(0, 0)' }}
                      >
                        <div className={`relative w-10 h-10 rounded-2xl ${
                          isSelected || isCardOpen
                            ? 'bg-orange-600 ring-4 ring-orange-500/60 scale-110 shadow-2xl text-white'
                            : 'bg-white dark:bg-zinc-900 border-2 border-orange-500 text-zinc-900 dark:text-white shadow-xl hover:scale-110'
                        } flex items-center justify-center transition-all duration-200`}>
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

                      {/* FLOATING HOVER & CLICK INFORMATION CARD DIRECTLY ABOVE THE CIRCLE */}
                      {isCardOpen && (
                        <div
                          className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[290px] sm:w-[320px] rounded-2xl bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border border-orange-500/40 shadow-2xl p-4 text-left font-sans animate-in fade-in zoom-in-95 duration-150"
                          onMouseEnter={handleCardMouseEnter}
                          onMouseLeave={handleCardMouseLeave}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Close button if user pinned/clicked */}
                          {activePopupTechId === tech.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePopupTechId(null);
                                setSelectedTechId(null);
                                setHoveredTechId(null);
                              }}
                              className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                              title="Close"
                            >
                              ✕
                            </button>
                          )}

                          {/* Service Category Header Badge */}
                          <div className="flex items-center justify-between gap-1.5 mb-2.5 pr-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-[11px] font-black">
                              <span>{visualMeta.emoji}</span>
                              <span className="truncate">{categoryName}</span>
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isAvailable
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : isBusy
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-zinc-500/15 text-zinc-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor} ${isAvailable ? 'animate-pulse' : ''}`} />
                              <span>{isAvailable ? (isBangla ? 'এখনই প্রস্তুত' : 'Available') : isBusy ? (isBangla ? 'কাজে ব্যস্ত' : 'Busy') : (isBangla ? 'অফলাইন' : 'Offline')}</span>
                            </span>
                          </div>

                          {/* Technician Avatar, Name, Verification */}
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={tech.avatar}
                                alt={tech.name}
                                className="w-12 h-12 rounded-xl object-cover border-2 border-orange-500/40 shadow-sm"
                              />
                              {tech.platformVerified && (
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-black border-2 border-white dark:border-zinc-900" title="Verified Pro">
                                  ✓
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-sm text-zinc-900 dark:text-white truncate flex items-center gap-1.5">
                                <span>{tech.name}</span>
                              </h4>
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                                <span className="truncate">{tech.primaryArea}</span>
                                <span className="text-zinc-400">·</span>
                                <span className="text-orange-600 dark:text-orange-400 font-bold">{formatDistance(tech.calculatedDistanceKm, isBangla)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Metric Chips: Rating, Experience, Jobs */}
                          <div className="grid grid-cols-3 gap-1.5 mt-3 py-1.5 px-2 bg-stone-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 rounded-xl text-center text-[10px]">
                            <div>
                              <div className="font-extrabold text-amber-500 flex items-center justify-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{tech.rating}</span>
                              </div>
                              <div className="text-[8px] text-zinc-400">{tech.reviewCount} {isBangla ? 'রিভিউ' : 'reviews'}</div>
                            </div>
                            <div className="border-x border-zinc-200 dark:border-zinc-700 px-1">
                              <div className="font-bold text-zinc-700 dark:text-zinc-200">{tech.experienceYears} {isBangla ? 'বছর' : 'yrs'}</div>
                              <div className="text-[8px] text-zinc-400">{isBangla ? 'অভিজ্ঞতা' : 'exp'}</div>
                            </div>
                            <div>
                              <div className="font-bold text-orange-600 dark:text-orange-400">৳{tech.startingPrice}</div>
                              <div className="text-[8px] text-zinc-400">{isBangla ? 'শুরু মূল্য' : 'from'}</div>
                            </div>
                          </div>

                          {/* Action Buttons: View Profile & Book Now */}
                          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/professionals/${tech.id}`);
                              }}
                              type="button"
                              className="w-full py-2 px-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              <span>{isBangla ? 'প্রোফাইল দেখুন' : 'View Profile'}</span>
                              <ArrowRight className="w-3 h-3 text-orange-500" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/book?techId=${tech.id}`);
                              }}
                              type="button"
                              className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs flex items-center justify-center gap-1 shadow-md shadow-orange-600/25 transition-all cursor-pointer active:scale-95"
                            >
                              <span>{isBangla ? 'বুক করুন' : 'Book Now'}</span>
                            </button>
                          </div>

                          {/* Downward Pointer Triangle */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white dark:border-t-zinc-900 drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  </AdvancedMarker>
                );
              })}
            </Map>
          </div>
        </APIProvider>

        {/* AI DIAGNOSIS FLOATING OVERLAY CARD (TOP-LEFT OF MAP) */}
        {aiDiagnosis && (
          <div className="absolute top-4 left-4 z-20 max-w-sm bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-4 rounded-2xl border border-orange-500/40 shadow-2xl animate-in slide-in-from-top-3 duration-200">
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
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
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
        <div className="hidden sm:block absolute bottom-6 right-4 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-2.5 shadow-lg text-[10px] space-y-1 max-w-[200px]">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
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
