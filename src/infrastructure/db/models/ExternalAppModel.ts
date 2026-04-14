import mongoose, { Schema, Document, Model } from 'mongoose';
import { IExternalApp } from '@/domain/entities/ExternalApp';

export type ExternalAppDocument = Omit<IExternalApp, 'id'> & Document;

const ExternalAppSchema = new Schema<ExternalAppDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logoUrl: { type: String, required: true },
    deepLink: { type: String, default: null },
    webUrl: { type: String, default: null },
    appType: { type: [String], required: true },
    isSystem: { type: Boolean, required: true, default: false },
    ownerId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ExternalAppSchema.index({ appType: 1, isSystem: 1 });
ExternalAppSchema.index({ ownerId: 1 });

export const ExternalAppModel: Model<ExternalAppDocument> =
  mongoose.models.ExternalApp ??
  mongoose.model<ExternalAppDocument>('ExternalApp', ExternalAppSchema);
