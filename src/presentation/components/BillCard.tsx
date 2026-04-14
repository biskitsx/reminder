'use client';
import { IBillTemplate } from '@/domain/entities/BillTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface BillCardProps {
  template: IBillTemplate;
  onDelete: (id: string) => void;
}

export function BillCard({ template, onDelete }: BillCardProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="font-semibold text-base">{template.name}</p>
          <p className="text-sm text-muted-foreground">
            วันที่ {template.dueDay} ของทุกเดือน · แจ้งเตือน {template.reminderDays.join(', ')} วันก่อน
          </p>
        </div>
        <div className="flex gap-1">
          <Link
            href={`/liff/bills/${template.id}/edit`}
            aria-label="แก้ไขบิล"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil size={16} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(template.id)}
            aria-label="ลบบิล"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
