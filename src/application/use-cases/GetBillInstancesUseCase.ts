import { IBillInstanceRepository } from '@/domain/repositories/IBillInstanceRepository';
import { IBillInstance } from '@/domain/entities/BillInstance';
import { toZonedTime } from 'date-fns-tz';

const BANGKOK_TZ = 'Asia/Bangkok';

export class GetBillInstancesUseCase {
  constructor(private repo: IBillInstanceRepository) {}

  async execute(userId: string, month?: number, year?: number): Promise<IBillInstance[]> {
    const now = toZonedTime(new Date(), BANGKOK_TZ);
    const resolvedMonth = month ?? now.getMonth() + 1;
    const resolvedYear = year ?? now.getFullYear();
    return this.repo.findByUserMonthYear(userId, resolvedMonth, resolvedYear);
  }
}
