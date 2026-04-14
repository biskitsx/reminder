'use client';
import { IExternalApp } from '@/domain/entities/ExternalApp';
import Image from 'next/image';

interface AppPickerProps {
  apps: IExternalApp[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  required?: boolean;
  label: string;
  clearLabel?: string;
}

export function AppPicker({ apps, selectedId, onChange, required, label, clearLabel = 'ไม่เลือก' }: AppPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {!required && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-pressed={selectedId === null}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              selectedId === null
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted bg-muted text-muted-foreground'
            }`}
          >
            {clearLabel}
          </button>
        )}
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => onChange(app.id)}
            aria-pressed={selectedId === app.id}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
              selectedId === app.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted bg-muted text-muted-foreground'
            }`}
          >
            {app.logoUrl && (
              <Image src={app.logoUrl} alt={app.name} width={16} height={16} className="rounded-full" />
            )}
            {app.name}
          </button>
        ))}
      </div>
    </div>
  );
}
