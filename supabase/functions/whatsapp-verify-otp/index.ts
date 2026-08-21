import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { normalizePhoneE164, sha256Hex } from "../_shared/evolution.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SALT = SERVICE_ROLE.slice(0, 16);

// Validação de CPF (mesma lógica do banco)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const bodyRaw = await req.json().catch(() => ({}));
    const { phone, code, name, cpf, lgpd } = bodyRaw ?? {};
    if (!phone || !code) return json({ error: "Dados incompletos." }, 400);
    const phoneE164 = normalizePhoneE164(phone);
    if (!phoneE164) return json({ error: "Telefone inválido." }, 400);
    if (!/^\d{4}$/.test(String(code))) return json({ error: "Código deve ter 4 dígitos." }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Pega o OTP mais recente válido
    const { data: otps, error: selErr } = await admin
      .from("phone_otps")
      .select("*")
      .eq("phone_e164", phoneE164)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);
    if (selErr) {
      console.error("select otp", selErr);
      return json({ error: "Erro ao validar." }, 500);
    }
    const otp = otps?.[0];
    if (!otp) return json({ error: "Código não encontrado. Solicite um novo." }, 400);
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return json({ error: "Código expirado. Solicite outro." }, 400);
    }
    if ((otp.attempts ?? 0) >= 5) {
      return json({ error: "Muitas tentativas. Solicite um novo código." }, 429);
    }

    const expectedHash = await sha256Hex(`${SALT}:${phoneE164}:${code}`);
    if (expectedHash !== otp.code_hash) {
      await admin.from("phone_otps").update({ attempts: (otp.attempts ?? 0) + 1 }).eq("id", otp.id);
      return json({ error: "Código incorreto." }, 400);
    }

    // Verifica se já existe profile por telefone
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("user_id, display_name, cpf")
      .eq("phone_e164", phoneE164)
      .maybeSingle();

    const digits = phoneE164.replace(/\D/g, "");
    const email = `wa-${digits}@wa.avaliaai.local`;

    // Se é usuário novo e faltam dados de cadastro, PEDE os dados sem consumir o OTP.
    if (!existingProfile) {
      const cleanName = typeof name === "string" ? name.trim() : "";
      const cleanCpf = typeof cpf === "string" ? cpf.replace(/\D/g, "") : "";
      const lgpdOk = lgpd === true;
      const dataMissing = cleanName.length < 2 || !validarCpf(cleanCpf) || !lgpdOk;

      if (dataMissing) {
        // Não consome — deixa o cliente completar o cadastro e chamar de novo
        return json({ needs_signup: true }, 200);
      }

      // Cria user e profile
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

      // Cria/atualiza profile
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
          console.error("update profile", updErr);
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
          console.error("insert profile", profErr);
          if ((profErr as { code?: string }).code === "23505") {
            return json({ error: "CPF já cadastrado. Se for seu, entre com o número original." }, 409);
          }
          return json({ error: "Falha ao criar cadastro." }, 500);
        }
      }

      // Consome OTP e emite magic link
      await admin.from("phone_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (linkErr || !link?.properties?.hashed_token) {
        console.error("gen link", linkErr);
        return json({ error: "Falha ao iniciar sessão." }, 500);
      }
      return json({ ok: true, token_hash: link.properties.hashed_token, email, display_name: cleanName });
    }

    // Login de usuário existente
    const userId = existingProfile.user_id;
    await admin.from("profiles").update({ phone_verified: true }).eq("user_id", userId);
    await admin.from("phone_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);

    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkErr || !link?.properties?.hashed_token) {
      console.error("gen link", linkErr);
      return json({ error: "Falha ao iniciar sessão." }, 500);
    }

    return json({
      ok: true,
      token_hash: link.properties.hashed_token,
      email,
      display_name: existingProfile.display_name,
    });
  } catch (e) {
    console.error("verify-otp fatal", e);
    return json({ error: "Erro interno." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
