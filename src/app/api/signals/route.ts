import { decibelRead } from '@/lib/decibel';
import { statusFor } from '@/lib/errors';
import { buildSignal } from '@/lib/signals';
import { addSignal, newId, readSignals } from '@/lib/store';
import { SignalDraft } from '@/lib/types';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = Date.now();
    const signals = (await readSignals()).map((s) => ({
      ...s,
      expired: Date.parse(s.expiresAt) <= now,
    }));
    return NextResponse.json(signals);
  } catch (error) {
    return NextResponse.json(
      { error: 'Could not read saved signals', hint: String(error) },
      { status: 404 },
    );
  }
}

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected body' }, { status: 502 });
  }

  const {author, marketName, isBuy, takeProfitPct, stopLossPct, holdHours } = body ?? {};

  if(typeof marketName !=='string' || !marketName ){
    return NextResponse.json({ error: 'pick a market' }, { status: 400 });
  }

  try {
    const prices = await decibelRead.marketPrices.getByName({marketName});
    const entryPrice = Array.isArray(prices) ? prices[0]?.mid_px : undefined;

    const draft: SignalDraft = {
        author: String(author ?? ''),
        marketName,
        isBuy: Boolean(isBuy),
        entryPrice: Number(entryPrice),
        takeProfitPct: Number(takeProfitPct),
        stopLossPct: Number(stopLossPct),
        holdHours: Number(holdHours),
    }

    const signal = buildSignal(draft, new Date(), newId());
    await addSignal(signal);
    return NextResponse.json(signal, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = statusFor(e);
    return NextResponse.json(
      status === 400 ? { error: message } : { error: 'Could not post the signal', hint: message },
      { status },
    );
  }
}
