import { NextRequest, NextResponse } from 'next/server';
import { makeSendBillRemindersUseCase } from '@/infrastructure/lib/container';
import { verifyCronSecret } from '@/infrastructure/lib/verifyCronSecret';
import { toZonedTime } from 'date-fns-tz';

const BANGKOK_TZ = 'Asia/Bangkok';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const today = toZonedTime(new Date(), BANGKOK_TZ);

  try {
    const useCase = makeSendBillRemindersUseCase();
    await useCase.execute(today);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
