import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';
import { IBillTemplate } from '@/domain/entities/BillTemplate';
import { CreateBillTemplateDto } from '@/application/dtos/BillTemplateDto';

export class CreateBillTemplateUseCase {
  constructor(private repo: IBillTemplateRepository) {}

  async execute(dto: CreateBillTemplateDto): Promise<IBillTemplate> {
    return this.repo.create({
      userId: dto.userId,
      name: dto.name,
      icon: dto.icon ?? null,
      dueDay: dto.dueDay,
      paymentAppId: dto.paymentAppId,
      billingAppId: dto.billingAppId ?? null,
      reminderDays: dto.reminderDays,
    });
  }
}
