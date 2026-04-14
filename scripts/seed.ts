import mongoose from 'mongoose';
import { ExternalAppModel } from '../src/infrastructure/db/models/ExternalAppModel';
import { BillTemplateModel } from '../src/infrastructure/db/models/BillTemplateModel';
import { BillInstanceModel } from '../src/infrastructure/db/models/BillInstanceModel';

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}
const mongoUri = MONGODB_URI as string;

const externalApps = [
  // Payment only
  { name: 'K PLUS',         slug: 'kplus',    logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/15/72/3c/15723c3e-19e5-0d16-ef96-40ae82e15e7d/AppIcon-1x_U007emarketing-0-7-0-sRGB-85-220-0.png/512x512bb.jpg',  deepLink: 'kplus://',    webUrl: 'https://kplus.kasikornbank.com',   appType: ['payment'], isSystem: true, ownerId: null },
  { name: 'SCB Easy',       slug: 'scbeasy',  logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/90/6d/03/906d031d-f894-c41e-b30a-32053d8d99e1/AppIcon-1x_U007emarketing-0-3-0-85-220-0.png/512x512bb.jpg',  deepLink: 'scbeasy://', webUrl: 'https://scbeasy.com',              appType: ['payment'], isSystem: true, ownerId: null },
  { name: 'BBL Mobile',     slug: 'bbl',      logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/0c/ae/87/0cae872b-eec0-2df5-1222-a1e6a0c74d9e/AppIcon_Rel28-0-0-1x_U007ephone-0-1-0-85-220.png/512x512bb.jpg',  deepLink: 'bbl://',     webUrl: 'https://www.bangkokbank.com',       appType: ['payment'], isSystem: true, ownerId: null },
  { name: 'Krungthai NEXT', slug: 'ktb',      logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/a8/51/30/a851301a-3bb2-833d-c8cc-7533d8f8f84a/AppIcon-0-0-1x_U007emarketing-0-8-0-sRGB-85-220.png/512x512bb.jpg', deepLink: 'ktb://',     webUrl: 'https://www.ktb.co.th',            appType: ['payment'], isSystem: true, ownerId: null },
  // Billing only
  { name: 'AIS',    slug: 'ais',      logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/f6/d5/89/f6d589c3-f161-42a0-8ae5-0499dd92d724/AppIcon-prod-0-0-1x_U007emarketing-0-11-0-85-220.png/512x512bb.jpg',  deepLink: 'ais://',     webUrl: 'https://www.ais.th/myais/',  appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'True',   slug: 'true',     logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/6c/36/67/6c3667ba-59b3-bebb-cd09-497cb1ff64e6/AppIcon-1x_U007emarketing-0-11-0-85-220-0.png/512x512bb.jpg',  deepLink: 'true://',    webUrl: 'https://www.true.th',        appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'DTAC',   slug: 'dtac',     logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/69/55/bb/6955bb33-04d1-7d19-6453-9a465a24722e/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg',  deepLink: 'dtac://',    webUrl: 'https://www.dtac.co.th',     appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'UChoose',slug: 'uchoose',  logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/df/ec/eb/dfecebf2-1259-8e45-34c7-0ead129a8724/AppIconRainbow-0-0-1x_U007emarketing-0-6-0-sRGB-85-220.png/512x512bb.jpg',  deepLink: null,         webUrl: 'https://uchoose.in.th',      appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'กฟน.',   slug: 'mea',      logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/87/d2/9f/87d29f73-79b3-e6fa-4dd0-1c7d18a96e12/AppIcon-prod-0-0-1x_U007emarketing-0-11-0-0-85-220.png/512x512bb.jpg',  deepLink: null,         webUrl: 'https://www.mea.or.th',      appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'กปภ.',   slug: 'pwa',      logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/3b/5c/61/3b5c61ff-10ab-c8d2-84d1-e65bf3f4d358/AppIcon-1x_U007emarketing-0-7-0-0-85-220-0.png/512x512bb.jpg',  deepLink: null,         webUrl: 'https://www.pwa.co.th',      appType: ['billing'], isSystem: true, ownerId: null },
  { name: 'NT',     slug: 'nt',       logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/19/34/bc/1934bc7f-4c6b-2d11-5d77-481535f5d895/AppIcon-0-0-1x_U007emarketing-0-6-0-85-220.png/512x512bb.jpg',  deepLink: null,         webUrl: 'https://www.ntplc.co.th',    appType: ['billing'], isSystem: true, ownerId: null },
  // Both
  { name: 'TrueMoney', slug: 'truemoney', logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/b0/b9/b6/b0b9b6ca-f180-5b40-d195-50ef77e74dd5/AppIcon-0-0-1x_U007emarketing-0-8-0-sRGB-85-220.png/512x512bb.jpg', deepLink: 'tmw://',     webUrl: 'https://www.truemoney.com',  appType: ['billing', 'payment'], isSystem: true, ownerId: null },
  { name: 'Shopee Pay', slug: 'shopee',  logoUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/d5/05/e3/d505e359-0500-03ef-827a-f35cf5c3f24e/AppIcon-0-0-1x_U007emarketing-0-6-0-0-85-220.png/512x512bb.jpg', deepLink: 'shopee://',  webUrl: 'https://shopee.co.th/pay',   appType: ['billing', 'payment'], isSystem: true, ownerId: null },
  { name: 'PromptPay',  slug: 'promptpay', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/PromptPay-logo.png/250px-PromptPay-logo.png', deepLink: null,         webUrl: 'https://www.promptpay.io',   appType: ['billing', 'payment'], isSystem: true, ownerId: null },
];

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  await ExternalAppModel.deleteMany({ isSystem: true });
  await BillInstanceModel.deleteMany({});
  await BillTemplateModel.deleteMany({});

  const inserted = await ExternalAppModel.insertMany(externalApps);
  console.log(`Inserted ${inserted.length} external apps`);

  const kplus = inserted.find((a) => a.slug === 'kplus')!;
  const scbeasy = inserted.find((a) => a.slug === 'scbeasy')!;
  const ais = inserted.find((a) => a.slug === 'ais')!;
  const truemoney = inserted.find((a) => a.slug === 'truemoney')!;
  const shopee = inserted.find((a) => a.slug === 'shopee')!;

  await BillTemplateModel.insertMany([
    { userId: 'Uabc123', name: 'Netflix',    dueDay: 5,  paymentAppId: kplus._id,      billingAppId: null,       reminderDays: [3, 1] },
    { userId: 'Uabc123', name: 'ค่าไฟ',      dueDay: 15, paymentAppId: scbeasy._id,    billingAppId: null,       reminderDays: [3, 1] },
    { userId: 'Uabc123', name: 'AIS',        dueDay: 20, paymentAppId: truemoney._id,  billingAppId: ais._id,    reminderDays: [7, 3, 1] },
    { userId: 'Uxyz456', name: 'Shopee',     dueDay: 10, paymentAppId: shopee._id,     billingAppId: shopee._id, reminderDays: [3] },
    { userId: 'Uxyz456', name: 'TrueMoney',  dueDay: 25, paymentAppId: truemoney._id,  billingAppId: null,       reminderDays: [3, 1] },
  ]);
  console.log('Inserted 5 bill templates');

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((err) => { console.error(err); process.exit(1); });
