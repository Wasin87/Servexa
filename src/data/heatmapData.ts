export interface TechnicianLocation {
  id: string;
  name: string;
  tradeBn: string;
  tradeEn: string;
  rating: number;
  lat: number;
  lng: number;
  available: boolean;
  etaMins: number;
  phone: string;
}

export interface HeatmapZone {
  id: string;
  nameEn: string;
  nameBn: string;
  shortDescBn: string;
  shortDescEn: string;
  lat: number;
  lng: number;
  coordinates: { x: number; y: number }; // percentage on fallback grid
  radius: number; // visual heat aura radius (for SVG fallback)
  radiusMeters: number; // real geo radius in meters for Leaflet circle
  demandScore: number; // 0 - 100
  activeTechnicians: number;
  avgArrivalMinutes: number;
  surgeMultiplier: number;
  status: 'HIGH_SURGE' | 'BUSY' | 'MODERATE' | 'NORMAL';
  topCategory: string;
  topCategoryBn: string;
  activeRequests: number;
  hourlyDemandTrend: number[]; // 8 data points for today
  emergencyCallsToday: number;
  featuredPros: {
    name: string;
    tradeBn: string;
    tradeEn: string;
    rating: number;
    distance: string;
  }[];
  nearbyTechs: TechnicianLocation[];
}

export interface LiveActivityItem {
  id: string;
  zoneId: string;
  zoneNameBn: string;
  zoneNameEn: string;
  categoryBn: string;
  categoryEn: string;
  timestamp: string;
  type: 'REQUEST' | 'DISPATCHED' | 'COMPLETED' | 'EMERGENCY';
  etaMinutes?: number;
  lat?: number;
  lng?: number;
}

export const DHAKA_HEATMAP_ZONES: HeatmapZone[] = [
  {
    id: 'mirpur',
    nameEn: 'Mirpur (1, 10, 12, DOHS)',
    nameBn: 'মিরপুর (১, ১০, ১২, ডিওএইচএস)',
    shortDescBn: 'ঘনবসতিপূর্ণ এলাকা, এসি সার্ভিস ও ইলেকট্রিক্যাল ওয়্যারিংয়ের ব্যাপক চাপ।',
    shortDescEn: 'Dense residential cluster with heavy AC & electrical demand.',
    lat: 23.8069,
    lng: 90.3687,
    coordinates: { x: 38, y: 34 },
    radius: 38,
    radiusMeters: 1800,
    demandScore: 92,
    activeTechnicians: 28,
    avgArrivalMinutes: 12,
    surgeMultiplier: 1.25,
    status: 'HIGH_SURGE',
    topCategory: 'ac_repair',
    topCategoryBn: 'এসি মেরামত ও মাস্টার সার্ভিস',
    activeRequests: 48,
    hourlyDemandTrend: [45, 60, 75, 88, 92, 85, 78, 90],
    emergencyCallsToday: 19,
    featuredPros: [
      { name: 'মোঃ রফিকুল ইসলাম', tradeBn: 'এসি ও রেফ্রিজারেটর এক্সপার্ট', tradeEn: 'AC Expert', rating: 4.9, distance: 'মিরপুর-১০ গোলচত্বর (০.৮ কিমি)' },
      { name: 'মাহবুব আলম', tradeBn: 'মাস্টার ইলেকট্রিশিয়ান', tradeEn: 'Master Electrician', rating: 4.8, distance: 'মিরপুর-২ (১.২ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-m1', name: 'মোঃ রফিকুল ইসলাম', tradeBn: 'এসি এক্সপার্ট', tradeEn: 'AC Expert', rating: 4.9, lat: 23.8078, lng: 90.3695, available: true, etaMins: 9, phone: '+880 1712-345678' },
      { id: 'tech-m2', name: 'মাহবুব আলম', tradeBn: 'মাস্টার ইলেকট্রিশিয়ান', tradeEn: 'Master Electrician', rating: 4.8, lat: 23.8042, lng: 90.3651, available: true, etaMins: 12, phone: '+880 1819-456789' },
      { id: 'tech-m3', name: 'আশরাফুল ইসলাম', tradeBn: 'প্লাম্বার', tradeEn: 'Plumber', rating: 4.75, lat: 23.8115, lng: 90.3622, available: false, etaMins: 18, phone: '+880 1911-234567' }
    ]
  },
  {
    id: 'uttara',
    nameEn: 'Uttara (Sectors 1 - 18)',
    nameBn: 'উত্তরা (সেক্টর ১ - ১৮)',
    shortDescBn: 'নতুন অ্যাপার্টমেন্ট হাব, জেট ওয়াশ এসি ও স্যানিটারি ফিটিংয়ে উচ্চ চাহিদা।',
    shortDescEn: 'Modern residential sector with high demand for AC jet wash & plumbing.',
    lat: 23.8759,
    lng: 90.3795,
    coordinates: { x: 50, y: 16 },
    radius: 42,
    radiusMeters: 2200,
    demandScore: 96,
    activeTechnicians: 24,
    avgArrivalMinutes: 14,
    surgeMultiplier: 1.3,
    status: 'HIGH_SURGE',
    topCategory: 'ac_repair',
    topCategoryBn: 'এসি জেট ওয়াশ ও গ্যাস রিফিল',
    activeRequests: 54,
    hourlyDemandTrend: [50, 70, 85, 94, 96, 91, 88, 95],
    emergencyCallsToday: 23,
    featuredPros: [
      { name: 'তানভীর হাসান', tradeBn: 'সিনিয়র এসি মেকানিক', tradeEn: 'Senior AC Mechanic', rating: 4.95, distance: 'সেক্টর-৩ (১.৫ কিমি)' },
      { name: 'আনোয়ার হোসেন', tradeBn: 'প্লাম্বিং ইঞ্জিনিয়ার', tradeEn: 'Plumbing Specialist', rating: 4.85, distance: 'সেক্টর-৭ (০.৯ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-u1', name: 'তানভীর হাসান', tradeBn: 'সিনিয়র এসি মেকানিক', tradeEn: 'Senior AC Mechanic', rating: 4.95, lat: 23.8732, lng: 90.3821, available: true, etaMins: 10, phone: '+880 1714-889900' },
      { id: 'tech-u2', name: 'আনোয়ার হোসেন', tradeBn: 'প্লাম্বিং স্পেশালিস্ট', tradeEn: 'Plumbing Specialist', rating: 4.85, lat: 23.8785, lng: 90.3768, available: true, etaMins: 14, phone: '+880 1612-334455' }
    ]
  },
  {
    id: 'dhanmondi',
    nameEn: 'Dhanmondi & Kalabagan',
    nameBn: 'ধানমন্ডি ও কলাবাগান',
    shortDescBn: 'গৃহস্থালি অ্যাপ্লায়েন্স, ওভেন ও কিচেন ওয়াটার পাইপ সমাধানে দ্রুত রেসপন্স।',
    shortDescEn: 'Premium district, high request rate for kitchen appliances & plumbing.',
    lat: 23.7461,
    lng: 90.3742,
    coordinates: { x: 42, y: 56 },
    radius: 34,
    radiusMeters: 1600,
    demandScore: 86,
    activeTechnicians: 22,
    avgArrivalMinutes: 10,
    surgeMultiplier: 1.15,
    status: 'BUSY',
    topCategory: 'electrical',
    topCategoryBn: 'বৈদ্যুতিক ফল্ট ও হোম অ্যাপ্লায়েন্স',
    activeRequests: 36,
    hourlyDemandTrend: [40, 52, 68, 80, 86, 82, 79, 84],
    emergencyCallsToday: 14,
    featuredPros: [
      { name: 'শামীম রেজা', tradeBn: 'হোম অ্যাপ্লায়েন্স টেকনিশিয়ান', tradeEn: 'Appliance Tech', rating: 4.9, distance: 'ধানমন্ডি ২৭ (০.৫ কিমি)' },
      { name: 'জাহিদ হাসান', tradeBn: 'ইলেকট্রিক্যাল স্পেশালিস্ট', tradeEn: 'Electrical Specialist', rating: 4.8, distance: 'সোবহানবাগ (১.০ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-d1', name: 'শামীম রেজা', tradeBn: 'হোম অ্যাপ্লায়েন্স টেকনিশিয়ান', tradeEn: 'Appliance Tech', rating: 4.9, lat: 23.7485, lng: 90.3725, available: true, etaMins: 8, phone: '+880 1718-998877' },
      { id: 'tech-d2', name: 'জাহিদ হাসান', tradeBn: 'ইলেকট্রিক্যাল স্পেশালিস্ট', tradeEn: 'Electrical Specialist', rating: 4.8, lat: 23.7442, lng: 90.3768, available: true, etaMins: 11, phone: '+880 1912-887766' }
    ]
  },
  {
    id: 'gulshan',
    nameEn: 'Gulshan, Banani & Baridhara',
    nameBn: 'গুলশান, বনানী ও বারিধারা',
    shortDescBn: 'কর্পোরেট ও হাই-এন্ড রেসিডেনশিয়াল; জেনারেটর, সিসিটিভি ও স্মার্ট হোম সেটআপ।',
    shortDescEn: 'Corporate & diplomatic zone; generator, smart lock & CCTV servicing.',
    lat: 23.7925,
    lng: 90.4078,
    coordinates: { x: 62, y: 38 },
    radius: 40,
    radiusMeters: 2000,
    demandScore: 94,
    activeTechnicians: 31,
    avgArrivalMinutes: 9,
    surgeMultiplier: 1.35,
    status: 'HIGH_SURGE',
    topCategory: 'cctv_security',
    topCategoryBn: 'সিসিটিভি, নেটওয়ার্ক ও জেনারেটর',
    activeRequests: 58,
    hourlyDemandTrend: [60, 75, 88, 92, 94, 90, 86, 92],
    emergencyCallsToday: 26,
    featuredPros: [
      { name: 'ইমরান শরিফ', tradeBn: 'সিসিটিভি ও সিকিউরিটি স্পেশালিস্ট', tradeEn: 'Security Specialist', rating: 4.95, distance: 'গুলশান-২ (০.৭ কিমি)' },
      { name: 'ফরহাদ হোসেন', tradeBn: 'ইনভার্টার এসি এক্সপার্ট', tradeEn: 'Inverter AC Tech', rating: 4.9, distance: 'বনানী ১১ (১.১ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-g1', name: 'ইমরান শরিফ', tradeBn: 'সিসিটিভি ও সিকিউরিটি স্পেশালিস্ট', tradeEn: 'Security Specialist', rating: 4.95, lat: 23.7942, lng: 90.4095, available: true, etaMins: 7, phone: '+880 1711-223344' },
      { id: 'tech-g2', name: 'ফরহাদ হোসেন', tradeBn: 'ইনভার্টার এসি এক্সপার্ট', tradeEn: 'Inverter AC Tech', rating: 4.9, lat: 23.7915, lng: 90.4035, available: true, etaMins: 9, phone: '+880 1812-334455' }
    ]
  },
  {
    id: 'bashundhara',
    nameEn: 'Bashundhara R/A',
    nameBn: 'বসুন্ধরা আবাসিক এলাকা',
    shortDescBn: 'ব্লক এ-এন; ডিপ ক্লিনিং, ওয়াশিং মেশিন মেরামত ও ওয়াটার পিউরিফায়ার সার্ভিস।',
    shortDescEn: 'Vast planned community; deep cleaning, washing machine & RO filter service.',
    lat: 23.8191,
    lng: 90.4280,
    coordinates: { x: 74, y: 28 },
    radius: 36,
    radiusMeters: 1700,
    demandScore: 89,
    activeTechnicians: 19,
    avgArrivalMinutes: 13,
    surgeMultiplier: 1.2,
    status: 'BUSY',
    topCategory: 'washing_machine',
    topCategoryBn: 'ওয়াশিং মেশিন ও ডিপ ক্লিনিং',
    activeRequests: 41,
    hourlyDemandTrend: [35, 55, 72, 84, 89, 85, 80, 88],
    emergencyCallsToday: 15,
    featuredPros: [
      { name: 'সেলিম খন্দকার', tradeBn: 'ওয়াশিং মেশিন ও ওভেন মেকানিক', tradeEn: 'Washer & Oven Pro', rating: 4.85, distance: 'ব্লক-সি (০.৬ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-b1', name: 'সেলিম খন্দকার', tradeBn: 'ওয়াশিং মেশিন ও ওভেন মেকানিক', tradeEn: 'Washer & Oven Pro', rating: 4.85, lat: 23.8210, lng: 90.4265, available: true, etaMins: 12, phone: '+880 1611-778899' }
    ]
  },
  {
    id: 'mohammadpur',
    nameEn: 'Mohammadpur & Adabor',
    nameBn: 'মোহাম্মদপুর ও আদাবর',
    shortDescBn: 'পানির পাম্পের মোটর মেরামত, পাইপলাইন লিকেজ ও রঙের কাজের ব্যাপক চাহিদা।',
    shortDescEn: 'High demand for water pump motors, pipe leaks & residential painting.',
    lat: 23.7658,
    lng: 90.3584,
    coordinates: { x: 30, y: 50 },
    radius: 32,
    radiusMeters: 1600,
    demandScore: 78,
    activeTechnicians: 18,
    avgArrivalMinutes: 15,
    surgeMultiplier: 1.1,
    status: 'MODERATE',
    topCategory: 'plumbing',
    topCategoryBn: 'প্লাম্বিং ও সাবমার্সিবল মোটর',
    activeRequests: 29,
    hourlyDemandTrend: [30, 48, 62, 74, 78, 75, 70, 76],
    emergencyCallsToday: 11,
    featuredPros: [
      { name: 'মোস্তফা কামাল', tradeBn: 'প্লাম্বার ও মোটর ওয়াইন্ডিং', tradeEn: 'Plumber & Motor Pro', rating: 4.8, distance: 'টাউনহল (০.৮ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-mp1', name: 'মোস্তফা কামাল', tradeBn: 'প্লাম্বার ও মোটর ওয়াইন্ডিং', tradeEn: 'Plumber & Motor Pro', rating: 4.8, lat: 23.7672, lng: 90.3601, available: true, etaMins: 14, phone: '+880 1713-445566' }
    ]
  },
  {
    id: 'old_dhaka',
    nameEn: 'Old Dhaka (Lalbagh, Wari, Sadarghat)',
    nameBn: 'পুরান ঢাকা (লালবাগ, ওয়ারী, সদরঘাট)',
    shortDescBn: 'ঐতিহ্যবাহী পুরান ঢাকায় জটিল ইলেকট্রিক্যাল ওয়্যারিং ও ড্রেনেজ সমাধান।',
    shortDescEn: 'Heritage district requiring specialized wiring overhauls & drainage.',
    lat: 23.7126,
    lng: 90.4125,
    coordinates: { x: 54, y: 76 },
    radius: 38,
    radiusMeters: 1800,
    demandScore: 91,
    activeTechnicians: 27,
    avgArrivalMinutes: 13,
    surgeMultiplier: 1.25,
    status: 'HIGH_SURGE',
    topCategory: 'electrical',
    topCategoryBn: 'মেইন ডিবি বোর্ড ও ড্রেনেজ সার্ভিস',
    activeRequests: 46,
    hourlyDemandTrend: [55, 68, 80, 89, 91, 87, 83, 90],
    emergencyCallsToday: 21,
    featuredPros: [
      { name: 'হারুন অর রশিদ', tradeBn: 'মাস্টার ওয়্যারিং মিস্ত্রি', tradeEn: 'Wiring Expert', rating: 4.9, distance: 'ওয়ারী র্যাঙ্কিন স্ট্রিট (০.৪ কিমি)' },
      { name: 'সিরাজুল ইসলাম', tradeBn: 'ড্রেনেজ ও স্যানিটারি টেকনিশিয়ান', tradeEn: 'Drainage Specialist', rating: 4.85, distance: 'লালবাগ কেল্লা মোড় (০.৯ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-od1', name: 'হারুন অর রশিদ', tradeBn: 'মাস্টার ওয়্যারিং মিস্ত্রি', tradeEn: 'Wiring Expert', rating: 4.9, lat: 23.7142, lng: 90.4140, available: true, etaMins: 11, phone: '+880 1715-667788' }
    ]
  },
  {
    id: 'badda_rampura',
    nameEn: 'Badda, Rampura & Aftabnagar',
    nameBn: 'বাড্ডা, রামপুরা ও আফতাবনগর',
    shortDescBn: 'টিভি মেরামত, ইন্টারনেট রাউটার সেটআপ ও রেফ্রিজারেটর কুলিং সমস্যা।',
    shortDescEn: 'Surging demand for TV repairs, Wi-Fi networking & refrigerator gas.',
    lat: 23.7684,
    lng: 90.4255,
    coordinates: { x: 64, y: 48 },
    radius: 32,
    radiusMeters: 1500,
    demandScore: 74,
    activeTechnicians: 16,
    avgArrivalMinutes: 17,
    surgeMultiplier: 1.05,
    status: 'MODERATE',
    topCategory: 'refrigerator',
    topCategoryBn: 'ফ্রিজ গ্যাস চার্জ ও কুলিং',
    activeRequests: 25,
    hourlyDemandTrend: [28, 45, 58, 70, 74, 71, 68, 72],
    emergencyCallsToday: 9,
    featuredPros: [
      { name: 'বিল্লাল হোসেন', tradeBn: 'ফ্রিজ মেকানিক', tradeEn: 'Fridge Mechanic', rating: 4.75, distance: 'রামপুরা ব্রিজ (১.১ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-bd1', name: 'বিল্লাল হোসেন', tradeBn: 'ফ্রিজ মেকানিক', tradeEn: 'Fridge Mechanic', rating: 4.75, lat: 23.7695, lng: 90.4230, available: true, etaMins: 15, phone: '+880 1815-556677' }
    ]
  },
  {
    id: 'farmgate_tejgaon',
    nameEn: 'Farmgate, Tejgaon & Green Road',
    nameBn: 'ফার্মগেট, তেজগাঁও ও গ্রিন রোড',
    shortDescBn: 'অফিস ও স্টুডেন্ট মেসে তাৎক্ষণিক ফ্যান, লাইট ও ইলেকট্রনিক্স মেরামত।',
    shortDescEn: 'Office & student hostels; fast fan, light & desktop/laptop fixes.',
    lat: 23.7570,
    lng: 90.3900,
    coordinates: { x: 48, y: 47 },
    radius: 30,
    radiusMeters: 1400,
    demandScore: 84,
    activeTechnicians: 20,
    avgArrivalMinutes: 11,
    surgeMultiplier: 1.15,
    status: 'BUSY',
    topCategory: 'electrical',
    topCategoryBn: 'ইলেকট্রিক্যাল ও কম্পিউটার হার্ডওয়্যার',
    activeRequests: 33,
    hourlyDemandTrend: [38, 55, 72, 81, 84, 80, 76, 82],
    emergencyCallsToday: 13,
    featuredPros: [
      { name: 'শহীদুল ইসলাম', tradeBn: 'কম্পিউটার ও ইলেকট্রনিক্স টেকনিশিয়ান', tradeEn: 'Hardware Tech', rating: 4.88, distance: 'ফার্মগেট ইন্দিরা রোড (০.৫ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-fg1', name: 'শহীদুল ইসলাম', tradeBn: 'কম্পিউটার টেকনিশিয়ান', tradeEn: 'Hardware Tech', rating: 4.88, lat: 23.7582, lng: 90.3885, available: true, etaMins: 9, phone: '+880 1914-776655' }
    ]
  },
  {
    id: 'motijheel',
    nameEn: 'Motijheel, Dilkusha & Paltan',
    nameBn: 'মতিঝিল, দিলকুশা ও পল্টন',
    shortDescBn: 'ব্যাংক ও বাণিজ্যিক প্রতিষ্ঠানের জন্য সেন্ট্রাল এসি ও নেটওয়ার্ক ক্যাবলিং।',
    shortDescEn: 'Commercial center; central AC maintenance & structured network cabling.',
    lat: 23.7330,
    lng: 90.4172,
    coordinates: { x: 57, y: 64 },
    radius: 30,
    radiusMeters: 1500,
    demandScore: 79,
    activeTechnicians: 17,
    avgArrivalMinutes: 14,
    surgeMultiplier: 1.1,
    status: 'MODERATE',
    topCategory: 'ac_repair',
    topCategoryBn: 'কমার্শিয়াল এসি ও ল্যান নেটওয়ার্কিং',
    activeRequests: 27,
    hourlyDemandTrend: [32, 50, 65, 76, 79, 75, 71, 77],
    emergencyCallsToday: 10,
    featuredPros: [
      { name: 'কবির আহমেদ', tradeBn: 'কমার্শিয়াল এসি টেকনিশিয়ান', tradeEn: 'Commercial AC Tech', rating: 4.92, distance: 'শাপলা চত্বর (০.৩ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-mj1', name: 'কবির আহমেদ', tradeBn: 'কমার্শিয়াল এসি টেকনিশিয়ান', tradeEn: 'Commercial AC Tech', rating: 4.92, lat: 23.7345, lng: 90.4180, available: true, etaMins: 13, phone: '+880 1716-112233' }
    ]
  },
  {
    id: 'khilgaon_malibagh',
    nameEn: 'Khilgaon, Malibagh & Shantinagar',
    nameBn: 'খিলগাঁও, মালিবাগ ও শান্তিনগর',
    shortDescBn: 'ফ্ল্যাট সংস্কার, কিচেন ক্যাবিনেট কার্পেন্ট্রি ও গ্যাস চুলা সার্ভিস।',
    shortDescEn: 'Apartment renovation, kitchen cabinetry carpentry & gas burner service.',
    lat: 23.7516,
    lng: 90.4222,
    coordinates: { x: 62, y: 58 },
    radius: 30,
    radiusMeters: 1400,
    demandScore: 76,
    activeTechnicians: 15,
    avgArrivalMinutes: 16,
    surgeMultiplier: 1.05,
    status: 'MODERATE',
    topCategory: 'carpentry',
    topCategoryBn: 'কার্পেন্ট্রি ও গ্যাস স্টোভ ফিটিং',
    activeRequests: 24,
    hourlyDemandTrend: [26, 42, 60, 72, 76, 73, 69, 74],
    emergencyCallsToday: 8,
    featuredPros: [
      { name: 'দেলোয়ার হোসেন', tradeBn: 'মাস্টার কার্পেন্টার', tradeEn: 'Master Carpenter', rating: 4.82, distance: 'খিলগাঁও রেলগেট (০.৯ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-kg1', name: 'দেলোয়ার হোসেন', tradeBn: 'মাস্টার কার্পেন্টার', tradeEn: 'Master Carpenter', rating: 4.82, lat: 23.7525, lng: 90.4205, available: true, etaMins: 15, phone: '+880 1813-223344' }
    ]
  },
  {
    id: 'shyamoli_kalyanpur',
    nameEn: 'Shyamoli & Kalyanpur',
    nameBn: 'শ্যামলী ও কল্যাণপুর',
    shortDescBn: 'আবাসিক এলাকা; সাবমার্সিবল মোটর, লকস্মিথ ও ওয়াটার হিটার সার্ভিস।',
    shortDescEn: 'Residential pocket; water heater geyser, locksmith & motor services.',
    lat: 23.7745,
    lng: 90.3654,
    coordinates: { x: 34, y: 44 },
    radius: 28,
    radiusMeters: 1400,
    demandScore: 71,
    activeTechnicians: 14,
    avgArrivalMinutes: 15,
    surgeMultiplier: 1.0,
    status: 'NORMAL',
    topCategory: 'plumbing',
    topCategoryBn: 'গিজার ও লকস্মিথ সার্ভিস',
    activeRequests: 20,
    hourlyDemandTrend: [25, 40, 54, 67, 71, 68, 65, 70],
    emergencyCallsToday: 7,
    featuredPros: [
      { name: 'কামরুল হাসান', tradeBn: 'লক ও সিকিউরিটি মেকানিক', tradeEn: 'Lock & Safety Pro', rating: 4.79, distance: 'শ্যামলী রিং রোড (০.৬ কিমি)' }
    ],
    nearbyTechs: [
      { id: 'tech-sk1', name: 'কামরুল হাসান', tradeBn: 'লক ও সিকিউরিটি মেকানিক', tradeEn: 'Lock & Safety Pro', rating: 4.79, lat: 23.7758, lng: 90.3670, available: true, etaMins: 12, phone: '+880 1614-556677' }
    ]
  }
];

export const INITIAL_LIVE_ACTIVITIES: LiveActivityItem[] = [
  {
    id: 'act-1',
    zoneId: 'mirpur',
    zoneNameBn: 'মিরপুর-১০',
    zoneNameEn: 'Mirpur-10',
    categoryBn: 'এসি কুলিং ফল্ট ও গ্যাস রিফিল',
    categoryEn: 'AC Cooling Fault & Gas Refill',
    timestamp: '১ মিনিট আগে',
    type: 'DISPATCHED',
    etaMinutes: 11,
    lat: 23.8069,
    lng: 90.3687
  },
  {
    id: 'act-2',
    zoneId: 'uttara',
    zoneNameBn: 'উত্তরা সেক্টর-৩',
    zoneNameEn: 'Uttara Sector-3',
    categoryBn: 'জরুরি পাইপলাইন ওয়াটার লিকেজ',
    categoryEn: 'Emergency Water Pipe Burst',
    timestamp: '২ মিনিট আগে',
    type: 'EMERGENCY',
    etaMinutes: 8,
    lat: 23.8759,
    lng: 90.3795
  },
  {
    id: 'act-3',
    zoneId: 'gulshan',
    zoneNameBn: 'গুলশান-২',
    zoneNameEn: 'Gulshan-2',
    categoryBn: 'ডিজিটাল স্মার্ট ডোর লক ইন্সটলেশন',
    categoryEn: 'Smart Door Lock Installation',
    timestamp: '৩ মিনিট আগে',
    type: 'COMPLETED',
    lat: 23.7925,
    lng: 90.4078
  },
  {
    id: 'act-4',
    zoneId: 'dhanmondi',
    zoneNameBn: 'ধানমন্ডি ২৭',
    zoneNameEn: 'Dhanmondi 27',
    categoryBn: 'সার্কিট ব্রেকার স্পার্ক সমাধান',
    categoryEn: 'Circuit Breaker Spark Repair',
    timestamp: '৪ মিনিট আগে',
    type: 'REQUEST',
    lat: 23.7461,
    lng: 90.3742
  },
  {
    id: 'act-5',
    zoneId: 'old_dhaka',
    zoneNameBn: 'পুরান ঢাকা ওয়ারী',
    zoneNameEn: 'Old Dhaka Wari',
    categoryBn: 'মেইন ড্রেনেজ ক্লিয়ারিং ও প্লাম্বিং',
    categoryEn: 'Main Drainage Clearing',
    timestamp: '৫ মিনিট আগে',
    type: 'DISPATCHED',
    etaMinutes: 14,
    lat: 23.7126,
    lng: 90.4125
  }
];
