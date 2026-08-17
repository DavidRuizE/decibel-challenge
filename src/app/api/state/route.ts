import { NextResponse } from 'next/server';
import { decibelRead } from '@/lib/decibel';
import { SUBACCOUNT } from '@/lib/orders';
import type { Market } from '@/lib/types';


export async function GET() {
  try {
    const [markets, prices, overview, positions, openOrders] = await Promise.all([
      decibelRead.markets.getAll() as Promise<Market[] & { market_addr: string }[]>,
      decibelRead.marketPrices.getAll(),
      decibelRead.accountOverview.getByAddr({ subAddr: SUBACCOUNT }),
      decibelRead.userPositions.getByAddr({ subAddr: SUBACCOUNT }),
      decibelRead.userOpenOrders.getByAddr({ subAddr: SUBACCOUNT }),
    ]);

    const priceList = (Array.isArray(prices) ? prices : []) as {
      market: string;
      mark_px: number;
      mid_px: number;
    }[];
    const priceByAddr = new Map(priceList.map((p) => [p.market, p]));
    const marketByAddr = new Map(
      (markets as (Market & { market_addr: string })[]).map((m) => [m.market_addr, m]),
    );

    const tradable = (markets as (Market & { market_addr: string })[])
      .filter((m) => m.mode === 'Open')
      .map((m) => ({
        name: m.market_name,
        price: priceByAddr.get(m.market_addr)?.mid_px ?? null,
      }))
      .filter((m) => m.price !== null);

    const orders = openOrders.items ?? [];

    const exitOrders = orders.filter((o) => o.is_tpsl);
    const waitingOrders = orders.filter((o) => !o.is_tpsl);

    const triggerPrice = (o: (typeof orders)[number]) => {
      const match = /[\d.]+/.exec(o.trigger_condition ?? '');
      return match ? Number(match[0]) : Number(o.price);
    };

    const exitFor = (marketAddr: string, kind: 'tp' | 'sl') => {
      const order = exitOrders.find(
        (o) =>
          o.market === marketAddr &&
          (kind === 'tp'
            ? o.order_type?.includes('Take Profit')
            : o.order_type?.includes('Stop')),
      );
      return order ? triggerPrice(order) : null;
    };

    const enrichedPositions = [...positions]
      .sort((a, b) => {
        const nameA = marketByAddr.get(a.market)?.market_name ?? a.market;
        const nameB = marketByAddr.get(b.market)?.market_name ?? b.market;
        return nameA.localeCompare(nameB);
      })
      .map((p) => {
      const market = marketByAddr.get(p.market);
      const markPx = priceByAddr.get(p.market)?.mark_px ?? null;
      const size = Number(p.size);
      const entry = Number(p.entry_price);

      const pnl = markPx === null ? null : (markPx - entry) * size;
      return {
        marketName: market?.market_name ?? p.market,
        size,
        isLong: size > 0,
        entryPrice: entry,
        markPrice: markPx,
        pnl,
        leverage: Number(p.user_leverage),
        // Where this bet closes on its own, if exits have been set.
        takeProfitPrice: exitFor(p.market, 'tp'),
        stopLossPrice: exitFor(p.market, 'sl'),
      };
    });

    return NextResponse.json({
      equity: overview.perp_equity_balance,
      unrealizedPnl: overview.unrealized_pnl,
      availableToTrade: overview.cross_available_to_trade ?? overview.perp_equity_balance,
      heldAsMargin:
        overview.perp_equity_balance -
        (overview.cross_available_to_trade ?? overview.perp_equity_balance),
      markets: tradable,
      positions: enrichedPositions,
      openOrders: [...waitingOrders]
        .sort((a, b) => String(a.order_id).localeCompare(String(b.order_id)))
        .map((o) => ({
        orderId: String(o.order_id),
        marketName: marketByAddr.get(o.market)?.market_name ?? o.market,
        isBuy: Boolean(o.is_buy),
          price: Number(o.price),
          size: Number(o.remaining_size),
        })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Could not reach Decibel', hint: String(e) },
      { status: 502 },
    );
  }
}
