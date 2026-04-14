'use client';

interface DueDayPickerProps {
  value: number;
  onChange: (day: number) => void;
}

export function DueDayPicker({ value, onChange }: DueDayPickerProps) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => onChange(day)}
          aria-pressed={value === day}
          className={`h-9 w-full rounded-md text-sm font-medium transition-colors ${
            value === day
              ? 'bg-primary text-primary-foreground'
              : 'border border-input hover:bg-muted'
          }`}
        >
          {day}
        </button>
      ))}
    </div>
  );
}
