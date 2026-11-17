import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type { PlatformRules, ServiceSubcategory, PricingRule } from '../../src/types/finance';
import { initialCategories, initialTechnicians, demoUsers, initialBookings } from '../../src/data/seedData';

export const DEFAULT_PLATFORM_RULES: PlatformRules = {
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: 'user-admin-demo',
  general: {
    platformName: 'Servexa',
    businessTagline: 'Smart Home & Skilled Technician Platform (Bangladesh)',
    currency: 'BDT',
    currencySymbol: '৳',
    allowPriceCustomization: true,
    allowEmergencyServices: true,
    allowCashOnCompletion: true,
    activePaymentMethods: {
      bkash: true,
      nagad: true,
      rocket: true,
      card: true,
      cash: true,
    },
  },
  commission: {
    defaultPlatformCommissionPercent: 10,
    defaultTechnicianEarningsPercent: 90,
    allowCategoryCommissionOverride: true,
    allowSubcategoryCommissionOverride: true,
    commissionableItems: {
      servicePrice: true,
      visitingFee: false,
      hourlyCharge: true,
      extraWorkCharge: true,
      emergencyCharge: true,
      nightCharge: true,
      weekendCharge: true,
      materialCost: false,
    },
    discountPolicy: 'DEDUCT_BEFORE_COMMISSION',
  },
  customizationPermissions: {
    servicePrice: 'TECH_CUSTOMIZABLE_RANGE',
    visitingFee: 'TECH_CUSTOMIZABLE_RANGE',
    hourlyRate: 'TECH_CUSTOMIZABLE_APPROVAL',
    additionalHourCharge: 'ADMIN_CONTROLLED',
    emergencyCharge: 'ADMIN_CONTROLLED',
    nightCharge: 'ADMIN_CONTROLLED',
    weekendCharge: 'FIXED_NO_CUSTOMIZATION',
  },
  visitingAndAdditional: {
    defaultVisitingFee: 200,
    minVisitingFee: 100,
    maxVisitingFee: 500,
    waiveVisitingFeeWhenCompleted: false,
    additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
    defaultEmergencyCharge: 150,
    defaultNightCharge: 150,
    defaultWeekendCharge: 100,
    nightHoursStart: '21:00',
    nightHoursEnd: '07:00',
  },
  materialPolicy: {
    policy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
    requireReceiptNoteAbove: 300,
    maxUnverifiedMaterialAmount: 10000,
    requireCustomerExplicitApproval: true,
  },
  walletAndReserve: {
    globalMinimumReserveBalance: 500,
    minimumWithdrawalAmount: 500,
    maximumWithdrawalAmount: 25000,
    requireCustomerConfirmationForAvailability: false,
    holdEarningsDaysAfterCompletion: 0,
  },
  withdrawal: {
    maxRequestsPerDay: 2,
    maxRequestsPerWeek: 7,
    withdrawalFeePercent: 0,
    withdrawalFlatFee: 0,
    autoReviewAboveAmount: 10000,
    requireVerifiedPayoutAccount: true,
    allowedPayoutProviders: {
      bkash: true,
      nagad: true,
      rocket: true,
      bank: true,
    },
  },
  onlinePayment: {
    requireServerWebhookVerification: true,
    allowPartialPayment: false,
    paymentSessionExpiryMinutes: 30,
    autoCalculateEarningsOnVerify: true,
  },
  cashOnCompletion: {
    depositDeadlineHours: 48,
    reminderIntervalHours: 12,
    gracePeriodHours: 12,
    restrictNewBookingsAfterOverdueReview: true,
    maxAllowedOverdueAmount: 1000,
    approvedDepositChannels: ['bkash_merchant', 'nagad_merchant', 'bank_transfer', 'sslcommerz'],
    requireAdminReconciliationIfNoApi: true,
  },
  bookingAndCancellation: {
    freeCancellationHoursBefore: 2,
    lateCancellationFee: 100,
    allowRescheduling: true,
    maxActiveBookingsPerTechnician: 8,
  },
  refundAndDispute: {
    allowFullRefund: true,
    allowPartialRefund: true,
    holdTechnicianEarningsDuringDispute: true,
    disputeResolutionSlaHours: 24,
  },
  discountAndPromo: {
    allowPromoCodes: true,
    maxPromoDiscountPercent: 30,
    allowFirstBookingDiscount: false,
    firstBookingDiscountPercent: 10,
  },
};

const SEED_SUBCATEGORIES_AND_RULES: Array<{
  sub: Omit<ServiceSubcategory, 'pricingRuleId'>;
  rule: Omit<PricingRule, 'id' | 'subcategoryId' | 'ruleVersion' | 'updatedAt'>;
}> = [
  {
    sub: {
      id: 'sub-fan-repair',
      categoryId: 'electrical',
      nameEn: 'Fan Repair',
      nameBn: 'সিলিং ও স্ট্যান্ড ফ্যান মেরামত',
      descriptionEn: 'Capacitor change, bearing replacement, regulator and winding check',
      descriptionBn: 'ক্যাপাসিটর পরিবর্তন, বেয়ারিং, রেগুলেটর ও কয়েল চেক',
      icon: 'Fan',
      active: true,
    },
    rule: {
      categoryId: 'electrical',
      serviceTitleEn: 'Fan Repair',
      serviceTitleBn: 'ফ্যান মেরামত',
      defaultPrice: 300,
      minPrice: 250,
      maxPrice: 600,
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 150,
      minVisitingFee: 100,
      maxVisitingFee: 300,
      hourlyRate: 200,
      additionalHourCharge: 150,
      emergencyCharge: 150,
      nightCharge: 150,
      weekendCharge: 100,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-light-install',
      categoryId: 'electrical',
      nameEn: 'Light Installation',
      nameBn: 'লাইট ও এলইডি ফিটিং',
      descriptionEn: 'Tube light, panel light, chandelier and fixture mounting',
      descriptionBn: 'টিউব লাইট, প্যানেল লাইট, ঝাড়বাতি ও হোল্ডার স্থাপন',
      icon: 'Lightbulb',
      active: true,
    },
    rule: {
      categoryId: 'electrical',
      serviceTitleEn: 'Light Installation',
      serviceTitleBn: 'লাইট ইনস্টলেশন',
      defaultPrice: 300,
      minPrice: 200,
      maxPrice: 700,
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 150,
      minVisitingFee: 100,
      maxVisitingFee: 300,
      hourlyRate: 200,
      additionalHourCharge: 150,
      emergencyCharge: 150,
      nightCharge: 150,
      weekendCharge: 100,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-wiring',
      categoryId: 'electrical',
      nameEn: 'Wiring & Short Circuit Fix',
      nameBn: 'হাউস ওয়্যারিং ও শর্ট সার্কিট সমাধান',
      descriptionEn: 'Concealed/surface wiring, MCB breaker, DB box & earthing diagnostics',
      descriptionBn: 'ওয়্যারিং লাইন, এমসিবি ব্রেকার, ডিবি বক্স ও আর্থিং মেরামত',
      icon: 'Zap',
      active: true,
    },
    rule: {
      categoryId: 'electrical',
      serviceTitleEn: 'Wiring & Short Circuit Fix',
      serviceTitleBn: 'ওয়্যারিং ও শর্ট সার্কিট',
      defaultPrice: 500,
      minPrice: 350,
      maxPrice: 1800,
      customizationPermission: 'TECH_CUSTOMIZABLE_APPROVAL',
      visitingFee: 200,
      minVisitingFee: 100,
      maxVisitingFee: 400,
      hourlyRate: 300,
      additionalHourCharge: 200,
      emergencyCharge: 200,
      nightCharge: 200,
      weekendCharge: 100,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: true,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-switch-repair',
      categoryId: 'electrical',
      nameEn: 'Switch & Socket Repair',
      nameBn: 'সুইচ বোর্ড ও সকেট মেরামত',
      descriptionEn: 'Burnt socket replacement, dimmer, heavy AC/fridge power point setup',
      descriptionBn: 'পোড়া সকেট পরিবর্তন, ডিমার ও হেভি লোড পয়েন্ট ফিটিং',
      icon: 'ToggleRight',
      active: true,
    },
    rule: {
      categoryId: 'electrical',
      serviceTitleEn: 'Switch & Socket Repair',
      serviceTitleBn: 'সুইচ মেরামত',
      defaultPrice: 250,
      minPrice: 200,
      maxPrice: 500,
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 150,
      minVisitingFee: 100,
      maxVisitingFee: 250,
      hourlyRate: 180,
      additionalHourCharge: 120,
      emergencyCharge: 150,
      nightCharge: 150,
      weekendCharge: 100,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-pipe-repair',
      categoryId: 'plumbing',
      nameEn: 'Pipe Repair',
      nameBn: 'পানির পাইপ মেরামত',
      descriptionEn: 'Burst PVC/CPVC pipe joint fixing, concealed leakage sealing',
      descriptionBn: 'ফাটা পাইপ জয়েন্ট ও কনসিলড লিকেজ মেরামত',
      icon: 'Wrench',
      active: true,
    },
    rule: {
      categoryId: 'plumbing',
      serviceTitleEn: 'Pipe Repair',
      serviceTitleBn: 'পাইপ মেরামত',
      defaultPrice: 400,
      minPrice: 300,
      maxPrice: 900,
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 200,
      minVisitingFee: 100,
      maxVisitingFee: 350,
      hourlyRate: 250,
      additionalHourCharge: 150,
      emergencyCharge: 150,
      nightCharge: 150,
      weekendCharge: 100,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-tap-install',
      categoryId: 'plumbing',
      nameEn: 'Water Tap Installation',
      nameBn: 'পানির কল ও মিক্সার স্থাপন',
      descriptionEn: 'Bib cock, sink mixer, shower head and angle valve fitting',
      descriptionBn: 'ট্যাপ, সিংক মিক্সার, শাওয়ার ও এঙ্গেল স্টপকক ফিটিং',
      icon: 'Droplets',
      active: true,
    },
    rule: {
      categoryId: 'plumbing',
      serviceTitleEn: 'Water Tap Installation',
      serviceTitleBn: 'ট্যাপ ইনস্টলেশন',
      defaultPrice: 350,
      minPrice: 250,
      maxPrice: 700,
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 150,
      minVisitingFee: 100,
      maxVisitingFee: 300,
      hourlyRate: 200,
      additionalHourCharge: 120,
      emergencyCharge: 150,
      nightCharge: 150,
      weekendCharge: 100,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-leakage-repair',
      categoryId: 'plumbing',
      nameEn: 'Water Leakage Repair',
      nameBn: 'ওয়াটার লিকেজ ও বেসিন ড্রেন সমাধান',
      descriptionEn: 'Basin/sink trap unclogging, commode cistern & tank overflow repair',
      descriptionBn: 'বেসিন ড্রেন ব্লক, কমোড ফ্ল্যাশ ও ট্যাংক লিকেজ সমাধান',
      icon: 'Droplets',
      active: true,
    },
    rule: {
      categoryId: 'plumbing',
      serviceTitleEn: 'Water Leakage Repair',
      serviceTitleBn: 'ওয়াটার লিকেজ মেরামত',
      defaultPrice: 450,
      minPrice: 300,
      maxPrice: 1100,
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 200,
      minVisitingFee: 100,
      maxVisitingFee: 350,
      hourlyRate: 250,
      additionalHourCharge: 150,
      emergencyCharge: 180,
      nightCharge: 150,
      weekendCharge: 100,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-ac-servicing',
      categoryId: 'ac_repair',
      nameEn: 'AC Servicing (Jet Wash)',
      nameBn: 'এসি জেট ওয়াশ ও সার্ভিসিং',
      descriptionEn: 'Indoor & outdoor deep jet cleaning, filter wash & drain line flush',
      descriptionBn: 'ইনডোর ও আউটডোর জেট ওয়াশ, ফিল্টার পরিষ্কার ও ড্রেন ফ্লাশ',
      icon: 'Wind',
      active: true,
    },
    rule: {
      categoryId: 'ac_repair',
      serviceTitleEn: 'AC Servicing',
      serviceTitleBn: 'এসি সার্ভিসিং',
      defaultPrice: 800,
      minPrice: 600,
      maxPrice: 1500,
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 200,
      minVisitingFee: 100,
      maxVisitingFee: 400,
      hourlyRate: 400,
      additionalHourCharge: 250,
      emergencyCharge: 200,
      nightCharge: 200,
      weekendCharge: 150,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-ac-install',
      categoryId: 'ac_repair',
      nameEn: 'AC Installation / Uninstallation',
      nameBn: 'এসি ইনস্টলেশন ও শিফটিং',
      descriptionEn: 'Split/window AC bracket mounting, copper piping & vacuum commissioning',
      descriptionBn: 'স্প্লিট এসি মাউন্টিং, কপার পাইপ কানেকশন ও ভ্যাকুয়ামিং',
      icon: 'Wind',
      active: true,
    },
    rule: {
      categoryId: 'ac_repair',
      serviceTitleEn: 'AC Installation',
      serviceTitleBn: 'এসি ইনস্টলেশন',
      defaultPrice: 1800,
      minPrice: 1200,
      maxPrice: 3000,
      customizationPermission: 'TECH_CUSTOMIZABLE_APPROVAL',
      visitingFee: 200,
      minVisitingFee: 100,
      maxVisitingFee: 400,
      hourlyRate: 500,
      additionalHourCharge: 300,
      emergencyCharge: 250,
      nightCharge: 250,
      weekendCharge: 150,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: true,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-ac-repair',
      categoryId: 'ac_repair',
      nameEn: 'AC Repair & PCB Diagnostics',
      nameBn: 'এসি মেরামত ও সার্কিট বোর্ড চেক',
      descriptionEn: 'Compressor, capacitor, sensor, PCB inverter board & cooling troubleshooting',
      descriptionBn: 'কম্প্রেসার, ক্যাপাসিটর, সেন্সর ও ইনভার্টার পিসিবি মেরামত',
      icon: 'Cpu',
      active: true,
    },
    rule: {
      categoryId: 'ac_repair',
      serviceTitleEn: 'AC Repair',
      serviceTitleBn: 'এসি মেরামত',
      defaultPrice: 1000,
      minPrice: 600,
      maxPrice: 2200,
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 200,
      minVisitingFee: 100,
      maxVisitingFee: 400,
      hourlyRate: 400,
      additionalHourCharge: 250,
      emergencyCharge: 250,
      nightCharge: 200,
      weekendCharge: 150,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-ac-gas',
      categoryId: 'ac_repair',
      nameEn: 'AC Gas Refill (R32 / R410A / R22)',
      nameBn: 'এসি গ্যাস রিফিল ও লিক টেস্ট',
      descriptionEn: 'Nitrogen pressure leak test, vacuuming & complete refrigerant charge',
      descriptionBn: 'লিক টেস্ট, ভ্যাকুয়াম ও সম্পূর্ণ রেফ্রিজারেন্ট গ্যাস চার্জিং',
      icon: 'Wind',
      active: true,
    },
    rule: {
      categoryId: 'ac_repair',
      serviceTitleEn: 'AC Gas Refill',
      serviceTitleBn: 'এসি গ্যাস রিফিল',
      defaultPrice: 1800,
      minPrice: 1400,
      maxPrice: 3200,
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 200,
      minVisitingFee: 100,
      maxVisitingFee: 400,
      hourlyRate: 450,
      additionalHourCharge: 250,
      emergencyCharge: 250,
      nightCharge: 200,
      weekendCharge: 150,
      materialPolicy: 'COMMISSIONABLE_MATERIAL',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-fridge-repair',
      categoryId: 'refrigerator',
      nameEn: 'Refrigerator Repair',
      nameBn: 'ফ্রিজ ও ডিপ ফ্রিজ মেরামত',
      descriptionEn: 'Thermostat, relay/overload, cooling coil & gas charging service',
      descriptionBn: 'থার্মোস্টেট, রিলে, কুলিং চেক ও গ্যাস চার্জিং',
      icon: 'Refrigerator',
      active: true,
    },
    rule: {
      categoryId: 'refrigerator',
      serviceTitleEn: 'Refrigerator Repair',
      serviceTitleBn: 'ফ্রিজ মেরামত',
      defaultPrice: 600,
      minPrice: 400,
      maxPrice: 1600,
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 200,
      minVisitingFee: 100,
      maxVisitingFee: 350,
      hourlyRate: 300,
      additionalHourCharge: 200,
      emergencyCharge: 200,
      nightCharge: 150,
      weekendCharge: 100,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
    },
  },
  {
    sub: {
      id: 'sub-washing-machine',
      categoryId: 'washing_machine',
      nameEn: 'Washing Machine Repair',
      nameBn: 'ওয়াশিং মেশিন সার্ভিস ও মেরামত',
      descriptionEn: 'Drain motor, spin belt, PCB error fix & inlet valve repair',
      descriptionBn: 'ড্রেন মোটর, স্পিন বেল্ট ও পিসিবি বোর্ড মেরামত',
      icon: 'Disc',
      active: true,
    },
    rule: {
      categoryId: 'washing_machine',
      serviceTitleEn: 'Washing Machine Repair',
      serviceTitleBn: 'ওয়াশিং মেশিন মেরামত',
      defaultPrice: 650,
      minPrice: 450,
      maxPrice: 1600,
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 200,
      minVisitingFee: 100,
      maxVisitingFee: 350,
      hourlyRate: 350,
      additionalHourCharge: 200,
      emergencyCharge: 200,
      nightCharge: 150,
      weekendCharge: 100,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
    },
  },
];

let dbInstance: Database.Database | null = null;

export function getDbPath(): string {
  return process.env.SERVEXA_DB_PATH || path.join(process.cwd(), 'data', 'servexa.db');
}

export function resetDbForTests(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
  }
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initializeSchema(db);
  seedDatabaseIfEmpty(db);

  dbInstance = db;
  return db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password TEXT,
      role TEXT NOT NULL CHECK(role IN ('CUSTOMER','TECHNICIAN','ADMIN')),
      avatar TEXT,
      division TEXT DEFAULT '',
      district TEXT DEFAULT '',
      city TEXT DEFAULT '',
      area TEXT DEFAULT '',
      address TEXT DEFAULT '',
      nid_verified INTEGER DEFAULT 0,
      phone_verified INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS technicians (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      avatar TEXT,
      city TEXT DEFAULT 'Dhaka',
      district TEXT DEFAULT 'Dhaka',
      division TEXT DEFAULT 'Dhaka',
      primary_area TEXT DEFAULT '',
      visiting_fee REAL DEFAULT 200,
      starting_price REAL DEFAULT 300,
      skills_json TEXT DEFAULT '[]',
      skill_verified INTEGER DEFAULT 0,
      platform_verified INTEGER DEFAULT 0,
      nid_verified INTEGER DEFAULT 0,
      availability TEXT DEFAULT 'available',
      rating REAL DEFAULT 5.0,
      completed_jobs INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS platform_rules (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      version INTEGER NOT NULL DEFAULT 1,
      rules_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rule_versions (
      id TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      changed_by TEXT NOT NULL,
      summary TEXT NOT NULL,
      rules_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      section TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      previous_value TEXT NOT NULL,
      new_value TEXT NOT NULL,
      reason TEXT,
      rule_version INTEGER,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at DESC);

    CREATE TABLE IF NOT EXISTS service_categories (
      id TEXT PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      icon TEXT DEFAULT 'Wrench',
      description_en TEXT DEFAULT '',
      description_bn TEXT DEFAULT '',
      starting_price REAL NOT NULL DEFAULT 300,
      commission_override_percent REAL,
      emergency_available INTEGER DEFAULT 0,
      popular INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      active_professionals INTEGER DEFAULT 0,
      tags_json TEXT DEFAULT '[]',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_subcategories (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
      name_en TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      description_en TEXT DEFAULT '',
      description_bn TEXT DEFAULT '',
      icon TEXT DEFAULT 'Wrench',
      active INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pricing_rules (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
      subcategory_id TEXT REFERENCES service_subcategories(id) ON DELETE CASCADE,
      service_title_en TEXT NOT NULL,
      service_title_bn TEXT NOT NULL,
      default_price REAL NOT NULL,
      min_price REAL NOT NULL,
      max_price REAL NOT NULL,
      customization_permission TEXT NOT NULL DEFAULT 'TECH_CUSTOMIZABLE_RANGE',
      visiting_fee REAL NOT NULL DEFAULT 200,
      min_visiting_fee REAL NOT NULL DEFAULT 100,
      max_visiting_fee REAL NOT NULL DEFAULT 500,
      hourly_rate REAL NOT NULL DEFAULT 250,
      additional_hour_charge REAL NOT NULL DEFAULT 150,
      emergency_charge REAL NOT NULL DEFAULT 150,
      night_charge REAL NOT NULL DEFAULT 150,
      weekend_charge REAL NOT NULL DEFAULT 100,
      material_policy TEXT NOT NULL DEFAULT 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additional_charge_policy TEXT NOT NULL DEFAULT 'REQUIRE_CUSTOMER_APPROVAL',
      requires_price_approval INTEGER DEFAULT 0,
      commission_override_percent REAL,
      active INTEGER DEFAULT 1,
      rule_version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pricing_cat ON pricing_rules(category_id, subcategory_id);

    CREATE TABLE IF NOT EXISTS technician_services (
      id TEXT PRIMARY KEY,
      technician_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      subcategory_id TEXT NOT NULL,
      pricing_rule_id TEXT NOT NULL REFERENCES pricing_rules(id),
      service_title_en TEXT NOT NULL,
      service_title_bn TEXT NOT NULL,
      approved_price REAL NOT NULL,
      approved_visiting_fee REAL NOT NULL,
      approved_hourly_rate REAL NOT NULL,
      approved_additional_hour_charge REAL NOT NULL,
      approved_emergency_charge REAL NOT NULL,
      approved_night_charge REAL NOT NULL,
      approved_weekend_charge REAL NOT NULL,
      pending_price REAL,
      pending_visiting_fee REAL,
      pending_hourly_rate REAL,
      pending_additional_hour_charge REAL,
      pending_emergency_charge REAL,
      pending_night_charge REAL,
      pending_weekend_charge REAL,
      status TEXT NOT NULL DEFAULT 'DEFAULT_PRICE',
      active INTEGER DEFAULT 1,
      rejection_reason TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE(technician_id, subcategory_id)
    );
    CREATE INDEX IF NOT EXISTS idx_tech_services_tech ON technician_services(technician_id);

    CREATE TABLE IF NOT EXISTS technician_price_history (
      id TEXT PRIMARY KEY,
      technician_id TEXT NOT NULL,
      technician_service_id TEXT NOT NULL,
      service_title_en TEXT NOT NULL,
      field TEXT NOT NULL,
      previous_value REAL NOT NULL,
      new_value REAL NOT NULL,
      status TEXT NOT NULL,
      reviewed_by TEXT,
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      code TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('PERCENT','FLAT')),
      discount_value REAL NOT NULL,
      max_discount REAL NOT NULL,
      min_order_amount REAL NOT NULL DEFAULT 0,
      active INTEGER DEFAULT 1,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_division TEXT DEFAULT '',
      customer_district TEXT DEFAULT '',
      customer_city TEXT DEFAULT '',
      customer_area TEXT DEFAULT '',
      customer_address TEXT DEFAULT '',
      customer_lat REAL,
      customer_lng REAL,
      technician_id TEXT NOT NULL,
      technician_name TEXT NOT NULL,
      technician_phone TEXT NOT NULL,
      technician_avatar TEXT DEFAULT '',
      category_id TEXT NOT NULL,
      subcategory_id TEXT,
      service_name_en TEXT NOT NULL,
      service_name_bn TEXT NOT NULL,
      problem_description TEXT DEFAULT '',
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      urgency TEXT DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      customer_confirmed_completion INTEGER DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      payment_method TEXT NOT NULL DEFAULT 'cash',
      estimated_visiting_fee REAL DEFAULT 0,
      estimated_labour_min REAL DEFAULT 0,
      estimated_labour_max REAL DEFAULT 0,
      estimated_total_min REAL DEFAULT 0,
      estimated_total_max REAL DEFAULT 0,
      final_total REAL,
      warranty_days INTEGER DEFAULT 7,
      booking_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_tech ON bookings(technician_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_cust ON bookings(customer_id);

    CREATE TABLE IF NOT EXISTS booking_price_snapshots (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL,
      subcategory_id TEXT,
      technician_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      service_name_en TEXT NOT NULL,
      service_name_bn TEXT NOT NULL,
      service_price REAL NOT NULL,
      visiting_fee REAL NOT NULL,
      hourly_charge REAL NOT NULL DEFAULT 0,
      additional_charges_total REAL NOT NULL DEFAULT 0,
      emergency_charge REAL NOT NULL DEFAULT 0,
      night_charge REAL NOT NULL DEFAULT 0,
      weekend_charge REAL NOT NULL DEFAULT 0,
      material_cost REAL NOT NULL DEFAULT 0,
      material_cost_commissionable INTEGER NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      promo_code TEXT,
      subtotal REAL NOT NULL,
      commissionable_amount REAL NOT NULL,
      platform_commission_percent REAL NOT NULL,
      technician_earnings_percent REAL NOT NULL,
      platform_commission_amount REAL NOT NULL,
      technician_earnings_amount REAL NOT NULL,
      estimated_total REAL NOT NULL,
      final_agreed_amount REAL NOT NULL,
      rule_version INTEGER NOT NULL,
      pricing_rule_id TEXT,
      currency TEXT NOT NULL DEFAULT 'BDT',
      confirmed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS additional_charge_requests (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      technician_id TEXT NOT NULL,
      charge_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      receipt_note TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING_CUSTOMER',
      created_at TEXT NOT NULL,
      responded_at TEXT,
      responded_by TEXT
    );

    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL,
      technician_id TEXT NOT NULL,
      method TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'BDT',
      status TEXT NOT NULL,
      provider_tx_id TEXT UNIQUE,
      provider_status TEXT,
      provider_mode TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      webhook_event_id TEXT UNIQUE,
      checkout_url TEXT,
      failure_reason TEXT,
      created_at TEXT NOT NULL,
      verified_at TEXT,
      refunded_amount REAL NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_payment_booking ON payment_transactions(booking_id);

    CREATE TABLE IF NOT EXISTS cash_collections (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
      booking_number TEXT NOT NULL,
      technician_id TEXT NOT NULL,
      technician_name TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      amount_collected REAL NOT NULL,
      commission_amount REAL NOT NULL,
      technician_share_amount REAL NOT NULL,
      status TEXT NOT NULL,
      collected_at TEXT NOT NULL,
      deadline_at TEXT NOT NULL,
      grace_ends_at TEXT NOT NULL,
      overdue_at TEXT,
      reminder_count INTEGER DEFAULT 0,
      last_reminder_at TEXT,
      booking_restricted_applied INTEGER DEFAULT 0,
      dispute_note TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_cash_tech ON cash_collections(technician_id, status);

    CREATE TABLE IF NOT EXISTS cash_deposits (
      id TEXT PRIMARY KEY,
      cash_collection_id TEXT NOT NULL REFERENCES cash_collections(id) ON DELETE CASCADE,
      booking_id TEXT NOT NULL,
      technician_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      deposit_reference TEXT NOT NULL UNIQUE,
      amount_deposited REAL NOT NULL,
      merchant_account_info TEXT,
      note TEXT,
      status TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      verified_at TEXT,
      verified_by TEXT,
      rejection_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS wallets (
      technician_id TEXT PRIMARY KEY,
      custom_reserve_balance REAL,
      booking_restricted INTEGER NOT NULL DEFAULT 0,
      restriction_reason TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallet_ledger (
      id TEXT PRIMARY KEY,
      technician_id TEXT NOT NULL,
      booking_id TEXT,
      withdrawal_id TEXT,
      payment_tx_id TEXT,
      cash_collection_id TEXT,
      entry_type TEXT NOT NULL,
      amount REAL NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('CREDIT','DEBIT','HOLD','RELEASE')),
      description TEXT NOT NULL,
      reference_key TEXT NOT NULL UNIQUE,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ledger_tech ON wallet_ledger(technician_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS payout_accounts (
      id TEXT PRIMARY KEY,
      technician_id TEXT NOT NULL,
      provider TEXT NOT NULL CHECK(provider IN ('bkash','nagad','rocket','bank')),
      account_title TEXT NOT NULL,
      account_number TEXT NOT NULL,
      bank_name TEXT,
      branch_name TEXT,
      routing_number TEXT,
      verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(verification_status IN ('PENDING','VERIFIED','REJECTED')),
      verification_note TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      verified_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_payout_tech ON payout_accounts(technician_id);

    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id TEXT PRIMARY KEY,
      technician_id TEXT NOT NULL,
      payout_account_id TEXT NOT NULL REFERENCES payout_accounts(id),
      provider TEXT NOT NULL,
      account_number_masked TEXT NOT NULL,
      requested_amount REAL NOT NULL,
      fee_amount REAL NOT NULL DEFAULT 0,
      net_payout_amount REAL NOT NULL,
      status TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      provider_reference TEXT,
      admin_note TEXT,
      failure_reason TEXT,
      requested_at TEXT NOT NULL,
      processed_at TEXT,
      processed_by TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_withdrawal_tech ON withdrawal_requests(technician_id, requested_at DESC);

    CREATE TABLE IF NOT EXISTS refund_transactions (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      payment_tx_id TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      refunded_by TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS financial_adjustments (
      id TEXT PRIMARY KEY,
      technician_id TEXT NOT NULL,
      booking_id TEXT,
      amount REAL NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('CREDIT','DEBIT')),
      reason TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function seedDatabaseIfEmpty(db: Database.Database): void {
  const existingRules = db.prepare('SELECT id FROM platform_rules WHERE id = 1').get();
  const now = new Date().toISOString();

  if (!existingRules) {
    db.prepare(
      'INSERT INTO platform_rules (id, version, rules_json, updated_at, updated_by) VALUES (1, 1, ?, ?, ?)'
    ).run(JSON.stringify(DEFAULT_PLATFORM_RULES), now, 'user-admin-demo');

    db.prepare(
      'INSERT INTO rule_versions (id, version, changed_by, summary, rules_json, created_at) VALUES (?, 1, ?, ?, ?, ?)'
    ).run('rv-1', 'user-admin-demo', 'Initial centralized Servexa rules (90/10 commission, ৳500 reserve)', JSON.stringify(DEFAULT_PLATFORM_RULES), now);
  }

  // Seed users from demoUsers
  const upsertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, phone, password, role, avatar, division, district, city, area, address, nid_verified, phone_verified, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const u of Object.values(demoUsers)) {
    upsertUser.run(
      u.id,
      u.name,
      u.email.toLowerCase(),
      u.phone,
      u.role === 'ADMIN' ? 'Admin@123' : 'Servexa@123',
      u.role,
      u.avatar,
      u.division || 'Dhaka',
      u.district || u.city,
      u.city,
      u.area,
      u.address || '',
      u.nidVerified ? 1 : 0,
      u.phoneVerified ? 1 : 0,
      u.createdAt
    );
  }

  // Seed categories preserving initialCategories
  const upsertCat = db.prepare(`
    INSERT OR IGNORE INTO service_categories (
      id, name_en, name_bn, icon, description_en, description_bn, starting_price,
      emergency_available, popular, active, active_professionals, tags_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);
  const insertGenericRule = db.prepare(`
    INSERT OR IGNORE INTO pricing_rules (
      id, category_id, subcategory_id, service_title_en, service_title_bn,
      default_price, min_price, max_price, customization_permission,
      visiting_fee, min_visiting_fee, max_visiting_fee,
      hourly_rate, additional_hour_charge, emergency_charge, night_charge, weekend_charge,
      material_policy, additional_charge_policy, requires_price_approval, active, rule_version, updated_at
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'TECH_CUSTOMIZABLE_RANGE', 200, 100, 500, 250, 150, 150, 150, 100, 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE', 'REQUIRE_CUSTOMER_APPROVAL', 0, 1, 1, ?)
  `);

  for (const cat of initialCategories) {
    upsertCat.run(
      cat.id,
      cat.nameEn,
      cat.nameBn,
      cat.icon,
      cat.descriptionEn,
      cat.descriptionBn,
      cat.startingPrice,
      cat.emergencyAvailable ? 1 : 0,
      cat.popular ? 1 : 0,
      cat.activeProfessionals,
      JSON.stringify(cat.tags || []),
      now
    );
    // Ensure a baseline category-level pricing rule exists if no subcategories seeded for it
    const minP = Math.max(150, Math.round(cat.startingPrice * 0.8));
    const maxP = Math.round(cat.startingPrice * 2.5);
    insertGenericRule.run(
      `pr-cat-${cat.id}`,
      cat.id,
      cat.nameEn,
      cat.nameBn,
      cat.startingPrice,
      minP,
      maxP,
      now
    );
  }

  // Seed rich subcategories & pricing rules
  const insertSub = db.prepare(`
    INSERT OR IGNORE INTO service_subcategories (id, category_id, name_en, name_bn, description_en, description_bn, icon, active, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSubRule = db.prepare(`
    INSERT OR IGNORE INTO pricing_rules (
      id, category_id, subcategory_id, service_title_en, service_title_bn,
      default_price, min_price, max_price, customization_permission,
      visiting_fee, min_visiting_fee, max_visiting_fee,
      hourly_rate, additional_hour_charge, emergency_charge, night_charge, weekend_charge,
      material_policy, additional_charge_policy, requires_price_approval, commission_override_percent, active, rule_version, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  for (const item of SEED_SUBCATEGORIES_AND_RULES) {
    insertSub.run(
      item.sub.id,
      item.sub.categoryId,
      item.sub.nameEn,
      item.sub.nameBn,
      item.sub.descriptionEn,
      item.sub.descriptionBn,
      item.sub.icon,
      item.sub.active ? 1 : 0,
      now
    );
    insertSubRule.run(
      `pr-${item.sub.id}`,
      item.rule.categoryId,
      item.sub.id,
      item.rule.serviceTitleEn,
      item.rule.serviceTitleBn,
      item.rule.defaultPrice,
      item.rule.minPrice,
      item.rule.maxPrice,
      item.rule.customizationPermission,
      item.rule.visitingFee,
      item.rule.minVisitingFee,
      item.rule.maxVisitingFee,
      item.rule.hourlyRate,
      item.rule.additionalHourCharge,
      item.rule.emergencyCharge,
      item.rule.nightCharge,
      item.rule.weekendCharge,
      item.rule.materialPolicy,
      item.rule.additionalChargePolicy,
      item.rule.requiresPriceApproval ? 1 : 0,
      item.rule.commissionOverridePercent ?? null,
      item.rule.active ? 1 : 0,
      now
    );
  }

  // Seed technicians and wallets
  const upsertTech = db.prepare(`
    INSERT OR IGNORE INTO technicians (
      id, user_id, name, email, phone, avatar, city, district, division, primary_area,
      visiting_fee, starting_price, skills_json, skill_verified, platform_verified, nid_verified,
      availability, rating, completed_jobs, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const upsertWallet = db.prepare(`
    INSERT OR IGNORE INTO wallets (technician_id, custom_reserve_balance, booking_restricted, restriction_reason, updated_at)
    VALUES (?, NULL, 0, NULL, ?)
  `);
  const upsertTechUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, phone, password, role, avatar, division, district, city, area, nid_verified, phone_verified, created_at)
    VALUES (?, ?, ?, ?, 'demo1234', 'TECHNICIAN', ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  for (const tech of initialTechnicians) {
    const techEmail = tech.email || `${tech.id}@servexa.demo`;
    upsertTechUser.run(
      tech.userId,
      tech.name,
      techEmail,
      tech.phone,
      tech.avatar,
      tech.division || 'Dhaka',
      tech.district || tech.city,
      tech.city,
      tech.primaryArea,
      tech.nidVerified ? 1 : 0,
      now
    );
    upsertTech.run(
      tech.id,
      tech.userId,
      tech.name,
      techEmail,
      tech.phone,
      tech.avatar,
      tech.city,
      tech.district || tech.city,
      tech.division || 'Dhaka',
      tech.primaryArea,
      tech.visitingFee,
      tech.startingPrice,
      JSON.stringify(tech.skills || []),
      tech.skillVerified ? 1 : 0,
      tech.platformVerified ? 1 : 0,
      tech.nidVerified ? 1 : 0,
      tech.availability,
      tech.rating,
      tech.completedJobs,
      now
    );
    upsertWallet.run(tech.id, now);
  }

  // Seed distinct technician_services for each technician based on their trade skills
  const seedTechSvc = db.prepare(`
    INSERT OR IGNORE INTO technician_services (
      id, technician_id, category_id, subcategory_id, pricing_rule_id, service_title_en, service_title_bn,
      approved_price, approved_visiting_fee, approved_hourly_rate, approved_additional_hour_charge,
      approved_emergency_charge, approved_night_charge, approved_weekend_charge, status, active, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);
  const techSeedServices: Array<{
    techId: string;
    subId: string;
    ruleId: string;
    catId: string;
    en: string;
    bn: string;
    price: number;
    visit: number;
    hourly: number;
    status: string;
  }> = [
    // tech-1: Rahim (Electrical & AC)
    { techId: 'tech-1', subId: 'sub-fan-repair', ruleId: 'pr-sub-fan-repair', catId: 'electrical', en: 'Fan Repair', bn: 'ফ্যান মেরামত', price: 350, visit: 150, hourly: 200, status: 'CUSTOMIZED_PRICE' },
    { techId: 'tech-1', subId: 'sub-wiring', ruleId: 'pr-sub-wiring', catId: 'electrical', en: 'Wiring & Short Circuit Fix', bn: 'ওয়্যারিং ও শর্ট সার্কিট', price: 500, visit: 200, hourly: 300, status: 'DEFAULT_PRICE' },
    { techId: 'tech-1', subId: 'sub-ac-servicing', ruleId: 'pr-sub-ac-servicing', catId: 'ac_repair', en: 'AC Servicing', bn: 'এসি সার্ভিসিং', price: 800, visit: 200, hourly: 400, status: 'DEFAULT_PRICE' },
    // tech-2: Karim (Plumbing)
    { techId: 'tech-2', subId: 'sub-pipe-repair', ruleId: 'pr-sub-pipe-repair', catId: 'plumbing', en: 'Pipe Repair', bn: 'পানির পাইপ মেরামত', price: 420, visit: 200, hourly: 250, status: 'CUSTOMIZED_PRICE' },
    { techId: 'tech-2', subId: 'sub-tap-install', ruleId: 'pr-sub-tap-install', catId: 'plumbing', en: 'Water Tap Installation', bn: 'পানির কল ও মিক্সার স্থাপন', price: 350, visit: 150, hourly: 200, status: 'DEFAULT_PRICE' },
    { techId: 'tech-2', subId: 'sub-leakage-repair', ruleId: 'pr-sub-leakage-repair', catId: 'plumbing', en: 'Water Leakage Repair', bn: 'ওয়াটার লিকেজ ও বেসিন ড্রেন সমাধান', price: 450, visit: 200, hourly: 250, status: 'DEFAULT_PRICE' },
    // tech-3: Tanvir (AC & Refrigerator)
    { techId: 'tech-3', subId: 'sub-ac-gas', ruleId: 'pr-sub-ac-gas', catId: 'ac_repair', en: 'AC Gas Refill', bn: 'এসি গ্যাস রিফিল', price: 1850, visit: 200, hourly: 450, status: 'CUSTOMIZED_PRICE' },
    { techId: 'tech-3', subId: 'sub-ac-repair', ruleId: 'pr-sub-ac-repair', catId: 'ac_repair', en: 'AC Repair & PCB Diagnostics', bn: 'এসি মেরামত ও সার্কিট বোর্ড চেক', price: 1000, visit: 200, hourly: 400, status: 'DEFAULT_PRICE' },
    { techId: 'tech-3', subId: 'sub-fridge-repair', ruleId: 'pr-sub-fridge-repair', catId: 'refrigerator', en: 'Refrigerator Repair', bn: 'ফ্রিজ ও ডিপ ফ্রিজ মেরামত', price: 650, visit: 200, hourly: 300, status: 'CUSTOMIZED_PRICE' },
    // tech-4: Selim (Carpentry & Painting)
    { techId: 'tech-4', subId: 'sub-fan-repair', ruleId: 'pr-cat-carpentry', catId: 'carpentry', en: 'Carpentry & Locksmith', bn: 'কাঠ মিস্ত্রি ও লক সার্ভিস', price: 450, visit: 200, hourly: 250, status: 'CUSTOMIZED_PRICE' },
    // tech-5: Kamrul (CCTV & Electrical)
    { techId: 'tech-5', subId: 'sub-light-install', ruleId: 'pr-cat-cctv_installation', catId: 'cctv_installation', en: 'CCTV & Networking', bn: 'সিসিটিভি ও ওয়াইফাই সেটআপ', price: 850, visit: 250, hourly: 350, status: 'CUSTOMIZED_PRICE' },
    { techId: 'tech-5', subId: 'sub-switch-repair', ruleId: 'pr-sub-switch-repair', catId: 'electrical', en: 'Switch & Socket Repair', bn: 'সুইচ বোর্ড ও সকেট মেরামত', price: 280, visit: 150, hourly: 180, status: 'CUSTOMIZED_PRICE' },
    // tech-6: Jahidul (Washing Machine & Refrigerator)
    { techId: 'tech-6', subId: 'sub-washing-machine', ruleId: 'pr-sub-washing-machine', catId: 'washing_machine', en: 'Washing Machine Repair', bn: 'ওয়াশিং মেশিন সার্ভিস ও মেরামত', price: 700, visit: 200, hourly: 350, status: 'CUSTOMIZED_PRICE' },
    { techId: 'tech-6', subId: 'sub-fridge-repair', ruleId: 'pr-sub-fridge-repair', catId: 'refrigerator', en: 'Refrigerator Repair', bn: 'ফ্রিজ ও ডিপ ফ্রিজ মেরামত', price: 600, visit: 200, hourly: 300, status: 'DEFAULT_PRICE' },
  ];
  for (const s of techSeedServices) {
    seedTechSvc.run(
      `ts-${s.techId}-${s.subId}`,
      s.techId,
      s.catId,
      s.subId,
      s.ruleId,
      s.en,
      s.bn,
      s.price,
      s.visit,
      s.hourly,
      200,
      150,
      150,
      100,
      s.status,
      now
    );
  }

  // Seed distinct payout accounts for each technician
  const seedPayoutAcct = db.prepare(`
    INSERT OR IGNORE INTO payout_accounts (
      id, technician_id, provider, account_title, account_number, bank_name, branch_name,
      verification_status, verification_note, is_default, created_at, verified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  seedPayoutAcct.run('pa-tech1-bkash', 'tech-1', 'bkash', 'Md. Rahim Ahmed', '01712345678', null, null, 'VERIFIED', 'NID & mobile ownership verified', now, now);
  seedPayoutAcct.run('pa-tech2-nagad', 'tech-2', 'nagad', 'Karim Hossain', '01987654321', null, null, 'VERIFIED', 'Verified Nagad merchant/personal wallet', now, now);
  seedPayoutAcct.run('pa-tech3-bkash', 'tech-3', 'bkash', 'Tanvir Islam', '01811223344', null, null, 'VERIFIED', 'Verified bKash payout account', now, now);
  seedPayoutAcct.run('pa-tech4-rocket', 'tech-4', 'rocket', 'Selim Reza', '016443322119', null, null, 'VERIFIED', 'Verified Rocket account', now, now);
  seedPayoutAcct.run('pa-tech5-bank', 'tech-5', 'bank', 'Kamrul Hasan', '1421070098341', 'BRAC Bank PLC', 'Gulshan Branch', 'VERIFIED', 'Bank account cheque leaf verified', now, now);
  seedPayoutAcct.run('pa-tech6-nagad', 'tech-6', 'nagad', 'Jahidul Islam', '01766554433', null, null, 'VERIFIED', 'NID & Nagad account matched', now, now);

  // Seed default promo codes
  db.prepare(`
    INSERT OR IGNORE INTO promo_codes (code, description, discount_type, discount_value, max_discount, min_order_amount, active)
    VALUES
      ('SERVEXA50', 'Flat ৳50 off on services above ৳400', 'FLAT', 50, 50, 400, 1),
      ('FIRST10', '10% welcome discount up to ৳150', 'PERCENT', 10, 150, 300, 1)
  `).run();

  // Seed initialBookings + snapshots + distinct per-technician ledger/payment/cash/withdrawal history
  const bookingCountRow = db.prepare('SELECT COUNT(*) as c FROM bookings').get() as { c: number };
  if (bookingCountRow.c === 0) {
    const insertBooking = db.prepare(`
      INSERT INTO bookings (
        id, booking_number, customer_id, customer_name, customer_phone, customer_division, customer_district,
        customer_city, customer_area, customer_address, technician_id, technician_name, technician_phone,
        technician_avatar, category_id, subcategory_id, service_name_en, service_name_bn, problem_description,
        date, time_slot, urgency, status, customer_confirmed_completion, payment_status, payment_method,
        estimated_visiting_fee, estimated_labour_min, estimated_labour_max, estimated_total_min, estimated_total_max,
        final_total, warranty_days, booking_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertSnap = db.prepare(`
      INSERT INTO booking_price_snapshots (
        id, booking_id, category_id, subcategory_id, technician_id, customer_id, service_name_en, service_name_bn,
        service_price, visiting_fee, hourly_charge, additional_charges_total, emergency_charge, night_charge, weekend_charge,
        material_cost, material_cost_commissionable, discount_amount, promo_code, subtotal, commissionable_amount,
        platform_commission_percent, technician_earnings_percent, platform_commission_amount, technician_earnings_amount,
        estimated_total, final_agreed_amount, rule_version, pricing_rule_id, currency, confirmed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?, 0, 0, NULL, ?, ?, 10, 90, ?, ?, ?, ?, 1, ?, 'BDT', ?)
    `);

    const resolveSubAndRule = (categoryId: string): { subId: string | null; ruleId: string } => {
      switch (categoryId) {
        case 'electrical':
          return { subId: 'sub-fan-repair', ruleId: 'pr-sub-fan-repair' };
        case 'ac_repair':
          return { subId: 'sub-ac-gas', ruleId: 'pr-sub-ac-gas' };
        case 'plumbing':
          return { subId: 'sub-pipe-repair', ruleId: 'pr-sub-pipe-repair' };
        case 'refrigerator':
          return { subId: 'sub-fridge-repair', ruleId: 'pr-sub-fridge-repair' };
        case 'washing_machine':
          return { subId: 'sub-washing-machine', ruleId: 'pr-sub-washing-machine' };
        default:
          return { subId: null, ruleId: `pr-cat-${categoryId}` };
      }
    };

    for (const b of initialBookings) {
      const { subId, ruleId } = resolveSubAndRule(b.categoryId);
      const servicePrice = b.invoice ? b.invoice.labourCost : b.estimatedLabourMin || 400;
      const visitingFee = b.invoice ? b.invoice.visitingFee : b.estimatedVisitingFee || 200;
      const materialCost = b.invoice ? b.invoice.partsCost : 0;
      const total = b.finalTotal || visitingFee + servicePrice + materialCost;
      const commissionable = servicePrice; // visiting fee & material cost non-commissionable per default policy
      const commissionAmt = Math.round(commissionable * 0.1 * 100) / 100;
      const techEarnings = Math.round((commissionable - commissionAmt) * 100) / 100 + visitingFee + materialCost;

      insertBooking.run(
        b.id,
        b.bookingNumber,
        b.customerId,
        b.customerName,
        b.customerPhone,
        b.customerDivision || 'Dhaka',
        b.customerDistrict || b.customerCity,
        b.customerCity,
        b.customerArea,
        b.customerAddress,
        b.technicianId,
        b.technicianName,
        b.technicianPhone,
        b.technicianAvatar,
        b.categoryId,
        subId,
        b.serviceNameEn,
        b.serviceNameBn,
        b.problemDescription,
        b.date,
        b.timeSlot,
        b.urgency,
        b.status,
        b.status === 'COMPLETED' ? 1 : 0,
        b.paymentStatus,
        b.paymentMethod,
        b.estimatedVisitingFee,
        b.estimatedLabourMin,
        b.estimatedLabourMax,
        b.estimatedTotalMin,
        b.estimatedTotalMax,
        b.finalTotal ?? null,
        b.warrantyDays,
        JSON.stringify(b),
        b.createdAt,
        b.updatedAt
      );

      insertSnap.run(
        `snap-${b.id}`,
        b.id,
        b.categoryId,
        subId,
        b.technicianId,
        b.customerId,
        b.serviceNameEn,
        b.serviceNameBn,
        servicePrice,
        visitingFee,
        materialCost,
        total,
        commissionable,
        commissionAmt,
        techEarnings,
        total,
        total,
        ruleId,
        b.createdAt
      );
    }

    const todayIso = new Date().toISOString();
    const deadlineFuture = new Date(Date.now() + 40 * 3600 * 1000).toISOString();
    const graceFuture = new Date(Date.now() + 52 * 3600 * 1000).toISOString();

    // Seed verified payment transactions (each tied strictly to its owning technician)
    const payIns = db.prepare(`
      INSERT OR IGNORE INTO payment_transactions (
        id, booking_id, customer_id, technician_id, method, amount, currency, status,
        provider_tx_id, provider_status, provider_mode, idempotency_key, created_at, verified_at, refunded_amount
      ) VALUES (?, ?, ?, ?, ?, ?, 'BDT', 'VERIFIED', ?, 'Completed', 'SANDBOX', ?, ?, ?, 0)
    `);
    payIns.run('ptx-seed-book3', 'book-3', 'user-cust-demo', 'tech-1', 'bkash', 1100, 'BK-SEED-2026-0102', 'seed-idem-book3', '2026-09-25T17:18:00Z', '2026-09-25T17:20:00Z');
    payIns.run('ptx-seed-book9', 'book-9', 'user-cust-demo', 'tech-1', 'bkash', 700, 'BK-SEED-2026-0142', 'seed-idem-book9', todayIso, todayIso);
    payIns.run('ptx-seed-book4', 'book-4', 'user-cust-demo', 'tech-3', 'bkash', 2300, 'BK-SEED-2026-0112', 'seed-idem-book4', todayIso, todayIso);
    payIns.run('ptx-seed-book5', 'book-5', 'user-cust-demo', 'tech-3', 'nagad', 1250, 'NG-SEED-2026-0119', 'seed-idem-book5', todayIso, todayIso);
    payIns.run('ptx-seed-book7', 'book-7', 'user-cust-demo', 'tech-5', 'bkash', 2150, 'BK-SEED-2026-0131', 'seed-idem-book7', todayIso, todayIso);
    payIns.run('ptx-seed-book8', 'book-8', 'user-cust-demo', 'tech-6', 'nagad', 1200, 'NG-SEED-2026-0138', 'seed-idem-book8', todayIso, todayIso);

    // Seed cash collection awaiting deposit for tech-4 (book-6: ৳1250, 90% share = ৳1160, 10% comm = ৳90)
    db.prepare(`
      INSERT OR IGNORE INTO cash_collections (
        id, booking_id, booking_number, technician_id, technician_name, customer_id,
        amount_collected, commission_amount, technician_share_amount, status,
        collected_at, deadline_at, grace_ends_at, reminder_count, booking_restricted_applied
      ) VALUES (
        'cc-seed-book6', 'book-6', 'SRV-2026-000124', 'tech-4', 'সেলিম রেজা', 'user-cust-demo',
        1250, 90, 1160, 'CASH_PENDING', ?, ?, ?, 0, 0
      )
    `).run(todayIso, deadlineFuture, graceFuture);

    // Seed a completed payout for tech-3 so each technician exhibits unique withdrawal history
    db.prepare(`
      INSERT OR IGNORE INTO withdrawal_requests (
        id, technician_id, payout_account_id, provider, account_number_masked,
        requested_amount, fee_amount, net_payout_amount, status, idempotency_key,
        provider_reference, admin_note, requested_at, processed_at, processed_by
      ) VALUES (
        'wd-seed-tech3', 'tech-3', 'pa-tech3-bkash', 'bkash', '018****3344',
        600, 0, 600, 'COMPLETED', 'seed-wd-tech3',
        'BK-PAYOUT-99321', 'Settled to Tanvir Islam verified bKash wallet', ?, ?, 'user-admin-demo'
      )
    `).run(todayIso, todayIso);

    // Seed distinct per-technician ledger entries (tech-1 through tech-6)
    const ledgerIns = db.prepare(`
      INSERT OR IGNORE INTO wallet_ledger (id, technician_id, booking_id, withdrawal_id, payment_tx_id, entry_type, amount, direction, description, reference_key, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SYSTEM', ?)
    `);
    // tech-1 (রহিম আহমেদ): Available ৳1,685 | Reserve ৳500 | Withdrawable ৳1,185
    ledgerIns.run('led-seed-1', 'tech-1', 'book-3', null, 'ptx-seed-book3', 'EARNING_AVAILABLE', 1030, 'CREDIT', 'Net earnings from booking SRV-2026-000105 (bKash verified)', 'EARN_AVAIL_book-3', '2026-09-25T17:20:00Z');
    ledgerIns.run('led-seed-2', 'tech-1', 'book-3', null, 'ptx-seed-book3', 'COMMISSION_DEDUCTED', 70, 'DEBIT', 'Servexa 10% commission on commissionable service ৳700', 'COMM_book-3', '2026-09-25T17:20:00Z');
    ledgerIns.run('led-seed-1b', 'tech-1', 'book-9', null, 'ptx-seed-book9', 'EARNING_AVAILABLE', 655, 'CREDIT', 'Net earnings from booking SRV-2026-000142 (bKash verified)', 'EARN_AVAIL_book-9', todayIso);
    ledgerIns.run('led-seed-1c', 'tech-1', 'book-9', null, 'ptx-seed-book9', 'COMMISSION_DEDUCTED', 45, 'DEBIT', 'Servexa 10% commission on commissionable service ৳450', 'COMM_book-9', todayIso);

    // tech-2 (করিম হোসেন): Available ৳715 | Reserve ৳500 | Withdrawable ৳215
    ledgerIns.run('led-seed-3', 'tech-2', 'book-2', null, null, 'EARNING_AVAILABLE', 715, 'CREDIT', 'Net earnings from booking SRV-2026-000098 (Cash deposit verified)', 'EARN_AVAIL_book-2', '2026-09-20T13:00:00Z');
    ledgerIns.run('led-seed-4', 'tech-2', 'book-2', null, null, 'COMMISSION_DEDUCTED', 35, 'DEBIT', 'Servexa 10% commission on commissionable service ৳350', 'COMM_book-2', '2026-09-20T13:00:00Z');

    // tech-3 (তানভীর ইসলাম): Lifetime ৳3,280 | Pending ৳1,160 | Available ৳1,520 (after ৳600 withdrawal) | Withdrawable ৳1,020 | Withdrawn ৳600
    ledgerIns.run('led-seed-5', 'tech-3', 'book-4', null, 'ptx-seed-book4', 'EARNING_AVAILABLE', 2120, 'CREDIT', 'Net earnings from booking SRV-2026-000112 (bKash verified)', 'EARN_AVAIL_book-4', todayIso);
    ledgerIns.run('led-seed-6', 'tech-3', 'book-4', null, 'ptx-seed-book4', 'COMMISSION_DEDUCTED', 180, 'DEBIT', 'Servexa 10% commission on commissionable service ৳1800', 'COMM_book-4', todayIso);
    ledgerIns.run('led-seed-7', 'tech-3', 'book-5', null, 'ptx-seed-book5', 'EARNING_PENDING', 1160, 'CREDIT', 'Escrow earnings held until completion of SRV-2026-000119 (Nagad)', 'EARN_PEND_book-5', todayIso);
    ledgerIns.run('led-seed-8', 'tech-3', 'book-5', null, 'ptx-seed-book5', 'COMMISSION_DEDUCTED', 90, 'DEBIT', 'Servexa 10% commission on commissionable service ৳900', 'COMM_book-5', todayIso);
    ledgerIns.run('led-seed-9', 'tech-3', null, 'wd-seed-tech3', null, 'WITHDRAWAL_RESERVED', 600, 'HOLD', 'Withdrawal reserved for bKash payout 018****3344', 'WD_RES_wd-seed-tech3', todayIso);
    ledgerIns.run('led-seed-10', 'tech-3', null, 'wd-seed-tech3', null, 'WITHDRAWAL_COMPLETED', 600, 'DEBIT', 'Payout completed via bKash (Ref: BK-PAYOUT-99321)', 'WD_COMP_wd-seed-tech3', todayIso);

    // tech-5 (কামরুল হাসান): Available ৳2,000 | Reserve ৳500 | Withdrawable ৳1,500
    ledgerIns.run('led-seed-11', 'tech-5', 'book-7', null, 'ptx-seed-book7', 'EARNING_AVAILABLE', 2000, 'CREDIT', 'Net earnings from booking SRV-2026-000131 (bKash verified)', 'EARN_AVAIL_book-7', todayIso);
    ledgerIns.run('led-seed-12', 'tech-5', 'book-7', null, 'ptx-seed-book7', 'COMMISSION_DEDUCTED', 150, 'DEBIT', 'Servexa 10% commission on commissionable service ৳1500', 'COMM_book-7', todayIso);

    // tech-6 (জাহিদুল ইসলাম): Available ৳1,115 | Reserve ৳500 | Withdrawable ৳615
    ledgerIns.run('led-seed-13', 'tech-6', 'book-8', null, 'ptx-seed-book8', 'EARNING_AVAILABLE', 1115, 'CREDIT', 'Net earnings from booking SRV-2026-000138 (Nagad verified)', 'EARN_AVAIL_book-8', todayIso);
    ledgerIns.run('led-seed-14', 'tech-6', 'book-8', null, 'ptx-seed-book8', 'COMMISSION_DEDUCTED', 85, 'DEBIT', 'Servexa 10% commission on commissionable service ৳850', 'COMM_book-8', todayIso);
  }
}
