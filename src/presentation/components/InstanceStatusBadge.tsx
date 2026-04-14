'use client';
import { IBillInstance } from '@/domain/entities/BillInstance';
import { Badge } from '@/components/ui/badge';

interface InstanceStatusBadgeProps {
  instance: IBillInstance;
  now: Date;
}

export function InstanceStatusBadge({ instance, now }: InstanceStatusBadgeProps) {
  if (instance.isPaid) {
    return <Badge className="bg-green-500 text-white">✓ จ่ายแล้ว</Badge>;
  }
  const dueDate = new Date(instance.year, instance.month - 1, instance.dueDay);
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.round((dueDate.getTime() - todayDate.getTime()) / msPerDay);
  if (daysLeft < 0) {
    return <Badge className="bg-red-500 text-white">เกินกำหนด</Badge>;
  }
  if (daysLeft <= 3) {
    return <Badge className="bg-amber-500 text-white">ใกล้ครบกำหนด</Badge>;
  }
  return <Badge variant="outline" className="text-muted-foreground">รอจ่าย</Badge>;
}
