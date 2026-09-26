import "server-only";
import { categoryOf } from "./categories";
import { STORES, searchQuery, storeForAlias } from "./stores";
import type { CompareOffer, CompareResult, Item } from "./types";

export function compareEnabled(): boolean {
  return Boolean(process.env.SERPAPI_KEY);
}

/** Trusted stores worth searching for this kind of product, minus the one it's from. */
export function searchLinks(item: Item): { id: string; name: string; url: string }[] {
  const group = categoryOf(item.category).saleGroup;
  const q = searchQuery(item.title, item.brand);
  return STORES.filter((s) => s.search && s.id !== item.store && s.groups.includes(group))
    .map((s) => ({ id: s.id, name: s.name, url: s.search!(q) }))
    .concat([{ id: "google", name: "Google Shopping", url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}` }]);
}

type ShoppingResult = {
  title?: string;
  source?: string;
  extracted_price?: number;
  link?: string;
  product_link?: string;
};

/**
 * Real prices from other stores via SerpApi's Google Shopping engine (free tier covers
 * roughly a hundred-odd lookups a month, so this only runs when you press the button).
 * Results are filtered to the trusted store list; everything else is counted, not shown.
 */
export async function fetchOffers(item: Item): Promise<CompareResult> {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY is not set.");
  const query = searchQuery(item.title, item.brand);
  const url = new URL("https://serpapi.com/search.json");
  url.search = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    gl: "in",
    hl: "en",
    google_domain: "google.co.in",
    location: "India",
    api_key: key,
  }).toString();

  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Price search failed (HTTP ${res.status}).`);
  const data = (await res.json()) as { shopping_results?: ShoppingResult[]; error?: string };
  if (data.error) throw new Error(data.error);

  const offers: CompareOffer[] = [];
  let skipped = 0;
  for (const r of data.shopping_results ?? []) {
    const store = r.source ? storeForAlias(r.source) : undefined;
    const link = r.link ?? r.product_link;
    if (!store || !r.extracted_price || !link) {
      skipped++;
      continue;
    }
    offers.push({ store: store.id, storeName: store.name, title: r.title ?? query, price: r.extracted_price, link });
  }
  // Keep the cheapest offer per store.
  const best = new Map<string, CompareOffer>();
  for (const o of offers) if (!best.has(o.store) || o.price < best.get(o.store)!.price) best.set(o.store, o);
  return { query, offers: [...best.values()].sort((a, b) => a.price - b.price), skipped };
}
