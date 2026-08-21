import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { User, FileText, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserSupports } from '@/lib/api';
import { mapComplaint } from '@/lib/api';
import { statusLabels, statusColors } from '@/data/mockData';

export default function Perfil() {
  const { user } = useAuth();
  // Rota protegida por <RequireAuth>; user é garantido aqui.
  if (!user) return null;

  const { data: myComplaints = [] } = useQuery({
    queryKey: ['my-complaints', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('tipo', 'denuncia')
        .eq('autor_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapComplaint);
    },
  });

  const { data: supports = new Set<string>() } = useQuery({
    queryKey: ['my-supports', user.id],
    queryFn: () => fetchUserSupports(user.id),
  });

  return (
    <div className="pb-20 sm:pb-10">
      <div className="relative h-32 sm:h-48 bg-gradient-hero">
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.03]" />
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" className="w-full h-6 sm:h-8" preserveAspectRatio="none">
            <path d="M0 48h1440V24C1200 48 960 0 720 24S240 48 0 24v24z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto -mt-12 sm:-mt-16 relative z-10">
        <div className="rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-6 shadow-card text-center mb-5 sm:mb-6">
          <div className="mx-auto -mt-10 sm:-mt-14 mb-3 sm:mb-4 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-xl sm:rounded-2xl bg-primary text-primary-foreground text-2xl sm:text-3xl font-black shadow-elevated border-4 border-card">
            <User className="h-10 w-10" />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-foreground">Cidadão</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Rio Verde no Ar · Rio Verde</p>
          <p className="mt-2 text-[10px] text-muted-foreground/70 break-all">ID: {user.id.slice(0, 16)}...</p>
        </div>

        <div className="mb-5 sm:mb-6 grid grid-cols-2 gap-2 sm:gap-3">
          {[
            { icon: FileText, value: myComplaints.length, label: 'Minhas Denúncias', color: 'bg-accent/10 text-accent' },
            { icon: Heart, value: supports.size, label: 'Apoios dados', color: 'bg-highlight/10 text-highlight' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl sm:rounded-2xl border bg-card p-3 sm:p-4 text-center shadow-card">
              <div className={`mx-auto mb-1.5 sm:mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl ${item.color}`}>
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <p className="text-lg sm:text-xl font-black text-foreground">{item.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 sm:h-6 w-1 rounded-full bg-gradient-highlight" />
          <h2 className="font-bold text-sm sm:text-base text-foreground">Minhas Denúncias</h2>
        </div>
        <div className="space-y-2.5 sm:space-y-3">
          {myComplaints.map((c) => (
            <Link key={c.id} to={`/reclamacao/${c.id}`} className="flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border bg-card p-3 sm:p-4 shadow-card hover:shadow-card-hover transition-all min-h-[44px]">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs sm:text-base text-foreground">{c.title}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{c.city} · {c.supportCount} apoios</p>
              </div>
              <Badge className={`${statusColors[c.status]} shrink-0 rounded-md sm:rounded-lg font-semibold text-[10px] sm:text-xs`}>{statusLabels[c.status]}</Badge>
            </Link>
          ))}
          {myComplaints.length === 0 && <p className="text-muted-foreground text-xs sm:text-sm py-6 sm:py-8 text-center">Você ainda não registrou denúncias.</p>}
        </div>
      </div>
    </div>
  );
}