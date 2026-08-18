'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { friendly, money } from '@/lib/format';
import type { SignalListItem } from '@/lib/types';
import type { MarketSummary } from '@/lib/types';
import AmountPicker from '../components/AmountPicker';
import Card from '../components/Card';
import Notice, { type NoticeState } from '../components/Notice';
import SignalForm from '../components/SignalForm';
import SignalSection from '../components/SignalSection';

export default function Signals() {
  const [signals, setSignals] = useState<SignalListItem[]>([]);
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [copyAmount, setCopyAmount] = useState(5);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);

  const load = useCallback(async () => {
    try {
      const [sigRes, stateRes] = await Promise.all([
        fetch('/api/signals'),
        fetch('/api/state'),
      ]);
      const sigs = await sigRes.json();
      if (!sigRes.ok)
        throw new Error(sigs.error ?? 'Could not load saved ideas');
      setSignals(sigs);

      const state = await stateRes.json();
      if (stateRes.ok && state.markets) setMarkets(state.markets);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function copy(signalId: string) {
    setCopyingId(signalId);
    setNotice(null);
    try {
      const res = await fetch('/api/signals/copy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signalId, dollars: copyAmount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNotice({
          ok: false,
          text: data.hint ? `${data.error} — ${data.hint}` : data.error,
        });
      } else {
        const exits = data.exitsSet
          ? ` It closes itself at ${money(data.takeProfitPrice)} to win, or ${money(
              data.stopLossPrice,
            )} to stop the loss.`
          : ` Warning: the bet is open but its automatic exits could NOT be set${
              data.exitError ? ` (${data.exitError})` : ''
            } — close it yourself from the trading screen.`;

        setNotice({
          ok: data.exitsSet,
          text:
            `Copied — ${money(data.costUsd)} betting ${friendly(data.marketName)} goes ${
              data.isBuy ? 'up' : 'down'
            }, entered at ${money(data.yourPrice)}.` + exits,
        });
      }
    } catch (e) {
      setNotice({
        ok: false,
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setCopyingId(null);
    }
  }

  const active = signals.filter((s) => !s.expired);
  const expired = signals.filter((s) => s.expired);

  return (
    <main className='mx-auto max-w-7xl px-5 pt-6 pb-16'>
      <Link
        className='mb-3 inline-block text-sm text-accent hover:underline'
        href='/'
      >
        ← Back to trading
      </Link>
      <h1 className='text-[26px] font-bold tracking-tight'>Trade ideas</h1>
      <p className='mt-1 text-sm text-muted'>
        Post an idea, or copy someone else&apos;s with one click.
      </p>

      {loadError && (
        <div
          className='mb-4 rounded-xl border border-down bg-down-soft px-3.5 py-3 text-sm text-down'
          role='alert'
        >
          {loadError}
        </div>
      )}

      <div className='mt-4 lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-5'>
        <div className='lg:sticky lg:top-6'>
          <SignalForm markets={markets} onPosted={load} />

          <Notice notice={notice} />

          <Card title='Copy with'>
            <AmountPicker
              value={copyAmount}
              onChange={setCopyAmount}
              showCustom={false}
            />
          </Card>
        </div>

        <div>
          <SignalSection
            title="Active signals"
            empty="No ideas are live right now."
            signals={active}
            copyAmount={copyAmount}
            copyingId={copyingId}
            onCopy={copy}
          />

          <SignalSection
            title="Expired signals"
            empty="Nothing has expired yet."
            signals={expired}
            copyAmount={copyAmount}
            copyingId={copyingId}
            onCopy={copy}
          />
        </div>
      </div>
    </main>
  );
}
