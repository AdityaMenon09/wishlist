/**
 * Single-user password auth. The session cookie holds an HMAC of a fixed message keyed by
 * APP_PASSWORD, so there's no session table, and changing the password logs out every device.
 * Uses Web Crypto so the same code runs in the proxy and in server actions.
 */
export const SESSION_COOKIE = "wl_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export function authEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

/** In production, a missing password must lock the site rather than leave it open. */
export function authMisconfigured(): boolean {
  return !authEnabled() && process.env.NODE_ENV === "production";
}

async function hmac(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function sessionToken(): Promise<string> {
  return hmac(process.env.APP_PASSWORD ?? "", "wishlist-session-v1");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidSession(cookie: string | undefined): Promise<boolean> {
  if (!authEnabled()) return !authMisconfigured();
  if (!cookie) return false;
  return safeEqual(cookie, await sessionToken());
}

export async function passwordMatches(input: string): Promise<boolean> {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return false;
  // Compare HMACs rather than raw strings so timing doesn't leak the length.
  return safeEqual(await hmac("wl-compare", input), await hmac("wl-compare", pw));
}
