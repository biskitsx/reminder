'use client';

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string | null) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-input bg-muted text-2xl shrink-0">
        {value || '?'}
      </div>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => {
          const val = [...e.target.value].at(-1) ?? null;
          onChange(val);
        }}
        placeholder="วาง emoji ที่นี่"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:text-destructive text-xs shrink-0"
        >
          ล้าง
        </button>
      )}
    </div>
  );
}
