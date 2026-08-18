import { assertAffordable, slippageBoundedPrice } from '@/lib/order-math';
import { decibelRead } from '@/lib/decibel';
import { getMarket, placeOrder, SLIPPAGE_PCT, SUBACCOUNT } from '@/lib/orders';
import { chainSizeToDollars, dollarsToChainSize, fromChainSize } from '@/lib/units';
import { TimeInForce } from '@decibeltrade/sdk';
import { NextResponse } from 'next/server';


export async function POST( req: Request ){
    let body;
    try{
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Expected body'}, {status: 502});
    }

    const { marketName, isBuy, dollars, limitPrice } = body ?? {};

    if (typeof marketName !== 'string' || !marketName) {
        return NextResponse.json({ error: 'Pick a market' }, { status: 400 });
    }
    if (typeof isBuy !== 'boolean') {
        return NextResponse.json({ error: 'Pick buy or sell' }, { status: 400 });
    }
    if (typeof dollars !== 'number' || !Number.isFinite(dollars) || dollars <= 0) {
        return NextResponse.json({ error: 'Enter an amount in dollars greater than zero' }, { status: 400 });
    }
    if ( limitPrice !== undefined && (typeof limitPrice !== 'number' || !Number.isFinite(limitPrice) || limitPrice <= 0)) {
        return NextResponse.json( { error: 'Limit price must be greater than zero' }, { status: 400 });
    }

    try {
        const market = await getMarket(marketName);

        const prices = (await decibelRead.marketPrices.getByName({ marketName })) as | { mid_px: number }[] | { mid_px: number };
        const midPx = Array.isArray(prices) ? prices[0]?.mid_px : prices?.mid_px;
        if (midPx == null || midPx <= 0) {
            throw new Error(`No live price for ${marketName}`);
        }

        const { chainSize, raisedToMinimum } = dollarsToChainSize(dollars, midPx, market);
        const size = fromChainSize(chainSize, market);
        const costUsd = chainSizeToDollars(chainSize, midPx, market);

        const overview = await decibelRead.accountOverview.getByAddr({ subAddr: SUBACCOUNT });
        assertAffordable(
            costUsd,
            Number(overview.cross_available_to_trade ?? overview.perp_equity_balance),
            Number(market.max_leverage)
        );

        const resting = typeof limitPrice === 'number' && Number.isFinite(limitPrice);
        const price = resting ? limitPrice : slippageBoundedPrice(midPx, isBuy, SLIPPAGE_PCT);

        const result = await placeOrder({
            market, 
            price,
            size,
            isBuy,
            timeInForce: resting ? TimeInForce.PostOnly : TimeInForce.ImmediateOrCancel,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: 'The exchange rejected the order', hint: result.error },
                { status: 502 }, 
            );
        }

        return NextResponse.json({
            placed: true,
            orderId: result.orderId ?? null,
            transactionHash: result.transactionHash,
            marketName,
            isBuy,
            size,
            price,
            costUsd,
            raisedToMinimum,
            midPxAtSubmit: midPx,
        })

    }catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}