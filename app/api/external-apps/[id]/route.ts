import { NextRequest, NextResponse } from 'next/server';
import { verifyLiffToken } from '@/infrastructure/lib/verifyLiffToken';
import { makeDeleteExternalAppUseCase } from '@/infrastructure/lib/container';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id } = await params;
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const useCase = makeDeleteExternalAppUseCase();
    await useCase.execute(id, userId);
    return new NextResponse(null, { status: 204 });
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
