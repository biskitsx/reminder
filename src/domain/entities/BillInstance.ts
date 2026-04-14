import { IExternalAppSnapshot } from './ExternalApp';

export interface IBillInstance {
  id: string;
  templateId: string;
  userId: string;
  name: string;
  dueDay: number;
  month: number; // 1–12
  year: number;
  isPaid: boolean;
  paidAt: Date | null;
  reminderDays: number[];
  paymentAppSnapshot: IExternalAppSnapshot;
  billingAppSnapshot: IExternalAppSnapshot | null;
  createdAt: Date;
}
