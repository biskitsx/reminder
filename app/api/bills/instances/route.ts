import { NextRequest, NextResponse } from 'next/server';
import { verifyLiffToken } from '@/infrastructure/lib/verifyLiffToken';
import { makeGetBillInstancesUseCase } from '@/infrastructure/lib/container';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const { searchParams } = req.nextUrl;
    const rawMonth = searchParams.get('month');
    const rawYear = searchParams.get('year');
    const month = rawMonth ? Number(rawMonth) : undefined;
    const year = rawYear ? Number(rawYear) : undefined;
    if (month !== undefined && (isNaN(month) || month < 1 || month > 12)) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
    }
    if (year !== undefined && (isNaN(year) || year < 2000 || year > 2100)) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }
    const useCase = makeGetBillInstancesUseCase();
    const instances = await useCase.execute(userId, month, year);
    return NextResponse.json(instances);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Invalid LIFF token') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (typeof err === 'object' && err !== null && 'status' in err) {
      const e = err as { status: number; message?: string };
      return NextResponse.json({ error: e.message ?? 'Error' }, { status: e.status });
    }
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
