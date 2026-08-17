import { OpenOrder } from '@/lib/types';
import { SMALL_BUTTON, TINY } from './ui';
import { friendly, money } from '@/lib/format';
import Card from './Card';

export default function OpenOrdersList({
    orders,
    onCancel,
}: {
    orders: OpenOrder[] | undefined,
    onCancel: (orderId: string, marketName: string) => void;
}) {
    if (!orders?.length) return null

  return (
    <Card title="Bets waiting to start">
      <p className={`mb-2 ${TINY}`}>
        These only begin if the price reaches the level you asked for.
      </p>

      {orders.map((o) => (
        <div
          className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0"
          key={o.orderId}
        >
          <div className="text-sm">
            {o.isBuy ? 'Up' : 'Down'} bet on {friendly(o.marketName)} · {o.size} at{' '}
            {money(o.price)}
          </div>
          <button
            type="button"
            className={SMALL_BUTTON}
            onClick={() => onCancel(o.orderId, o.marketName)}
          >
            Cancel
          </button>
        </div>
      ))}
    </Card>
  );
}