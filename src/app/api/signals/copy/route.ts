import { decibelRead } from '@/lib/decibel';
import { statusFor } from '@/lib/errors';
import { assertAffordable, slippageBoundedPrice } from '@/lib/order-math';
import {
    getMarket,
    SUBACCOUNT,
    SLIPPAGE_PCT,
    placeOrder,
    positionSize,
    setPositionExits,
    waitForFill,
} from '@/lib/orders';
import { targetPrices } from '@/lib/signals';
import { readSignals } from '@/lib/store';
import { chainSizeToDollars, dollarsToChainSize, fromChainSize } from '@/lib/units';
import { TimeInForce } from '@decibeltrade/sdk';
import { NextResponse } from 'next/server';

export async function POST(req: Request){
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Expected a JSON body' }, { status: 400 });
    }

    const { signalId, dollars } = body ?? {};

    if (typeof dollars !== 'number' || !Number.isFinite(dollars) || dollars <= 0) {
        return NextResponse.json(
        { error: 'Choose how much you want to put in' },
        { status: 400 },
        );
    }

    try {
        const signal = (await readSignals()).find((s) => s.id === signalId);
        if (!signal) return NextResponse.json({ error: 'That signal no longer exists' }, { status: 404 });

        if (new Date(signal.expiresAt) < new Date()) {
        return NextResponse.json(
            { error: 'This idea has expired — its hold time has already passed' },
            { status: 400 },
        );
        }

        const market = await getMarket(signal.marketName);

        const prices = await decibelRead.marketPrices.getByName({ marketName: signal.marketName });
        const midPx = Array.isArray(prices) ? prices[0]?.mid_px : undefined;
        if (!midPx) throw new Error(`No live price for ${signal.marketName}`);

        const { chainSize, raisedToMinimum } = dollarsToChainSize(dollars, midPx, market);

        const overview = await decibelRead.accountOverview.getByAddr({ subAddr: SUBACCOUNT });
        assertAffordable(
            chainSizeToDollars(chainSize, midPx, market),
            Number(overview.cross_available_to_trade ?? overview.perp_equity_balance),
            Number(market.max_leverage),
        );

        const requestedSize = fromChainSize(chainSize, market);
        const sizeBefore = await positionSize(market);

        const result = await placeOrder({
            market,
            price: slippageBoundedPrice(midPx, signal.isBuy, SLIPPAGE_PCT),
            size: requestedSize,
            isBuy: signal.isBuy,
            timeInForce: TimeInForce.ImmediateOrCancel,
        });

        if (!result.success) {
        return NextResponse.json(
            { error: 'The exchange rejected the copy', hint: result.error },
            { status: 502 },
        );
        }

        const { takeProfitPrice, stopLossPrice } = targetPrices(
            midPx,
            signal.isBuy,
            signal.takeProfitPct,
            signal.stopLossPct,
        );
        
        const settledSize = await waitForFill({
            market,
            sizeBefore,
            isBuy: signal.isBuy,
            requestedSize,
        });

        let exitsSet = false;
        let exitError: string | null = null;

        if (settledSize === null) {
            exitError = 'the order has not filled yet';
        } else if (settledSize === 0) {
            exitError = 'the fill closed your position flat, so there is nothing to protect';
        } else {
            try {
            const tx = await setPositionExits({
                market,
                isLong: settledSize > 0,
                size: Math.abs(settledSize),
                takeProfitPrice,
                stopLossPrice,
            });
            exitsSet = tx.success;
            } catch (e) {
                exitError = e instanceof Error ? e.message : String(e);
            }
        }

        return NextResponse.json({
        copied: true,
        filled: settledSize !== null && settledSize !== 0,
        filledSize: settledSize === null ? 0 : Math.abs(settledSize - sizeBefore),
        transactionHash: result.transactionHash,
        marketName: signal.marketName,
        isBuy: signal.isBuy,
        costUsd: chainSizeToDollars(chainSize, midPx, market),
        raisedToMinimum,
        authorEntry: signal.entryPrice,
        yourPrice: midPx,
        exitsSet,
        exitError,
        takeProfitPrice,
        stopLossPrice,
        });
  } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const status = statusFor(e);
        return NextResponse.json(
        status === 400
            ? { error: message }
            : { error: 'The exchange is not responding right now', hint: message },
        { status },
        );
  }
}