import { MarketPrice, UserOpenOrder, UserPosition } from '@decibeltrade/sdk';
import { AccountStateInputs, AppState, Market, MarketSummary, OpenOrder, Position } from './types';


export function buildAccountState({
    markets,
    prices,
    overview,
    positions,
    openOrders
}: AccountStateInputs): AppState {
    const priceByAddr = new Map((Array.isArray(prices) ? prices : []).map((p) => [p.market, p]));
    const marketByAddr = new Map(markets.map((m) => [m.market_addr, m]));

    const orders = openOrders.items ?? [];

    const exitOrders = orders.filter((o) => o.is_tpsl);
    const waitingOrders = orders.filter((o) => !o.is_tpsl);

    const availableToTrade = overview.cross_available_to_trade ?? overview.perp_equity_balance;

    return {
        equity: overview.perp_equity_balance,
        unrealizedPnl: overview.unrealized_pnl,
        availableToTrade,
        heldAsMargin: overview.perp_equity_balance - availableToTrade,
        markets: toTradableMarkets(markets, priceByAddr),
        positions: enrichPositions(positions, marketByAddr, priceByAddr, exitOrders),
        openOrders: toWaitingOrders(waitingOrders, marketByAddr),
    }
}

function exitFor(
  exitOrders: UserOpenOrder[],
  marketAddr: string,
  kind: 'tp' | 'sl',
): number | null {
  const order = exitOrders.find(
    (o) =>
      o.market === marketAddr &&
      (kind === 'tp' ? o.order_type?.includes('Take Profit') : o.order_type?.includes('Stop')),
  );
  return order ? triggerPrice(order) : null;
}

function toTradableMarkets(
    markets: Market[],
    priceByAddr: Map<string, MarketPrice>,
) : MarketSummary[] {
        return markets
        .filter((m) => m.mode === 'Open')
        .flatMap((m) => {
        const price = priceByAddr.get(m.market_addr)?.mid_px ?? null;
        return price === null ? [] : [{ name: m.market_name, price }];
        });
}

function triggerPrice(o: UserOpenOrder): number {
  const match = /[\d.]+/.exec(o.trigger_condition ?? '');
  return match ? Number(match[0]) : Number(o.price);
}

function enrichPositions(
  positions: UserPosition[],
  marketByAddr: Map<string, Market>,
  priceByAddr: Map<string, MarketPrice>,
  exitOrders: UserOpenOrder[],
): Position[] {
  return [...positions]
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
        takeProfitPrice: exitFor(exitOrders, p.market, 'tp'),
        stopLossPrice: exitFor(exitOrders, p.market, 'sl'),
      };
    });
}

function toWaitingOrders(
  waitingOrders: UserOpenOrder[],
  marketByAddr: Map<string, Market>,
): OpenOrder[] {
  return [...waitingOrders]
    .sort((a, b) => String(a.order_id).localeCompare(String(b.order_id)))
    .map((o) => ({
      orderId: String(o.order_id),
      marketName: marketByAddr.get(o.market)?.market_name ?? o.market,
      isBuy: Boolean(o.is_buy),
      price: Number(o.price),
      size: Number(o.remaining_size),
    }));
}
