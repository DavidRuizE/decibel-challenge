import { UserError } from './errors';

export function padAddress(addr: string): string {
    return '0x' + addr.replace(/^0x/, '').padStart(64, '0');
}

export function assertFeeWithinBound(builderFee: number, maxFee: number): void {
  if (!Number.isFinite(builderFee) || builderFee < 0) {
    throw new Error(`Invalid builder fee: ${builderFee}`);
  }
  if (builderFee > maxFee){
    throw new Error(
      `Builder fee ${builderFee} bps exceeds the approved maximum of ${maxFee} bps`,
    );
  }
}

export function assertAffordable(
    notionalUsd: number,
    equityUsd: number,
    maxLeverage: number,
): void {
  if (!Number.isFinite(equityUsd) || equityUsd <= 0) {
    throw new UserError('Your account has no money to bet with');
  }
  const maxNotional = equityUsd * maxLeverage;
  if (notionalUsd > maxNotional) {
    const cap = maxNotional.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    });
    throw new UserError(`That bet is too big for your balance — the most you can bet here is ${cap}`);
  }
}

export function slippageBoundedPrice(
  midPrice: number,
  isBuy: boolean,
  slippagePct: number,
): number {
  const factor = isBuy ? 1 + slippagePct / 100 : 1 - slippagePct / 100;
  return midPrice * factor;
}
