import type Database from 'better-sqlite3';
import crypto from 'crypto';
import type {
  AdminFinancialSummary,
  BookingPriceSnapshot,
  PlatformRules,
  PriceQuoteRequest,
  PriceQuoteResponse,
  PricingRule,
  WalletSummary,
} from '../../src/types/finance';

export function roundBDT(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

export function loadPlatformRules(db: Database.Database): PlatformRules {
  const row = db.prepare('SELECT rules_json FROM platform_rules WHERE id = 1').get() as { rules_json: string } | undefined;
  if (!row) {
    throw new Error('Platform rules not initialized in database');
  }
  return JSON.parse(row.rules_json) as PlatformRules;
}

export function validateCommissionPercentages(platformPct: number, techPct: number): void {
  if (!Number.isFinite(platformPct) || !Number.isFinite(techPct)) {
    throw new Error('Commission percentages must be valid numbers.');
  }
  if (platformPct < 0 || platformPct > 100 || techPct < 0 || techPct > 100) {
    throw new Error('Commission percentages must be between 0 and 100.');
  }
  const sum = roundBDT(platformPct + techPct);
  if (Math.abs(sum - 100) > 0.001) {
    throw new Error(`Platform commission (${platformPct}%) + Technician share (${techPct}%) must equal 100% (currently ${sum}%).`);
  }
}

export function calculateCommissionSplit(
  commissionableAmount: number,
  platformCommissionPercent: number,
  technicianEarningsPercent: number
): {
  platformCommissionAmount: number;
  technicianShareFromCommissionable: number;
} {
  validateCommissionPercentages(platformCommissionPercent, technicianEarningsPercent);
  const cleanAmount = Math.max(0, roundBDT(commissionableAmount));
  const platformCommissionAmount = roundBDT((cleanAmount * platformCommissionPercent) / 100);
  const technicianShareFromCommissionable = roundBDT(cleanAmount - platformCommissionAmount);
  return {
    platformCommissionAmount,
    technicianShareFromCommissionable,
  };
}

export function resolveEffectiveCommissionPercent(
  rules: PlatformRules,
  pricingRule?: PricingRule | null,
  categoryOverride?: number | null
): { platformPercent: number; technicianPercent: number } {
  let platformPercent = rules.commission.defaultPlatformCommissionPercent;

  if (rules.commission.allowCategoryCommissionOverride && typeof categoryOverride === 'number' && Number.isFinite(categoryOverride)) {
    platformPercent = categoryOverride;
  }

  if (
    rules.commission.allowSubcategoryCommissionOverride &&
    pricingRule &&
    typeof pricingRule.commissionOverridePercent === 'number' &&
    Number.isFinite(pricingRule.commissionOverridePercent)
  ) {
    platformPercent = pricingRule.commissionOverridePercent;
  }

  const technicianPercent = roundBDT(100 - platformPercent);
  validateCommissionPercentages(platformPercent, technicianPercent);
  return { platformPercent, technicianPercent };
}

export function computePriceBreakdownFromServer(
  db: Database.Database,
  req: PriceQuoteRequest
): PriceQuoteResponse {
  const rules = loadPlatformRules(db);

  const catRow = db.prepare('SELECT * FROM service_categories WHERE id = ?').get(req.categoryId) as any;
  if (!catRow || catRow.active === 0) {
    throw new Error('Selected service category is unavailable or inactive.');
  }

  const techRow = db.prepare('SELECT * FROM technicians WHERE id = ?').get(req.technicianId) as any;
  if (!techRow) {
    throw new Error('Selected technician was not found.');
  }

  // Locate pricing rule (subcategory-specific first, otherwise category baseline)
  let ruleRow: any = null;
  if (req.subcategoryId) {
    ruleRow = db
      .prepare('SELECT * FROM pricing_rules WHERE subcategory_id = ? AND active = 1')
      .get(req.subcategoryId);
  }
  if (!ruleRow) {
    ruleRow = db
      .prepare('SELECT * FROM pricing_rules WHERE category_id = ? AND subcategory_id IS NULL AND active = 1')
      .get(req.categoryId);
  }
  if (!ruleRow) {
    ruleRow = db
      .prepare('SELECT * FROM pricing_rules WHERE category_id = ? AND active = 1 ORDER BY id ASC LIMIT 1')
      .get(req.categoryId);
  }

  const pricingRule: PricingRule | null = ruleRow
    ? {
        id: ruleRow.id,
        categoryId: ruleRow.category_id,
        subcategoryId: ruleRow.subcategory_id || undefined,
        serviceTitleEn: ruleRow.service_title_en,
        serviceTitleBn: ruleRow.service_title_bn,
        defaultPrice: Number(ruleRow.default_price),
        minPrice: Number(ruleRow.min_price),
        maxPrice: Number(ruleRow.max_price),
        customizationPermission: ruleRow.customization_permission,
        visitingFee: Number(ruleRow.visiting_fee),
        minVisitingFee: Number(ruleRow.min_visiting_fee),
        maxVisitingFee: Number(ruleRow.max_visiting_fee),
        hourlyRate: Number(ruleRow.hourly_rate),
        additionalHourCharge: Number(ruleRow.additional_hour_charge),
        emergencyCharge: Number(ruleRow.emergency_charge),
        nightCharge: Number(ruleRow.night_charge),
        weekendCharge: Number(ruleRow.weekend_charge),
        materialPolicy: ruleRow.material_policy,
        additionalChargePolicy: ruleRow.additional_charge_policy,
        requiresPriceApproval: Boolean(ruleRow.requires_price_approval),
        commissionOverridePercent: ruleRow.commission_override_percent !== null ? Number(ruleRow.commission_override_percent) : null,
        active: Boolean(ruleRow.active),
        ruleVersion: Number(ruleRow.rule_version),
        updatedAt: ruleRow.updated_at,
      }
    : null;

  // Check if technician has an approved active service pricing record
  let techSvcRow: any = null;
  if (req.subcategoryId) {
    techSvcRow = db
      .prepare('SELECT * FROM technician_services WHERE technician_id = ? AND subcategory_id = ? AND active = 1')
      .get(req.technicianId, req.subcategoryId);
  }

  // Only expose APPROVED / CUSTOMIZED_PRICE / DEFAULT_PRICE; if rejected or inactive fallback safely to Admin default!
  const canUseTechPrice =
    techSvcRow &&
    ['DEFAULT_PRICE', 'CUSTOMIZED_PRICE', 'APPROVED', 'PENDING_APPROVAL'].includes(techSvcRow.status) &&
    Number(techSvcRow.approved_price) > 0;

  const servicePrice = roundBDT(
    canUseTechPrice
      ? Number(techSvcRow.approved_price)
      : pricingRule
      ? pricingRule.defaultPrice
      : Number(catRow.starting_price || techRow.starting_price || 300)
  );

  const visitingFee = roundBDT(
    canUseTechPrice
      ? Number(techSvcRow.approved_visiting_fee)
      : pricingRule
      ? pricingRule.visitingFee
      : Number(rules.visitingAndAdditional.defaultVisitingFee || 200)
  );

  const estimatedHours = Math.max(0, Number(req.estimatedHours || 0));
  const hourlyRate = canUseTechPrice
    ? Number(techSvcRow.approved_hourly_rate)
    : pricingRule
    ? pricingRule.hourlyRate
    : 0;
  const additionalHourCharge = canUseTechPrice
    ? Number(techSvcRow.approved_additional_hour_charge)
    : pricingRule
    ? pricingRule.additionalHourCharge
    : 0;
  const hourlyCharge =
    estimatedHours > 1
      ? roundBDT(hourlyRate + (estimatedHours - 1) * additionalHourCharge)
      : estimatedHours === 1
      ? roundBDT(hourlyRate)
      : 0;

  const emergencyCharge =
    req.urgency === 'emergency' && rules.general.allowEmergencyServices
      ? roundBDT(
          canUseTechPrice
            ? Number(techSvcRow.approved_emergency_charge)
            : pricingRule?.emergencyCharge ?? rules.visitingAndAdditional.defaultEmergencyCharge
        )
      : 0;

  const nightCharge = req.isNightService
    ? roundBDT(
        canUseTechPrice
          ? Number(techSvcRow.approved_night_charge)
          : pricingRule?.nightCharge ?? rules.visitingAndAdditional.defaultNightCharge
      )
    : 0;

  const weekendCharge = req.isWeekendService
    ? roundBDT(
        canUseTechPrice
          ? Number(techSvcRow.approved_weekend_charge)
          : pricingRule?.weekendCharge ?? rules.visitingAndAdditional.defaultWeekendCharge
      )
    : 0;

  const estimatedMaterialCost = Math.max(0, roundBDT(Number(req.estimatedMaterialCost || 0)));

  const materialCostCommissionable =
    pricingRule?.materialPolicy === 'COMMISSIONABLE_MATERIAL' ||
    (rules.materialPolicy.policy === 'COMMISSIONABLE_MATERIAL' && rules.commission.commissionableItems.materialCost);

  const grossSubtotal = roundBDT(
    servicePrice + visitingFee + hourlyCharge + emergencyCharge + nightCharge + weekendCharge + estimatedMaterialCost
  );

  // Promo code / discount check
  let discountAmount = 0;
  let promoApplied: string | null = null;
  if (req.promoCode && rules.discountAndPromo.allowPromoCodes) {
    const promo = db
      .prepare('SELECT * FROM promo_codes WHERE UPPER(code) = UPPER(?) AND active = 1')
      .get(req.promoCode.trim()) as any;
    if (promo && grossSubtotal >= Number(promo.min_order_amount)) {
      let computedDisc =
        promo.discount_type === 'PERCENT'
          ? roundBDT((grossSubtotal * Number(promo.discount_value)) / 100)
          : roundBDT(Number(promo.discount_value));
      const maxCapByRule = roundBDT((grossSubtotal * rules.discountAndPromo.maxPromoDiscountPercent) / 100);
      computedDisc = Math.min(computedDisc, Number(promo.max_discount), maxCapByRule, grossSubtotal);
      discountAmount = roundBDT(Math.max(0, computedDisc));
      promoApplied = promo.code;
    }
  }

  const estimatedTotal = roundBDT(Math.max(0, grossSubtotal - discountAmount));

  // Commissionable Amount calculation strictly following Admin rules
  const ci = rules.commission.commissionableItems;
  let commissionable = 0;
  if (ci.servicePrice) commissionable += servicePrice;
  if (ci.visitingFee) commissionable += visitingFee;
  if (ci.hourlyCharge) commissionable += hourlyCharge;
  if (ci.emergencyCharge) commissionable += emergencyCharge;
  if (ci.nightCharge) commissionable += nightCharge;
  if (ci.weekendCharge) commissionable += weekendCharge;
  if (materialCostCommissionable && ci.materialCost) commissionable += estimatedMaterialCost;

  if (rules.commission.discountPolicy === 'DEDUCT_BEFORE_COMMISSION') {
    commissionable = Math.max(0, commissionable - discountAmount);
  }
  commissionable = roundBDT(commissionable);

  const { platformPercent, technicianPercent } = resolveEffectiveCommissionPercent(
    rules,
    pricingRule,
    catRow.commission_override_percent !== null ? Number(catRow.commission_override_percent) : null
  );

  const { platformCommissionAmount, technicianShareFromCommissionable } = calculateCommissionSplit(
    commissionable,
    platformPercent,
    technicianPercent
  );

  // Non-commissionable portions go 100% to the technician (pass-through parts/visiting fee if configured) unless platform absorbed discount
  const nonCommissionableGross = roundBDT(
    (!ci.servicePrice ? servicePrice : 0) +
      (!ci.visitingFee ? visitingFee : 0) +
      (!ci.hourlyCharge ? hourlyCharge : 0) +
      (!ci.emergencyCharge ? emergencyCharge : 0) +
      (!ci.nightCharge ? nightCharge : 0) +
      (!ci.weekendCharge ? weekendCharge : 0) +
      (!(materialCostCommissionable && ci.materialCost) ? estimatedMaterialCost : 0)
  );

  const estimatedTechnicianEarnings = roundBDT(
    Math.max(0, technicianShareFromCommissionable + nonCommissionableGross - (rules.commission.discountPolicy === 'PLATFORM_ABSORBS_DISCOUNT' ? 0 : 0))
  );

  return {
    categoryId: req.categoryId,
    subcategoryId: pricingRule?.subcategoryId,
    pricingRuleId: pricingRule?.id,
    technicianId: techRow.id,
    technicianName: techRow.name,
    serviceNameEn: pricingRule ? pricingRule.serviceTitleEn : catRow.name_en,
    serviceNameBn: pricingRule ? pricingRule.serviceTitleBn : catRow.name_bn,
    servicePrice,
    visitingFee,
    hourlyCharge,
    emergencyCharge,
    nightCharge,
    weekendCharge,
    estimatedMaterialCost,
    materialCostCommissionable,
    discountAmount,
    promoApplied,
    subtotal: grossSubtotal,
    estimatedTotal,
    commissionableAmount: commissionable,
    platformCommissionPercent: platformPercent,
    technicianEarningsPercent: technicianPercent,
    estimatedPlatformCommission: platformCommissionAmount,
    estimatedTechnicianEarnings,
    ruleVersion: rules.version,
    activePaymentMethods: rules.general.activePaymentMethods,
    currency: 'BDT',
    currencySymbol: '৳',
  };
}

export function recalculateSnapshotWithApprovedExtras(
  db: Database.Database,
  snapshot: BookingPriceSnapshot
): BookingPriceSnapshot {
  const rules = loadPlatformRules(db);
  const approvedExtras = db
    .prepare("SELECT * FROM additional_charge_requests WHERE booking_id = ? AND status = 'APPROVED'")
    .all(snapshot.bookingId) as any[];

  let extraWork = 0;
  let extraMaterials = 0;
  for (const item of approvedExtras) {
    if (item.charge_type === 'PARTS_MATERIAL') {
      extraMaterials += Number(item.amount);
    } else {
      extraWork += Number(item.amount);
    }
  }

  const totalMaterialCost = roundBDT(snapshot.materialCost + extraMaterials);
  const additionalChargesTotal = roundBDT(extraWork);
  const subtotal = roundBDT(
    snapshot.servicePrice +
      snapshot.visitingFee +
      snapshot.hourlyCharge +
      snapshot.emergencyCharge +
      snapshot.nightCharge +
      snapshot.weekendCharge +
      additionalChargesTotal +
      totalMaterialCost
  );
  const finalAgreedAmount = roundBDT(Math.max(0, subtotal - snapshot.discountAmount));

  const ci = rules.commission.commissionableItems;
  let commissionable = 0;
  if (ci.servicePrice) commissionable += snapshot.servicePrice;
  if (ci.visitingFee) commissionable += snapshot.visitingFee;
  if (ci.hourlyCharge) commissionable += snapshot.hourlyCharge;
  if (ci.extraWorkCharge) commissionable += additionalChargesTotal;
  if (ci.emergencyCharge) commissionable += snapshot.emergencyCharge;
  if (ci.nightCharge) commissionable += snapshot.nightCharge;
  if (ci.weekendCharge) commissionable += snapshot.weekendCharge;
  if (snapshot.materialCostCommissionable && ci.materialCost) commissionable += totalMaterialCost;

  if (rules.commission.discountPolicy === 'DEDUCT_BEFORE_COMMISSION') {
    commissionable = Math.max(0, commissionable - snapshot.discountAmount);
  }
  commissionable = roundBDT(commissionable);

  const { platformCommissionAmount, technicianShareFromCommissionable } = calculateCommissionSplit(
    commissionable,
    snapshot.platformCommissionPercent,
    snapshot.technicianEarningsPercent
  );

  const nonCommissionable = roundBDT(
    (!ci.servicePrice ? snapshot.servicePrice : 0) +
      (!ci.visitingFee ? snapshot.visitingFee : 0) +
      (!ci.hourlyCharge ? snapshot.hourlyCharge : 0) +
      (!ci.extraWorkCharge ? additionalChargesTotal : 0) +
      (!ci.emergencyCharge ? snapshot.emergencyCharge : 0) +
      (!ci.nightCharge ? snapshot.nightCharge : 0) +
      (!ci.weekendCharge ? snapshot.weekendCharge : 0) +
      (!(snapshot.materialCostCommissionable && ci.materialCost) ? totalMaterialCost : 0)
  );

  const technicianEarningsAmount = roundBDT(technicianShareFromCommissionable + nonCommissionable);

  db.prepare(`
    UPDATE booking_price_snapshots
    SET additional_charges_total = ?,
        material_cost = ?,
        subtotal = ?,
        commissionable_amount = ?,
        platform_commission_amount = ?,
        technician_earnings_amount = ?,
        final_agreed_amount = ?
    WHERE id = ?
  `).run(
    additionalChargesTotal,
    totalMaterialCost,
    subtotal,
    commissionable,
    platformCommissionAmount,
    technicianEarningsAmount,
    finalAgreedAmount,
    snapshot.id
  );

  db.prepare('UPDATE bookings SET final_total = ?, updated_at = ? WHERE id = ?').run(
    finalAgreedAmount,
    new Date().toISOString(),
    snapshot.bookingId
  );

  return {
    ...snapshot,
    additionalChargesTotal,
    materialCost: totalMaterialCost,
    subtotal,
    commissionableAmount: commissionable,
    platformCommissionAmount,
    technicianEarningsAmount,
    finalAgreedAmount,
  };
}

export function computeWithdrawableBalance(availableBalance: number, reserveBalance: number): number {
  return Math.max(0, roundBDT(availableBalance - Math.max(0, reserveBalance)));
}

export function getWalletSummary(db: Database.Database, technicianId: string): WalletSummary {
  const rules = loadPlatformRules(db);
  const walletRow = db.prepare('SELECT * FROM wallets WHERE technician_id = ?').get(technicianId) as any;

  const entries = db
    .prepare('SELECT * FROM wallet_ledger WHERE technician_id = ? ORDER BY created_at ASC')
    .all(technicianId) as any[];

  let pendingEarnings = 0;
  let availableBalance = 0;
  let totalWithdrawn = 0;
  let totalEarnings = 0;

  // Track pending credits released so totalEarnings isn't double counted
  const pendingBookedIds = new Set<string>();
  const availableBookedIds = new Set<string>();

  for (const e of entries) {
    const amt = Number(e.amount);
    switch (e.entry_type) {
      case 'EARNING_PENDING':
        pendingEarnings += amt;
        if (e.booking_id) pendingBookedIds.add(e.booking_id);
        totalEarnings += amt;
        break;
      case 'EARNING_AVAILABLE':
        availableBalance += amt;
        if (e.booking_id && pendingBookedIds.has(e.booking_id)) {
          pendingEarnings = Math.max(0, pendingEarnings - amt);
        } else {
          totalEarnings += amt;
        }
        if (e.booking_id) availableBookedIds.add(e.booking_id);
        break;
      case 'ADJUSTMENT_CREDIT':
        availableBalance += amt;
        totalEarnings += amt;
        break;
      case 'ADJUSTMENT_DEBIT':
        availableBalance -= amt;
        totalEarnings -= amt;
        break;
      case 'REFUND_DEBIT':
        if (e.booking_id && availableBookedIds.has(e.booking_id)) {
          availableBalance -= amt;
        } else {
          pendingEarnings = Math.max(0, pendingEarnings - amt);
        }
        totalEarnings = Math.max(0, totalEarnings - amt);
        break;
      case 'WITHDRAWAL_RESERVED':
        // Deduct from available while withdrawal is in-flight
        availableBalance -= amt;
        break;
      case 'WITHDRAWAL_COMPLETED':
        totalWithdrawn += amt;
        break;
      case 'WITHDRAWAL_RESTORED':
        availableBalance += amt;
        break;
      default:
        break;
    }
  }

  pendingEarnings = Math.max(0, roundBDT(pendingEarnings));
  availableBalance = Math.max(0, roundBDT(availableBalance));
  totalEarnings = Math.max(0, roundBDT(totalEarnings));
  totalWithdrawn = Math.max(0, roundBDT(totalWithdrawn));

  const lockedRow = db
    .prepare(
      "SELECT COALESCE(SUM(requested_amount), 0) as locked FROM withdrawal_requests WHERE technician_id = ? AND status IN ('PENDING','UNDER_REVIEW','PROCESSING')"
    )
    .get(technicianId) as { locked: number };
  const lockedForWithdrawal = roundBDT(Number(lockedRow?.locked || 0));

  const cashRow = db
    .prepare(
      "SELECT COALESCE(SUM(amount_collected), 0) as cash_pending, COALESCE(SUM(commission_amount), 0) as comm_due FROM cash_collections WHERE technician_id = ? AND status IN ('CASH_PENDING','CASH_COLLECTED','DEPOSIT_SUBMITTED','VERIFICATION_PENDING','OVERDUE','DISPUTED','REJECTED')"
    )
    .get(technicianId) as { cash_pending: number; comm_due: number };

  const customReserve =
    walletRow && walletRow.custom_reserve_balance !== null && walletRow.custom_reserve_balance !== undefined
      ? Number(walletRow.custom_reserve_balance)
      : null;

  const effectiveReserve = roundBDT(
    customReserve !== null ? customReserve : rules.walletAndReserve.globalMinimumReserveBalance
  );

  // Reserved balance displayed is the active reserve requirement (still technician's earned money when availableBalance >= 0)
  const reservedBalance = roundBDT(Math.min(availableBalance, effectiveReserve));
  const withdrawableBalance = computeWithdrawableBalance(availableBalance, effectiveReserve);

  return {
    technicianId,
    currency: 'BDT',
    totalEarnings,
    pendingEarnings,
    availableBalance,
    reservedBalance,
    lockedForWithdrawal,
    withdrawableBalance,
    cashPending: roundBDT(Number(cashRow?.cash_pending || 0)),
    commissionDue: roundBDT(Number(cashRow?.comm_due || 0)),
    totalWithdrawn,
    customReserveBalance: customReserve,
    bookingRestricted: Boolean(walletRow?.booking_restricted),
    restrictionReason: walletRow?.restriction_reason || null,
    updatedAt: walletRow?.updated_at || new Date().toISOString(),
  };
}

/**
 * Idempotently posts technician earnings and Servexa commission to wallet_ledger
 * ONLY after payment is verified. Moves from PENDING -> AVAILABLE once booking is COMPLETED.
 */
export function postBookingEarningsAndCommission(
  db: Database.Database,
  bookingId: string,
  paymentTxId: string | null,
  cashCollectionId: string | null,
  actorId: string
): { credited: boolean; status: 'EARNING_PENDING' | 'EARNING_AVAILABLE' } {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
  if (!booking) throw new Error('Booking not found for earnings credit');

  const snapshot = db.prepare('SELECT * FROM booking_price_snapshots WHERE booking_id = ?').get(bookingId) as any;
  if (!snapshot) throw new Error('BookingPriceSnapshot not found');

  const now = new Date().toISOString();
  const isCompleted = booking.status === 'COMPLETED';
  const techEarnings = roundBDT(Number(snapshot.technician_earnings_amount));
  const commAmount = roundBDT(Number(snapshot.platform_commission_amount));

  // Idempotency keys prevent duplicate credits even if webhooks/admin triggers fire twice
  const commRefKey = `COMM_${bookingId}`;
  const availRefKey = `EARN_AVAIL_${bookingId}`;
  const pendRefKey = `EARN_PEND_${bookingId}`;

  const existingAvail = db.prepare('SELECT id FROM wallet_ledger WHERE reference_key = ?').get(availRefKey);
  if (existingAvail) {
    return { credited: false, status: 'EARNING_AVAILABLE' };
  }

  const existingPend = db.prepare('SELECT id FROM wallet_ledger WHERE reference_key = ?').get(pendRefKey);

  // Record Servexa Commission once
  const existingComm = db.prepare('SELECT id FROM wallet_ledger WHERE reference_key = ?').get(commRefKey);
  if (!existingComm && commAmount > 0) {
    db.prepare(`
      INSERT INTO wallet_ledger (
        id, technician_id, booking_id, payment_tx_id, cash_collection_id,
        entry_type, amount, direction, description, reference_key, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, 'COMMISSION_DEDUCTED', ?, 'DEBIT', ?, ?, ?, ?)
    `).run(
      uid('led'),
      booking.technician_id,
      bookingId,
      paymentTxId,
      cashCollectionId,
      commAmount,
      `Servexa ${snapshot.platform_commission_percent}% commission on #${booking.booking_number}`,
      commRefKey,
      actorId,
      now
    );
  }

  if (isCompleted) {
    db.prepare(`
      INSERT INTO wallet_ledger (
        id, technician_id, booking_id, payment_tx_id, cash_collection_id,
        entry_type, amount, direction, description, reference_key, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, 'EARNING_AVAILABLE', ?, 'CREDIT', ?, ?, ?, ?)
    `).run(
      uid('led'),
      booking.technician_id,
      bookingId,
      paymentTxId,
      cashCollectionId,
      techEarnings,
      `Available technician earnings for completed booking #${booking.booking_number}`,
      availRefKey,
      actorId,
      now
    );
    return { credited: true, status: 'EARNING_AVAILABLE' };
  } else if (!existingPend) {
    db.prepare(`
      INSERT INTO wallet_ledger (
        id, technician_id, booking_id, payment_tx_id, cash_collection_id,
        entry_type, amount, direction, description, reference_key, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, 'EARNING_PENDING', ?, 'CREDIT', ?, ?, ?, ?)
    `).run(
      uid('led'),
      booking.technician_id,
      bookingId,
      paymentTxId,
      cashCollectionId,
      techEarnings,
      `Pending technician earnings for verified payment on #${booking.booking_number} (releases upon completion)`,
      pendRefKey,
      actorId,
      now
    );
    return { credited: true, status: 'EARNING_PENDING' };
  }

  return { credited: false, status: 'EARNING_PENDING' };
}

export function getAdminFinancialSummary(db: Database.Database): AdminFinancialSummary {
  const techRows = db.prepare('SELECT id FROM technicians').all() as Array<{ id: string }>;
  let totalTechnicianEarnings = 0;
  let pendingTechnicianEarnings = 0;
  let availableTechnicianEarnings = 0;
  let totalReservedBalance = 0;
  let totalWithdrawableBalance = 0;

  for (const t of techRows) {
    const w = getWalletSummary(db, t.id);
    totalTechnicianEarnings += w.totalEarnings;
    pendingTechnicianEarnings += w.pendingEarnings;
    availableTechnicianEarnings += w.availableBalance;
    totalReservedBalance += w.reservedBalance;
    totalWithdrawableBalance += w.withdrawableBalance;
  }

  const snapRevenueRow = db
    .prepare(
      `SELECT
        COALESCE(SUM(s.final_agreed_amount), 0) as total_rev
       FROM booking_price_snapshots s
       JOIN bookings b ON b.id = s.booking_id
       WHERE b.payment_status = 'PAID' OR b.status = 'COMPLETED'`
    )
    .get() as { total_rev: number };

  const ledgerCommRow = db
    .prepare("SELECT COALESCE(SUM(amount), 0) as total_comm FROM wallet_ledger WHERE entry_type = 'COMMISSION_DEDUCTED'")
    .get() as { total_comm: number };

  const wStats = db
    .prepare(
      `SELECT
        COUNT(*) as total_cnt,
        COALESCE(SUM(requested_amount), 0) as total_amt,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as comp_cnt,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN net_payout_amount ELSE 0 END), 0) as comp_amt,
        SUM(CASE WHEN status IN ('FAILED','REVERSED','REJECTED') THEN 1 ELSE 0 END) as fail_cnt,
        COALESCE(SUM(CASE WHEN status IN ('FAILED','REVERSED','REJECTED') THEN requested_amount ELSE 0 END), 0) as fail_amt,
        SUM(CASE WHEN status IN ('PENDING','UNDER_REVIEW','PROCESSING') THEN 1 ELSE 0 END) as pend_cnt,
        COALESCE(SUM(CASE WHEN status IN ('PENDING','UNDER_REVIEW','PROCESSING') THEN requested_amount ELSE 0 END), 0) as pend_amt
       FROM withdrawal_requests`
    )
    .get() as any;

  const onlineRow = db
    .prepare("SELECT COALESCE(SUM(amount - refunded_amount), 0) as online_total FROM payment_transactions WHERE status IN ('VERIFIED','REFUNDED') AND method != 'cash'")
    .get() as { online_total: number };

  const cashRow = db
    .prepare(
      `SELECT
        COALESCE(SUM(amount_collected), 0) as total_collected,
        COALESCE(SUM(CASE WHEN status IN ('CASH_PENDING','CASH_COLLECTED','DEPOSIT_SUBMITTED','VERIFICATION_PENDING','OVERDUE','REJECTED','DISPUTED') THEN amount_collected ELSE 0 END), 0) as pending_deposits,
        COALESCE(SUM(CASE WHEN status IN ('PAYMENT_VERIFIED','EARNINGS_CREDITED','COMMISSION_RECORDED') THEN amount_collected ELSE 0 END), 0) as verified_deposits,
        COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN amount_collected ELSE 0 END), 0) as overdue_deposits,
        COALESCE(SUM(CASE WHEN status IN ('CASH_PENDING','CASH_COLLECTED','DEPOSIT_SUBMITTED','VERIFICATION_PENDING','OVERDUE','REJECTED','DISPUTED') THEN commission_amount ELSE 0 END), 0) as comm_dues
       FROM cash_collections`
    )
    .get() as any;

  const refundRow = db.prepare('SELECT COALESCE(SUM(amount), 0) as ref_total FROM refund_transactions').get() as { ref_total: number };
  const adjRow = db
    .prepare("SELECT COALESCE(SUM(CASE WHEN direction='CREDIT' THEN amount ELSE -amount END), 0) as adj_net FROM financial_adjustments")
    .get() as { adj_net: number };

  return {
    totalPlatformRevenue: roundBDT(Number(snapRevenueRow?.total_rev || 0)),
    totalPlatformCommission: roundBDT(Number(ledgerCommRow?.total_comm || 0)),
    totalTechnicianEarnings: roundBDT(totalTechnicianEarnings),
    pendingTechnicianEarnings: roundBDT(pendingTechnicianEarnings),
    availableTechnicianEarnings: roundBDT(availableTechnicianEarnings),
    totalReservedBalance: roundBDT(totalReservedBalance),
    totalWithdrawableBalance: roundBDT(totalWithdrawableBalance),
    totalWithdrawalRequestsCount: Number(wStats?.total_cnt || 0),
    totalWithdrawalRequestedAmount: roundBDT(Number(wStats?.total_amt || 0)),
    completedWithdrawalsCount: Number(wStats?.comp_cnt || 0),
    completedWithdrawalsAmount: roundBDT(Number(wStats?.comp_amt || 0)),
    failedWithdrawalsCount: Number(wStats?.fail_cnt || 0),
    failedWithdrawalsAmount: roundBDT(Number(wStats?.fail_amt || 0)),
    pendingWithdrawalsCount: Number(wStats?.pend_cnt || 0),
    pendingWithdrawalsAmount: roundBDT(Number(wStats?.pend_amt || 0)),
    totalOnlineCollections: roundBDT(Number(onlineRow?.online_total || 0)),
    cashCollectedByTechnicians: roundBDT(Number(cashRow?.total_collected || 0)),
    cashPendingDeposits: roundBDT(Number(cashRow?.pending_deposits || 0)),
    verifiedCashDeposits: roundBDT(Number(cashRow?.verified_deposits || 0)),
    overdueCashDeposits: roundBDT(Number(cashRow?.overdue_deposits || 0)),
    outstandingCommissionDues: roundBDT(Number(cashRow?.comm_dues || 0)),
    totalRefundsAmount: roundBDT(Number(refundRow?.ref_total || 0)),
    totalAdjustmentsNet: roundBDT(Number(adjRow?.adj_net || 0)),
  };
}
