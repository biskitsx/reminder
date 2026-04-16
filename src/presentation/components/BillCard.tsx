'use client';
import { IBillTemplate } from '@/domain/entities/BillTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface BillCardProps {
  template: IBillTemplate;
  onDelete: (id: string) => void;
}

export function BillCard({ template, onDelete }: BillCardProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-base overflow-hidden">
            {template.icon?.startsWith('http') ? (
              <Image src={template.icon} alt={template.name} width={32} height={32} className="object-cover" />
            ) : (
              template.icon ?? '💳'
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-tight">{template.name}</p>
            <p className="text-xs text-muted-foreground">
              วันที่ {template.dueDay} · แจ้งเตือน {template.reminderDays.join(', ')} วันก่อน
            </p>
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <Link
            href={`/liff/bills/${template.id}/edit`}
            aria-label="แก้ไขบิล"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil size={14} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(template.id)}
            aria-label="ลบบิล"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
