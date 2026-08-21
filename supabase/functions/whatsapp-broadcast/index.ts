// Dispara mensagens para os grupos do WhatsApp ativos.
// kind: 'post' | 'poll' | 'selo' | 'ping'
// Auth: exige JWT com role admin ou editor.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendWhatsAppGroupText } from "../_shared/evolution.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SITE_URL = "https://rioverdenoar.lovable.app";
const MAX_RETRIES = 3;

const tipoLabel: Record<string, string> = {
  noticia: "📰 Notícia",
  projeto: "🏛️ Projeto",
  denuncia: "🚨 Denúncia",
  discussao: "💬 Discussão",
  enquete: "🗳️ Enquete",
};

const seloLabel: Record<string, string> = {
  resolvido_magrao: "✅ Resolvido pelo Magrão",
  em_andamento: "⏳ Em andamento",
  encaminhado_camara: "📋 Encaminhado à Câmara",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sendWithRetry(jid: string, text: string) {
  let attempt = 0;
  let lastErr: string | null = null;
  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      await sendWhatsAppGroupText(jid, text);
      return { ok: true, tentativas: attempt, erro: null as string | null };
    } catch (e) {
      lastErr = (e as Error)?.message ?? "erro";
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  }
  return { ok: false, tentativas: attempt, erro: lastErr };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const callerId = claimsData.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", callerId);
    const allowed = (roles ?? []).some((r) => r.role === "admin" || r.role === "editor");
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const { kind, id } = body ?? {};
    if (!kind || !id || typeof id !== "string") {
      return json({ error: "kind e id obrigatórios" }, 400);
    }

    // Monta a mensagem
    let text = "";
    if (kind === "post") {
      const { data: post } = await admin.from("posts")
        .select("id,titulo,tipo,bairro,autor_display_name,is_anonimo,status")
        .eq("id", id).maybeSingle();
      if (!post) return json({ error: "post não encontrado" }, 404);
      const autor = post.is_anonimo ? "Anônimo" : (post.autor_display_name || "Cidadão");
      const bairro = post.bairro ? ` · 📍 ${post.bairro}` : "";
      text = `${tipoLabel[post.tipo] ?? "📢"} *${post.titulo}*\n👤 ${autor}${bairro}\n\n👉 ${SITE_URL}/reclamacao/${post.id}`;
    } else if (kind === "poll") {
      const { data: poll } = await admin.from("polls")
        .select("id,question").eq("id", id).maybeSingle();
      if (!poll) return json({ error: "enquete não encontrada" }, 404);
      text = `🗳️ *Nova enquete no Rio Verde no Ar*\n${poll.question}\n\n👉 ${SITE_URL}/enquetes/${poll.id}`;
    } else if (kind === "selo") {
      const { data: post } = await admin.from("posts")
        .select("id,titulo,selo").eq("id", id).maybeSingle();
      if (!post || !post.selo) return json({ error: "selo ausente" }, 400);
      text = `${seloLabel[post.selo] ?? "🔔 Atualização"}\n*${post.titulo}*\n\n👉 ${SITE_URL}/reclamacao/${post.id}`;
    } else if (kind === "ping") {
      text = `🔔 Teste de disparo — Rio Verde no Ar (${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })})`;
    } else {
      return json({ error: "kind inválido" }, 400);
    }

    // Grupos alvo
    let groupsQuery = admin.from("whatsapp_groups").select("jid,nome").eq("ativo", true);
    if (kind === "ping" && body.group_jid) {
      groupsQuery = admin.from("whatsapp_groups").select("jid,nome").eq("jid", body.group_jid);
    }
    const { data: groups } = await groupsQuery;
    if (!groups || groups.length === 0) {
      return json({ ok: true, skipped: "nenhum grupo ativo" });
    }

    const results: Array<{ jid: string; nome: string; ok: boolean; tentativas: number; erro: string | null }> = [];
    for (const g of groups) {
      const r = await sendWithRetry(g.jid, text);
      results.push({ jid: g.jid, nome: g.nome, ...r });
      await admin.from("whatsapp_dispatch_log").insert({
        kind, ref_id: id, group_jid: g.jid,
        status: r.ok ? "enviado" : "falha",
        tentativas: r.tentativas, erro: r.erro,
      });
    }
    return json({ ok: true, total: results.length, results });
  } catch (e) {
    console.error("whatsapp-broadcast", e);
    return json({ error: (e as Error)?.message ?? "Erro interno" }, 500);
  }
});
