import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IBillInstance } from '@/domain/entities/BillInstance';

const AppSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    logoUrl: { type: String, required: true },
    deepLink: { type: String, default: null },
    webUrl: { type: String, default: null },
  },
  { _id: false }
);

export type BillInstanceDocument = Omit<IBillInstance, 'id' | 'templateId'> & {
  templateId: Types.ObjectId;
} & Document;

const BillInstanceSchema = new Schema<BillInstanceDocument>(
  {
    templateId: { type: Schema.Types.ObjectId, ref: 'BillTemplate', required: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    dueDay: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date, default: null },
    reminderDays: { type: [Number], required: true },
    paymentAppSnapshot: { type: AppSnapshotSchema, required: true },
    billingAppSnapshot: { type: AppSnapshotSchema, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BillInstanceSchema.index({ userId: 1, year: 1, month: 1, isPaid: 1 });
BillInstanceSchema.index({ templateId: 1, year: 1, month: 1 }, { unique: true });

export const BillInstanceModel: Model<BillInstanceDocument> =
  mongoose.models.BillInstance ??
  mongoose.model<BillInstanceDocument>('BillInstance', BillInstanceSchema);
