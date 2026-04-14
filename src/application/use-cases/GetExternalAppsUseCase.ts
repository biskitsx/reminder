import { IExternalAppRepository } from '@/domain/repositories/IExternalAppRepository';
import { IExternalApp } from '@/domain/entities/ExternalApp';

export class GetExternalAppsUseCase {
  constructor(private repo: IExternalAppRepository) {}

  async execute(userId: string, appType?: string): Promise<IExternalApp[]> {
    return this.repo.findByUserAndType(userId, appType);
  }
}
