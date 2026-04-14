import { IBillInstance } from '../entities/BillInstance';

export interface IBillInstanceRepository {
  findById(id: string): Promise<IBillInstance | null>;
  findByUserMonthYear(userId: string, month: number, year: number): Promise<IBillInstance[]>;
  findUnpaidForReminder(month: number, year: number): Promise<IBillInstance[]>;
  create(data: Omit<IBillInstance, 'id' | 'createdAt'>): Promise<IBillInstance>;
  markPaid(id: string, paidAt: Date): Promise<IBillInstance | null>;
  existsByTemplateMonthYear(templateId: string, month: number, year: number): Promise<boolean>;
}
