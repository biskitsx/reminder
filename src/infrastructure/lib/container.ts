import { MongooseBillInstanceRepository } from '../db/repositories/MongooseBillInstanceRepository';
import { MongooseBillTemplateRepository } from '../db/repositories/MongooseBillTemplateRepository';
import { MongooseExternalAppRepository } from '../db/repositories/MongooseExternalAppRepository';
import { LineMessagingService } from '../line/LineMessagingService';
import { MarkBillPaidUseCase } from '@/application/use-cases/MarkBillPaidUseCase';
import { GenerateMonthlyBillsUseCase } from '@/application/use-cases/GenerateMonthlyBillsUseCase';
import { SendBillRemindersUseCase } from '@/application/use-cases/SendBillRemindersUseCase';
import { GetBillTemplatesUseCase } from '@/application/use-cases/GetBillTemplatesUseCase';
import { CreateBillTemplateUseCase } from '@/application/use-cases/CreateBillTemplateUseCase';
import { UpdateBillTemplateUseCase } from '@/application/use-cases/UpdateBillTemplateUseCase';
import { DeleteBillTemplateUseCase } from '@/application/use-cases/DeleteBillTemplateUseCase';
import { GetBillInstancesUseCase } from '@/application/use-cases/GetBillInstancesUseCase';
import { GetExternalAppsUseCase } from '@/application/use-cases/GetExternalAppsUseCase';
import { CreateExternalAppUseCase } from '@/application/use-cases/CreateExternalAppUseCase';
import { DeleteExternalAppUseCase } from '@/application/use-cases/DeleteExternalAppUseCase';

export function makeMarkBillPaidUseCase() {
  return new MarkBillPaidUseCase(
    new MongooseBillInstanceRepository(),
    new LineMessagingService()
  );
}

export function makeGenerateMonthlyBillsUseCase() {
  return new GenerateMonthlyBillsUseCase(
    new MongooseBillTemplateRepository(),
    new MongooseBillInstanceRepository(),
    new MongooseExternalAppRepository()
  );
}

export function makeSendBillRemindersUseCase() {
  return new SendBillRemindersUseCase(
    new MongooseBillInstanceRepository(),
    new LineMessagingService()
  );
}

export function makeGetBillTemplatesUseCase() {
  return new GetBillTemplatesUseCase(new MongooseBillTemplateRepository());
}

export function makeCreateBillTemplateUseCase() {
  return new CreateBillTemplateUseCase(new MongooseBillTemplateRepository());
}

export function makeUpdateBillTemplateUseCase() {
  return new UpdateBillTemplateUseCase(new MongooseBillTemplateRepository());
}

export function makeDeleteBillTemplateUseCase() {
  return new DeleteBillTemplateUseCase(new MongooseBillTemplateRepository());
}

export function makeGetBillInstancesUseCase() {
  return new GetBillInstancesUseCase(new MongooseBillInstanceRepository());
}

export function makeGetExternalAppsUseCase() {
  return new GetExternalAppsUseCase(new MongooseExternalAppRepository());
}

export function makeCreateExternalAppUseCase() {
  return new CreateExternalAppUseCase(new MongooseExternalAppRepository());
}

export function makeDeleteExternalAppUseCase() {
  return new DeleteExternalAppUseCase(new MongooseExternalAppRepository());
}
