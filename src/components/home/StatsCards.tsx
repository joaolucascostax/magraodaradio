import { FileText, MessageSquare, Handshake, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppStats } from '@/hooks/useAppStats';

function AnimatedNumber({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString('pt-BR')}</span>;
}

export default function StatsCards() {
  const { data: stats } = useAppStats();
  const items = [
    { label: 'Reclamações', value: stats?.totalComplaints ?? 0, icon: FileText, gradient: 'from-accent/10 to-accent/5', iconBg: 'bg-accent/15 text-accent', border: 'border-l-accent' },
    { label: 'Respondidas', value: stats?.respondedComplaints ?? 0, icon: MessageSquare, gradient: 'from-success/10 to-success/5', iconBg: 'bg-success/15 text-success', border: 'border-l-success' },
    { label: 'Compromissos', value: stats?.commitments ?? 0, icon: Handshake, gradient: 'from-highlight/10 to-highlight/5', iconBg: 'bg-highlight/15 text-highlight', border: 'border-l-highlight' },
    { label: 'Cidadãos Ativos', value: stats?.activeCitizens ?? 0, icon: Users, gradient: 'from-secondary/10 to-secondary/5', iconBg: 'bg-secondary/15 text-secondary', border: 'border-l-secondary' },
  ];
  return (
    <section className="py-4 sm:py-6">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <div
            key={item.label}
            className={`rounded-xl border border-l-4 ${item.border} bg-gradient-to-br ${item.gradient} bg-card p-3 sm:p-4 shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`rounded-lg sm:rounded-xl p-2 sm:p-2.5 ${item.iconBg} shadow-sm`}>
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-3xl font-black text-foreground leading-none">
                  <AnimatedNumber target={item.value} />
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 font-medium">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
