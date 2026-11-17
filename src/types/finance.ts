export type CustomizationPermission =
  | 'ADMIN_CONTROLLED'
  | 'TECH_CUSTOMIZABLE_RANGE'
  | 'TECH_CUSTOMIZABLE_APPROVAL'
  | 'FIXED_NO_CUSTOMIZATION';

export type MaterialCostPolicy =
  | 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE'
  | 'COMMISSIONABLE_MATERIAL'
  | 'INCLUDED_IN_SERVICE_PRICE';

export type AdditionalChargePolicy =
  | 'REQUIRE_CUSTOMER_APPROVAL'
  | 'TECH_ESTIMATE_WITH_APPROVAL'
  | 'FIXED_SCHEDULE_ONLY';

export type CommissionDiscountPolicy =
  | 'DEDUCT_BEFORE_COMMISSION'
  | 'PLATFORM_ABSORBS_DISCOUNT';

export type PricingFieldKey =
  | 'servicePrice'
  | 'visitingFee'
  | 'hourlyRate'
  | 'additionalHourCharge'
  | 'emergencyCharge'
  | 'nightCharge'
  | 'weekendCharge';

export type PaymentMethodCode = 'bkash' | 'nagad' | 'rocket' | 'card' | 'cash';

export type TechnicianServiceStatus =
  | 'DEFAULT_PRICE'
  | 'CUSTOMIZED_PRICE'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'INACTIVE';

export type OnlinePaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'VERIFIED'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'REVERSED';

export type CashCollectionStatus =
  | 'CASH_PENDING'
  | 'CASH_COLLECTED'
  | 'DEPOSIT_SUBMITTED'
  | 'VERIFICATION_PENDING'
  | 'PAYMENT_VERIFIED'
  | 'EARNINGS_CREDITED'
  | 'COMMISSION_RECORDED'
  | 'OVERDUE'
  | 'DISPUTED'
  | 'REJECTED';

export type WithdrawalStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED'
  | 'REVERSED';

export type PayoutProvider = 'bkash' | 'nagad' | 'rocket' | 'bank';

export type PayoutVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type WalletLedgerEntryType =
  | 'EARNING_PENDING'
  | 'EARNING_AVAILABLE'
  | 'COMMISSION_DEDUCTED'
  | 'WITHDRAWAL_RESERVED'
  | 'WITHDRAWAL_COMPLETED'
  | 'WITHDRAWAL_RESTORED'
  | 'REFUND_DEBIT'
  | 'ADJUSTMENT_CREDIT'
  | 'ADJUSTMENT_DEBIT';

export interface PlatformRules {
  version: number;
  updatedAt: string;
  updatedBy: string;
  general: {
    platformName: string;
    businessTagline: string;
    currency: 'BDT';
    currencySymbol: '৳';
    allowPriceCustomization: boolean;
    allowEmergencyServices: boolean;
    allowCashOnCompletion: boolean;
    activePaymentMethods: Record<PaymentMethodCode, boolean>;
  };
  commission: {
    defaultPlatformCommissionPercent: number;
    defaultTechnicianEarningsPercent: number;
    allowCategoryCommissionOverride: boolean;
    allowSubcategoryCommissionOverride: boolean;
    commissionableItems: {
      servicePrice: boolean;
      visitingFee: boolean;
      hourlyCharge: boolean;
      extraWorkCharge: boolean;
      emergencyCharge: boolean;
      nightCharge: boolean;
      weekendCharge: boolean;
      materialCost: boolean;
    };
    discountPolicy: CommissionDiscountPolicy;
  };
  customizationPermissions: Record<PricingFieldKey, CustomizationPermission>;
  visitingAndAdditional: {
    defaultVisitingFee: number;
    minVisitingFee: number;
    maxVisitingFee: number;
    waiveVisitingFeeWhenCompleted: boolean;
    additionalChargePolicy: AdditionalChargePolicy;
    defaultEmergencyCharge: number;
    defaultNightCharge: number;
    defaultWeekendCharge: number;
    nightHoursStart: string; // e.g. '21:00'
    nightHoursEnd: string;   // e.g. '07:00'
  };
  materialPolicy: {
    policy: MaterialCostPolicy;
    requireReceiptNoteAbove: number;
    maxUnverifiedMaterialAmount: number;
    requireCustomerExplicitApproval: boolean;
  };
  walletAndReserve: {
    globalMinimumReserveBalance: number;
    minimumWithdrawalAmount: number;
    maximumWithdrawalAmount: number;
    requireCustomerConfirmationForAvailability: boolean;
    holdEarningsDaysAfterCompletion: number;
  };
  withdrawal: {
    maxRequestsPerDay: number;
    maxRequestsPerWeek: number;
    withdrawalFeePercent: number;
    withdrawalFlatFee: number;
    autoReviewAboveAmount: number;
    requireVerifiedPayoutAccount: boolean;
    allowedPayoutProviders: Record<PayoutProvider, boolean>;
  };
  onlinePayment: {
    requireServerWebhookVerification: boolean;
    allowPartialPayment: boolean;
    paymentSessionExpiryMinutes: number;
    autoCalculateEarningsOnVerify: boolean;
  };
  cashOnCompletion: {
    depositDeadlineHours: number;
    reminderIntervalHours: number;
    gracePeriodHours: number;
    restrictNewBookingsAfterOverdueReview: boolean;
    maxAllowedOverdueAmount: number;
    approvedDepositChannels: ('bkash_merchant' | 'nagad_merchant' | 'bank_transfer' | 'sslcommerz')[];
    requireAdminReconciliationIfNoApi: boolean;
  };
  bookingAndCancellation: {
    freeCancellationHoursBefore: number;
    lateCancellationFee: number;
    allowRescheduling: boolean;
    maxActiveBookingsPerTechnician: number;
  };
  refundAndDispute: {
    allowFullRefund: boolean;
    allowPartialRefund: boolean;
    holdTechnicianEarningsDuringDispute: boolean;
    disputeResolutionSlaHours: number;
  };
  discountAndPromo: {
    allowPromoCodes: boolean;
    maxPromoDiscountPercent: number;
    allowFirstBookingDiscount: boolean;
    firstBookingDiscountPercent: number;
  };
}

export interface ServiceSubcategory {
  id: string;
  categoryId: string;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  icon: string;
  active: boolean;
  pricingRuleId?: string;
}

export interface PricingRule {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  serviceTitleEn: string;
  serviceTitleBn: string;
  defaultPrice: number;
  minPrice: number;
  maxPrice: number;
  customizationPermission: CustomizationPermission;
  visitingFee: number;
  minVisitingFee: number;
  maxVisitingFee: number;
  hourlyRate: number;
  additionalHourCharge: number;
  emergencyCharge: number;
  nightCharge: number;
  weekendCharge: number;
  materialPolicy: MaterialCostPolicy;
  additionalChargePolicy: AdditionalChargePolicy;
  requiresPriceApproval: boolean;
  commissionOverridePercent?: number | null;
  active: boolean;
  ruleVersion: number;
  updatedAt: string;
}

export interface TechnicianServiceConfig {
  id: string;
  technicianId: string;
  categoryId: string;
  subcategoryId: string;
  pricingRuleId: string;
  serviceTitleEn: string;
  serviceTitleBn: string;
  // Approved active values (customers see these!)
  approvedPrice: number;
  approvedVisitingFee: number;
  approvedHourlyRate: number;
  approvedAdditionalHourCharge: number;
  approvedEmergencyCharge: number;
  approvedNightCharge: number;
  approvedWeekendCharge: number;
  // Pending requested values (when Admin approval is required)
  pendingPrice?: number | null;
  pendingVisitingFee?: number | null;
  pendingHourlyRate?: number | null;
  pendingAdditionalHourCharge?: number | null;
  pendingEmergencyCharge?: number | null;
  pendingNightCharge?: number | null;
  pendingWeekendCharge?: number | null;
  status: TechnicianServiceStatus;
  active: boolean;
  rejectionReason?: string | null;
  updatedAt: string;
}

export interface TechnicianPriceHistoryItem {
  id: string;
  technicianId: string;
  technicianServiceId: string;
  serviceTitleEn: string;
  field: string;
  previousValue: number;
  newValue: number;
  status: TechnicianServiceStatus;
  reviewedBy?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface BookingPriceSnapshot {
  id: string;
  bookingId: string;
  categoryId: string;
  subcategoryId?: string;
  technicianId: string;
  customerId: string;
  serviceNameEn: string;
  serviceNameBn: string;
  servicePrice: number;
  visitingFee: number;
  hourlyCharge: number;
  additionalChargesTotal: number;
  emergencyCharge: number;
  nightCharge: number;
  weekendCharge: number;
  materialCost: number;
  materialCostCommissionable: boolean;
  discountAmount: number;
  promoCode?: string | null;
  subtotal: number;
  commissionableAmount: number;
  platformCommissionPercent: number;
  technicianEarningsPercent: number;
  platformCommissionAmount: number;
  technicianEarningsAmount: number;
  estimatedTotal: number;
  finalAgreedAmount: number;
  ruleVersion: number;
  pricingRuleId?: string;
  currency: 'BDT';
  confirmedAt: string;
}

export interface AdditionalChargeRequest {
  id: string;
  bookingId: string;
  technicianId: string;
  chargeType: 'EXTRA_WORK' | 'PARTS_MATERIAL' | 'EMERGENCY' | 'NIGHT' | 'WEEKEND';
  reason: string;
  amount: number;
  receiptNote?: string;
  status: 'PENDING_CUSTOMER' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  respondedAt?: string | null;
  respondedBy?: string | null;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  customerId: string;
  technicianId: string;
  method: PaymentMethodCode;
  amount: number;
  currency: 'BDT';
  status: OnlinePaymentStatus;
  providerTxId?: string | null;
  providerStatus?: string | null;
  providerMode: 'UNCONFIGURED_ADAPTER' | 'SANDBOX' | 'LIVE';
  idempotencyKey: string;
  webhookEventId?: string | null;
  checkoutUrl?: string | null;
  failureReason?: string | null;
  createdAt: string;
  verifiedAt?: string | null;
  refundedAmount: number;
}

export interface CashCollectionRecord {
  id: string;
  bookingId: string;
  bookingNumber: string;
  technicianId: string;
  technicianName: string;
  customerId: string;
  amountCollected: number;
  commissionAmount: number;
  technicianShareAmount: number;
  status: CashCollectionStatus;
  collectedAt: string;
  deadlineAt: string;
  graceEndsAt: string;
  overdueAt?: string | null;
  reminderCount: number;
  lastReminderAt?: string | null;
  bookingRestrictedApplied: boolean;
  disputeNote?: string | null;
  deposit?: CashDepositRecord | null;
}

export interface CashDepositRecord {
  id: string;
  cashCollectionId: string;
  bookingId: string;
  technicianId: string;
  channel: string;
  depositReference: string;
  amountDeposited: number;
  merchantAccountInfo?: string;
  note?: string;
  status: CashCollectionStatus;
  submittedAt: string;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
}

export interface WalletSummary {
  technicianId: string;
  currency: 'BDT';
  totalEarnings: number;
  pendingEarnings: number;
  availableBalance: number;
  reservedBalance: number; // Effective reserve requirement (global or tech override)
  lockedForWithdrawal: number;
  withdrawableBalance: number; // MAX(0, availableBalance - reservedBalance)
  cashPending: number;
  commissionDue: number;
  totalWithdrawn: number;
  customReserveBalance?: number | null;
  bookingRestricted: boolean;
  restrictionReason?: string | null;
  updatedAt: string;
}

export interface WalletLedgerEntry {
  id: string;
  technicianId: string;
  bookingId?: string | null;
  withdrawalId?: string | null;
  paymentTxId?: string | null;
  cashCollectionId?: string | null;
  entryType: WalletLedgerEntryType;
  amount: number;
  direction: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE';
  description: string;
  referenceKey: string;
  createdBy: string;
  createdAt: string;
}

export interface PayoutAccount {
  id: string;
  technicianId: string;
  provider: PayoutProvider;
  accountTitle: string;
  accountNumber: string;
  bankName?: string | null;
  branchName?: string | null;
  routingNumber?: string | null;
  verificationStatus: PayoutVerificationStatus;
  verificationNote?: string | null;
  isDefault: boolean;
  createdAt: string;
  verifiedAt?: string | null;
}

export interface WithdrawalRequest {
  id: string;
  technicianId: string;
  technicianName?: string;
  payoutAccountId: string;
  provider: PayoutProvider;
  accountNumberMasked: string;
  requestedAmount: number;
  feeAmount: number;
  netPayoutAmount: number;
  status: WithdrawalStatus;
  idempotencyKey: string;
  providerReference?: string | null;
  adminNote?: string | null;
  failureReason?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  processedBy?: string | null;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  section: string;
  action: string;
  targetId?: string | null;
  previousValue: string;
  newValue: string;
  reason?: string | null;
  ruleVersion?: number | null;
  createdAt: string;
}

export interface RuleVersionRecord {
  id: string;
  version: number;
  changedBy: string;
  summary: string;
  rulesJson: string;
  createdAt: string;
}

export interface PromoCodeRecord {
  code: string;
  description: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  maxDiscount: number;
  minOrderAmount: number;
  active: boolean;
  expiresAt?: string | null;
}

export interface AdminFinancialSummary {
  totalPlatformRevenue: number;
  totalPlatformCommission: number;
  totalTechnicianEarnings: number;
  pendingTechnicianEarnings: number;
  availableTechnicianEarnings: number;
  totalReservedBalance: number;
  totalWithdrawableBalance: number;
  totalWithdrawalRequestsCount: number;
  totalWithdrawalRequestedAmount: number;
  completedWithdrawalsCount: number;
  completedWithdrawalsAmount: number;
  failedWithdrawalsCount: number;
  failedWithdrawalsAmount: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  totalOnlineCollections: number;
  cashCollectedByTechnicians: number;
  cashPendingDeposits: number;
  verifiedCashDeposits: number;
  overdueCashDeposits: number;
  outstandingCommissionDues: number;
  totalRefundsAmount: number;
  totalAdjustmentsNet: number;
}

export interface PriceQuoteRequest {
  categoryId: string;
  subcategoryId?: string;
  technicianId: string;
  urgency?: 'normal' | 'today' | 'emergency';
  isNightService?: boolean;
  isWeekendService?: boolean;
  estimatedHours?: number;
  estimatedMaterialCost?: number;
  promoCode?: string;
}

export interface PriceQuoteResponse {
  categoryId: string;
  subcategoryId?: string;
  pricingRuleId?: string;
  technicianId: string;
  technicianName: string;
  serviceNameEn: string;
  serviceNameBn: string;
  servicePrice: number;
  visitingFee: number;
  hourlyCharge: number;
  emergencyCharge: number;
  nightCharge: number;
  weekendCharge: number;
  estimatedMaterialCost: number;
  materialCostCommissionable: boolean;
  discountAmount: number;
  promoApplied?: string | null;
  subtotal: number;
  estimatedTotal: number;
  commissionableAmount: number;
  platformCommissionPercent: number;
  technicianEarningsPercent: number;
  estimatedPlatformCommission: number;
  estimatedTechnicianEarnings: number;
  ruleVersion: number;
  activePaymentMethods: Record<PaymentMethodCode, boolean>;
  currency: 'BDT';
  currencySymbol: '৳';
}
