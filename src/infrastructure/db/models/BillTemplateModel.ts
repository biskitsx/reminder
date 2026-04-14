import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IBillTemplate } from '@/domain/entities/BillTemplate';

export type BillTemplateDocument = Omit<IBillTemplate, 'id' | 'paymentAppId' | 'billingAppId'> & {
  paymentAppId: Types.ObjectId;
  billingAppId: Types.ObjectId | null;
} & Document;

const BillTemplateSchema = new Schema<BillTemplateDocument>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    dueDay: { type: Number, required: true, min: 1, max: 31 },
    paymentAppId: { type: Schema.Types.ObjectId, ref: 'ExternalApp', required: true },
    billingAppId: { type: Schema.Types.ObjectId, ref: 'ExternalApp', default: null },
    reminderDays: { type: [Number], default: [3, 1] },
  },
  { timestamps: true }
);

BillTemplateSchema.index({ userId: 1 });

export const BillTemplateModel: Model<BillTemplateDocument> =
  mongoose.models.BillTemplate ??
  mongoose.model<BillTemplateDocument>('BillTemplate', BillTemplateSchema);
