export interface IBillTemplate {
  id: string;
  userId: string;
  name: string;
  dueDay: number; // 1–31
  paymentAppId: string;
  billingAppId: string | null;
  reminderDays: number[]; // default [3, 1]
  createdAt: Date;
  updatedAt: Date;
}
