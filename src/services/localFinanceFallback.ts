import { initialBookings, initialCategories, initialTechnicians } from '../data/seedData';
import type { Booking, ServiceCategory, Technician } from '../types';
import type {
  AdditionalChargeRequest,
  AdminAuditLog,
  AdminFinancialSummary,
  BookingPriceSnapshot,
  CashCollectionRecord,
  PaymentMethodCode,
  PaymentTransaction,
  PayoutAccount,
  PayoutProvider,
  PlatformRules,
  PriceQuoteRequest,
  PriceQuoteResponse,
  PricingRule,
  RuleVersionRecord,
  ServiceSubcategory,
  TechnicianPriceHistoryItem,
  TechnicianServiceConfig,
  WalletLedgerEntry,
  WalletSummary,
  WithdrawalRequest,
} from '../types/finance';

const STORAGE_KEY = 'servexa_local_finance_v1';
const SESSION_USER_KEY = 'servexa_local_session_user';

interface LocalSessionUser {
  userId: string;
  role: 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
  technicianId: string | null;
  name: string;
}

interface LocalFinanceState {
  rules: PlatformRules;
  ruleVersions: RuleVersionRecord[];
  auditLogs: AdminAuditLog[];
  categories: (ServiceCategory & { active: boolean; commissionOverridePercent?: number | null })[];
  subcategories: ServiceSubcategory[];
  pricingRules: PricingRule[];
  techServices: TechnicianServiceConfig[];
  priceHistory: TechnicianPriceHistoryItem[];
  snapshots: Record<string, BookingPriceSnapshot>;
  extraCharges: AdditionalChargeRequest[];
  paymentTransactions: PaymentTransaction[];
  cashCollections: CashCollectionRecord[];
  payoutAccounts: PayoutAccount[];
  withdrawals: WithdrawalRequest[];
  ledgerEntries: WalletLedgerEntry[];
  techRestrictions: Record<string, { restricted: boolean; reason: string | null; customReserveBalance: number | null }>;
}

function getDefaultRules(): PlatformRules {
  const now = new Date().toISOString();
  return {
    version: 1,
    updatedAt: now,
    updatedBy: 'user-admin-demo',
    general: {
      platformName: 'Servexa',
      businessTagline: 'Smart Home Service & Technician Platform',
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
        visitingFee: true,
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
      hourlyRate: 'TECH_CUSTOMIZABLE_RANGE',
      additionalHourCharge: 'TECH_CUSTOMIZABLE_RANGE',
      emergencyCharge: 'ADMIN_CONTROLLED',
      nightCharge: 'ADMIN_CONTROLLED',
      weekendCharge: 'ADMIN_CONTROLLED',
    },
    visitingAndAdditional: {
      defaultVisitingFee: 200,
      minVisitingFee: 100,
      maxVisitingFee: 500,
      waiveVisitingFeeWhenCompleted: false,
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      defaultEmergencyCharge: 250,
      defaultNightCharge: 150,
      defaultWeekendCharge: 100,
      nightHoursStart: '21:00',
      nightHoursEnd: '07:00',
    },
    materialPolicy: {
      policy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      requireReceiptNoteAbove: 500,
      maxUnverifiedMaterialAmount: 3000,
      requireCustomerExplicitApproval: true,
    },
    walletAndReserve: {
      globalMinimumReserveBalance: 500,
      minimumWithdrawalAmount: 100,
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
      requireServerWebhookVerification: false,
      allowPartialPayment: false,
      paymentSessionExpiryMinutes: 30,
      autoCalculateEarningsOnVerify: true,
    },
    cashOnCompletion: {
      depositDeadlineHours: 24,
      reminderIntervalHours: 6,
      gracePeriodHours: 12,
      restrictNewBookingsAfterOverdueReview: true,
      maxAllowedOverdueAmount: 500,
      approvedDepositChannels: ['bkash_merchant', 'nagad_merchant', 'bank_transfer'],
      requireAdminReconciliationIfNoApi: true,
    },
    bookingAndCancellation: {
      freeCancellationHoursBefore: 2,
      lateCancellationFee: 100,
      allowRescheduling: true,
      maxActiveBookingsPerTechnician: 5,
    },
    refundAndDispute: {
      allowFullRefund: true,
      allowPartialRefund: true,
      holdTechnicianEarningsDuringDispute: true,
      disputeResolutionSlaHours: 24,
    },
    discountAndPromo: {
      allowPromoCodes: true,
      maxPromoDiscountPercent: 25,
      allowFirstBookingDiscount: true,
      firstBookingDiscountPercent: 10,
    },
  };
}

function getAppBookings(): Booking[] {
  try {
    const raw = localStorage.getItem('kormigo_bookings');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return initialBookings;
}

function getAppTechnicians(): Technician[] {
  try {
    const raw = localStorage.getItem('kormigo_technicians');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return initialTechnicians;
}

function createInitialState(): LocalFinanceState {
  const now = new Date().toISOString();
  const rules = getDefaultRules();

  const categories = initialCategories.map((c) => ({
    ...c,
    active: true,
    commissionOverridePercent: null as number | null,
  }));

  const subcategories: ServiceSubcategory[] = initialCategories.slice(0, 12).map((c) => ({
    id: `sub-${c.id}-std`,
    categoryId: c.id,
    nameEn: `${c.nameEn} (Standard)`,
    nameBn: `${c.nameBn} (স্ট্যান্ডার্ড)`,
    descriptionEn: c.descriptionEn,
    descriptionBn: c.descriptionBn,
    icon: c.icon,
    active: true,
    pricingRuleId: `rule-${c.id}-std`,
  }));

  const pricingRules: PricingRule[] = subcategories.map((sub) => {
    const cat = initialCategories.find((c) => c.id === sub.categoryId);
    const defPrice = Math.max(400, (cat?.startingPrice || 350) + 150);
    return {
      id: sub.pricingRuleId!,
      categoryId: sub.categoryId,
      subcategoryId: sub.id,
      serviceTitleEn: sub.nameEn,
      serviceTitleBn: sub.nameBn,
      defaultPrice: defPrice,
      minPrice: Math.round(defPrice * 0.7),
      maxPrice: Math.round(defPrice * 1.8),
      customizationPermission: 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: 200,
      minVisitingFee: 100,
      maxVisitingFee: 400,
      hourlyRate: 300,
      additionalHourCharge: 200,
      emergencyCharge: 250,
      nightCharge: 150,
      weekendCharge: 100,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: false,
      commissionOverridePercent: null,
      active: true,
      ruleVersion: 1,
      updatedAt: now,
    };
  });

  const techServices: TechnicianServiceConfig[] = [];
  const payoutAccounts: PayoutAccount[] = [];
  const ledgerEntries: WalletLedgerEntry[] = [];
  const cashCollections: CashCollectionRecord[] = [];
  const withdrawals: WithdrawalRequest[] = [];
  const snapshots: Record<string, BookingPriceSnapshot> = {};

  const techs = getAppTechnicians();
  techs.forEach((tech, idx) => {
    const baseSub = subcategories[idx % subcategories.length];
    const baseRule = pricingRules.find((r) => r.id === baseSub.pricingRuleId)!;
    techServices.push({
      id: `tsvc-${tech.id}-1`,
      technicianId: tech.id,
      categoryId: baseSub.categoryId,
      subcategoryId: baseSub.id,
      pricingRuleId: baseRule.id,
      serviceTitleEn: baseSub.nameEn,
      serviceTitleBn: baseSub.nameBn,
      approvedPrice: baseRule.defaultPrice,
      approvedVisitingFee: baseRule.visitingFee,
      approvedHourlyRate: baseRule.hourlyRate,
      approvedAdditionalHourCharge: baseRule.additionalHourCharge,
      approvedEmergencyCharge: baseRule.emergencyCharge,
      approvedNightCharge: baseRule.nightCharge,
      approvedWeekendCharge: baseRule.weekendCharge,
      status: 'DEFAULT_PRICE',
      active: true,
      updatedAt: now,
    });

    const acctId = `pa-${tech.id}`;
    payoutAccounts.push({
      id: acctId,
      technicianId: tech.id,
      provider: idx % 2 === 0 ? 'bkash' : 'nagad',
      accountTitle: tech.name,
      accountNumber: tech.phone.replace(/-/g, ''),
      verificationStatus: 'VERIFIED',
      isDefault: true,
      createdAt: now,
      verifiedAt: now,
    });

    // Give each technician distinct, realistic historical baseline ledger entries matching their profile
    const historicalJobsCount = Math.max(2, Math.min(8, Math.round((tech.completedJobs || 20) / 18)));
    const grossSample = historicalJobsCount * (650 + idx * 140);
    const netCredit = Math.round(grossSample * 0.9);
    ledgerEntries.push({
      id: `led-seed-${tech.id}-earn`,
      technicianId: tech.id,
      bookingId: `seed-hist-${tech.id}`,
      entryType: 'EARNING_AVAILABLE',
      amount: netCredit,
      direction: 'CREDIT',
      description: `Settled 90% net earnings across completed jobs (${tech.name})`,
      referenceKey: `seed-earn-${tech.id}`,
      createdBy: 'system',
      createdAt: now,
    });
  });

  // Also map initialBookings into isolated per-technician ledger entries & snapshots
  initialBookings.forEach((b) => {
    const finalAmt = b.finalTotal || b.estimatedTotalMax || 700;
    const comm = Math.round(finalAmt * 0.1 * 100) / 100;
    const net = Math.round((finalAmt - comm) * 100) / 100;

    snapshots[b.id] = {
      id: `snap-${b.id}`,
      bookingId: b.id,
      categoryId: b.categoryId,
      technicianId: b.technicianId,
      customerId: b.customerId,
      serviceNameEn: b.serviceNameEn,
      serviceNameBn: b.serviceNameBn,
      servicePrice: b.estimatedLabourMin || 350,
      visitingFee: b.estimatedVisitingFee || 200,
      hourlyCharge: 0,
      additionalChargesTotal: 0,
      emergencyCharge: 0,
      nightCharge: 0,
      weekendCharge: 0,
      materialCost: 0,
      materialCostCommissionable: false,
      discountAmount: 0,
      subtotal: finalAmt,
      commissionableAmount: finalAmt,
      platformCommissionPercent: 10,
      technicianEarningsPercent: 90,
      platformCommissionAmount: comm,
      technicianEarningsAmount: net,
      estimatedTotal: b.estimatedTotalMax || finalAmt,
      finalAgreedAmount: finalAmt,
      ruleVersion: 1,
      currency: 'BDT',
      confirmedAt: b.createdAt,
    };

    if (b.status === 'COMPLETED') {
      if (b.paymentMethod === 'cash' && b.paymentStatus !== 'PAID') {
        cashCollections.push({
          id: `cc-${b.id}`,
          bookingId: b.id,
          bookingNumber: b.bookingNumber,
          technicianId: b.technicianId,
          technicianName: b.technicianName,
          customerId: b.customerId,
          amountCollected: finalAmt,
          commissionAmount: comm,
          technicianShareAmount: net,
          status: 'CASH_PENDING',
          collectedAt: b.updatedAt || now,
          deadlineAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          graceEndsAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
          reminderCount: 0,
          bookingRestrictedApplied: false,
          deposit: null,
        });
      } else {
        ledgerEntries.push({
          id: `led-${b.id}`,
          technicianId: b.technicianId,
          bookingId: b.id,
          entryType: 'EARNING_AVAILABLE',
          amount: net,
          direction: 'CREDIT',
          description: `Booking #${b.bookingNumber} settled (90% net share)`,
          referenceKey: `book-settle-${b.id}`,
          createdBy: 'system',
          createdAt: b.updatedAt || now,
        });
      }
    } else if (!['CANCELLED'].includes(b.status)) {
      ledgerEntries.push({
        id: `led-pend-${b.id}`,
        technicianId: b.technicianId,
        bookingId: b.id,
        entryType: 'EARNING_PENDING',
        amount: net,
        direction: 'CREDIT',
        description: `Pending earning for active Booking #${b.bookingNumber}`,
        referenceKey: `book-pend-${b.id}`,
        createdBy: 'system',
        createdAt: b.createdAt || now,
      });
    }
  });

  return {
    rules,
    ruleVersions: [
      {
        id: 'rv-1',
        version: 1,
        changedBy: 'user-admin-demo',
        summary: 'Initial Servexa 90/10 platform governance policy',
        rulesJson: JSON.stringify(rules),
        createdAt: now,
      },
    ],
    auditLogs: [
      {
        id: 'audit-1',
        adminId: 'user-admin-demo',
        adminName: 'আরিফুল ইসলাম (Admin)',
        section: 'PLATFORM_RULES',
        action: 'INIT_RULES',
        targetId: '1',
        previousValue: '{}',
        newValue: JSON.stringify({ commission: '10%', reserve: 500 }),
        reason: 'Initial platform ledger setup',
        ruleVersion: 1,
        createdAt: now,
      },
    ],
    categories,
    subcategories,
    pricingRules,
    techServices,
    priceHistory: [],
    snapshots,
    extraCharges: [],
    paymentTransactions: [],
    cashCollections,
    payoutAccounts,
    withdrawals,
    ledgerEntries,
    techRestrictions: {},
  };
}

function loadState(): LocalFinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as LocalFinanceState;
    }
  } catch {
    // ignore corrupted cache
  }
  const initial = createInitialState();
  saveState(initial);
  return initial;
}

function saveState(state: LocalFinanceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function getSessionUser(): LocalSessionUser {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    if (raw) return JSON.parse(raw) as LocalSessionUser;
  } catch {
    // ignore
  }
  return { userId: 'user-cust-demo', role: 'CUSTOMER', technicianId: null, name: 'সাকিব আল হাসান' };
}

function computeTechWallet(state: LocalFinanceState, technicianId: string): WalletSummary {
  const restriction = state.techRestrictions[technicianId];
  const reserveFloor = restriction?.customReserveBalance ?? state.rules.walletAndReserve.globalMinimumReserveBalance;

  const techEntries = state.ledgerEntries.filter((l) => l.technicianId === technicianId);
  let totalEarnings = 0;
  let pendingEarnings = 0;
  let availableBalance = 0;
  let lockedForWithdrawal = 0;
  let totalWithdrawn = 0;

  for (const e of techEntries) {
    if (e.entryType === 'EARNING_AVAILABLE' && e.direction === 'CREDIT') {
      availableBalance += e.amount;
      totalEarnings += e.amount;
    } else if (e.entryType === 'ADJUSTMENT_CREDIT' && e.direction === 'CREDIT') {
      availableBalance += e.amount;
      totalEarnings += e.amount;
    } else if (e.entryType === 'EARNING_PENDING' && e.direction === 'CREDIT') {
      pendingEarnings += e.amount;
    } else if (e.entryType === 'WITHDRAWAL_RESERVED') {
      availableBalance -= e.amount;
      lockedForWithdrawal += e.amount;
    } else if (e.entryType === 'WITHDRAWAL_COMPLETED') {
      lockedForWithdrawal -= e.amount;
      totalWithdrawn += e.amount;
    } else if (e.entryType === 'WITHDRAWAL_RESTORED') {
      lockedForWithdrawal -= e.amount;
      availableBalance += e.amount;
    } else if (e.entryType === 'REFUND_DEBIT' || e.entryType === 'ADJUSTMENT_DEBIT') {
      availableBalance -= e.amount;
    }
  }

  availableBalance = Math.max(0, Math.round(availableBalance * 100) / 100);
  pendingEarnings = Math.max(0, Math.round(pendingEarnings * 100) / 100);
  lockedForWithdrawal = Math.max(0, Math.round(lockedForWithdrawal * 100) / 100);
  totalWithdrawn = Math.max(0, Math.round(totalWithdrawn * 100) / 100);
  totalEarnings = Math.max(availableBalance + totalWithdrawn, Math.round(totalEarnings * 100) / 100);

  const techCash = state.cashCollections.filter((c) => c.technicianId === technicianId);
  const cashPending = techCash
    .filter((c) => ['CASH_PENDING', 'CASH_COLLECTED', 'VERIFICATION_PENDING', 'OVERDUE'].includes(c.status))
    .reduce((sum, c) => sum + c.amountCollected, 0);
  const commissionDue = techCash
    .filter((c) => ['CASH_PENDING', 'CASH_COLLECTED', 'VERIFICATION_PENDING', 'OVERDUE'].includes(c.status))
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const withdrawableBalance = Math.max(0, Math.round((availableBalance - reserveFloor) * 100) / 100);

  return {
    technicianId,
    currency: 'BDT',
    totalEarnings,
    pendingEarnings,
    availableBalance,
    reservedBalance: reserveFloor,
    lockedForWithdrawal,
    withdrawableBalance,
    cashPending,
    commissionDue,
    totalWithdrawn,
    customReserveBalance: restriction?.customReserveBalance ?? null,
    bookingRestricted: restriction?.restricted ?? false,
    restrictionReason: restriction?.reason ?? null,
    updatedAt: new Date().toISOString(),
  };
}

function getProvidersList() {
  return [
    {
      provider: 'bkash' as PaymentMethodCode,
      displayName: 'bKash Tokenized Checkout & Disbursement (Demo)',
      configured: true,
      mode: 'SANDBOX',
      missingEnvVars: [] as string[],
      onboardingNotes: 'Sandbox/Demo bKash merchant credentials active.',
    },
    {
      provider: 'nagad' as PaymentMethodCode,
      displayName: 'Nagad Merchant Payment Gateway (Demo)',
      configured: true,
      mode: 'SANDBOX',
      missingEnvVars: [] as string[],
      onboardingNotes: 'Sandbox/Demo Nagad merchant credentials active.',
    },
    {
      provider: 'rocket' as PaymentMethodCode,
      displayName: 'DBBL Rocket Merchant Collection (Demo)',
      configured: true,
      mode: 'SANDBOX',
      missingEnvVars: [] as string[],
      onboardingNotes: 'Sandbox/Demo Rocket merchant credentials active.',
    },
    {
      provider: 'card' as PaymentMethodCode,
      displayName: 'Debit / Credit Cards (SSLCommerz Demo)',
      configured: true,
      mode: 'SANDBOX',
      missingEnvVars: [] as string[],
      onboardingNotes: 'Sandbox/Demo SSLCommerz card store active.',
    },
    {
      provider: 'cash' as PaymentMethodCode,
      displayName: 'Cash on Completion + Merchant Deposit Reconciliation',
      configured: true,
      mode: 'LIVE',
      missingEnvVars: [] as string[],
      onboardingNotes: 'Technician collects cash upon completion and submits merchant TrxID.',
    },
  ];
}

export async function handleLocalFinanceFallback<T>(url: string, options: RequestInit = {}): Promise<T> {
  const parsedUrl = new URL(url, 'http://localhost');
  const path = parsedUrl.pathname;
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : {};
  const state = loadState();
  const session = getSessionUser();
  const techs = getAppTechnicians();
  const now = new Date().toISOString();

  // 1. Session bootstrap
  if (path === '/api/auth/session' && method === 'POST') {
    const ownedTech = techs.find(
      (t) => t.userId === body.userId || (body.email && t.email === body.email)
    );
    const techId = ownedTech?.id || (body.role === 'TECHNICIAN' ? 'tech-1' : null);
    const nextSession: LocalSessionUser = {
      userId: String(body.userId || 'user-cust-demo'),
      role: body.role || 'CUSTOMER',
      technicianId: techId,
      name: String(body.name || 'User'),
    };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(nextSession));
    return {
      token: `local-vercel-token-${nextSession.userId}`,
      user: {
        id: nextSession.userId,
        role: nextSession.role,
        technicianId: techId,
      },
    } as T;
  }

  // 2. Public & Catalog
  if (path === '/api/rules/public' && method === 'GET') {
    return state.rules as unknown as T;
  }

  if (path === '/api/catalog/overview' && method === 'GET') {
    return {
      categories: state.categories,
      subcategories: state.subcategories,
      pricingRules: state.pricingRules,
    } as T;
  }

  if (path === '/api/pricing/quote' && method === 'POST') {
    const req = body as PriceQuoteRequest;
    const rule =
      state.pricingRules.find((r) => r.subcategoryId === req.subcategoryId) ||
      state.pricingRules.find((r) => r.categoryId === req.categoryId) ||
      state.pricingRules[0];
    const tech = techs.find((t) => t.id === req.technicianId) || techs[0];
    const cat = state.categories.find((c) => c.id === req.categoryId) || state.categories[0];

    const servicePrice = rule?.defaultPrice ?? cat?.startingPrice ?? 450;
    const visitingFee = rule?.visitingFee ?? state.rules.visitingAndAdditional.defaultVisitingFee;
    const hourlyCharge = req.estimatedHours && req.estimatedHours > 1 ? (req.estimatedHours - 1) * (rule?.additionalHourCharge ?? 200) : 0;
    const emergencyCharge = req.urgency === 'emergency' ? (rule?.emergencyCharge ?? state.rules.visitingAndAdditional.defaultEmergencyCharge) : 0;
    const nightCharge = req.isNightService ? (rule?.nightCharge ?? state.rules.visitingAndAdditional.defaultNightCharge) : 0;
    const weekendCharge = req.isWeekendService ? (rule?.weekendCharge ?? state.rules.visitingAndAdditional.defaultWeekendCharge) : 0;
    const estimatedMaterialCost = Number(req.estimatedMaterialCost || 0);
    const subtotal = servicePrice + visitingFee + hourlyCharge + emergencyCharge + nightCharge + weekendCharge + estimatedMaterialCost;
    const discountAmount = req.promoCode && state.rules.discountAndPromo.allowPromoCodes ? Math.round(subtotal * 0.1) : 0;
    const estimatedTotal = Math.max(0, subtotal - discountAmount);
    const commPct = state.rules.commission.defaultPlatformCommissionPercent;
    const techPct = state.rules.commission.defaultTechnicianEarningsPercent;
    const commissionableAmount = Math.max(0, estimatedTotal - (state.rules.commission.commissionableItems.materialCost ? 0 : estimatedMaterialCost));
    const estimatedPlatformCommission = Math.round((commissionableAmount * commPct) / 100);
    const estimatedTechnicianEarnings = estimatedTotal - estimatedPlatformCommission;

    const quote: PriceQuoteResponse = {
      categoryId: req.categoryId,
      subcategoryId: req.subcategoryId,
      pricingRuleId: rule?.id,
      technicianId: tech.id,
      technicianName: tech.name,
      serviceNameEn: cat?.nameEn || 'Home Service',
      serviceNameBn: cat?.nameBn || 'হোম সার্ভিস',
      servicePrice,
      visitingFee,
      hourlyCharge,
      emergencyCharge,
      nightCharge,
      weekendCharge,
      estimatedMaterialCost,
      materialCostCommissionable: state.rules.commission.commissionableItems.materialCost,
      discountAmount,
      promoApplied: req.promoCode || null,
      subtotal,
      estimatedTotal,
      commissionableAmount,
      platformCommissionPercent: commPct,
      technicianEarningsPercent: techPct,
      estimatedPlatformCommission,
      estimatedTechnicianEarnings,
      ruleVersion: state.rules.version,
      activePaymentMethods: state.rules.general.activePaymentMethods,
      currency: 'BDT',
      currencySymbol: '৳',
    };
    return { quote } as T;
  }

  // 3. Admin Rules & Catalog
  if (path === '/api/admin/rules' && method === 'GET') {
    return {
      rules: state.rules,
      versions: state.ruleVersions,
      providers: getProvidersList(),
    } as T;
  }

  if (path === '/api/admin/rules' && method === 'PUT') {
    const nextVersion = state.rules.version + 1;
    const nextRules: PlatformRules = {
      ...state.rules,
      ...body.rules,
      version: nextVersion,
      updatedAt: now,
      updatedBy: session.userId,
    };
    state.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      adminId: session.userId,
      adminName: session.name,
      section: 'PLATFORM_RULES',
      action: 'UPDATE_RULES',
      targetId: '1',
      previousValue: `v${state.rules.version}`,
      newValue: `v${nextVersion}`,
      reason: body.reason || `Updated rules to v${nextVersion}`,
      ruleVersion: nextVersion,
      createdAt: now,
    });
    state.rules = nextRules;
    state.ruleVersions.unshift({
      id: `rv-${nextVersion}`,
      version: nextVersion,
      changedBy: session.userId,
      summary: body.reason || `Updated rules to v${nextVersion}`,
      rulesJson: JSON.stringify(nextRules),
      createdAt: now,
    });
    saveState(state);
    return { rules: nextRules } as T;
  }

  if (path === '/api/admin/audit-logs' && method === 'GET') {
    const search = (parsedUrl.searchParams.get('search') || '').toLowerCase().trim();
    const logs = search
      ? state.auditLogs.filter(
          (l) =>
            l.action.toLowerCase().includes(search) ||
            l.section.toLowerCase().includes(search) ||
            (l.reason || '').toLowerCase().includes(search)
        )
      : state.auditLogs;
    return { logs } as T;
  }

  if (path === '/api/admin/categories' && method === 'POST') {
    const cat = {
      id: `cat-${Date.now()}`,
      nameEn: body.nameEn,
      nameBn: body.nameBn,
      icon: body.icon || 'Wrench',
      descriptionEn: body.descriptionEn || body.nameEn,
      descriptionBn: body.descriptionBn || body.nameBn,
      startingPrice: Number(body.startingPrice || 400),
      popular: false,
      emergencyAvailable: !!body.emergencyAvailable,
      activeProfessionals: 1,
      tags: [],
      active: true,
      commissionOverridePercent: body.commissionOverridePercent ? Number(body.commissionOverridePercent) : null,
    };
    state.categories.push(cat);
    saveState(state);
    return { category: cat } as T;
  }

  if (path === '/api/admin/subcategories' && method === 'POST') {
    const subId = `sub-${Date.now()}`;
    const ruleId = `rule-${Date.now()}`;
    const sub: ServiceSubcategory = {
      id: subId,
      categoryId: body.categoryId,
      nameEn: body.nameEn,
      nameBn: body.nameBn,
      descriptionEn: body.descriptionEn || body.nameEn,
      descriptionBn: body.descriptionBn || body.nameBn,
      icon: 'Wrench',
      active: true,
      pricingRuleId: ruleId,
    };
    const rule: PricingRule = {
      id: ruleId,
      categoryId: body.categoryId,
      subcategoryId: subId,
      serviceTitleEn: body.nameEn,
      serviceTitleBn: body.nameBn,
      defaultPrice: Number(body.defaultPrice || 500),
      minPrice: Number(body.minPrice || 300),
      maxPrice: Number(body.maxPrice || 1000),
      customizationPermission: body.customizationPermission || 'TECH_CUSTOMIZABLE_RANGE',
      visitingFee: Number(body.visitingFee || 200),
      minVisitingFee: Number(body.minVisitingFee || 100),
      maxVisitingFee: Number(body.maxVisitingFee || 400),
      hourlyRate: 300,
      additionalHourCharge: 200,
      emergencyCharge: 250,
      nightCharge: 150,
      weekendCharge: 100,
      materialPolicy: 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE',
      additionalChargePolicy: 'REQUIRE_CUSTOMER_APPROVAL',
      requiresPriceApproval: !!body.requiresPriceApproval,
      commissionOverridePercent: body.commissionOverridePercent ? Number(body.commissionOverridePercent) : null,
      active: true,
      ruleVersion: state.rules.version,
      updatedAt: now,
    };
    state.subcategories.push(sub);
    state.pricingRules.push(rule);
    saveState(state);
    return { subcategory: sub, pricingRule: rule } as T;
  }

  if (path.startsWith('/api/admin/pricing-rules/') && method === 'PUT') {
    const id = decodeURIComponent(path.replace('/api/admin/pricing-rules/', ''));
    state.pricingRules = state.pricingRules.map((r) => (r.id === id ? { ...r, ...body, updatedAt: now } : r));
    saveState(state);
    return { success: true } as T;
  }

  if (path === '/api/admin/technician-pricing' && method === 'GET') {
    const items = state.techServices
      .filter((s) => s.status === 'PENDING_APPROVAL')
      .map((s) => {
        const tech = techs.find((t) => t.id === s.technicianId);
        return { ...s, technicianName: tech?.name || s.technicianId };
      });
    return { items } as T;
  }

  if (path.startsWith('/api/admin/technician-pricing/') && path.endsWith('/review') && method === 'POST') {
    const id = decodeURIComponent(path.replace('/api/admin/technician-pricing/', '').replace('/review', ''));
    const decision = body.decision as 'APPROVE' | 'REJECT';
    state.techServices = state.techServices.map((s) => {
      if (s.id !== id) return s;
      if (decision === 'APPROVE') {
        return {
          ...s,
          approvedPrice: s.pendingPrice ?? s.approvedPrice,
          approvedVisitingFee: s.pendingVisitingFee ?? s.approvedVisitingFee,
          approvedHourlyRate: s.pendingHourlyRate ?? s.approvedHourlyRate,
          pendingPrice: null,
          pendingVisitingFee: null,
          pendingHourlyRate: null,
          status: 'APPROVED',
          rejectionReason: null,
          updatedAt: now,
        };
      }
      return {
        ...s,
        pendingPrice: null,
        status: 'REJECTED',
        rejectionReason: body.reason || 'Rejected by Admin',
        updatedAt: now,
      };
    });
    saveState(state);
    return { success: true } as T;
  }

  // 4. Technician Services & Pricing
  if (path === '/api/technician/services' && method === 'GET') {
    const reqTechId = parsedUrl.searchParams.get('technicianId') || session.technicianId || 'tech-1';
    const services = state.techServices.filter((s) => s.technicianId === reqTechId);
    const history = state.priceHistory.filter((h) => h.technicianId === reqTechId);
    return { technicianId: reqTechId, services, history } as T;
  }

  if (path === '/api/technician/services/select' && method === 'POST') {
    const techId = session.technicianId || 'tech-1';
    const sub = state.subcategories.find((s) => s.id === body.subcategoryId);
    const rule = state.pricingRules.find((r) => r.subcategoryId === body.subcategoryId) || state.pricingRules[0];
    const id = `tsvc-${Date.now()}`;
    state.techServices.push({
      id,
      technicianId: techId,
      categoryId: sub?.categoryId || rule.categoryId,
      subcategoryId: body.subcategoryId,
      pricingRuleId: rule.id,
      serviceTitleEn: sub?.nameEn || rule.serviceTitleEn,
      serviceTitleBn: sub?.nameBn || rule.serviceTitleBn,
      approvedPrice: rule.defaultPrice,
      approvedVisitingFee: rule.visitingFee,
      approvedHourlyRate: rule.hourlyRate,
      approvedAdditionalHourCharge: rule.additionalHourCharge,
      approvedEmergencyCharge: rule.emergencyCharge,
      approvedNightCharge: rule.nightCharge,
      approvedWeekendCharge: rule.weekendCharge,
      status: 'DEFAULT_PRICE',
      active: true,
      updatedAt: now,
    });
    saveState(state);
    return { id, status: 'DEFAULT_PRICE' } as T;
  }

  if (path.startsWith('/api/technician/services/') && path.endsWith('/toggle') && method === 'PATCH') {
    const id = decodeURIComponent(path.replace('/api/technician/services/', '').replace('/toggle', ''));
    state.techServices = state.techServices.map((s) => (s.id === id ? { ...s, active: !!body.active, updatedAt: now } : s));
    saveState(state);
    return { success: true } as T;
  }

  if (path.startsWith('/api/technician/services/') && method === 'PUT') {
    const id = decodeURIComponent(path.replace('/api/technician/services/', ''));
    const svc = state.techServices.find((s) => s.id === id);
    if (!svc) throw new Error('Service configuration not found.');
    const rule = state.pricingRules.find((r) => r.id === svc.pricingRuleId);
    const newPrice = Number(body.price ?? svc.approvedPrice);
    if (rule && (newPrice < rule.minPrice || newPrice > rule.maxPrice)) {
      throw new Error(`Price ৳${newPrice} must be within Admin range ৳${rule.minPrice}–৳${rule.maxPrice}.`);
    }
    const needsApproval = !!rule?.requiresPriceApproval;
    state.priceHistory.unshift({
      id: `ph-${Date.now()}`,
      technicianId: svc.technicianId,
      technicianServiceId: svc.id,
      serviceTitleEn: svc.serviceTitleEn,
      field: 'SERVICE_PRICE',
      previousValue: svc.approvedPrice,
      newValue: newPrice,
      status: needsApproval ? 'PENDING_APPROVAL' : 'CUSTOMIZED_PRICE',
      note: needsApproval ? 'Submitted for Admin approval' : 'Updated within Admin permitted range',
      createdAt: now,
    });
    state.techServices = state.techServices.map((s) =>
      s.id !== id
        ? s
        : needsApproval
          ? { ...s, pendingPrice: newPrice, status: 'PENDING_APPROVAL', updatedAt: now }
          : {
              ...s,
              approvedPrice: newPrice,
              approvedVisitingFee: Number(body.visitingFee ?? s.approvedVisitingFee),
              approvedHourlyRate: Number(body.hourlyRate ?? s.approvedHourlyRate),
              status: 'CUSTOMIZED_PRICE',
              updatedAt: now,
            }
    );
    saveState(state);
    return { success: true, status: needsApproval ? 'PENDING_APPROVAL' : 'CUSTOMIZED_PRICE', needsApproval } as T;
  }

  // 5. Bookings, Snapshots & Payments
  if (path === '/api/bookings' && method === 'POST') {
    const bId = body.id || `book-${Date.now()}`;
    const total = Number(body.estimatedTotalMax || body.estimatedTotal || 650);
    const comm = Math.round(total * 0.1 * 100) / 100;
    const snap: BookingPriceSnapshot = {
      id: `snap-${bId}`,
      bookingId: bId,
      categoryId: body.categoryId || 'electrical',
      technicianId: body.technicianId || 'tech-1',
      customerId: session.userId,
      serviceNameEn: body.serviceNameEn || 'Home Service',
      serviceNameBn: body.serviceNameBn || 'হোম সার্ভিস',
      servicePrice: body.estimatedLabourMin || 350,
      visitingFee: body.estimatedVisitingFee || 200,
      hourlyCharge: 0,
      additionalChargesTotal: 0,
      emergencyCharge: 0,
      nightCharge: 0,
      weekendCharge: 0,
      materialCost: 0,
      materialCostCommissionable: false,
      discountAmount: 0,
      subtotal: total,
      commissionableAmount: total,
      platformCommissionPercent: 10,
      technicianEarningsPercent: 90,
      platformCommissionAmount: comm,
      technicianEarningsAmount: total - comm,
      estimatedTotal: total,
      finalAgreedAmount: total,
      ruleVersion: state.rules.version,
      currency: 'BDT',
      confirmedAt: now,
    };
    state.snapshots[bId] = snap;
    saveState(state);
    return { booking: body, snapshot: snap } as T;
  }

  if (path.startsWith('/api/bookings/') && path.endsWith('/snapshot') && method === 'GET') {
    const bId = decodeURIComponent(path.replace('/api/bookings/', '').replace('/snapshot', ''));
    return {
      snapshot: state.snapshots[bId] || null,
      extraCharges: state.extraCharges.filter((c) => c.bookingId === bId),
      paymentTransactions: state.paymentTransactions.filter((t) => t.bookingId === bId),
      cashCollection: state.cashCollections.find((c) => c.bookingId === bId) || null,
    } as T;
  }

  if (path.startsWith('/api/bookings/') && path.endsWith('/extra-charges') && method === 'POST') {
    const bId = decodeURIComponent(path.replace('/api/bookings/', '').replace('/extra-charges', ''));
    const req: AdditionalChargeRequest = {
      id: `echg-${Date.now()}`,
      bookingId: bId,
      technicianId: session.technicianId || 'tech-1',
      chargeType: body.chargeType || 'EXTRA_WORK',
      reason: body.reason || '',
      amount: Number(body.amount || 0),
      receiptNote: body.receiptNote,
      status: 'PENDING_CUSTOMER',
      createdAt: now,
    };
    state.extraCharges.unshift(req);
    saveState(state);
    return { extraCharge: req } as T;
  }

  if (path.includes('/extra-charges/') && path.endsWith('/respond') && method === 'POST') {
    const parts = path.split('/');
    const bId = decodeURIComponent(parts[3]);
    const cId = decodeURIComponent(parts[5]);
    const decision = body.decision as 'APPROVE' | 'REJECT';
    let added = 0;
    state.extraCharges = state.extraCharges.map((c) => {
      if (c.id !== cId) return c;
      if (decision === 'APPROVE') added = c.amount;
      return { ...c, status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', respondedAt: now };
    });
    if (added > 0 && state.snapshots[bId]) {
      const s = state.snapshots[bId];
      const nextFinal = s.finalAgreedAmount + added;
      const nextComm = Math.round(nextFinal * (s.platformCommissionPercent / 100));
      state.snapshots[bId] = {
        ...s,
        additionalChargesTotal: s.additionalChargesTotal + added,
        finalAgreedAmount: nextFinal,
        platformCommissionAmount: nextComm,
        technicianEarningsAmount: nextFinal - nextComm,
      };
    }
    saveState(state);
    return { status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', snapshot: state.snapshots[bId] || null } as T;
  }

  if (path === '/api/payments/providers' && method === 'GET') {
    return {
      activeMethods: state.rules.general.activePaymentMethods,
      providers: getProvidersList(),
    } as T;
  }

  if (path === '/api/payments/initiate' && method === 'POST') {
    const bId = String(body.bookingId);
    const payMethod = (body.method || 'bkash') as PaymentMethodCode;
    const booking = getAppBookings().find((b) => b.id === bId);
    const snap = state.snapshots[bId];
    const amount = snap?.finalAgreedAmount ?? booking?.finalTotal ?? booking?.estimatedTotalMax ?? 650;
    const providerTxId = `${payMethod.toUpperCase()}-DEMO-${Date.now().toString().slice(-6)}`;
    const tx: PaymentTransaction = {
      id: `ptx-${Date.now()}`,
      bookingId: bId,
      customerId: booking?.customerId || session.userId,
      technicianId: booking?.technicianId || 'tech-1',
      method: payMethod,
      amount,
      currency: 'BDT',
      status: 'VERIFIED',
      providerTxId,
      providerStatus: 'SANDBOX_COMPLETED',
      providerMode: 'SANDBOX',
      idempotencyKey: body.idempotencyKey || `${bId}-${Date.now()}`,
      createdAt: now,
      verifiedAt: now,
      refundedAmount: 0,
    };
    state.paymentTransactions.unshift(tx);
    const techShare = Math.round(amount * 0.9);
    state.ledgerEntries.unshift({
      id: `led-pay-${Date.now()}`,
      technicianId: tx.technicianId,
      bookingId: bId,
      paymentTxId: tx.id,
      entryType: 'EARNING_AVAILABLE',
      amount: techShare,
      direction: 'CREDIT',
      description: `Demo ${payMethod.toUpperCase()} payment settled for #${booking?.bookingNumber || bId}`,
      referenceKey: `pay-${tx.id}`,
      createdBy: 'payment-demo',
      createdAt: now,
    });
    saveState(state);
    return {
      transaction: tx,
      configured: true,
      mode: 'SANDBOX',
      missingEnvVars: [],
      message: `Demo ${payMethod.toUpperCase()} sandbox payment verified (${providerTxId}).`,
    } as T;
  }

  if (path === '/api/cash/collect' && method === 'POST') {
    const bId = String(body.bookingId);
    const booking = getAppBookings().find((b) => b.id === bId);
    const amount = booking?.finalTotal ?? booking?.estimatedTotalMax ?? 650;
    const comm = Math.round(amount * 0.1);
    const cc: CashCollectionRecord = {
      id: `cc-${Date.now()}`,
      bookingId: bId,
      bookingNumber: booking?.bookingNumber || bId,
      technicianId: booking?.technicianId || session.technicianId || 'tech-1',
      technicianName: booking?.technicianName || 'Technician',
      customerId: booking?.customerId || 'user-cust-demo',
      amountCollected: amount,
      commissionAmount: comm,
      technicianShareAmount: amount - comm,
      status: 'CASH_PENDING',
      collectedAt: now,
      deadlineAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      graceEndsAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
      reminderCount: 0,
      bookingRestrictedApplied: false,
      deposit: null,
    };
    state.cashCollections.unshift(cc);
    saveState(state);
    return { cashCollection: cc } as T;
  }

  if (path === '/api/cash/submit-deposit' && method === 'POST') {
    const ccId = String(body.cashCollectionId);
    state.cashCollections = state.cashCollections.map((c) =>
      c.id !== ccId
        ? c
        : {
            ...c,
            status: 'VERIFICATION_PENDING',
            deposit: {
              id: `dep-${Date.now()}`,
              cashCollectionId: ccId,
              bookingId: c.bookingId,
              technicianId: c.technicianId,
              channel: body.channel || 'bkash_merchant',
              depositReference: body.depositReference || '',
              amountDeposited: Number(body.amountDeposited || c.amountCollected),
              status: 'VERIFICATION_PENDING',
              submittedAt: now,
            },
          }
    );
    saveState(state);
    return { success: true } as T;
  }

  // 6. Technician Wallet & Period Stats (Strictly Per-Technician Isolated)
  if (path === '/api/wallet' && method === 'GET') {
    const reqTechId = parsedUrl.searchParams.get('technicianId') || session.technicianId || 'tech-1';
    const wallet = computeTechWallet(state, reqTechId);
    const allBookings = getAppBookings().filter((b) => b.technicianId === reqTechId && b.status === 'COMPLETED');
    const techEarnedSum = allBookings.reduce((s, b) => s + Math.round((b.finalTotal || b.estimatedTotalMax || 600) * 0.9), 0);
    return {
      wallet,
      periodStats: {
        todayEarnings: allBookings.length > 0 ? Math.round(techEarnedSum * 0.35) : 0,
        todayCompletedCount: allBookings.length > 0 ? 1 : 0,
        weekEarnings: techEarnedSum,
        monthEarnings: wallet.totalEarnings,
        monthCompletedCount: allBookings.length,
        totalCompletedCount: allBookings.length,
      },
      reservePolicy: {
        globalMinimumReserveBalance: state.rules.walletAndReserve.globalMinimumReserveBalance,
        minimumWithdrawalAmount: state.rules.walletAndReserve.minimumWithdrawalAmount,
        maximumWithdrawalAmount: state.rules.walletAndReserve.maximumWithdrawalAmount,
        withdrawalFeePercent: state.rules.withdrawal.withdrawalFeePercent,
        withdrawalFlatFee: state.rules.withdrawal.withdrawalFlatFee,
        allowedPayoutProviders: state.rules.withdrawal.allowedPayoutProviders,
        approvedDepositChannels: state.rules.cashOnCompletion.approvedDepositChannels,
        depositDeadlineHours: state.rules.cashOnCompletion.depositDeadlineHours,
      },
      ledgerEntries: state.ledgerEntries.filter((l) => l.technicianId === reqTechId),
      payoutAccounts: state.payoutAccounts.filter((p) => p.technicianId === reqTechId),
      withdrawals: state.withdrawals.filter((w) => w.technicianId === reqTechId),
      cashCollections: state.cashCollections.filter((c) => c.technicianId === reqTechId),
    } as T;
  }

  if (path === '/api/wallet/payout-accounts' && method === 'POST') {
    const techId = session.technicianId || 'tech-1';
    const acct: PayoutAccount = {
      id: `pa-${Date.now()}`,
      technicianId: techId,
      provider: (body.provider || 'bkash') as PayoutProvider,
      accountTitle: body.accountTitle || session.name,
      accountNumber: body.accountNumber || '',
      bankName: body.bankName,
      branchName: body.branchName,
      routingNumber: body.routingNumber,
      verificationStatus: 'PENDING',
      isDefault: false,
      createdAt: now,
    };
    state.payoutAccounts.unshift(acct);
    saveState(state);
    return { id: acct.id, verificationStatus: 'PENDING' } as T;
  }

  if (path === '/api/wallet/withdraw' && method === 'POST') {
    const techId = session.technicianId || 'tech-1';
    const wallet = computeTechWallet(state, techId);
    const amount = Number(body.amount || 0);
    if (amount > wallet.withdrawableBalance) {
      throw new Error(`Insufficient withdrawable balance (max ৳${wallet.withdrawableBalance} after ৳${wallet.reservedBalance} reserve).`);
    }
    const acct = state.payoutAccounts.find((p) => p.id === body.payoutAccountId) || state.payoutAccounts[0];
    const tech = techs.find((t) => t.id === techId);
    const wId = `wdr-${Date.now()}`;
    const withdrawal: WithdrawalRequest = {
      id: wId,
      technicianId: techId,
      technicianName: tech?.name || session.name,
      payoutAccountId: acct?.id || 'pa-1',
      provider: acct?.provider || 'bkash',
      accountNumberMasked: acct?.accountNumber || '017****000',
      requestedAmount: amount,
      feeAmount: 0,
      netPayoutAmount: amount,
      status: 'PENDING',
      idempotencyKey: body.idempotencyKey || wId,
      requestedAt: now,
    };
    state.withdrawals.unshift(withdrawal);
    state.ledgerEntries.unshift({
      id: `led-wdr-${Date.now()}`,
      technicianId: techId,
      withdrawalId: wId,
      entryType: 'WITHDRAWAL_RESERVED',
      amount,
      direction: 'HOLD',
      description: `Withdrawal request #${wId} reserved`,
      referenceKey: wId,
      createdBy: session.userId,
      createdAt: now,
    });
    saveState(state);
    return { withdrawal, walletAfter: computeTechWallet(state, techId) } as T;
  }

  // 7. Admin Finance Overview & Actions
  if (path === '/api/admin/finance/overview' && method === 'GET') {
    const techWallets = techs.map((t) => ({
      id: t.id,
      name: t.name,
      phone: t.phone,
      primaryArea: t.primaryArea || t.district || 'Dhaka',
      wallet: computeTechWallet(state, t.id),
    }));

    const totalTechnicianEarnings = techWallets.reduce((s, tw) => s + tw.wallet.totalEarnings, 0);
    const pendingTechnicianEarnings = techWallets.reduce((s, tw) => s + tw.wallet.pendingEarnings, 0);
    const availableTechnicianEarnings = techWallets.reduce((s, tw) => s + tw.wallet.availableBalance, 0);
    const totalReservedBalance = techWallets.reduce((s, tw) => s + tw.wallet.reservedBalance, 0);
    const totalWithdrawableBalance = techWallets.reduce((s, tw) => s + tw.wallet.withdrawableBalance, 0);
    const totalPlatformCommission = Math.round(totalTechnicianEarnings / 9);
    const totalPlatformRevenue = totalTechnicianEarnings + totalPlatformCommission;

    const summary: AdminFinancialSummary = {
      totalPlatformRevenue,
      totalPlatformCommission,
      totalTechnicianEarnings,
      pendingTechnicianEarnings,
      availableTechnicianEarnings,
      totalReservedBalance,
      totalWithdrawableBalance,
      totalWithdrawalRequestsCount: state.withdrawals.length,
      totalWithdrawalRequestedAmount: state.withdrawals.reduce((s, w) => s + w.requestedAmount, 0),
      completedWithdrawalsCount: state.withdrawals.filter((w) => w.status === 'COMPLETED').length,
      completedWithdrawalsAmount: state.withdrawals.filter((w) => w.status === 'COMPLETED').reduce((s, w) => s + w.netPayoutAmount, 0),
      failedWithdrawalsCount: state.withdrawals.filter((w) => ['FAILED', 'REJECTED', 'REVERSED'].includes(w.status)).length,
      failedWithdrawalsAmount: state.withdrawals.filter((w) => ['FAILED', 'REJECTED', 'REVERSED'].includes(w.status)).reduce((s, w) => s + w.requestedAmount, 0),
      pendingWithdrawalsCount: state.withdrawals.filter((w) => ['PENDING', 'UNDER_REVIEW', 'PROCESSING'].includes(w.status)).length,
      pendingWithdrawalsAmount: state.withdrawals.filter((w) => ['PENDING', 'UNDER_REVIEW', 'PROCESSING'].includes(w.status)).reduce((s, w) => s + w.requestedAmount, 0),
      totalOnlineCollections: state.paymentTransactions.filter((t) => t.status === 'VERIFIED').reduce((s, t) => s + t.amount, 0),
      cashCollectedByTechnicians: state.cashCollections.reduce((s, c) => s + c.amountCollected, 0),
      cashPendingDeposits: state.cashCollections.filter((c) => c.status !== 'COMMISSION_RECORDED').reduce((s, c) => s + c.amountCollected, 0),
      verifiedCashDeposits: state.cashCollections.filter((c) => c.status === 'COMMISSION_RECORDED').reduce((s, c) => s + c.amountCollected, 0),
      overdueCashDeposits: state.cashCollections.filter((c) => c.status === 'OVERDUE').reduce((s, c) => s + c.amountCollected, 0),
      outstandingCommissionDues: techWallets.reduce((s, tw) => s + tw.wallet.commissionDue, 0),
      totalRefundsAmount: state.paymentTransactions.reduce((s, t) => s + t.refundedAmount, 0),
      totalAdjustmentsNet: 0,
    };

    const transactions = getAppBookings().map((b) => {
      const snap = state.snapshots[b.id];
      const total = snap?.finalAgreedAmount ?? b.finalTotal ?? b.estimatedTotalMax ?? 650;
      const comm = snap?.platformCommissionAmount ?? Math.round(total * 0.1);
      return {
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        technicianName: b.technicianName,
        paymentMethod: b.paymentMethod,
        paymentStatus: b.paymentStatus,
        finalAgreedAmount: total,
        platformCommissionPercent: 10,
        platformCommissionAmount: comm,
        technicianEarningsAmount: total - comm,
      };
    });

    const cashDeposits = state.cashCollections.map((c) => ({
      cashCollectionId: c.id,
      bookingId: c.bookingId,
      bookingNumber: c.bookingNumber,
      technicianId: c.technicianId,
      technicianName: c.technicianName,
      amountCollected: c.amountCollected,
      commissionAmount: c.commissionAmount,
      technicianShareAmount: c.technicianShareAmount,
      deadlineAt: c.deadlineAt,
      status: c.status,
      depositId: c.deposit?.id || null,
      depositStatus: c.deposit?.status || null,
      channel: c.deposit?.channel || null,
      depositReference: c.deposit?.depositReference || null,
    }));

    const payoutAccountsWithTech = state.payoutAccounts.map((pa) => ({
      ...pa,
      technicianName: techs.find((t) => t.id === pa.technicianId)?.name || pa.technicianId,
    }));

    return {
      summary,
      techWallets,
      withdrawals: state.withdrawals,
      cashDeposits,
      payoutAccounts: payoutAccountsWithTech,
      transactions,
      paymentTransactions: state.paymentTransactions,
    } as T;
  }

  if (path.startsWith('/api/admin/payout-accounts/') && path.endsWith('/verify') && method === 'POST') {
    const id = decodeURIComponent(path.replace('/api/admin/payout-accounts/', '').replace('/verify', ''));
    state.payoutAccounts = state.payoutAccounts.map((pa) =>
      pa.id === id ? { ...pa, verificationStatus: body.status, verifiedAt: now } : pa
    );
    saveState(state);
    return { success: true } as T;
  }

  if (path.startsWith('/api/admin/withdrawals/') && path.endsWith('/action') && method === 'POST') {
    const id = decodeURIComponent(path.replace('/api/admin/withdrawals/', '').replace('/action', ''));
    const action = body.action as string;
    const target = state.withdrawals.find((w) => w.id === id);
    if (target) {
      const nextStatus =
        action === 'COMPLETE' ? 'COMPLETED' : action === 'FAIL' ? 'FAILED' : action === 'REJECT' ? 'REJECTED' : action === 'REVERSE' ? 'REVERSED' : action;
      state.withdrawals = state.withdrawals.map((w) =>
        w.id === id ? { ...w, status: nextStatus as any, providerReference: body.providerReference || w.providerReference, processedAt: now } : w
      );
      if (action === 'COMPLETE') {
        state.ledgerEntries.unshift({
          id: `led-wcomp-${Date.now()}`,
          technicianId: target.technicianId,
          withdrawalId: id,
          entryType: 'WITHDRAWAL_COMPLETED',
          amount: target.requestedAmount,
          direction: 'DEBIT',
          description: `Withdrawal #${id} settled (${body.providerReference || 'Manual'})`,
          referenceKey: `comp-${id}`,
          createdBy: session.userId,
          createdAt: now,
        });
      } else if (['FAIL', 'REJECT', 'REVERSE'].includes(action)) {
        state.ledgerEntries.unshift({
          id: `led-wrest-${Date.now()}`,
          technicianId: target.technicianId,
          withdrawalId: id,
          entryType: 'WITHDRAWAL_RESTORED',
          amount: target.requestedAmount,
          direction: 'RELEASE',
          description: `Withdrawal #${id} ${action.toLowerCase()} & restored`,
          referenceKey: `rest-${id}`,
          createdBy: session.userId,
          createdAt: now,
        });
      }
      saveState(state);
    }
    return { success: true } as T;
  }

  if (path.startsWith('/api/admin/cash/') && path.endsWith('/verify') && method === 'POST') {
    const depId = decodeURIComponent(path.replace('/api/admin/cash/', '').replace('/verify', ''));
    const decision = body.decision as 'APPROVE' | 'REJECT' | 'DISPUTE';
    state.cashCollections = state.cashCollections.map((c) => {
      if (c.deposit?.id !== depId) return c;
      if (decision === 'APPROVE') {
        state.ledgerEntries.unshift({
          id: `led-cash-${Date.now()}`,
          technicianId: c.technicianId,
          bookingId: c.bookingId,
          cashCollectionId: c.id,
          entryType: 'EARNING_AVAILABLE',
          amount: c.technicianShareAmount,
          direction: 'CREDIT',
          description: `Cash reconciliation verified for #${c.bookingNumber} (90% net share)`,
          referenceKey: `cash-ver-${c.id}`,
          createdBy: session.userId,
          createdAt: now,
        });
        return { ...c, status: 'COMMISSION_RECORDED', deposit: { ...c.deposit, status: 'COMMISSION_RECORDED', verifiedAt: now } };
      }
      return { ...c, status: decision === 'REJECT' ? 'REJECTED' : 'DISPUTED', deposit: { ...c.deposit, status: decision === 'REJECT' ? 'REJECTED' : 'DISPUTED' } };
    });
    saveState(state);
    return { success: true } as T;
  }

  if (path === '/api/admin/cash/check-overdue' && method === 'POST') {
    return { markedOverdue: 0, restrictedTechs: [] } as T;
  }

  if (path.startsWith('/api/admin/technicians/') && path.endsWith('/restrict') && method === 'POST') {
    const techId = decodeURIComponent(path.replace('/api/admin/technicians/', '').replace('/restrict', ''));
    const prev = state.techRestrictions[techId] || { restricted: false, reason: null, customReserveBalance: null };
    state.techRestrictions[techId] = { ...prev, restricted: !!body.restricted, reason: body.reason || null };
    saveState(state);
    return { success: true } as T;
  }

  if (path.startsWith('/api/admin/technicians/') && path.endsWith('/reserve') && method === 'PUT') {
    const techId = decodeURIComponent(path.replace('/api/admin/technicians/', '').replace('/reserve', ''));
    const prev = state.techRestrictions[techId] || { restricted: false, reason: null, customReserveBalance: null };
    state.techRestrictions[techId] = { ...prev, customReserveBalance: body.customReserveBalance ?? null };
    saveState(state);
    return { success: true } as T;
  }

  if (path.startsWith('/api/admin/payments/') && path.endsWith('/refund') && method === 'POST') {
    const txId = decodeURIComponent(path.replace('/api/admin/payments/', '').replace('/refund', ''));
    const amount = Number(body.amount || 0);
    state.paymentTransactions = state.paymentTransactions.map((t) =>
      t.id === txId ? { ...t, status: 'REFUNDED', refundedAmount: t.refundedAmount + amount } : t
    );
    saveState(state);
    return { success: true } as T;
  }

  return { success: true } as T;
}
