export type NoticeState = { ok: boolean; text: string } | null;

export default function Notice({ notice }: { notice: NoticeState }) {
  if (!notice) return null;
  return (
    <div
      role="status"
      className={`mt-3.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${
        notice.ok
          ? 'border-up bg-up-soft text-up'
          : 'border-down bg-down-soft text-down'
      }`}
    >
      {notice.text}
    </div>
  );
}
