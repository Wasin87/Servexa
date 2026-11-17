import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wallet,
  Banknote,
  ShieldAlert,
  Lock,
  Unlock,
  Search,
  CreditCard,
} from 'lucide-react';
import {
  adminWithdrawalAction,
  checkOverdueCashAdmin,
  fetchAdminFinanceOverview,
  getStoredAuthToken,
  refundPaymentAdmin,
  setTechnicianReserveAdmin,
  setTechnicianRestrictionAdmin,
  verifyCashDepositAdmin,
  verifyPayoutAccountAdmin,
} from '../../services/financeApi';
import type { AdminFinancialSummary, PaymentTransaction, WalletSummary, WithdrawalRequest } from '../../types/finance';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

export const AdminFinancialDashboard: React.FC = () => {
  const { isBangla } = useLanguage();
  const { authTokenReady, currentUser } = useAuth();

  const formatVerificationStatus = (status: string) => {
    if (!isBangla) {
      if (status === 'VERIFIED') return 'Verified';
      if (status === 'REJECTED') return 'Rejected';
      if (status === 'PENDING') return 'Pending';
      return status;
    }
    if (status === 'VERIFIED') return 'যাচাইকৃত';
    if (status === 'REJECTED') return 'বাতিল';
    if (status === 'PENDING') return 'অপেক্ষমাণ';
    return status;
  };

  const formatWithdrawalStatus = (status: string) => {
    if (!isBangla) {
      if (status === 'COMPLETED') return 'Completed';
      if (status === 'PROCESSING') return 'Processing';
      if (status === 'UNDER_REVIEW') return 'Under Review';
      if (status === 'PENDING') return 'Pending';
      if (status === 'FAILED') return 'Failed';
      if (status === 'REJECTED') return 'Rejected';
      if (status === 'REVERSED') return 'Reversed';
      return status;
    }
    if (status === 'COMPLETED') return 'সম্পন্ন';
    if (status === 'PROCESSING') return 'প্রসেসিং';
    if (status === 'UNDER_REVIEW') return 'পর্যালোচনায়';
    if (status === 'PENDING') return 'অপেক্ষমাণ';
    if (status === 'FAILED') return 'ব্যর্থ';
    if (status === 'REJECTED') return 'বাতিল';
    if (status === 'REVERSED') return 'ফেরত';
    return status;
  };

  const formatCashDepositStatus = (status: string) => {
    if (!isBangla) {
      if (status === 'CASH_PENDING') return 'Cash Pending';
      if (status === 'VERIFICATION_PENDING') return 'Verification Pending';
      if (status === 'COMMISSION_RECORDED') return 'Commission Recorded';
      if (status === 'OVERDUE') return 'Overdue';
      if (status === 'REJECTED') return 'Rejected';
      if (status === 'DISPUTED') return 'Disputed';
      return status;
    }
    if (status === 'CASH_PENDING') return 'জমা বাকি';
    if (status === 'VERIFICATION_PENDING') return 'যাচাই অপেক্ষমাণ';
    if (status === 'COMMISSION_RECORDED') return 'কমিশন হিসাবভুক্ত';
    if (status === 'OVERDUE') return 'সময়সীমা অতিক্রান্ত';
    if (status === 'REJECTED') return 'বাতিল';
    if (status === 'DISPUTED') return 'বিতর্কিত';
    return status;
  };

  const formatPaymentStatus = (status: string) => {
    if (!isBangla) {
      if (status === 'PAID') return 'Paid';
      if (status === 'PENDING') return 'Pending';
      if (status === 'CASH_ON_SERVICE') return 'Cash on Service';
      if (status === 'REFUNDED') return 'Refunded';
      if (status === 'VERIFIED') return 'Verified';
      return status;
    }
    if (status === 'PAID') return 'পরিশোধিত';
    if (status === 'PENDING') return 'বাকি';
    if (status === 'CASH_ON_SERVICE') return 'কাজ শেষে নগদ';
    if (status === 'REFUNDED') return 'রিফান্ডকৃত';
    if (status === 'VERIFIED') return 'যাচাইকৃত';
    return status;
  };
  const [summary, setSummary] = useState<AdminFinancialSummary | null>(null);
  const [techWallets, setTechWallets] = useState<Array<{ id: string; name: string; phone: string; primaryArea: string; wallet: WalletSummary }>>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [cashDeposits, setCashDeposits] = useState<any[]>([]);
  const [payoutAccounts, setPayoutAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [subTab, setSubTab] = useState<'overview' | 'withdrawals' | 'cash' | 'wallets' | 'ledger'>('overview');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Payout completion reference input map
  const [payoutRefs, setPayoutRefs] = useState<Record<string, string>>({});
  const [reserveInputs, setReserveInputs] = useState<Record<string, string>>({});

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadOverview = async () => {
    if (!authTokenReady || currentUser?.role !== 'ADMIN') return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAdminFinanceOverview({
        search: searchFilter,
        status: statusFilter,
        technicianId: techFilter,
        dateFrom,
        dateTo,
      });
      setSummary(data.summary);
      setTechWallets(data.techWallets);
      setWithdrawals(data.withdrawals);
      setCashDeposits(data.cashDeposits);
      setPayoutAccounts(data.payoutAccounts);
      setTransactions(data.transactions);
      setPaymentTransactions(data.paymentTransactions);
    } catch (err: any) {
      setErrorMsg(
        err?.message || (isBangla ? 'আর্থিক ড্যাশবোর্ড লোড করতে ব্যর্থ হয়েছে।' : 'Failed to load financial dashboard.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authTokenReady && currentUser?.role === 'ADMIN') {
      void loadOverview();
    }
  }, [authTokenReady, currentUser?.role]);

  const handleExportCsv = async () => {
    try {
      const token = getStoredAuthToken();
      let blob: Blob | null = null;
      try {
        const res = await fetch('/api/admin/finance/export', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && !contentType.includes('text/html')) {
          blob = await res.blob();
        }
      } catch {
        // fallback below when backend route is unavailable on static hosting
      }

      if (!blob) {
        const headers = [
          'BookingNumber',
          'CustomerName',
          'TechnicianName',
          'PaymentMethod',
          'PaymentStatus',
          'FinalTotal',
          'CommissionAmount',
          'TechnicianNet',
        ];
        const rows = transactions.map((tx) =>
          [
            tx.bookingNumber ?? '',
            tx.customerName ?? '',
            tx.technicianName ?? '',
            tx.paymentMethod ?? '',
            tx.paymentStatus ?? '',
            tx.finalAgreedAmount ?? 0,
            tx.platformCommissionAmount ?? 0,
            tx.technicianEarningsAmount ?? 0,
          ]
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(',')
        );
        const csvContent = [headers.join(','), ...rows].join('\n');
        blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `servexa-financial-ledger-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify(isBangla ? 'আর্থিক লেজার CSV এক্সপোর্ট হয়েছে।' : 'Financial ledger CSV exported.');
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'CSV ডাউনলোড ব্যর্থ হয়েছে।' : 'CSV download failed.'));
    }
  };

  const handleWithdrawalAction = async (
    wId: string,
    action: 'UNDER_REVIEW' | 'PROCESSING' | 'COMPLETE' | 'FAIL' | 'REJECT'
  ) => {
    setErrorMsg(null);
    try {
      const ref = (payoutRefs[wId] || '').trim();
      await adminWithdrawalAction(
        wId,
        action,
        action === 'COMPLETE' ? ref : undefined,
        `Admin marked withdrawal ${action}`
      );
      notify(
        isBangla
          ? `উত্তোলন #${wId}-এর অবস্থা ${formatWithdrawalStatus(action === 'COMPLETE' ? 'COMPLETED' : action === 'FAIL' ? 'FAILED' : action)}-এ আপডেট হয়েছে।`
          : `Withdrawal #${wId} updated to ${action}.`
      );
      void loadOverview();
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'উত্তোলন কার্যক্রম ব্যর্থ হয়েছে।' : 'Withdrawal action failed.'));
    }
  };

  const handleVerifyCashDeposit = async (depositId: string, decision: 'APPROVE' | 'REJECT' | 'DISPUTE') => {
    setErrorMsg(null);
    try {
      await verifyCashDepositAdmin(depositId, decision, `Reconciled by Admin: ${decision}`);
      notify(
        isBangla
          ? decision === 'APPROVE'
            ? 'নগদ জমা যাচাই ও ৯০/১০ লেজার সমন্বয় সম্পন্ন হয়েছে।'
            : `নগদ জমা ${decision === 'REJECT' ? 'বাতিল' : 'বিতর্কিত'} হিসেবে চিহ্নিত হয়েছে।`
          : `Cash deposit ${decision === 'APPROVE' ? 'verified & 90/10 ledger posted' : decision.toLowerCase()}.`
      );
      void loadOverview();
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'নগদ সমন্বয় ব্যর্থ হয়েছে।' : 'Cash reconciliation failed.'));
    }
  };

  const handleCheckOverdueCash = async () => {
    setErrorMsg(null);
    try {
      const res: any = await checkOverdueCashAdmin(true);
      notify(
        isBangla
          ? `বকেয়া পরীক্ষা সম্পন্ন: ${res.markedOverdue}টি সময়সীমা অতিক্রান্ত, ${res.restrictedTechs?.length || 0} জন টেকনিশিয়ান সীমাবদ্ধ।`
          : `Overdue check complete: ${res.markedOverdue} overdue, ${res.restrictedTechs?.length || 0} technician(s) restricted.`
      );
      void loadOverview();
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'বকেয়া পরীক্ষা ব্যর্থ হয়েছে।' : 'Overdue check failed.'));
    }
  };

  const handleToggleRestriction = async (techId: string, restricted: boolean) => {
    try {
      await setTechnicianRestrictionAdmin(techId, restricted, restricted ? 'Admin overdue cash hold' : 'Admin lifted restriction');
      notify(
        isBangla
          ? restricted
            ? 'টেকনিশিয়ানের নতুন বুকিং স্থগিত করা হয়েছে।'
            : 'বুকিং স্থগিতাদেশ তুলে নেওয়া হয়েছে।'
          : restricted
          ? 'Technician restricted from new bookings.'
          : 'Booking restriction lifted.'
      );
      void loadOverview();
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'সীমাবদ্ধতা পরিবর্তন ব্যর্থ হয়েছে।' : 'Failed to toggle restriction.'));
    }
  };

  const handleSaveReserve = async (techId: string) => {
    try {
      const raw = reserveInputs[techId];
      const val = raw === '' || raw === undefined ? null : Number(raw);
      await setTechnicianReserveAdmin(techId, val, 'Admin technician reserve adjustment');
      notify(isBangla ? 'টেকনিশিয়ান রিজার্ভ সীমা আপডেট হয়েছে।' : 'Technician reserve requirement updated.');
      void loadOverview();
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'রিজার্ভ আপডেট ব্যর্থ হয়েছে।' : 'Failed to update reserve.'));
    }
  };

  const handleVerifyPayoutAccount = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await verifyPayoutAccountAdmin(id, status, `Admin marked payout account ${status}`);
      notify(
        isBangla
          ? `পেমেন্ট অ্যাকাউন্ট ${status === 'VERIFIED' ? 'যাচাইকৃত' : 'বাতিল'} হয়েছে।`
          : `Payout account ${status.toLowerCase()}.`
      );
      void loadOverview();
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'পেমেন্ট অ্যাকাউন্ট যাচাই ব্যর্থ হয়েছে।' : 'Failed to verify payout account.'));
    }
  };

  const handleIssueRefund = async (txId: string, amount: number) => {
    try {
      await refundPaymentAdmin(txId, amount, 'Admin dispute refund');
      notify(
        isBangla
          ? `৳${amount} রিফান্ড সম্পন্ন হয়েছে এবং টেকনিশিয়ান লেজার সমন্বয় করা হয়েছে।`
          : `Refund of ৳${amount} issued and technician ledger debited.`
      );
      void loadOverview();
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'রিফান্ড ব্যর্থ হয়েছে।' : 'Refund failed.'));
    }
  };

  if (loading && !summary) {
    return (
      <div className="p-6 text-center text-xs text-zinc-500">
        {isBangla ? 'অ্যাডমিন আর্থিক তথ্য লোড হচ্ছে...' : 'Loading Admin financial telemetry...'}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-zinc-900 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>
              {isBangla
                ? 'Servexa আর্থিক ব্যবস্থাপনা, কমিশন ও হিসাব সমন্বয়'
                : 'Servexa Financial Management, Commissions & Reconciliation'}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isBangla
              ? 'লেজার-ভিত্তিক ৯০/১০ বিভাজন, ৳৫০০ ন্যূনতম রিজার্ভ, টাকা উত্তোলন নিষ্পত্তি এবং কাজ শেষে নগদ জমা যাচাই।'
              : 'Ledger-derived 90/10 splits, ৳500 minimum reserve enforcement, withdrawal settlements, and Cash-on-Completion deposit audits.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={handleCheckOverdueCash}
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isBangla ? 'বকেয়া নগদ পরীক্ষা করুন' : 'Run Overdue Cash Check'}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleExportCsv()}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isBangla ? 'CSV লেজার ডাউনলোড' : 'Export CSV Ledger'}</span>
          </button>
          <button
            type="button"
            onClick={() => void loadOverview()}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          ✓ {toast}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Sub-Tabs */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold">
        {(
          [
            ['overview', isBangla ? '১৬টি আর্থিক সূচক ও চার্ট' : 'All 16 Financial Metrics & Charts'],
            [
              'withdrawals',
              isBangla
                ? `উত্তোলন (${withdrawals.filter((w) => ['PENDING', 'UNDER_REVIEW', 'PROCESSING'].includes(w.status)).length} চলমান) ও কেওয়াইসি`
                : `Withdrawals (${withdrawals.filter((w) => ['PENDING', 'UNDER_REVIEW', 'PROCESSING'].includes(w.status)).length} Open) & KYC`,
            ],
            [
              'cash',
              isBangla
                ? `কাজ শেষে নগদ জমা (${cashDeposits.filter((c) => ['CASH_PENDING', 'VERIFICATION_PENDING', 'OVERDUE'].includes(c.status)).length})`
                : `Cash-on-Completion (${cashDeposits.filter((c) => ['CASH_PENDING', 'VERIFICATION_PENDING', 'OVERDUE'].includes(c.status)).length})`,
            ],
            [
              'wallets',
              isBangla
                ? `টেকনিশিয়ান ওয়ালেট ও রিজার্ভ (${techWallets.length})`
                : `Technician Wallets & Reserves (${techWallets.length})`,
            ],
            [
              'ledger',
              isBangla ? `লেনদেন ও রিফান্ড (${transactions.length})` : `Transactions & Refunds (${transactions.length})`,
            ],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSubTab(k)}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl cursor-pointer transition-colors ${
              subTab === k
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: 16 SERVER-COMPUTED METRICS */}
      {subTab === 'overview' && summary && (
        <div className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 text-xs">
            {[
              [
                isBangla ? 'মোট প্ল্যাটফর্ম আয় (GMV)' : 'Total Platform Revenue (GMV)',
                `৳${summary.totalPlatformRevenue.toLocaleString()}`,
                'text-zinc-900 dark:text-white',
              ],
              [
                isBangla ? 'মোট প্ল্যাটফর্ম কমিশন (Servexa)' : 'Total Platform Commission (Servexa)',
                `৳${summary.totalPlatformCommission.toLocaleString()}`,
                'text-emerald-600',
              ],
              [
                isBangla ? 'টেকনিশিয়ান নিট আয়' : 'Total Technician Earnings (Net)',
                `৳${summary.totalTechnicianEarnings.toLocaleString()}`,
                'text-orange-600',
              ],
              [
                isBangla ? 'অপেক্ষমাণ টেকনিশিয়ান আয়' : 'Pending Technician Earnings',
                `৳${summary.pendingTechnicianEarnings.toLocaleString()}`,
                'text-amber-600',
              ],
              [
                isBangla ? 'উপলব্ধ টেকনিশিয়ান ব্যালেন্স' : 'Available Technician Balances',
                `৳${summary.availableTechnicianEarnings.toLocaleString()}`,
                'text-emerald-600',
              ],
              [
                isBangla ? 'মোট রিজার্ভ ব্যালেন্স (৳৫০০/জন)' : 'Total Reserved Balances (৳500/tech)',
                `৳${summary.totalReservedBalance.toLocaleString()}`,
                'text-blue-600',
              ],
              [
                isBangla ? 'সর্বমোট উত্তোলনযোগ্য ব্যালেন্স' : 'Total Withdrawable Across Techs',
                `৳${summary.totalWithdrawableBalance.toLocaleString()}`,
                'text-orange-600',
              ],
              [
                isBangla ? 'টাকা উত্তোলনের আবেদন (সংখ্যা / ৳)' : 'Withdrawal Requests (Count / ৳)',
                `${summary.totalWithdrawalRequestsCount} · ৳${summary.totalWithdrawalRequestedAmount.toLocaleString()}`,
                'text-zinc-900 dark:text-white',
              ],
              [
                isBangla ? 'সম্পন্ন উত্তোলন' : 'Completed Withdrawals',
                `${summary.completedWithdrawalsCount} · ৳${summary.completedWithdrawalsAmount.toLocaleString()}`,
                'text-emerald-600',
              ],
              [
                isBangla ? 'অপেক্ষমাণ / পর্যালোচনাধীন উত্তোলন' : 'Pending / Under Review Withdrawals',
                `${summary.pendingWithdrawalsCount} · ৳${summary.pendingWithdrawalsAmount.toLocaleString()}`,
                'text-amber-600',
              ],
              [
                isBangla ? 'ব্যর্থ / ফেরত উত্তোলন' : 'Failed / Reversed Withdrawals',
                `${summary.failedWithdrawalsCount} · ৳${summary.failedWithdrawalsAmount.toLocaleString()}`,
                'text-rose-600',
              ],
              [
                isBangla ? 'মোট অনলাইন পেমেন্ট সংগ্রহ' : 'Total Online Collections',
                `৳${summary.totalOnlineCollections.toLocaleString()}`,
                'text-blue-600',
              ],
              [
                isBangla ? 'টেকনিশিয়ানের সংগৃহীত নগদ' : 'Cash Collected by Technicians',
                `৳${summary.cashCollectedByTechnicians.toLocaleString()}`,
                'text-zinc-900 dark:text-white',
              ],
              [
                isBangla ? 'বাকি / যাচাইকৃত নগদ জমা' : 'Cash Pending / Verified Deposits',
                `৳${summary.cashPendingDeposits} / ৳${summary.verifiedCashDeposits}`,
                'text-emerald-600',
              ],
              [
                isBangla ? 'সময়সীমা অতিক্রান্ত নগদ জমা' : 'Overdue Cash Deposits',
                `৳${summary.overdueCashDeposits.toLocaleString()}`,
                'text-rose-600',
              ],
              [
                isBangla ? 'বকেয়া কমিশন পাওনা / রিফান্ড' : 'Outstanding Commission Dues / Refunds',
                `৳${summary.outstandingCommissionDues} · ${isBangla ? 'রিফান্ড' : 'Ref'}: ৳${summary.totalRefundsAmount}`,
                'text-amber-600',
              ],
            ].map(([label, val, color], idx) => (
              <div key={idx} className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="text-[10px] sm:text-[11px] text-zinc-500 font-semibold leading-tight">{label}</div>
                <div className={`text-sm sm:text-lg font-black tabular-nums ${color}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Simple Visual Distribution Bar */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
            <div className="font-black text-zinc-900 dark:text-white">
              {isBangla ? 'প্ল্যাটফর্ম আয়ের বিভাজন চিত্র' : 'Platform Revenue Split Visualization'}
            </div>
            <div className="w-full h-4 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden flex">
              <div
                className="bg-orange-500 h-full"
                style={{
                  width: `${
                    summary.totalTechnicianEarnings + summary.totalPlatformCommission > 0
                      ? (summary.totalTechnicianEarnings / (summary.totalTechnicianEarnings + summary.totalPlatformCommission)) * 100
                      : 90
                  }%`,
                }}
                title={isBangla ? 'টেকনিশিয়ান অংশ' : 'Technician Share'}
              />
              <div className="bg-emerald-500 h-full flex-1" title={isBangla ? 'Servexa কমিশন' : 'Servexa Commission'} />
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                {isBangla ? 'টেকনিশিয়ান নিট আয়:' : 'Technician Net Earnings:'} ৳
                {summary.totalTechnicianEarnings.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {isBangla ? 'Servexa কমিশন:' : 'Servexa Commission:'} ৳
                {summary.totalPlatformCommission.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: WITHDRAWALS & PAYOUT ACCOUNT KYC */}
      {subTab === 'withdrawals' && (
        <div className="space-y-4 sm:space-y-5">
          {/* Payout Accounts Verification */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-5 space-y-3">
            <h4 className="text-sm font-black text-zinc-900 dark:text-white">
              {isBangla ? 'টেকনিশিয়ান পেমেন্ট অ্যাকাউন্ট যাচাই (KYC)' : 'Technician Payout Accounts Verification'}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                    <th className="py-2">{isBangla ? 'টেকনিশিয়ান' : 'Technician'}</th>
                    <th className="py-2">{isBangla ? 'মাধ্যম ও অ্যাকাউন্ট' : 'Provider & Account'}</th>
                    <th className="py-2">{isBangla ? 'অ্যাকাউন্টের নাম' : 'Title'}</th>
                    <th className="py-2">{isBangla ? 'অবস্থা' : 'Status'}</th>
                    <th className="py-2 text-right">{isBangla ? 'পদক্ষেপ' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {payoutAccounts.map((pa) => (
                    <tr key={pa.id}>
                      <td className="py-2.5 font-bold">{pa.technicianName}</td>
                      <td className="py-2.5 font-mono uppercase">
                        {pa.provider} · {pa.accountNumber} {pa.bankName ? `(${pa.bankName})` : ''}
                      </td>
                      <td className="py-2.5">{pa.accountTitle}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            pa.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : pa.verificationStatus === 'REJECTED'
                              ? 'bg-rose-500/15 text-rose-600'
                              : 'bg-amber-500/15 text-amber-600'
                          }`}
                        >
                          {formatVerificationStatus(pa.verificationStatus)}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {pa.verificationStatus === 'PENDING' && (
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleVerifyPayoutAccount(pa.id, 'VERIFIED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                            >
                              {isBangla ? 'যাচাই করুন' : 'Verify'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleVerifyPayoutAccount(pa.id, 'REJECTED')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                            >
                              {isBangla ? 'বাতিল' : 'Reject'}
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

          {/* Withdrawal Requests Queue */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-5 space-y-3">
            <h4 className="text-sm font-black text-zinc-900 dark:text-white">
              {isBangla ? 'টেকনিশিয়ান টাকা উত্তোলন নিষ্পত্তি তালিকা' : 'Technician Withdrawal Settlement Queue'}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                    <th className="py-2">{isBangla ? 'টেকনিশিয়ান ও অ্যাকাউন্ট' : 'Tech & Account'}</th>
                    <th className="py-2">{isBangla ? 'আবেদিত' : 'Requested'}</th>
                    <th className="py-2">{isBangla ? 'নিট প্রদেয়' : 'Net Payout'}</th>
                    <th className="py-2">{isBangla ? 'অবস্থা' : 'Status'}</th>
                    <th className="py-2">{isBangla ? 'প্রোভাইডার রেফারেন্স' : 'Provider Ref'}</th>
                    <th className="py-2 text-right">{isBangla ? 'পদক্ষেপ' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td className="py-3">
                        <div className="font-bold text-zinc-900 dark:text-white">{w.technicianName || w.technicianId}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {w.provider.toUpperCase()} · {w.accountNumberMasked}
                        </div>
                      </td>
                      <td className="py-3 font-bold">৳{w.requestedAmount}</td>
                      <td className="py-3 font-black text-emerald-600">৳{w.netPayoutAmount}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            w.status === 'COMPLETED'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : ['FAILED', 'REJECTED', 'REVERSED'].includes(w.status)
                              ? 'bg-rose-500/15 text-rose-600'
                              : 'bg-amber-500/15 text-amber-600'
                          }`}
                        >
                          {formatWithdrawalStatus(w.status)}
                        </span>
                      </td>
                      <td className="py-3">
                        {['PENDING', 'UNDER_REVIEW', 'PROCESSING'].includes(w.status) ? (
                          <input
                            type="text"
                            placeholder={isBangla ? 'পে-আউট TxID (ন্যূনতম ৪ অক্ষর)' : 'Payout TxID (min 4 chars)'}
                            value={payoutRefs[w.id] || ''}
                            onChange={(e) => setPayoutRefs({ ...payoutRefs, [w.id]: e.target.value })}
                            className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-[11px] w-28 sm:w-40"
                          />
                        ) : (
                          <span className="font-mono text-[11px]">{w.providerReference || w.failureReason || '—'}</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {['PENDING', 'UNDER_REVIEW', 'PROCESSING'].includes(w.status) && (
                          <div className="inline-flex flex-wrap justify-end gap-1">
                            {w.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => void handleWithdrawalAction(w.id, 'PROCESSING')}
                                className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold cursor-pointer"
                              >
                                {isBangla ? 'প্রসেস' : 'Process'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleWithdrawalAction(w.id, 'COMPLETE')}
                              className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                            >
                              {isBangla ? 'সম্পন্ন' : 'Complete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleWithdrawalAction(w.id, 'FAIL')}
                              className="px-2 py-1 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                            >
                              {isBangla ? 'ব্যর্থ ও ফেরত' : 'Fail & Restore'}
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

      {/* SUB-TAB 3: CASH-ON-COMPLETION RECONCILIATION */}
      {subTab === 'cash' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>
                  {isBangla
                    ? 'কাজ শেষে নগদ সংগ্রহ ও মার্চেন্ট ডিপোজিট সমন্বয়'
                    : 'Cash-on-Completion Collections & Merchant Deposit Reconciliation'}
                </span>
              </h4>
              <p className="text-xs text-zinc-500">
                {isBangla
                  ? 'টেকনিশিয়ান পুরো নগদ সংগ্রহ করে অনুমোদিত মাধ্যমে ট্রানজেকশন রেফারেন্সসহ জমা দেন এবং অ্যাডমিন যাচাই করে ৯০/১০ লেজার সমন্বয় করেন।'
                  : 'Technicians collect full cash, deposit via approved channel with unique transaction reference, and Admin reconciles before crediting 90/10 ledger.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <th className="py-2">{isBangla ? 'বুকিং' : 'Booking'}</th>
                  <th className="py-2">{isBangla ? 'টেকনিশিয়ান' : 'Technician'}</th>
                  <th className="py-2">{isBangla ? 'সংগৃহীত / বিভাজন' : 'Collected / Split'}</th>
                  <th className="py-2">{isBangla ? 'শেষ সময়' : 'Deadline'}</th>
                  <th className="py-2">{isBangla ? 'জমার রেফারেন্স' : 'Deposit Reference'}</th>
                  <th className="py-2">{isBangla ? 'অবস্থা' : 'Status'}</th>
                  <th className="py-2 text-right">{isBangla ? 'সমন্বয়' : 'Reconcile'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {cashDeposits.map((c) => (
                  <tr key={c.cashCollectionId}>
                    <td className="py-3 font-mono font-bold text-orange-600">#{c.bookingNumber}</td>
                    <td className="py-3 font-bold">{c.technicianName}</td>
                    <td className="py-3">
                      <div className="font-black">৳{c.amountCollected}</div>
                      <div className="text-[10px] text-zinc-400">
                        {isBangla ? 'টেকনিশিয়ান' : 'Tech'}: ৳{c.technicianShareAmount} · Servexa: ৳{c.commissionAmount}
                      </div>
                    </td>
                    <td className="py-3 text-[11px] font-mono">{new Date(c.deadlineAt).toLocaleDateString()}</td>
                    <td className="py-3 font-mono text-[11px]">
                      {c.depositReference
                        ? `${c.channel}: ${c.depositReference}`
                        : isBangla
                        ? 'এখনো জমা দেওয়া হয়নি'
                        : 'Not submitted yet'}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          c.status === 'COMMISSION_RECORDED'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : c.status === 'OVERDUE'
                            ? 'bg-rose-500/20 text-rose-600'
                            : 'bg-amber-500/15 text-amber-600'
                        }`}
                      >
                        {formatCashDepositStatus(c.status)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {c.depositId && c.depositStatus === 'VERIFICATION_PENDING' && (
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleVerifyCashDeposit(c.depositId, 'APPROVE')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                          >
                            {isBangla ? 'যাচাই ও ক্রেডিট' : 'Verify & Credit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleVerifyCashDeposit(c.depositId, 'REJECT')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                          >
                            {isBangla ? 'বাতিল' : 'Reject'}
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
      )}

      {/* SUB-TAB 4: TECHNICIAN WALLETS, RESERVES & BOOKING RESTRICTIONS */}
      {subTab === 'wallets' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-5 space-y-3 sm:space-y-4">
          <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-orange-500" />
            <span>
              {isBangla
                ? 'টেকনিশিয়ান ওয়ালেট, ন্যূনতম রিজার্ভ পরিবর্তন ও বুকিং অ্যাক্সেস'
                : 'Technician Wallets, Minimum Reserve Overrides & Booking Access'}
            </span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <th className="py-2">{isBangla ? 'টেকনিশিয়ান' : 'Technician'}</th>
                  <th className="py-2">{isBangla ? 'অপেক্ষমাণ' : 'Pending'}</th>
                  <th className="py-2">{isBangla ? 'উপলব্ধ' : 'Available'}</th>
                  <th className="py-2">{isBangla ? 'রিজার্ভ (৳)' : 'Reserve (৳)'}</th>
                  <th className="py-2">{isBangla ? 'উত্তোলনযোগ্য' : 'Withdrawable'}</th>
                  <th className="py-2">{isBangla ? 'বকেয়া নগদ' : 'Cash Pending'}</th>
                  <th className="py-2">{isBangla ? 'বুকিং অ্যাক্সেস' : 'Booking Access'}</th>
                  <th className="py-2 text-right">{isBangla ? 'রিজার্ভ পরিবর্তন' : 'Reserve Override'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {techWallets.map((tw) => (
                  <tr key={tw.id}>
                    <td className="py-3">
                      <div className="font-bold text-zinc-900 dark:text-white">{tw.name}</div>
                      <div className="text-[10px] text-zinc-400">{tw.primaryArea} · {tw.phone}</div>
                    </td>
                    <td className="py-3 font-bold text-amber-600">৳{tw.wallet.pendingEarnings}</td>
                    <td className="py-3 font-bold text-emerald-600">৳{tw.wallet.availableBalance}</td>
                    <td className="py-3 font-bold text-blue-600">৳{tw.wallet.reservedBalance}</td>
                    <td className="py-3 font-black text-orange-600">৳{tw.wallet.withdrawableBalance}</td>
                    <td className="py-3 font-bold text-rose-600">৳{tw.wallet.cashPending}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleRestriction(tw.id, !tw.wallet.bookingRestricted)}
                        className={`px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer ${
                          tw.wallet.bookingRestricted
                            ? 'bg-rose-500/20 text-rose-600'
                            : 'bg-emerald-500/15 text-emerald-600'
                        }`}
                      >
                        {tw.wallet.bookingRestricted ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        <span>
                          {tw.wallet.bookingRestricted
                            ? isBangla
                              ? 'সীমাবদ্ধ'
                              : 'Restricted'
                            : isBangla
                            ? 'সক্রিয়'
                            : 'Active'}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          placeholder={String(tw.wallet.reservedBalance)}
                          value={reserveInputs[tw.id] ?? ''}
                          onChange={(e) => setReserveInputs({ ...reserveInputs, [tw.id]: e.target.value })}
                          className="w-20 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => void handleSaveReserve(tw.id)}
                          className="px-2 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold cursor-pointer"
                        >
                          {isBangla ? 'সেট' : 'Set'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: FILTERABLE TRANSACTIONS & ONLINE REFUNDS */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
            <div className="relative sm:col-span-2">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isBangla ? 'বুকিং, গ্রাহক বা টেকনিশিয়ান খুঁজুন...' : 'Search booking, customer, technician...'}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 font-bold"
            >
              <option value="">{isBangla ? 'সকল পেমেন্ট অবস্থা' : 'All Payment Status'}</option>
              <option value="PAID">{isBangla ? 'পরিশোধিত (PAID)' : 'PAID'}</option>
              <option value="PENDING">{isBangla ? 'বাকি (PENDING)' : 'PENDING'}</option>
              <option value="CASH_ON_SERVICE">{isBangla ? 'কাজ শেষে নগদ' : 'CASH_ON_SERVICE'}</option>
              <option value="REFUNDED">{isBangla ? 'রিফান্ডকৃত (REFUNDED)' : 'REFUNDED'}</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800"
            />
            <button
              type="button"
              onClick={() => void loadOverview()}
              className="px-4 py-2 rounded-xl bg-orange-600 text-white font-black cursor-pointer"
            >
              {isBangla ? 'ফিল্টার প্রয়োগ' : 'Apply Filters'}
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-5 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <th className="py-2">{isBangla ? 'বুকিং' : 'Booking'}</th>
                  <th className="py-2">{isBangla ? 'গ্রাহক / টেকনিশিয়ান' : 'Customer / Tech'}</th>
                  <th className="py-2">{isBangla ? 'মাধ্যম ও অবস্থা' : 'Method & Status'}</th>
                  <th className="py-2">{isBangla ? 'চূড়ান্ত মোট' : 'Final Total'}</th>
                  <th className="py-2">{isBangla ? 'Servexa কমিশন' : 'Servexa Comm'}</th>
                  <th className="py-2">{isBangla ? 'টেকনিশিয়ানের অংশ' : 'Tech Share'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {transactions.map((tx) => (
                  <tr key={tx.bookingId}>
                    <td className="py-3 font-mono font-bold text-orange-600">#{tx.bookingNumber}</td>
                    <td className="py-3">
                      <div className="font-bold">{tx.customerName}</div>
                      <div className="text-[11px] text-zinc-400">
                        {isBangla ? 'টেকনিশিয়ান:' : 'Tech:'} {tx.technicianName}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="uppercase font-bold">{tx.paymentMethod}</span> ·{' '}
                      <span className="font-semibold text-emerald-600">{formatPaymentStatus(tx.paymentStatus)}</span>
                    </td>
                    <td className="py-3 font-black">৳{tx.finalAgreedAmount ?? '—'}</td>
                    <td className="py-3 font-bold text-emerald-600">
                      ৳{tx.platformCommissionAmount ?? 0} ({tx.platformCommissionPercent ?? 10}%)
                    </td>
                    <td className="py-3 font-bold text-orange-600">৳{tx.technicianEarningsAmount ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paymentTransactions.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-5 space-y-3">
              <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>{isBangla ? 'অনলাইন পেমেন্ট গেটওয়ে লেনদেন' : 'Online Payment Gateway Transactions'}</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                      <th className="py-2">{isBangla ? 'ট্রানজেকশন আইডি' : 'Tx ID'}</th>
                      <th className="py-2">{isBangla ? 'মাধ্যম / মোড' : 'Method / Mode'}</th>
                      <th className="py-2">{isBangla ? 'পরিমাণ' : 'Amount'}</th>
                      <th className="py-2">{isBangla ? 'অবস্থা' : 'Status'}</th>
                      <th className="py-2 text-right">{isBangla ? 'রিফান্ড' : 'Refund'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {paymentTransactions.map((pt) => (
                      <tr key={pt.id}>
                        <td className="py-2.5 font-mono">{pt.id}</td>
                        <td className="py-2.5 uppercase font-bold">
                          {pt.method} ({pt.providerMode})
                        </td>
                        <td className="py-2.5 font-black">৳{pt.amount}</td>
                        <td className="py-2.5 font-bold">{formatPaymentStatus(pt.status)}</td>
                        <td className="py-2.5 text-right">
                          {pt.status === 'VERIFIED' && (
                            <button
                              type="button"
                              onClick={() => void handleIssueRefund(pt.id, pt.amount - pt.refundedAmount)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                            >
                              {isBangla ? 'রিফান্ড দিন' : 'Issue Refund'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
