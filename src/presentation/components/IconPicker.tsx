'use client';
import { useState } from 'react';
import Image from 'next/image';
import { IExternalApp } from '@/domain/entities/ExternalApp';

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string | null) => void;
  apps?: IExternalApp[];
}

type Tab = 'emoji' | 'app';

export function IconPicker({ value, onChange, apps = [] }: IconPickerProps) {
  const [tab, setTab] = useState<Tab>('emoji');

  const isAppLogo = value?.startsWith('http') ?? false;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('emoji')}
          className={`flex-1 rounded-md border py-1.5 text-sm transition-colors ${
            tab === 'emoji' ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-muted'
          }`}
        >
          Emoji
        </button>
        <button
          type="button"
          onClick={() => setTab('app')}
          className={`flex-1 rounded-md border py-1.5 text-sm transition-colors ${
            tab === 'app' ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-muted'
          }`}
        >
          Logo
        </button>
      </div>

      {tab === 'emoji' && (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xl">
            {!isAppLogo && value ? value : '?'}
          </div>
          <input
            type="text"
            value={!isAppLogo ? (value ?? '') : ''}
            onChange={(e) => {
              const val = [...e.target.value].at(-1) ?? null;
              onChange(val);
            }}
            placeholder="วาง emoji ที่นี่"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {value && (
            <button type="button" onClick={() => onChange(null)} className="text-xs text-muted-foreground hover:text-destructive shrink-0">
              ล้าง
            </button>
          )}
        </div>
      )}

      {tab === 'app' && (
        <div className="flex flex-wrap gap-2">
          {apps.filter((a, i, arr) => a.logoUrl && arr.findIndex((x) => x.id === a.id) === i).map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => onChange(app.logoUrl)}
              aria-label={app.name}
              aria-pressed={value === app.logoUrl}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition-colors w-16 ${
                value === app.logoUrl ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted'
              }`}
            >
              <Image src={app.logoUrl} alt={app.name} width={32} height={32} className="rounded-lg" />
              <span className="truncate w-full text-center text-muted-foreground">{app.name}</span>
            </button>
          ))}
          {apps.length === 0 && (
            <p className="text-sm text-muted-foreground">ยังไม่มีแอพ</p>
          )}
        </div>
      )}
    </div>
  );
}
