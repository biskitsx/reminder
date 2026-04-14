import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';
import { IBillTemplate } from '@/domain/entities/BillTemplate';

export class GetBillTemplatesUseCase {
  constructor(private repo: IBillTemplateRepository) {}

  async execute(userId: string): Promise<IBillTemplate[]> {
    return this.repo.findByUserId(userId);
  }
}
