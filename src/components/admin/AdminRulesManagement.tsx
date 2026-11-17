import React, { useEffect, useState } from 'react';
import {
  Shield,
  Sliders,
  Percent,
  Wallet,
  CreditCard,
  Banknote,
  Layers,
  Plus,
  Check,
  X,
  AlertTriangle,
  History,
  CheckCircle2,
  Edit3,
  Save,
  RefreshCw,
} from 'lucide-react';
import {
  createAdminCategory,
  createAdminSubcategory,
  fetchAdminRules,
  fetchAdminTechPricingQueue,
  fetchAuditLogs,
  fetchCatalogOverview,
  reviewTechPricing,
  updateAdminPricingRule,
  updateAdminRules,
} from '../../services/financeApi';
import type {
  AdminAuditLog,
  CustomizationPermission,
  PaymentMethodCode,
  PayoutProvider,
  PlatformRules,
  PricingFieldKey,
  PricingRule,
  RuleVersionRecord,
  ServiceSubcategory,
} from '../../types/finance';
import type { ServiceCategory } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const getPermOptions = (isBangla: boolean): { value: CustomizationPermission; label: string }[] => [
  {
    value: 'ADMIN_CONTROLLED',
    label: isBangla ? 'অ্যাডমিন নিয়ন্ত্রিত (লকড)' : 'Admin Controlled (Locked)',
  },
  {
    value: 'TECH_CUSTOMIZABLE_RANGE',
    label: isBangla ? 'টেকনিশিয়ান কাস্টমাইজেবল (সর্বনিম্ন–সর্বোচ্চ সীমা)' : 'Tech Customizable (Min–Max Range)',
  },
  {
    value: 'TECH_CUSTOMIZABLE_APPROVAL',
    label: isBangla ? 'টেকনিশিয়ান কাস্টমাইজেবল (অনুমোদন প্রয়োজন)' : 'Tech Customizable (Requires Approval)',
  },
  {
    value: 'FIXED_NO_CUSTOMIZATION',
    label: isBangla ? 'নির্ধারিত প্ল্যাটফর্ম মূল্য (পরিবর্তনযোগ্য নয়)' : 'Fixed Platform Price (No Customization)',
  },
];

export const AdminRulesManagement: React.FC = () => {
  const { isBangla } = useLanguage();
  const { authTokenReady, currentUser } = useAuth();
  const permOptions = getPermOptions(isBangla);

  const formatPermLabel = (perm: CustomizationPermission | string) => {
    const found = permOptions.find((o) => o.value === perm);
    return found ? found.label : perm;
  };

  const formatPricingField = (field: PricingFieldKey) => {
    if (!isBangla) {
      if (field === 'servicePrice') return 'Service Price';
      if (field === 'visitingFee') return 'Visiting Fee';
      if (field === 'hourlyRate') return 'Hourly Rate';
      if (field === 'emergencyCharge') return 'Emergency Charge';
      return field;
    }
    if (field === 'servicePrice') return 'সার্ভিস চার্জ';
    if (field === 'visitingFee') return 'ভিজিটিং ফি';
    if (field === 'hourlyRate') return 'ঘণ্টাপ্রতি চার্জ';
    if (field === 'emergencyCharge') return 'জরুরি চার্জ';
    return field;
  };

  const formatTechPriceStatus = (status: string) => {
    if (!isBangla) {
      if (status === 'PENDING_APPROVAL') return 'Pending Approval';
      if (status === 'APPROVED') return 'Approved';
      if (status === 'CUSTOMIZED_PRICE') return 'Customized Price';
      if (status === 'REJECTED') return 'Rejected';
      if (status === 'DEFAULT_RATE') return 'Default Rate';
      return status;
    }
    if (status === 'PENDING_APPROVAL') return 'অনুমোদনের অপেক্ষায়';
    if (status === 'APPROVED') return 'অনুমোদিত';
    if (status === 'CUSTOMIZED_PRICE') return 'কাস্টমাইজড মূল্য';
    if (status === 'REJECTED') return 'বাতিল';
    if (status === 'DEFAULT_RATE') return 'ডিফল্ট মূল্য';
    return status;
  };

  const [rules, setRules] = useState<PlatformRules | null>(null);
  const [draftRules, setDraftRules] = useState<PlatformRules | null>(null);
  const [versions, setVersions] = useState<RuleVersionRecord[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [categories, setCategories] = useState<(ServiceCategory & { active?: boolean; commissionOverridePercent?: number | null })[]>([]);
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [techPricingQueue, setTechPricingQueue] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  const [sectionTab, setSectionTab] = useState<'rules' | 'catalog' | 'approvals' | 'audit'>('rules');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sensitive change confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [saveReason, setSaveReason] = useState('');
  const [savingRules, setSavingRules] = useState(false);

  // New Category Modal
  const [showNewCatModal, setShowNewCatModal] = useState(false);
  const [newCatForm, setNewCatForm] = useState({
    nameEn: '',
    nameBn: '',
    startingPrice: 400,
    commissionOverridePercent: '',
    emergencyAvailable: true,
  });

  // New Subcategory & Pricing Rule Modal
  const [showNewSubModal, setShowNewSubModal] = useState(false);
  const [newSubForm, setNewSubForm] = useState({
    categoryId: 'electrical',
    nameEn: '',
    nameBn: '',
    defaultPrice: 500,
    minPrice: 300,
    maxPrice: 900,
    visitingFee: 200,
    minVisitingFee: 100,
    maxVisitingFee: 400,
    customizationPermission: 'TECH_CUSTOMIZABLE_RANGE' as CustomizationPermission,
    requiresPriceApproval: false,
    commissionOverridePercent: '',
  });

  // Inline Pricing Rule Editor
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadAll = async () => {
    if (!authTokenReady || currentUser?.role !== 'ADMIN') return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [rulesRes, catRes, queueRes, auditRes] = await Promise.all([
        fetchAdminRules(),
        fetchCatalogOverview(),
        fetchAdminTechPricingQueue(),
        fetchAuditLogs(auditSearch),
      ]);
      setRules(rulesRes.rules);
      setDraftRules(JSON.parse(JSON.stringify(rulesRes.rules)));
      setVersions(rulesRes.versions || []);
      setProviders(rulesRes.providers || []);
      setCategories(catRes.categories || []);
      setSubcategories(catRes.subcategories || []);
      setPricingRules(catRes.pricingRules || []);
      setTechPricingQueue(queueRes.items || []);
      setAuditLogs(auditRes.logs || []);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (isBangla ? 'অ্যাডমিন নীতিমালা ও ডেটা লোড করতে ব্যর্থ হয়েছে।' : 'Failed to load Admin governance data.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authTokenReady && currentUser?.role === 'ADMIN') {
      void loadAll();
    }
  }, [authTokenReady, currentUser?.role]);

  const handleCommissionChange = (platformPct: number) => {
    if (!draftRules) return;
    const clamped = Math.max(0, Math.min(100, platformPct));
    setDraftRules({
      ...draftRules,
      commission: {
        ...draftRules.commission,
        defaultPlatformCommissionPercent: clamped,
        defaultTechnicianEarningsPercent: Number((100 - clamped).toFixed(2)),
      },
    });
  };

  const executeSaveRules = async (confirmSensitive: boolean) => {
    if (!draftRules) return;
    setSavingRules(true);
    setErrorMsg(null);
    try {
      const res = await updateAdminRules(
        draftRules,
        saveReason.trim() || `Admin updated rules to v${draftRules.version + 1}`,
        confirmSensitive
      );
      setRules(res.rules);
      setDraftRules(JSON.parse(JSON.stringify(res.rules)));
      setConfirmModalOpen(false);
      setSaveReason('');
      notify(
        isBangla
          ? `প্ল্যাটফর্ম নীতিমালা v${res.rules.version}-এ আপডেট ও অডিট লগে সংরক্ষিত হয়েছে।`
          : `Platform rules updated to v${res.rules.version} & audit logged.`
      );
      void loadAll();
    } catch (err: any) {
      if (err?.message?.includes('Confirmation required') && !confirmSensitive) {
        setConfirmModalOpen(true);
      } else {
        setErrorMsg(
          err?.message || (isBangla ? 'প্ল্যাটফর্ম নীতিমালা সংরক্ষণ করতে ব্যর্থ হয়েছে।' : 'Failed to save platform rules.')
        );
      }
    } finally {
      setSavingRules(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await createAdminCategory({
        ...newCatForm,
        commissionOverridePercent:
          newCatForm.commissionOverridePercent === '' ? null : Number(newCatForm.commissionOverridePercent),
      });
      setShowNewCatModal(false);
      setNewCatForm({ nameEn: '', nameBn: '', startingPrice: 400, commissionOverridePercent: '', emergencyAvailable: true });
      notify(
        isBangla
          ? 'নতুন সার্ভিস ক্যাটাগরি ও ডিফল্ট মূল্য নীতিমালা তৈরি হয়েছে।'
          : 'New service category & default pricing rule created.'
      );
      void loadAll();
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'ক্যাটাগরি তৈরি করতে ব্যর্থ হয়েছে।' : 'Failed to create category.'));
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await createAdminSubcategory({
        ...newSubForm,
        commissionOverridePercent:
          newSubForm.commissionOverridePercent === '' ? null : Number(newSubForm.commissionOverridePercent),
      });
      setShowNewSubModal(false);
      notify(
        isBangla
          ? 'নতুন সাব-ক্যাটাগরি ও মূল্য নীতিমালা তৈরি হয়েছে।'
          : 'New subcategory & pricing rule created.'
      );
      void loadAll();
    } catch (err: any) {
      setErrorMsg(
        err?.message || (isBangla ? 'সাব-ক্যাটাগরি নীতিমালা তৈরি করতে ব্যর্থ হয়েছে।' : 'Failed to create subcategory rule.')
      );
    }
  };

  const handleSavePricingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setErrorMsg(null);
    try {
      await updateAdminPricingRule(editingRule.id, {
        defaultPrice: editingRule.defaultPrice,
        minPrice: editingRule.minPrice,
        maxPrice: editingRule.maxPrice,
        visitingFee: editingRule.visitingFee,
        minVisitingFee: editingRule.minVisitingFee,
        maxVisitingFee: editingRule.maxVisitingFee,
        hourlyRate: editingRule.hourlyRate,
        additionalHourCharge: editingRule.additionalHourCharge,
        emergencyCharge: editingRule.emergencyCharge,
        nightCharge: editingRule.nightCharge,
        weekendCharge: editingRule.weekendCharge,
        customizationPermission: editingRule.customizationPermission,
        requiresPriceApproval: editingRule.requiresPriceApproval,
        commissionOverridePercent: editingRule.commissionOverridePercent,
        active: editingRule.active,
        reason: 'Admin updated service tariff bounds',
      });
      setEditingRule(null);
      notify(
        isBangla
          ? 'মূল্য নীতিমালা আপডেট হয়েছে (আগের কনফার্মড বুকিং স্ন্যাপশট অপরিবর্তিত থাকবে)।'
          : 'Pricing rule updated (confirmed historical booking snapshots remain immutable).'
      );
      void loadAll();
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'মূল্য নীতিমালা যাচাই ব্যর্থ হয়েছে।' : 'Pricing rule validation failed.'));
    }
  };

  const handleReviewTechPrice = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      await reviewTechPricing(id, decision, decision === 'APPROVE' ? 'Approved by Admin' : 'Out of market guideline');
      notify(
        isBangla
          ? `টেকনিশিয়ান মূল্য আবেদন ${decision === 'APPROVE' ? 'অনুমোদিত' : 'বাতিল'} হয়েছে।`
          : `Technician price request ${decision === 'APPROVE' ? 'approved' : 'rejected'}.`
      );
      void loadAll();
    } catch (err: any) {
      setErrorMsg(
        err?.message || (isBangla ? 'টেকনিশিয়ান মূল্য পর্যালোচনা ব্যর্থ হয়েছে।' : 'Failed to review technician pricing.')
      );
    }
  };

  if (loading && !draftRules) {
    return (
      <div className="p-6 text-center text-xs text-zinc-500">
        {isBangla
          ? 'Servexa নীতিমালা ও নিয়ন্ত্রণ ইঞ্জিন লোড হচ্ছে...'
          : 'Loading Servexa Rules & Regulations governance engine...'}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="bg-white dark:bg-zinc-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600" />
            <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
              {isBangla
                ? 'Servexa কেন্দ্রীয় নীতিমালা, মূল্য ও শাসন নিয়ন্ত্রণ'
                : 'Servexa Central Rules, Pricing & Governance Control'}
            </h3>
            {rules && (
              <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-600 font-mono text-[11px] font-black">
                v{rules.version}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isBangla
              ? 'মূল্যসীমা, ৯০/১০ কমিশন বিভাজন, ন্যূনতম রিজার্ভ, কাজ শেষে নগদ জমার সময়সীমা এবং পেমেন্ট অ্যাডাপ্টারের একক নিয়ন্ত্রণ কেন্দ্র।'
              : 'Single source of truth for pricing bounds, 90/10 commission splits, reserve requirements, Cash-on-Completion deadlines, and payment adapters.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold">
          {(
            [
              ['rules', isBangla ? 'প্ল্যাটফর্ম নীতিমালা (১৪ ধারা)' : 'Platform Rules (14 Sections)', Sliders],
              [
                'catalog',
                isBangla ? `ক্যাটাগরি ও মূল্য (${pricingRules.length})` : `Categories & Pricing (${pricingRules.length})`,
                Layers,
              ],
              [
                'approvals',
                isBangla
                  ? `মূল্য অনুমোদন (${techPricingQueue.filter((i) => i.status === 'PENDING_APPROVAL').length})`
                  : `Tech Price Approvals (${techPricingQueue.filter((i) => i.status === 'PENDING_APPROVAL').length})`,
                CheckCircle2,
              ],
              ['audit', isBangla ? 'অডিট ও সংস্করণ ইতিহাস' : 'Audit & Rule History', History],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSectionTab(key)}
              className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
                sectionTab === key
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUB-TAB 1: 14-SECTION PLATFORM RULES */}
      {sectionTab === 'rules' && draftRules && (
        <div className="space-y-5">
          {/* Save Bar */}
          <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-orange-900 dark:text-orange-200">
              <strong>{isBangla ? 'নীতিমালা সুরক্ষা:' : 'Policy Safety:'}</strong>{' '}
              {isBangla
                ? 'কমিশন পরিবর্তন, রিজার্ভ আপডেট বা পেমেন্ট টগল পরিবর্তনের জন্য নিশ্চিতকরণ প্রয়োজন এবং অডিট লগে সংরক্ষিত হয়। পূর্বের কনফার্মড বুকিং স্ন্যাপশট অপরিবর্তিত থাকে।'
                : 'Commission changes, reserve updates, or payment toggles require explicit confirmation & are logged in Audit History. Confirmed booking snapshots remain immutable.'}
            </div>
            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              disabled={savingRules}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{isBangla ? 'প্ল্যাটফর্ম নীতিমালা সংরক্ষণ করুন' : 'Save Platform Rules'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5">
            {/* 1. General & Active Payment Methods */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 sm:space-y-4">
              <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500 shrink-0" />
                <span>
                  {isBangla
                    ? '১. সাধারণ ও সক্রিয় পেমেন্ট মাধ্যম (টাকা ৳)'
                    : '1. General & Active Payment Methods (BDT ৳)'}
                </span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                <label className="flex items-center gap-2 font-semibold p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftRules.general.allowPriceCustomization}
                    onChange={(e) =>
                      setDraftRules({
                        ...draftRules,
                        general: { ...draftRules.general, allowPriceCustomization: e.target.checked },
                      })
                    }
                    className="accent-orange-600"
                  />
                  <span>{isBangla ? 'টেকনিশিয়ান মূল্য পরিবর্তনের অনুমতি' : 'Allow Tech Price Customization'}</span>
                </label>
                <label className="flex items-center gap-2 font-semibold p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftRules.general.allowCashOnCompletion}
                    onChange={(e) =>
                      setDraftRules({
                        ...draftRules,
                        general: { ...draftRules.general, allowCashOnCompletion: e.target.checked },
                      })
                    }
                    className="accent-orange-600"
                  />
                  <span>{isBangla ? 'কাজ শেষে নগদ (Cash) অনুমতি' : 'Allow Cash on Completion'}</span>
                </label>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-500">
                  {isBangla
                    ? 'সক্রিয় গ্রাহক পেমেন্ট চ্যানেল ও মার্চেন্ট অ্যাডাপ্টার অবস্থা:'
                    : 'Enabled Customer Payment Channels & Merchant Adapter Status:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {(['bkash', 'nagad', 'rocket', 'card', 'cash'] as PaymentMethodCode[]).map((code) => {
                    const pStatus = providers.find((p) => p.provider === code);
                    return (
                      <label
                        key={code}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-800/60 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={draftRules.general.activePaymentMethods[code]}
                            onChange={(e) =>
                              setDraftRules({
                                ...draftRules,
                                general: {
                                  ...draftRules.general,
                                  activePaymentMethods: {
                                    ...draftRules.general.activePaymentMethods,
                                    [code]: e.target.checked,
                                  },
                                },
                              })
                            }
                            className="accent-orange-600"
                          />
                          <span className="font-bold uppercase">{code}</span>
                        </div>
                        {pStatus && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              pStatus.configured
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : 'bg-amber-500/15 text-amber-600'
                            }`}
                          >
                            {pStatus.mode}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Platform Commission Rules (90 / 10 Split) */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 sm:space-y-4">
              <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>
                  {isBangla
                    ? '২. কমিশন বিভাজন (ডিফল্ট ১০% Servexa / ৯০% টেকনিশিয়ান)'
                    : '2. Commission Split (Default 10% Servexa / 90% Tech)'}
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    {isBangla ? 'Servexa কমিশন (%)' : 'Servexa Commission (%)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={draftRules.commission.defaultPlatformCommissionPercent}
                    onChange={(e) => handleCommissionChange(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    {isBangla ? 'টেকনিশিয়ানের অংশ (%)' : 'Technician Share (%)'}
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={draftRules.commission.defaultTechnicianEarningsPercent}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 font-black text-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="font-bold text-zinc-500">
                  {isBangla ? 'কমিশনযোগ্য চার্জের খাতসমূহ:' : 'Commissionable Charge Components:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      ['servicePrice', isBangla ? 'সার্ভিস চার্জ' : 'Service Price'],
                      ['visitingFee', isBangla ? 'ভিজিটিং ফি' : 'Visiting Fee'],
                      ['hourlyCharge', isBangla ? 'ঘণ্টাপ্রতি চার্জ' : 'Hourly Charge'],
                      ['extraWorkCharge', isBangla ? 'অতিরিক্ত কাজ' : 'Extra Work'],
                      ['emergencyCharge', isBangla ? 'জরুরি চার্জ' : 'Emergency Charge'],
                      ['nightCharge', isBangla ? 'রাতের চার্জ' : 'Night Charge'],
                      ['weekendCharge', isBangla ? 'সাপ্তাহিক ছুটি চার্জ' : 'Weekend Charge'],
                      ['materialCost', isBangla ? 'মালামাল খরচ (সাধারণত বন্ধ)' : 'Material Cost (Usually Off)'],
                    ] as const
                  ).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-zinc-800/60 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftRules.commission.commissionableItems[k]}
                        onChange={(e) =>
                          setDraftRules({
                            ...draftRules,
                            commission: {
                              ...draftRules.commission,
                              commissionableItems: {
                                ...draftRules.commission.commissionableItems,
                                [k]: e.target.checked,
                              },
                            },
                          })
                        }
                        className="accent-orange-600"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Wallet, Minimum Reserve Balance & Withdrawals */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 sm:space-y-4">
              <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-orange-500" />
                <span>
                  {isBangla
                    ? '৩. ওয়ালেট, ন্যূনতম রিজার্ভ (৳৫০০) ও টাকা উত্তোলন'
                    : '3. Wallet, Minimum Reserve (৳500) & Withdrawals'}
                </span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-zinc-500 block mb-1">
                    {isBangla ? 'ন্যূনতম রিজার্ভ (৳)' : 'Min Reserve (৳)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draftRules.walletAndReserve.globalMinimumReserveBalance}
                    onChange={(e) =>
                      setDraftRules({
                        ...draftRules,
                        walletAndReserve: {
                          ...draftRules.walletAndReserve,
                          globalMinimumReserveBalance: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-500 block mb-1">
                    {isBangla ? 'সর্বনিম্ন উত্তোলন (৳)' : 'Min Withdraw (৳)'}
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={draftRules.walletAndReserve.minimumWithdrawalAmount}
                    onChange={(e) =>
                      setDraftRules({
                        ...draftRules,
                        walletAndReserve: {
                          ...draftRules.walletAndReserve,
                          minimumWithdrawalAmount: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-500 block mb-1">
                    {isBangla ? 'সর্বোচ্চ উত্তোলন (৳)' : 'Max Withdraw (৳)'}
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={draftRules.walletAndReserve.maximumWithdrawalAmount}
                    onChange={(e) =>
                      setDraftRules({
                        ...draftRules,
                        walletAndReserve: {
                          ...draftRules.walletAndReserve,
                          maximumWithdrawalAmount: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-500 block mb-1">
                    {isBangla ? 'দৈনিক সর্বোচ্চ আবেদন' : 'Max Req / Day'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={draftRules.withdrawal.maxRequestsPerDay}
                    onChange={(e) =>
                      setDraftRules({
                        ...draftRules,
                        withdrawal: { ...draftRules.withdrawal, maxRequestsPerDay: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-500 block mb-1">
                    {isBangla ? 'উত্তোলন ফি (%)' : 'Withdraw Fee (%)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={draftRules.withdrawal.withdrawalFeePercent}
                    onChange={(e) =>
                      setDraftRules({
                        ...draftRules,
                        withdrawal: { ...draftRules.withdrawal, withdrawalFeePercent: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-500 block mb-1">
                    {isBangla ? 'স্বয়ংক্রিয় রিভিউ ≥ ৳' : 'Auto-Review ≥ ৳'}
                  </label>
                  <input
                    type="number"
                    min={500}
                    value={draftRules.withdrawal.autoReviewAboveAmount}
                    onChange={(e) =>
                      setDraftRules({
                        ...draftRules,
                        withdrawal: { ...draftRules.withdrawal, autoReviewAboveAmount: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-black"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {(['bkash', 'nagad', 'rocket', 'bank'] as PayoutProvider[]).map((prov) => (
                  <label key={prov} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-zinc-800 font-bold uppercase cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftRules.withdrawal.allowedPayoutProviders[prov]}
                      onChange={(e) =>
                        setDraftRules({
                          ...draftRules,
                          withdrawal: {
                            ...draftRules.withdrawal,
                            allowedPayoutProviders: {
                              ...draftRules.withdrawal.allowedPayoutProviders,
                              [prov]: e.target.checked,
                            },
                          },
                        })
                      }
                      className="accent-orange-600"
                    />
                    <span>{prov}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Cash-on-Completion Deposit & Overdue Restriction Rules */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 sm:space-y-4">
              <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>
                  {isBangla
                    ? '৪. কাজ শেষে নগদ জমা ও বকেয়া সীমাবদ্ধতা নীতিমালা'
                    : '4. Cash-on-Completion Deposit & Overdue Policies'}
                </span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-zinc-500 block mb-1">
                    {isBangla ? 'জমার সময়সীমা (ঘণ্টা)' : 'Deadline (Hours)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={draftRules.cashOnCompletion.depositDeadlineHours}
                    onChange={(e) =>
                      setDraftRules({
                        ...draftRules,
                        cashOnCompletion: {
                          ...draftRules.cashOnCompletion,
                          depositDeadlineHours: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-500 block mb-1">
                    {isBangla ? 'গ্রেস পিরিয়ড (ঘণ্টা)' : 'Grace Period (Hours)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draftRules.cashOnCompletion.gracePeriodHours}
                    onChange={(e) =>
                      setDraftRules({
                        ...draftRules,
                        cashOnCompletion: {
                          ...draftRules.cashOnCompletion,
                          gracePeriodHours: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-500 block mb-1">
                    {isBangla ? 'রসিদ বাধ্যতামূলক ≥ ৳' : 'Material Receipt ≥ ৳'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={draftRules.materialPolicy.requireReceiptNoteAbove}
                    onChange={(e) =>
                      setDraftRules({
                        ...draftRules,
                        materialPolicy: {
                          ...draftRules.materialPolicy,
                          requireReceiptNoteAbove: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-black"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftRules.cashOnCompletion.restrictNewBookingsAfterOverdueReview}
                  onChange={(e) =>
                    setDraftRules({
                      ...draftRules,
                      cashOnCompletion: {
                        ...draftRules.cashOnCompletion,
                        restrictNewBookingsAfterOverdueReview: e.target.checked,
                      },
                    })
                  }
                  className="accent-orange-600"
                />
                <span>
                  {isBangla
                    ? 'জমার সময়সীমা ও গ্রেস পিরিয়ড অতিক্রম করলে নতুন বুকিং স্থগিত করুন'
                    : 'Restrict new bookings after overdue deposit + grace period expires'}
                </span>
              </label>

              {/* Customization Permissions Matrix */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="text-xs font-bold text-zinc-500">
                  {isBangla
                    ? 'টেকনিশিয়ান ফিল্ড-ভিত্তিক মূল্য কাস্টমাইজেশন মোড:'
                    : 'Technician Field-Level Customization Modes:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {(['servicePrice', 'visitingFee', 'hourlyRate', 'emergencyCharge'] as PricingFieldKey[]).map((field) => (
                    <div key={field} className="space-y-1">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatPricingField(field)}</span>
                      <select
                        value={draftRules.customizationPermissions[field]}
                        onChange={(e) =>
                          setDraftRules({
                            ...draftRules,
                            customizationPermissions: {
                              ...draftRules.customizationPermissions,
                              [field]: e.target.value as CustomizationPermission,
                            },
                          })
                        }
                        className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-semibold"
                      >
                        {permOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CATEGORIES, SUBCATEGORIES & SERVICE PRICING RULES */}
      {sectionTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                {isBangla
                  ? `ক্যাটাগরি (${categories.length}), সাব-ক্যাটাগরি (${subcategories.length}) এবং অ্যাডমিন মূল্য নীতিমালা`
                  : `Categories (${categories.length}), Subcategories (${subcategories.length}) & Admin Pricing Rules`}
              </h4>
              <p className="text-xs text-zinc-500">
                {isBangla
                  ? 'প্রতিটি নিয়ম কঠোরভাবে ৳ সর্বনিম্ন ≤ ডিফল্ট ≤ সর্বোচ্চ যাচাই করে। মূল্য আপডেট কেবল নতুন কোট ও বুকিংয়ে প্রযোজ্য।'
                  : 'Every rule strictly validates ৳ Min ≤ Default ≤ Max. Price updates only affect new quotes & bookings.'}
              </p>
            </div>
            <div className="flex gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowNewCatModal(true)}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:border-orange-500 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBangla ? 'নতুন ক্যাটাগরি' : 'Add Category'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNewSubModal(true)}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBangla ? 'সার্ভিস ও মূল্য নীতি যোগ করুন' : 'Add Service & Pricing Rule'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800 font-bold text-zinc-600 dark:text-zinc-400">
                    <th className="p-3.5">{isBangla ? 'সার্ভিস' : 'Service'}</th>
                    <th className="p-3.5">{isBangla ? 'ক্যাটাগরি' : 'Category'}</th>
                    <th className="p-3.5">{isBangla ? 'ডিফল্ট (৳)' : 'Default (৳)'}</th>
                    <th className="p-3.5">{isBangla ? 'সীমা (সর্বনিম্ন–সর্বোচ্চ)' : 'Range (Min–Max)'}</th>
                    <th className="p-3.5">{isBangla ? 'ভিজিটিং ফি' : 'Visiting Fee'}</th>
                    <th className="p-3.5">{isBangla ? 'অনুমতি মোড' : 'Permission Mode'}</th>
                    <th className="p-3.5">{isBangla ? 'কমিশন' : 'Commission'}</th>
                    <th className="p-3.5 text-right">{isBangla ? 'সম্পাদনা' : 'Edit'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {pricingRules.map((pr) => {
                    const matchedCat = categories.find((c) => c.id === pr.categoryId);
                    return (
                      <tr key={pr.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/40">
                        <td className="p-3.5">
                          <div className="font-bold text-zinc-900 dark:text-white">
                            {isBangla ? pr.serviceTitleBn || pr.serviceTitleEn : pr.serviceTitleEn}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {isBangla ? pr.serviceTitleEn : pr.serviceTitleBn} · v{pr.ruleVersion}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px]">
                          {matchedCat ? (isBangla ? matchedCat.nameBn : matchedCat.nameEn) : pr.categoryId}
                        </td>
                        <td className="p-3.5 font-black text-orange-600">৳{pr.defaultPrice}</td>
                        <td className="p-3.5 font-mono">৳{pr.minPrice} – ৳{pr.maxPrice}</td>
                        <td className="p-3.5">৳{pr.visitingFee}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-zinc-800 text-[10px] font-bold">
                            {formatPermLabel(pr.customizationPermission)}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-600">
                          {pr.commissionOverridePercent != null
                            ? `${pr.commissionOverridePercent}% (${isBangla ? 'কাস্টম' : 'Override'})`
                            : isBangla
                            ? '১০% (গ্লোবাল)'
                            : '10% (Global)'}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingRule({ ...pr })}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isBangla ? 'সম্পাদনা' : 'Edit'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TECHNICIAN PRICE APPROVAL QUEUE */}
      {sectionTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-zinc-900 dark:text-white">
              {isBangla
                ? 'টেকনিশিয়ান সার্ভিস মূল্য ও অনুমোদন তালিকা'
                : 'Technician Service Pricing & Approval Queue'}
            </h4>
            <button
              type="button"
              onClick={() => void loadAll()}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isBangla ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800 font-bold text-zinc-600 dark:text-zinc-400">
                    <th className="p-2.5 sm:p-3.5">{isBangla ? 'টেকনিশিয়ান' : 'Technician'}</th>
                    <th className="p-2.5 sm:p-3.5">{isBangla ? 'সার্ভিস' : 'Service'}</th>
                    <th className="p-2.5 sm:p-3.5">{isBangla ? 'অনুমোদিত মূল্য' : 'Approved Price'}</th>
                    <th className="p-2.5 sm:p-3.5">{isBangla ? 'আবেদিত মূল্য' : 'Pending Request'}</th>
                    <th className="p-2.5 sm:p-3.5">{isBangla ? 'অ্যাডমিন সীমা' : 'Admin Range'}</th>
                    <th className="p-2.5 sm:p-3.5">{isBangla ? 'অবস্থা' : 'Status'}</th>
                    <th className="p-2.5 sm:p-3.5 text-right">{isBangla ? 'পদক্ষেপ' : 'Actions'}</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {techPricingQueue.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3.5 font-bold text-zinc-900 dark:text-white">{item.technicianName}</td>
                    <td className="p-3.5">
                      {isBangla ? item.serviceTitleBn || item.serviceTitleEn : item.serviceTitleEn}
                    </td>
                    <td className="p-3.5 font-bold">৳{item.approvedPrice}</td>
                    <td className="p-3.5 font-black text-orange-600">
                      {item.pendingPrice != null ? `৳${item.pendingPrice}` : '—'}
                    </td>
                    <td className="p-3.5 font-mono text-zinc-500">৳{item.minPrice}–৳{item.maxPrice}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          item.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-500/20 text-amber-600'
                            : item.status === 'APPROVED' || item.status === 'CUSTOMIZED_PRICE'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {formatTechPriceStatus(item.status)}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {item.status === 'PENDING_APPROVAL' && (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleReviewTechPrice(item.id, 'APPROVE')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>{isBangla ? 'অনুমোদন' : 'Approve'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleReviewTechPrice(item.id, 'REJECT')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>{isBangla ? 'বাতিল' : 'Reject'}</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AUDIT LOGS & VERSION HISTORY */}
      {sectionTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-5 space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                {isBangla ? 'অ্যাডমিন আর্থিক অডিট লগ' : 'Admin Financial Audit Trail'}
              </h4>
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void loadAll();
                }}
                placeholder={isBangla ? 'লগ অনুসন্ধান করুন...' : 'Search logs...'}
                className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
              />
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs max-h-[420px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-orange-600">
                      [{log.section}] {log.action}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300">{log.reason}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {isBangla ? 'অ্যাডমিন' : 'Admin'}: {log.adminName} · {isBangla ? 'টার্গেট' : 'Target'}: {log.targetId || '—'} ·{' '}
                    {isBangla ? 'পরবর্তী মান' : 'Next'}: {log.newValue}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-5 space-y-3">
            <h4 className="text-sm font-black text-zinc-900 dark:text-white">
              {isBangla ? 'নীতিমালার সংস্করণ সমূহ' : 'Rule Versions'}
            </h4>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              {versions.map((v) => (
                <div key={v.id} className="py-2.5 space-y-0.5">
                  <div className="font-black text-zinc-900 dark:text-white">
                    {isBangla ? `সংস্করণ v${v.version}` : `Version v${v.version}`}
                  </div>
                  <div className="text-zinc-500">{v.summary}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{new Date(v.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Sensitive Rules Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-[3100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>
                {isBangla
                  ? 'প্ল্যাটফর্ম আর্থিক নীতিমালা পরিবর্তন নিশ্চিত করুন'
                  : 'Confirm Platform Financial Rule Change'}
              </span>
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {isBangla
                ? 'নীতিমালা আপডেট করলে একটি নতুন সংস্করণ তৈরি হবে এবং অডিট লগে সংরক্ষিত হবে। পূর্বের কনফার্মড বুকিংগুলোর মূল্য স্ন্যাপশট অপরিবর্তিত থাকবে।'
                : 'Updating rules creates a new rule version and logs this change to the audit trail. Existing confirmed booking price snapshots remain unchanged.'}
            </p>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {isBangla ? 'অডিট কারণ / পরিবর্তনের নোট:' : 'Audit Reason / Change Note:'}
              </label>
              <input
                type="text"
                value={saveReason}
                onChange={(e) => setSaveReason(e.target.value)}
                placeholder={
                  isBangla
                    ? 'যেমন: উৎসব কমিশন বা রিজার্ভ নীতি সমন্বয়'
                    : 'e.g., Adjusted holiday commission or reserve policy'
                }
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold cursor-pointer"
              >
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => void executeSaveRules(true)}
                disabled={savingRules}
                className="px-5 py-2 rounded-xl bg-orange-600 text-white text-xs font-black cursor-pointer"
              >
                {savingRules
                  ? isBangla
                    ? 'সংরক্ষণ হচ্ছে...'
                    : 'Saving...'
                  : isBangla
                  ? 'নিশ্চিত ও প্রকাশ করুন'
                  : 'Confirm & Publish Rules'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pricing Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-[3100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <form
            onSubmit={handleSavePricingRule}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h4 className="font-black text-sm text-zinc-900 dark:text-white">
                {isBangla ? 'মূল্য নীতিমালা সম্পাদনা:' : 'Edit Pricing Rule:'}{' '}
                {isBangla ? editingRule.serviceTitleBn || editingRule.serviceTitleEn : editingRule.serviceTitleEn}
              </h4>
              <button type="button" onClick={() => setEditingRule(null)} className="text-zinc-400">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold block mb-1">{isBangla ? 'সর্বনিম্ন মূল্য (৳)' : 'Min Price (৳)'}</label>
                <input
                  type="number"
                  required
                  value={editingRule.minPrice}
                  onChange={(e) => setEditingRule({ ...editingRule, minPrice: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">{isBangla ? 'ডিফল্ট মূল্য (৳)' : 'Default Price (৳)'}</label>
                <input
                  type="number"
                  required
                  value={editingRule.defaultPrice}
                  onChange={(e) => setEditingRule({ ...editingRule, defaultPrice: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">{isBangla ? 'সর্বোচ্চ মূল্য (৳)' : 'Max Price (৳)'}</label>
                <input
                  type="number"
                  required
                  value={editingRule.maxPrice}
                  onChange={(e) => setEditingRule({ ...editingRule, maxPrice: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">{isBangla ? 'ভিজিটিং ফি (৳)' : 'Visiting Fee (৳)'}</label>
                <input
                  type="number"
                  required
                  value={editingRule.visitingFee}
                  onChange={(e) => setEditingRule({ ...editingRule, visitingFee: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">{isBangla ? 'জরুরি চার্জ (৳)' : 'Emergency (৳)'}</label>
                <input
                  type="number"
                  required
                  value={editingRule.emergencyCharge}
                  onChange={(e) => setEditingRule({ ...editingRule, emergencyCharge: Number(e.target.value) })}
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">{isBangla ? 'কমিশন ওভাররাইড %' : 'Comm Override %'}</label>
                <input
                  type="number"
                  step={0.5}
                  placeholder={isBangla ? 'গ্লোবাল ১০%' : 'Global 10%'}
                  value={editingRule.commissionOverridePercent ?? ''}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      commissionOverridePercent: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-bold"
                />
              </div>
            </div>
            <div className="text-xs space-y-2">
              <label className="font-bold block">
                {isBangla ? 'টেকনিশিয়ান মূল্য কাস্টমাইজেশন মোড:' : 'Technician Customization Mode:'}
              </label>
              <select
                value={editingRule.customizationPermission}
                onChange={(e) =>
                  setEditingRule({ ...editingRule, customizationPermission: e.target.value as CustomizationPermission })
                }
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-semibold"
              >
                {permOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingRule(null)} className="px-4 py-2 rounded-xl border text-xs font-bold">
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-orange-600 text-white text-xs font-black cursor-pointer">
                {isBangla ? 'নীতিমালা সংরক্ষণ করুন' : 'Save Rule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Category Modal */}
      {showNewCatModal && (
        <div className="fixed inset-0 z-[3100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <form onSubmit={handleCreateCategory} className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
            <h4 className="text-sm font-black text-zinc-900 dark:text-white">
              {isBangla ? 'নতুন সার্ভিস ক্যাটাগরি তৈরি করুন' : 'Create Service Category'}
            </h4>
            <input
              type="text"
              required
              placeholder={isBangla ? 'ক্যাটাগরির নাম (ইংরেজি)' : 'Category Name (English)'}
              value={newCatForm.nameEn}
              onChange={(e) => setNewCatForm({ ...newCatForm, nameEn: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
            />
            <input
              type="text"
              required
              placeholder={isBangla ? 'ক্যাটাগরির নাম (বাংলা)' : 'Category Name (Bengali)'}
              value={newCatForm.nameBn}
              onChange={(e) => setNewCatForm({ ...newCatForm, nameBn: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                required
                min={50}
                placeholder={isBangla ? 'শুরুর মূল্য (৳)' : 'Starting Price (৳)'}
                value={newCatForm.startingPrice}
                onChange={(e) => setNewCatForm({ ...newCatForm, startingPrice: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
              />
              <input
                type="number"
                step={0.5}
                placeholder={isBangla ? 'কমিশন % (খালি = গ্লোবাল)' : 'Comm % (blank = global)'}
                value={newCatForm.commissionOverridePercent}
                onChange={(e) => setNewCatForm({ ...newCatForm, commissionOverridePercent: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewCatModal(false)} className="px-4 py-2 rounded-xl border font-bold">
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-orange-600 text-white font-black cursor-pointer">
                {isBangla ? 'ক্যাটাগরি তৈরি করুন' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Subcategory & Pricing Rule Modal */}
      {showNewSubModal && (
        <div className="fixed inset-0 z-[3100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <form onSubmit={handleCreateSubcategory} className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
            <h4 className="text-sm font-black text-zinc-900 dark:text-white">
              {isBangla ? 'সাব-ক্যাটাগরি ও মূল্য নীতিমালা যোগ করুন' : 'Add Subcategory & Pricing Rule'}
            </h4>
            <select
              value={newSubForm.categoryId}
              onChange={(e) => setNewSubForm({ ...newSubForm, categoryId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-bold"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {isBangla ? c.nameBn : c.nameEn}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder={isBangla ? 'সার্ভিসের নাম (ইংরেজি)' : 'Service Title (English)'}
              value={newSubForm.nameEn}
              onChange={(e) => setNewSubForm({ ...newSubForm, nameEn: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
            />
            <input
              type="text"
              placeholder={isBangla ? 'সার্ভিসের নাম (বাংলা)' : 'Service Title (Bengali)'}
              value={newSubForm.nameBn}
              onChange={(e) => setNewSubForm({ ...newSubForm, nameBn: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                required
                placeholder={isBangla ? 'সর্বনিম্ন ৳' : 'Min ৳'}
                value={newSubForm.minPrice}
                onChange={(e) => setNewSubForm({ ...newSubForm, minPrice: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
              />
              <input
                type="number"
                required
                placeholder={isBangla ? 'ডিফল্ট ৳' : 'Default ৳'}
                value={newSubForm.defaultPrice}
                onChange={(e) => setNewSubForm({ ...newSubForm, defaultPrice: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
              />
              <input
                type="number"
                required
                placeholder={isBangla ? 'সর্বোচ্চ ৳' : 'Max ৳'}
                value={newSubForm.maxPrice}
                onChange={(e) => setNewSubForm({ ...newSubForm, maxPrice: Number(e.target.value) })}
                className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewSubModal(false)} className="px-4 py-2 rounded-xl border font-bold">
                {isBangla ? 'বাতিল' : 'Cancel'}
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-orange-600 text-white font-black cursor-pointer">
                {isBangla ? 'নীতিমালা তৈরি করুন' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
