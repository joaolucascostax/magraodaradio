import { BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function VereadorBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border-accent/60 bg-accent/30 text-secondary font-bold',
        className,
      )}
    >
      <BadgeCheck className="h-3 w-3" /> Vereador Magrão
    </Badge>
  );
}
