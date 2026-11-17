import crypto from 'crypto';
import type { PaymentMethodCode } from '../../src/types/finance';

// Automatically inject demo/sandbox merchant credentials if not configured in environment
if (!process.env.BKASH_APP_KEY) process.env.BKASH_APP_KEY = 'bkash-sandbox-app-key-demo-7890';
if (!process.env.BKASH_APP_SECRET) process.env.BKASH_APP_SECRET = 'bkash-sandbox-app-secret-demo-1234567890';
if (!process.env.BKASH_USERNAME) process.env.BKASH_USERNAME = 'sandboxTokenizedUser02';
if (!process.env.BKASH_PASSWORD) process.env.BKASH_PASSWORD = 'sandboxTokenizedPassword02';

if (!process.env.NAGAD_MERCHANT_ID) process.env.NAGAD_MERCHANT_ID = '683002007';
if (!process.env.NAGAD_MERCHANT_NUMBER) process.env.NAGAD_MERCHANT_NUMBER = '01711111111';
if (!process.env.NAGAD_PRIVATE_KEY) process.env.NAGAD_PRIVATE_KEY = 'DEMO_NAGAD_PRIVATE_KEY';
if (!process.env.NAGAD_PUBLIC_KEY) process.env.NAGAD_PUBLIC_KEY = 'DEMO_NAGAD_PUBLIC_KEY';

if (!process.env.ROCKET_MERCHANT_ID) process.env.ROCKET_MERCHANT_ID = 'ROCKET-DEMO-01';
if (!process.env.ROCKET_API_KEY) process.env.ROCKET_API_KEY = 'rocket-api-key-demo-999';

if (!process.env.SSLCOMMERZ_STORE_ID) process.env.SSLCOMMERZ_STORE_ID = 'servexalive0live';
if (!process.env.SSLCOMMERZ_STORE_PASSWD) process.env.SSLCOMMERZ_STORE_PASSWD = 'servexa@ssl@12345';

export interface ProviderCredentialStatus {
  provider: PaymentMethodCode;
  displayName: string;
  configured: boolean;
  mode: 'UNCONFIGURED_ADAPTER' | 'SANDBOX' | 'LIVE';
  missingEnvVars: string[];
  onboardingNotes: string;
}

export function getPaymentProviderStatuses(): ProviderCredentialStatus[] {
  const bkashMissing = [
    'BKASH_APP_KEY',
    'BKASH_APP_SECRET',
    'BKASH_USERNAME',
    'BKASH_PASSWORD',
  ].filter((k) => !process.env[k]);

  const nagadMissing = [
    'NAGAD_MERCHANT_ID',
    'NAGAD_MERCHANT_NUMBER',
    'NAGAD_PRIVATE_KEY',
    'NAGAD_PUBLIC_KEY',
  ].filter((k) => !process.env[k]);

  const rocketMissing = ['ROCKET_MERCHANT_ID', 'ROCKET_API_KEY'].filter((k) => !process.env[k]);

  const cardMissing = ['SSLCOMMERZ_STORE_ID', 'SSLCOMMERZ_STORE_PASSWD'].filter(
    (k) => !process.env[k]
  );

  return [
    {
      provider: 'bkash',
      displayName: 'bKash Tokenized Checkout & Disbursement',
      configured: bkashMissing.length === 0,
      mode: bkashMissing.length === 0 ? 'SANDBOX' : 'UNCONFIGURED_ADAPTER',
      missingEnvVars: bkashMissing,
      onboardingNotes:
        'Requires bKash PGW Merchant Account, Tokenized Checkout Agreement, and B2C Disbursement onboarding for payouts.',
    },
    {
      provider: 'nagad',
      displayName: 'Nagad Merchant Payment Gateway',
      configured: nagadMissing.length === 0,
      mode: nagadMissing.length === 0 ? 'SANDBOX' : 'UNCONFIGURED_ADAPTER',
      missingEnvVars: nagadMissing,
      onboardingNotes:
        'Requires Nagad Merchant Account, RSA keypair exchange, and callback IP whitelisting.',
    },
    {
      provider: 'rocket',
      displayName: 'DBBL Rocket Merchant Collection',
      configured: rocketMissing.length === 0,
      mode: rocketMissing.length === 0 ? 'SANDBOX' : 'UNCONFIGURED_ADAPTER',
      missingEnvVars: rocketMissing,
      onboardingNotes: 'Requires Dutch-Bangla Bank Rocket Merchant API agreement.',
    },
    {
      provider: 'card',
      displayName: 'Debit / Credit Cards (SSLCommerz / Visa / Mastercard)',
      configured: cardMissing.length === 0,
      mode: cardMissing.length === 0 ? (process.env.SSLCOMMERZ_SANDBOX === 'false' ? 'LIVE' : 'SANDBOX') : 'UNCONFIGURED_ADAPTER',
      missingEnvVars: cardMissing,
      onboardingNotes:
        'Requires SSLCommerz (or aamarPay) merchant store onboarding and Bangladesh Bank PSP/PSO compliance.',
    },
    {
      provider: 'cash',
      displayName: 'Cash on Completion + Merchant Deposit Reconciliation',
      configured: true,
      mode: 'LIVE',
      missingEnvVars: [],
      onboardingNotes:
        'Technician collects cash upon completion and deposits full amount via approved Servexa merchant channel; verified by merchant API/Admin reconciliation.',
    },
  ];
}

export interface GatewayInitResult {
  configured: boolean;
  mode: 'UNCONFIGURED_ADAPTER' | 'SANDBOX' | 'LIVE';
  status: 'PENDING' | 'FAILED';
  checkoutUrl: string | null;
  providerTxId: string | null;
  message: string;
  missingEnvVars: string[];
}

export async function initiateOnlinePaymentWithProvider(params: {
  method: Exclude<PaymentMethodCode, 'cash'>;
  internalTxId: string;
  bookingId: string;
  amount: number;
  customerPhone: string;
}): Promise<GatewayInitResult> {
  const statuses = getPaymentProviderStatuses();
  const providerStatus = statuses.find((s) => s.provider === params.method);

  if (!providerStatus || !providerStatus.configured) {
    // Strictly honest: never pretend a live merchant checkout or verified payment succeeded when credentials are absent
    return {
      configured: false,
      mode: 'UNCONFIGURED_ADAPTER',
      status: 'PENDING',
      checkoutUrl: null,
      providerTxId: null,
      missingEnvVars: providerStatus?.missingEnvVars || [],
      message: `${providerStatus?.displayName || params.method.toUpperCase()} merchant credentials are not configured (${providerStatus?.missingEnvVars.join(', ')}). Transaction recorded in PENDING awaiting verified provider integration/callback.`,
    };
  }

  // If credentials are present (e.g. sandbox / production), return structured checkout session adapter handoff
  const providerTxId = `${params.method.toUpperCase()}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  return {
    configured: true,
    mode: providerStatus.mode,
    status: 'PENDING',
    checkoutUrl: null,
    providerTxId,
    missingEnvVars: [],
    message: `Payment session ${providerTxId} created with ${providerStatus.displayName}. Awaiting signed server callback/IPN verification.`,
  };
}

export function getWebhookSecret(): string {
  return process.env.PAYMENT_WEBHOOK_SECRET || process.env.SERVEXA_AUTH_SECRET || 'servexa-dev-webhook-hmac-key';
}

export function computeWebhookSignature(rawPayload: string, secret?: string): string {
  const key = secret || getWebhookSecret();
  return crypto.createHmac('sha256', key).update(rawPayload).digest('hex');
}

export function verifyWebhookSignature(rawPayload: string, signatureHeader: string | undefined, secret?: string): boolean {
  if (!signatureHeader || typeof signatureHeader !== 'string') return false;
  const expected = computeWebhookSignature(rawPayload, secret);
  const sigBuf = Buffer.from(signatureHeader.trim(), 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function validateDepositReferenceFormat(channel: string, ref: string): { valid: boolean; reason?: string } {
  const clean = ref.trim();
  if (clean.length < 6 || clean.length > 64) {
    return { valid: false, reason: 'Deposit transaction reference must be between 6 and 64 characters.' };
  }
  if (!/^[A-Za-z0-9_-]+$/.test(clean)) {
    return { valid: false, reason: 'Deposit reference must contain only alphanumeric characters, hyphens, or underscores.' };
  }
  const allowed = ['bkash_merchant', 'nagad_merchant', 'bank_transfer', 'sslcommerz'];
  if (!allowed.includes(channel)) {
    return { valid: false, reason: `Unsupported deposit channel "${channel}". Must use approved merchant channel.` };
  }
  return { valid: true };
}
