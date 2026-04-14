'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ReminderDaysPickerProps {
  value: number[];
  onChange: (days: number[]) => void;
}

export function ReminderDaysPicker({ value, onChange }: ReminderDaysPickerProps) {
  const [input, setInput] = useState('');

  function addDay() {
    const n = parseInt(input, 10);
    if (isNaN(n) || n < 1 || n > 365 || value.includes(n)) return;
    onChange([...value, n].sort((a, b) => b - a));
    setInput('');
  }

  function removeDay(day: number) {
    onChange(value.filter((d) => d !== day));
  }

  return (
    <div className="space-y-2">
      <label htmlFor="reminder-days-input" className="text-sm text-muted-foreground">แจ้งเตือนล่วงหน้า (วัน)</label>
      <div className="flex flex-wrap gap-2">
        {value.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => removeDay(day)}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground"
            aria-label={`ลบ ${day} วัน`}
          >
            {day} วัน ✕
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          id="reminder-days-input"
          type="number"
          min={1}
          max={365}
          placeholder="เช่น 7"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-24"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDay())}
        />
        <Button type="button" variant="outline" size="sm" onClick={addDay}>
          + เพิ่ม
        </Button>
      </div>
    </div>
  );
}
