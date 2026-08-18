import 'server-only';

import { TESTNET_CONFIG, TimeInForce } from '@decibeltrade/sdk';
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

const BPS_SCALE = 100;

export async function approvedMaxFeeBps(): Promise<number | null>{
  const [approved] = await decibelWrite.aptos.view<[{ vec: string[] }]>({
    payload: {
      function: `${TESTNET_CONFIG.deployment.package}::builder_code_registry::get_approved_max_fee`,
      functionArguments: [SUBACCOUNT, BUILDER_ADDR],
    },
  });
  const raw = approved?.vec?.[0];
  return raw === undefined ? null : Number(raw) / BPS_SCALE;
}

export async function ensureBuilderApproved(feeBps = MAX_FEE_BPS): Promise<number> {
  const current = await approvedMaxFeeBps();
  if (current !== null && current >= feeBps) return current;

  await approveBuilder(feeBps);
  return (await approvedMaxFeeBps()) ?? 0;
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
    const approvedMax = await ensureBuilderApproved(builderFee);
    assertFeeWithinBound(builderFee, approvedMax);

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

const FILL_POLL_MS = 300;
const FILL_WAIT_MS = 8000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function positionSize(market: Market): Promise<number> {
  const positions = await decibelRead.userPositions.getByAddr({
    subAddr: SUBACCOUNT,
    marketAddr: market.market_addr,
  });
  return positions.find((p) => p.market === market.market_addr)?.size ?? 0;
}

export async function waitForFill({
  market,
  sizeBefore,
  isBuy,
  requestedSize,
}: {
  market: Market;
  sizeBefore: number;
  isBuy: boolean;
  requestedSize: number;
}): Promise<number | null> {
  const deadline = Date.now() + FILL_WAIT_MS;
  let settled: number | null = null;

  while (Date.now() < deadline) {
    await sleep(FILL_POLL_MS);
    const size = await positionSize(market);

    if (isBuy ? size <= sizeBefore : size >= sizeBefore) continue;

    const filled = Math.abs(size - sizeBefore);
    if (filled + 1e-9 >= requestedSize || size === settled) return size;
    settled = size;
  }

  return settled;
}
