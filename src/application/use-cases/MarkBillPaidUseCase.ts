import { IBillInstanceRepository } from '@/domain/repositories/IBillInstanceRepository';
import { ILineMessagingService } from '@/domain/services/ILineMessagingService';
import { formatThaiDate } from '@/application/utils/formatThaiDate';

export class MarkBillPaidUseCase {
  constructor(
    private instanceRepo: IBillInstanceRepository,
    private lineService: ILineMessagingService
  ) {}

  async execute(instanceId: string, replyToken: string): Promise<void> {
    const instance = await this.instanceRepo.findById(instanceId);

    if (!instance) {
      await this.lineService.replyText(replyToken, 'ไม่พบบิลนี้');
      return;
    }

    if (instance.isPaid && instance.paidAt) {
      const dateStr = formatThaiDate(
        instance.paidAt.getDate(),
        instance.paidAt.getMonth() + 1,
        instance.paidAt.getFullYear()
      );
      await this.lineService.replyText(replyToken, `จ่ายไปแล้วเมื่อ ${dateStr}`);
      return;
    }

    await this.instanceRepo.markPaid(instanceId, new Date());
    await this.lineService.replyText(replyToken, `✅ บันทึกการจ่าย ${instance.name} แล้ว`);
  }
}
