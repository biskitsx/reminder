import { connectDB } from '@/infrastructure/lib/mongodb';
import { ExternalAppModel } from '../models/ExternalAppModel';
import { IExternalAppRepository } from '@/domain/repositories/IExternalAppRepository';
import { IExternalApp } from '@/domain/entities/ExternalApp';

function toEntity(doc: any): IExternalApp {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    logoUrl: doc.logoUrl,
    deepLink: doc.deepLink,
    webUrl: doc.webUrl,
    appType: doc.appType,
    isSystem: doc.isSystem,
    ownerId: doc.ownerId,
    createdAt: doc.createdAt,
  };
}

export class MongooseExternalAppRepository implements IExternalAppRepository {
  async findById(id: string): Promise<IExternalApp | null> {
    await connectDB();
    const doc = await ExternalAppModel.findById(id).lean();
    return doc ? toEntity(doc) : null;
  }

  async findByUserAndType(userId: string, appType?: string): Promise<IExternalApp[]> {
    await connectDB();
    const filter: Record<string, unknown> = {
      $or: [{ isSystem: true }, { ownerId: userId }],
    };
    if (appType) filter.appType = appType;
    const docs = await ExternalAppModel.find(filter).lean();
    return docs.map(toEntity);
  }

  async create(data: Omit<IExternalApp, 'id' | 'createdAt'>): Promise<IExternalApp> {
    await connectDB();
    const doc = await ExternalAppModel.create(data);
    return toEntity(doc.toObject());
  }

  async deleteById(id: string): Promise<void> {
    await connectDB();
    await ExternalAppModel.findByIdAndDelete(id);
  }
}
