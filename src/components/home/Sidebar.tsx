import { Link } from 'react-router-dom';
import { Trophy, Tag, HelpCircle, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { categoryLabels, categoryColors, type Category } from '@/data/mockData';
import { useQuery } from '@tanstack/react-query';
import { fetchComplaints } from '@/lib/api';

const medalEmoji = ['🥇', '🥈', '🥉'];

export default function HomeSidebar() {
  const { data: complaints = [] } = useQuery({ queryKey: ['complaints'], queryFn: fetchComplaints });

  const topWeekly = [...complaints]
    .sort((a, b) => b.weeklySupportCount - a.weeklySupportCount)
    .slice(0, 3);

  const topSupported = [...complaints]
    .sort((a, b) => b.supportCount - a.supportCount)
    .slice(0, 5);

  const categoryCounts = complaints.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <aside className="space-y-4 sm:space-y-5 min-w-0 overflow-hidden">
      {/* Top weekly */}
      <div className="rounded-xl sm:rounded-2xl border bg-card shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-highlight/10 to-highlight/5 px-4 sm:px-5 py-2.5 sm:py-3 border-b">
          <h3 className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
            <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-highlight shrink-0" />
            Destaques da Semana
          </h3>
        </div>
        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
          {topWeekly.map((c, i) => (
            <Link key={c.id} to={`/reclamacao/${c.id}`} className="flex gap-2.5 sm:gap-3 group items-start min-w-0">
              <span className="text-base sm:text-lg shrink-0">{medalEmoji[i]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary truncate transition-colors">{c.title}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{c.weeklySupportCount} apoios</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top supported complaints */}
      <div className="rounded-xl sm:rounded-2xl border bg-card shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 px-4 sm:px-5 py-2.5 sm:py-3 border-b">
          <h3 className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary shrink-0" />
            Mais Apoiadas
          </h3>
        </div>
        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
          {topSupported.map((c, i) => {
            const max = topSupported[0]?.supportCount || 1;
            return (
              <Link key={c.id} to={`/reclamacao/${c.id}`} className="flex items-center gap-2.5 sm:gap-3 min-w-0 group">
                <span className="w-4 sm:w-5 text-xs sm:text-sm font-bold text-muted-foreground shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary truncate transition-colors">{c.title}</p>
                  <div className="mt-1 h-1 sm:h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-secondary/60 transition-all" style={{ width: `${(c.supportCount / max) * 100}%` }} />
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium shrink-0">{c.supportCount}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <div className="rounded-xl sm:rounded-2xl border bg-card shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-accent/10 to-accent/5 px-4 sm:px-5 py-2.5 sm:py-3 border-b">
          <h3 className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
            <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
            Categorias Populares
          </h3>
        </div>
        <div className="p-3 sm:p-4 flex flex-wrap gap-1.5 sm:gap-2">
          {(Object.entries(categoryCounts) as [string, number][]).map(([cat, count]) => (
            <Badge key={cat} variant="outline" className={`${categoryColors[cat as Category]} text-[10px] sm:text-xs cursor-pointer rounded-md sm:rounded-lg hover:shadow-sm transition-shadow`}>
              {categoryLabels[cat as Category]} ({count})
            </Badge>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <Link
        to="/como-funciona"
        className="flex items-center gap-3 rounded-xl sm:rounded-2xl border bg-card p-3 sm:p-4 shadow-card text-xs sm:text-sm font-semibold text-foreground hover:shadow-card-hover transition-all group min-h-[44px] min-w-0 overflow-hidden"
      >
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate">Como funciona?</span>
          <span className="block text-[10px] sm:text-xs text-muted-foreground font-normal truncate">Entenda a plataforma</span>
        </div>
      </Link>
    </aside>
  );
}
