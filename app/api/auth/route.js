import { NextResponse } from 'next/server';

export async function POST(req) {
  const { pin } = await req.json();
  if (!pin) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const storedPin = process.env.WC_AUTH_PIN || '1234';

  if (pin !== storedPin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
