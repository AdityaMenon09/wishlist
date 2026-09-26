import "server-only";
import { guessCategory } from "./categories";
import { addPrice, createItem, findItemByUrl, markFetchError, mergeProduct } from "./repo";
import { fetchProduct } from "./scrape/fetch";
import { canonicalUrl, isShortLink, storeForUrl } from "./stores";
import type { Item, PriceSource, ProductData } from "./types";

export type TrackOutcome = { item: Item; created: boolean; priceRecorded: boolean; warning: string | null };

/** Save parsed product data: create the item or merge into the existing one. */
export async function upsertProduct(url: string, product: ProductData, source: PriceSource): Promise<TrackOutcome> {
  const canonical = canonicalUrl(url);
  let item = await findItemByUrl(canonical);
  let created = false;
  if (item) {
    await mergeProduct(item, product);
  } else {
    item = await createItem({
      url: canonical,
      store: storeForUrl(canonical).id,
      category: guessCategory(product.title, product.breadcrumbs),
      product,
    });
    created = true;
  }
  const priceRecorded = product.price != null ? await addPrice(item.id, product.price, source) : false;
  return {
    item,
    created,
    priceRecorded,
    warning: product.price == null ? "Found the product but not its price. Add it by hand below." : null,
  };
}

/**
 * Add from a pasted/shared link. Tries the server fetch; if the store blocks it, the item
 * is still created (with whatever is known) so the user can finish it via the bookmarklet
 * or by typing the price in.
 */
export async function trackUrl(rawUrl: string, fallbackTitle?: string): Promise<TrackOutcome> {
  let url = canonicalUrl(rawUrl);
  const existing = await findItemByUrl(url);
  const result = await fetchProduct(existing?.url ?? rawUrl);
  // Short links (amzn.in/…, fkrt.it/…) only reveal the real product URL after redirecting.
  if (isShortLink(rawUrl) || result.finalUrl !== rawUrl) url = canonicalUrl(result.finalUrl);

  if (result.ok) return upsertProduct(url, result.product, "server");

  const already = existing ?? (await findItemByUrl(url));
  if (already) {
    await markFetchError(already.id, result.error);
    return { item: already, created: false, priceRecorded: false, warning: result.error };
  }
  const item = await createItem({
    url,
    store: storeForUrl(url).id,
    category: guessCategory(fallbackTitle ?? url),
    product: { title: fallbackTitle?.trim() || titleFromUrl(url), specs: [], features: [], breadcrumbs: [] },
    fetchError: result.error,
  });
  return { item, created: true, priceRecorded: false, warning: result.error };
}

/** "…/logitech-g304-lightspeed-wireless/p/itm…" → "Logitech G304 Lightspeed Wireless" */
function titleFromUrl(url: string): string {
  try {
    const segs = new URL(url).pathname.split("/").filter((s) => s.length > 3 && /[a-z]/i.test(s) && s.includes("-"));
    const slug = segs.sort((a, b) => b.length - a.length)[0];
    if (slug) return slug.split("-").slice(0, 10).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  } catch {
    /* fall through */
  }
  return "Untitled product";
}

/** Re-check one item's price from the server. Used by the refresh button and the cron job. */
export async function refreshItem(item: Item): Promise<{ ok: boolean; message: string }> {
  const result = await fetchProduct(item.url);
  if (!result.ok) {
    await markFetchError(item.id, result.error);
    return { ok: false, message: result.error };
  }
  await mergeProduct(item, result.product);
  if (result.product.price == null) return { ok: true, message: "Page loaded but no price was found." };
  const recorded = await addPrice(item.id, result.product.price, "server");
  return { ok: true, message: recorded ? "Price updated." : "No change since the last check." };
}
