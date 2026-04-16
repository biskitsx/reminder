import { NextRequest, NextResponse } from 'next/server';
import { makeGenerateMonthlyBillsUseCase } from '@/infrastructure/lib/container';
import { verifyCronSecret } from '@/infrastructure/lib/verifyCronSecret';
import { toZonedTime } from 'date-fns-tz';

const BANGKOK_TZ = 'Asia/Bangkok';

export async function GET(req: NextRequest): Promise<NextResponse> {

  const now = toZonedTime(new Date(), BANGKOK_TZ);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    const useCase = makeGenerateMonthlyBillsUseCase();
    const result = await useCase.execute(month, year);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
