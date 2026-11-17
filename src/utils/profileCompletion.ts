import { Technician, User } from '../types';

export interface CompletionResult {
  percent: number;
  completedCount: number;
  totalCount: number;
  missingLabelsBn: string[];
  missingLabelsEn: string[];
  isMinReady: boolean; // >= 90%
  isComplete: boolean; // 100%
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
];

export function calculateCustomerCompletion(user: Partial<User> | null | undefined): CompletionResult {
  if (!user) {
    return {
      percent: 0,
      completedCount: 0,
      totalCount: 7,
      missingLabelsBn: ['লগইন করুন'],
      missingLabelsEn: ['Login required'],
      isMinReady: false,
      isComplete: false
    };
  }

  const checks = [
    {
      ok: !!user.name && user.name.trim().length >= 2,
      bn: 'পূর্ণ নাম',
      en: 'Full Name'
    },
    {
      ok: !!user.phone && user.phone.trim().length >= 8,
      bn: 'মোবাইল নম্বর',
      en: 'Phone Number'
    },
    {
      ok: !!user.avatar && user.avatar.trim().length > 10,
      bn: 'প্রোফাইল ছবি',
      en: 'Profile Photo'
    },
    {
      ok: !!user.division && user.division.trim().length > 0,
      bn: 'বিভাগ',
      en: 'Division'
    },
    {
      ok: !!(user.district || user.city) && (user.district || user.city || '').trim().length > 0,
      bn: 'জেলা / শহর',
      en: 'District / City'
    },
    {
      ok: !!user.area && user.area.trim().length > 0,
      bn: 'এলাকা / উপজেলা',
      en: 'Area / Upazila'
    },
    {
      ok: !!user.address && user.address.trim().length >= 6,
      bn: 'বিস্তারিত ঠিকানা',
      en: 'Detailed Address'
    }
  ];

  const completedCount = checks.filter(c => c.ok).length;
  const totalCount = checks.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  return {
    percent,
    completedCount,
    totalCount,
    missingLabelsBn: checks.filter(c => !c.ok).map(c => c.bn),
    missingLabelsEn: checks.filter(c => !c.ok).map(c => c.en),
    isMinReady: percent >= 90,
    isComplete: percent === 100
  };
}

export function calculateTechnicianCompletion(tech: Partial<Technician> | null | undefined): CompletionResult {
  if (!tech) {
    return {
      percent: 0,
      completedCount: 0,
      totalCount: 12,
      missingLabelsBn: ['প্রোফাইল তথ্য'],
      missingLabelsEn: ['Profile details'],
      isMinReady: false,
      isComplete: false
    };
  }

  // Pre-seeded verified demo technicians without explicit NID image strings count as verified if nidVerified is true
  const hasNidFront = !!tech.nidFrontImage && tech.nidFrontImage.trim().length > 10;
  const hasNidBack = !!tech.nidBackImage && tech.nidBackImage.trim().length > 10;
  const hasAvatar = !!tech.avatar && tech.avatar.trim().length > 10 && !DEFAULT_AVATARS.includes(tech.avatar);

  const checks = [
    {
      ok: !!tech.name && tech.name.trim().length >= 2,
      bn: 'পূর্ণ নাম',
      en: 'Full Name'
    },
    {
      ok: !!tech.phone && tech.phone.trim().length >= 8,
      bn: 'মোবাইল নম্বর',
      en: 'Phone Number'
    },
    {
      ok: hasAvatar || !!tech.platformVerified,
      bn: 'নিজস্ব প্রোফাইল ছবি',
      en: 'Profile Photo'
    },
    {
      ok: !!tech.division && tech.division.trim().length > 0,
      bn: 'বিভাগ',
      en: 'Division'
    },
    {
      ok: !!(tech.district || tech.city) && (tech.district || tech.city || '').trim().length > 0,
      bn: 'জেলা / শহর',
      en: 'District / City'
    },
    {
      ok: !!tech.primaryArea && tech.primaryArea.trim().length > 0,
      bn: 'প্রধান এলাকা / উপজেলা',
      en: 'Primary Area'
    },
    {
      ok: typeof tech.experienceYears === 'number' && tech.experienceYears > 0,
      bn: 'অভিজ্ঞতার বছর',
      en: 'Years of Experience'
    },
    {
      ok: !!tech.workingHours && tech.workingHours.trim().length >= 4,
      bn: 'কাজের সময়সীমা',
      en: 'Working Hours'
    },
    {
      ok: !!tech.bioBn && tech.bioBn.trim().length >= 8,
      bn: 'সংক্ষিপ্ত বায়ো',
      en: 'Short Bio'
    },
    {
      ok: !!tech.aboutBn && tech.aboutBn.trim().length >= 10,
      bn: 'কাজের বিস্তারিত বিবরণ',
      en: 'Detailed Specialization'
    },
    {
      ok: Array.isArray(tech.skills) && tech.skills.length > 0 && typeof tech.visitingFee === 'number' && tech.visitingFee > 0,
      bn: 'দক্ষতা ও সার্ভিস রেট',
      en: 'Skills & Visiting Fee'
    },
    {
      ok: (hasNidFront && hasNidBack) || !!tech.nidVerified,
      bn: 'NID-এর সামনের ও পেছনের ছবি',
      en: 'NID Front & Back Photos'
    }
  ];

  const completedCount = checks.filter(c => c.ok).length;
  const totalCount = checks.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  return {
    percent,
    completedCount,
    totalCount,
    missingLabelsBn: checks.filter(c => !c.ok).map(c => c.bn),
    missingLabelsEn: checks.filter(c => !c.ok).map(c => c.en),
    isMinReady: percent >= 90,
    isComplete: percent === 100
  };
}
