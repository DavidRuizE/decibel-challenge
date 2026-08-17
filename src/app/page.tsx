'use client';

import { useCallback, useState, useEffect } from 'react';
import TradePanel from './components/TradePanel';
import { AppState } from '@/lib/types';

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
  return (
    <main className='mx-auto max-w-4xl px-5 pt-6 text-center'>
      <h1>Trade, but simpler</h1>
      <h3>By Decibel</h3>
      <p>Practice money, trades on Aptos testnet.</p>

      {loadError && (
        <div
          className='mb-4 rounded-xl border border-down bg-down-soft px-3.5 py-3 text-sm text-down'
          role='alert'
        >
          <strong>Can&apos;t reach the exchange.</strong> {loadError}
        </div>
      )}
      <TradePanel markets={state?.markets ?? []} onPlaced={refresh} />
    </main>
  );
}
