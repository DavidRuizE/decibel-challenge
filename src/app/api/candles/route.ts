import { decibelRead } from '@/lib/decibel';
import { CandlestickInterval } from '@decibeltrade/sdk';
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const marketName = new URL(req.url).searchParams.get('market') 
    if(!marketName){
        return NextResponse.json({ error: 'could not find market'}, {status: 400})
    }

    const endTime = Date.now();
    const startTime = endTime - 24 * 3600_000; //last 24h of 15min bars
    
    try {
        const candles = await decibelRead.candlesticks.getByName({
            marketName,
            interval: CandlestickInterval.FifteenMinutes,
            startTime,
            endTime
        });
        return NextResponse.json(candles.map((c) => ({ time : Math.floor(c.t / 1000), close: c.c })));
    } catch (error) {
        return NextResponse.json({ error: `Could not load the chart for ${marketName}`, hint: String(error) }, { status: 502 });
    }
}