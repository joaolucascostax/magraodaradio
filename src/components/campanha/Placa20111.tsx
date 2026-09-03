import { cn } from '@/lib/utils';

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const scales = {
  xs: { wrap: 'px-1.5 py-0.5 text-[10px] rounded-md border', num: 'text-placa-xs' },
  sm: { wrap: 'px-2 py-1 text-xs rounded-lg border-2', num: 'text-placa-sm' },
  md: { wrap: 'px-3 py-1.5 text-lg rounded-xl border-[3px]', num: 'text-placa-md' },
  lg: { wrap: 'px-4 py-2 text-3xl sm:text-4xl rounded-2xl border-4', num: 'text-placa-lg' },
};

/** Selo de campanha 20.111 — estilo placa amarela/azul adaptado à paleta. */
export default function Placa20111({ size = 'md', className, label }: Props) {
  const s = scales[size];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-accent font-display font-extrabold leading-none text-secondary shadow-card',
        'border-secondary',
        s.wrap,
        className,
      )}
      aria-label={label ?? 'Número de campanha 20.111'}
    >
      <span className={s.num}>20.111</span>
    </span>
  );
}
