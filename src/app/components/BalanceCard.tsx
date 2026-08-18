import { money, signedMoney } from '@/lib/format';
import Card from './Card';
import { EXPLAINER, MUTED, TINY } from './ui';
import { AppState } from '@/lib/types';

export default function BalanceCard({ state }: { state: AppState | null }) {
  if (!state) {
    return (
      <Card>
        <div className={MUTED}>Worth right now (equity)</div>
        <div className='text-[34px] font-bold tracking-tight'>—</div>
      </Card>
    );
  }

  const {
    equity,
    balance,
    unrealizedPnl,
    fundingCost,
    availableToTrade,
    heldAsMargin,
  } = state;

  return (
    <Card>
      <div className={MUTED}>Worth right now (equity)</div>
      <div className='text-[34px] font-bold tracking-tight'>
        {money(equity)}
      </div>

      <dl className='mt-3 space-y-1.5 text-sm'>
        <div className='flex justify-between gap-3'>
          <dt className='text-muted'>Balance — settled money</dt>
          <dd className='font-semibold'>{money(balance)}</dd>
        </div>
        <div className='flex justify-between gap-3'>
          <dt className='text-muted'>Open bets, not banked yet</dt>
          <dd
            className={`font-semibold ${unrealizedPnl >= 0 ? 'text-up' : 'text-down'}`}
          >
            {signedMoney(unrealizedPnl)}
          </dd>
        </div>
        {Math.abs(fundingCost) > 0.0001 && (
          <div className='flex justify-between gap-3'>
            <dt className='text-muted'>Fee for holding them open</dt>
            <dd className='font-semibold text-down'>
              −{money(Math.abs(fundingCost))}
            </dd>
          </div>
        )}
      </dl>

      <div className={EXPLAINER}>
        <strong>{money(availableToTrade)} free to bet with.</strong>{' '}
        {heldAsMargin > 0.01 ? (
          <>
            The other {money(heldAsMargin)} is backing your open positions and comes
            back when you close them.
          </>
        ) : (
          <>Nothing is tied up in open bets right now.</>
        )}
      </div>
    </Card>
  );
}
