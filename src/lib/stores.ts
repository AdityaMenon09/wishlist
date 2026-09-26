export type Store = {
  id: string;
  name: string;
  /** Hostname suffixes that belong to this store. */
  hosts: string[];
  /** Search page for a query, used by the Compare panel. */
  search?: (q: string) => string;
  /** Which kinds of product this store is worth checking for. */
  groups: ("electronics" | "fashion" | "general")[];
  /** How the store appears in Google Shopping results (lowercase substrings). */
  aliases: string[];
};

const e = encodeURIComponent;

/** The "trusted" list: large Indian retailers with proper returns and warranty handling. */
export const STORES: Store[] = [
  {
    id: "amazon",
    name: "Amazon",
    hosts: ["amazon.in", "amazon.com", "amzn.in", "amzn.to", "amzn.eu"],
    search: (q) => `https://www.amazon.in/s?k=${e(q)}`,
    groups: ["electronics", "fashion", "general"],
    aliases: ["amazon"],
  },
  {
    id: "flipkart",
    name: "Flipkart",
    hosts: ["flipkart.com", "fkrt.it", "fkrt.co", "fkrt.to"],
    search: (q) => `https://www.flipkart.com/search?q=${e(q)}`,
    groups: ["electronics", "fashion", "general"],
    aliases: ["flipkart"],
  },
  {
    id: "croma",
    name: "Croma",
    hosts: ["croma.com"],
    search: (q) => `https://www.croma.com/searchB?q=${e(q)}%3Arelevance&text=${e(q)}`,
    groups: ["electronics"],
    aliases: ["croma"],
  },
  {
    id: "reliancedigital",
    name: "Reliance Digital",
    hosts: ["reliancedigital.in"],
    search: (q) => `https://www.reliancedigital.in/products?q=${e(q)}`,
    groups: ["electronics"],
    aliases: ["reliance digital", "reliancedigital"],
  },
  {
    id: "vijaysales",
    name: "Vijay Sales",
    hosts: ["vijaysales.com"],
    search: (q) => `https://www.vijaysales.com/search-listing?q=${e(q)}`,
    groups: ["electronics"],
    aliases: ["vijay sales", "vijaysales"],
  },
  {
    id: "tatacliq",
    name: "Tata CLiQ",
    hosts: ["tatacliq.com"],
    search: (q) => `https://www.tatacliq.com/search/?searchCategory=all&text=${e(q)}`,
    groups: ["electronics", "fashion", "general"],
    aliases: ["tata cliq", "tatacliq"],
  },
  {
    id: "myntra",
    name: "Myntra",
    hosts: ["myntra.com", "myntr.it"],
    search: (q) => `https://www.myntra.com/${e(q.toLowerCase().replace(/\s+/g, "-"))}?rawQuery=${e(q)}`,
    groups: ["fashion"],
    aliases: ["myntra"],
  },
  {
    id: "ajio",
    name: "AJIO",
    hosts: ["ajio.com"],
    search: (q) => `https://www.ajio.com/search/?text=${e(q)}`,
    groups: ["fashion"],
    aliases: ["ajio"],
  },
  {
    id: "decathlon",
    name: "Decathlon",
    hosts: ["decathlon.in"],
    search: (q) => `https://www.decathlon.in/search?query=${e(q)}`,
    groups: ["fashion"],
    aliases: ["decathlon"],
  },
  {
    id: "nykaa",
    name: "Nykaa",
    hosts: ["nykaa.com", "nykaafashion.com"],
    search: (q) => `https://www.nykaa.com/search/result/?q=${e(q)}`,
    groups: ["general"],
    aliases: ["nykaa"],
  },
];

export function storeForUrl(url: string): { id: string; name: string } {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return { id: "web", name: "Web" };
  }
  const store = STORES.find((s) => s.hosts.some((h) => host === h || host.endsWith("." + h)));
  if (store) return { id: store.id, name: store.name };
  const bare = host.replace(/^(www|m)\./, "");
  return { id: bare, name: bare };
}

export function storeName(id: string): string {
  return STORES.find((s) => s.id === id)?.name ?? id;
}

export function storeForAlias(source: string): Store | undefined {
  const s = source.toLowerCase();
  return STORES.find((st) => st.aliases.some((a) => s.includes(a)));
}

export function isShortLink(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return ["amzn.in", "amzn.to", "amzn.eu", "fkrt.it", "fkrt.co", "fkrt.to", "dl.flipkart.com", "myntr.it"].some(
      (s) => h === s || h.endsWith("." + s),
    );
  } catch {
    return false;
  }
}

const TRACKING = new Set(
  "ref ref_ tag affid affextparam gclid fbclid srsltid _encoding psc smid th linkcode camp creative ascsubtag lid marketplace srno otracker otracker1 fm iid ppt ppn ssid qh ov_redirect cid".split(
    " ",
  ),
);
const isTracking = (key: string) => key.toLowerCase().startsWith("utm_") || TRACKING.has(key.toLowerCase());

/**
 * One canonical URL per product, so the same product pasted twice (with different
 * tracking junk) maps to one wishlist item.
 */
export function canonicalUrl(raw: string): string {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return raw.trim();
  }
  u.hash = "";
  const host = u.hostname.toLowerCase();

  if (/(^|\.)amazon\.[a-z.]+$/.test(host)) {
    const asin = u.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/asin)\/([A-Z0-9]{10})/i)?.[1];
    if (asin) return `https://${host.replace(/^(m|smile)\./, "www.")}/dp/${asin.toUpperCase()}`;
  }
  if (host.endsWith("flipkart.com")) {
    const pid = u.searchParams.get("pid");
    const path = u.pathname.replace(/\/+$/, "");
    return `https://www.flipkart.com${path}${pid ? `?pid=${pid}` : ""}`;
  }
  for (const key of [...u.searchParams.keys()]) if (isTracking(key)) u.searchParams.delete(key);
  return u.toString();
}

/** Turn a long retail title into a short query that other stores will match. */
export function searchQuery(title: string, brand?: string | null): string {
  let t = title
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .split(/[|,–—]| - /)[0]
    .replace(/\s+/g, " ")
    .trim();
  if (brand && !t.toLowerCase().includes(brand.toLowerCase())) t = `${brand} ${t}`;
  return t.split(" ").slice(0, 9).join(" ");
}
