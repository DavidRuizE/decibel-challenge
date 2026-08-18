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
  balance: number;
  unrealizedPnl: number;
  fundingCost: number;
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

export type Signal = {
  id: string;
  author: string;
  marketName: string;
  isBuy: boolean;
  entryPrice: number;
  takeProfitPct: number;
  stopLossPct: number;
  holdHours: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  createdAt: string;
  expiresAt: string;
};

export type SignalListItem = Signal & { expired: boolean };

export type SignalDraft = {
  author: string;
  marketName: string;
  isBuy: boolean;
  entryPrice: number;
  takeProfitPct: number;
  stopLossPct: number;
  holdHours: number;
};