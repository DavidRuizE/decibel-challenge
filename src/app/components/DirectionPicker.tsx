import { CHOICE_DOWN, CHOICE_UP, EXPLAINER } from './ui';

/**
 * Perps have no "sell what you own" — a down bet opens a short. The old wording
 * ("Buy"/"Sell") implied spot trading and let people short a coin while
 * believing they were selling holdings. So the choice is framed as a direction,
 * and the short is spelled out.
 */
export default function DirectionPicker({
  isUp,
  onChange,
  assetName,
}: {
  isUp: boolean;
  onChange: (isUp: boolean) => void;
  assetName?: string;
}) {
  const asset = assetName ?? 'it';
  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          className={CHOICE_UP}
          aria-pressed={isUp}
          onClick={() => onChange(true)}
        >
          ▲ Up
        </button>
        <button
          type="button"
          className={CHOICE_DOWN}
          aria-pressed={!isUp}
          onClick={() => onChange(false)}
        >
          ▼ Down
        </button>
      </div>

      <p className={EXPLAINER}>
        {isUp ? (
          <>
            You win if <strong>{asset}</strong> goes up, and lose if it goes down.
          </>
        ) : (
          <>
            You win if <strong>{asset}</strong> goes <strong>down</strong>, and lose if it goes
            up.
          </>
        )}
      </p>
    </>
  );
}
