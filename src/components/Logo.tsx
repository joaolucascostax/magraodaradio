import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  asLink?: boolean;
  showTagline?: boolean;
}

export default function Logo({ size = 'md', asLink = true, showTagline = false }: LogoProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl sm:text-5xl',
  };
  const content = (
    <span className="inline-flex flex-col leading-none">
      <span className={`font-display font-extrabold tracking-tight ${sizes[size]} leading-none inline-flex items-baseline`}>
        <span className="text-secondary">Rio Verde</span>
        <span className="relative ml-1.5">
          <span className="text-primary">no Ar</span>
          <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        </span>
      </span>
      {showTagline && (
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          COM MAGRÃO DA RÁDIO
        </span>
      )}
    </span>
  );
  if (!asLink) return content;
  return <Link to="/" className="inline-flex items-center" aria-label="Rio Verde no Ar — início">{content}</Link>;
}
