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
    if (!phone || !code) return fail("invalid_input", "Faltou o número ou o código.");
    const phoneE164 = normalizePhoneE164(phone);
    if (!phoneE164) return fail("invalid_phone", "Esse número de WhatsApp não parece válido. Confira o DDD.");
    if (!/^\d{4}$/.test(String(code))) return fail("invalid_code_format", "O código tem 4 dígitos. Confira a mensagem.");

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
      return fail("server", "Tivemos um problema aqui do nosso lado. Tente de novo em instantes.");
    }
    const otp = otps?.[0];
    if (!otp) return fail("code_not_found", "Não encontramos esse código. Toque em \"Reenviar código\".");
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return fail("code_expired", "Esse código venceu. Toque em \"Reenviar código\".");
    }
    if ((otp.attempts ?? 0) >= 5) {
      return fail("too_many_attempts", "Muitas tentativas. Peça um novo código.");
    }

    const expectedHash = await sha256Hex(`${SALT}:${phoneE164}:${code}`);
    if (expectedHash !== otp.code_hash) {
      const attempts = (otp.attempts ?? 0) + 1;
      await admin.from("phone_otps").update({ attempts }).eq("id", otp.id);
      const left = Math.max(0, 5 - attempts);
      return fail(
        "code_wrong",
        left > 0
          ? `Código incorreto. Confira os 4 dígitos da mensagem (${left} ${left === 1 ? "tentativa" : "tentativas"} restantes).`
          : "Muitas tentativas. Peça um novo código.",
        { attempts_left: left },
      );
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

      if (!cleanName && !cleanCpf && !lgpdOk) {
        // Não consome — deixa o cliente completar o cadastro e chamar de novo
        return json({ needs_signup: true }, 200);
      }
      if (cleanName.length < 2) return fail("name_required", "Escreva seu nome ou apelido (pelo menos 2 letras).", { needs_signup: true, field: "name" });
      if (!validarCpf(cleanCpf)) return fail("cpf_invalid", "Esse CPF não é válido. Confira os números.", { needs_signup: true, field: "cpf" });
      if (!lgpdOk) return fail("lgpd_required", "Para continuar, aceite os termos e a política de privacidade.", { needs_signup: true, field: "lgpd" });

      // CPF já usado por outro número? Avisa ANTES de criar qualquer coisa.
      const { data: cpfOwner } = await admin
        .from("profiles")
        .select("user_id, phone_e164")
        .eq("cpf", cleanCpf)
        .maybeSingle();
      if (cpfOwner && cpfOwner.phone_e164 !== phoneE164) {
        return fail(
          "cpf_taken",
          "Esse CPF já tem cadastro em outro número de WhatsApp. Entre com aquele número ou fale com a gente.",
          { needs_signup: true, field: "cpf" },
        );
      }

      // Cria user e profile
      let userId: string | null = null;
      let createdNow = false;
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
          return fail("server", "Não conseguimos criar seu acesso agora. Tente de novo em instantes.");
        }
        userId = existing.id;
      } else {
        userId = created.user?.id ?? null;
        createdNow = true;
      }
      if (!userId) return fail("server", "Não conseguimos criar seu acesso agora. Tente de novo em instantes.");

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
            return fail("cpf_taken", "Esse CPF já tem cadastro em outro número de WhatsApp. Entre com aquele número ou fale com a gente.", { needs_signup: true, field: "cpf" });
          }
          return fail("server", "Não conseguimos concluir seu cadastro agora. Tente de novo em instantes.");
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
          // Não deixa usuário órfão para trás
          if (createdNow) {
            await admin.auth.admin.deleteUser(userId).catch((e) => console.error("cleanup user", e));
          }
          if ((profErr as { code?: string }).code === "23505") {
            return fail("cpf_taken", "Esse CPF já tem cadastro em outro número de WhatsApp. Entre com aquele número ou fale com a gente.", { needs_signup: true, field: "cpf" });
          }
          return fail("server", "Não conseguimos concluir seu cadastro agora. Tente de novo em instantes.");
        }
      }

      // Consome OTP e emite magic link
      await admin.from("phone_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (linkErr || !link?.properties?.hashed_token) {
        console.error("gen link", linkErr);
        return fail("server", "Cadastro criado, mas não conseguimos abrir sua sessão. Peça um novo código para entrar.");
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
      return fail("server", "Não conseguimos abrir sua sessão agora. Tente de novo em instantes.");
    }

    return json({
      ok: true,
      token_hash: link.properties.hashed_token,
      email,
      display_name: existingProfile.display_name,
    });
  } catch (e) {
    console.error("verify-otp fatal", e);
    return fail("server", "Tivemos um problema aqui do nosso lado. Tente de novo em instantes.");
  }
});

// Erros de negócio vão com status 200 para que o corpo chegue ao app
// (supabase.functions.invoke descarta o corpo em respostas não-2xx).
function fail(code: string, error: string, extra: Record<string, unknown> = {}) {
  return json({ error, code, ...extra }, 200);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
