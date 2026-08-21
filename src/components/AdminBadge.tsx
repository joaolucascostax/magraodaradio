import { Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Selo do Magrão da Rádio — usado onde o admin participa (posts, comentários, enquetes).
 * Distinto do VereadorBadge: fundo amarelo Brasil + ícone rádio + texto marinho bold.
 */
export default function AdminBadge({ className, size = 'sm' }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-accent/70 bg-accent/40 font-bold text-secondary shadow-sm',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
    >
      <Radio className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={2.5} />
      Magrão da Rádio
    </span>
  );
}
