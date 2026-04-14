import { IBillInstanceRepository } from '@/domain/repositories/IBillInstanceRepository';
import { ILineMessagingService, IFlexBubble } from '@/domain/services/ILineMessagingService';
import { IBillInstance } from '@/domain/entities/BillInstance';
import { formatThaiDate } from '@/application/utils/formatThaiDate';

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function shouldRemindToday(instance: IBillInstance, todayDay: number, todayMonth: number, todayYear: number): boolean {
  for (const reminderDay of instance.reminderDays) {
    const diff = instance.dueDay - reminderDay;

    if (diff >= 1) {
      // Same-month case
      if (instance.month === todayMonth && instance.year === todayYear && diff === todayDay) return true;
    } else {
      // Cross-month case: reminder fires in previous month
      const prevMonth = instance.month === 1 ? 12 : instance.month - 1;
      const prevYear = instance.month === 1 ? instance.year - 1 : instance.year;
      const reminderDayInPrevMonth = daysInMonth(prevMonth, prevYear) + diff;
      if (prevMonth === todayMonth && prevYear === todayYear && reminderDayInPrevMonth === todayDay) return true;
    }
  }
  return false;
}

export class SendBillRemindersUseCase {
  constructor(
    private instanceRepo: IBillInstanceRepository,
    private lineService: ILineMessagingService
  ) {}

  async execute(today: Date): Promise<void> {
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();

    const candidates = await this.instanceRepo.findUnpaidForReminder(todayMonth, todayYear);

    const matching = candidates.filter((inst) =>
      shouldRemindToday(inst, todayDay, todayMonth, todayYear)
    );

    // Group by userId
    const byUser = new Map<string, IBillInstance[]>();
    for (const inst of matching) {
      const list = byUser.get(inst.userId) ?? [];
      list.push(inst);
      byUser.set(inst.userId, list);
    }

    for (const [userId, instances] of byUser) {
      try {
        const bubbles: IFlexBubble[] = instances.map((inst) => {
          const daysLeft = inst.dueDay - todayDay;
          return {
            instanceId: inst.id,
            billName: inst.name,
            dueDate: formatThaiDate(inst.dueDay, inst.month, inst.year),
            daysLeft,
            paymentApp: inst.paymentAppSnapshot,
            billingApp: inst.billingAppSnapshot,
          };
        });
        await this.lineService.sendFlexCarousel(userId, bubbles);
      } catch (err) {
        console.error(`Failed to send reminder to ${userId}:`, err);
      }
    }
  }
}
