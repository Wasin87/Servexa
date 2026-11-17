import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../../src/types';

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  techId?: string | null;
  name: string;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}

function getAuthSecret(): string {
  return process.env.SERVEXA_AUTH_SECRET || 'servexa-local-hmac-signing-secret-change-in-prod';
}

export function signSessionToken(payload: Omit<AuthTokenPayload, 'exp'>, ttlSeconds = 60 * 60 * 24 * 7): string {
  const full: AuthTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  const sig = crypto.createHmac('sha256', getAuthSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', getAuthSecret()).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AuthTokenPayload;
    if (!parsed.sub || !parsed.role || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const payload = verifySessionToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
    return;
  }
  req.auth = payload;
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({
        error: `Forbidden: requires role ${allowedRoles.join(' or ')}, current role is ${req.auth.role}.`,
      });
      return;
    }
    next();
  };
}

// Sliding-window in-memory rate limiter for sensitive financial endpoints
const buckets = new Map<string, number[]>();

export function rateLimit(maxRequests = 40, windowMs = 60_000) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const key = `${req.auth?.sub || req.ip}:${req.path}`;
    const now = Date.now();
    const list = (buckets.get(key) || []).filter((ts) => now - ts < windowMs);
    if (list.length >= maxRequests) {
      res.status(429).json({ error: 'Too many financial requests. Please wait a moment and try again.' });
      return;
    }
    list.push(now);
    buckets.set(key, list);
    next();
  };
}
