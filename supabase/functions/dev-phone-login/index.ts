// TEMPORÁRIO — Login sem verificação de OTP (fase de testes).
// Substitui whatsapp-send-otp + whatsapp-verify-otp. Remover quando
// a verificação por WhatsApp voltar a ser obrigatória.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { normalizePhoneE164 } from "../_shared/evolution.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function validarCpf(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += parseInt(d[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const bodyRaw = await req.json().catch(() => ({}));
    const { phone, name, cpf, lgpd } = bodyRaw ?? {};
    if (!phone) return json({ error: "Telefone obrigatório." }, 400);
    const phoneE164 = normalizePhoneE164(phone);
    if (!phoneE164) return json({ error: "Telefone inválido." }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("user_id, display_name, cpf")
      .eq("phone_e164", phoneE164)
      .maybeSingle();

    const digits = phoneE164.replace(/\D/g, "");
    const email = `wa-${digits}@wa.avaliaai.local`;

    // Novo usuário — exige cadastro completo
    if (!existingProfile) {
      const cleanName = typeof name === "string" ? name.trim() : "";
      const cleanCpf = typeof cpf === "string" ? cpf.replace(/\D/g, "") : "";
      const lgpdOk = lgpd === true;
      const dataMissing = cleanName.length < 2 || !validarCpf(cleanCpf) || !lgpdOk;
      if (dataMissing) return json({ needs_signup: true }, 200);

      let userId: string | null = null;
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        phone: phoneE164,
        user_metadata: { display_name: cleanName, phone_e164: phoneE164 },
      });
      if (createErr) {
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const existing = list?.users?.find((u) => u.email === email);
        if (!existing) {
          console.error("create user", createErr);
          return json({ error: "Não foi possível autenticar." }, 500);
        }
        userId = existing.id;
      } else {
        userId = created.user?.id ?? null;
      }
      if (!userId) return json({ error: "Falha ao identificar usuário." }, 500);

      const { data: profByUser } = await admin
        .from("profiles")
        .select("user_id, cpf")
        .eq("user_id", userId)
        .maybeSingle();

      if (profByUser) {
        const { error: updErr } = await admin
          .from("profiles")
          .update({
            display_name: cleanName.slice(0, 50),
            phone_e164: phoneE164,
            phone_verified: true,
            cpf: profByUser.cpf ?? cleanCpf,
            lgpd_accepted_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        if (updErr) {
          if ((updErr as { code?: string }).code === "23505") {
            return json({ error: "CPF já cadastrado. Se for seu, entre com o número original." }, 409);
          }
          return json({ error: "Falha ao atualizar cadastro." }, 500);
        }
      } else {
        const { error: profErr } = await admin.from("profiles").insert({
          user_id: userId,
          display_name: cleanName.slice(0, 50),
          phone_e164: phoneE164,
          phone_verified: true,
          cpf: cleanCpf,
          lgpd_accepted_at: new Date().toISOString(),
        });
        if (profErr) {
          if ((profErr as { code?: string }).code === "23505") {
            return json({ error: "CPF já cadastrado. Se for seu, entre com o número original." }, 409);
          }
          return json({ error: "Falha ao criar cadastro." }, 500);
        }
      }

      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (linkErr || !link?.properties?.hashed_token) {
        return json({ error: "Falha ao iniciar sessão." }, 500);
      }
      return json({ ok: true, token_hash: link.properties.hashed_token, email, display_name: cleanName });
    }

    // Usuário existente
    const userId = existingProfile.user_id;
    await admin.from("profiles").update({ phone_verified: true }).eq("user_id", userId);
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkErr || !link?.properties?.hashed_token) {
      return json({ error: "Falha ao iniciar sessão." }, 500);
    }
    return json({
      ok: true,
      token_hash: link.properties.hashed_token,
      email,
      display_name: existingProfile.display_name,
    });
  } catch (e) {
    console.error("dev-phone-login fatal", e);
    return json({ error: "Erro interno." }, 500);
  }
});
