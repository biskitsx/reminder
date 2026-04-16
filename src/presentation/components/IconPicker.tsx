'use client';

const PRESETS = [
  { emoji: '🏠', label: 'ค่าห้อง/บ้าน' },
  { emoji: '⚡', label: 'ค่าไฟ' },
  { emoji: '💧', label: 'ค่าน้ำ' },
  { emoji: '📶', label: 'อินเทอร์เน็ต' },
  { emoji: '📱', label: 'ค่าโทรศัพท์' },
  { emoji: '🎬', label: 'Netflix' },
  { emoji: '🎵', label: 'Spotify' },
  { emoji: '📺', label: 'YouTube Premium' },
  { emoji: '🎮', label: 'Game' },
  { emoji: '💳', label: 'บัตรเครดิต' },
  { emoji: '🏦', label: 'ผ่อนรถ' },
  { emoji: '🏡', label: 'ผ่อนบ้าน' },
  { emoji: '🛡️', label: 'ประกัน' },
  { emoji: '🛒', label: 'Subscription อื่นๆ' },
  { emoji: '🎓', label: 'ค่าเรียน' },
  { emoji: '🏋️', label: 'Gym' },
];

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string | null) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-1">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        className={`h-10 w-full rounded-md text-xs transition-colors flex items-center justify-center border ${
          value === null ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-muted text-muted-foreground'
        }`}
      >
        ไม่มี
      </button>
      {PRESETS.map(({ emoji, label }) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          aria-label={label}
          aria-pressed={value === emoji}
          className={`h-10 w-full rounded-md text-xl transition-colors flex items-center justify-center border ${
            value === emoji ? 'border-primary bg-primary/10' : 'border-input hover:bg-muted'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
