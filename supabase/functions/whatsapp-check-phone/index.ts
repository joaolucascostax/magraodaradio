import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Endpoint mantido para compatibilidade, mas neutralizado para evitar
// enumeração de números cadastrados. Sempre responde 200 sem revelar
// se o telefone existe. A distinção entre login e cadastro passou a
// acontecer somente após a verificação do OTP (whatsapp-verify-otp).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
