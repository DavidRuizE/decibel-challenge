
export type Market = {
  market_addr: string;
  market_name: string;
  px_decimals: number;
  sz_decimals: number;
  tick_size: number;
  lot_size: number;
  min_size: number;
  max_leverage: number;
  mode: string;
};

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
