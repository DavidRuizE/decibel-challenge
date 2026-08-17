'use client';

import { useState } from 'react';
import { friendly, money } from '@/lib/format';
import type { MarketSummary } from '@/lib/types';
import AmountPicker from './AmountPicker';
import Card from './Card';
import DirectionPicker from './DirectionPicker';
import Notice, { type NoticeState } from './Notice';
import { BIG_BUTTON, CONTROL, STEP_LABEL, TINY } from './ui';

export default function TradePanel({
  markets,
  onPlaced,
}: {
  markets: MarketSummary[];
  onPlaced: () => void;
}) {
  const [marketName, setMarketName] = useState('BTC/USD');
  const [isUp, setIsUp] = useState(true);
  const [dollars, setDollars] = useState(10);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  const asset = friendly(marketName);
  const price = markets.find((m) => m.name === marketName)?.price ?? null;
  const ready = !busy && !!price && dollars > 0;

  async function submit() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ marketName, isBuy: isUp, dollars }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNotice({ ok: false, text: data.hint ? `${data.error} — ${data.hint}` : data.error });
      } else {
        const raised = data.raisedToMinimum
          ? ` We rounded up to the smallest tradable amount, ${money(data.costUsd)}.`
          : '';
        setNotice({
          ok: true,
          text: `Done — ${money(data.costUsd)} betting ${asset} goes ${isUp ? 'up' : 'down'}.${raised} It stays open until you close it or set automatic exits below.`,
        });
      }
      onPlaced();
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <label className={STEP_LABEL} htmlFor="market">
        1. What do you want to bet on?
      </label>
      <select
        id="market"
        className={CONTROL}
        value={marketName}
        onChange={(e) => setMarketName(e.target.value)}
      >
        {(markets.length ? markets : [{ name: 'BTC/USD', price: 0 }]).map((m) => (
          <option key={m.name} value={m.name}>
            {friendly(m.name)}
          </option>
        ))}
      </select>
      <p className={`mt-1.5 ${TINY}`}>
        {price ? `1 ${asset} costs about ${money(price)}` : 'Loading price…'}
      </p>

      <span className={STEP_LABEL}>2. Which way do you think it goes?</span>
      <DirectionPicker isUp={isUp} onChange={setIsUp} assetName={asset} />

      <span className={STEP_LABEL}>3. How much do you want to risk?</span>
      <AmountPicker value={dollars} onChange={setDollars} />

      <button
        type="button"
        className={`${BIG_BUTTON} ${isUp ? 'bg-up' : 'bg-down'}`}
        disabled={!ready}
        onClick={submit}
      >
        {busy ? 'Sending…' : `Bet $${dollars} that ${asset} goes ${isUp ? 'up' : 'down'}`}
      </button>

      <Notice notice={notice} />
    </Card>
  );
}
