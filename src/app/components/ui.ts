export const CONTROL =
  'w-full rounded-[10px] border border-line bg-surface px-3 py-3 text-base text-ink ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export const CHOICE =
  'flex-1 cursor-pointer rounded-[10px] border border-line bg-surface px-2.5 py-3 ' +
  'text-[15px] font-semibold text-ink hover:border-muted ' +
  'aria-pressed:border-2 aria-pressed:border-ink ' +
  'disabled:cursor-not-allowed disabled:text-disabled ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export const CHOICE_UP =
  CHOICE + ' aria-pressed:border-up aria-pressed:bg-up-soft aria-pressed:text-up';
export const CHOICE_DOWN =
  CHOICE + ' aria-pressed:border-down aria-pressed:bg-down-soft aria-pressed:text-down';

export const BIG_BUTTON =
  'mt-5 w-full cursor-pointer rounded-xl border-none px-4 py-4 text-lg font-bold text-white ' +
  'disabled:cursor-not-allowed disabled:bg-disabled ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export const SMALL_BUTTON =
  'cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:border-muted';

export const STEP_LABEL = 'mt-6 block text-[15px] font-semibold first:mt-0';

export const MUTED = 'text-sm text-muted';
export const TINY = 'text-[12.5px] text-muted';

export const EXPLAINER =
  'mt-2.5 rounded-[10px] border border-line bg-canvas px-3 py-2.5 text-[13px] leading-relaxed text-muted';

export const BADGE =
  'ml-1 inline-block rounded-full px-[7px] py-[2px] text-[11px] font-bold tracking-wide uppercase';

export const FIELD_LABEL = 'mb-1 block text-[12.5px] text-muted';
