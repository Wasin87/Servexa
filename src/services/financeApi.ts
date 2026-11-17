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
import type { ServiceCategory, User } from '../types';
import { handleLocalFinanceFallback } from './localFinanceFallback';

const TOKEN_STORAGE_KEY = 'servexa_auth_token';

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    // Network unreachable -> seamless browser fallback (e.g., static deploy / offline)
    return handleLocalFinanceFallback<T>(url, options);
  }

  const contentType = res.headers.get('content-type') || '';

  // Static hosts like Vercel rewrite /api/* to index.html (text/html) or return 404/502/503 without Express
  if (!contentType.includes('application/json')) {
    if (res.status === 404 || res.status === 405 || res.status >= 500 || contentType.includes('text/html') || contentType === '') {
      return handleLocalFinanceFallback<T>(url, options);
    }
  }

  if (!res.ok) {
    if (res.status === 404 || res.status >= 502) {
      return handleLocalFinanceFallback<T>(url, options);
    }
    let errMsg = `HTTP ${res.status}`;
    if (contentType.includes('application/json')) {
      const errData = await res.json().catch(() => ({}));
      errMsg = errData?.error || errMsg;
    }
    const error: any = new Error(errMsg);
    error.status = res.status;
    throw error;
  }

  return res.json() as Promise<T>;
}

export async function syncServerSession(user: User): Promise<{ token: string; technicianId: string | null }> {
  const data = await apiRequest<{ token: string; user: { technicianId: string | null } }>('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
    }),
  });
  setStoredAuthToken(data.token);
  return { token: data.token, technicianId: data.user.technicianId };
}

// Public & Catalog APIs
export const fetchPublicRules = () => apiRequest<Partial<PlatformRules>>('/api/rules/public');

export const fetchCatalogOverview = () =>
  apiRequest<{
    categories: (ServiceCategory & { active: boolean; commissionOverridePercent?: number | null })[];
    subcategories: ServiceSubcategory[];
    pricingRules: PricingRule[];
  }>('/api/catalog/overview');

export const fetchPriceQuote = (payload: PriceQuoteRequest) =>
  apiRequest<{ quote: PriceQuoteResponse }>('/api/pricing/quote', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Admin Rules & Catalog APIs
export const fetchAdminRules = () =>
  apiRequest<{
    rules: PlatformRules;
    versions: RuleVersionRecord[];
    providers: Array<{
      provider: PaymentMethodCode;
      displayName: string;
      configured: boolean;
      mode: string;
      missingEnvVars: string[];
      onboardingNotes: string;
    }>;
  }>('/api/admin/rules');

export const updateAdminRules = (rules: PlatformRules, reason: string, confirmSensitive = false) =>
  apiRequest<{ rules: PlatformRules }>('/api/admin/rules', {
    method: 'PUT',
    body: JSON.stringify({ rules, reason, confirmSensitive }),
  });

export const fetchAuditLogs = (search = '') =>
  apiRequest<{ logs: AdminAuditLog[] }>(`/api/admin/audit-logs?search=${encodeURIComponent(search)}`);

export const createAdminCategory = (payload: any) =>
  apiRequest('/api/admin/categories', { method: 'POST', body: JSON.stringify(payload) });

export const updateAdminCategory = (id: string, payload: any) =>
  apiRequest(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteAdminCategory = (id: string) =>
  apiRequest(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const createAdminSubcategory = (payload: any) =>
  apiRequest('/api/admin/subcategories', { method: 'POST', body: JSON.stringify(payload) });

export const updateAdminPricingRule = (id: string, payload: any) =>
  apiRequest(`/api/admin/pricing-rules/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });

export const fetchAdminTechPricingQueue = () =>
  apiRequest<{ items: any[] }>('/api/admin/technician-pricing');

export const reviewTechPricing = (id: string, decision: 'APPROVE' | 'REJECT', reason?: string) =>
  apiRequest(`/api/admin/technician-pricing/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason }),
  });

// Technician Services & Pricing
export const fetchTechnicianServices = (technicianId?: string) =>
  apiRequest<{
    technicianId: string;
    services: TechnicianServiceConfig[];
    history: TechnicianPriceHistoryItem[];
  }>(`/api/technician/services${technicianId ? `?technicianId=${encodeURIComponent(technicianId)}` : ''}`);

export const selectTechnicianService = (subcategoryId: string) =>
  apiRequest<{ id: string; status: string }>('/api/technician/services/select', {
    method: 'POST',
    body: JSON.stringify({ subcategoryId }),
  });

export const updateTechnicianServicePricing = (
  id: string,
  payload: {
    price?: number;
    visitingFee?: number;
    hourlyRate?: number;
    additionalHourCharge?: number;
    emergencyCharge?: number;
    nightCharge?: number;
    weekendCharge?: number;
  }
) =>
  apiRequest<{ success: boolean; status: string; needsApproval: boolean }>(
    `/api/technician/services/${encodeURIComponent(id)}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );

export const toggleTechnicianServiceActive = (id: string, active: boolean) =>
  apiRequest(`/api/technician/services/${encodeURIComponent(id)}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });

// Booking, Snapshot, Extra Charges, Online Payment & Cash Collection
export const createServerBooking = (payload: any) =>
  apiRequest<{ booking: any; snapshot: BookingPriceSnapshot; quote: PriceQuoteResponse }>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateServerBookingStatus = (bookingId: string, status: string, noteEn?: string, noteBn?: string) =>
  apiRequest(`/api/bookings/${encodeURIComponent(bookingId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, noteEn, noteBn }),
  });

export const fetchBookingFinanceDetails = (bookingId: string) =>
  apiRequest<{
    snapshot: BookingPriceSnapshot | null;
    extraCharges: AdditionalChargeRequest[];
    paymentTransactions: PaymentTransaction[];
    cashCollection: CashCollectionRecord | null;
  }>(`/api/bookings/${encodeURIComponent(bookingId)}/snapshot`);

export const submitExtraChargeRequest = (
  bookingId: string,
  payload: { chargeType: AdditionalChargeRequest['chargeType']; reason: string; amount: number; receiptNote?: string }
) =>
  apiRequest(`/api/bookings/${encodeURIComponent(bookingId)}/extra-charges`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const respondToExtraCharge = (bookingId: string, chargeId: string, decision: 'APPROVE' | 'REJECT') =>
  apiRequest<{ status: string; snapshot: BookingPriceSnapshot | null }>(
    `/api/bookings/${encodeURIComponent(bookingId)}/extra-charges/${encodeURIComponent(chargeId)}/respond`,
    { method: 'POST', body: JSON.stringify({ decision }) }
  );

export const fetchPaymentProviders = () =>
  apiRequest<{ activeMethods: Record<PaymentMethodCode, boolean>; providers: any[] }>('/api/payments/providers');

export const initiatePayment = (bookingId: string, method: PaymentMethodCode, idempotencyKey?: string) =>
  apiRequest<{
    transaction: PaymentTransaction;
    configured: boolean;
    mode: string;
    missingEnvVars: string[];
    message: string;
  }>('/api/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({ bookingId, method, idempotencyKey }),
  });

export const collectCashOnCompletion = (bookingId: string) =>
  apiRequest<{ cashCollection: CashCollectionRecord }>('/api/cash/collect', {
    method: 'POST',
    body: JSON.stringify({ bookingId }),
  });

export const submitCashDepositReference = (payload: {
  cashCollectionId: string;
  channel: string;
  depositReference: string;
  amountDeposited: number;
  merchantAccountInfo?: string;
  note?: string;
}) =>
  apiRequest('/api/cash/submit-deposit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Wallet, Payout Accounts & Withdrawals
export const fetchWalletDashboard = (technicianId?: string) =>
  apiRequest<{
    wallet: WalletSummary;
    periodStats?: {
      todayEarnings: number;
      todayCompletedCount: number;
      weekEarnings: number;
      monthEarnings: number;
      monthCompletedCount: number;
      totalCompletedCount: number;
    };
    reservePolicy: {
      globalMinimumReserveBalance: number;
      minimumWithdrawalAmount: number;
      maximumWithdrawalAmount: number;
      withdrawalFeePercent: number;
      withdrawalFlatFee: number;
      allowedPayoutProviders: Record<PayoutProvider, boolean>;
      approvedDepositChannels: string[];
      depositDeadlineHours: number;
    };
    ledgerEntries: WalletLedgerEntry[];
    payoutAccounts: PayoutAccount[];
    withdrawals: WithdrawalRequest[];
    cashCollections: CashCollectionRecord[];
  }>(`/api/wallet${technicianId ? `?technicianId=${encodeURIComponent(technicianId)}` : ''}`);

export const addPayoutAccount = (payload: {
  provider: PayoutProvider;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
}) =>
  apiRequest<{ id: string; verificationStatus: string }>('/api/wallet/payout-accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const requestWithdrawal = (payload: {
  payoutAccountId: string;
  amount: number;
  idempotencyKey?: string;
}) =>
  apiRequest<{ withdrawal: WithdrawalRequest; walletAfter: WalletSummary }>('/api/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Admin Financial Management APIs
export const fetchAdminFinanceOverview = (filters?: {
  search?: string;
  technicianId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const qs = new URLSearchParams();
  if (filters?.search) qs.set('search', filters.search);
  if (filters?.technicianId) qs.set('technicianId', filters.technicianId);
  if (filters?.status) qs.set('status', filters.status);
  if (filters?.dateFrom) qs.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) qs.set('dateTo', filters.dateTo);
  return apiRequest<{
    summary: AdminFinancialSummary;
    techWallets: Array<{ id: string; name: string; phone: string; primaryArea: string; wallet: WalletSummary }>;
    withdrawals: WithdrawalRequest[];
    cashDeposits: any[];
    payoutAccounts: any[];
    transactions: any[];
    paymentTransactions: PaymentTransaction[];
  }>(`/api/admin/finance/overview?${qs.toString()}`);
};

export const verifyPayoutAccountAdmin = (id: string, status: 'VERIFIED' | 'REJECTED', note?: string) =>
  apiRequest(`/api/admin/payout-accounts/${encodeURIComponent(id)}/verify`, {
    method: 'POST',
    body: JSON.stringify({ status, note }),
  });

export const adminWithdrawalAction = (
  id: string,
  action: 'UNDER_REVIEW' | 'PROCESSING' | 'COMPLETE' | 'FAIL' | 'REJECT' | 'REVERSE',
  providerReference?: string,
  note?: string
) =>
  apiRequest(`/api/admin/withdrawals/${encodeURIComponent(id)}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, providerReference, note }),
  });

export const verifyCashDepositAdmin = (depositId: string, decision: 'APPROVE' | 'REJECT' | 'DISPUTE', reason?: string) =>
  apiRequest(`/api/admin/cash/${encodeURIComponent(depositId)}/verify`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason }),
  });

export const checkOverdueCashAdmin = (applyRestrictionAfterReview = true) =>
  apiRequest('/api/admin/cash/check-overdue', {
    method: 'POST',
    body: JSON.stringify({ applyRestrictionAfterReview }),
  });

export const setTechnicianRestrictionAdmin = (techId: string, restricted: boolean, reason?: string) =>
  apiRequest(`/api/admin/technicians/${encodeURIComponent(techId)}/restrict`, {
    method: 'POST',
    body: JSON.stringify({ restricted, reason }),
  });

export const setTechnicianReserveAdmin = (techId: string, customReserveBalance: number | null, reason?: string) =>
  apiRequest(`/api/admin/technicians/${encodeURIComponent(techId)}/reserve`, {
    method: 'PUT',
    body: JSON.stringify({ customReserveBalance, reason }),
  });

export const refundPaymentAdmin = (txId: string, amount: number, reason: string) =>
  apiRequest(`/api/admin/payments/${encodeURIComponent(txId)}/refund`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason }),
  });
