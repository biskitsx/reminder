import { NextRequest, NextResponse } from 'next/server';
import { verifyLiffToken } from '@/infrastructure/lib/verifyLiffToken';
import {
  makeGetBillTemplatesUseCase,
  makeCreateBillTemplateUseCase,
} from '@/infrastructure/lib/container';
import { CreateBillTemplateDtoSchema } from '@/application/dtos/BillTemplateDto';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const useCase = makeGetBillTemplatesUseCase();
    const templates = await useCase.execute(userId);
    return NextResponse.json(templates);
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const idToken = req.headers.get('x-liff-token') ?? '';
    const userId = await verifyLiffToken(idToken);
    const body = await req.json();
    const parsed = CreateBillTemplateDtoSchema.safeParse({ ...body, userId });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    const useCase = makeCreateBillTemplateUseCase();
    const template = await useCase.execute(parsed.data);
    return NextResponse.json(template, { status: 201 });
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
