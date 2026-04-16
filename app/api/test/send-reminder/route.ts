import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/infrastructure/lib/verifyCronSecret';
import { MongooseBillTemplateRepository } from '@/infrastructure/db/repositories/MongooseBillTemplateRepository';
import { MongooseExternalAppRepository } from '@/infrastructure/db/repositories/MongooseExternalAppRepository';
import { LineMessagingService } from '@/infrastructure/line/LineMessagingService';
import { formatThaiDate } from '@/application/utils/formatThaiDate';
import { toZonedTime } from 'date-fns-tz';
import { IFlexBubble } from '@/domain/services/ILineMessagingService';

const BANGKOK_TZ = 'Asia/Bangkok';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templateId = req.nextUrl.searchParams.get('templateId');
  if (!templateId) {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
  }

  const templateRepo = new MongooseBillTemplateRepository();
  const appRepo = new MongooseExternalAppRepository();
  const lineService = new LineMessagingService();

  const template = await templateRepo.findById(templateId);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const today = toZonedTime(new Date(), BANGKOK_TZ);
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();

  const [paymentApp, billingApp] = await Promise.all([
    appRepo.findById(template.paymentAppId),
    template.billingAppId ? appRepo.findById(template.billingAppId) : Promise.resolve(null),
  ]);

  const bubble: IFlexBubble = {
    instanceId: `test-${template.id}`,
    billName: template.name,
    dueDate: formatThaiDate(template.dueDay, todayMonth, todayYear),
    daysLeft: template.dueDay - todayDay,
    paymentApp: paymentApp
      ? { name: paymentApp.name, logoUrl: paymentApp.logoUrl, deepLink: paymentApp.deepLink, webUrl: paymentApp.webUrl }
      : null,
    billingApp: billingApp
      ? { name: billingApp.name, logoUrl: billingApp.logoUrl, deepLink: billingApp.deepLink, webUrl: billingApp.webUrl }
      : null,
  };

  try {
    await lineService.sendFlexCarousel(template.userId, [bubble]);
    return NextResponse.json({ ok: true, sentTo: template.userId, templateId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to send LINE message' }, { status: 500 });
  }
}
