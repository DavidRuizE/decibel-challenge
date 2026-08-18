import { UserError } from './errors';
import { Signal, SignalDraft } from './types';

export function targetPrices(
    entryPrice: number,
    isBuy: boolean,
    takeProfitPct: number,
    stopLossPct: number,
): { takeProfitPrice: number; stopLossPrice: number } {
    if (isBuy) {
        return {
            takeProfitPrice: entryPrice * (1 + takeProfitPct / 100),
            stopLossPrice: entryPrice * (1 - stopLossPct / 100),
        };
    }
    
    return {
        takeProfitPrice: entryPrice * (1 - takeProfitPct / 100),
        stopLossPrice: entryPrice * (1 + stopLossPct / 100),
    };
}

export function validateDraft(draft: SignalDraft): string | null {
    if (!draft.author?.trim()) return 'Add your name so people know whose idea this is';
    if (!draft.marketName) return 'Pick a market';
    if (!Number.isFinite(draft.entryPrice) || draft.entryPrice <= 0) {
        return 'No live price available for that market right now';
    }
    if (!Number.isFinite(draft.takeProfitPct) || draft.takeProfitPct <= 0) {
        return 'Take profit must be greater than 0%';
    }
    if (!Number.isFinite(draft.stopLossPct) || draft.stopLossPct <= 0) {
        return 'Stop loss must be greater than 0%';
    }
    if (draft.stopLossPct >= 100) return 'A stop loss of 100% or more is not a real trade';
    if (!Number.isFinite(draft.holdHours) || draft.holdHours <= 0) {
        return 'Hold time must be greater than 0 hours';
    }
    return null;
}


export function buildSignal(draft: SignalDraft, now: Date, id: string): Signal {
    const invalid = validateDraft(draft);
    if (invalid) throw new UserError(invalid);

    const { takeProfitPrice, stopLossPrice } = targetPrices(
        draft.entryPrice,
        draft.isBuy,
        draft.takeProfitPct,
        draft.stopLossPct,
    );

    return {
        id,
        author: draft.author.trim(),
        marketName: draft.marketName,
        isBuy: draft.isBuy,
        entryPrice: draft.entryPrice,
        takeProfitPct: draft.takeProfitPct,
        stopLossPct: draft.stopLossPct,
        holdHours: draft.holdHours,
        takeProfitPrice,
        stopLossPrice,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + draft.holdHours * 3600_000).toISOString(),
    };
}