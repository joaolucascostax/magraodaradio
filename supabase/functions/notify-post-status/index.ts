import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendWhatsAppText } from "../_shared/evolution.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // --- Autenticação: exige JWT válido + role admin/editor ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const callerId = claimsData.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const isAdminOrEditor = (roles ?? []).some((r) => r.role === "admin" || r.role === "editor");
    if (!isAdminOrEditor) {
      return json({ error: "Forbidden" }, 403);
    }

    const { post_id } = await req.json().catch(() => ({}));
    if (!post_id || typeof post_id !== "string") return json({ error: "post_id obrigatório" }, 400);

    const { data: post } = await admin.from("posts")
      .select("id, titulo, status, moderation_note, autor_id")
      .eq("id", post_id).maybeSingle();
    if (!post || !post.autor_id) return json({ ok: true, skipped: true });

    const { data: prof } = await admin.from("profiles")
      .select("display_name, phone_e164, phone_verified")
      .eq("user_id", post.autor_id).maybeSingle();
    if (!prof?.phone_e164 || !prof.phone_verified) return json({ ok: true, skipped: "sem telefone" });

    const nome = prof.display_name?.split(" ")[0] ?? "Cidadão";
    let msg = "";
    if (post.status === "aprovado") {
      msg = `*Rio Verde no Ar* — Oi ${nome}! Seu post *"${post.titulo}"* foi publicado. Obrigado por contribuir 👏`;
    } else if (post.status === "rejeitado") {
      msg = `*Rio Verde no Ar* — Oi ${nome}, seu post *"${post.titulo}"* não foi aprovado.\nMotivo: ${post.moderation_note ?? "Não informado"}`;
    } else {
      return json({ ok: true, skipped: "status sem notificação" });
    }

    try {
      await sendWhatsAppText(prof.phone_e164, msg);
    } catch (e) {
      console.error("send wa", e);
      return json({ ok: true, notified: false, fallback: true, reason: (e as Error)?.message ?? "Falha WhatsApp" });
    }

    return json({ ok: true });
  } catch (e) {
    console.error("notify-post-status", e);
    return json({ error: "Erro interno" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
