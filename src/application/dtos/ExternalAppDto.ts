import { z } from 'zod';

const APP_TYPES = ['billing', 'payment'] as const;

export const CreateExternalAppDtoSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  logoUrl: z.string().url(),
  deepLink: z.string().min(1).nullable().optional(),
  webUrl: z.string().url().nullable().optional(),
  appType: z.array(z.enum(APP_TYPES)).min(1),
  ownerId: z.string().min(1),
});

export type CreateExternalAppDto = z.infer<typeof CreateExternalAppDtoSchema>;
