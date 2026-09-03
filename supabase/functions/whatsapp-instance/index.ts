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
      const url = new URL(req.url);
      if (url.searchParams.get("diag") === "1") {
        const base = (Deno.env.get("EVOLUTION_API_URL") ?? "").replace(/\/$/, "");
        let host = "", path = "";
        try { const u = new URL(base); host = u.host; path = u.pathname; } catch { host = "URL_INVALIDA"; }
        const probe = async (p: string) => {
          const r = await fetch(`${base}${p}`, { headers: { apikey: Deno.env.get("EVOLUTION_API_KEY") ?? "" } });
          const t = await r.text();
          return { status: r.status, ct: r.headers.get("content-type"), body: t.slice(0, 200) };
        };
        return json({
          host, path,
          instance: Deno.env.get("EVOLUTION_INSTANCE"),
          root: await probe("/").catch((e) => String(e)),
          fetchInstances: await probe("/instance/fetchInstances").catch((e) => String(e)),
        });
      }
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
