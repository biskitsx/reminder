import { IExternalApp } from '../entities/ExternalApp';

export interface IExternalAppRepository {
  findById(id: string): Promise<IExternalApp | null>;
  findByUserAndType(userId: string, appType?: string): Promise<IExternalApp[]>;
  create(data: Omit<IExternalApp, 'id' | 'createdAt'>): Promise<IExternalApp>;
  deleteById(id: string): Promise<void>;
}
