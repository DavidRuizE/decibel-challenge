 import type { Position } from '@/lib/types';
import Card from './Card';
import PositionRow from './PositionRow';
import { MUTED } from './ui';

export default function PositionsList({ positions }: { positions: Position[] | undefined }) {
  return (
    <Card title="Your open bets">
      {!positions?.length && (
        <p className={MUTED}>Nothing open yet. Make your first bet above.</p>
      )}
      {positions?.map((p) => (
        <PositionRow key={p.marketName} position={p} />
      ))}
    </Card>
  );
}