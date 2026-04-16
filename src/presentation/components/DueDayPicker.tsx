'use client';

interface DueDayPickerProps {
  value: number;
  onChange: (day: number) => void;
}

export function DueDayPicker({ value, onChange }: DueDayPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">วันที่ครบกำหนด</span>
        <span className="text-2xl font-bold tabular-nums w-10 text-right">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={31}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-2 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span>10</span>
        <span>20</span>
        <span>31</span>
      </div>
    </div>
  );
}
