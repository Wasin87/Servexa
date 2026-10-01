/**
 * KormiGo Geo & Distance Calculation Utilities
 */

export const DHAKA_CENTER = {
  lat: 23.7806,
  lng: 90.3980,
  zoom: 12
};

export interface AreaCoordinate {
  nameEn: string;
  nameBn: string;
  lat: number;
  lng: number;
  keywords: string[];
}

export const DHAKA_AREAS: AreaCoordinate[] = [
  { nameEn: 'Mirpur', nameBn: 'মিরপুর', lat: 23.8069, lng: 90.3687, keywords: ['mirpur', 'মিরপুর', 'dohs', 'pallabi', 'পল্লবী', 'shewrapara'] },
  { nameEn: 'Dhanmondi', nameBn: 'ধানমন্ডি', lat: 23.7461, lng: 90.3742, keywords: ['dhanmondi', 'ধানমন্ডি', 'kalabagan', 'কলাবাগান', 'sobhani', 'lalmatia', 'লালমাটিয়া'] },
  { nameEn: 'Uttara', nameBn: 'উত্তরা', lat: 23.8759, lng: 90.3795, keywords: ['uttara', 'উত্তরা', 'airport', 'এয়ারপোর্ট', 'sector', 'সেক্টর'] },
  { nameEn: 'Gulshan', nameBn: 'গুলশান', lat: 23.7925, lng: 90.4078, keywords: ['gulshan', 'গুলশান', 'niketan', 'নিকেতন'] },
  { nameEn: 'Banani', nameBn: 'বনানী', lat: 23.7937, lng: 90.4043, keywords: ['banani', 'বনানী', 'chairmanbari', 'চেয়ারম্যানবাড়ি'] },
  { nameEn: 'Bashundhara', nameBn: 'বসুন্ধরা', lat: 23.8191, lng: 90.4280, keywords: ['bashundhara', 'বসুন্ধরা', 'block', 'বারিধারা', 'baridhara'] },
  { nameEn: 'Mohammadpur', nameBn: 'মোহাম্মদপুর', lat: 23.7658, lng: 90.3584, keywords: ['mohammadpur', 'মোহাম্মদপুর', 'adabor', 'আদাবর', 'ring road', 'ringroad'] },
  { nameEn: 'Old Dhaka', nameBn: 'পুরান ঢাকা', lat: 23.7126, lng: 90.4125, keywords: ['old dhaka', 'পুরান ঢাকা', 'wari', 'ওয়ারী', 'lalbagh', 'লালবাগ', 'sadarghat', 'সদরঘাট'] },
  { nameEn: 'Farmgate', nameBn: 'ফার্মগেট', lat: 23.7570, lng: 90.3900, keywords: ['farmgate', 'ফার্মগেট', 'tejgaon', 'তেজগাঁও', 'green road', 'গ্রীন রোড'] },
  { nameEn: 'Badda', nameBn: 'বাড্ডা', lat: 23.7684, lng: 90.4255, keywords: ['badda', 'বাড্ডা', 'rampura', 'রামপুরা', 'aftabnagar', 'আফতাবনগর'] },
  { nameEn: 'Motijheel', nameBn: 'মতিঝিল', lat: 23.7330, lng: 90.4172, keywords: ['motijheel', 'মতিঝিল', 'dilkusha', 'দিলকুশা', 'paltan', 'পল্টন'] },
  { nameEn: 'Khilgaon', nameBn: 'খিলগাঁও', lat: 23.7516, lng: 90.4222, keywords: ['khilgaon', 'খিলগাঁও', 'malibagh', 'মালিবাগ', 'shantinagar', 'শান্তিনগর'] },
  { nameEn: 'Shyamoli', nameBn: 'শ্যামলী', lat: 23.7745, lng: 90.3654, keywords: ['shyamoli', 'শ্যামলী', 'kalyanpur', 'কল্যাণপুর', 'agargaon', 'আগারগাঁও'] }
];

/**
 * Convert standard English numbers to Bengali numerals
 */
export function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .split('')
    .map(char => {
      const parsed = parseInt(char, 10);
      return !isNaN(parsed) && bengaliDigits[parsed] !== undefined ? bengaliDigits[parsed] : char;
    })
    .join('');
}

/**
 * Calculates Haversine distance in kilometers between two geo coordinates
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance with localization support
 */
export function formatDistance(distanceKm: number, isBangla: boolean): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    if (isBangla) {
      return `${toBengaliNumber(meters)} মিটার দূরে`;
    }
    return `${meters} m away`;
  }
  const formatted = distanceKm.toFixed(1);
  if (isBangla) {
    return `${toBengaliNumber(formatted)} কিমি দূরে`;
  }
  return `${formatted} km away`;
}

/**
 * Keyword-based natural language problem analyzer to match service category
 */
export function detectServiceCategoryFromQuery(query: string): string | null {
  const q = query.toLowerCase().trim();

  // Plumbing
  if (
    q.includes('পানির') ||
    q.includes('পানি') ||
    q.includes('পাইপ') ||
    q.includes('লিক') ||
    q.includes('প্লাম্বার') ||
    q.includes('কল') ||
    q.includes('ট্যাপ') ||
    q.includes('কমোড') ||
    q.includes('বেসিন') ||
    q.includes('ড্রেন') ||
    q.includes('ফুটো') ||
    q.includes('pipe') ||
    q.includes('leak') ||
    q.includes('plumb') ||
    q.includes('water') ||
    q.includes('basin') ||
    q.includes('tap')
  ) {
    return 'plumbing';
  }

  // AC Repair
  if (
    q.includes('ac') ||
    q.includes('এসি') ||
    q.includes('ঠান্ডা করছে না') ||
    q.includes('ঠান্ডা হচ্ছে না') ||
    q.includes('ঠান্ডা') ||
    q.includes('গ্যাস') ||
    q.includes('কম্প্রেসার') ||
    q.includes('কুলিং') ||
    q.includes('cooling') ||
    q.includes('air condition') ||
    q.includes('filter')
  ) {
    return 'ac_repair';
  }

  // Electrical
  if (
    q.includes('ইলেকট্রিক') ||
    q.includes('কারেন্ট') ||
    q.includes('বিদ্যুৎ') ||
    q.includes('শর্ট সার্কিট') ||
    q.includes('ব্রেকার') ||
    q.includes('সুইচ') ||
    q.includes('ফ্যান কাজ করছে না') ||
    q.includes('ফ্যান') ||
    q.includes('লাইট') ||
    q.includes('ওয়্যারিং') ||
    q.includes('electric') ||
    q.includes('fan') ||
    q.includes('light') ||
    q.includes('switch') ||
    q.includes('spark') ||
    q.includes('wiring')
  ) {
    return 'electrical';
  }

  // Refrigerator
  if (
    q.includes('ফ্রিজ') ||
    q.includes('রেফ্রিজারেটর') ||
    q.includes('বরফ') ||
    q.includes('fridge') ||
    q.includes('refrigerator')
  ) {
    return 'refrigerator';
  }

  // Washing machine
  if (
    q.includes('ওয়াশিং') ||
    q.includes('কাপড় ধোয়া') ||
    q.includes('washing') ||
    q.includes('dryer')
  ) {
    return 'washing_machine';
  }

  // TV Repair
  if (
    q.includes('টিভি') ||
    q.includes('এলইডি') ||
    q.includes('tv') ||
    q.includes('television') ||
    q.includes('display')
  ) {
    return 'tv_repair';
  }

  // Carpentry
  if (
    q.includes('কাঠ') ||
    q.includes('ছুতার') ||
    q.includes('দরজা') ||
    q.includes('জানালা') ||
    q.includes('খাট') ||
    q.includes('আলমারি') ||
    q.includes('ফার্নিচার') ||
    q.includes('carpenter') ||
    q.includes('wood') ||
    q.includes('door') ||
    q.includes('cabinet')
  ) {
    return 'carpentry';
  }

  // Locksmith
  if (
    q.includes('তালা') ||
    q.includes('চাবি') ||
    q.includes('লক') ||
    q.includes('lock') ||
    q.includes('key')
  ) {
    return 'locksmith';
  }

  // Painting
  if (
    q.includes('রং') ||
    q.includes('দেয়াল') ||
    q.includes('পেইন্ট') ||
    q.includes('ড্যাম্প') ||
    q.includes('পুটি') ||
    q.includes('paint') ||
    q.includes('color') ||
    q.includes('wall')
  ) {
    return 'painting';
  }

  // Masonry
  if (
    q.includes('রাজমিস্ত্রি') ||
    q.includes('টাইলস') ||
    q.includes('প্লাস্টার') ||
    q.includes('mason') ||
    q.includes('tiles')
  ) {
    return 'masonry';
  }

  // Cleaning
  if (
    q.includes('পরিষ্কার') ||
    q.includes('ক্লিনিং') ||
    q.includes('সোফা') ||
    q.includes('কার্পেট') ||
    q.includes('ওয়াশ') ||
    q.includes('clean') ||
    q.includes('sofa') ||
    q.includes('carpet')
  ) {
    return 'home_cleaning';
  }

  // Computer / Laptop
  if (
    q.includes('কম্পিউটার') ||
    q.includes('ল্যাপটপ') ||
    q.includes('উইন্ডোজ') ||
    q.includes('মাদারবোর্ড') ||
    q.includes('স্লো') ||
    q.includes('computer') ||
    q.includes('laptop') ||
    q.includes('windows')
  ) {
    return 'computer_repair';
  }

  // Mobile
  if (
    q.includes('মোবাইল') ||
    q.includes('ফোন') ||
    q.includes('ডিসপ্লে') ||
    q.includes('phone') ||
    q.includes('mobile')
  ) {
    return 'mobile_repair';
  }

  // CCTV
  if (
    q.includes('সিসিটিভি') ||
    q.includes('ক্যামেরা') ||
    q.includes('cctv') ||
    q.includes('camera') ||
    q.includes('security')
  ) {
    return 'cctv_installation';
  }

  // Internet WiFi
  if (
    q.includes('ইন্টারনেট') ||
    q.includes('ওয়াইফাই') ||
    q.includes('রাউটার') ||
    q.includes('wifi') ||
    q.includes('internet') ||
    q.includes('router')
  ) {
    return 'internet_wifi';
  }

  // Mechanic
  if (
    q.includes('বাইক') ||
    q.includes('গাড়ি') ||
    q.includes('মেকানিক') ||
    q.includes('পাংচার') ||
    q.includes('bike') ||
    q.includes('car') ||
    q.includes('motorcycle') ||
    q.includes('brake')
  ) {
    return 'mechanic';
  }

  // Generator
  if (
    q.includes('জেনারেটর') ||
    q.includes('আইপিএস') ||
    q.includes('generator') ||
    q.includes('ips')
  ) {
    return 'generator_service';
  }

  // Gardening
  if (
    q.includes('বাগান') ||
    q.includes('গাছ') ||
    q.includes('ছাদ বাগান') ||
    q.includes('garden') ||
    q.includes('plant')
  ) {
    return 'gardening';
  }

  // Moving
  if (
    q.includes('শিফটিং') ||
    q.includes('বাসা বদল') ||
    q.includes('প্যাকিং') ||
    q.includes('moving') ||
    q.includes('shifting')
  ) {
    return 'moving_transport';
  }

  return null;
}

/**
 * Category Metadata with Icons, Emojis, and Colors for Map Markers
 */
export interface CategoryVisualMeta {
  id: string;
  icon: string;
  emoji: string;
  nameEn: string;
  nameBn: string;
  color: string;
}

export const CATEGORY_VISUAL_MAP: Record<string, CategoryVisualMeta> = {
  electrical: { id: 'electrical', icon: 'Zap', emoji: '⚡', nameEn: 'Electrical', nameBn: 'বৈদ্যুতিক', color: '#ea580c' },
  plumbing: { id: 'plumbing', icon: 'Droplets', emoji: '🚰', nameEn: 'Plumbing', nameBn: 'প্লাম্বিং', color: '#0284c7' },
  ac_repair: { id: 'ac_repair', icon: 'Wind', emoji: '❄️', nameEn: 'AC Repair', nameBn: 'এসি মেরামত', color: '#06b6d4' },
  refrigerator: { id: 'refrigerator', icon: 'Refrigerator', emoji: '🧊', nameEn: 'Refrigerator', nameBn: 'ফ্রিজ সার্ভিস', color: '#0891b2' },
  washing_machine: { id: 'washing_machine', icon: 'Disc', emoji: '🌀', nameEn: 'Washing Machine', nameBn: 'ওয়াশিং মেশিন', color: '#4f46e5' },
  tv_repair: { id: 'tv_repair', icon: 'Tv', emoji: '📺', nameEn: 'TV Repair', nameBn: 'টিভি মেরামত', color: '#7c3aed' },
  computer_repair: { id: 'computer_repair', icon: 'Laptop', emoji: '💻', nameEn: 'Computer/Laptop', nameBn: 'কম্পিউটার/ল্যাপটপ', color: '#2563eb' },
  mobile_repair: { id: 'mobile_repair', icon: 'Smartphone', emoji: '📱', nameEn: 'Mobile Repair', nameBn: 'মোবাইল মেরামত', color: '#d97706' },
  painting: { id: 'painting', icon: 'Paintbrush', emoji: '🎨', nameEn: 'Painting', nameBn: 'রং মিস্ত্রি', color: '#e11d48' },
  carpentry: { id: 'carpentry', icon: 'Hammer', emoji: '🪚', nameEn: 'Carpentry', nameBn: 'কাঠ মিস্ত্রি', color: '#b45309' },
  masonry: { id: 'masonry', icon: 'Grid', emoji: '🧱', nameEn: 'Masonry', nameBn: 'রাজমিস্ত্রি', color: '#78716c' },
  home_cleaning: { id: 'home_cleaning', icon: 'Sparkles', emoji: '🧹', nameEn: 'Cleaning', nameBn: 'ক্লিনিং সার্ভিস', color: '#10b981' },
  locksmith: { id: 'locksmith', icon: 'Key', emoji: '🔐', nameEn: 'Locksmith', nameBn: 'তালা-চাবি', color: '#f59e0b' },
  generator_service: { id: 'generator_service', icon: 'Zap', emoji: '⚡', nameEn: 'Generator & IPS', nameBn: 'জেনারেটর/আইপিএস', color: '#ea580c' },
  cctv_installation: { id: 'cctv_installation', icon: 'Camera', emoji: '📹', nameEn: 'CCTV Camera', nameBn: 'সিসিটিভি', color: '#475569' },
  internet_wifi: { id: 'internet_wifi', icon: 'Wifi', emoji: '📶', nameEn: 'Internet/WiFi', nameBn: 'ওয়াইফাই টেকনিশিয়ান', color: '#0284c7' },
  mechanic: { id: 'mechanic', icon: 'Wrench', emoji: '🏍️', nameEn: 'Mechanic', nameBn: 'বাইক/গাড়ি মেকানিক', color: '#dc2626' },
  gardening: { id: 'gardening', icon: 'Trees', emoji: '🌿', nameEn: 'Gardening', nameBn: 'বাগান পরিচর্যা', color: '#16a34a' },
  moving_transport: { id: 'moving_transport', icon: 'Truck', emoji: '🚚', nameEn: 'Moving & Shifting', nameBn: 'বাসা বদল সহায়তা', color: '#ca8a04' },
  other_services: { id: 'other_services', icon: 'Settings', emoji: '🛠️', nameEn: 'Handyman/Other', nameBn: 'অন্যান্য কারিগরি', color: '#f97316' }
};

/**
 * Calculates a dynamic recommendation score for a technician based on:
 * - Proximity (closer is better)
 * - Availability (available now gets a massive boost)
 * - Rating (higher rating gets higher score)
 * - Experience & Completed Jobs
 * - Verification
 */
export function calculateRecommendationScore(
  tech: {
    availability?: string;
    rating?: number;
    completedJobs?: number;
    platformVerified?: boolean;
    skillVerified?: boolean;
    experienceYears?: number;
    responseRate?: number;
    latitude?: number;
    longitude?: number;
  },
  userLat: number,
  userLng: number
): number {
  let score = 0;

  // 1. Proximity score (0-40 pts)
  if (tech.latitude && tech.longitude) {
    const dist = calculateHaversineDistance(userLat, userLng, tech.latitude, tech.longitude);
    if (dist <= 1.5) score += 40;
    else if (dist <= 3) score += 32;
    else if (dist <= 6) score += 24;
    else if (dist <= 10) score += 15;
    else score += 5;
  } else {
    score += 10;
  }

  // 2. Availability score (0-25 pts)
  if (tech.availability === 'available') score += 25;
  else if (tech.availability === 'busy') score += 8;

  // 3. Rating score (0-20 pts)
  const rating = tech.rating || 4.5;
  score += Math.max(0, (rating - 4.0) * 20);

  // 4. Verification (0-10 pts)
  if (tech.platformVerified) score += 6;
  if (tech.skillVerified) score += 4;

  // 5. Completed Jobs & Experience (0-5 pts)
  if ((tech.completedJobs || 0) > 200) score += 3;
  if ((tech.experienceYears || 0) >= 6) score += 2;

  return Math.round(score);
}

/**
 * Generates transparent recommendation reasons
 */
export function getRecommendationReasons(
  tech: {
    name: string;
    availability?: string;
    rating?: number;
    platformVerified?: boolean;
    completedJobs?: number;
    latitude?: number;
    longitude?: number;
  },
  userLat: number,
  userLng: number,
  isBangla: boolean
): string[] {
  const reasons: string[] = [];

  if (tech.latitude && tech.longitude) {
    const dist = calculateHaversineDistance(userLat, userLng, tech.latitude, tech.longitude);
    if (dist <= 2) {
      reasons.push(isBangla ? `✓ ${toBengaliNumber(dist.toFixed(1))} কিমি কাছাকাছি` : `✓ ${dist.toFixed(1)} km close to you`);
    } else if (dist <= 5) {
      reasons.push(isBangla ? `✓ আপনার এলাকায় (${toBengaliNumber(dist.toFixed(1))} কিমি)` : `✓ Nearby (${dist.toFixed(1)} km)`);
    }
  }

  if (tech.availability === 'available') {
    reasons.push(isBangla ? '✓ এখনই এভেইলেবল' : '✓ Available right now');
  }

  if (tech.platformVerified) {
    reasons.push(isBangla ? '✓ শতভাগ যাচাইকৃত' : '✓ Fully Verified');
  }

  if (tech.rating && tech.rating >= 4.8) {
    reasons.push(isBangla ? `✓ ${toBengaliNumber(tech.rating)} স্টার রেটিং` : `✓ ${tech.rating} Star Rating`);
  }

  if (tech.completedJobs && tech.completedJobs >= 150) {
    reasons.push(isBangla ? `✓ ${toBengaliNumber(tech.completedJobs)}+ সফল কাজ` : `✓ ${tech.completedJobs}+ jobs completed`);
  }

  return reasons.slice(0, 3);
}
