import { CHOICE, CONTROL } from './ui';

const PRESETS = [5, 10, 25, 50];

export default function AmountPicker({
  value,
  onChange,
  showCustom = true,
}: {
  value: number;
  onChange: (n: number) => void;
  showCustom?: boolean;
}) {
  return (
    <>
      <div className={`flex gap-2 ${showCustom ? 'mb-2' : ''}`}>
        {PRESETS.map((amount) => (
          <button
            key={amount}
            type="button"
            className={CHOICE}
            aria-pressed={value === amount}
            onClick={() => onChange(amount)}
          >
            ${amount}
          </button>
        ))}
      </div>
      {showCustom && (
        <input
          type="number"
          min={0}
          step={1}
          aria-label="Custom dollar amount"
          className={CONTROL}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )}
    </>
  );
}
