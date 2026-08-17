import { friendly, money, signedMoney } from '@/lib/format';
import type { Position } from '@/lib/types';
import { BADGE, TINY } from './ui';

export default function PositionRow({ position: p }: { position: Position }) {
  const asset = friendly(p.marketName);

  return (
    <div className="border-b border-line py-3.5 last:border-b-0">
      <div className="flex justify-between gap-3">
        <div>
          <div className="font-semibold">
            {asset}
            <span className={`${BADGE} ${p.isLong ? 'bg-up-soft text-up' : 'bg-down-soft text-down'}`}>
              {p.isLong ? 'Up' : 'Down'}
            </span>
          </div>
          <div className={TINY}>
            {Math.abs(p.size)} {p.isLong ? 'bought at' : 'sold short at'} {money(p.entryPrice)}
            {p.markPrice !== null && <> · now {money(p.markPrice)}</>}
          </div>
        </div>
        <div className={`font-bold whitespace-nowrap ${(p.pnl ?? 0) >= 0 ? 'text-up' : 'text-down'}`}>
          {p.pnl === null ? '—' : signedMoney(p.pnl)}
        </div>
      </div>
    </div>
  );
}
