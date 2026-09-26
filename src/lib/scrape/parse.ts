import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { ProductData, Spec } from "../types";

/**
 * Extract product data from HTML. The same parser handles two inputs:
 *  - a full page fetched by the server, and
 *  - a trimmed snapshot sent by the bookmarklet (head tags, JSON-LD, key Amazon blocks,
 *    tables, and `wl:*-hint` meta tags computed from the rendered page).
 * Sources are tried from most to least structured and merged field by field.
 */
export function parseProduct(html: string, pageUrl: string): ProductData | null {
  const $ = cheerio.load(html);
  const ld = fromJsonLd($);
  const amazon = /amazon\./i.test(pageUrl) ? fromAmazon($) : /flipkart\.com/i.test(pageUrl) ? fromFlipkart($) : {};
  const meta = fromMeta($);
  const hints = fromHints($);

  const pick = <K extends keyof ProductData>(k: K) =>
    (amazon as Partial<ProductData>)[k] ?? ld[k] ?? meta[k] ?? hints[k];

  const title = clean(pick("title") ?? $("h1").first().text() ?? "");
  if (!title) return null;

  let price = pick("price") as number | undefined;
  let mrp = pick("mrp") as number | undefined;
  if (mrp != null && price != null && mrp <= price) mrp = undefined;
  if (price != null && !(price > 0 && price < 1e8)) price = undefined;

  const specs = dedupeSpecs([
    ...((amazon as Partial<ProductData>).specs ?? []),
    ...(ld.specs ?? []),
    ...fromTables($),
  ]).slice(0, 60);

  return {
    title: title.slice(0, 300),
    brand: clean(pick("brand") as string | undefined) || undefined,
    image: absolutize(pick("image") as string | undefined, pageUrl),
    price,
    mrp,
    description: realDescription(clean(pick("description") as string | undefined)),
    specs,
    features: ((amazon as Partial<ProductData>).features ?? []).slice(0, 12),
    breadcrumbs: (amazon as Partial<ProductData>).breadcrumbs ?? ld.breadcrumbs ?? [],
    available: pick("available") as boolean | undefined,
  };
}

// ---------- helpers ----------

function clean(s: string | undefined | null): string {
  return (s ?? "").replace(/[‎‏ ]/g, " ").replace(/\s+/g, " ").trim();
}

/** "₹1,29,999.00" / "Rs. 499" / 1299 → number */
export function parsePrice(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : undefined;
  if (typeof v !== "string") return undefined;
  const m = v.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  if (!m) return undefined;
  const n = parseFloat(m[0]);
  return n > 0 ? n : undefined;
}

function absolutize(src: string | undefined, base: string): string | undefined {
  if (!src) return undefined;
  try {
    return new URL(src, base).toString();
  } catch {
    return undefined;
  }
}

/** Legal/packaging boilerplate stores list as "specs". */
const SPEC_JUNK = /name and address|importer|packer|manufacturer contact|customer care|generic name|net quantity/i;

/** Store SEO blurbs ("Buy X online at best price…", "X : Amazon.in: Electronics") aren't descriptions. */
function realDescription(d: string): string | undefined {
  if (!d || /^buy\b.*\b(online|from)\b/i.test(d) || /:\s*Amazon\.in\s*:|Flipkart\.com/i.test(d)) return undefined;
  return d.slice(0, 1500);
}

function dedupeSpecs(specs: Spec[]): Spec[] {
  const seen = new Set<string>();
  const out: Spec[] = [];
  for (const s of specs) {
    const label = clean(s.label).replace(/\s*:\s*$/, "");
    const value = clean(s.value);
    const key = label.toLowerCase();
    if (!label || !value || label.length > 60 || value.length > 300 || seen.has(key) || SPEC_JUNK.test(label)) continue;
    seen.add(key);
    out.push({ label, value });
  }
  return out;
}

// ---------- JSON-LD (schema.org Product) ----------

type Json = Record<string, unknown>;

function fromJsonLd($: CheerioAPI): Partial<ProductData> {
  const nodes: Json[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text());
      const walk = (n: unknown) => {
        if (Array.isArray(n)) n.forEach(walk);
        else if (n && typeof n === "object") {
          nodes.push(n as Json);
          if ((n as Json)["@graph"]) walk((n as Json)["@graph"]);
        }
      };
      walk(data);
    } catch {
      /* malformed JSON-LD is common; skip it */
    }
  });

  const isType = (n: Json, t: string) => {
    const type = n["@type"];
    return Array.isArray(type) ? type.includes(t) : type === t;
  };
  const product = nodes.find((n) => isType(n, "Product") || isType(n, "ProductGroup"));
  const crumbs = nodes.find((n) => isType(n, "BreadcrumbList"));
  const breadcrumbs = Array.isArray(crumbs?.itemListElement)
    ? (crumbs.itemListElement as Json[])
        .map((li) => String(li.name ?? (li.item as Json)?.name ?? ""))
        .filter(Boolean)
    : undefined;
  if (!product) return { breadcrumbs };

  const offersRaw = product.offers ?? (product.hasVariant as Json[] | undefined)?.[0]?.offers;
  const offers = (Array.isArray(offersRaw) ? offersRaw[0] : offersRaw) as Json | undefined;
  const price = parsePrice(offers?.price ?? offers?.lowPrice ?? (offers?.priceSpecification as Json)?.price);
  const image = Array.isArray(product.image)
    ? String(typeof product.image[0] === "object" ? (product.image[0] as Json).url : product.image[0])
    : typeof product.image === "object" && product.image
      ? String((product.image as Json).url ?? "")
      : (product.image as string | undefined);
  const brand = typeof product.brand === "object" ? (product.brand as Json)?.name : product.brand;
  const specs: Spec[] = Array.isArray(product.additionalProperty)
    ? (product.additionalProperty as Json[]).map((p) => ({ label: String(p.name ?? ""), value: String(p.value ?? "") }))
    : [];
  for (const k of ["model", "color", "material", "size", "gtin13", "mpn"]) {
    if (typeof product[k] === "string") specs.push({ label: k === "gtin13" ? "EAN" : cap(k), value: product[k] as string });
  }
  const availability = String(offers?.availability ?? "");

  return {
    title: product.name ? String(product.name) : undefined,
    brand: brand ? String(brand) : undefined,
    image: image || undefined,
    price,
    description: typeof product.description === "string" ? product.description : undefined,
    specs,
    breadcrumbs,
    available: availability ? /InStock|LimitedAvailability|PreOrder/i.test(availability) : undefined,
  };
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

// ---------- Amazon ----------

function fromAmazon($: CheerioAPI): Partial<ProductData> {
  const text = (sel: string) => clean($(sel).first().text());
  // Amazon splits price and MRP across several of these blocks, so search them all.
  const priceBox = $("#corePriceDisplay_desktop_feature_div, #corePrice_feature_div, #corePrice_desktop, #apex_desktop");

  const price =
    parsePrice(clean(priceBox.find(".priceToPay .a-offscreen").first().text())) ??
    parsePrice(clean(priceBox.find(".a-price:not(.a-text-price) .a-offscreen").first().text())) ??
    parsePrice(clean(priceBox.find(".a-price-whole").first().text())) ??
    parsePrice(text("#priceblock_dealprice")) ??
    parsePrice(text("#priceblock_ourprice"));
  const mrp =
    parsePrice(clean(priceBox.find(".basisPrice .a-offscreen").first().text())) ??
    parsePrice(clean(priceBox.find(".a-price.a-text-price .a-offscreen").first().text()));

  const img = $("#landingImage");
  let image = img.attr("data-old-hires") || undefined;
  if (!image) {
    try {
      const dyn = JSON.parse(img.attr("data-a-dynamic-image") ?? "{}") as Record<string, [number, number]>;
      image = Object.entries(dyn).sort((a, b) => b[1][0] - a[1][0])[0]?.[0];
    } catch {
      /* ignore */
    }
  }
  image ??= img.attr("src");

  const specs: Spec[] = [];
  $("#productOverview_feature_div tr").each((_, tr) => {
    const td = $(tr).find("td");
    if (td.length >= 2) specs.push({ label: $(td[0]).text(), value: $(td[1]).text() });
  });
  $(
    "#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr, #prodDetails table tr",
  ).each((_, tr) => {
    specs.push({ label: $(tr).find("th").first().text(), value: $(tr).find("td").first().text() });
  });
  $("#detailBullets_feature_div li").each((_, li) => {
    const [label, ...rest] = clean($(li).text()).split(/\s*:\s*/);
    if (rest.length) specs.push({ label, value: rest.join(": ") });
  });
  // Amazon noise that isn't a spec
  const junk = /customer reviews|best sellers rank|asin|date first available|manufacturer contact|item model number/i;

  const features = $("#feature-bullets li")
    .map((_, li) => clean($(li).text()))
    .get()
    .filter((f) => f && !/make sure this fits/i.test(f));

  const byline = text("#bylineInfo");
  const brand =
    byline.match(/^Visit the (.+?) Store$/i)?.[1] ?? byline.match(/^Brand:\s*(.+)$/i)?.[1] ?? undefined;
  const availability = text("#availability");

  return {
    title: text("#productTitle") || undefined,
    brand,
    price,
    mrp,
    image,
    specs: specs.filter((s) => !junk.test(s.label)),
    features,
    breadcrumbs: $("#wayfinding-breadcrumbs_feature_div li a")
      .map((_, a) => clean($(a).text()))
      .get(),
    available: availability ? !/unavailable|out of stock/i.test(availability) : undefined,
  };
}

// ---------- Flipkart ----------

/**
 * Flipkart's markup is obfuscated React Native Web divs, but the page embeds its data in
 * window.__INITIAL_STATE__ (script#is_script). The bookmarklet forwards just the relevant
 * fragments as script#wl-state. Regexes rather than JSON.parse: the full state is ~1 MB.
 */
function fromFlipkart($: CheerioAPI): Partial<ProductData> {
  const state = $("#is_script").text() || $("#wl-state").text();
  if (!state) return {};
  const unescape = (s: string) => {
    try {
      return JSON.parse(`"${s}"`) as string;
    } catch {
      return s;
    }
  };
  const ppd = state.match(/"ppd":\{[^}]*\}/)?.[0] ?? "";
  const num = (key: string) => parsePrice(ppd.match(new RegExp(`"${key}":(\\d+(?:\\.\\d+)?)`))?.[1]);
  const specs: Spec[] = [];
  const re = /"label_1":\{"value":\{"text":\["((?:[^"\\]|\\.)*)"\]\}\},"label_0":\{"value":\{"text":"((?:[^"\\]|\\.)*)"\}\}/g;
  for (const m of state.matchAll(re)) specs.push({ label: unescape(m[2]), value: unescape(m[1]) });
  return { price: num("finalPrice") ?? num("fsp"), mrp: num("mrp"), specs };
}

// ---------- Open Graph / microdata ----------

function fromMeta($: CheerioAPI): Partial<ProductData> {
  const m = (name: string) =>
    $(`meta[property="${name}"]`).attr("content") ?? $(`meta[name="${name}"]`).attr("content") ?? undefined;
  const ip = (prop: string) => {
    const el = $(`[itemprop="${prop}"]`).first();
    return el.attr("content") ?? (el.text() || undefined);
  };
  return {
    title: m("og:title") ?? ip("name") ?? (clean($("title").first().text()) || undefined),
    image: m("og:image") ?? m("twitter:image") ?? $('[itemprop="image"]').first().attr("src") ?? undefined,
    price: parsePrice(m("product:price:amount") ?? m("og:price:amount") ?? ip("price")),
    brand: m("product:brand") ?? ip("brand") ?? undefined,
    description: m("og:description") ?? m("description") ?? undefined,
  };
}

// ---------- bookmarklet hints (computed from the rendered page) ----------

function fromHints($: CheerioAPI): Partial<ProductData> {
  const m = (name: string) => $(`meta[name="${name}"]`).attr("content") || undefined;
  return {
    title: m("wl:title-hint"),
    price: parsePrice(m("wl:price-hint")),
    mrp: parsePrice(m("wl:mrp-hint")),
    image: m("wl:image-hint"),
  };
}

// ---------- generic spec tables (Flipkart, Croma, brand sites…) ----------

function fromTables($: CheerioAPI): Spec[] {
  const specs: Spec[] = [];
  $("table").each((_, table) => {
    $(table)
      .find("tr")
      .each((_, tr) => {
        const cells = $(tr).children("th, td");
        if (cells.length === 2) specs.push({ label: $(cells[0]).text(), value: $(cells[1]).text() });
      });
  });
  return specs;
}
