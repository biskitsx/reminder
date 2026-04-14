import { IExternalAppRepository } from '@/domain/repositories/IExternalAppRepository';

export class DeleteExternalAppUseCase {
  constructor(private repo: IExternalAppRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const app = await this.repo.findById(id);
    if (!app) throw Object.assign(new Error('Not found'), { status: 404 });
    if (app.isSystem) throw Object.assign(new Error('Cannot delete system app'), { status: 403 });
    if (app.ownerId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 });
    await this.repo.deleteById(id);
  }
}
