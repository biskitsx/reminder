import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';

export class DeleteBillTemplateUseCase {
  constructor(private repo: IBillTemplateRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw Object.assign(new Error('Not found'), { status: 404 });
    if (existing.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
    await this.repo.deleteById(id);
  }
}
