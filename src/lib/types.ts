import { AccountOverview, MarketPrice, PerpMarket, UserOpenOrdersResponse, UserPosition,  } from '@decibeltrade/sdk';

export type Market = PerpMarket

export type MarketSummary = { name: string; price: number };

export type Position = {
  marketName: string;
  size: number;
  isLong: boolean;
  entryPrice: number;
  markPrice: number | null;
  pnl: number | null;
  leverage: number;
  takeProfitPrice: number | null;
  stopLossPrice: number | null;
};

export type OpenOrder = {
  orderId: string;
  marketName: string;
  isBuy: boolean;
  price: number;
  size: number;
};

export type AppState = {
  equity: number;
  unrealizedPnl: number;
  availableToTrade: number;
  heldAsMargin: number;
  markets: MarketSummary[];
  positions: Position[];
  openOrders: OpenOrder[];
};

export type AccountStateInputs = {
  markets: Market[],
  prices: MarketPrice[],
  overview: AccountOverview,
  positions: UserPosition[],
  openOrders: UserOpenOrdersResponse,
}