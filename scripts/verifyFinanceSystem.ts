import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type http from 'node:http';

// Must configure isolated test DB path BEFORE importing database/routes
const TEST_DB_PATH = path.join(os.tmpdir(), `servexa-finance-test-${process.pid}-${Date.now()}.db`);
process.env.SERVEXA_DB_PATH = TEST_DB_PATH;
process.env.PAYMENT_WEBHOOK_SECRET = 'servexa-test-webhook-secret-2026';

import express from 'express';
import { getDb, resetDbForTests } from '../server/db/database';
import { createFinanceRouter } from '../server/routes/financeRoutes';
import { computeWithdrawableBalance, getWalletSummary } from '../server/services/financeEngine';
import { computeWebhookSignature } from '../server/services/paymentAdapters';

let server: http.Server;
let baseUrl = '';

async function api<T = any>(
  method: string,
  route: string,
  body?: any,
  token?: string,
  extraHeaders?: Record<string, string>
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed: any = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // plain text / csv
  }
  return { status: res.status, data: parsed as T };
}

async function loginAs(userId: string): Promise<{ token: string; technicianId: string | null }> {
  const res = await api<{ token: string; user: { technicianId: string | null } }>('POST', '/api/auth/session', { userId });
  assert.equal(res.status, 200, `Login for ${userId} should succeed`);
  return { token: res.data.token, technicianId: res.data.user.technicianId };
}

async function runTests() {
  resetDbForTests();
  getDb(); // Initialize schema and seed data cleanly

  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', createFinanceRouter());

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  console.log(`Servexa Finance Verification running on ${baseUrl} (DB: ${TEST_DB_PATH})`);

  const admin = await loginAs('user-admin-demo');
  const tech1 = await loginAs('user-tech-1');
  const tech2 = await loginAs('user-tech-2');
  const cust = await loginAs('user-cust-demo');

  // =========================================================================
  // TEST A: Admin Rules & Pricing Governance (min <= default <= max, commission=100%, audit logs)
  // =========================================================================
  {
    const rulesRes = await api('GET', '/api/admin/rules', undefined, admin.token);
    assert.equal(rulesRes.status, 200);
    const rules = rulesRes.data.rules;

    // Invalid commission split (sum != 100%)
    const badRules = structuredClone(rules);
    badRules.commission.defaultPlatformCommissionPercent = 15;
    badRules.commission.defaultTechnicianEarningsPercent = 90;
    const badCommRes = await api('PUT', '/api/admin/rules', { rules: badRules, reason: 'Invalid split test', confirmSensitive: true }, admin.token);
    assert.equal(badCommRes.status, 400, 'Commission split != 100% must fail with 400');

    // Sensitive change without confirmSensitive=true
    const unconfirmedRules = structuredClone(rules);
    unconfirmedRules.commission.defaultPlatformCommissionPercent = 12;
    unconfirmedRules.commission.defaultTechnicianEarningsPercent = 88;
    const noConfirmRes = await api('PUT', '/api/admin/rules', { rules: unconfirmedRules, reason: 'Missing confirmation' }, admin.token);
    assert.equal(noConfirmRes.status, 400, 'Sensitive rule change without confirmSensitive must require confirmation');

    // Valid pricing rule bounds rejection: min > default
    const invalidSub = await api('PUT', '/api/admin/pricing-rules/pr-sub-fan-repair', {
      defaultPrice: 300,
      minPrice: 500,
      maxPrice: 600,
    }, admin.token);
    assert.equal(invalidSub.status, 400, 'Invalid rule bounds min > default must return 400');

    // Valid rule update creates version & audit log
    const validSub = await api('PUT', '/api/admin/pricing-rules/pr-sub-fan-repair', {
      defaultPrice: 400,
      minPrice: 300,
      maxPrice: 700,
      requiresPriceApproval: false,
    }, admin.token);
    assert.equal(validSub.status, 200);

    const logsRes = await api('GET', '/api/admin/audit-logs?search=UPDATE_PRICING_RULE', undefined, admin.token);
    assert.equal(logsRes.status, 200);
    assert.ok(logsRes.data.logs.length >= 1, 'Admin audit log must record rule update');
    console.log('✓ Test A passed: Admin rules, bounds, commission=100%, confirmation & audit logs');
  }

  // =========================================================================
  // TEST B: Technician Service Selection, Bounded Pricing & Admin Approval Queue
  // =========================================================================
  let tech1FridgeSvcId = '';
  {
    const selectRes = await api('POST', '/api/technician/services/select', { subcategoryId: 'sub-fridge-repair' }, tech1.token);
    assert.equal(selectRes.status, 201);
    tech1FridgeSvcId = selectRes.data.id;

    // Out-of-bounds update fails cleanly (minPrice=400, maxPrice=1600 for sub-fridge-repair)
    const tooHighRes = await api('PUT', `/api/technician/services/${tech1FridgeSvcId}`, { price: 5000 }, tech1.token);
    assert.equal(tooHighRes.status, 400, 'Out-of-range technician price must return 400');

    // Within bounds immediately becomes CUSTOMIZED_PRICE
    const validEdit = await api('PUT', `/api/technician/services/${tech1FridgeSvcId}`, { price: 750 }, tech1.token);
    assert.equal(validEdit.status, 200);
    assert.equal(validEdit.data.status, 'CUSTOMIZED_PRICE');

    // Require admin approval for sub-fridge-repair -> submit pending -> reject -> approve
    await api('PUT', '/api/admin/pricing-rules/pr-sub-fridge-repair', { requiresPriceApproval: true }, admin.token);

    const pendingEdit = await api('PUT', `/api/technician/services/${tech1FridgeSvcId}`, { price: 950 }, tech1.token);
    assert.equal(pendingEdit.status, 200);
    assert.equal(pendingEdit.data.status, 'PENDING_APPROVAL');

    // Reject keeps approvedPrice = 750
    const rejectRes = await api('POST', `/api/admin/technician-pricing/${tech1FridgeSvcId}/review`, {
      decision: 'REJECT',
      reason: 'Exceeds local market expectation',
    }, admin.token);
    assert.equal(rejectRes.status, 200);

    const svcsAfterReject = await api('GET', '/api/technician/services', undefined, tech1.token);
    const rejectedSvc = svcsAfterReject.data.services.find((s: any) => s.id === tech1FridgeSvcId);
    assert.equal(rejectedSvc.approvedPrice, 750, 'Rejected edit must keep previous approved price');
    assert.equal(rejectedSvc.status, 'REJECTED');

    // Re-submit & Approve updates approvedPrice = 900
    const pendingEdit2 = await api('PUT', `/api/technician/services/${tech1FridgeSvcId}`, { price: 900 }, tech1.token);
    assert.equal(pendingEdit2.status, 200);
    assert.equal(pendingEdit2.data.status, 'PENDING_APPROVAL');

    const approveRes = await api('POST', `/api/admin/technician-pricing/${tech1FridgeSvcId}/review`, {
      decision: 'APPROVE',
      reason: 'Verified specialist rate',
    }, admin.token);
    assert.equal(approveRes.status, 200);

    const svcsAfterApprove = await api('GET', '/api/technician/services', undefined, tech1.token);
    const approvedSvc = svcsAfterApprove.data.services.find((s: any) => s.id === tech1FridgeSvcId);
    assert.equal(approvedSvc.approvedPrice, 900);
    assert.equal(approvedSvc.status, 'APPROVED');
    assert.ok(svcsAfterApprove.data.history.length >= 3, 'Technician price history should be recorded');

    console.log('✓ Test B passed: Technician service selection, min-max bounds, Admin approval/rejection & history');
  }

  // =========================================================================
  // TEST C & D: Quotes, Immutable Snapshots, Extra Charges, 90/10 Commission & Non-Commissionable Parts
  // =========================================================================
  let bookingSnapshotTestId = '';
  {
    // Reset sub-fan-repair technician price to exactly 1000 so commission math = exact ৳900 tech / ৳100 Servexa!
    // Expand fan repair max to 1200 temporarily, update tech1 price to 1000 & visitingFee 0
    await api('PUT', '/api/admin/pricing-rules/pr-sub-fan-repair', {
      defaultPrice: 1000,
      minPrice: 300,
      maxPrice: 1500,
      visitingFee: 0,
      minVisitingFee: 0,
      maxVisitingFee: 500,
      requiresPriceApproval: false,
    }, admin.token);
    await api('PUT', '/api/technician/services/ts-tech-1-sub-fan-repair', { price: 1000, visitingFee: 0 }, tech1.token);

    // Get pre-booking quote
    const quoteRes = await api('POST', '/api/pricing/quote', {
      categoryId: 'electrical',
      subcategoryId: 'sub-fan-repair',
      technicianId: 'tech-1',
    });
    assert.equal(quoteRes.status, 200);
    assert.equal(quoteRes.data.quote.servicePrice, 1000);
    assert.equal(quoteRes.data.quote.estimatedPlatformCommission, 100, '10% of 1000 = 100');
    assert.equal(quoteRes.data.quote.estimatedTechnicianEarnings, 900, '90% of 1000 = 900');

    // Create booking (client tries to tamper price: 1 -> server MUST ignore!)
    const bookRes = await api('POST', '/api/bookings', {
      categoryId: 'electrical',
      subcategoryId: 'sub-fan-repair',
      technicianId: 'tech-1',
      paymentMethod: 'bkash',
      problemDescription: 'Ceiling fan bearing & capacitor replacement',
      estimatedTotalMin: 1,
      estimatedTotalMax: 1,
      finalTotal: 1,
    }, cust.token);
    assert.equal(bookRes.status, 201);
    bookingSnapshotTestId = bookRes.data.booking.id;
    assert.equal(bookRes.data.booking.finalTotal, 1000, 'Tampered client total must be ignored');

    // Now Admin updates pricing rule AFTER booking confirmed!
    await api('PUT', '/api/admin/pricing-rules/pr-sub-fan-repair', {
      defaultPrice: 600,
      minPrice: 300,
      maxPrice: 1500,
    }, admin.token);

    // Existing booking snapshot MUST remain immutable at 1000!
    const snapResBefore = await api('GET', `/api/bookings/${bookingSnapshotTestId}/snapshot`, undefined, cust.token);
    assert.equal(snapResBefore.status, 200);
    assert.equal(snapResBefore.data.snapshot.finalAgreedAmount, 1000, 'Snapshot must stay immutable despite later Admin rule changes');

    // Tech submits non-commissionable PARTS_MATERIAL without receipt note > 300 -> must fail!
    const noReceiptRes = await api('POST', `/api/bookings/${bookingSnapshotTestId}/extra-charges`, {
      chargeType: 'PARTS_MATERIAL',
      reason: 'Original ball bearing & capacitor',
      amount: 400,
    }, tech1.token);
    assert.equal(noReceiptRes.status, 400, 'Material > 300 without receiptNote must fail');

    // Tech submits charge 1 (EXTRA_WORK ৳200) -> Customer REJECTS
    const chg1Res = await api('POST', `/api/bookings/${bookingSnapshotTestId}/extra-charges`, {
      chargeType: 'EXTRA_WORK',
      reason: 'Ladder wall mounting rework',
      amount: 200,
    }, tech1.token);
    assert.equal(chg1Res.status, 201);

    const rejChg = await api('POST', `/api/bookings/${bookingSnapshotTestId}/extra-charges/${chg1Res.data.id}/respond`, {
      decision: 'REJECT',
    }, cust.token);
    assert.equal(rejChg.status, 200);
    assert.equal(rejChg.data.status, 'REJECTED');

    const snapAfterRej = await api('GET', `/api/bookings/${bookingSnapshotTestId}/snapshot`, undefined, cust.token);
    assert.equal(snapAfterRej.data.snapshot.finalAgreedAmount, 1000, 'Rejected charge must not alter snapshot total');

    // Tech submits charge 2 (PARTS_MATERIAL ৳400 with receipt) -> Customer APPROVES
    // Since PARTS_MATERIAL is non-commissionable by policy, finalAgreedAmount = 1400,
    // platformCommissionAmount MUST still be 100, and technicianEarningsAmount = 900 + 400 = 1300!
    const chg2Res = await api('POST', `/api/bookings/${bookingSnapshotTestId}/extra-charges`, {
      chargeType: 'PARTS_MATERIAL',
      reason: 'SKF bearings & capacitor',
      amount: 400,
      receiptNote: 'Bismillah Electric Hardware Memo #442',
    }, tech1.token);
    assert.equal(chg2Res.status, 201);

    const appChg = await api('POST', `/api/bookings/${bookingSnapshotTestId}/extra-charges/${chg2Res.data.id}/respond`, {
      decision: 'APPROVE',
    }, cust.token);
    assert.equal(appChg.status, 200);
    assert.equal(appChg.data.snapshot.finalAgreedAmount, 1400);
    assert.equal(appChg.data.snapshot.platformCommissionAmount, 100, 'Non-commissionable material must not inflate platform commission');
    assert.equal(appChg.data.snapshot.technicianEarningsAmount, 1300, 'Technician receives 900 + 400 pass-through material');

    console.log('✓ Test C & D passed: Quote, immutable snapshot, customer extra charge approve/reject & 90/10 non-commissionable split');
  }

  // =========================================================================
  // TEST F: Online Payment Adapter Honesty, Signed HMAC Webhook Verification, Idempotency & Refund Clawback
  // =========================================================================
  {
    const initRes = await api('POST', '/api/payments/initiate', {
      bookingId: bookingSnapshotTestId,
      method: 'bkash',
      idempotencyKey: `idem-${bookingSnapshotTestId}`,
    }, cust.token);
    assert.equal(initRes.status, 201);
    assert.equal(initRes.data.configured, false, 'Unconfigured bKash env vars must honestly report configured=false');
    assert.equal(initRes.data.mode, 'UNCONFIGURED_ADAPTER');
    assert.ok(Array.isArray(initRes.data.missingEnvVars) && initRes.data.missingEnvVars.includes('BKASH_APP_KEY'));

    const txId = initRes.data.transaction.id;

    // Forged webhook signature must fail 401
    const badWebhookPayload = { txId, webhookEventId: 'evt-forged-1', status: 'VERIFIED', amount: 1400 };
    const forgedRes = await api('POST', '/api/payments/verify-webhook', badWebhookPayload, undefined, {
      'x-servexa-signature': '0000000000000000000000000000000000000000000000000000000000000000',
    });
    assert.equal(forgedRes.status, 401, 'Forged HMAC webhook signature must be rejected with 401');

    // First valid signed webhook verifies payment cleanly
    // Mark booking COMPLETED first so verification posts EARNING_AVAILABLE immediately
    await api('PATCH', `/api/bookings/${bookingSnapshotTestId}/status`, { status: 'COMPLETED' }, tech1.token);

    const db = getDb();
    const availBeforeVerify = getWalletSummary(db, 'tech-1').availableBalance;

    const validPayload = {
      txId,
      webhookEventId: `evt-valid-${txId}`,
      providerTxId: 'BK-REAL-99182',
      status: 'VERIFIED',
      amount: 1400,
    };
    const validSig = computeWebhookSignature(JSON.stringify(validPayload));
    const verifyRes = await api('POST', '/api/payments/verify-webhook', validPayload, undefined, {
      'x-servexa-signature': validSig,
    });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.data.status, 'VERIFIED');

    const availAfterVerify = getWalletSummary(db, 'tech-1').availableBalance;
    assert.equal(availAfterVerify - availBeforeVerify, 1300, 'Verified booking should credit +1300 to technician available balance');

    // Duplicate webhook replay must NOT double-credit!
    const dupRes = await api('POST', '/api/payments/verify-webhook', validPayload, undefined, {
      'x-servexa-signature': validSig,
    });
    assert.equal(dupRes.status, 200);
    assert.equal(dupRes.data.deduplicated, true);
    assert.equal(getWalletSummary(db, 'tech-1').availableBalance, availAfterVerify, 'Duplicate webhook must not double-credit');

    // Test partial refund clawback (৳700 refund = 50% -> claws back ৳650 from tech)
    const refundRes = await api('POST', `/api/admin/payments/${txId}/refund`, {
      amount: 700,
      reason: 'Customer agreed 50% partial dispute settlement',
    }, admin.token);
    assert.equal(refundRes.status, 200);
    assert.equal(getWalletSummary(db, 'tech-1').availableBalance, availAfterVerify - 650, 'Partial refund must debit proportional tech earnings');

    console.log('✓ Test F passed: Honest UNCONFIGURED_ADAPTER, HMAC webhook security, idempotent credit & refund clawback');
  }

  // =========================================================================
  // TEST E & H: Minimum Reserve (৳500), Exact Formula Scenarios, Atomic Concurrency & Withdrawal Lifecycle
  // =========================================================================
  {
    // Exact mathematical reserve check:
    assert.equal(computeWithdrawableBalance(300, 500), 0);
    assert.equal(computeWithdrawableBalance(500, 500), 0);
    assert.equal(computeWithdrawableBalance(800, 500), 300);
    assert.equal(computeWithdrawableBalance(1500, 500), 1000);
    assert.equal(computeWithdrawableBalance(3000, 500), 2500);

    // Create a clean wallet scenario for tech-2 via ledger adjustment so tech-2 has exact ৳800 available
    const db = getDb();
    const curTech2 = getWalletSummary(db, 'tech-2').availableBalance; // seeded 715
    const diff = 800 - curTech2;
    db.prepare(`
      INSERT INTO wallet_ledger (id, technician_id, entry_type, amount, direction, description, reference_key, created_by, created_at)
      VALUES (?, 'tech-2', 'ADJUSTMENT_CREDIT', ?, 'CREDIT', 'Test balance alignment to ৳800', ?, 'TEST_SUITE', ?)
    `).run(`led-test-align-${Date.now()}`, diff, `ALIGN_${Date.now()}`, new Date().toISOString());

    const w2Before = getWalletSummary(db, 'tech-2');
    assert.equal(w2Before.availableBalance, 800);
    assert.equal(w2Before.reservedBalance, 500);
    assert.equal(w2Before.withdrawableBalance, 300);

    // Lower minimumWithdrawalAmount temporarily from 500 -> 100 to verify exact ৳300 concurrency case cleanly!
    const rulesNow = (await api('GET', '/api/admin/rules', undefined, admin.token)).data.rules;
    rulesNow.walletAndReserve.minimumWithdrawalAmount = 100;
    await api('PUT', '/api/admin/rules', { rules: rulesNow, reason: 'Allow ৳300 withdrawal test', confirmSensitive: true }, admin.token);

    // Unverified payout account rejection test
    const unverifiedAcctRes = await api('POST', '/api/wallet/payout-accounts', {
      provider: 'nagad',
      accountTitle: 'Tech Two Account',
      accountNumber: '01811223344',
    }, tech2.token);
    assert.equal(unverifiedAcctRes.status, 201);
    const tech2AcctId = unverifiedAcctRes.data.id;

    const failUnverified = await api('POST', '/api/wallet/withdraw', {
      payoutAccountId: tech2AcctId,
      amount: 300,
    }, tech2.token);
    assert.equal(failUnverified.status, 400, 'Withdrawal to unverified payout account must be rejected');

    // Admin verifies payout account
    await api('POST', `/api/admin/payout-accounts/${tech2AcctId}/verify`, { status: 'VERIFIED', note: 'KYC matched' }, admin.token);

    // Exceeding withdrawable (requesting ৳350 when max withdrawable is ৳300) must fail
    const overReserve = await api('POST', '/api/wallet/withdraw', {
      payoutAccountId: tech2AcctId,
      amount: 350,
    }, tech2.token);
    assert.equal(overReserve.status, 400, 'Request dipping into ৳500 minimum reserve must be rejected');

    // Concurrency test: fire two parallel ৳300 withdrawals against ৳800 balance (reserve = ৳500)!
    // Only ONE can succeed; the other MUST fail with 400!
    const [r1, r2] = await Promise.all([
      api('POST', '/api/wallet/withdraw', { payoutAccountId: tech2AcctId, amount: 300, idempotencyKey: `conc-1-${Date.now()}` }, tech2.token),
      api('POST', '/api/wallet/withdraw', { payoutAccountId: tech2AcctId, amount: 300, idempotencyKey: `conc-2-${Date.now()}` }, tech2.token),
    ]);
    const statuses = [r1.status, r2.status].sort();
    assert.deepEqual(statuses, [201, 400], 'Concurrent double-withdrawal must allow exactly one 201 and reject the second with 400');

    const winner = r1.status === 201 ? r1.data.withdrawal : r2.data.withdrawal;
    const w2AfterHold = getWalletSummary(db, 'tech-2');
    assert.equal(w2AfterHold.availableBalance, 500, 'Available balance must drop to exact reserve ৳500');
    assert.equal(w2AfterHold.withdrawableBalance, 0, 'Withdrawable balance must be ৳0');

    // Admin marks withdrawal FAIL -> atomically restores ৳300 back to available balance!
    const failWdrRes = await api('POST', `/api/admin/withdrawals/${winner.id}/action`, {
      action: 'FAIL',
      note: 'bKash B2C timeout test',
    }, admin.token);
    assert.equal(failWdrRes.status, 200);
    assert.equal(getWalletSummary(db, 'tech-2').availableBalance, 800, 'Failed withdrawal must atomically restore reserve');

    // New withdrawal ৳200 -> Admin completes with providerReference
    const wdr2Res = await api('POST', '/api/wallet/withdraw', {
      payoutAccountId: tech2AcctId,
      amount: 200,
      idempotencyKey: `comp-${Date.now()}`,
    }, tech2.token);
    assert.equal(wdr2Res.status, 201);
    const wdr2Id = wdr2Res.data.withdrawal.id;

    // Missing providerReference must fail
    const noRefComp = await api('POST', `/api/admin/withdrawals/${wdr2Id}/action`, { action: 'COMPLETE' }, admin.token);
    assert.equal(noRefComp.status, 400, 'COMPLETE without providerReference must fail');

    const compRes = await api('POST', `/api/admin/withdrawals/${wdr2Id}/action`, {
      action: 'COMPLETE',
      providerReference: 'NGD-B2C-88412',
      note: 'Disbursed successfully',
    }, admin.token);
    assert.equal(compRes.status, 200);
    assert.equal(getWalletSummary(db, 'tech-2').totalWithdrawn, 200);
    assert.equal(getWalletSummary(db, 'tech-2').availableBalance, 600);

    console.log('✓ Test E & H passed: Minimum ৳500 reserve math, concurrency protection, payout KYC & withdrawal lifecycle');
  }

  // =========================================================================
  // TEST G: Cash on Completion -> Merchant Deposit Reconciliation, Overdue Booking Restriction & Recovery
  // =========================================================================
  {
    const cashBookRes = await api('POST', '/api/bookings', {
      categoryId: 'electrical',
      subcategoryId: 'sub-fan-repair',
      technicianId: 'tech-2',
      paymentMethod: 'cash',
      problemDescription: 'Cash collection workflow test booking',
    }, cust.token);
    assert.equal(cashBookRes.status, 201);
    const cashBookId = cashBookRes.data.booking.id;

    // Tech-2 collects cash on completion
    const collectRes = await api('POST', '/api/cash/collect', { bookingId: cashBookId }, tech2.token);
    assert.equal(collectRes.status, 201);
    const cc = collectRes.data.cashCollection;
    assert.equal(cc.status, 'CASH_PENDING');

    // Simulate overdue evaluation far in the future (+100 hours past deadline & grace)
    const futureIso = new Date(Date.now() + 100 * 3600_000).toISOString();
    const overdueRes = await api('POST', '/api/admin/cash/check-overdue', {
      asOf: futureIso,
      applyRestrictionAfterReview: true,
    }, admin.token);
    assert.equal(overdueRes.status, 200);
    assert.ok(overdueRes.data.restrictedTechs.includes('tech-2'), 'Tech-2 should be marked booking-restricted when overdue past grace');

    // Customer attempting a NEW booking with restricted tech-2 must be blocked with 403!
    const blockedBook = await api('POST', '/api/bookings', {
      categoryId: 'electrical',
      subcategoryId: 'sub-fan-repair',
      technicianId: 'tech-2',
      paymentMethod: 'bkash',
    }, cust.token);
    assert.equal(blockedBook.status, 403);
    assert.equal((blockedBook.data as any).code, 'TECHNICIAN_BOOKING_RESTRICTED');

    // Wrong technician submitting deposit for cc must fail 403
    const wrongTechDep = await api('POST', '/api/cash/submit-deposit', {
      cashCollectionId: cc.id,
      channel: 'bkash_merchant',
      depositReference: 'TRX_WRONG_TECH_01',
      amountDeposited: cc.amount_collected,
    }, tech1.token);
    assert.equal(wrongTechDep.status, 403);

    // Wrong deposit amount (< full collected cash) must fail 400
    const shortDep = await api('POST', '/api/cash/submit-deposit', {
      cashCollectionId: cc.id,
      channel: 'bkash_merchant',
      depositReference: 'TRX_SHORT_999',
      amountDeposited: 100,
    }, tech2.token);
    assert.equal(shortDep.status, 400);

    // Valid full deposit submission succeeds
    const validDep = await api('POST', '/api/cash/submit-deposit', {
      cashCollectionId: cc.id,
      channel: 'bkash_merchant',
      depositReference: 'BKM_2026_DEP_7711',
      amountDeposited: cc.amount_collected,
    }, tech2.token);
    assert.equal(validDep.status, 201);
    const depId = validDep.data.deposit.id;

    // Duplicate deposit reference replay must fail 409!
    const dupRef = await api('POST', '/api/cash/submit-deposit', {
      cashCollectionId: cc.id,
      channel: 'bkash_merchant',
      depositReference: 'BKM_2026_DEP_7711',
      amountDeposited: cc.amount_collected,
    }, tech2.token);
    assert.equal(dupRef.status, 409, 'Duplicate deposit reference must return 409 Conflict');

    // Admin verifies deposit -> credits 90/10 ledger & removes overdue booking restriction!
    const verifyDep = await api('POST', `/api/admin/cash/${depId}/verify`, {
      decision: 'APPROVE',
      reason: 'Matched bKash merchant statement',
    }, admin.token);
    assert.equal(verifyDep.status, 200);

    // Tech-2 should now be unrestricted and able to receive new bookings!
    const unblockedBook = await api('POST', '/api/bookings', {
      categoryId: 'electrical',
      subcategoryId: 'sub-fan-repair',
      technicianId: 'tech-2',
      paymentMethod: 'bkash',
    }, cust.token);
    assert.equal(unblockedBook.status, 201, 'Clearing overdue deposit should restore technician booking acceptance');

    console.log('✓ Test G passed: Cash collection, overdue restriction, duplicate ref block, reconciliation & recovery');
  }

  // =========================================================================
  // TEST I: RBAC, Unauthenticated Denial & Cross-User Authorization
  // =========================================================================
  {
    const noAuth = await api('GET', '/api/admin/finance/overview');
    assert.equal(noAuth.status, 401);

    const custAdminAccess = await api('GET', '/api/admin/finance/overview', undefined, cust.token);
    assert.equal(custAdminAccess.status, 403);

    const techAdminAccess = await api('PUT', '/api/admin/rules', {}, tech1.token);
    assert.equal(techAdminAccess.status, 403);

    // Tech-2 cannot edit Tech-1 service pricing
    const crossTechEdit = await api('PUT', `/api/technician/services/${tech1FridgeSvcId}`, { price: 800 }, tech2.token);
    assert.equal(crossTechEdit.status, 403);

    // CSV ledger export succeeds for Admin
    const csvRes = await api<string>('GET', '/api/admin/finance/export', undefined, admin.token);
    assert.equal(csvRes.status, 200);
    assert.ok(typeof csvRes.data === 'string' && csvRes.data.includes('Booking Number'), 'CSV export must return tabular ledger');

    console.log('✓ Test I passed: Strict RBAC, unauthenticated denial, cross-user guards & CSV export');
  }

  console.log('\nALL SERVEXA FINANCE & GOVERNANCE TESTS (A–I) PASSED SUCCESSFULLY!');
}

runTests()
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err);
    process.exitCode = 1;
  })
  .finally(() => {
    if (server) server.close();
    resetDbForTests();
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        if (fs.existsSync(`${TEST_DB_PATH}${suffix}`)) {
          fs.unlinkSync(`${TEST_DB_PATH}${suffix}`);
        }
      } catch {
        // ignore cleanup warnings
      }
    }
  });
