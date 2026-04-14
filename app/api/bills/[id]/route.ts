import { NextRequest, NextResponse } from 'next/server';
import { verifyLiffToken } from '@/infrastructure/lib/verifyLiffToken';
import {
  makeUpdateBillTemplateUseCase,
  makeDeleteBillTemplateUseCase,
} from '@/infrastructure/lib/container';
import { UpdateBillTemplateDtoSchema } from '@/application/dtos/BillTemplateDto';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id } = await params;
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const body = await req.json();
    const parsed = UpdateBillTemplateDtoSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    const useCase = makeUpdateBillTemplateUseCase();
    const updated = await useCase.execute(id, userId, parsed.data);
    return NextResponse.json(updated);
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id } = await params;
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const useCase = makeDeleteBillTemplateUseCase();
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
