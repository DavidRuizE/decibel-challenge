'use client';

import { useCallback, useState, useEffect } from 'react';
import TradePanel from './components/TradePanel';
import { AppState } from '@/lib/types';
import BalanceCard from './components/BalanceCard';
import OpenOrdersList from './components/OpenOrdersList';
import PositionsList from './components/PositionsList';
import Link from 'next/link';

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not load your account');
      setState(data);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
    const id = setInterval(refresh, 5000); // polling is fine here
    return () => clearInterval(id);
  }, [refresh]);

  async function cancel(orderId: string, marketName: string) {
    await fetch('/api/cancel', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId, marketName }),
    });
    refresh();
  }

  return (
    <main className='mx-auto max-w-6xl px-5 pt-6 text-center'>
      <h1>Trade, but simpler</h1>
      <p>Practice money, trades on Aptos testnet.</p>
      <br />

      <Link className="my-3 inline-block text-sm text-accent hover:underline" href="/signals">
        See trade ideas from other people →
      </Link>

      {loadError && (
        <div
          className='mb-4 rounded-xl border border-down bg-down-soft px-3.5 py-3 text-sm text-down'
          role='alert'
        >
          <strong>Can&apos;t reach the exchange.</strong> {loadError}
        </div>
      )}

      <div className='lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items:start lg:gap-5'>
        <div className='lg:sticky lg:top-6'>
          <BalanceCard
            equity={state?.equity}
            unrealizedPnl={state?.unrealizedPnl}
            availableToTrade={state?.availableToTrade}
            heldAsMargin={state?.heldAsMargin}
          />
          <TradePanel markets={state?.markets ?? []} onPlaced={refresh} />
        </div>
        <div>
          <PositionsList positions={state?.positions} />
          <OpenOrdersList orders={state?.openOrders} onCancel={cancel} />
        </div>
      </div>
    </main>
  );
}
