import { connectDB } from '@/infrastructure/lib/mongodb';
import { BillTemplateModel } from '../models/BillTemplateModel';
import { IBillTemplateRepository } from '@/domain/repositories/IBillTemplateRepository';
import { IBillTemplate } from '@/domain/entities/BillTemplate';

function toEntity(doc: any): IBillTemplate {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    name: doc.name,
    dueDay: doc.dueDay,
    paymentAppId: doc.paymentAppId.toString(),
    billingAppId: doc.billingAppId ? doc.billingAppId.toString() : null,
    reminderDays: doc.reminderDays,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongooseBillTemplateRepository implements IBillTemplateRepository {
  async findById(id: string): Promise<IBillTemplate | null> {
    await connectDB();
    const doc = await BillTemplateModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<IBillTemplate[]> {
    await connectDB();
    const docs = await BillTemplateModel.find({ userId }).lean();
    return docs.map(toEntity);
  }

  async findAll(): Promise<IBillTemplate[]> {
    await connectDB();
    const docs = await BillTemplateModel.find().lean();
    return docs.map(toEntity);
  }

  async create(data: Omit<IBillTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<IBillTemplate> {
    await connectDB();
    const doc = await BillTemplateModel.create(data);
    return toEntity(doc.toObject());
  }

  async update(id: string, data: Partial<Omit<IBillTemplate, 'id' | 'createdAt'>>): Promise<IBillTemplate | null> {
    await connectDB();
    const doc = await BillTemplateModel.findByIdAndUpdate(id, data, { new: true }).lean();
    return doc ? toEntity(doc) : null;
  }

  async deleteById(id: string): Promise<void> {
    await connectDB();
    await BillTemplateModel.findByIdAndDelete(id);
  }
}
