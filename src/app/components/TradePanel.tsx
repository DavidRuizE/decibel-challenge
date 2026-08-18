'use client';

import { useState } from 'react';
import { coinAmount, friendly, money } from '@/lib/format';
import type { MarketSummary } from '@/lib/types';
import AmountPicker from './AmountPicker';
import Card from './Card';
import DirectionPicker from './DirectionPicker';
import Notice, { type NoticeState } from './Notice';
import { BIG_BUTTON, CHOICE, CONTROL, EXPLAINER, STEP_LABEL, TINY } from './ui';

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
  const [waitForPrice, setWaitForPrice] = useState(false);
  const [limitPrice, setLimitPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  const asset = friendly(marketName);
  const price = markets.find((m) => m.name === marketName)?.price ?? null;
  const limit = Number(limitPrice);
  const limitReady = !waitForPrice || (limitPrice !== '' && Number.isFinite(limit) && limit > 0);
  const ready = !busy && !!price && dollars > 0 && limitReady;

  async function submit() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          marketName,
          isBuy: isUp,
          dollars,
          ...(waitForPrice ? { limitPrice: limit } : {}),
        }),
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
          text: waitForPrice
            ? `Saved — nothing has happened yet. This starts only if ${asset} reaches ${money(data.price)}, and until then you can cancel it below.`
            : `Done — ${money(data.costUsd)} betting ${asset} goes ${isUp ? 'up' : 'down'}.${raised} It stays open until you close it or set automatic exits below.`,
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

      <span className={STEP_LABEL}>3. How many dollars do you want to put in?</span>
      <AmountPicker value={dollars} onChange={setDollars} />
      <p className={`mt-1.5 ${TINY}`}>
        {price
          ? `That buys about ${coinAmount(dollars / price)} ${asset} at today's price.`
          : 'Loading price…'}
      </p>

      <span className={STEP_LABEL}>4. When?</span>
      <div className="flex gap-2">
        <button
          type="button"
          className={CHOICE}
          aria-pressed={!waitForPrice}
          onClick={() => setWaitForPrice(false)}
        >
          Now
        </button>
        <button
          type="button"
          className={CHOICE}
          aria-pressed={waitForPrice}
          onClick={() => setWaitForPrice(true)}
        >
          Only at my price
        </button>
      </div>

      {waitForPrice && (
        <>
          <input
            type="number"
            min={0}
            step="any"
            aria-label={`Price to wait for, in dollars per ${asset}`}
            placeholder={price ? `e.g. ${isUp ? (price * 0.95).toFixed(2) : (price * 1.05).toFixed(2)}` : 'Price per coin'}
            className={`${CONTROL} mt-2`}
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
          />
          <p className={EXPLAINER}>
            Nothing happens until {asset} reaches your price. Bet {isUp ? 'up' : 'down'}, so
            pick a price {isUp ? 'below' : 'above'} the current{' '}
            {price ? money(price) : 'market price'}. It waits in{' '}
            <strong>Bets waiting to start</strong> until then, and you can cancel it any time.
          </p>
        </>
      )}

      <button
        type="button"
        className={`${BIG_BUTTON} ${isUp ? 'bg-up' : 'bg-down'}`}
        disabled={!ready}
        onClick={submit}
      >
        {busy
          ? 'Sending…'
          : waitForPrice
            ? `Wait, then bet $${dollars} on ${asset}`
            : `Bet $${dollars} that ${asset} goes ${isUp ? 'up' : 'down'}`}
      </button>

      <Notice notice={notice} />
    </Card>
  );
}
