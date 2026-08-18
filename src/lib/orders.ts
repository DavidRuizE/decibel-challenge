import { TimeInForce } from '@decibeltrade/sdk';
import { decibelRead, decibelWrite } from './decibel';
import { assertFeeWithinBound, padAddress } from './order-math';
import { toChainPrice, toChainSize} from './units';
import { type Market } from './types';



export const SUBACCOUNT = process.env.DECIBEL_SUBACCOUNT_ADDR!;
export const BUILDER_ADDR = padAddress(process.env.BUILDER_SUBACCOUNT_ADDR!);
export const MAX_FEE_BPS = Number(process.env.BUILDER_MAX_FEE_BPS ?? 10);

export const SLIPPAGE_PCT = 0.5;

export async function getMarket(marketName: string): Promise<Market> {
  const markets = (await decibelRead.markets.getAll()) as Market[];
  const market = markets.find((m) => m.market_name === marketName);
  if (!market) throw new Error(`Unknown market: ${marketName}`);
  if (market.mode !== 'Open') {
    throw new Error(`${marketName} is not open for trading (mode: ${market.mode})`);
  }
  return market;
}

export async function approveBuilder(maxFee = MAX_FEE_BPS) {
    return decibelWrite.approveMaxBuilderFee({
        builderAddr: BUILDER_ADDR,
        maxFee,
        subaccountAddr: SUBACCOUNT,
    });
}

type placesArgs = {
    market: Market,
    price: number,
    size: number,
    isBuy: boolean,
    timeInForce: TimeInForce,
    builderFee?: number,
    isReduceOnly?: boolean;
}

export async function placeOrder({
    market,
    price,
    size,
    isBuy,
    timeInForce,
    builderFee = MAX_FEE_BPS,
    isReduceOnly = false
} : placesArgs) {
    assertFeeWithinBound(builderFee, MAX_FEE_BPS);

    return decibelWrite.placeOrder({
        marketName: market.market_name,
        price: toChainPrice(price, market),
        size: toChainSize(size, market),
        isBuy,
        timeInForce,
        isReduceOnly,
        builderAddr: BUILDER_ADDR,
        builderFee,
        subaccountAddr: SUBACCOUNT,
    });
}

const EXIT_BUFFER_PCT = 0.5;

type ExitArgs = {
  market: Market;
  isLong: boolean;
  size: number;
  takeProfitPrice: number;
  stopLossPrice: number;
};

export async function setPositionExits({
  market,
  isLong,
  size,
  takeProfitPrice,
  stopLossPrice,
}: ExitArgs) {
  const buffer = isLong ? 1 - EXIT_BUFFER_PCT / 100 : 1 + EXIT_BUFFER_PCT / 100;
  const chainSize = toChainSize(size, market);

  return decibelWrite.placeTpSlOrderForPosition({
    marketAddr: market.market_addr,
    tpTriggerPrice: toChainPrice(takeProfitPrice, market),
    tpLimitPrice: toChainPrice(takeProfitPrice * buffer, market),
    tpSize: chainSize,
    slTriggerPrice: toChainPrice(stopLossPrice, market),
    slLimitPrice: toChainPrice(stopLossPrice * buffer, market),
    slSize: chainSize,
    subaccountAddr: SUBACCOUNT,
  });
}


export async function cancelOrder(orderId: string | number, marketName: string) {
  return decibelWrite.cancelOrder({ orderId, marketName, subaccountAddr: SUBACCOUNT });
}
