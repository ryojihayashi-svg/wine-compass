import { NextResponse } from 'next/server';

// HMAC-SHA256 session middleware for Wine Compass API
// Uses Web Crypto API (Edge Runtime compatible)

const SECRET_ENV = 'WC_SESSION_SECRET';
const COOKIE_NAME = 'wc_session';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Paths that don't require authentication
const PUBLIC_PATHS = ['/api/auth'];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

async function getKey() {
  const secret = process.env[SECRET_ENV];
  if (!secret) return null;
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Constant-time comparison via HMAC (timing-safe)
async function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    crypto.getRandomValues(new Uint8Array(32)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(a)),
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(b)),
  ]);
  const bufA = new Uint8Array(sigA);
  const bufB = new Uint8Array(sigB);
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect /api/* routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // If no secret is configured, skip auth (development mode)
  const key = await getKey();
  if (!key) {
    return NextResponse.next();
  }

  // Read session cookie
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Token format: timestamp.signature
  const parts = cookie.value.split('.');
  if (parts.length !== 2) {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 });
  }

  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  // Check expiry
  if (isNaN(timestamp) || Date.now() - timestamp > TTL_MS) {
    return NextResponse.json({ error: 'session expired' }, { status: 401 });
  }

  // Verify HMAC signature
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestampStr));
  const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const isValid = await timingSafeEqual(signature, expectedSig);
  if (!isValid) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
