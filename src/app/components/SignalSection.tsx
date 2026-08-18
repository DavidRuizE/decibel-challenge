'use client';

import type { SignalListItem } from '@/lib/types';
import SignalCard from './SignalCard';
import { MUTED } from './ui';


export default function SignalSection({
  title,
  empty,
  signals,
  copyAmount,
  copyingId,
  onCopy,
}: {
  title: string;
  empty: string;
  signals: SignalListItem[];
  copyAmount: number;
  copyingId: string | null;
  onCopy: (id: string) => void;
}) {
  return (
    <section className='mb-8'>
      <h2 className='mb-3 flex items-baseline gap-2 text-[17px] font-semibold'>
        {title}
        <span className='text-[13px] font-normal text-muted'>
          ({signals.length})
        </span>
      </h2>

      {!signals.length ? (
        <p className={MUTED}>{empty}</p>
      ) : (
        <div className='grid gap-4 xl:grid-cols-2'>
          {signals.map((s) => (
            <SignalCard
              key={s.id}
              signal={s}
              copyAmount={copyAmount}
              copying={copyingId === s.id}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </section>
  );
}
