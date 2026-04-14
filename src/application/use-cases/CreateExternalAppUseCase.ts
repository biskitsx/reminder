import { IExternalAppRepository } from '@/domain/repositories/IExternalAppRepository';
import { IExternalApp } from '@/domain/entities/ExternalApp';
import { CreateExternalAppDto } from '@/application/dtos/ExternalAppDto';

export class CreateExternalAppUseCase {
  constructor(private repo: IExternalAppRepository) {}

  async execute(dto: CreateExternalAppDto): Promise<IExternalApp> {
    return this.repo.create({
      name: dto.name,
      slug: dto.slug,
      logoUrl: dto.logoUrl,
      deepLink: dto.deepLink ?? null,
      webUrl: dto.webUrl ?? null,
      appType: dto.appType,
      isSystem: false,
      ownerId: dto.ownerId,
    });
  }
}
