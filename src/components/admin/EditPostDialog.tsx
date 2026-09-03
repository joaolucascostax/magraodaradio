import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];
type Tipo = Database['public']['Enums']['post_tipo'];
type Categoria = Database['public']['Enums']['complaint_category'];

const TIPOS: { value: Tipo; label: string }[] = [
  { value: 'denuncia', label: 'Denúncia' },
  { value: 'noticia', label: 'Notícia' },
  { value: 'projeto', label: 'Projeto' },
  { value: 'enquete', label: 'Enquete' },
  { value: 'discussao', label: 'Discussão' },
];

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'saude', label: 'Saúde' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'infraestrutura', label: 'Infraestrutura' },
  { value: 'educacao', label: 'Educação' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'saneamento', label: 'Saneamento' },
  { value: 'iluminacao', label: 'Iluminação' },
  { value: 'meio_ambiente', label: 'Meio ambiente' },
  { value: 'outros', label: 'Outros' },
];

interface Props {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (post: Post) => void;
}

export default function EditPostDialog({ post, open, onOpenChange, onSaved }: Props) {
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [tipo, setTipo] = useState<Tipo>('denuncia');
  const [categoria, setCategoria] = useState<Categoria | 'none'>('none');
  const [bairro, setBairro] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!post) return;
    setTitulo(post.titulo ?? '');
    setCorpo(post.corpo ?? '');
    setTipo(post.tipo);
    setCategoria((post.categoria as Categoria | null) ?? 'none');
    setBairro(post.bairro ?? '');
    setCoverUrl(post.cover_url ?? '');
    setVideoUrl(post.video_url ?? '');
  }, [post]);

  async function handleSave() {
    if (!post) return;
    if (!titulo.trim()) { toast.error('Título é obrigatório.'); return; }
    setSaving(true);
    const patch = {
      titulo: titulo.trim(),
      corpo: corpo.trim() || null,
      tipo,
      categoria: categoria === 'none' ? null : categoria,
      bairro: bairro.trim() || null,
      cover_url: coverUrl.trim() || null,
      video_url: videoUrl.trim() || null,
    };
    const { data, error } = await supabase
      .from('posts').update(patch).eq('id', post.id).select('*').maybeSingle();
    setSaving(false);
    if (error) { toast.error('Falha ao salvar: ' + error.message); return; }
    toast.success('Publicação atualizada.');
    if (data) onSaved?.(data as Post);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar publicação</DialogTitle>
          <DialogDescription>
            As alterações são salvas imediatamente e ficam visíveis no feed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-titulo">Título</Label>
            <Input id="edit-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={140} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-corpo">Descrição</Label>
            <Textarea id="edit-corpo" value={corpo} onChange={e => setCorpo(e.target.value)} rows={6} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria | 'none')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-bairro">Bairro</Label>
              <Input id="edit-bairro" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-cover">Imagem (URL)</Label>
              <Input id="edit-cover" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-video">Link do vídeo</Label>
              <Input id="edit-video" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/... ou instagram.com/..." />
            </div>
          </div>

          {coverUrl && (
            <img src={coverUrl} alt="" className="rounded-lg max-h-56 w-full object-cover" />
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
