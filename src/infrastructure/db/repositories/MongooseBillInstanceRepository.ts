import { connectDB } from '@/infrastructure/lib/mongodb';
import { BillInstanceModel } from '../models/BillInstanceModel';
import { IBillInstanceRepository } from '@/domain/repositories/IBillInstanceRepository';
import { IBillInstance } from '@/domain/entities/BillInstance';

function toEntity(doc: any): IBillInstance {
  return {
    id: doc._id.toString(),
    templateId: doc.templateId.toString(),
    userId: doc.userId,
    name: doc.name,
    dueDay: doc.dueDay,
    month: doc.month,
    year: doc.year,
    isPaid: doc.isPaid,
    paidAt: doc.paidAt ?? null,
    reminderDays: doc.reminderDays,
    paymentAppSnapshot: doc.paymentAppSnapshot,
    billingAppSnapshot: doc.billingAppSnapshot ?? null,
    createdAt: doc.createdAt,
  };
}

export class MongooseBillInstanceRepository implements IBillInstanceRepository {
  async findById(id: string): Promise<IBillInstance | null> {
    await connectDB();
    const doc = await BillInstanceModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findByUserMonthYear(userId: string, month: number, year: number): Promise<IBillInstance[]> {
    await connectDB();
    const docs = await BillInstanceModel.find({ userId, month, year }).lean();
    return docs.map(toEntity);
  }

  async findUnpaidForReminder(month: number, year: number): Promise<IBillInstance[]> {
    await connectDB();
    // Fetch current month + previous month unpaid instances for cross-month reminder support
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const docs = await BillInstanceModel.find({
      isPaid: false,
      $or: [
        { month, year },
        { month: prevMonth, year: prevYear },
      ],
    }).lean();
    return docs.map(toEntity);
  }

  async create(data: Omit<IBillInstance, 'id' | 'createdAt'>): Promise<IBillInstance> {
    await connectDB();
    const doc = await BillInstanceModel.create(data);
    return toEntity(doc.toObject());
  }

  async markPaid(id: string, paidAt: Date): Promise<IBillInstance | null> {
    await connectDB();
    const doc = await BillInstanceModel.findByIdAndUpdate(
      id,
      { isPaid: true, paidAt },
      { new: true }
    ).lean();
    return doc ? toEntity(doc) : null;
  }

  async existsByTemplateMonthYear(templateId: string, month: number, year: number): Promise<boolean> {
    await connectDB();
    const count = await BillInstanceModel.countDocuments({ templateId, month, year });
    return count > 0;
  }
}
