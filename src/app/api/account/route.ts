import { NextResponse } from 'next/server';
import { decibelRead } from '@/lib/decibel';

const subAddr = process.env.DECIBEL_SUBACCOUNT_ADDR!;

export async function GET() {
  try {
    const [overview, positions, openOrders, orderHistory] = await Promise.all([
        decibelRead.accountOverview.getByAddr({ subAddr}),
        decibelRead.userPositions.getByAddr({ subAddr}),
        decibelRead.userOpenOrders.getByAddr({ subAddr}),
        decibelRead.userOrderHistory.getByAddr({ subAddr}),
    ])
    return NextResponse.json({ overview, positions, openOrders, orderHistory});
  } catch (error) {
    return NextResponse.json(
      { error: 'Could not load account', hint: String(error) },
      { status: 502 },
    );
  }
}
