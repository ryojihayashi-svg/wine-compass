import { NextResponse } from 'next/server';

const COOKIE_NAME = 'wc_session';
const TTL_SEC = 24 * 60 * 60; // 24 hours

async function signToken(timestamp) {
  const secret = process.env.WC_SESSION_SECRET;
  if (!secret) return null;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuf = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(String(timestamp))
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${timestamp}.${sig}`;
}

export async function POST(req) {
  const { pin } = await req.json();
  if (!pin) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const storedPin = process.env.WC_AUTH_PIN || '1234';

  if (pin !== storedPin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Issue session token
  const token = await signToken(Date.now());
  const res = NextResponse.json({ success: true });

  if (token) {
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: TTL_SEC,
    });
  }

  return res;
}

// DELETE /api/auth — logout (clear cookie)
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api',
    maxAge: 0,
  });
  return res;
}
