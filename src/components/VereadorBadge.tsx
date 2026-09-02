import { BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** Selo oficial do Magrão — perfil verificado do mandato. */
export default function VereadorBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border-accent/60 bg-accent/30 text-secondary font-bold',
        className,
      )}
    >
      <BadgeCheck className="h-3 w-3" /> Magrão · Verificado
    </Badge>
  );
}
