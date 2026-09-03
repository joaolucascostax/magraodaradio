import { useState } from 'react';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { GOIAS_CITIES } from '@/data/goiasCities';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (cidade: string) => void;
  className?: string;
  size?: 'sm' | 'md';
  label?: string;
  /** Inclui a opção "Goiás inteiro" (valor vazio). */
  allowAll?: boolean;
}

const ordered = GOIAS_CITIES;

export default function CitySelect({ value, onChange, className, size = 'md', label, allowAll }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={label ?? 'Escolher cidade em Goiás'}
          className={cn(
            'justify-between gap-2 rounded-full font-semibold',
            size === 'sm' ? 'h-9 px-3 text-xs' : 'h-11 px-4 text-sm',
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className={size === 'sm' ? 'h-3.5 w-3.5 shrink-0 text-primary' : 'h-4 w-4 shrink-0 text-primary'} />
            <span className="truncate">{value || (allowAll ? 'Goiás inteiro' : 'Escolher cidade')}</span>
            {value && <span className="text-muted-foreground">/ GO</span>}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(20rem,90vw)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cidade de Goiás…" />
          <CommandList className="max-h-72">
            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
            <CommandGroup>
              {allowAll && (
                <CommandItem
                  value="Goiás inteiro"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value ? 'opacity-0' : 'opacity-100')} />
                  Goiás inteiro
                </CommandItem>
              )}
              {ordered.map((c) => (
                <CommandItem
                  key={c}
                  value={c}
                  onSelect={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === c ? 'opacity-100' : 'opacity-0')} />
                  {c}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
