import { NextResponse } from 'next/server';
import { cancelOrder } from '@/lib/orders';

export async function POST(req: Request) {
    let body;
    try {
        body = await req.json();
    }catch {
        return NextResponse.json({ error: 'Expected body' }, {status: 400});
    }

    const { orderId, marketName } = body ?? {};
    if ( !orderId || typeof marketName !== 'string'){
        return NextResponse.json(
            { error: 'OrderId and MarketName are required'},
            { status: 400 },
        );
    }

    try {
        const tx = await cancelOrder(orderId, marketName);
        return NextResponse.json({
            cancelled: tx.success,
            transactionHash: tx.hash,
            vmStatus: tx.vm_status,
        })
    } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
