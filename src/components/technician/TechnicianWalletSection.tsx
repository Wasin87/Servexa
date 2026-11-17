import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ShieldAlert,
  Banknote,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  addPayoutAccount,
  fetchWalletDashboard,
  requestWithdrawal,
  submitCashDepositReference,
} from '../../services/financeApi';
import type {
  CashCollectionRecord,
  PayoutAccount,
  PayoutProvider,
  WalletLedgerEntry,
  WalletSummary,
  WithdrawalRequest,
} from '../../types/finance';

interface Props {
  technicianId: string;
}

export const TechnicianWalletSection: React.FC<Props> = ({ technicianId }) => {
  const { authTokenReady, currentUser } = useAuth();
  const { isBangla } = useLanguage();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [policy, setPolicy] = useState<any>(null);
  const [ledger, setLedger] = useState<WalletLedgerEntry[]>([]);
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [cashCollections, setCashCollections] = useState<CashCollectionRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Payout Account Form
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAcct, setNewAcct] = useState({
    provider: 'bkash' as PayoutProvider,
    accountTitle: '',
    accountNumber: '',
    bankName: '',
    branchName: '',
  });

  // Withdrawal Request Form
  const [selectedAcctId, setSelectedAcctId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [withdrawing, setWithdrawing] = useState(false);

  // Cash Deposit Reference Form per collectionId
  const [depositChannel, setDepositChannel] = useState<Record<string, string>>({});
  const [depositRef, setDepositRef] = useState<Record<string, string>>({});

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const formatVerificationStatus = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return isBangla ? 'যাচাইকৃত' : 'Verified';
      case 'REJECTED':
        return isBangla ? 'প্রত্যাখ্যাত' : 'Rejected';
      case 'PENDING':
        return isBangla ? 'যাচাই অপেক্ষমাণ' : 'Pending';
      default:
        return status;
    }
  };

  const formatCashStatus = (status: string) => {
    switch (status) {
      case 'CASH_PENDING':
        return isBangla ? 'জমা বাকি' : 'Cash Pending';
      case 'CASH_COLLECTED':
        return isBangla ? 'ক্যাশ সংগৃহীত' : 'Cash Collected';
      case 'VERIFICATION_PENDING':
        return isBangla ? 'অ্যাডমিন যাচাই অপেক্ষমাণ' : 'Verification Pending';
      case 'OVERDUE':
        return isBangla ? 'সময়সীমা উত্তীর্ণ (Overdue)' : 'Overdue';
      case 'COMMISSION_RECORDED':
        return isBangla ? 'কমিশন সমন্বিত (Completed)' : 'Commission Recorded';
      case 'REJECTED':
        return isBangla ? 'প্রত্যাখ্যাত' : 'Rejected';
      default:
        return status;
    }
  };

  const formatWithdrawalStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return isBangla ? 'অপেক্ষমাণ' : 'Pending';
      case 'UNDER_REVIEW':
        return isBangla ? 'রিভিউ চলছে' : 'Under Review';
      case 'PROCESSING':
        return isBangla ? 'প্রসেসিং হচ্ছে' : 'Processing';
      case 'COMPLETED':
        return isBangla ? 'সম্পন্ন' : 'Completed';
      case 'FAILED':
        return isBangla ? 'ব্যর্থ' : 'Failed';
      case 'REJECTED':
        return isBangla ? 'প্রত্যাখ্যাত' : 'Rejected';
      case 'REVERSED':
        return isBangla ? 'রিভার্সড' : 'Reversed';
      default:
        return status;
    }
  };

  const formatDepositChannel = (ch: string) => {
    switch (ch) {
      case 'bkash_merchant':
        return isBangla ? 'বিকাশ মার্চেন্ট' : 'bKash Merchant';
      case 'nagad_merchant':
        return isBangla ? 'নগদ মার্চেন্ট' : 'Nagad Merchant';
      case 'bank_transfer':
        return isBangla ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer';
      default:
        return ch;
    }
  };

  const loadWallet = async () => {
    if (!authTokenReady) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const targetParam = currentUser?.role === 'ADMIN' ? technicianId : undefined;
      const data = await fetchWalletDashboard(targetParam);
      setWallet(data.wallet);
      setPolicy(data.reservePolicy);
      setLedger(data.ledgerEntries || []);
      setPayoutAccounts(data.payoutAccounts || []);
      setWithdrawals(data.withdrawals || []);
      setCashCollections(data.cashCollections || []);
      const verified = (data.payoutAccounts || []).find((a) => a.verificationStatus === 'VERIFIED');
      if (verified) setSelectedAcctId(verified.id);
      else if (data.payoutAccounts?.[0]) setSelectedAcctId(data.payoutAccounts[0].id);
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'ওয়ালেট লেজার লোড করা যায়নি।' : 'Failed to load wallet ledger.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authTokenReady) return;
    void loadWallet();
  }, [technicianId, authTokenReady, currentUser?.id]);

  const handleAddPayoutAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await addPayoutAccount(newAcct);
      setShowAddAccount(false);
      setNewAcct({ provider: 'bkash', accountTitle: '', accountNumber: '', bankName: '', branchName: '' });
      notify(
        isBangla
          ? 'পেআউট অ্যাকাউন্টটি অ্যাডমিন KYC যাচাইয়ের জন্য পাঠানো হয়েছে।'
          : 'Payout account submitted for Admin KYC verification.'
      );
      void loadWallet();
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'পেআউট অ্যাকাউন্ট যোগ করা যায়নি।' : 'Failed to add payout account.'));
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcctId) {
      setErrorMsg(isBangla ? 'অনুগ্রহ করে একটি ভেরিফায়েড পেআউট অ্যাকাউন্ট নির্বাচন করুন।' : 'Please select a verified payout account.');
      return;
    }
    setWithdrawing(true);
    setErrorMsg(null);
    try {
      await requestWithdrawal({
        payoutAccountId: selectedAcctId,
        amount: withdrawAmount,
        idempotencyKey: `${technicianId}-${Date.now()}`,
      });
      notify(
        isBangla
          ? `৳${withdrawAmount} উত্তোলনের আবেদন জমা হয়েছে এবং লেজারে সংরক্ষিত হয়েছে!`
          : `Withdrawal request of ৳${withdrawAmount} submitted & reserved in ledger!`
      );
      void loadWallet();
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (isBangla ? 'রিজার্ভ ও সীমা যাচাইয়ের কারণে উত্তোলনের আবেদন ব্যর্থ হয়েছে।' : 'Withdrawal rejected by reserve/limit validation.')
      );
    } finally {
      setWithdrawing(false);
    }
  };

  const handleSubmitCashDeposit = async (cc: CashCollectionRecord) => {
    const channel = depositChannel[cc.id] || 'bkash_merchant';
    const ref = (depositRef[cc.id] || '').trim();
    setErrorMsg(null);
    try {
      await submitCashDepositReference({
        cashCollectionId: cc.id,
        channel,
        depositReference: ref,
        amountDeposited: cc.amountCollected,
      });
      notify(
        isBangla
          ? `ক্যাশ ডিপোজিট রেফারেন্স "${ref}" অ্যাডমিন যাচাইয়ের জন্য পাঠানো হয়েছে!`
          : `Cash deposit reference "${ref}" submitted for Admin reconciliation!`
      );
      void loadWallet();
    } catch (err: any) {
      setErrorMsg(err?.message || (isBangla ? 'ডিপোজিট রেফারেন্স জমা দেওয়া যায়নি।' : 'Deposit reference submission failed.'));
    }
  };

  if (loading && !wallet) {
    return (
      <div className="p-6 text-center text-xs text-zinc-500">
        {isBangla ? 'টেকনিশিয়ান ওয়ালেট ও রিজার্ভ লেজার লোড হচ্ছে...' : 'Loading Technician Wallet & Reserve Ledger...'}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Booking Restriction Warning Banner (Overdue Cash Deposits Only) */}
      {wallet?.bookingRestricted && (
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-500/60 flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-black text-rose-700 dark:text-rose-300 text-sm">
              {isBangla
                ? '⚠️ মেয়াদোত্তীর্ণ ক্যাশ ডিপোজিটের কারণে নতুন বুকিং সাময়িকভাবে সীমাবদ্ধ'
                : '⚠️ Account Temporarily Restricted from New Bookings Due to Overdue Cash Deposit'}
            </div>
            <p className="text-rose-600 dark:text-rose-400">
              {wallet.restrictionReason ||
                (isBangla
                  ? 'এক বা একাধিক নগদ সংগ্রহের নির্ধারিত জমা ও গ্রেস সময়সীমা অতিক্রান্ত হয়েছে।'
                  : 'One or more Cash-on-Completion collections passed the deposit deadline & grace period.')}{' '}
              {isBangla
                ? 'চলমান কাজ স্বাভাবিকভাবে সম্পন্ন করতে পারবেন; নতুন বুকিং সচল করতে নিচে ডিপোজিট রেফারেন্স জমা দিন।'
                : 'You may complete existing ongoing jobs normally; submit & verify your deposit reference below to restore new bookings automatically.'}
            </p>
          </div>
        </div>
      )}

      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 8 Separate Wallet Balances (Ledger-Derived) */}
      {wallet && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" />
              <span>
                {isBangla
                  ? `টেকনিশিয়ান আর্থিক ওয়ালেট (৯০/১০ কমিশন ও ৳${wallet.reservedBalance} ন্যূনতম রিজার্ভ)`
                  : `Technician Financial Wallet (90/10 Commission & ৳${wallet.reservedBalance} Minimum Reserve)`}
              </span>
            </h3>
            <button
              type="button"
              onClick={() => void loadWallet()}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isBangla ? 'লেজার রিফ্রেশ করুন' : 'Refresh Ledger'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 text-xs">
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 text-white space-y-1 shadow-md">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase opacity-90">
                {isBangla ? 'উত্তোলনযোগ্য ব্যালেন্স' : 'Withdrawable Now'}
              </div>
              <div className="text-lg sm:text-2xl font-black tabular-nums">৳{wallet.withdrawableBalance.toLocaleString()}</div>
              <div className="text-[10px] opacity-90">MAX(0, ৳{wallet.availableBalance} − ৳{wallet.reservedBalance})</div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="text-[10px] sm:text-[11px] text-zinc-500 font-bold">
                {isBangla ? 'উপলব্ধ ব্যালেন্স (Available)' : 'Available Balance'}
              </div>
              <div className="text-lg sm:text-2xl font-black text-emerald-600 tabular-nums">৳{wallet.availableBalance.toLocaleString()}</div>
              <div className="text-[10px] text-zinc-400">
                {isBangla ? '১০% কমিশন কাটার পর নিট আয়' : 'Net settled earnings after 10% comm'}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 space-y-1">
              <div className="text-[10px] sm:text-[11px] text-blue-600 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 shrink-0" />
                <span>{isBangla ? 'সংরক্ষিত রিজার্ভ (আপনারই অর্থ)' : 'Reserved Balance (Still Yours)'}</span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-blue-600 tabular-nums">৳{wallet.reservedBalance.toLocaleString()}</div>
              <div className="text-[10px] text-zinc-400">
                {isBangla ? 'ওয়ালেটে বাধ্যতামূলক ন্যূনতম রিজার্ভ' : 'Minimum reserve floor held in wallet'}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="text-[10px] sm:text-[11px] text-zinc-500 font-bold">
                {isBangla ? 'অপেক্ষমাণ আয় (Pending)' : 'Pending Earnings'}
              </div>
              <div className="text-lg sm:text-2xl font-black text-amber-600 tabular-nums">৳{wallet.pendingEarnings.toLocaleString()}</div>
              <div className="text-[10px] text-zinc-400">
                {isBangla ? 'কাজ সম্পন্ন হওয়ার অপেক্ষায়' : 'Awaiting job completion'}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="text-[10px] sm:text-[11px] text-zinc-500 font-bold">
                {isBangla ? 'সর্বমোট আয় (Lifetime)' : 'Total Lifetime Earnings'}
              </div>
              <div className="text-base sm:text-xl font-black text-zinc-900 dark:text-white tabular-nums">৳{wallet.totalEarnings.toLocaleString()}</div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="text-[10px] sm:text-[11px] text-zinc-500 font-bold">
                {isBangla ? 'জমা বাকি নগদ অর্থ' : 'Cash Pending Settlement'}
              </div>
              <div className="text-base sm:text-xl font-black text-rose-600 tabular-nums">৳{wallet.cashPending.toLocaleString()}</div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="text-[10px] sm:text-[11px] text-zinc-500 font-bold">
                {isBangla ? 'বকেয়া কমিশন (ক্যাশ কাজ)' : 'Commission Due (Cash)'}
              </div>
              <div className="text-base sm:text-xl font-black text-amber-600 tabular-nums">৳{wallet.commissionDue.toLocaleString()}</div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="text-[10px] sm:text-[11px] text-zinc-500 font-bold">
                {isBangla ? 'মোট উত্তোলিত অর্থ' : 'Total Withdrawn'}
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-600 tabular-nums">৳{wallet.totalWithdrawn.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Cash-on-Completion Collections Requiring Deposit */}
      {cashCollections.length > 0 && (
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 sm:space-y-4 text-xs">
          <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isBangla
                ? 'কাজ শেষে নগদ (Cash) সমন্বয় ট্র্যাকার (মার্চেন্ট ডিপোজিট রেফ জমা দিন)'
                : 'Cash-on-Completion Settlement Tracker (Submit Merchant Deposit Ref)'}
            </span>
          </h4>
          <div className="space-y-3">
            {cashCollections.map((cc) => {
              const needsDeposit = ['CASH_PENDING', 'CASH_COLLECTED', 'OVERDUE', 'REJECTED'].includes(cc.status);
              return (
                <div
                  key={cc.id}
                  className="p-3 sm:p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-black text-orange-600">#{cc.bookingNumber}</span> ·{' '}
                      {isBangla ? 'সংগৃহীত:' : 'Collected:'} <strong>৳{cc.amountCollected}</strong>{' '}
                      <span className="text-zinc-500">
                        {isBangla
                          ? `(আপনার ৯০% অংশ: ৳${cc.technicianShareAmount} · কমিশন: ৳${cc.commissionAmount})`
                          : `(Your 90% Share: ৳${cc.technicianShareAmount} · Commission: ৳${cc.commissionAmount})`}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        cc.status === 'COMMISSION_RECORDED'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : cc.status === 'OVERDUE'
                          ? 'bg-rose-500/20 text-rose-600'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}
                    >
                      {formatCashStatus(cc.status)}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {isBangla ? 'জমা দেওয়ার শেষ সময়:' : 'Deposit Deadline:'} {new Date(cc.deadlineAt).toLocaleString()}
                    </span>
                  </div>
                  {cc.deposit && (
                    <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                      {isBangla ? 'জমাকৃত রেফারেন্স:' : 'Submitted Ref:'} {formatDepositChannel(cc.deposit.channel)} ·{' '}
                      <strong>{cc.deposit.depositReference}</strong> ({cc.deposit.status})
                    </div>
                  )}
                  {needsDeposit && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <select
                        value={depositChannel[cc.id] || 'bkash_merchant'}
                        onChange={(e) => setDepositChannel({ ...depositChannel, [cc.id]: e.target.value })}
                        className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-bold"
                      >
                        {(policy?.approvedDepositChannels || ['bkash_merchant', 'nagad_merchant', 'bank_transfer']).map((ch: string) => (
                          <option key={ch} value={ch}>
                            {formatDepositChannel(ch)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={isBangla ? 'মার্চেন্ট TrxID দিন (যেমন: BKTX882910)' : 'Unique Merchant TrxID (e.g. BKTX882910)'}
                        value={depositRef[cc.id] || ''}
                        onChange={(e) => setDepositRef({ ...depositRef, [cc.id]: e.target.value })}
                        className="w-full sm:w-auto sm:flex-1 sm:min-w-[180px] p-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSubmitCashDeposit(cc)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer"
                      >
                        {isBangla ? `৳${cc.amountCollected} ডিপোজিট রেফ জমা দিন` : `Submit ৳${cc.amountCollected} Deposit Ref`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Withdrawal Request & Payout Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-xs">
        <form
          onSubmit={handleRequestWithdrawal}
          className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3.5 sm:space-y-4"
        >
          <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-orange-600" />
            <span>{isBangla ? 'অর্থ উত্তোলনের আবেদন (রিজার্ভ সুরক্ষিত)' : 'Request Withdrawal (Reserve Protected)'}</span>
          </h4>
          <div>
            <label className="font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
              {isBangla ? 'পেআউট অ্যাকাউন্ট:' : 'Payout Account:'}
            </label>
            <select
              value={selectedAcctId}
              onChange={(e) => setSelectedAcctId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-stone-50 dark:bg-zinc-800 font-bold"
            >
              {payoutAccounts.length === 0 && (
                <option value="">{isBangla ? 'কোনো পেআউট অ্যাকাউন্ট যুক্ত নেই' : 'No payout accounts added'}</option>
              )}
              {payoutAccounts.map((pa) => (
                <option key={pa.id} value={pa.id}>
                  {pa.provider.toUpperCase()} · {pa.accountNumber} ({formatVerificationStatus(pa.verificationStatus)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
              {isBangla
                ? `পরিমাণ (৳) — সর্বোচ্চ উত্তোলনযোগ্য: ৳${wallet?.withdrawableBalance ?? 0}`
                : `Amount (৳) — Max Withdrawable: ৳${wallet?.withdrawableBalance ?? 0}`}
            </label>
            <input
              type="number"
              min={policy?.minimumWithdrawalAmount || 100}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-stone-50 dark:bg-zinc-800 font-black text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={withdrawing || !wallet || wallet.withdrawableBalance < (policy?.minimumWithdrawalAmount || 100)}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-400 text-white font-black cursor-pointer"
          >
            {withdrawing
              ? isBangla
                ? 'আবেদন পাঠানো হচ্ছে...'
                : 'Submitting...'
              : isBangla
                ? `৳${withdrawAmount} উত্তোলনের আবেদন করুন`
                : `Withdraw ৳${withdrawAmount}`}
          </button>
        </form>

        {/* Payout Accounts List */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3.5 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-zinc-900 dark:text-white">
              {isBangla ? 'সংরক্ষিত পেআউট অ্যাকাউন্টসমূহ' : 'Saved Payout Accounts'}
            </h4>
            <button
              type="button"
              onClick={() => setShowAddAccount(!showAddAccount)}
              className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-zinc-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isBangla ? 'অ্যাকাউন্ট যোগ করুন' : 'Add Account'}</span>
            </button>
          </div>

          {showAddAccount && (
            <form onSubmit={handleAddPayoutAccount} className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800 space-y-2.5">
              <select
                value={newAcct.provider}
                onChange={(e) => setNewAcct({ ...newAcct, provider: e.target.value as PayoutProvider })}
                className="w-full p-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-bold uppercase"
              >
                <option value="bkash">{isBangla ? 'বিকাশ (bKash)' : 'bKash'}</option>
                <option value="nagad">{isBangla ? 'নগদ (Nagad)' : 'Nagad'}</option>
                <option value="rocket">{isBangla ? 'রকেট (Rocket)' : 'Rocket'}</option>
                <option value="bank">{isBangla ? 'ব্যাংক ট্রান্সফার (Bank Transfer)' : 'Bank Transfer'}</option>
              </select>
              <input
                type="text"
                required
                placeholder={isBangla ? 'অ্যাকাউন্টধারীর নাম' : 'Account Holder Title'}
                value={newAcct.accountTitle}
                onChange={(e) => setNewAcct({ ...newAcct, accountTitle: e.target.value })}
                className="w-full p-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
              />
              <input
                type="text"
                required
                placeholder={isBangla ? 'অ্যাকাউন্ট / মোবাইল নম্বর' : 'Account / Mobile Number'}
                value={newAcct.accountNumber}
                onChange={(e) => setNewAcct({ ...newAcct, accountNumber: e.target.value })}
                className="w-full p-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 font-mono"
              />
              {newAcct.provider === 'bank' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder={isBangla ? 'ব্যাংকের নাম' : 'Bank Name'}
                    value={newAcct.bankName}
                    onChange={(e) => setNewAcct({ ...newAcct, bankName: e.target.value })}
                    className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                  />
                  <input
                    type="text"
                    required
                    placeholder={isBangla ? 'শাখার নাম (Branch)' : 'Branch Name'}
                    value={newAcct.branchName}
                    onChange={(e) => setNewAcct({ ...newAcct, branchName: e.target.value })}
                    className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                  />
                </div>
              )}
              <button type="submit" className="w-full py-2 rounded-xl bg-emerald-600 text-white font-black cursor-pointer">
                {isBangla ? 'অ্যাডমিন যাচাইয়ের জন্য জমা দিন' : 'Submit for Admin Verification'}
              </button>
            </form>
          )}

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {payoutAccounts.map((pa) => (
              <div key={pa.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold uppercase text-zinc-900 dark:text-white">
                    {pa.provider} · {pa.accountNumber}
                  </div>
                  <div className="text-[11px] text-zinc-400">{pa.accountTitle}</div>
                </div>
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
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Withdrawal History & Append-Only Wallet Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-xs">
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h4 className="text-sm font-black text-zinc-900 dark:text-white">
            {isBangla ? 'উত্তোলন আবেদনের ইতিহাস' : 'Withdrawal Requests History'}
          </h4>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-64 overflow-y-auto">
            {withdrawals.length === 0 && (
              <div className="py-4 text-zinc-400">
                {isBangla ? 'এখনো কোনো উত্তোলনের আবেদন করা হয়নি।' : 'No withdrawal requests yet.'}
              </div>
            )}
            {withdrawals.map((w) => (
              <div key={w.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold uppercase">
                    {w.provider} · {w.accountNumberMasked}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {w.providerReference
                      ? `${isBangla ? 'রেফ:' : 'Ref:'} ${w.providerReference}`
                      : new Date(w.requestedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black">৳{w.requestedAmount}</div>
                  <div className="text-[10px] font-bold text-orange-600">{formatWithdrawalStatus(w.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h4 className="text-sm font-black text-zinc-900 dark:text-white">
            {isBangla ? 'অপরিবর্তনীয় ওয়ালেট লেজার (Wallet Ledger)' : 'Append-Only Wallet Ledger'}
          </h4>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-64 overflow-y-auto">
            {ledger.length === 0 && (
              <div className="py-4 text-zinc-400">
                {isBangla ? 'এখনো কোনো লেজার এন্ট্রি যুক্ত হয়নি।' : 'No ledger entries yet.'}
              </div>
            )}
            {ledger.map((l) => (
              <div key={l.id} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-zinc-900 dark:text-white">{l.entryType}</div>
                  <div className="text-[11px] text-zinc-400">{l.description}</div>
                </div>
                <div
                  className={`font-mono font-black shrink-0 ${
                    l.direction === 'CREDIT' || l.direction === 'RELEASE' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {l.direction === 'CREDIT' || l.direction === 'RELEASE' ? '+' : '-'}৳{l.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
