import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { connectInstance, getInstanceState, logoutInstance } from "../_shared/evolution.ts";

// GET  /whatsapp-instance  -> retorna estado (open/connecting/close)
// POST /whatsapp-instance  { action: "connect" | "reconnect" }
//   connect   -> chama /instance/connect e devolve QR/pairing code
//   reconnect -> logout + connect (força QR novo)

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method === "GET") {
      const state = await getInstanceState();
      return json(state);
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const action = (body?.action as string) ?? "connect";

      if (action === "reconnect") {
        try { await logoutInstance(); } catch (e) {
          console.warn("logout falhou (seguindo mesmo assim)", e instanceof Error ? e.message : e);
        }
        // Pequena espera para a instância assentar antes de reconectar
        await new Promise((r) => setTimeout(r, 1500));
      }

      const conn = await connectInstance();
      const state = await getInstanceState().catch(() => null);
      return json({
        ok: true,
        state: state?.state ?? "unknown",
        connected: !!state?.connected,
        qrBase64: conn.base64 ?? null,
        pairingCode: conn.pairingCode ?? conn.code ?? null,
      });
    }

    return json({ error: "Método não suportado." }, 405);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("whatsapp-instance", msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
