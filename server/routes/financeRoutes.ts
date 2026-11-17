import express from 'express';
import { getDb } from '../db/database';
import {
  calculateCommissionSplit,
  computePriceBreakdownFromServer,
  getAdminFinancialSummary,
  getWalletSummary,
  loadPlatformRules,
  postBookingEarningsAndCommission,
  recalculateSnapshotWithApprovedExtras,
  roundBDT,
  uid,
  validateCommissionPercentages,
} from '../services/financeEngine';
import {
  getPaymentProviderStatuses,
  getWebhookSecret,
  initiateOnlinePaymentWithProvider,
  validateDepositReferenceFormat,
  verifyWebhookSignature,
} from '../services/paymentAdapters';
import {
  AuthenticatedRequest,
  rateLimit,
  requireAuth,
  requireRole,
  signSessionToken,
} from '../middleware/auth';
import type {
  PlatformRules,
  PayoutProvider,
  PaymentMethodCode,
  PricingRule,
} from '../../src/types/finance';

export function createFinanceRouter(): express.Router {
  const router = express.Router();

  // =========================================================================
  // 1. AUTHENTICATION & SESSION BOOTSTRAP (HMAC-SIGNED SERVER TOKENS)
  // =========================================================================
  router.post('/auth/session', (req, res) => {
    try {
      const db = getDb();
      const { userId, email, role, name, phone, avatar } = req.body || {};
      if (!userId && !email) {
        return res.status(400).json({ error: 'userId or email is required.' });
      }

      let userRow: any = null;
      if (userId) {
        userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(String(userId));
      }
      if (!userRow && email) {
        userRow = db
          .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
          .get(String(email).trim());
      }

      if (!userRow) {
        // Safely upsert newly registered frontend user into SQLite users table
        const cleanRole = ['CUSTOMER', 'TECHNICIAN', 'ADMIN'].includes(role) ? role : 'CUSTOMER';
        // Never allow arbitrary self-escalation to ADMIN if email isn't admin@servexa.demo
        if (cleanRole === 'ADMIN' && String(email || '').toLowerCase() !== 'admin@servexa.demo') {
          return res.status(403).json({ error: 'Cannot create arbitrary ADMIN account via public session endpoint.' });
        }
        const newId = String(userId || uid('user'));
        const cleanEmail = String(email || `${newId}@servexa.local`).toLowerCase().trim();
        const now = new Date().toISOString();
        db.prepare(`
          INSERT OR IGNORE INTO users (id, name, email, phone, role, avatar, phone_verified, nid_verified, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?)
        `).run(newId, String(name || 'User'), cleanEmail, String(phone || '01700-000000'), cleanRole, String(avatar || ''), now);

        if (cleanRole === 'TECHNICIAN') {
          const existingTech = db.prepare('SELECT id FROM technicians WHERE user_id = ?').get(newId);
          if (!existingTech) {
            const techId = `tech-${Date.now()}`;
            db.prepare(`
              INSERT INTO technicians (id, user_id, name, email, phone, avatar, skill_verified, platform_verified, nid_verified, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
            `).run(techId, newId, String(name || 'Technician'), cleanEmail, String(phone || '01700-000000'), String(avatar || ''), now);
            db.prepare('INSERT OR IGNORE INTO wallets (technician_id, updated_at) VALUES (?, ?)').run(techId, now);
          }
        }
        userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(newId);
      }

      const techRow = db.prepare('SELECT id FROM technicians WHERE user_id = ?').get(userRow.id) as { id: string } | undefined;
      const token = signSessionToken({
        sub: userRow.id,
        role: userRow.role,
        techId: techRow?.id || null,
        name: userRow.name,
      });

      return res.json({
        token,
        user: {
          id: userRow.id,
          name: userRow.name,
          email: userRow.email,
          phone: userRow.phone,
          role: userRow.role,
          technicianId: techRow?.id || null,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to establish session.' });
    }
  });

  // =========================================================================
  // 2. ADMIN RULES & REGULATIONS MANAGEMENT
  // =========================================================================
  router.get('/rules/public', (_req, res) => {
    try {
      const db = getDb();
      const rules = loadPlatformRules(db);
      return res.json({
        version: rules.version,
        general: rules.general,
        commission: {
          defaultPlatformCommissionPercent: rules.commission.defaultPlatformCommissionPercent,
          defaultTechnicianEarningsPercent: rules.commission.defaultTechnicianEarningsPercent,
          commissionableItems: rules.commission.commissionableItems,
          discountPolicy: rules.commission.discountPolicy,
        },
        visitingAndAdditional: rules.visitingAndAdditional,
        materialPolicy: rules.materialPolicy,
        walletAndReserve: rules.walletAndReserve,
        withdrawal: rules.withdrawal,
        cashOnCompletion: {
          depositDeadlineHours: rules.cashOnCompletion.depositDeadlineHours,
          gracePeriodHours: rules.cashOnCompletion.gracePeriodHours,
          approvedDepositChannels: rules.cashOnCompletion.approvedDepositChannels,
        },
        bookingAndCancellation: rules.bookingAndCancellation,
        discountAndPromo: rules.discountAndPromo,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to load public rules.' });
    }
  });

  router.get('/admin/rules', requireAuth, requireRole('ADMIN'), (_req, res) => {
    try {
      const db = getDb();
      const rules = loadPlatformRules(db);
      const versions = db
        .prepare('SELECT id, version, changed_by as changedBy, summary, created_at as createdAt FROM rule_versions ORDER BY version DESC LIMIT 30')
        .all();
      const providers = getPaymentProviderStatuses();
      return res.json({ rules, versions, providers });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to load admin rules.' });
    }
  });

  router.put('/admin/rules', requireAuth, requireRole('ADMIN'), rateLimit(30, 60_000), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { rules: incoming, reason, confirmSensitive } = req.body || {};
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'Valid rules object is required.' });
      }

      const previous = loadPlatformRules(db);
      const next: PlatformRules = {
        ...previous,
        ...incoming,
        general: { ...previous.general, ...(incoming.general || {}) },
        commission: { ...previous.commission, ...(incoming.commission || {}) },
        customizationPermissions: { ...previous.customizationPermissions, ...(incoming.customizationPermissions || {}) },
        visitingAndAdditional: { ...previous.visitingAndAdditional, ...(incoming.visitingAndAdditional || {}) },
        materialPolicy: { ...previous.materialPolicy, ...(incoming.materialPolicy || {}) },
        walletAndReserve: { ...previous.walletAndReserve, ...(incoming.walletAndReserve || {}) },
        withdrawal: { ...previous.withdrawal, ...(incoming.withdrawal || {}) },
        onlinePayment: { ...previous.onlinePayment, ...(incoming.onlinePayment || {}) },
        cashOnCompletion: { ...previous.cashOnCompletion, ...(incoming.cashOnCompletion || {}) },
        bookingAndCancellation: { ...previous.bookingAndCancellation, ...(incoming.bookingAndCancellation || {}) },
        refundAndDispute: { ...previous.refundAndDispute, ...(incoming.refundAndDispute || {}) },
        discountAndPromo: { ...previous.discountAndPromo, ...(incoming.discountAndPromo || {}) },
      };

      // Strict percentage & financial bounds validation
      validateCommissionPercentages(
        Number(next.commission.defaultPlatformCommissionPercent),
        Number(next.commission.defaultTechnicianEarningsPercent)
      );

      if (next.walletAndReserve.globalMinimumReserveBalance < 0) {
        return res.status(400).json({ error: 'Minimum reserve balance cannot be negative.' });
      }
      if (
        next.walletAndReserve.minimumWithdrawalAmount <= 0 ||
        next.walletAndReserve.maximumWithdrawalAmount < next.walletAndReserve.minimumWithdrawalAmount
      ) {
        return res.status(400).json({ error: 'Invalid withdrawal min/max thresholds.' });
      }
      if (next.visitingAndAdditional.minVisitingFee > next.visitingAndAdditional.maxVisitingFee) {
        return res.status(400).json({ error: 'Minimum visiting fee cannot exceed maximum visiting fee.' });
      }
      if (next.cashOnCompletion.depositDeadlineHours < 1 || next.cashOnCompletion.gracePeriodHours < 0) {
        return res.status(400).json({ error: 'Invalid cash deposit deadline or grace period.' });
      }

      const sensitiveChanged =
        previous.commission.defaultPlatformCommissionPercent !== next.commission.defaultPlatformCommissionPercent ||
        previous.walletAndReserve.globalMinimumReserveBalance !== next.walletAndReserve.globalMinimumReserveBalance ||
        previous.walletAndReserve.minimumWithdrawalAmount !== next.walletAndReserve.minimumWithdrawalAmount ||
        previous.general.allowCashOnCompletion !== next.general.allowCashOnCompletion ||
        JSON.stringify(previous.general.activePaymentMethods) !== JSON.stringify(next.general.activePaymentMethods);

      if (sensitiveChanged && confirmSensitive !== true) {
        return res.status(400).json({
          error: 'Confirmation required: sensitive financial policy changes require confirmSensitive=true.',
          requiresConfirmation: true,
        });
      }

      const now = new Date().toISOString();
      const newVersion = previous.version + 1;
      next.version = newVersion;
      next.updatedAt = now;
      next.updatedBy = req.auth!.sub;

      db.transaction(() => {
        db.prepare('UPDATE platform_rules SET version = ?, rules_json = ?, updated_at = ?, updated_by = ? WHERE id = 1').run(
          newVersion,
          JSON.stringify(next),
          now,
          req.auth!.sub
        );

        db.prepare(
          'INSERT INTO rule_versions (id, version, changed_by, summary, rules_json, created_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          uid('rv'),
          newVersion,
          req.auth!.sub,
          String(reason || `Admin updated rules to v${newVersion}`),
          JSON.stringify(next),
          now
        );

        db.prepare(`
          INSERT INTO admin_audit_logs (id, admin_id, admin_name, section, action, target_id, previous_value, new_value, reason, rule_version, created_at)
          VALUES (?, ?, ?, 'PLATFORM_RULES', 'UPDATE_RULES', '1', ?, ?, ?, ?, ?)
        `).run(
          uid('aud'),
          req.auth!.sub,
          req.auth!.name,
          JSON.stringify({
            commission: previous.commission.defaultPlatformCommissionPercent,
            reserve: previous.walletAndReserve.globalMinimumReserveBalance,
            minWithdraw: previous.walletAndReserve.minimumWithdrawalAmount,
            allowCustomization: previous.general.allowPriceCustomization,
          }),
          JSON.stringify({
            commission: next.commission.defaultPlatformCommissionPercent,
            reserve: next.walletAndReserve.globalMinimumReserveBalance,
            minWithdraw: next.walletAndReserve.minimumWithdrawalAmount,
            allowCustomization: next.general.allowPriceCustomization,
          }),
          String(reason || 'Admin rule update'),
          newVersion,
          now
        );
      })();

      return res.json({ rules: next });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to update rules.' });
    }
  });

  router.get('/admin/audit-logs', requireAuth, requireRole('ADMIN'), (req, res) => {
    try {
      const db = getDb();
      const search = String(req.query.search || '').trim();
      const limit = Math.min(200, Math.max(10, Number(req.query.limit || 50)));
      const rows = search
        ? db
            .prepare(
              `SELECT id, admin_id as adminId, admin_name as adminName, section, action, target_id as targetId,
               previous_value as previousValue, new_value as newValue, reason, rule_version as ruleVersion, created_at as createdAt
               FROM admin_audit_logs
               WHERE section LIKE ? OR action LIKE ? OR reason LIKE ? OR admin_name LIKE ?
               ORDER BY created_at DESC LIMIT ?`
            )
            .all(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, limit)
        : db
            .prepare(
              `SELECT id, admin_id as adminId, admin_name as adminName, section, action, target_id as targetId,
               previous_value as previousValue, new_value as newValue, reason, rule_version as ruleVersion, created_at as createdAt
               FROM admin_audit_logs ORDER BY created_at DESC LIMIT ?`
            )
            .all(limit);
      return res.json({ logs: rows });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to load audit logs.' });
    }
  });

  // =========================================================================
  // 3. CATEGORIES, SUBCATEGORIES & SERVICE PRICING RULES
  // =========================================================================
  router.get('/catalog/overview', (_req, res) => {
    try {
      const db = getDb();
      const categories = db
        .prepare(
          `SELECT id, name_en as nameEn, name_bn as nameBn, icon, description_en as descriptionEn,
           description_bn as descriptionBn, starting_price as startingPrice,
           commission_override_percent as commissionOverridePercent,
           emergency_available as emergencyAvailable, popular, active, active_professionals as activeProfessionals,
           tags_json as tagsJson, updated_at as updatedAt
           FROM service_categories ORDER BY popular DESC, name_en ASC`
        )
        .all()
        .map((c: any) => ({
          ...c,
          emergencyAvailable: Boolean(c.emergencyAvailable),
          popular: Boolean(c.popular),
          active: Boolean(c.active),
          tags: JSON.parse(c.tagsJson || '[]'),
        }));

      const subcategories = db
        .prepare(
          `SELECT id, category_id as categoryId, name_en as nameEn, name_bn as nameBn,
           description_en as descriptionEn, description_bn as descriptionBn, icon, active, updated_at as updatedAt
           FROM service_subcategories ORDER BY category_id ASC, name_en ASC`
        )
        .all()
        .map((s: any) => ({ ...s, active: Boolean(s.active) }));

      const pricingRules = db
        .prepare(
          `SELECT id, category_id as categoryId, subcategory_id as subcategoryId,
           service_title_en as serviceTitleEn, service_title_bn as serviceTitleBn,
           default_price as defaultPrice, min_price as minPrice, max_price as maxPrice,
           customization_permission as customizationPermission,
           visiting_fee as visitingFee, min_visiting_fee as minVisitingFee, max_visiting_fee as maxVisitingFee,
           hourly_rate as hourlyRate, additional_hour_charge as additionalHourCharge,
           emergency_charge as emergencyCharge, night_charge as nightCharge, weekend_charge as weekendCharge,
           material_policy as materialPolicy, additional_charge_policy as additionalChargePolicy,
           requires_price_approval as requiresPriceApproval,
           commission_override_percent as commissionOverridePercent,
           active, rule_version as ruleVersion, updated_at as updatedAt
           FROM pricing_rules ORDER BY category_id ASC, subcategory_id ASC`
        )
        .all()
        .map((r: any) => ({
          ...r,
          requiresPriceApproval: Boolean(r.requiresPriceApproval),
          active: Boolean(r.active),
        }));

      return res.json({ categories, subcategories, pricingRules });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to load service catalog.' });
    }
  });

  router.post('/admin/categories', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { id, nameEn, nameBn, icon, descriptionEn, descriptionBn, startingPrice, commissionOverridePercent, emergencyAvailable } = req.body || {};
      if (!nameEn || !nameBn) return res.status(400).json({ error: 'Category nameEn and nameBn are required.' });
      const basePrice = Number(startingPrice || 300);
      if (!Number.isFinite(basePrice) || basePrice <= 0) return res.status(400).json({ error: 'Valid startingPrice > 0 is required.' });
      if (commissionOverridePercent !== undefined && commissionOverridePercent !== null && commissionOverridePercent !== '') {
        const pct = Number(commissionOverridePercent);
        if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
          return res.status(400).json({ error: 'Category commission override must be between 0 and 100.' });
        }
      }

      const catId = String(id || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '_')).slice(0, 48);
      const now = new Date().toISOString();
      const rules = loadPlatformRules(db);

      db.transaction(() => {
        db.prepare(`
          INSERT INTO service_categories (id, name_en, name_bn, icon, description_en, description_bn, starting_price, commission_override_percent, emergency_available, popular, active, active_professionals, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 0, ?)
        `).run(
          catId,
          String(nameEn).trim(),
          String(nameBn).trim(),
          String(icon || 'Wrench'),
          String(descriptionEn || ''),
          String(descriptionBn || ''),
          basePrice,
          commissionOverridePercent !== undefined && commissionOverridePercent !== null && commissionOverridePercent !== ''
            ? Number(commissionOverridePercent)
            : null,
          emergencyAvailable ? 1 : 0,
          now
        );

        db.prepare(`
          INSERT INTO pricing_rules (
            id, category_id, subcategory_id, service_title_en, service_title_bn,
            default_price, min_price, max_price, customization_permission,
            visiting_fee, min_visiting_fee, max_visiting_fee, hourly_rate, additional_hour_charge,
            emergency_charge, night_charge, weekend_charge, material_policy, additional_charge_policy,
            requires_price_approval, commission_override_percent, active, rule_version, updated_at
          ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'TECH_CUSTOMIZABLE_RANGE', ?, ?, ?, 250, 150, ?, ?, ?, 'SEPARATE_DOCUMENTED_NON_COMMISSIONABLE', 'REQUIRE_CUSTOMER_APPROVAL', 0, ?, 1, ?, ?)
        `).run(
          `pr-cat-${catId}`,
          catId,
          String(nameEn).trim(),
          String(nameBn).trim(),
          basePrice,
          Math.max(100, Math.round(basePrice * 0.7)),
          Math.round(basePrice * 2.5),
          rules.visitingAndAdditional.defaultVisitingFee,
          rules.visitingAndAdditional.minVisitingFee,
          rules.visitingAndAdditional.maxVisitingFee,
          rules.visitingAndAdditional.defaultEmergencyCharge,
          rules.visitingAndAdditional.defaultNightCharge,
          rules.visitingAndAdditional.defaultWeekendCharge,
          commissionOverridePercent !== undefined && commissionOverridePercent !== null && commissionOverridePercent !== ''
            ? Number(commissionOverridePercent)
            : null,
          rules.version,
          now
        );

        db.prepare(`
          INSERT INTO admin_audit_logs (id, admin_id, admin_name, section, action, target_id, previous_value, new_value, reason, rule_version, created_at)
          VALUES (?, ?, ?, 'CATEGORIES', 'CREATE_CATEGORY', ?, '{}', ?, 'Admin created service category', ?, ?)
        `).run(uid('aud'), req.auth!.sub, req.auth!.name, catId, JSON.stringify({ nameEn, startingPrice: basePrice }), rules.version, now);
      })();

      return res.status(201).json({ id: catId, nameEn, nameBn, startingPrice: basePrice });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to create category.' });
    }
  });

  router.put('/admin/categories/:id', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM service_categories WHERE id = ?').get(id) as any;
      if (!existing) return res.status(404).json({ error: 'Category not found.' });

      const { nameEn, nameBn, descriptionEn, descriptionBn, startingPrice, commissionOverridePercent, emergencyAvailable, active } = req.body || {};
      const now = new Date().toISOString();
      const nextStarting = startingPrice !== undefined ? Number(startingPrice) : Number(existing.starting_price);
      if (!Number.isFinite(nextStarting) || nextStarting <= 0) {
        return res.status(400).json({ error: 'startingPrice must be positive.' });
      }
      let nextComm = existing.commission_override_percent;
      if (commissionOverridePercent !== undefined) {
        if (commissionOverridePercent === null || commissionOverridePercent === '') {
          nextComm = null;
        } else {
          const pct = Number(commissionOverridePercent);
          if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
            return res.status(400).json({ error: 'commissionOverridePercent must be 0..100.' });
          }
          nextComm = pct;
        }
      }

      db.prepare(`
        UPDATE service_categories
        SET name_en = ?, name_bn = ?, description_en = ?, description_bn = ?,
            starting_price = ?, commission_override_percent = ?, emergency_available = ?,
            active = ?, updated_at = ?
        WHERE id = ?
      `).run(
        nameEn ?? existing.name_en,
        nameBn ?? existing.name_bn,
        descriptionEn ?? existing.description_en,
        descriptionBn ?? existing.description_bn,
        nextStarting,
        nextComm,
        emergencyAvailable !== undefined ? (emergencyAvailable ? 1 : 0) : existing.emergency_available,
        active !== undefined ? (active ? 1 : 0) : existing.active,
        now,
        id
      );

      db.prepare(`
        INSERT INTO admin_audit_logs (id, admin_id, admin_name, section, action, target_id, previous_value, new_value, reason, created_at)
        VALUES (?, ?, ?, 'CATEGORIES', 'UPDATE_CATEGORY', ?, ?, ?, 'Category updated', ?)
      `).run(
        uid('aud'),
        req.auth!.sub,
        req.auth!.name,
        id,
        JSON.stringify({ startingPrice: existing.starting_price, active: existing.active }),
        JSON.stringify({ startingPrice: nextStarting, active: active ?? existing.active }),
        now
      );

      return res.json({ success: true, id });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to update category.' });
    }
  });

  router.delete('/admin/categories/:id', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const bookingRef = db.prepare('SELECT COUNT(*) as c FROM bookings WHERE category_id = ?').get(id) as { c: number };
      const now = new Date().toISOString();
      if (bookingRef.c > 0) {
        // Safe deactivation instead of breaking historical booking foreign references
        db.prepare('UPDATE service_categories SET active = 0, updated_at = ? WHERE id = ?').run(now, id);
        return res.json({ deactivated: true, message: 'Category has historical bookings and was safely deactivated.' });
      }
      db.prepare('DELETE FROM service_categories WHERE id = ?').run(id);
      return res.json({ deleted: true });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to delete category.' });
    }
  });

  router.post('/admin/subcategories', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const {
        id,
        categoryId,
        nameEn,
        nameBn,
        descriptionEn,
        descriptionBn,
        icon,
        defaultPrice,
        minPrice,
        maxPrice,
        customizationPermission,
        visitingFee,
        minVisitingFee,
        maxVisitingFee,
        hourlyRate,
        additionalHourCharge,
        emergencyCharge,
        nightCharge,
        weekendCharge,
        materialPolicy,
        additionalChargePolicy,
        requiresPriceApproval,
        commissionOverridePercent,
      } = req.body || {};

      if (!categoryId || !nameEn) {
        return res.status(400).json({ error: 'categoryId and nameEn are required.' });
      }
      const cat = db.prepare('SELECT id FROM service_categories WHERE id = ?').get(categoryId);
      if (!cat) return res.status(404).json({ error: 'Parent category not found.' });

      const defP = Number(defaultPrice ?? 400);
      const minP = Number(minPrice ?? defP);
      const maxP = Number(maxPrice ?? defP * 2);
      if (minP > maxP || defP < minP || defP > maxP) {
        return res.status(400).json({ error: `Invalid price range: min (${minP}) <= default (${defP}) <= max (${maxP}) must hold.` });
      }

      const vFee = Number(visitingFee ?? 200);
      const minVF = Number(minVisitingFee ?? 100);
      const maxVF = Number(maxVisitingFee ?? 500);
      if (minVF > maxVF || vFee < minVF || vFee > maxVF) {
        return res.status(400).json({ error: 'Invalid visiting fee range.' });
      }

      const subId = String(id || `sub-${nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36).slice(-4)}`);
      const ruleId = `pr-${subId}`;
      const rules = loadPlatformRules(db);
      const now = new Date().toISOString();

      db.transaction(() => {
        db.prepare(`
          INSERT INTO service_subcategories (id, category_id, name_en, name_bn, description_en, description_bn, icon, active, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        `).run(subId, categoryId, String(nameEn).trim(), String(nameBn || nameEn).trim(), String(descriptionEn || ''), String(descriptionBn || ''), String(icon || 'Wrench'), now);

        db.prepare(`
          INSERT INTO pricing_rules (
            id, category_id, subcategory_id, service_title_en, service_title_bn,
            default_price, min_price, max_price, customization_permission,
            visiting_fee, min_visiting_fee, max_visiting_fee,
            hourly_rate, additional_hour_charge, emergency_charge, night_charge, weekend_charge,
            material_policy, additional_charge_policy, requires_price_approval, commission_override_percent,
            active, rule_version, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).run(
          ruleId,
          categoryId,
          subId,
          String(nameEn).trim(),
          String(nameBn || nameEn).trim(),
          defP,
          minP,
          maxP,
          customizationPermission || 'TECH_CUSTOMIZABLE_RANGE',
          vFee,
          minVF,
          maxVF,
          Number(hourlyRate ?? 250),
          Number(additionalHourCharge ?? 150),
          Number(emergencyCharge ?? rules.visitingAndAdditional.defaultEmergencyCharge),
          Number(nightCharge ?? rules.visitingAndAdditional.defaultNightCharge),
          Number(weekendCharge ?? rules.visitingAndAdditional.defaultWeekendCharge),
          materialPolicy || rules.materialPolicy.policy,
          additionalChargePolicy || rules.visitingAndAdditional.additionalChargePolicy,
          requiresPriceApproval ? 1 : 0,
          commissionOverridePercent !== undefined && commissionOverridePercent !== null && commissionOverridePercent !== ''
            ? Number(commissionOverridePercent)
            : null,
          rules.version,
          now
        );

        db.prepare(`
          INSERT INTO admin_audit_logs (id, admin_id, admin_name, section, action, target_id, previous_value, new_value, reason, rule_version, created_at)
          VALUES (?, ?, ?, 'SERVICE_PRICING', 'CREATE_SUBCATEGORY_RULE', ?, '{}', ?, 'Admin created service & pricing rule', ?, ?)
        `).run(uid('aud'), req.auth!.sub, req.auth!.name, subId, JSON.stringify({ nameEn, defaultPrice: defP, minPrice: minP, maxPrice: maxP }), rules.version, now);
      })();

      return res.status(201).json({ subcategoryId: subId, pricingRuleId: ruleId });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to create subcategory & pricing rule.' });
    }
  });

  router.put('/admin/pricing-rules/:id', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const existing = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(id) as any;
      if (!existing) return res.status(404).json({ error: 'Pricing rule not found.' });

      const body = req.body || {};
      const defaultPrice = Number(body.defaultPrice ?? existing.default_price);
      const minPrice = Number(body.minPrice ?? existing.min_price);
      const maxPrice = Number(body.maxPrice ?? existing.max_price);
      if (minPrice > maxPrice || defaultPrice < minPrice || defaultPrice > maxPrice || minPrice < 0) {
        return res.status(400).json({
          error: `Validation error: min (${minPrice}) <= default (${defaultPrice}) <= max (${maxPrice}) must be satisfied.`,
        });
      }

      const visitingFee = Number(body.visitingFee ?? existing.visiting_fee);
      const minVisitingFee = Number(body.minVisitingFee ?? existing.min_visiting_fee);
      const maxVisitingFee = Number(body.maxVisitingFee ?? existing.max_visiting_fee);
      if (minVisitingFee > maxVisitingFee || visitingFee < minVisitingFee || visitingFee > maxVisitingFee) {
        return res.status(400).json({ error: 'Visiting fee must remain within minVisitingFee and maxVisitingFee.' });
      }

      let commOverride = existing.commission_override_percent;
      if (body.commissionOverridePercent !== undefined) {
        if (body.commissionOverridePercent === null || body.commissionOverridePercent === '') {
          commOverride = null;
        } else {
          const pct = Number(body.commissionOverridePercent);
          if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
            return res.status(400).json({ error: 'Service commission override must be 0..100.' });
          }
          commOverride = pct;
        }
      }

      const nextVersion = Number(existing.rule_version) + 1;
      const now = new Date().toISOString();

      db.transaction(() => {
        db.prepare(`
          UPDATE pricing_rules
          SET default_price = ?, min_price = ?, max_price = ?, customization_permission = ?,
              visiting_fee = ?, min_visiting_fee = ?, max_visiting_fee = ?,
              hourly_rate = ?, additional_hour_charge = ?, emergency_charge = ?,
              night_charge = ?, weekend_charge = ?, material_policy = ?, additional_charge_policy = ?,
              requires_price_approval = ?, commission_override_percent = ?, active = ?,
              rule_version = ?, updated_at = ?
          WHERE id = ?
        `).run(
          defaultPrice,
          minPrice,
          maxPrice,
          body.customizationPermission ?? existing.customization_permission,
          visitingFee,
          minVisitingFee,
          maxVisitingFee,
          Number(body.hourlyRate ?? existing.hourly_rate),
          Number(body.additionalHourCharge ?? existing.additional_hour_charge),
          Number(body.emergencyCharge ?? existing.emergency_charge),
          Number(body.nightCharge ?? existing.night_charge),
          Number(body.weekendCharge ?? existing.weekend_charge),
          body.materialPolicy ?? existing.material_policy,
          body.additionalChargePolicy ?? existing.additional_charge_policy,
          body.requiresPriceApproval !== undefined ? (body.requiresPriceApproval ? 1 : 0) : existing.requires_price_approval,
          commOverride,
          body.active !== undefined ? (body.active ? 1 : 0) : existing.active,
          nextVersion,
          now,
          id
        );

        // NOTE: Do NOT mutate any existing booking_price_snapshots! Historical bookings stay immutable.
        db.prepare(`
          INSERT INTO admin_audit_logs (id, admin_id, admin_name, section, action, target_id, previous_value, new_value, reason, rule_version, created_at)
          VALUES (?, ?, ?, 'SERVICE_PRICING', 'UPDATE_PRICING_RULE', ?, ?, ?, ?, ?, ?)
        `).run(
          uid('aud'),
          req.auth!.sub,
          req.auth!.name,
          id,
          JSON.stringify({ defaultPrice: existing.default_price, minPrice: existing.min_price, maxPrice: existing.max_price }),
          JSON.stringify({ defaultPrice, minPrice, maxPrice, visitingFee }),
          String(body.reason || 'Admin updated service pricing rule'),
          nextVersion,
          now
        );
      })();

      return res.json({ success: true, id, ruleVersion: nextVersion });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to update pricing rule.' });
    }
  });

  // =========================================================================
  // 4. TECHNICIAN PRICING MANAGEMENT ("MY SERVICES & PRICING")
  // =========================================================================
  router.get('/technician/services', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const requestedTechId = req.query.technicianId ? String(req.query.technicianId) : null;
      if (req.auth!.role !== 'ADMIN' && requestedTechId && requestedTechId !== req.auth!.techId) {
        return res.status(403).json({
          error: 'Forbidden: you can only view your own technician services and pricing.',
        });
      }
      const targetTechId =
        req.auth!.role === 'ADMIN' && requestedTechId
          ? requestedTechId
          : req.auth!.techId;

      if (!targetTechId) return res.status(400).json({ error: 'No technician profile associated with this account.' });

      const services = db
        .prepare(
          `SELECT id, technician_id as technicianId, category_id as categoryId, subcategory_id as subcategoryId,
           pricing_rule_id as pricingRuleId, service_title_en as serviceTitleEn, service_title_bn as serviceTitleBn,
           approved_price as approvedPrice, approved_visiting_fee as approvedVisitingFee,
           approved_hourly_rate as approvedHourlyRate, approved_additional_hour_charge as approvedAdditionalHourCharge,
           approved_emergency_charge as approvedEmergencyCharge, approved_night_charge as approvedNightCharge,
           approved_weekend_charge as approvedWeekendCharge,
           pending_price as pendingPrice, pending_visiting_fee as pendingVisitingFee,
           pending_hourly_rate as pendingHourlyRate, pending_additional_hour_charge as pendingAdditionalHourCharge,
           pending_emergency_charge as pendingEmergencyCharge, pending_night_charge as pendingNightCharge,
           pending_weekend_charge as pendingWeekendCharge,
           status, active, rejection_reason as rejectionReason, updated_at as updatedAt
           FROM technician_services WHERE technician_id = ? ORDER BY category_id ASC, service_title_en ASC`
        )
        .all(targetTechId)
        .map((s: any) => ({ ...s, active: Boolean(s.active) }));

      const history = db
        .prepare(
          `SELECT id, technician_id as technicianId, technician_service_id as technicianServiceId,
           service_title_en as serviceTitleEn, field, previous_value as previousValue, new_value as newValue,
           status, reviewed_by as reviewedBy, note, created_at as createdAt
           FROM technician_price_history WHERE technician_id = ? ORDER BY created_at DESC LIMIT 50`
        )
        .all(targetTechId);

      return res.json({ technicianId: targetTechId, services, history });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to load technician services.' });
    }
  });

  router.post('/technician/services/select', requireAuth, requireRole('TECHNICIAN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const techId = req.auth!.techId;
      if (!techId) return res.status(400).json({ error: 'Technician profile not found.' });

      const { subcategoryId } = req.body || {};
      if (!subcategoryId) return res.status(400).json({ error: 'subcategoryId is required.' });

      const rule = db
        .prepare('SELECT * FROM pricing_rules WHERE subcategory_id = ? AND active = 1')
        .get(subcategoryId) as any;
      if (!rule) return res.status(404).json({ error: 'Active pricing rule for this service was not found.' });

      const now = new Date().toISOString();
      const existing = db
        .prepare('SELECT id FROM technician_services WHERE technician_id = ? AND subcategory_id = ?')
        .get(techId, subcategoryId) as { id: string } | undefined;

      if (existing) {
        db.prepare('UPDATE technician_services SET active = 1, updated_at = ? WHERE id = ?').run(now, existing.id);
        return res.json({ id: existing.id, reactivated: true });
      }

      const id = `ts-${techId}-${subcategoryId}`;
      db.prepare(`
        INSERT INTO technician_services (
          id, technician_id, category_id, subcategory_id, pricing_rule_id, service_title_en, service_title_bn,
          approved_price, approved_visiting_fee, approved_hourly_rate, approved_additional_hour_charge,
          approved_emergency_charge, approved_night_charge, approved_weekend_charge, status, active, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DEFAULT_PRICE', 1, ?)
      `).run(
        id,
        techId,
        rule.category_id,
        subcategoryId,
        rule.id,
        rule.service_title_en,
        rule.service_title_bn,
        rule.default_price,
        rule.visiting_fee,
        rule.hourly_rate,
        rule.additional_hour_charge,
        rule.emergency_charge,
        rule.night_charge,
        rule.weekend_charge,
        now
      );

      db.prepare(`
        INSERT INTO technician_price_history (id, technician_id, technician_service_id, service_title_en, field, previous_value, new_value, status, note, created_at)
        VALUES (?, ?, ?, ?, 'servicePrice', 0, ?, 'DEFAULT_PRICE', 'Loaded Admin default price on service selection', ?)
      `).run(uid('tph'), techId, id, rule.service_title_en, rule.default_price, now);

      return res.status(201).json({ id, status: 'DEFAULT_PRICE' });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to select service.' });
    }
  });

  router.put('/technician/services/:id', requireAuth, requireRole('TECHNICIAN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const techId = req.auth!.techId;
      const { id } = req.params;

      const svc = db.prepare('SELECT * FROM technician_services WHERE id = ?').get(id) as any;
      if (!svc) return res.status(404).json({ error: 'Technician service not found.' });
      if (svc.technician_id !== techId) {
        return res.status(403).json({ error: 'Forbidden: cannot modify another technician service pricing.' });
      }

      const rules = loadPlatformRules(db);
      if (!rules.general.allowPriceCustomization) {
        return res.status(403).json({ error: 'Price customization is currently disabled by Platform Admin.' });
      }

      const pricingRule = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(svc.pricing_rule_id) as any;
      if (!pricingRule) return res.status(404).json({ error: 'Linked Admin pricing rule not found.' });

      if (
        pricingRule.customization_permission === 'FIXED_NO_CUSTOMIZATION' ||
        pricingRule.customization_permission === 'ADMIN_CONTROLLED'
      ) {
        return res.status(403).json({
          error: `Service "${svc.service_title_en}" pricing is ${pricingRule.customization_permission} and cannot be customized by technicians.`,
        });
      }

      const {
        price,
        visitingFee,
        hourlyRate,
        additionalHourCharge,
        emergencyCharge,
        nightCharge,
        weekendCharge,
      } = req.body || {};

      const nextPrice = price !== undefined ? Number(price) : Number(svc.approved_price);
      const nextVisit = visitingFee !== undefined ? Number(visitingFee) : Number(svc.approved_visiting_fee);
      const nextHourly = hourlyRate !== undefined ? Number(hourlyRate) : Number(svc.approved_hourly_rate);
      const nextAddHr = additionalHourCharge !== undefined ? Number(additionalHourCharge) : Number(svc.approved_additional_hour_charge);
      const nextEmerg = emergencyCharge !== undefined ? Number(emergencyCharge) : Number(svc.approved_emergency_charge);
      const nextNight = nightCharge !== undefined ? Number(nightCharge) : Number(svc.approved_night_charge);
      const nextWeekend = weekendCharge !== undefined ? Number(weekendCharge) : Number(svc.approved_weekend_charge);

      // Strict backend bounds enforcement
      if (!Number.isFinite(nextPrice) || nextPrice < Number(pricingRule.min_price) || nextPrice > Number(pricingRule.max_price)) {
        return res.status(400).json({
          error: `Service price ৳${nextPrice} is outside Admin-permitted range (৳${pricingRule.min_price} – ৳${pricingRule.max_price}).`,
        });
      }

      if (
        visitingFee !== undefined &&
        nextVisit !== Number(svc.approved_visiting_fee)
      ) {
        const perm = rules.customizationPermissions.visitingFee;
        if (perm === 'FIXED_NO_CUSTOMIZATION' || perm === 'ADMIN_CONTROLLED') {
          return res.status(403).json({ error: `Visiting fee customization is ${perm}.` });
        }
        if (!Number.isFinite(nextVisit) || nextVisit < Number(pricingRule.min_visiting_fee) || nextVisit > Number(pricingRule.max_visiting_fee)) {
          return res.status(400).json({
            error: `Visiting fee ৳${nextVisit} is outside Admin-permitted range (৳${pricingRule.min_visiting_fee} – ৳${pricingRule.max_visiting_fee}).`,
          });
        }
      }

      // Check field-level Admin permissions for remaining fields
      const checks: Array<[string, number, number, string]> = [
        ['hourlyRate', nextHourly, Number(svc.approved_hourly_rate), rules.customizationPermissions.hourlyRate],
        ['additionalHourCharge', nextAddHr, Number(svc.approved_additional_hour_charge), rules.customizationPermissions.additionalHourCharge],
        ['emergencyCharge', nextEmerg, Number(svc.approved_emergency_charge), rules.customizationPermissions.emergencyCharge],
        ['nightCharge', nextNight, Number(svc.approved_night_charge), rules.customizationPermissions.nightCharge],
        ['weekendCharge', nextWeekend, Number(svc.approved_weekend_charge), rules.customizationPermissions.weekendCharge],
      ];

      let needsApproval =
        Boolean(pricingRule.requires_price_approval) ||
        pricingRule.customization_permission === 'TECH_CUSTOMIZABLE_APPROVAL';

      for (const [field, nextVal, prevVal, perm] of checks) {
        if (nextVal !== prevVal) {
          if (perm === 'ADMIN_CONTROLLED' || perm === 'FIXED_NO_CUSTOMIZATION') {
            return res.status(403).json({ error: `${field} is ${perm} and cannot be edited by technician.` });
          }
          if (perm === 'TECH_CUSTOMIZABLE_APPROVAL') needsApproval = true;
          if (!Number.isFinite(nextVal) || nextVal < 0) {
            return res.status(400).json({ error: `Invalid negative value for ${field}.` });
          }
        }
      }

      if (
        nextVisit !== Number(svc.approved_visiting_fee) &&
        rules.customizationPermissions.visitingFee === 'TECH_CUSTOMIZABLE_APPROVAL'
      ) {
        needsApproval = true;
      }

      const now = new Date().toISOString();

      db.transaction(() => {
        if (needsApproval) {
          db.prepare(`
            UPDATE technician_services
            SET pending_price = ?, pending_visiting_fee = ?, pending_hourly_rate = ?,
                pending_additional_hour_charge = ?, pending_emergency_charge = ?,
                pending_night_charge = ?, pending_weekend_charge = ?,
                status = 'PENDING_APPROVAL', rejection_reason = NULL, updated_at = ?
            WHERE id = ?
          `).run(nextPrice, nextVisit, nextHourly, nextAddHr, nextEmerg, nextNight, nextWeekend, now, id);
        } else {
          db.prepare(`
            UPDATE technician_services
            SET approved_price = ?, approved_visiting_fee = ?, approved_hourly_rate = ?,
                approved_additional_hour_charge = ?, approved_emergency_charge = ?,
                approved_night_charge = ?, approved_weekend_charge = ?,
                pending_price = NULL, pending_visiting_fee = NULL, pending_hourly_rate = NULL,
                pending_additional_hour_charge = NULL, pending_emergency_charge = NULL,
                pending_night_charge = NULL, pending_weekend_charge = NULL,
                status = 'CUSTOMIZED_PRICE', rejection_reason = NULL, updated_at = ?
            WHERE id = ?
          `).run(nextPrice, nextVisit, nextHourly, nextAddHr, nextEmerg, nextNight, nextWeekend, now, id);
        }

        if (nextPrice !== Number(svc.approved_price)) {
          db.prepare(`
            INSERT INTO technician_price_history (id, technician_id, technician_service_id, service_title_en, field, previous_value, new_value, status, note, created_at)
            VALUES (?, ?, ?, ?, 'servicePrice', ?, ?, ?, ?, ?)
          `).run(
            uid('tph'),
            techId,
            id,
            svc.service_title_en,
            svc.approved_price,
            nextPrice,
            needsApproval ? 'PENDING_APPROVAL' : 'CUSTOMIZED_PRICE',
            needsApproval ? 'Submitted for Admin approval' : 'Customized within permitted Admin range',
            now
          );
        }
      })();

      return res.json({
        success: true,
        status: needsApproval ? 'PENDING_APPROVAL' : 'CUSTOMIZED_PRICE',
        needsApproval,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to update technician pricing.' });
    }
  });

  router.patch('/technician/services/:id/toggle', requireAuth, requireRole('TECHNICIAN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const svc = db.prepare('SELECT * FROM technician_services WHERE id = ?').get(id) as any;
      if (!svc) return res.status(404).json({ error: 'Service config not found.' });
      if (svc.technician_id !== req.auth!.techId) return res.status(403).json({ error: 'Forbidden' });

      const nextActive = req.body?.active !== undefined ? Boolean(req.body.active) : !Boolean(svc.active);
      const nextStatus = nextActive ? (svc.status === 'INACTIVE' ? 'DEFAULT_PRICE' : svc.status) : 'INACTIVE';
      db.prepare('UPDATE technician_services SET active = ?, status = ?, updated_at = ? WHERE id = ?').run(
        nextActive ? 1 : 0,
        nextStatus,
        new Date().toISOString(),
        id
      );
      return res.json({ id, active: nextActive, status: nextStatus });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to toggle service status.' });
    }
  });

  router.get('/admin/technician-pricing', requireAuth, requireRole('ADMIN'), (_req, res) => {
    try {
      const db = getDb();
      const rows = db
        .prepare(
          `SELECT ts.id, ts.technician_id as technicianId, t.name as technicianName,
           ts.category_id as categoryId, ts.subcategory_id as subcategoryId,
           ts.service_title_en as serviceTitleEn, ts.service_title_bn as serviceTitleBn,
           ts.approved_price as approvedPrice, ts.pending_price as pendingPrice,
           ts.approved_visiting_fee as approvedVisitingFee, ts.pending_visiting_fee as pendingVisitingFee,
           ts.status, ts.active, ts.rejection_reason as rejectionReason, ts.updated_at as updatedAt,
           pr.min_price as minPrice, pr.max_price as maxPrice, pr.default_price as defaultPrice
           FROM technician_services ts
           JOIN technicians t ON t.id = ts.technician_id
           JOIN pricing_rules pr ON pr.id = ts.pricing_rule_id
           ORDER BY CASE WHEN ts.status = 'PENDING_APPROVAL' THEN 0 ELSE 1 END, ts.updated_at DESC`
        )
        .all();
      return res.json({ items: rows });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to load technician pricing queue.' });
    }
  });

  router.post('/admin/technician-pricing/:id/review', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { decision, reason } = req.body || {};
      if (!['APPROVE', 'REJECT'].includes(decision)) {
        return res.status(400).json({ error: 'decision must be APPROVE or REJECT.' });
      }
      const svc = db.prepare('SELECT * FROM technician_services WHERE id = ?').get(id) as any;
      if (!svc) return res.status(404).json({ error: 'Technician service pricing not found.' });

      const now = new Date().toISOString();
      db.transaction(() => {
        if (decision === 'APPROVE') {
          const nextPrice = svc.pending_price ?? svc.approved_price;
          const nextVisit = svc.pending_visiting_fee ?? svc.approved_visiting_fee;
          const nextHourly = svc.pending_hourly_rate ?? svc.approved_hourly_rate;
          const nextAddHr = svc.pending_additional_hour_charge ?? svc.approved_additional_hour_charge;
          const nextEmerg = svc.pending_emergency_charge ?? svc.approved_emergency_charge;
          const nextNight = svc.pending_night_charge ?? svc.approved_night_charge;
          const nextWeekend = svc.pending_weekend_charge ?? svc.approved_weekend_charge;

          db.prepare(`
            UPDATE technician_services
            SET approved_price = ?, approved_visiting_fee = ?, approved_hourly_rate = ?,
                approved_additional_hour_charge = ?, approved_emergency_charge = ?,
                approved_night_charge = ?, approved_weekend_charge = ?,
                pending_price = NULL, pending_visiting_fee = NULL, pending_hourly_rate = NULL,
                pending_additional_hour_charge = NULL, pending_emergency_charge = NULL,
                pending_night_charge = NULL, pending_weekend_charge = NULL,
                status = 'APPROVED', rejection_reason = NULL, updated_at = ?
            WHERE id = ?
          `).run(nextPrice, nextVisit, nextHourly, nextAddHr, nextEmerg, nextNight, nextWeekend, now, id);

          db.prepare(`
            INSERT INTO technician_price_history (id, technician_id, technician_service_id, service_title_en, field, previous_value, new_value, status, reviewed_by, note, created_at)
            VALUES (?, ?, ?, ?, 'servicePrice', ?, ?, 'APPROVED', ?, ?, ?)
          `).run(uid('tph'), svc.technician_id, id, svc.service_title_en, svc.approved_price, nextPrice, req.auth!.sub, String(reason || 'Approved by Admin'), now);
        } else {
          db.prepare(`
            UPDATE technician_services
            SET pending_price = NULL, pending_visiting_fee = NULL, pending_hourly_rate = NULL,
                pending_additional_hour_charge = NULL, pending_emergency_charge = NULL,
                pending_night_charge = NULL, pending_weekend_charge = NULL,
                status = 'REJECTED', rejection_reason = ?, updated_at = ?
            WHERE id = ?
          `).run(String(reason || 'Rejected by Admin'), now, id);

          db.prepare(`
            INSERT INTO technician_price_history (id, technician_id, technician_service_id, service_title_en, field, previous_value, new_value, status, reviewed_by, note, created_at)
            VALUES (?, ?, ?, ?, 'servicePrice', ?, ?, 'REJECTED', ?, ?, ?)
          `).run(uid('tph'), svc.technician_id, id, svc.service_title_en, svc.approved_price, svc.pending_price ?? svc.approved_price, req.auth!.sub, String(reason || 'Rejected by Admin'), now);
        }

        db.prepare(`
          INSERT INTO admin_audit_logs (id, admin_id, admin_name, section, action, target_id, previous_value, new_value, reason, created_at)
          VALUES (?, ?, ?, 'TECH_PRICING_APPROVAL', ?, ?, ?, ?, ?, ?)
        `).run(uid('aud'), req.auth!.sub, req.auth!.name, decision, id, String(svc.approved_price), String(svc.pending_price ?? svc.approved_price), String(reason || decision), now);
      })();

      return res.json({ success: true, status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to review technician pricing.' });
    }
  });

  // =========================================================================
  // 5. CUSTOMER QUOTE & IMMUTABLE BOOKING SNAPSHOTS + EXTRA CHARGE APPROVALS
  // =========================================================================
  router.post('/pricing/quote', (req, res) => {
    try {
      const db = getDb();
      const quote = computePriceBreakdownFromServer(db, req.body || {});
      return res.json({ quote });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Unable to compute price quote.' });
    }
  });

  router.get('/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      let rows: any[];
      if (req.auth!.role === 'ADMIN') {
        rows = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 200').all();
      } else if (req.auth!.role === 'TECHNICIAN' && req.auth!.techId) {
        rows = db.prepare('SELECT * FROM bookings WHERE technician_id = ? ORDER BY created_at DESC').all(req.auth!.techId);
      } else {
        rows = db.prepare('SELECT * FROM bookings WHERE customer_id = ? ORDER BY created_at DESC').all(req.auth!.sub);
      }

      const enriched = rows.map((b) => {
        const snapshot = db.prepare(
          `SELECT id, booking_id as bookingId, category_id as categoryId, subcategory_id as subcategoryId,
           technician_id as technicianId, customer_id as customerId, service_name_en as serviceNameEn,
           service_name_bn as serviceNameBn, service_price as servicePrice, visiting_fee as visitingFee,
           hourly_charge as hourlyCharge, additional_charges_total as additionalChargesTotal,
           emergency_charge as emergencyCharge, night_charge as nightCharge, weekend_charge as weekendCharge,
           material_cost as materialCost, material_cost_commissionable as materialCostCommissionable,
           discount_amount as discountAmount, promo_code as promoCode, subtotal,
           commissionable_amount as commissionableAmount, platform_commission_percent as platformCommissionPercent,
           technician_earnings_percent as technicianEarningsPercent,
           platform_commission_amount as platformCommissionAmount,
           technician_earnings_amount as technicianEarningsAmount,
           estimated_total as estimatedTotal, final_agreed_amount as finalAgreedAmount,
           rule_version as ruleVersion, pricing_rule_id as pricingRuleId, currency, confirmed_at as confirmedAt
           FROM booking_price_snapshots WHERE booking_id = ?`
        ).get(b.id) as any;
        const extraCharges = db.prepare(
          `SELECT id, booking_id as bookingId, technician_id as technicianId, charge_type as chargeType,
           reason, amount, receipt_note as receiptNote, status, created_at as createdAt,
           responded_at as respondedAt, responded_by as respondedBy
           FROM additional_charge_requests WHERE booking_id = ? ORDER BY created_at DESC`
        ).all(b.id);
        const paymentTx = db.prepare(
          `SELECT id, booking_id as bookingId, method, amount, status, provider_tx_id as providerTxId,
           provider_mode as providerMode, created_at as createdAt, verified_at as verifiedAt, refunded_amount as refundedAmount
           FROM payment_transactions WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1`
        ).get(b.id);
        const cashCollection = db.prepare(
          `SELECT cc.id, cc.booking_id as bookingId, cc.amount_collected as amountCollected,
           cc.commission_amount as commissionAmount, cc.technician_share_amount as technicianShareAmount,
           cc.status, cc.collected_at as collectedAt, cc.deadline_at as deadlineAt, cc.grace_ends_at as graceEndsAt,
           cd.deposit_reference as depositReference, cd.status as depositStatus
           FROM cash_collections cc LEFT JOIN cash_deposits cd ON cd.cash_collection_id = cc.id
           WHERE cc.booking_id = ?`
        ).get(b.id);

        return {
          ...(b.booking_json ? JSON.parse(b.booking_json) : {}),
          id: b.id,
          bookingNumber: b.booking_number,
          status: b.status,
          paymentStatus: b.payment_status,
          paymentMethod: b.payment_method,
          finalTotal: b.final_total,
          customerConfirmedCompletion: Boolean(b.customer_confirmed_completion),
          snapshot: snapshot ? { ...snapshot, materialCostCommissionable: Boolean(snapshot.materialCostCommissionable) } : null,
          extraCharges,
          paymentTransaction: paymentTx || null,
          cashCollection: cashCollection || null,
        };
      });

      return res.json({ bookings: enriched });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to load bookings.' });
    }
  });

  router.post('/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const body = req.body || {};
      const customerId = req.auth!.sub;
      const rules = loadPlatformRules(db);

      const paymentMethod: PaymentMethodCode = body.paymentMethod || 'cash';
      if (!rules.general.activePaymentMethods[paymentMethod]) {
        return res.status(400).json({ error: `Payment method "${paymentMethod}" is currently disabled by Admin.` });
      }

      // Check technician booking restriction ONLY for NEW bookings!
      const walletRow = db.prepare('SELECT booking_restricted, restriction_reason FROM wallets WHERE technician_id = ?').get(body.technicianId) as any;
      if (walletRow && walletRow.booking_restricted) {
        return res.status(403).json({
          error: `Selected technician is temporarily restricted from accepting new bookings due to unresolved overdue cash deposit (${walletRow.restriction_reason || 'overdue settlement'}). Please choose another technician.`,
          code: 'TECHNICIAN_BOOKING_RESTRICTED',
        });
      }

      // CRITICAL: Server recomputes price strictly ignoring client-sent prices or commissions!
      const quote = computePriceBreakdownFromServer(db, {
        categoryId: body.categoryId,
        subcategoryId: body.subcategoryId,
        technicianId: body.technicianId,
        urgency: body.urgency || 'normal',
        isNightService: Boolean(body.isNightService),
        isWeekendService: Boolean(body.isWeekendService),
        estimatedHours: Number(body.estimatedHours || 0),
        estimatedMaterialCost: Number(body.estimatedMaterialCost || 0),
        promoCode: body.promoCode,
      });

      const techRow = db.prepare('SELECT * FROM technicians WHERE id = ?').get(body.technicianId) as any;
      const custRow = db.prepare('SELECT * FROM users WHERE id = ?').get(customerId) as any;

      const bookingId = String(body.id || uid('book'));
      const bookingNumber = `SRV-2026-${String(Math.floor(100000 + Math.random() * 900000)).slice(0, 6)}`;
      const now = new Date().toISOString();

      const fullBookingObj = {
        id: bookingId,
        bookingNumber,
        customerId,
        customerName: custRow?.name || body.customerName || req.auth!.name,
        customerPhone: custRow?.phone || body.customerPhone || '01700-000000',
        customerDivision: body.customerDivision || custRow?.division || 'Dhaka',
        customerDistrict: body.customerDistrict || body.customerCity || custRow?.district || 'Dhaka',
        customerCity: body.customerDistrict || body.customerCity || custRow?.city || 'Dhaka',
        customerArea: body.customerArea || custRow?.area || 'Dhanmondi',
        customerAddress: body.customerAddress || custRow?.address || 'Dhaka',
        customerLat: body.customerLat ?? null,
        customerLng: body.customerLng ?? null,
        technicianId: techRow.id,
        technicianName: techRow.name,
        technicianPhone: techRow.phone,
        technicianAvatar: techRow.avatar || '',
        categoryId: quote.categoryId,
        subcategoryId: quote.subcategoryId || null,
        serviceNameEn: quote.serviceNameEn,
        serviceNameBn: quote.serviceNameBn,
        problemDescription: String(body.problemDescription || 'General service request'),
        mediaUrls: Array.isArray(body.mediaUrls) ? body.mediaUrls : [],
        date: String(body.date || now.split('T')[0]),
        timeSlot: String(body.timeSlot || '10:00 AM - 12:00 PM'),
        urgency: body.urgency || 'normal',
        estimatedVisitingFee: quote.visitingFee,
        estimatedLabourMin: quote.servicePrice,
        estimatedLabourMax: quote.servicePrice,
        estimatedTotalMin: quote.estimatedTotal,
        estimatedTotalMax: quote.estimatedTotal,
        finalTotal: quote.estimatedTotal,
        status: 'REQUESTED',
        statusHistory: [
          {
            status: 'REQUESTED',
            timestamp: now,
            noteEn: `Booking confirmed with immutable price snapshot v${quote.ruleVersion}.`,
            noteBn: `গ্রাহক নিশ্চিতকৃত মূল্য স্ন্যাপশট (v${quote.ruleVersion}) সহ বুকিং সম্পন্ন করেছেন।`,
          },
        ],
        paymentStatus: 'PENDING',
        paymentMethod,
        warrantyDays: Number(body.warrantyDays || 14),
        createdAt: now,
        updatedAt: now,
      };

      const snapshotId = uid('snap');

      db.transaction(() => {
        db.prepare(`
          INSERT INTO bookings (
            id, booking_number, customer_id, customer_name, customer_phone, customer_division, customer_district,
            customer_city, customer_area, customer_address, customer_lat, customer_lng,
            technician_id, technician_name, technician_phone, technician_avatar, category_id, subcategory_id,
            service_name_en, service_name_bn, problem_description, date, time_slot, urgency, status,
            customer_confirmed_completion, payment_status, payment_method,
            estimated_visiting_fee, estimated_labour_min, estimated_labour_max,
            estimated_total_min, estimated_total_max, final_total, warranty_days, booking_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED', 0, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          bookingId,
          bookingNumber,
          customerId,
          fullBookingObj.customerName,
          fullBookingObj.customerPhone,
          fullBookingObj.customerDivision,
          fullBookingObj.customerDistrict,
          fullBookingObj.customerCity,
          fullBookingObj.customerArea,
          fullBookingObj.customerAddress,
          fullBookingObj.customerLat,
          fullBookingObj.customerLng,
          techRow.id,
          techRow.name,
          techRow.phone,
          fullBookingObj.technicianAvatar,
          quote.categoryId,
          quote.subcategoryId || null,
          quote.serviceNameEn,
          quote.serviceNameBn,
          fullBookingObj.problemDescription,
          fullBookingObj.date,
          fullBookingObj.timeSlot,
          fullBookingObj.urgency,
          paymentMethod,
          quote.visitingFee,
          quote.servicePrice,
          quote.servicePrice,
          quote.estimatedTotal,
          quote.estimatedTotal,
          quote.estimatedTotal,
          fullBookingObj.warrantyDays,
          JSON.stringify(fullBookingObj),
          now,
          now
        );

        db.prepare(`
          INSERT INTO booking_price_snapshots (
            id, booking_id, category_id, subcategory_id, technician_id, customer_id,
            service_name_en, service_name_bn, service_price, visiting_fee, hourly_charge,
            additional_charges_total, emergency_charge, night_charge, weekend_charge,
            material_cost, material_cost_commissionable, discount_amount, promo_code, subtotal,
            commissionable_amount, platform_commission_percent, technician_earnings_percent,
            platform_commission_amount, technician_earnings_amount, estimated_total, final_agreed_amount,
            rule_version, pricing_rule_id, currency, confirmed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BDT', ?)
        `).run(
          snapshotId,
          bookingId,
          quote.categoryId,
          quote.subcategoryId || null,
          quote.technicianId,
          customerId,
          quote.serviceNameEn,
          quote.serviceNameBn,
          quote.servicePrice,
          quote.visitingFee,
          quote.hourlyCharge,
          quote.emergencyCharge,
          quote.nightCharge,
          quote.weekendCharge,
          quote.estimatedMaterialCost,
          quote.materialCostCommissionable ? 1 : 0,
          quote.discountAmount,
          quote.promoApplied || null,
          quote.subtotal,
          quote.commissionableAmount,
          quote.platformCommissionPercent,
          quote.technicianEarningsPercent,
          quote.estimatedPlatformCommission,
          quote.estimatedTechnicianEarnings,
          quote.estimatedTotal,
          quote.estimatedTotal,
          quote.ruleVersion,
          quote.pricingRuleId || null,
          now
        );
      })();

      const savedSnapshot = db.prepare('SELECT * FROM booking_price_snapshots WHERE id = ?').get(snapshotId);
      return res.status(201).json({ booking: fullBookingObj, snapshot: savedSnapshot, quote });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to create booking with price snapshot.' });
    }
  });

  router.get('/bookings/:id/snapshot', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as any;
      if (!booking) return res.status(404).json({ error: 'Booking not found.' });

      if (
        req.auth!.role !== 'ADMIN' &&
        booking.customer_id !== req.auth!.sub &&
        booking.technician_id !== req.auth!.techId
      ) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const snapshot = db.prepare(
        `SELECT id, booking_id as bookingId, category_id as categoryId, subcategory_id as subcategoryId,
         technician_id as technicianId, customer_id as customerId, service_name_en as serviceNameEn,
         service_name_bn as serviceNameBn, service_price as servicePrice, visiting_fee as visitingFee,
         hourly_charge as hourlyCharge, additional_charges_total as additionalChargesTotal,
         emergency_charge as emergencyCharge, night_charge as nightCharge, weekend_charge as weekendCharge,
         material_cost as materialCost, material_cost_commissionable as materialCostCommissionable,
         discount_amount as discountAmount, promo_code as promoCode, subtotal,
         commissionable_amount as commissionableAmount, platform_commission_percent as platformCommissionPercent,
         technician_earnings_percent as technicianEarningsPercent,
         platform_commission_amount as platformCommissionAmount,
         technician_earnings_amount as technicianEarningsAmount,
         estimated_total as estimatedTotal, final_agreed_amount as finalAgreedAmount,
         rule_version as ruleVersion, pricing_rule_id as pricingRuleId, currency, confirmed_at as confirmedAt
         FROM booking_price_snapshots WHERE booking_id = ?`
      ).get(booking.id);

      const extraCharges = db.prepare(
        `SELECT id, booking_id as bookingId, technician_id as technicianId, charge_type as chargeType,
         reason, amount, receipt_note as receiptNote, status, created_at as createdAt,
         responded_at as respondedAt, responded_by as respondedBy
         FROM additional_charge_requests WHERE booking_id = ? ORDER BY created_at DESC`
      ).all(booking.id);

      const paymentTransactions = db.prepare(
        `SELECT id, booking_id as bookingId, method, amount, status, provider_tx_id as providerTxId,
         provider_status as providerStatus, provider_mode as providerMode, idempotency_key as idempotencyKey,
         created_at as createdAt, verified_at as verifiedAt, refunded_amount as refundedAmount
         FROM payment_transactions WHERE booking_id = ? ORDER BY created_at DESC`
      ).all(booking.id);

      const cashCollection = db.prepare(
        `SELECT cc.id, cc.booking_id as bookingId, cc.amount_collected as amountCollected,
         cc.commission_amount as commissionAmount, cc.technician_share_amount as technicianShareAmount,
         cc.status, cc.collected_at as collectedAt, cc.deadline_at as deadlineAt, cc.grace_ends_at as graceEndsAt,
         cd.id as depositId, cd.channel as depositChannel, cd.deposit_reference as depositReference,
         cd.amount_deposited as amountDeposited, cd.status as depositStatus, cd.rejection_reason as depositRejectionReason
         FROM cash_collections cc LEFT JOIN cash_deposits cd ON cd.cash_collection_id = cc.id
         WHERE cc.booking_id = ?`
      ).get(booking.id);

      return res.json({ snapshot, extraCharges, paymentTransactions, cashCollection });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to load snapshot.' });
    }
  });

  router.patch('/bookings/:id/status', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { status, noteEn, noteBn } = req.body || {};
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as any;
      if (!booking) return res.status(404).json({ error: 'Booking not found.' });

      const isOwnerCustomer = booking.customer_id === req.auth!.sub;
      const isOwnerTech = booking.technician_id === req.auth!.techId;
      if (req.auth!.role !== 'ADMIN' && !isOwnerCustomer && !isOwnerTech) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const validStatuses = ['REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
      if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid booking status.' });

      const now = new Date().toISOString();
      db.transaction(() => {
        const parsedJson = booking.booking_json ? JSON.parse(booking.booking_json) : {};
        const nextHistory = [
          ...(parsedJson.statusHistory || []),
          { status, timestamp: now, noteEn: noteEn || status, noteBn: noteBn || status },
        ];
        const nextJson = { ...parsedJson, status, statusHistory: nextHistory, updatedAt: now };
        db.prepare('UPDATE bookings SET status = ?, booking_json = ?, updated_at = ? WHERE id = ?').run(
          status,
          JSON.stringify(nextJson),
          now,
          booking.id
        );

        // If booking completes and payment was already verified online, release EARNING_PENDING -> EARNING_AVAILABLE
        if (status === 'COMPLETED' && booking.payment_status === 'PAID') {
          const paidTx = db
            .prepare("SELECT id FROM payment_transactions WHERE booking_id = ? AND status = 'VERIFIED' LIMIT 1")
            .get(booking.id) as { id: string } | undefined;
          if (paidTx) {
            postBookingEarningsAndCommission(db, booking.id, paidTx.id, null, req.auth!.sub);
          }
        }
      })();

      return res.json({ success: true, status });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to update booking status.' });
    }
  });

  // Extra work / Material charge requests (Technician submits -> Customer must explicitly Approve/Reject)
  router.post('/bookings/:id/extra-charges', requireAuth, requireRole('TECHNICIAN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as any;
      if (!booking) return res.status(404).json({ error: 'Booking not found.' });
      if (booking.technician_id !== req.auth!.techId) return res.status(403).json({ error: 'Forbidden' });

      const { chargeType, reason, amount, receiptNote } = req.body || {};
      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Additional charge amount must be greater than 0.' });
      }
      if (!reason || String(reason).trim().length < 3) {
        return res.status(400).json({ error: 'Clear reason is required for any extra charge.' });
      }

      const rules = loadPlatformRules(db);
      if (chargeType === 'PARTS_MATERIAL' && numAmount > rules.materialPolicy.requireReceiptNoteAbove && !String(receiptNote || '').trim()) {
        return res.status(400).json({
          error: `Material cost above ৳${rules.materialPolicy.requireReceiptNoteAbove} requires supplier/receipt note to prevent false material inflation.`,
        });
      }

      const chargeId = uid('chg');
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO additional_charge_requests (id, booking_id, technician_id, charge_type, reason, amount, receipt_note, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_CUSTOMER', ?)
      `).run(
        chargeId,
        booking.id,
        req.auth!.techId,
        chargeType || 'EXTRA_WORK',
        String(reason).trim(),
        roundBDT(numAmount),
        receiptNote ? String(receiptNote).trim() : null,
        now
      );

      return res.status(201).json({ id: chargeId, status: 'PENDING_CUSTOMER', amount: roundBDT(numAmount) });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to submit additional charge request.' });
    }
  });

  router.post('/bookings/:id/extra-charges/:chargeId/respond', requireAuth, requireRole('CUSTOMER', 'ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { id, chargeId } = req.params;
      const { decision } = req.body || {};
      if (!['APPROVE', 'REJECT'].includes(decision)) {
        return res.status(400).json({ error: 'decision must be APPROVE or REJECT.' });
      }

      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
      if (!booking) return res.status(404).json({ error: 'Booking not found.' });
      if (req.auth!.role === 'CUSTOMER' && booking.customer_id !== req.auth!.sub) {
        return res.status(403).json({ error: 'Forbidden: only the booking customer can approve extra charges.' });
      }

      const charge = db.prepare('SELECT * FROM additional_charge_requests WHERE id = ? AND booking_id = ?').get(chargeId, id) as any;
      if (!charge) return res.status(404).json({ error: 'Charge request not found.' });
      if (charge.status !== 'PENDING_CUSTOMER') {
        return res.status(400).json({ error: `Charge request already ${charge.status}.` });
      }

      const snapRow = db.prepare('SELECT * FROM booking_price_snapshots WHERE booking_id = ?').get(id) as any;
      if (!snapRow) return res.status(404).json({ error: 'Snapshot missing for booking.' });

      const now = new Date().toISOString();
      const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';

      const updatedSnapshot = db.transaction(() => {
        db.prepare(
          'UPDATE additional_charge_requests SET status = ?, responded_at = ?, responded_by = ? WHERE id = ?'
        ).run(newStatus, now, req.auth!.sub, chargeId);

        if (decision === 'APPROVE') {
          return recalculateSnapshotWithApprovedExtras(db, {
            id: snapRow.id,
            bookingId: snapRow.booking_id,
            categoryId: snapRow.category_id,
            subcategoryId: snapRow.subcategory_id,
            technicianId: snapRow.technician_id,
            customerId: snapRow.customer_id,
            serviceNameEn: snapRow.service_name_en,
            serviceNameBn: snapRow.service_name_bn,
            servicePrice: Number(snapRow.service_price),
            visitingFee: Number(snapRow.visiting_fee),
            hourlyCharge: Number(snapRow.hourly_charge),
            additionalChargesTotal: Number(snapRow.additional_charges_total),
            emergencyCharge: Number(snapRow.emergency_charge),
            nightCharge: Number(snapRow.night_charge),
            weekendCharge: Number(snapRow.weekend_charge),
            materialCost: Number(snapRow.material_cost),
            materialCostCommissionable: Boolean(snapRow.material_cost_commissionable),
            discountAmount: Number(snapRow.discount_amount),
            promoCode: snapRow.promo_code,
            subtotal: Number(snapRow.subtotal),
            commissionableAmount: Number(snapRow.commissionable_amount),
            platformCommissionPercent: Number(snapRow.platform_commission_percent),
            technicianEarningsPercent: Number(snapRow.technician_earnings_percent),
            platformCommissionAmount: Number(snapRow.platform_commission_amount),
            technicianEarningsAmount: Number(snapRow.technician_earnings_amount),
            estimatedTotal: Number(snapRow.estimated_total),
            finalAgreedAmount: Number(snapRow.final_agreed_amount),
            ruleVersion: Number(snapRow.rule_version),
            pricingRuleId: snapRow.pricing_rule_id,
            currency: 'BDT',
            confirmedAt: snapRow.confirmed_at,
          });
        }
        return null;
      })();

      return res.json({ status: newStatus, snapshot: updatedSnapshot });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to respond to additional charge.' });
    }
  });

  // =========================================================================
  // 6. ONLINE PAYMENT GATEWAY ADAPTER & SERVER-SIDE WEBHOOK VERIFICATION
  // =========================================================================
  router.get('/payments/providers', (_req, res) => {
    const db = getDb();
    const rules = loadPlatformRules(db);
    return res.json({
      activeMethods: rules.general.activePaymentMethods,
      providers: getPaymentProviderStatuses(),
    });
  });

  router.post('/payments/initiate', requireAuth, rateLimit(20, 60_000), async (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { bookingId, method, idempotencyKey } = req.body || {};
      if (!bookingId || !method) return res.status(400).json({ error: 'bookingId and method are required.' });

      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
      if (!booking) return res.status(404).json({ error: 'Booking not found.' });
      if (req.auth!.role !== 'ADMIN' && booking.customer_id !== req.auth!.sub) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (booking.payment_status === 'PAID') {
        return res.status(400).json({ error: 'Booking is already paid.' });
      }

      const rules = loadPlatformRules(db);
      if (!rules.general.activePaymentMethods[method as PaymentMethodCode]) {
        return res.status(400).json({ error: `Payment method ${method} is disabled by Admin.` });
      }
      if (method === 'cash') {
        return res.status(400).json({ error: 'Cash on Completion uses /api/cash/collect upon completion, not online gateway initiation.' });
      }

      const idem = String(idempotencyKey || `${bookingId}-${method}`).trim();
      const existing = db.prepare('SELECT * FROM payment_transactions WHERE idempotency_key = ?').get(idem) as any;
      if (existing) {
        return res.json({
          idempotent: true,
          transaction: existing,
          providers: getPaymentProviderStatuses(),
        });
      }

      const snapshot = db.prepare('SELECT final_agreed_amount FROM booking_price_snapshots WHERE booking_id = ?').get(bookingId) as { final_agreed_amount: number };
      // CRITICAL: Server uses immutable snapshot final_agreed_amount, never client amount!
      const serverAmount = roundBDT(Number(snapshot.final_agreed_amount));
      const txId = uid('ptx');

      const adapterRes = await initiateOnlinePaymentWithProvider({
        method,
        internalTxId: txId,
        bookingId,
        amount: serverAmount,
        customerPhone: booking.customer_phone,
      });

      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO payment_transactions (
          id, booking_id, customer_id, technician_id, method, amount, currency,
          status, provider_tx_id, provider_status, provider_mode, idempotency_key, checkout_url, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'BDT', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        txId,
        bookingId,
        booking.customer_id,
        booking.technician_id,
        method,
        serverAmount,
        adapterRes.status,
        adapterRes.providerTxId,
        adapterRes.configured ? 'AWAITING_CALLBACK' : 'PROVIDER_UNCONFIGURED',
        adapterRes.mode,
        idem,
        adapterRes.checkoutUrl,
        now
      );

      db.prepare('UPDATE bookings SET payment_method = ?, updated_at = ? WHERE id = ?').run(method, now, bookingId);

      const saved = db.prepare('SELECT * FROM payment_transactions WHERE id = ?').get(txId);
      return res.status(201).json({
        transaction: saved,
        configured: adapterRes.configured,
        mode: adapterRes.mode,
        missingEnvVars: adapterRes.missingEnvVars,
        message: adapterRes.message,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Payment initiation failed.' });
    }
  });

  // Server-signed provider callback / webhook verification (prevents spoofed frontend callbacks & duplicates)
  router.post('/payments/verify-webhook', rateLimit(60, 60_000), (req, res) => {
    try {
      const db = getDb();
      const signature = req.header('x-servexa-signature');
      const rawBody = JSON.stringify(req.body || {});
      if (!verifyWebhookSignature(rawBody, signature, getWebhookSecret())) {
        return res.status(401).json({ error: 'Invalid webhook HMAC signature.' });
      }

      const { txId, webhookEventId, providerTxId, status, amount, failureReason } = req.body || {};
      if (!txId || !webhookEventId || !status) {
        return res.status(400).json({ error: 'txId, webhookEventId, and status are required.' });
      }

      // Duplicate webhook event protection
      const existingEvent = db.prepare('SELECT id, status FROM payment_transactions WHERE webhook_event_id = ?').get(String(webhookEventId)) as any;
      if (existingEvent) {
        return res.json({ deduplicated: true, status: existingEvent.status });
      }

      const tx = db.prepare('SELECT * FROM payment_transactions WHERE id = ?').get(String(txId)) as any;
      if (!tx) return res.status(404).json({ error: 'Payment transaction not found.' });

      if (tx.status === 'VERIFIED' || tx.status === 'REFUNDED') {
        return res.json({ deduplicated: true, status: tx.status });
      }

      if (status === 'VERIFIED' && roundBDT(Number(amount)) !== roundBDT(Number(tx.amount))) {
        return res.status(400).json({ error: `Verified amount mismatch (expected ৳${tx.amount}, received ৳${amount}).` });
      }

      const allowed = ['VERIFIED', 'FAILED', 'EXPIRED', 'PENDING'];
      if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid provider callback status.' });

      const now = new Date().toISOString();
      let earningsResult: any = null;

      db.transaction(() => {
        db.prepare(`
          UPDATE payment_transactions
          SET status = ?, provider_tx_id = COALESCE(?, provider_tx_id),
              provider_status = ?, webhook_event_id = ?, failure_reason = ?,
              verified_at = CASE WHEN ? = 'VERIFIED' THEN ? ELSE verified_at END
          WHERE id = ?
        `).run(
          status,
          providerTxId || null,
          status,
          String(webhookEventId),
          failureReason || null,
          status,
          now,
          tx.id
        );

        if (status === 'VERIFIED') {
          db.prepare("UPDATE bookings SET payment_status = 'PAID', updated_at = ? WHERE id = ?").run(now, tx.booking_id);
          earningsResult = postBookingEarningsAndCommission(db, tx.booking_id, tx.id, null, 'WEBHOOK_VERIFIER');
        }
      })();

      return res.json({ success: true, status, earningsResult });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Webhook verification error.' });
    }
  });

  router.post('/admin/payments/:txId/refund', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { txId } = req.params;
      const { amount, reason } = req.body || {};

      const tx = db.prepare('SELECT * FROM payment_transactions WHERE id = ?').get(txId) as any;
      if (!tx) return res.status(404).json({ error: 'Payment transaction not found.' });
      if (tx.status !== 'VERIFIED') {
        return res.status(400).json({ error: 'Only verified payments can be refunded.' });
      }

      const rules = loadPlatformRules(db);
      const maxRefundable = roundBDT(Number(tx.amount) - Number(tx.refunded_amount));
      const refundAmt = amount !== undefined ? roundBDT(Number(amount)) : maxRefundable;
      if (!Number.isFinite(refundAmt) || refundAmt <= 0 || refundAmt > maxRefundable) {
        return res.status(400).json({ error: `Invalid refund amount (max ৳${maxRefundable}).` });
      }
      if (refundAmt < Number(tx.amount) && !rules.refundAndDispute.allowPartialRefund) {
        return res.status(400).json({ error: 'Partial refunds are disabled by Admin policy.' });
      }

      const snap = db.prepare('SELECT * FROM booking_price_snapshots WHERE booking_id = ?').get(tx.booking_id) as any;
      const ratio = Number(tx.amount) > 0 ? refundAmt / Number(tx.amount) : 1;
      const techClawback = snap ? roundBDT(Number(snap.technician_earnings_amount) * ratio) : refundAmt;
      const now = new Date().toISOString();

      db.transaction(() => {
        const newRefundTotal = roundBDT(Number(tx.refunded_amount) + refundAmt);
        const newTxStatus = newRefundTotal >= Number(tx.amount) ? 'REFUNDED' : 'VERIFIED';

        db.prepare('UPDATE payment_transactions SET refunded_amount = ?, status = ? WHERE id = ?').run(
          newRefundTotal,
          newTxStatus,
          tx.id
        );

        if (newTxStatus === 'REFUNDED') {
          db.prepare("UPDATE bookings SET payment_status = 'REFUNDED', updated_at = ? WHERE id = ?").run(now, tx.booking_id);
        }

        const refId = uid('ref');
        db.prepare(`
          INSERT INTO refund_transactions (id, booking_id, payment_tx_id, amount, reason, refunded_by, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
        `).run(refId, tx.booking_id, tx.id, refundAmt, String(reason || 'Admin issued refund'), req.auth!.sub, now);

        db.prepare(`
          INSERT INTO wallet_ledger (id, technician_id, booking_id, payment_tx_id, entry_type, amount, direction, description, reference_key, created_by, created_at)
          VALUES (?, ?, ?, ?, 'REFUND_DEBIT', ?, 'DEBIT', ?, ?, ?, ?)
        `).run(
          uid('led'),
          tx.technician_id,
          tx.booking_id,
          tx.id,
          techClawback,
          `Refund debit (${refundAmt} BDT customer refund: ${reason || 'dispute'})`,
          `REFUND_${refId}`,
          req.auth!.sub,
          now
        );

        db.prepare(`
          INSERT INTO admin_audit_logs (id, admin_id, admin_name, section, action, target_id, previous_value, new_value, reason, created_at)
          VALUES (?, ?, ?, 'REFUNDS', 'ISSUE_REFUND', ?, ?, ?, ?, ?)
        `).run(uid('aud'), req.auth!.sub, req.auth!.name, tx.id, `paid:${tx.amount}`, `refunded:${newRefundTotal}`, String(reason || 'Refund'), now);
      })();

      return res.json({ success: true, refundedAmount: refundAmt });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Refund failed.' });
    }
  });

  // =========================================================================
  // 7. CASH ON COMPLETION — COLLECTION, DEPOSIT, OVERDUE & RESTRICTIONS
  // =========================================================================
  router.post('/cash/collect', requireAuth, requireRole('TECHNICIAN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const techId = req.auth!.techId;
      const { bookingId } = req.body || {};
      if (!bookingId) return res.status(400).json({ error: 'bookingId is required.' });

      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
      if (!booking) return res.status(404).json({ error: 'Booking not found.' });
      if (booking.technician_id !== techId) return res.status(403).json({ error: 'Forbidden' });

      const rules = loadPlatformRules(db);
      if (!rules.general.allowCashOnCompletion) {
        return res.status(400).json({ error: 'Cash on Completion is currently disabled by Admin.' });
      }

      const existing = db.prepare('SELECT * FROM cash_collections WHERE booking_id = ?').get(bookingId);
      if (existing) return res.json({ idempotent: true, cashCollection: existing });

      const snapshot = db.prepare('SELECT * FROM booking_price_snapshots WHERE booking_id = ?').get(bookingId) as any;
      if (!snapshot) return res.status(404).json({ error: 'Price snapshot missing.' });

      const nowDate = new Date();
      const deadlineDate = new Date(nowDate.getTime() + rules.cashOnCompletion.depositDeadlineHours * 3600_000);
      const graceDate = new Date(deadlineDate.getTime() + rules.cashOnCompletion.gracePeriodHours * 3600_000);

      const ccId = uid('cc');
      db.transaction(() => {
        db.prepare(`
          INSERT INTO cash_collections (
            id, booking_id, booking_number, technician_id, technician_name, customer_id,
            amount_collected, commission_amount, technician_share_amount,
            status, collected_at, deadline_at, grace_ends_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CASH_PENDING', ?, ?, ?)
        `).run(
          ccId,
          bookingId,
          booking.booking_number,
          techId,
          booking.technician_name,
          booking.customer_id,
          roundBDT(Number(snapshot.final_agreed_amount)),
          roundBDT(Number(snapshot.platform_commission_amount)),
          roundBDT(Number(snapshot.technician_earnings_amount)),
          nowDate.toISOString(),
          deadlineDate.toISOString(),
          graceDate.toISOString()
        );

        db.prepare("UPDATE bookings SET status = 'COMPLETED', payment_method = 'cash', payment_status = 'CASH_ON_SERVICE', updated_at = ? WHERE id = ?").run(
          nowDate.toISOString(),
          bookingId
        );
      })();

      const saved = db.prepare('SELECT * FROM cash_collections WHERE id = ?').get(ccId);
      return res.status(201).json({ cashCollection: saved });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to record cash collection.' });
    }
  });

  router.post('/cash/submit-deposit', requireAuth, requireRole('TECHNICIAN'), rateLimit(20, 60_000), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const techId = req.auth!.techId;
      const { cashCollectionId, channel, depositReference, amountDeposited, merchantAccountInfo, note } = req.body || {};
      if (!cashCollectionId || !channel || !depositReference) {
        return res.status(400).json({ error: 'cashCollectionId, channel, and depositReference are required.' });
      }

      const refValidation = validateDepositReferenceFormat(String(channel), String(depositReference));
      if (!refValidation.valid) {
        return res.status(400).json({ error: refValidation.reason });
      }

      const cc = db.prepare('SELECT * FROM cash_collections WHERE id = ?').get(cashCollectionId) as any;
      if (!cc) return res.status(404).json({ error: 'Cash collection record not found.' });
      if (cc.technician_id !== techId) {
        return res.status(403).json({ error: 'Forbidden: cannot submit deposit for another technician booking.' });
      }
      if (['PAYMENT_VERIFIED', 'EARNINGS_CREDITED', 'COMMISSION_RECORDED'].includes(cc.status)) {
        return res.status(400).json({ error: 'Cash deposit for this booking is already verified.' });
      }

      const amt = roundBDT(Number(amountDeposited));
      if (amt !== roundBDT(Number(cc.amount_collected))) {
        return res.status(400).json({
          error: `Technician must deposit full collected cash ৳${cc.amount_collected} (received ৳${amt}).`,
        });
      }

      // Duplicate deposit reference check across ALL bookings/technicians
      const dupRef = db
        .prepare('SELECT id, booking_id FROM cash_deposits WHERE LOWER(deposit_reference) = LOWER(?)')
        .get(String(depositReference).trim()) as any;
      if (dupRef) {
        return res.status(409).json({
          error: `Duplicate deposit reference "${depositReference}" already used for booking ${dupRef.booking_id}. A reference can only reconcile one collection.`,
        });
      }

      const depId = uid('dep');
      const now = new Date().toISOString();

      db.transaction(() => {
        db.prepare(`
          INSERT INTO cash_deposits (
            id, cash_collection_id, booking_id, technician_id, channel, deposit_reference,
            amount_deposited, merchant_account_info, note, status, submitted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFICATION_PENDING', ?)
        `).run(
          depId,
          cc.id,
          cc.booking_id,
          techId,
          String(channel),
          String(depositReference).trim(),
          amt,
          merchantAccountInfo ? String(merchantAccountInfo) : null,
          note ? String(note) : null,
          now
        );

        db.prepare("UPDATE cash_collections SET status = 'VERIFICATION_PENDING' WHERE id = ?").run(cc.id);
      })();

      const savedDeposit = db.prepare('SELECT * FROM cash_deposits WHERE id = ?').get(depId);
      return res.status(201).json({ deposit: savedDeposit, status: 'VERIFICATION_PENDING' });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to submit cash deposit reference.' });
    }
  });

  router.post('/admin/cash/:depositId/verify', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { depositId } = req.params;
      const { decision, reason } = req.body || {};
      if (!['APPROVE', 'REJECT', 'DISPUTE'].includes(decision)) {
        return res.status(400).json({ error: 'decision must be APPROVE, REJECT, or DISPUTE.' });
      }

      const dep = db.prepare('SELECT * FROM cash_deposits WHERE id = ?').get(depositId) as any;
      if (!dep) return res.status(404).json({ error: 'Cash deposit record not found.' });

      if (['PAYMENT_VERIFIED', 'EARNINGS_CREDITED', 'COMMISSION_RECORDED'].includes(dep.status)) {
        return res.status(400).json({ error: 'Deposit is already verified.' });
      }

      const now = new Date().toISOString();

      db.transaction(() => {
        if (decision === 'APPROVE') {
          db.prepare(
            "UPDATE cash_deposits SET status = 'COMMISSION_RECORDED', verified_at = ?, verified_by = ? WHERE id = ?"
          ).run(now, req.auth!.sub, dep.id);

          db.prepare("UPDATE cash_collections SET status = 'COMMISSION_RECORDED' WHERE id = ?").run(dep.cash_collection_id);
          db.prepare("UPDATE bookings SET payment_status = 'PAID', updated_at = ? WHERE id = ?").run(now, dep.booking_id);

          postBookingEarningsAndCommission(db, dep.booking_id, null, dep.cash_collection_id, req.auth!.sub);

          // Check if technician still has any overdue unresolved deposits; if cleared, restore booking access!
          const remainingOverdue = db
            .prepare("SELECT COUNT(*) as c FROM cash_collections WHERE technician_id = ? AND status = 'OVERDUE'")
            .get(dep.technician_id) as { c: number };
          if (remainingOverdue.c === 0) {
            db.prepare('UPDATE wallets SET booking_restricted = 0, restriction_reason = NULL, updated_at = ? WHERE technician_id = ?').run(
              now,
              dep.technician_id
            );
          }
        } else {
          const nextStatus = decision === 'REJECT' ? 'REJECTED' : 'DISPUTED';
          db.prepare('UPDATE cash_deposits SET status = ?, rejection_reason = ?, verified_by = ? WHERE id = ?').run(
            nextStatus,
            String(reason || 'Deposit mismatch during merchant reconciliation'),
            req.auth!.sub,
            dep.id
          );
          db.prepare('UPDATE cash_collections SET status = ?, dispute_note = ? WHERE id = ?').run(
            nextStatus,
            String(reason || ''),
            dep.cash_collection_id
          );
        }

        db.prepare(`
          INSERT INTO admin_audit_logs (id, admin_id, admin_name, section, action, target_id, previous_value, new_value, reason, created_at)
          VALUES (?, ?, ?, 'CASH_RECONCILIATION', ?, ?, ?, ?, ?, ?)
        `).run(
          uid('aud'),
          req.auth!.sub,
          req.auth!.name,
          `CASH_${decision}`,
          dep.id,
          dep.status,
          decision === 'APPROVE' ? 'COMMISSION_RECORDED' : decision,
          String(reason || `Merchant ref ${dep.deposit_reference}`),
          now
        );
      })();

      return res.json({ success: true, decision });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to verify cash deposit.' });
    }
  });

  // Evaluate overdue cash collections and apply configured booking restriction after deadline + grace + review
  router.post('/admin/cash/check-overdue', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const rules = loadPlatformRules(db);
      const asOfIso = req.body?.asOf ? new Date(String(req.body.asOf)).toISOString() : new Date().toISOString();
      const restrictIfPastGrace = Boolean(req.body?.applyRestrictionAfterReview ?? rules.cashOnCompletion.restrictNewBookingsAfterOverdueReview);

      const overdueRows = db
        .prepare(
          "SELECT * FROM cash_collections WHERE status IN ('CASH_PENDING','CASH_COLLECTED','REJECTED') AND deadline_at < ?"
        )
        .all(asOfIso) as any[];

      let markedOverdue = 0;
      let restrictedTechs: string[] = [];

      db.transaction(() => {
        for (const row of overdueRows) {
          db.prepare(
            "UPDATE cash_collections SET status = 'OVERDUE', overdue_at = COALESCE(overdue_at, ?), reminder_count = reminder_count + 1, last_reminder_at = ? WHERE id = ?"
          ).run(asOfIso, asOfIso, row.id);
          markedOverdue++;

          if (restrictIfPastGrace && row.grace_ends_at < asOfIso) {
            db.prepare('UPDATE cash_collections SET booking_restricted_applied = 1 WHERE id = ?').run(row.id);
            db.prepare(
              'UPDATE wallets SET booking_restricted = 1, restriction_reason = ?, updated_at = ? WHERE technician_id = ?'
            ).run(
              `Overdue cash deposit for booking #${row.booking_number} (৳${row.amount_collected}) past deadline & grace period`,
              asOfIso,
              row.technician_id
            );
            restrictedTechs.push(row.technician_id);
          }
        }
      })();

      return res.json({ markedOverdue, restrictedTechs: Array.from(new Set(restrictedTechs)) });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Overdue check failed.' });
    }
  });

  router.post('/admin/technicians/:techId/restrict', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { restricted, reason } = req.body || {};
      const now = new Date().toISOString();
      db.prepare('UPDATE wallets SET booking_restricted = ?, restriction_reason = ?, updated_at = ? WHERE technician_id = ?').run(
        restricted ? 1 : 0,
        restricted ? String(reason || 'Restricted by Admin') : null,
        now,
        req.params.techId
      );
      db.prepare(`
        INSERT INTO admin_audit_logs (id, admin_id, admin_name, section, action, target_id, previous_value, new_value, reason, created_at)
        VALUES (?, ?, ?, 'CASH_RESTRICTION', 'SET_TECH_RESTRICTION', ?, '', ?, ?, ?)
      `).run(uid('aud'), req.auth!.sub, req.auth!.name, req.params.techId, String(Boolean(restricted)), String(reason || ''), now);
      return res.json({ success: true, restricted: Boolean(restricted) });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to update restriction.' });
    }
  });

  // =========================================================================
  // 8. TECHNICIAN WALLET, MINIMUM RESERVE (৳500) & WITHDRAWAL WORKFLOW
  // =========================================================================
  router.get('/wallet', requireAuth, requireRole('TECHNICIAN', 'ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const requestedTechId = req.query.technicianId ? String(req.query.technicianId) : null;
      if (req.auth!.role !== 'ADMIN' && requestedTechId && requestedTechId !== req.auth!.techId) {
        return res.status(403).json({
          error: 'Forbidden: you can only view your own wallet, earnings, and ledger.',
        });
      }
      const targetTechId =
        req.auth!.role === 'ADMIN' && requestedTechId
          ? requestedTechId
          : req.auth!.techId;

      if (!targetTechId) return res.status(400).json({ error: 'Technician ID required.' });

      const wallet = getWalletSummary(db, targetTechId);
      const rules = loadPlatformRules(db);

      const ledgerEntries = db
        .prepare(
          `SELECT id, technician_id as technicianId, booking_id as bookingId, withdrawal_id as withdrawalId,
           payment_tx_id as paymentTxId, cash_collection_id as cashCollectionId,
           entry_type as entryType, amount, direction, description, reference_key as referenceKey,
           created_by as createdBy, created_at as createdAt
           FROM wallet_ledger WHERE technician_id = ? ORDER BY created_at DESC LIMIT 100`
        )
        .all(targetTechId);

      const payoutAccounts = db
        .prepare(
          `SELECT id, technician_id as technicianId, provider, account_title as accountTitle,
           account_number as accountNumber, bank_name as bankName, branch_name as branchName,
           routing_number as routingNumber, verification_status as verificationStatus,
           verification_note as verificationNote, is_default as isDefault, created_at as createdAt,
           verified_at as verifiedAt
           FROM payout_accounts WHERE technician_id = ? ORDER BY is_default DESC, created_at DESC`
        )
        .all(targetTechId)
        .map((p: any) => ({ ...p, isDefault: Boolean(p.isDefault) }));

      const withdrawals = db
        .prepare(
          `SELECT id, technician_id as technicianId, payout_account_id as payoutAccountId, provider,
           account_number_masked as accountNumberMasked, requested_amount as requestedAmount,
           fee_amount as feeAmount, net_payout_amount as netPayoutAmount, status,
           idempotency_key as idempotencyKey, provider_reference as providerReference,
           admin_note as adminNote, failure_reason as failureReason,
           requested_at as requestedAt, processed_at as processedAt, processed_by as processedBy
           FROM withdrawal_requests WHERE technician_id = ? ORDER BY requested_at DESC LIMIT 50`
        )
        .all(targetTechId);

      const cashCollections = db
        .prepare(
          `SELECT cc.id, cc.booking_id as bookingId, cc.booking_number as bookingNumber,
           cc.technician_id as technicianId, cc.technician_name as technicianName, cc.customer_id as customerId,
           cc.amount_collected as amountCollected, cc.commission_amount as commissionAmount,
           cc.technician_share_amount as technicianShareAmount, cc.status,
           cc.collected_at as collectedAt, cc.deadline_at as deadlineAt, cc.grace_ends_at as graceEndsAt,
           cc.overdue_at as overdueAt, cc.reminder_count as reminderCount, cc.booking_restricted_applied as bookingRestrictedApplied,
           cd.id as depositId, cd.channel as depositChannel, cd.deposit_reference as depositReference,
           cd.amount_deposited as amountDeposited, cd.status as depositStatus,
           cd.submitted_at as depositSubmittedAt, cd.rejection_reason as depositRejectionReason
           FROM cash_collections cc LEFT JOIN cash_deposits cd ON cd.cash_collection_id = cc.id
           WHERE cc.technician_id = ? ORDER BY cc.collected_at DESC`
        )
        .all(targetTechId)
        .map((r: any) => ({
          ...r,
          bookingRestrictedApplied: Boolean(r.bookingRestrictedApplied),
          deposit: r.depositId
            ? {
                id: r.depositId,
                cashCollectionId: r.id,
                bookingId: r.bookingId,
                technicianId: r.technicianId,
                channel: r.depositChannel,
                depositReference: r.depositReference,
                amountDeposited: r.amountDeposited,
                status: r.depositStatus,
                submittedAt: r.depositSubmittedAt,
                rejectionReason: r.depositRejectionReason,
              }
            : null,
        }));

      const todayDate = new Date().toISOString().split('T')[0];
      const weekAgoDate = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().split('T')[0];
      const monthPrefix = todayDate.slice(0, 7);

      const periodRows = db
        .prepare(
          `SELECT b.date,
                  COALESCE(s.technician_earnings_amount, b.final_total, 0) as techNet
           FROM bookings b
           LEFT JOIN booking_price_snapshots s ON s.booking_id = b.id
           WHERE b.technician_id = ? AND b.status = 'COMPLETED'`
        )
        .all(targetTechId) as Array<{ date: string; techNet: number }>;

      let todayEarnings = 0;
      let todayCompletedCount = 0;
      let weekEarnings = 0;
      let monthEarnings = 0;
      let monthCompletedCount = 0;

      for (const row of periodRows) {
        const net = roundBDT(Number(row.techNet || 0));
        const d = String(row.date || '');
        if (d === todayDate) {
          todayEarnings = roundBDT(todayEarnings + net);
          todayCompletedCount += 1;
        }
        if (d >= weekAgoDate && d <= todayDate) {
          weekEarnings = roundBDT(weekEarnings + net);
        }
        if (d.startsWith(monthPrefix)) {
          monthEarnings = roundBDT(monthEarnings + net);
          monthCompletedCount += 1;
        }
      }

      return res.json({
        wallet,
        periodStats: {
          todayEarnings,
          todayCompletedCount,
          weekEarnings,
          monthEarnings,
          monthCompletedCount,
          totalCompletedCount: periodRows.length,
        },
        reservePolicy: {
          globalMinimumReserveBalance: rules.walletAndReserve.globalMinimumReserveBalance,
          minimumWithdrawalAmount: rules.walletAndReserve.minimumWithdrawalAmount,
          maximumWithdrawalAmount: rules.walletAndReserve.maximumWithdrawalAmount,
          withdrawalFeePercent: rules.withdrawal.withdrawalFeePercent,
          withdrawalFlatFee: rules.withdrawal.withdrawalFlatFee,
          allowedPayoutProviders: rules.withdrawal.allowedPayoutProviders,
          approvedDepositChannels: rules.cashOnCompletion.approvedDepositChannels,
          depositDeadlineHours: rules.cashOnCompletion.depositDeadlineHours,
        },
        ledgerEntries,
        payoutAccounts,
        withdrawals,
        cashCollections,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to load wallet dashboard.' });
    }
  });

  router.post('/wallet/payout-accounts', requireAuth, requireRole('TECHNICIAN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const techId = req.auth!.techId;
      if (!techId) return res.status(400).json({ error: 'Technician account required.' });

      const { provider, accountTitle, accountNumber, bankName, branchName, routingNumber } = req.body || {};
      const validProviders: PayoutProvider[] = ['bkash', 'nagad', 'rocket', 'bank'];
      if (!validProviders.includes(provider)) return res.status(400).json({ error: 'Unsupported payout provider.' });

      const rules = loadPlatformRules(db);
      if (!rules.withdrawal.allowedPayoutProviders[provider as PayoutProvider]) {
        return res.status(400).json({ error: `Payout provider ${provider} is currently disabled.` });
      }

      if (!accountTitle || !accountNumber || String(accountNumber).trim().length < 8) {
        return res.status(400).json({ error: 'Valid accountTitle and accountNumber are required.' });
      }
      if (provider === 'bank' && (!bankName || !branchName)) {
        return res.status(400).json({ error: 'Bank Name and Branch Name are required for bank accounts.' });
      }

      const id = uid('pa');
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO payout_accounts (id, technician_id, provider, account_title, account_number, bank_name, branch_name, routing_number, verification_status, is_default, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?)
      `).run(
        id,
        techId,
        provider,
        String(accountTitle).trim(),
        String(accountNumber).trim(),
        bankName ? String(bankName).trim() : null,
        branchName ? String(branchName).trim() : null,
        routingNumber ? String(routingNumber).trim() : null,
        now
      );

      return res.status(201).json({ id, verificationStatus: 'PENDING' });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to add payout account.' });
    }
  });

  router.post('/admin/payout-accounts/:id/verify', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { status, note } = req.body || {};
      if (!['VERIFIED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'status must be VERIFIED or REJECTED.' });
      }
      const now = new Date().toISOString();
      db.prepare('UPDATE payout_accounts SET verification_status = ?, verification_note = ?, verified_at = ? WHERE id = ?').run(
        status,
        note ? String(note) : null,
        status === 'VERIFIED' ? now : null,
        req.params.id
      );
      return res.json({ success: true, status });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to verify payout account.' });
    }
  });

  // ATOMIC WITHDRAWAL REQUEST (Strict Reserve Enforcement + Concurrency Safety)
  router.post('/wallet/withdraw', requireAuth, requireRole('TECHNICIAN'), rateLimit(15, 60_000), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const techId = req.auth!.techId;
      if (!techId) return res.status(400).json({ error: 'Technician profile not found.' });

      const { payoutAccountId, amount, idempotencyKey } = req.body || {};
      const requestedAmount = roundBDT(Number(amount));
      if (!payoutAccountId || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        return res.status(400).json({ error: 'Valid payoutAccountId and positive amount are required.' });
      }

      const idem = String(idempotencyKey || `${techId}-${payoutAccountId}-${Date.now()}`).trim();

      // Execute ENTIRE check + ledger hold inside immediate exclusive SQLite transaction to block race conditions!
      const result = db.transaction(() => {
        const existingIdem = db.prepare('SELECT * FROM withdrawal_requests WHERE idempotency_key = ?').get(idem) as any;
        if (existingIdem) {
          return { idempotent: true, withdrawal: existingIdem };
        }

        const rules = loadPlatformRules(db);
        const account = db.prepare('SELECT * FROM payout_accounts WHERE id = ?').get(payoutAccountId) as any;
        if (!account || account.technician_id !== techId) {
          throw new Error('Payout account not found or does not belong to your account.');
        }
        if (rules.withdrawal.requireVerifiedPayoutAccount && account.verification_status !== 'VERIFIED') {
          throw new Error('Selected payout account must be Admin-verified before requesting a withdrawal.');
        }
        if (!rules.withdrawal.allowedPayoutProviders[account.provider as PayoutProvider]) {
          throw new Error(`Payout provider ${account.provider} is disabled.`);
        }

        if (requestedAmount < rules.walletAndReserve.minimumWithdrawalAmount) {
          throw new Error(
            `Minimum withdrawal amount is ৳${rules.walletAndReserve.minimumWithdrawalAmount} (requested ৳${requestedAmount}).`
          );
        }
        if (requestedAmount > rules.walletAndReserve.maximumWithdrawalAmount) {
          throw new Error(
            `Maximum withdrawal amount per request is ৳${rules.walletAndReserve.maximumWithdrawalAmount} (requested ৳${requestedAmount}).`
          );
        }

        // Frequency limit check
        const oneDayAgo = new Date(Date.now() - 24 * 3600_000).toISOString();
        const dailyCount = db
          .prepare(
            "SELECT COUNT(*) as c FROM withdrawal_requests WHERE technician_id = ? AND requested_at >= ? AND status NOT IN ('FAILED','REJECTED')"
          )
          .get(techId, oneDayAgo) as { c: number };
        if (dailyCount.c >= rules.withdrawal.maxRequestsPerDay) {
          throw new Error(`Daily withdrawal limit reached (max ${rules.withdrawal.maxRequestsPerDay} requests per 24 hours).`);
        }

        const wallet = getWalletSummary(db, techId);
        if (requestedAmount > wallet.withdrawableBalance) {
          throw new Error(
            `Insufficient withdrawable balance. Available: ৳${wallet.availableBalance}, Minimum Reserve: ৳${wallet.reservedBalance}, Max Withdrawable: ৳${wallet.withdrawableBalance}.`
          );
        }

        const feeAmount = roundBDT(
          (requestedAmount * rules.withdrawal.withdrawalFeePercent) / 100 + rules.withdrawal.withdrawalFlatFee
        );
        const netPayoutAmount = roundBDT(Math.max(0, requestedAmount - feeAmount));
        const wId = uid('wdr');
        const now = new Date().toISOString();
        const acctNum = String(account.account_number);
        const masked = acctNum.length > 4 ? `${'*'.repeat(acctNum.length - 4)}${acctNum.slice(-4)}` : acctNum;

        const initialStatus =
          requestedAmount >= rules.withdrawal.autoReviewAboveAmount ? 'UNDER_REVIEW' : 'PENDING';

        db.prepare(`
          INSERT INTO withdrawal_requests (
            id, technician_id, payout_account_id, provider, account_number_masked,
            requested_amount, fee_amount, net_payout_amount, status, idempotency_key, requested_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(wId, techId, account.id, account.provider, masked, requestedAmount, feeAmount, netPayoutAmount, initialStatus, idem, now);

        // Atomically reserve the funds from available balance in append-only ledger!
        db.prepare(`
          INSERT INTO wallet_ledger (
            id, technician_id, withdrawal_id, entry_type, amount, direction, description, reference_key, created_by, created_at
          ) VALUES (?, ?, ?, 'WITHDRAWAL_RESERVED', ?, 'HOLD', ?, ?, ?, ?)
        `).run(
          uid('led'),
          techId,
          wId,
          requestedAmount,
          `Funds reserved for ${account.provider.toUpperCase()} withdrawal (${masked})`,
          `WDR_RES_${wId}`,
          req.auth!.sub,
          now
        );

        return {
          idempotent: false,
          withdrawal: db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(wId),
          walletAfter: getWalletSummary(db, techId),
        };
      }).immediate();

      return res.status(result.idempotent ? 200 : 201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Withdrawal request rejected.' });
    }
  });

  router.post('/admin/withdrawals/:id/action', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { action, providerReference, note } = req.body || {};
      const validActions = ['UNDER_REVIEW', 'PROCESSING', 'COMPLETE', 'FAIL', 'REJECT', 'REVERSE'];
      if (!validActions.includes(action)) {
        return res.status(400).json({ error: `Invalid action. Allowed: ${validActions.join(', ')}` });
      }

      const w = db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').get(id) as any;
      if (!w) return res.status(404).json({ error: 'Withdrawal request not found.' });

      if (action === 'COMPLETE' && (!providerReference || String(providerReference).trim().length < 4)) {
        return res.status(400).json({ error: 'providerReference from payout channel is required before marking withdrawal COMPLETED.' });
      }

      const now = new Date().toISOString();

      db.transaction(() => {
        if (action === 'UNDER_REVIEW' || action === 'PROCESSING') {
          if (!['PENDING', 'UNDER_REVIEW'].includes(w.status)) {
            throw new Error(`Cannot transition withdrawal from ${w.status} to ${action}.`);
          }
          db.prepare('UPDATE withdrawal_requests SET status = ?, admin_note = ? WHERE id = ?').run(
            action,
            note ? String(note) : w.admin_note,
            id
          );
        } else if (action === 'COMPLETE') {
          if (!['PENDING', 'UNDER_REVIEW', 'PROCESSING'].includes(w.status)) {
            throw new Error(`Withdrawal already finalized (${w.status}).`);
          }
          db.prepare(
            "UPDATE withdrawal_requests SET status = 'COMPLETED', provider_reference = ?, admin_note = ?, processed_at = ?, processed_by = ? WHERE id = ?"
          ).run(String(providerReference).trim(), note ? String(note) : null, now, req.auth!.sub, id);

          db.prepare(`
            INSERT INTO wallet_ledger (id, technician_id, withdrawal_id, entry_type, amount, direction, description, reference_key, created_by, created_at)
            VALUES (?, ?, ?, 'WITHDRAWAL_COMPLETED', ?, 'DEBIT', ?, ?, ?, ?)
          `).run(
            uid('led'),
            w.technician_id,
            id,
            Number(w.requested_amount),
            `Withdrawal completed (${w.provider.toUpperCase()} ref: ${providerReference})`,
            `WDR_COMP_${id}`,
            req.auth!.sub,
            now
          );
        } else {
          // FAIL / REJECT / REVERSE -> Atomically restore reserved balance back to technician available balance!
          const nextStatus = action === 'FAIL' ? 'FAILED' : action === 'REJECT' ? 'REJECTED' : 'REVERSED';
          if (['FAILED', 'REJECTED', 'REVERSED'].includes(w.status)) {
            throw new Error(`Withdrawal is already ${w.status}.`);
          }
          db.prepare(
            'UPDATE withdrawal_requests SET status = ?, failure_reason = ?, processed_at = ?, processed_by = ? WHERE id = ?'
          ).run(nextStatus, String(note || `${nextStatus} by Admin`), now, req.auth!.sub, id);

          db.prepare(`
            INSERT INTO wallet_ledger (id, technician_id, withdrawal_id, entry_type, amount, direction, description, reference_key, created_by, created_at)
            VALUES (?, ?, ?, 'WITHDRAWAL_RESTORED', ?, 'RELEASE', ?, ?, ?, ?)
          `).run(
            uid('led'),
            w.technician_id,
            id,
            Number(w.requested_amount),
            `Reserved withdrawal funds restored (${nextStatus}: ${note || 'provider failure'})`,
            `WDR_REST_${id}`,
            req.auth!.sub,
            now
          );
        }

        db.prepare(`
          INSERT INTO admin_audit_logs (id, admin_id, admin_name, section, action, target_id, previous_value, new_value, reason, created_at)
          VALUES (?, ?, ?, 'WITHDRAWALS', ?, ?, ?, ?, ?, ?)
        `).run(uid('aud'), req.auth!.sub, req.auth!.name, `WDR_${action}`, id, w.status, action, String(note || providerReference || action), now);
      })();

      return res.json({ success: true, action, walletAfter: getWalletSummary(db, w.technician_id) });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Withdrawal action failed.' });
    }
  });

  router.put('/admin/technicians/:techId/reserve', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const db = getDb();
      const { customReserveBalance, reason } = req.body || {};
      const val = customReserveBalance === null || customReserveBalance === '' ? null : roundBDT(Number(customReserveBalance));
      if (val !== null && (!Number.isFinite(val) || val < 0)) {
        return res.status(400).json({ error: 'Reserve balance must be >= 0 or null.' });
      }
      const now = new Date().toISOString();
      db.prepare('UPDATE wallets SET custom_reserve_balance = ?, updated_at = ? WHERE technician_id = ?').run(val, now, req.params.techId);
      db.prepare(`
        INSERT INTO admin_audit_logs (id, admin_id, admin_name, section, action, target_id, previous_value, new_value, reason, created_at)
        VALUES (?, ?, ?, 'WALLET_RESERVE', 'SET_TECH_RESERVE', ?, '', ?, ?, ?)
      `).run(uid('aud'), req.auth!.sub, req.auth!.name, req.params.techId, String(val), String(reason || 'Admin reserve update'), now);
      return res.json({ success: true, wallet: getWalletSummary(db, req.params.techId) });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to update technician reserve.' });
    }
  });

  // =========================================================================
  // 9. ADMIN FINANCIAL MANAGEMENT OVERVIEW, FILTERS & CSV EXPORT
  // =========================================================================
  router.get('/admin/finance/overview', requireAuth, requireRole('ADMIN'), (req, res) => {
    try {
      const db = getDb();
      const summary = getAdminFinancialSummary(db);

      const search = String(req.query.search || '').trim();
      const technicianFilter = String(req.query.technicianId || '').trim();
      const statusFilter = String(req.query.status || '').trim();
      const dateFrom = String(req.query.dateFrom || '').trim();
      const dateTo = String(req.query.dateTo || '').trim();

      const techWallets = (db.prepare('SELECT id, name, phone, primary_area as primaryArea FROM technicians ORDER BY name ASC').all() as any[]).map((t) => ({
        ...t,
        wallet: getWalletSummary(db, t.id),
      }));

      const withdrawals = db
        .prepare(
          `SELECT w.id, w.technician_id as technicianId, t.name as technicianName,
           w.payout_account_id as payoutAccountId, w.provider, w.account_number_masked as accountNumberMasked,
           w.requested_amount as requestedAmount, w.fee_amount as feeAmount, w.net_payout_amount as netPayoutAmount,
           w.status, w.provider_reference as providerReference, w.admin_note as adminNote, w.failure_reason as failureReason,
           w.requested_at as requestedAt, w.processed_at as processedAt
           FROM withdrawal_requests w LEFT JOIN technicians t ON t.id = w.technician_id
           ORDER BY CASE WHEN w.status IN ('PENDING','UNDER_REVIEW','PROCESSING') THEN 0 ELSE 1 END, w.requested_at DESC LIMIT 100`
        )
        .all();

      const cashDeposits = db
        .prepare(
          `SELECT cc.id as cashCollectionId, cc.booking_id as bookingId, cc.booking_number as bookingNumber,
           cc.technician_id as technicianId, cc.technician_name as technicianName,
           cc.amount_collected as amountCollected, cc.commission_amount as commissionAmount,
           cc.technician_share_amount as technicianShareAmount, cc.status, cc.collected_at as collectedAt,
           cc.deadline_at as deadlineAt, cc.grace_ends_at as graceEndsAt, cc.overdue_at as overdueAt,
           cc.booking_restricted_applied as bookingRestrictedApplied,
           cd.id as depositId, cd.channel, cd.deposit_reference as depositReference,
           cd.amount_deposited as amountDeposited, cd.status as depositStatus,
           cd.submitted_at as submittedAt, cd.verified_at as verifiedAt, cd.rejection_reason as rejectionReason
           FROM cash_collections cc LEFT JOIN cash_deposits cd ON cd.cash_collection_id = cc.id
           ORDER BY CASE WHEN cc.status IN ('OVERDUE','VERIFICATION_PENDING') THEN 0 ELSE 1 END, cc.collected_at DESC LIMIT 100`
        )
        .all();

      const payoutAccountsPending = db
        .prepare(
          `SELECT pa.id, pa.technician_id as technicianId, t.name as technicianName, pa.provider,
           pa.account_title as accountTitle, pa.account_number as accountNumber, pa.bank_name as bankName,
           pa.verification_status as verificationStatus, pa.created_at as createdAt
           FROM payout_accounts pa LEFT JOIN technicians t ON t.id = pa.technician_id
           ORDER BY CASE WHEN pa.verification_status = 'PENDING' THEN 0 ELSE 1 END, pa.created_at DESC`
        )
        .all();

      // Filtered payment & booking ledger view
      const whereParts: string[] = ['1=1'];
      const params: any[] = [];
      if (technicianFilter) {
        whereParts.push('s.technician_id = ?');
        params.push(technicianFilter);
      }
      if (statusFilter) {
        whereParts.push('b.payment_status = ?');
        params.push(statusFilter);
      }
      if (dateFrom) {
        whereParts.push('b.created_at >= ?');
        params.push(dateFrom);
      }
      if (dateTo) {
        whereParts.push('b.created_at <= ?');
        params.push(`${dateTo}T23:59:59Z`);
      }
      if (search) {
        whereParts.push('(b.booking_number LIKE ? OR b.customer_name LIKE ? OR b.technician_name LIKE ? OR b.service_name_en LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      const transactions = db
        .prepare(
          `SELECT b.id as bookingId, b.booking_number as bookingNumber, b.customer_name as customerName,
           b.technician_id as technicianId, b.technician_name as technicianName,
           b.service_name_en as serviceNameEn, b.category_id as categoryId, b.status as bookingStatus,
           b.payment_method as paymentMethod, b.payment_status as paymentStatus, b.created_at as createdAt,
           s.service_price as servicePrice, s.visiting_fee as visitingFee, s.material_cost as materialCost,
           s.additional_charges_total as additionalChargesTotal, s.discount_amount as discountAmount,
           s.commissionable_amount as commissionableAmount,
           s.platform_commission_percent as platformCommissionPercent,
           s.platform_commission_amount as platformCommissionAmount,
           s.technician_earnings_amount as technicianEarningsAmount,
           s.final_agreed_amount as finalAgreedAmount, s.rule_version as ruleVersion
           FROM bookings b
           LEFT JOIN booking_price_snapshots s ON s.booking_id = b.id
           WHERE ${whereParts.join(' AND ')}
           ORDER BY b.created_at DESC LIMIT 100`
        )
        .all(...params);

      const paymentTransactions = db
        .prepare(
          `SELECT id, booking_id as bookingId, customer_id as customerId, technician_id as technicianId,
           method, amount, status, provider_tx_id as providerTxId, provider_mode as providerMode,
           created_at as createdAt, verified_at as verifiedAt, refunded_amount as refundedAmount
           FROM payment_transactions ORDER BY created_at DESC LIMIT 50`
        )
        .all();

      return res.json({
        summary,
        techWallets,
        withdrawals,
        cashDeposits,
        payoutAccounts: payoutAccountsPending,
        transactions,
        paymentTransactions,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to load financial overview.' });
    }
  });

  router.get('/admin/finance/export', requireAuth, requireRole('ADMIN'), (_req, res) => {
    try {
      const db = getDb();
      const rows = db
        .prepare(
          `SELECT b.booking_number, b.created_at, b.customer_name, b.technician_name, b.service_name_en,
           b.status, b.payment_method, b.payment_status,
           s.service_price, s.visiting_fee, s.material_cost, s.discount_amount,
           s.commissionable_amount, s.platform_commission_amount, s.technician_earnings_amount, s.final_agreed_amount
           FROM bookings b LEFT JOIN booking_price_snapshots s ON s.booking_id = b.id
           ORDER BY b.created_at DESC`
        )
        .all() as any[];

      const header = [
        'Booking Number',
        'Date',
        'Customer',
        'Technician',
        'Service',
        'Booking Status',
        'Payment Method',
        'Payment Status',
        'Service Price (BDT)',
        'Visiting Fee (BDT)',
        'Material Cost (BDT)',
        'Discount (BDT)',
        'Commissionable (BDT)',
        'Servexa Commission (BDT)',
        'Technician Earnings (BDT)',
        'Final Total (BDT)',
      ];
      const csvEscape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csvLines = [
        header.join(','),
        ...rows.map((r) =>
          [
            r.booking_number,
            r.created_at,
            r.customer_name,
            r.technician_name,
            r.service_name_en,
            r.status,
            r.payment_method,
            r.payment_status,
            r.service_price,
            r.visiting_fee,
            r.material_cost,
            r.discount_amount,
            r.commissionable_amount,
            r.platform_commission_amount,
            r.technician_earnings_amount,
            r.final_agreed_amount,
          ]
            .map(csvEscape)
            .join(',')
        ),
      ];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="servexa-financial-ledger.csv"');
      return res.send(csvLines.join('\n'));
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'CSV export failed.' });
    }
  });

  return router;
}
