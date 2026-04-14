import { IBillTemplate } from '../entities/BillTemplate';

export interface IBillTemplateRepository {
  findById(id: string): Promise<IBillTemplate | null>;
  findByUserId(userId: string): Promise<IBillTemplate[]>;
  findAll(): Promise<IBillTemplate[]>;
  create(data: Omit<IBillTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<IBillTemplate>;
  update(id: string, data: Partial<Omit<IBillTemplate, 'id' | 'createdAt'>>): Promise<IBillTemplate | null>;
  deleteById(id: string): Promise<void>;
}
