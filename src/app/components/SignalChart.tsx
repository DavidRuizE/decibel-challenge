'use client';

import { useEffect, useState } from 'react';
import { money } from '@/lib/format';
import { TINY } from './ui';

type Candle = { time: number; close: number };

const W = 480;
const H = 190;
const PAD_X = 8;
const PAD_TOP = 22;
const PAD_BOTTOM = 14;

export default function SignalChart({
  marketName,
  entry,
  takeProfit,
  stopLoss,
  isBuy,
}: {
  marketName: string;
  entry: number;
  takeProfit: number;
  stopLoss: number;
  isBuy: boolean;
}) {
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(
          `/api/candles?market=${encodeURIComponent(marketName)}`,
        );
        const data = await res.json();
        if (!alive) return;
        if (!res.ok || !Array.isArray(data)) setFailed(true);
        else setCandles(data);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [marketName]);

  if (failed) {
    return (
      <p className={`py-2 ${TINY}`}>
        Chart unavailable right now — the trade details above are still
        accurate.
      </p>
    );
  }
  if (!candles?.length) {
    return <p className={`py-2 ${TINY}`}>Loading chart…</p>;
  }

  const values = [...candles.map((c) => c.close), entry, takeProfit, stopLoss];
  const low = Math.min(...values);
  const high = Math.max(...values);
  const breathing = (high - low || 1) * 0.12;
  const min = low - breathing;
  const span = high + breathing - min;

  const x = (i: number) =>
    PAD_X + (i / (candles.length - 1 || 1)) * (W - PAD_X * 2);
  const y = (v: number) =>
    PAD_TOP + (1 - (v - min) / span) * (H - PAD_TOP - PAD_BOTTOM);

  const line = candles.map((c, i) => `${x(i)},${y(c.close)}`).join(' ');

  const levels = [
    { value: takeProfit, color: 'var(--up)', label: 'Take profit' },
    { value: entry, color: 'var(--ink)', label: 'Entry' },
    { value: stopLoss, color: 'var(--down)', label: 'Stop loss' },
  ];

  return (
    <svg
      className='my-2.5 block h-auto w-full'
      viewBox={`0 0 ${W} ${H}`}
      role='img'
      aria-label={`${marketName} price with entry, take profit and stop loss levels`}
    >
      <rect
        x={0.5}
        y={0.5}
        width={W - 1}
        height={H - 1}
        rx={9}
        fill='var(--canvas)'
        stroke='var(--line)'
      />

      <text
        x={W - PAD_X}
        y={13}
        fontSize={9}
        fill='var(--muted)'
        textAnchor='end'
      >
        {marketName} · last 24h · {isBuy ? 'up bet' : 'down bet'}
      </text>

      {levels.map((l) => (
        <g key={l.label}>
          <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={y(l.value)}
            y2={y(l.value)}
            stroke={l.color}
            strokeWidth={1}
            strokeDasharray={l.label === 'Entry' ? undefined : '4 3'}
          />
          <text x={PAD_X + 3} y={y(l.value) - 4} fontSize={9.5} fill={l.color}>
            {l.label} {money(l.value)}
          </text>
        </g>
      ))}

      <polyline
        points={line}
        fill='none'
        stroke='var(--accent)'
        strokeWidth={1.75}
        strokeLinejoin='round'
      />
    </svg>
  );
}
