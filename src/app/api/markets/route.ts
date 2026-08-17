import { NextResponse } from 'next/server';
import { decibelRead } from '@/lib/decibel';

export async function GET() {
  try {
    const markets = await decibelRead.markets.getAll();
    return NextResponse.json(markets);
  } catch (error) {
    return NextResponse.json(
      { error: 'Could not load markets', hint: String(error) },
      { status: 502 },
    );
  }
}
