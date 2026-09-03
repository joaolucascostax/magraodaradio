// Helper compartilhado para Evolution API v2 (WhatsApp / Baileys).
// Reescrito para ser mais estrito, com timeouts, retries e diagnóstico claro.

const URL_BASE = (Deno.env.get("EVOLUTION_API_URL") ?? "").trim().replace(/\/+$/, "").replace(/\/manager$/i, "");
const API_KEY = Deno.env.get("EVOLUTION_API_KEY") ?? "";
const INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") ?? "";

const DEFAULT_TIMEOUT_MS = 15_000;

export interface EvolutionSendResult {
  httpStatus: number;
  providerStatus?: string;
  messageId?: string;
  jid?: string;
}

export interface EvolutionInstanceState {
  instance: string;
  state: string; // "open" | "connecting" | "close" | ...
  connected: boolean;
}

// ---------- utilidades ----------

export function normalizePhoneE164(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.length === 12 || digits.length === 13) return `+${digits}`;
  return null;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function assertConfig() {
  if (!URL_BASE || !API_KEY || !INSTANCE) {
    throw new Error("Evolution API não configurada (URL/KEY/INSTANCE).");
  }
}

function headers() {
  return {
    "Content-Type": "application/json",
    apikey: API_KEY,
  };
}

async function evoFetch(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  assertConfig();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${URL_BASE}${path}`, {
      ...init,
      headers: { ...headers(), ...(init.headers ?? {}) },
      signal: ctrl.signal,
    });
    const bodyText = await res.text();
    return { ok: res.ok, status: res.status, bodyText };
  } finally {
    clearTimeout(t);
  }
}

function parseJson<T>(bodyText: string): T | null {
  if (!bodyText) return null;
  try { return JSON.parse(bodyText) as T; } catch { return null; }
}

// ---------- estado da instância ----------

export async function getInstanceState(): Promise<EvolutionInstanceState> {
  const { ok, status, bodyText } = await evoFetch(`/instance/connectionState/${INSTANCE}`, { method: "GET" });
  if (!ok) throw new Error(`connectionState HTTP ${status}: ${bodyText.slice(0, 200)}`);
  const parsed = parseJson<Record<string, any>>(bodyText);
  const state = parsed?.instance?.state ?? parsed?.state ?? parsed?.instance?.connectionStatus ?? parsed?.connectionStatus ?? "unknown";
  return {
    instance: parsed?.instance?.instanceName ?? INSTANCE,
    state,
    connected: state === "open",
  };
}

/** Faz logout da instância (força QR novo na próxima conexão). */
export async function logoutInstance(): Promise<void> {
  await evoFetch(`/instance/logout/${INSTANCE}`, { method: "DELETE" });
}

/** Dispara nova conexão e retorna QR/pairing code, se disponível. */
export async function connectInstance(): Promise<{ base64?: string; code?: string; pairingCode?: string; raw: unknown }> {
  const { ok, status, bodyText } = await evoFetch(`/instance/connect/${INSTANCE}`, { method: "GET" }, 20_000);
  if (!ok) throw new Error(`connect HTTP ${status}: ${bodyText.slice(0, 200)}`);
  const parsed = parseJson<Record<string, unknown>>(bodyText) ?? {};
  return {
    base64: (parsed.base64 as string | undefined) ?? undefined,
    code: (parsed.code as string | undefined) ?? undefined,
    pairingCode: (parsed.pairingCode as string | undefined) ?? undefined,
  };
}

// ---------- checagem de número ----------

interface WaCheckItem { exists?: boolean; jid?: string; number?: string }

export async function checkWhatsAppNumber(phoneE164: string): Promise<{ exists: boolean; jid?: string }> {
  const number = phoneE164.replace(/^\+/, "");
  const { ok, status, bodyText } = await evoFetch(`/chat/whatsappNumbers/${INSTANCE}`, {
    method: "POST",
    body: JSON.stringify({ numbers: [number] }),
  });
  if (!ok) throw new Error(`whatsappNumbers HTTP ${status}: ${bodyText.slice(0, 200)}`);
  const arr = parseJson<WaCheckItem[]>(bodyText) ?? [];
  const found = arr.find((i) => i.exists);
  return { exists: !!found, jid: found?.jid };
}

// ---------- envio de texto ----------

interface SendResponse {
  key?: { id?: string; remoteJid?: string };
  status?: string;
  message?: unknown;
}

/**
 * Envia texto pela Evolution v2. Garante conexão ativa antes,
 * e faz 1 retry silencioso em caso de erro transitório.
 */
export async function sendWhatsAppText(phoneE164: string, text: string): Promise<EvolutionSendResult> {
  // Confirma que a instância está conectada — falha rápido se não estiver.
  const state = await getInstanceState().catch(() => null);
  if (!state || !state.connected) {
    throw new Error(`Instância WhatsApp desconectada (state=${state?.state ?? "unknown"}). Reconecte a instância.`);
  }

  const number = phoneE164.replace(/^\+/, "");
  const payload = {
    number,
    text,
    delay: 800,
    linkPreview: false,
  };

  const attempt = async () => evoFetch(`/message/sendText/${INSTANCE}`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, 20_000);

  let last = await attempt();
  if (!last.ok && [408, 500, 502, 503, 504].includes(last.status)) {
    await new Promise((r) => setTimeout(r, 800));
    last = await attempt();
  }

  if (!last.ok) {
    throw new Error(`sendText HTTP ${last.status}: ${last.bodyText.slice(0, 300)}`);
  }

  const parsed = parseJson<SendResponse>(last.bodyText);
  return {
    httpStatus: last.status,
    providerStatus: parsed?.status,
    messageId: parsed?.key?.id,
    jid: parsed?.key?.remoteJid,
  };
}

/**
 * Envia texto para um grupo do WhatsApp. `jid` deve terminar em @g.us.
 * Faz retry silencioso 1x em erros transitórios.
 */
export async function sendWhatsAppGroupText(jid: string, text: string): Promise<EvolutionSendResult> {
  const state = await getInstanceState().catch(() => null);
  if (!state || !state.connected) {
    throw new Error(`Instância WhatsApp desconectada (state=${state?.state ?? "unknown"}).`);
  }
  const number = jid.trim();
  if (!number.endsWith("@g.us")) {
    throw new Error(`JID inválido para grupo: "${number}" (esperado terminar em @g.us).`);
  }
  const payload = { number, text, delay: 800, linkPreview: true };
  const attempt = async () => evoFetch(`/message/sendText/${INSTANCE}`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, 20_000);

  let last = await attempt();
  if (!last.ok && [408, 500, 502, 503, 504].includes(last.status)) {
    await new Promise((r) => setTimeout(r, 800));
    last = await attempt();
  }
  if (!last.ok) {
    throw new Error(`sendText grupo HTTP ${last.status}: ${last.bodyText.slice(0, 300)}`);
  }
  const parsed = parseJson<SendResponse>(last.bodyText);
  return {
    httpStatus: last.status,
    providerStatus: parsed?.status,
    messageId: parsed?.key?.id,
    jid: parsed?.key?.remoteJid,
  };
}
