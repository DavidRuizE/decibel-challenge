import { decibelRead } from '@/lib/decibel';
import { CandlestickInterval } from '@decibeltrade/sdk';
import { NextResponse } from 'next/server'

const HOUR = 3600_000;

function intervalFor(spanMs: number) {
  if (spanMs <= 6 * HOUR) return CandlestickInterval.OneMinute;
  if (spanMs <= 24 * HOUR) return CandlestickInterval.FiveMinutes;
  if (spanMs <= 3 * 24 * HOUR) return CandlestickInterval.FifteenMinutes;
  return CandlestickInterval.OneHour;
}
/**
 * Price history for a signal's chart.
 *
 * `from` is when the idea was posted. The window has to reach back that far or
 * the entry line sits at a price the visible history never traded at, and the
 * price line appears never to touch it. Always at least two hours, so a
 * just-posted idea still draws a line rather than a dot.
 */
export async function GET(req: Request) {
    const params = new URL(req.url).searchParams;
    const marketName = params.get('market');

    if(!marketName){
        return NextResponse.json({ error: 'could not find market'}, {status: 400})
    }

    const endTime = Date.now();  
    const from = Number(params.get('from'));
    const postedAt = Number.isFinite(from) && from > 0 ? from : endTime - 24 * HOUR;
    const startTime = Math.min(postedAt, endTime - 2 * HOUR);

    try {
        const candles = await decibelRead.candlesticks.getByName({
            marketName,
            interval: intervalFor(endTime - startTime),
            startTime,
            endTime
        });
        return NextResponse.json(candles.map((c) => ({ time : Math.floor(c.t / 1000), close: c.c })));
    } catch (error) {
        return NextResponse.json({ error: `Could not load the chart for ${marketName}`, hint: String(error) }, { status: 502 });
    }
}