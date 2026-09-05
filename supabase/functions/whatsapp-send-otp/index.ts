import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { checkWhatsAppNumber, normalizePhoneE164, sendWhatsAppText, sha256Hex } from "../_shared/evolution.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SALT = SERVICE_ROLE.slice(0, 16);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { phone } = body ?? {};

    if (!phone || typeof phone !== "string") {
      return fail("invalid_input", "Digite seu número de WhatsApp.");
    }
    const phoneE164 = normalizePhoneE164(phone);
    if (!phoneE164) return fail("invalid_phone", "Esse número não parece válido. Confira o DDD e os 9 dígitos.");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    try {
      const check = await checkWhatsAppNumber(phoneE164);
      if (!check.exists) {
        return fail("no_whatsapp", "Não encontramos WhatsApp ativo nesse número. Confira o DDD e tente de novo.");
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("evolution check", errMsg);
      return fail("provider_down", "Não conseguimos falar com o WhatsApp agora. Tente de novo em alguns minutos.");
    }

    // Rate limit: 1 código a cada 60s, 5 por hora (mesmo comportamento)
    const sinceMin = new Date(Date.now() - 60_000).toISOString();
    const sinceHour = new Date(Date.now() - 3_600_000).toISOString();
    const { data: recent } = await admin
      .from("phone_otps")
      .select("created_at")
      .eq("phone_e164", phoneE164)
      .gte("created_at", sinceHour)
      .order("created_at", { ascending: false });
    if (recent && recent.length > 0 && recent[0].created_at > sinceMin) {
      return fail("rate_limited", "Espere 1 minuto para pedir outro código.");
    }
    if (recent && recent.length >= 5) {
      return fail("rate_limited_hour", "Você já pediu vários códigos. Tente novamente em 1 hora.");
    }

    // Gera código de 4 dígitos (1000-9999) + hash
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const codeHash = await sha256Hex(`${SALT}:${phoneE164}:${code}`);
    const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();

    const { error: insErr } = await admin.from("phone_otps").insert({
      phone_e164: phoneE164,
      code_hash: codeHash,
      expires_at: expiresAt,
      attempts: 0,
      pending_name: null,
      pending_cpf: null,
      pending_lgpd: false,
    });
    if (insErr) {
      console.error("insert otp", insErr);
      return fail("server", "Tivemos um problema aqui do nosso lado. Tente de novo em instantes.");
    }

    const msg = `🟡 *Magrão no Ar*\n\nSeu código de acesso é: *${code}*\n⏳ Expira em 15 minutos. Não compartilhe com ninguém.\n\nCom esse cadastro você pode:\n✅ Acompanhar o *Diário do Magrão* em primeira mão\n✅ Criar demandas da sua cidade e cobrar soluções\n✅ Votar em enquetes e ajudar a definir prioridades\n✅ Comentar, apoiar e participar junto com a gente\n\nObrigado por fazer parte dessa correria com o Magrão! 🚀`;
    try {
      const delivery = await sendWhatsAppText(phoneE164, msg);
      console.log("evolution accepted", {
        httpStatus: delivery.httpStatus,
        providerStatus: delivery.providerStatus ?? "unknown",
        messageIdSuffix: delivery.messageId?.slice(-8) ?? "unknown",
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("evolution send", errMsg);
      // Remove OTP não enviado para não bloquear reenvio pelo rate-limit
      await admin.from("phone_otps").delete().eq("phone_e164", phoneE164).eq("code_hash", codeHash);
      const isConnClosed = /Connection Closed/i.test(errMsg);
      return fail(
        isConnClosed ? "provider_down" : "send_failed",
        isConnClosed
          ? "O WhatsApp está fora do ar por instantes. Nossa equipe já foi avisada — tente de novo em alguns minutos."
          : "Não conseguimos enviar a mensagem agora. Tente de novo em instantes.",
        { fallback: true },
      );
    }

    // Resposta neutra: NÃO revela se é login ou cadastro.
    return json({ ok: true, phone: phoneE164 });
  } catch (e) {
    console.error("send-otp fatal", e);
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
