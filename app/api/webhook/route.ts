import { NextRequest, NextResponse } from 'next/server';
import { validateSignature } from '@line/bot-sdk';
import { makeMarkBillPaidUseCase } from '@/infrastructure/lib/container';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  try {
    const body = await req.text();
    const signature = req.headers.get('x-line-signature') ?? '';

    const isValid = validateSignature(body, secret, signature);
    if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

    const payload = JSON.parse(body);
    const useCase = makeMarkBillPaidUseCase();

    for (const event of payload.events ?? []) {
      if (event.type === 'postback' && event.postback?.data?.startsWith('MARK_PAID:')) {
        const instanceId = event.postback.data.replace('MARK_PAID:', '');
        await useCase.execute(instanceId, event.replyToken);
      }
      // All other event types: silently ignore
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
