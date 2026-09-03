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
      return json({ error: "Telefone obrigatório." }, 400);
    }
    const phoneE164 = normalizePhoneE164(phone);
    if (!phoneE164) return json({ error: "Telefone inválido." }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    try {
      const check = await checkWhatsAppNumber(phoneE164);
      if (!check.exists) {
        return json({ error: "Esse número não parece ter WhatsApp ativo. Confira o DDD e tente novamente." }, 400);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("evolution check", errMsg);
      return json({ error: "Não conseguimos validar seu WhatsApp agora. Tente novamente em alguns minutos." }, 200);
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
      return json({ error: "Aguarde 1 minuto antes de pedir outro código." }, 429);
    }
    if (recent && recent.length >= 5) {
      return json({ error: "Limite de códigos por hora atingido. Tente mais tarde." }, 429);
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
      return json({ error: "Falha ao gerar código." }, 500);
    }

    const msg = `*Magrão no Ar* — seu código é: *${code}*\n\nNão compartilhe com ninguém. Expira em 5 minutos.`;
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
      return json({
        error: isConnClosed
          ? "WhatsApp temporariamente indisponível. Nossa equipe já foi avisada — tente novamente em alguns minutos."
          : "Não foi possível enviar o WhatsApp agora. Tente novamente.",
        fallback: true,
      }, 200);
    }

    // Resposta neutra: NÃO revela se é login ou cadastro.
    return json({ ok: true, phone: phoneE164 });
  } catch (e) {
    console.error("send-otp fatal", e);
    return json({ error: "Erro interno." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
