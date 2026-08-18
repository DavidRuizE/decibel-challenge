'use client';

import { useState } from 'react';
import { friendly, money } from '@/lib/format';
import type { MarketSummary } from '@/lib/types';
import Card from './Card';
import DirectionPicker from './DirectionPicker';
import Notice, { type NoticeState } from './Notice';
import { BIG_BUTTON, CONTROL, FIELD_LABEL, TINY } from './ui';

export default function SignalForm({
  markets,
  onPosted,
}: {
  markets: MarketSummary[];
  onPosted: () => void;
}) {
  const [author, setAuthor] = useState('');
  const [marketName, setMarketName] = useState('BTC/USD');
  const [isUp, setIsUp] = useState(true);
  const [takeProfitPct, setTakeProfitPct] = useState(3);
  const [stopLossPct, setStopLossPct] = useState(2);
  const [holdHours, setHoldHours] = useState(4);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  async function submit() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          author,
          marketName,
          isBuy: isUp,
          takeProfitPct,
          stopLossPct,
          holdHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ ok: false, text: data.error ?? 'Could not post that idea' });
      } else {
        setNotice({
          ok: true,
          text: `Posted — entry taken from the live price, ${money(data.entryPrice)}.`,
        });
        onPosted();
      }
    } catch (e) {
      setNotice({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Post an idea">
      <input
        placeholder="Your name"
        aria-label="Your name"
        className={`${CONTROL} mb-2.5`}
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />

      <select
        aria-label="Market"
        className={`${CONTROL} mb-2.5`}
        value={marketName}
        onChange={(e) => setMarketName(e.target.value)}
      >
        {(markets.length ? markets : [{ name: 'BTC/USD', price: 0 }]).map((m) => (
          <option key={m.name} value={m.name}>
            {friendly(m.name)}
          </option>
        ))}
      </select>

      <DirectionPicker isUp={isUp} onChange={setIsUp} assetName={friendly(marketName)} />

      <div className="mt-3.5 flex gap-2">
        <div className="flex-1">
          <label className={FIELD_LABEL} htmlFor="tp">Take profit %</label>
          <input
            id="tp"
            type="number"
            className={CONTROL}
            value={takeProfitPct}
            onChange={(e) => setTakeProfitPct(Number(e.target.value))}
          />
        </div>
        <div className="flex-1">
          <label className={FIELD_LABEL} htmlFor="sl">Stop loss %</label>
          <input
            id="sl"
            type="number"
            className={CONTROL}
            value={stopLossPct}
            onChange={(e) => setStopLossPct(Number(e.target.value))}
          />
        </div>
        <div className="flex-1">
          <label className={FIELD_LABEL} htmlFor="hold">Hold hours</label>
          <input
            id="hold"
            type="number"
            className={CONTROL}
            value={holdHours}
            onChange={(e) => setHoldHours(Number(e.target.value))}
          />
        </div>
      </div>

      <p className={`mt-2.5 ${TINY}`}>
        The entry price is taken from the live market when you post — you can&apos;t type it in.
      </p>

      <button type="button" className={`${BIG_BUTTON} bg-accent`} disabled={busy} onClick={submit}>
        {busy ? 'Posting…' : 'Post this idea'}
      </button>

      <Notice notice={notice} />
    </Card>
  );
}
