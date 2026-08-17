import { decibelRead } from '@/lib/decibel';
import { SUBACCOUNT } from '@/lib/orders';
import { buildAccountState } from '@/lib/state';
import { NextResponse } from 'next/server';


export async function GET(){
    try{
        const [markets, prices, overview, positions, openOrders] = await Promise.all([
            decibelRead.markets.getAll(),
            decibelRead.marketPrices.getAll(),
            decibelRead.accountOverview.getByAddr({ subAddr: SUBACCOUNT}),
            decibelRead.userPositions.getByAddr({ subAddr: SUBACCOUNT}),
            decibelRead.userOpenOrders.getByAddr({ subAddr: SUBACCOUNT}),
        ])
        return NextResponse.json(
            buildAccountState({
                markets,
                prices,
                overview,
                positions,
                openOrders
            })
        );
    } catch (error){
        return NextResponse.json(
            { error: 'could not reach Decibel', hint: String(error)},
            { status: 502}
        )
    }
}