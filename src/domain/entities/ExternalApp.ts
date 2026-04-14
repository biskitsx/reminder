export interface IExternalApp {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  deepLink: string | null;
  webUrl: string | null;
  appType: string[]; // ['billing'] | ['payment'] | ['billing','payment']
  isSystem: boolean;
  ownerId: string | null;
  createdAt: Date;
}

export interface IExternalAppSnapshot {
  name: string;
  logoUrl: string;
  deepLink: string | null;
  webUrl: string | null;
}
