import { z } from 'zod';

export const CreateBillTemplateDtoSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(100),
  icon: z.string().nullable().optional(),
  dueDay: z.number().int().min(1).max(31),
  paymentAppId: z.string().min(1),
  billingAppId: z.string().min(1).nullable().optional(),
  reminderDays: z.array(z.number().int().min(1)).default([3, 1]),
});

export const UpdateBillTemplateDtoSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().nullable().optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  paymentAppId: z.string().min(1).optional(),
  billingAppId: z.string().min(1).nullable().optional(),
  reminderDays: z.array(z.number().int().min(1)).optional(),
});

export type CreateBillTemplateDto = z.infer<typeof CreateBillTemplateDtoSchema>;
export type UpdateBillTemplateDto = z.infer<typeof UpdateBillTemplateDtoSchema>;
