import { ServiceCategory } from '../types';

export interface DiagnosisResult {
  categoryId: string;
  categoryNameEn: string;
  categoryNameBn: string;
  confidence: number; // e.g. 95%
  recommendedUrgency: 'normal' | 'today' | 'emergency';
  estimatedCostRange: {
    visitingFee: number;
    labourMin: number;
    labourMax: number;
  };
  keySymptoms: string[];
  reasoningEn: string;
  reasoningBn: string;
}

// Comprehensive Bangla & English keyword dictionary
const categoryRules: Record<string, {
  keywords: string[];
  emergencyTriggers: string[];
  defaultUrgency: 'normal' | 'today' | 'emergency';
  visitingFee: number;
  labourMin: number;
  labourMax: number;
}> = {
  electrical: {
    keywords: [
      'বিদ্যুৎ', 'কারেন্ট', 'শর্ট', 'সার্কিট', 'ব্রেকার', 'ফ্যান', 'সুইচ', 'স্পার্ক', 'আগুন', 'ধোঁয়া',
      'ওয়্যারিং', 'আলো', 'টিউবলাইট', 'মিটার', 'শক', 'রেগুলেটর', 'লাইট', 'spark', 'short circuit',
      'breaker', 'electric', 'fan', 'switch', 'wiring', 'fuse', 'light', 'shock', 'tripping'
    ],
    emergencyTriggers: ['স্পার্ক', 'আগুন', 'ধোঁয়া', 'শক', 'পোড়া গন্ধ', 'spark', 'fire', 'smoke', 'shock', 'short circuit', 'blast'],
    defaultUrgency: 'today',
    visitingFee: 200,
    labourMin: 300,
    labourMax: 600
  },
  plumbing: {
    keywords: [
      'পানি', 'পাইপ', 'লিক', 'ফুটো', 'ট্যাপ', 'কল', 'বেসিন', 'কমোড', 'টয়লেট', 'ড্রেন', 'পাম্প',
      'মোটর', 'পানির লাইন', 'পানির ট্যাংক', 'প্লাগ', 'পানি পড়ছে', 'ভেসে যাচ্ছে', 'water', 'leak',
      'pipe', 'burst', 'tap', 'basin', 'commode', 'toilet', 'drain', 'pump', 'overflow', 'faucet', 'clog'
    ],
    emergencyTriggers: ['পাইপ ফেটে', 'ভেসে যাচ্ছে', 'তীব্র লিকেজ', 'burst', 'flooding', 'severe leak', 'overflowing'],
    defaultUrgency: 'today',
    visitingFee: 250,
    labourMin: 350,
    labourMax: 700
  },
  ac_repair: {
    keywords: [
      'এসি', 'ac', 'ঠান্ডা হচ্ছে না', 'গ্যাস', 'কম্প্রেসার', 'জেট ওয়াশ', 'কুলিং', 'বাতাস গরম',
      'রিমোট', 'ইনভার্টার', 'এয়ার কন্ডিশনার', 'cooling', 'compressor', 'gas refill', 'servicing', 'not cooling', 'air conditioner'
    ],
    emergencyTriggers: ['পানি পড়ছে এসি থেকে', 'water leaking from ac', 'compressor spark'],
    defaultUrgency: 'today',
    visitingFee: 200,
    labourMin: 400,
    labourMax: 800
  },
  refrigerator: {
    keywords: [
      'ফ্রিজ', 'রেফ্রিজারেটর', 'ডিপ ফ্রিজ', 'বরফ জমছে না', 'খাবার নষ্ট', 'ফ্রিজ গরম', 'গ্যাস চার্জ',
      'fridge', 'refrigerator', 'freezer', 'cooling', 'defrost', 'ice', 'spoiling'
    ],
    emergencyTriggers: ['খাবার নষ্ট হচ্ছে', 'food spoiling', 'freezer melting'],
    defaultUrgency: 'today',
    visitingFee: 200,
    labourMin: 350,
    labourMax: 750
  },
  locksmith: {
    keywords: [
      'তালা', 'চাবি', 'লক', 'ভেঙে গেছে', 'আটকে গেছি', 'লকড', 'চাবি হারিয়েছে', 'দরজা খুলছে না',
      'lock', 'key', 'locked out', 'broken key', 'stuck door', 'padlock', 'deadbolt'
    ],
    emergencyTriggers: ['আটকে গেছি', 'locked out', 'inside locked', 'emergency', 'বাচ্চা আটকে'],
    defaultUrgency: 'emergency',
    visitingFee: 250,
    labourMin: 350,
    labourMax: 600
  },
  computer_repair: {
    keywords: [
      'কম্পিউটার', 'ল্যাপটপ', 'উইন্ডোজ', 'ব্লু স্ক্রিন', 'অন হচ্ছে না', 'স্লো', 'এসএসডি', 'র‍্যাম', 'কীবোর্ড',
      'computer', 'laptop', 'windows', 'blue screen', 'ram', 'ssd', 'hang', 'slow', 'boot'
    ],
    emergencyTriggers: [],
    defaultUrgency: 'normal',
    visitingFee: 250,
    labourMin: 400,
    labourMax: 900
  },
  painting: {
    keywords: [
      'রং', 'কালার', 'পেইন্ট', 'দেয়াল', 'ড্যাম্প', 'চটা', 'পুটি', 'হোয়াইটওয়াশ', 'বার্জার', 'রিনোভেশন',
      'paint', 'color', 'wall', 'damp', 'peeling', 'putty', 'interior', 'whitewash'
    ],
    emergencyTriggers: [],
    defaultUrgency: 'normal',
    visitingFee: 300,
    labourMin: 800,
    labourMax: 2500
  },
  home_cleaning: {
    keywords: [
      'পরিষ্কার', 'ক্লিন', 'ডিপ ক্লিনিং', 'সোফা', 'কার্পেট', 'বাথরুম ময়লা', 'কিচেন তেল', 'বাসা পরিষ্কার',
      'cleaning', 'deep clean', 'sofa', 'carpet', 'dirty', 'washroom', 'kitchen'
    ],
    emergencyTriggers: [],
    defaultUrgency: 'normal',
    visitingFee: 200,
    labourMin: 600,
    labourMax: 1800
  },
  carpentry: {
    keywords: [
      'কাঠ', 'ছুতার', 'দরজা', 'জানালা', 'খাট', 'ওয়ারড্রব', 'আলমারি', 'ফার্নিচার', 'হিঞ্জ', 'কেবিনেট',
      'carpenter', 'wood', 'furniture', 'door', 'bed', 'cabinet', 'wardrobe', 'table'
    ],
    emergencyTriggers: [],
    defaultUrgency: 'normal',
    visitingFee: 200,
    labourMin: 400,
    labourMax: 900
  },
  generator_service: {
    keywords: [
      'আইপিএস', 'ips', 'জেনারেটর', 'generator', 'ব্যাটারি', 'battery', 'ইনভার্টার', 'লোডশেডিং ব্যাকআপ'
    ],
    emergencyTriggers: ['power cut', 'লোডশেডিং', 'battery spark'],
    defaultUrgency: 'today',
    visitingFee: 300,
    labourMin: 500,
    labourMax: 1200
  },
  mechanic: {
    keywords: [
      'বাইক', 'গাড়ি', 'মোটরসাইকেল', 'মেকানিক', 'স্টার্ট নিচ্ছে না', 'পাংচার', 'ব্রেক', 'ইঞ্জিন',
      'bike', 'car', 'motorcycle', 'mechanic', 'puncture', 'breakdown', 'not starting', 'engine'
    ],
    emergencyTriggers: ['রাস্তায় নষ্ট', 'breakdown on road', 'stranded'],
    defaultUrgency: 'emergency',
    visitingFee: 250,
    labourMin: 350,
    labourMax: 800
  }
};

export function diagnoseProblemWithRules(
  userInput: string,
  categories: ServiceCategory[]
): DiagnosisResult {
  const normalized = userInput.toLowerCase().trim();

  let bestMatchCategory = 'other_services';
  let highestScore = 0;
  let detectedUrgency: 'normal' | 'today' | 'emergency' = 'normal';
  const detectedSymptoms: string[] = [];

  for (const [catId, rule] of Object.entries(categoryRules)) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        score += 10;
        detectedSymptoms.push(kw);
      }
    }

    let isEmergency = false;
    for (const em of rule.emergencyTriggers) {
      if (normalized.includes(em.toLowerCase())) {
        score += 25;
        isEmergency = true;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatchCategory = catId;
      detectedUrgency = isEmergency ? 'emergency' : rule.defaultUrgency;
    }
  }

  // Fallback if no specific keywords triggered
  if (highestScore === 0) {
    bestMatchCategory = 'electrical'; // most common home query fallback
  }

  const categoryObj = categories.find(c => c.id === bestMatchCategory) || categories[0];
  const rule = categoryRules[bestMatchCategory] || {
    visitingFee: categoryObj.startingPrice || 250,
    labourMin: 300,
    labourMax: 600
  };

  const confidence = Math.min(96, Math.max(65, 55 + highestScore * 2));

  return {
    categoryId: categoryObj.id,
    categoryNameEn: categoryObj.nameEn,
    categoryNameBn: categoryObj.nameBn,
    confidence,
    recommendedUrgency: detectedUrgency,
    estimatedCostRange: {
      visitingFee: rule.visitingFee,
      labourMin: rule.labourMin,
      labourMax: rule.labourMax
    },
    keySymptoms: Array.from(new Set(detectedSymptoms)).slice(0, 4),
    reasoningEn: `Identified keywords corresponding to ${categoryObj.nameEn}. Recommended priority: ${detectedUrgency}.`,
    reasoningBn: `বর্ণিত তথ্যের ভিত্তিতে '${categoryObj.nameBn}' ক্যাটাগরি শনাক্ত করা হয়েছে। কাজের অগ্রাধিকার: ${detectedUrgency === 'emergency' ? '🚨 অতি জরুরি' : detectedUrgency === 'today' ? 'আজকের মধ্যে' : 'সাধারণ'}।`
  };
}
