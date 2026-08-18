'use client';

import { friendly, money } from '@/lib/format';
import { Signal } from '@/lib/types';
import Card from './Card';
import { BADGE, BIG_BUTTON, TINY } from './ui';
import SignalChart from './SignalChart';

export default function SignalCard({
  signal,
  copyAmount,
  copying,
  onCopy,
}: {
  signal: Signal;
  copyAmount: number;
  copying: boolean;
  onCopy: (id: string) => void;
}) {
  const expired = new Date(signal.expiresAt) < new Date();
  const asset = friendly(signal.marketName);

  return (
    <Card>
      <div className='flex justify-between gap-2'>
        <strong>
          {signal.author} - {asset}
          <span
            className={`${BADGE} ${signal.isBuy ? 'bg-up-soft text-up' : 'bg-down-soft text-down'}`}
          >
            {signal.isBuy ? 'Up' : 'Down'}
          </span>
        </strong>
        <span className={TINY}>
          {' '}
          {expired ? 'expired' : `${signal.holdHours}h hold`}{' '}
        </span>
      </div>

      <div className={`my-1.5 ${TINY}`}>
        Entry {money(signal.entryPrice)} - take profit {signal.takeProfitPct}% (
        {money(signal.takeProfitPrice)}) - stop loss {signal.stopLossPct}% (
        {money(signal.stopLossPrice)})
      </div>

      <SignalChart
        marketName={signal.marketName}
        entry={signal.entryPrice}
        takeProfit={signal.takeProfitPrice}
        stopLoss={signal.stopLossPrice}
        isBuy={signal.isBuy}
      />

      <button
        type='button'
        className={`${BIG_BUTTON} ${signal.isBuy ? 'bg-up' : 'bg-down'}`}
        disabled={copying || expired}
        onClick={() => onCopy(signal.id)}
      >
        {expired
          ? 'Too late — this idea expired'
          : copying
            ? 'Placing…'
            : `Copy with $${copyAmount}`}
      </button>
    </Card>
  );
}
