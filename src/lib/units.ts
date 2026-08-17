/**
 * Chain-unit conversion.
 *
 * The chain stores prices and sizes as integers. Each market says how many
 * decimal places those integers encode (px_decimals / sz_decimals) and what the
 * increments are (tick_size / lot_size / min_size).
 *
 * The gotcha: tick_size, lot_size and min_size are ALREADY in chain units. So
 * convert to chain units first, snap there, and only then convert back.
 */

import type { Market } from './types';


/**
 * Math.round, never Math.floor: 0.29 * 1e6 is 289999.99999999994, and flooring
 * that silently loses a tick.
 */
function toChain(human: number, decimals: number): number {
  return Math.round(human * 10 ** decimals);
}

function fromChain(chain: number, decimals: number): number {
  return chain / 10 ** decimals;
}

function snap(chainValue: number, increment: number): number {
  return Math.round(chainValue / increment) * increment;
}

/** Human price -> chain units, snapped to the market's tick. */
export function toChainPrice(price: number, market: Market): number {
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Invalid price: ${price}`);
  }
  return snap(toChain(price, market.px_decimals), market.tick_size);
}

/** Human size -> chain units, snapped to the market's lot. */
export function toChainSize(size: number, market: Market): number {
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error(`Invalid size: ${size}`);
  }
  return snap(toChain(size, market.sz_decimals), market.lot_size);
}

export function fromChainPrice(chainPrice: number, market: Market): number {
  return fromChain(chainPrice, market.px_decimals);
}

export function fromChainSize(chainSize: number, market: Market): number {
  return fromChain(chainSize, market.sz_decimals);
}

/**
 * The kid-friendly path: the user says "$25 of Bitcoin", not "0.0004 BTC".
 *
 * Returns the chain size plus whether we had to raise it to the market
 * minimum — the caller must tell the user when we did, never silently.
 */
export function dollarsToChainSize(
  dollars: number,
  price: number,
  market: Market,
): { chainSize: number; raisedToMinimum: boolean } {
  if (!Number.isFinite(dollars) || dollars <= 0) {
    throw new Error(`Invalid amount: ${dollars}`);
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Invalid price: ${price}`);
  }

  const chainSize = snap(toChain(dollars / price, market.sz_decimals), market.lot_size);

  if (chainSize < market.min_size) {
    return { chainSize: market.min_size, raisedToMinimum: true };
  }
  return { chainSize, raisedToMinimum: false };
}

/** What a chain size actually costs, so the UI can show the real number. */
export function chainSizeToDollars(chainSize: number, price: number, market: Market): number {
  return fromChainSize(chainSize, market) * price;
}
