import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';
import { IBillInstanceRepository } from '@/domain/repositories/IBillInstanceRepository';
import { IExternalAppRepository } from '@/domain/repositories/IExternalAppRepository';
import { IExternalAppSnapshot } from '@/domain/entities/ExternalApp';

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export class GenerateMonthlyBillsUseCase {
  constructor(
    private templateRepo: IBillTemplateRepository,
    private instanceRepo: IBillInstanceRepository,
    private externalAppRepo: IExternalAppRepository
  ) {}

  async execute(month: number, year: number): Promise<{ created: number; skipped: number }> {
    const templates = await this.templateRepo.findAll();
    let created = 0;
    let skipped = 0;

    for (const template of templates) {
      const alreadyExists = await this.instanceRepo.existsByTemplateMonthYear(
        template.id, month, year
      );
      if (alreadyExists) { skipped++; continue; }

      const clampedDueDay = Math.min(template.dueDay, daysInMonth(month, year));

      const paymentApp = await this.externalAppRepo.findById(template.paymentAppId);
      if (!paymentApp) { skipped++; continue; }

      const paymentAppSnapshot: IExternalAppSnapshot = {
        name: paymentApp.name,
        logoUrl: paymentApp.logoUrl,
        deepLink: paymentApp.deepLink,
        webUrl: paymentApp.webUrl,
      };

      let billingAppSnapshot: IExternalAppSnapshot | null = null;
      if (template.billingAppId) {
        const billingApp = await this.externalAppRepo.findById(template.billingAppId);
        if (billingApp) {
          billingAppSnapshot = {
            name: billingApp.name,
            logoUrl: billingApp.logoUrl,
            deepLink: billingApp.deepLink,
            webUrl: billingApp.webUrl,
          };
        }
      }

      await this.instanceRepo.create({
        templateId: template.id,
        userId: template.userId,
        name: template.name,
        dueDay: clampedDueDay,
        month,
        year,
        isPaid: false,
        paidAt: null,
        reminderDays: template.reminderDays,
        paymentAppSnapshot,
        billingAppSnapshot,
      });
      created++;
    }

    return { created, skipped };
  }
}
