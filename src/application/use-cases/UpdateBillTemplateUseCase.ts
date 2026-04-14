import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';
import { IBillTemplate } from '@/domain/entities/BillTemplate';
import { UpdateBillTemplateDto } from '@/application/dtos/BillTemplateDto';

export class UpdateBillTemplateUseCase {
  constructor(private repo: IBillTemplateRepository) {}

  async execute(id: string, userId: string, dto: UpdateBillTemplateDto): Promise<IBillTemplate> {
    const existing = await this.repo.findById(id);
    if (!existing) throw Object.assign(new Error('Not found'), { status: 404 });
    if (existing.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
    const updated = await this.repo.update(id, dto);
    if (!updated) throw Object.assign(new Error('Not found'), { status: 404 });
    return updated;
  }
}
