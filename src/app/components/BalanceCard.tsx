import { money, signedMoney } from '@/lib/format';
import Card from './Card';
import { EXPLAINER, MUTED } from './ui';

export default function BalanceCard({
    equity,
    unrealizedPnl,
    availableToTrade,
    heldAsMargin,
} : {
    equity: number | undefined,
    unrealizedPnl: number | undefined,
    availableToTrade: number | undefined,
    heldAsMargin: number | undefined;
}) {
    const holding = (heldAsMargin ?? 0) > 0.01;

    return(
    <Card>
      <div className={MUTED}>You have</div>
      <div className="text-[34px] font-bold tracking-tight">
        {equity === undefined ? '—' : money(equity)}
      </div>

      {unrealizedPnl !== undefined && (
        <div className={`text-sm font-bold ${unrealizedPnl >= 0 ? 'text-up' : 'text-down'}`}>
          {signedMoney(unrealizedPnl)} on open bets
        </div>
      )}

      {availableToTrade !== undefined && (
        <div className={EXPLAINER}>
          <strong>{money(availableToTrade)} free to bet with.</strong>
          {holding ? (
            <>
              {' '}
              The other {money(heldAsMargin ?? 0)} is being held as backing while your bets
              are open — it comes back when you close them. Placing a bet moves money here,
              not out of your total.
            </>
          ) : (
            <> Nothing is tied up in open bets right now.</>
          )}
        </div>
      )}
    </Card>
    )
}