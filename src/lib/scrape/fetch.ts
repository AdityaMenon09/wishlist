import "server-only";
import { parseProduct } from "./parse";
import type { ProductData } from "../types";

export type FetchResult =
  | { ok: true; finalUrl: string; product: ProductData }
  | { ok: false; finalUrl: string; error: string; blocked: boolean };

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-IN,en-GB;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
};

const BOT_WALL =
  /captcha|type the characters you see|api-services-support@amazon|are you a human|robot check|access denied|something is not right|request blocked|unusual traffic/i;

/**
 * Best-effort server-side fetch. Big Indian retailers often block datacenter IPs
 * (which is what Vercel runs on), so callers must treat `blocked` as a normal outcome
 * and point the user at the bookmarklet, which reads the page from their own browser.
 */
export async function fetchProduct(url: string): Promise<FetchResult> {
  let res: Response;
  try {
    res = await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(12_000) });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return { ok: false, finalUrl: url, blocked: false, error: timedOut ? "The store took too long to respond." : "Couldn't reach the store." };
  }
  const finalUrl = res.url || url;

  if ([403, 429, 503, 529].includes(res.status)) {
    return { ok: false, finalUrl, blocked: true, error: `The store blocked the automatic check (HTTP ${res.status}).` };
  }
  if (!res.ok) return { ok: false, finalUrl, blocked: false, error: `The store returned HTTP ${res.status}.` };

  const html = await res.text();
  const product = parseProduct(html, finalUrl);
  if (!product || product.price == null) {
    const blocked = BOT_WALL.test(html.slice(0, 20_000)) || !product;
    if (product && !blocked) {
      // Page parsed but no price: still useful (title, image, specs), just flag it.
      return { ok: true, finalUrl, product };
    }
    return {
      ok: false,
      finalUrl,
      blocked,
      error: blocked
        ? "The store showed a bot check instead of the product page."
        : "Couldn't find product details on that page.",
    };
  }
  return { ok: true, finalUrl, product };
}
