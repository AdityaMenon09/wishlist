import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CircleCheck,
  CircleHelp,
  Clock,
  ExternalLink,
  Hourglass,
  Pencil,
  ShoppingCart,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { ProductImage } from "@/components/client-ui";
import {
  BuyForm,
  CompareButton,
  DeletePointButton,
  EditItemForm,
  ManualPriceForm,
  RefreshButton,
  StatusButtons,
} from "@/components/ItemForms";
import { PriceChart } from "@/components/PriceChart";
import { Delta, Notice } from "@/components/ui";
import * as actions from "@/lib/actions";
import { categoryOf } from "@/lib/categories";
import { compareEnabled, searchLinks } from "@/lib/compare";
import { inr, relativeTime, shortDate, todayIST } from "@/lib/format";
import { computeOutlook, type Verdict } from "@/lib/outlook";
import { getItem, listPrices } from "@/lib/repo";
import { storeName } from "@/lib/stores";

export async function generateMetadata({ params }: PageProps<"/item/[id]">): Promise<Metadata> {
  const item = await getItem(Number((await params).id));
  return { title: item?.title.slice(0, 60) ?? "Item" };
}

const VERDICT: Record<Verdict, { label: string; icon: typeof ThumbsUp; className: string }> = {
  buy: { label: "Buy now", icon: CircleCheck, className: "bg-down-bg text-down" },
  good: { label: "Good time", icon: ThumbsUp, className: "bg-down-bg text-down" },
  wait: { label: "Wait", icon: Hourglass, className: "bg-warn-bg text-warn" },
  watch: { label: "Keep watching", icon: Clock, className: "bg-surface-2 text-link" },
  unknown: { label: "Not enough data", icon: CircleHelp, className: "bg-surface-2 text-muted" },
};

const SOURCE_LABEL = { server: "Auto check", bookmarklet: "Bookmarklet", manual: "Entered by you", share: "Shared link" };

export default async function ItemPage({ params, searchParams }: PageProps<"/item/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [item, points, sp] = await Promise.all([getItem(id), listPrices(id), searchParams]);
  if (!item) notFound();

  const outlook = computeOutlook({
    points,
    currentPrice: item.currentPrice,
    mrp: item.mrp,
    targetPrice: item.targetPrice,
    category: item.category,
  });
  const prev = points.length >= 2 ? points[points.length - 2].price : null;
  const v = VERDICT[outlook.verdict];
  const links = searchLinks(item);
  const cheaper = item.compare?.offers.filter((o) => item.currentPrice != null && o.price < item.currentPrice) ?? [];
  const wishing = item.status === "wishlist";

  return (
    <div className="space-y-6">
      <Link href="/wishlist" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted transition-colors duration-200 hover:text-fg">
        <ArrowLeft aria-hidden className="size-4" /> Wishlist
      </Link>

      {sp.exists && <Notice>You were already tracking this. Here it is.</Notice>}
      {sp.added && !item.fetchError && <Notice tone="success">Tracking started. Prices are checked once a day from now on.</Notice>}
      {(sp.captured || sp.partial) && item.currentPrice != null && !item.fetchError && (
        <Notice tone="success">Captured from the product page. Price recorded.</Notice>
      )}
      {item.fetchError && wishing && (
        <Notice tone="warn">
          <p className="font-semibold">{item.fetchError}</p>
          <p>
            Big stores often block automatic checks from servers. Open the product page and tap the{" "}
            <Link href="/setup" className="font-semibold text-link underline underline-offset-2">
              WishList bookmarklet
            </Link>{" "}
            to capture it from your own browser, or type the price in below.
          </p>
        </Notice>
      )}

      {/* ---------- product header ---------- */}
      <section className="grid gap-5 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-8">
        <ProductImage src={item.image} alt={item.title} className="card aspect-[4/3] w-full md:aspect-square" />
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="eyebrow">{storeName(item.store)}</span>
            <span className="text-xs text-muted" aria-hidden>·</span>
            <span className="text-xs text-muted">{categoryOf(item.category).label}</span>
            {item.status !== "wishlist" && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold capitalize text-muted">{item.status}</span>
            )}
          </div>
          <h1 title={item.title} className="mt-2 line-clamp-4 font-display text-xl leading-snug font-semibold tracking-tight sm:text-2xl md:line-clamp-none">
            {item.title}
          </h1>
          {item.brand && <p className="mt-1 text-sm text-muted">by {item.brand}</p>}

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <span className="tabular font-display text-4xl font-semibold tracking-tight">
              {inr(item.status === "bought" ? item.boughtPrice : item.currentPrice)}
            </span>
            {wishing && <Delta from={prev} to={item.currentPrice} size="md" />}
            {item.mrp != null && item.currentPrice != null && item.mrp > item.currentPrice && (
              <span className="tabular pb-1 text-sm text-muted">
                MRP <s>{inr(item.mrp)}</s> · {Math.round(((item.mrp - item.currentPrice) / item.mrp) * 100)}% off
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">
            {item.status === "bought"
              ? "What you paid."
              : item.lastCheckedAt
                ? `Last checked ${relativeTime(item.lastCheckedAt)}`
                : "Not checked yet"}
            {item.targetPrice != null && wishing && <> · Target {inr(item.targetPrice)}</>}
          </p>

          <div className="mt-6 flex flex-wrap items-start gap-2">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <ShoppingCart aria-hidden className="size-4" /> Open on {storeName(item.store)}
              <ExternalLink aria-hidden className="size-3.5 text-muted" />
            </a>
            {wishing && <RefreshButton action={actions.refreshItemAction.bind(null, id)} />}
          </div>
          {wishing && (
            <div className="mt-3">
              <BuyForm action={actions.markBought.bind(null, id)} item={item} today={todayIST()} />
            </div>
          )}
        </div>
      </section>

      {/* ---------- outlook ---------- */}
      {wishing && (
        <section aria-labelledby="outlook-h" className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="outlook-h" className="eyebrow flex items-center gap-2">
              <Sparkles aria-hidden className="size-4 text-link" /> Price outlook
            </h2>
            <span className="text-xs text-muted">
              Confidence: <span className="font-semibold capitalize text-fg">{outlook.confidence}</span>
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${v.className}`}>
              <v.icon aria-hidden className="size-4" /> {v.label}
            </span>
            <p className="font-display text-lg font-semibold">{outlook.headline}</p>
          </div>
          {outlook.projectedLow && (
            <p className="mt-3 flex items-start gap-2 text-sm">
              <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0 text-forecast" />
              <span>
                Could reach about <strong className="tabular">{inr(outlook.projectedLow.price)}</strong> around{" "}
                {shortDate(outlook.projectedLow.date)} {outlook.projectedLow.why}.
              </span>
            </p>
          )}
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {outlook.reasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-muted/60" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            An estimate from this item&apos;s own price history and the usual Indian sale calendar. Not a guarantee.
          </p>
        </section>
      )}

      {/* ---------- history ---------- */}
      <section aria-labelledby="history-h" className="card p-5 sm:p-6">
        <h2 id="history-h" className="eyebrow mb-4">Price history</h2>
        {points.length >= 2 ? (
          <PriceChart
            history={points.map((p) => ({ t: p.recordedAt, price: p.price }))}
            projection={wishing ? outlook.projection : []}
            target={wishing ? item.targetPrice : null}
          />
        ) : (
          <p className="text-sm text-muted">
            {points.length === 1
              ? `First price recorded ${relativeTime(points[0].recordedAt)}. The graph appears after the next check.`
              : "No prices recorded yet."}
          </p>
        )}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto]">
          {points.length > 0 && (
            <details className="group">
              <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-link">
                Show all {points.length} price check{points.length === 1 ? "" : "s"} as a table
              </summary>
              <div className="mt-2 max-h-80 overflow-auto rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Date</th>
                      <th className="px-3 py-2 font-semibold">Price</th>
                      <th className="px-3 py-2 font-semibold">Source</th>
                      <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...points].reverse().map((p) => (
                      <tr key={p.id} className="border-t border-line">
                        <td className="px-3 py-1.5">{new Date(p.recordedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</td>
                        <td className="tabular px-3 py-1.5 font-semibold">{inr(p.price)}</td>
                        <td className="px-3 py-1.5 text-muted">{SOURCE_LABEL[p.source]}</td>
                        <td className="px-1 py-0.5 text-right">
                          <DeletePointButton action={actions.deletePriceAction.bind(null, id, p.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
          {wishing && <ManualPriceForm action={actions.addManualPrice.bind(null, id)} />}
        </div>
      </section>

      {/* ---------- compare ---------- */}
      {wishing && (
        <section aria-labelledby="compare-h" className="card p-5 sm:p-6">
          <h2 id="compare-h" className="eyebrow mb-1">Other trusted stores</h2>
          {compareEnabled() ? (
            <div className="mt-3 space-y-4">
              {item.compare && (
                <>
                  {cheaper.length > 0 ? (
                    <Notice tone="success">
                      Cheaper at {cheaper[0].storeName}: <strong className="tabular">{inr(cheaper[0].price)}</strong>
                      {item.currentPrice != null && <> (save {inr(item.currentPrice - cheaper[0].price)})</>}. Check it&apos;s the
                      same model and seller before buying.
                    </Notice>
                  ) : item.compare.offers.length > 0 ? (
                    <p className="text-sm text-muted">No trusted store is cheaper right now.</p>
                  ) : null}
                  {item.compare.offers.length > 0 ? (
                    <ul className="divide-y divide-line rounded-xl border border-line">
                      {item.compare.offers.map((o) => (
                        <li key={o.store + o.link}>
                          <a href={o.link} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center gap-3 px-4 py-2 transition-colors duration-200 hover:bg-surface-2">
                            <span className="w-28 shrink-0 text-sm font-semibold">{o.storeName}</span>
                            <span className="min-w-0 flex-1 truncate text-sm text-muted">{o.title}</span>
                            <span className={`tabular font-semibold ${item.currentPrice != null && o.price < item.currentPrice ? "text-down" : ""}`}>{inr(o.price)}</span>
                            <ExternalLink aria-hidden className="size-3.5 shrink-0 text-muted" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No listings from trusted stores matched “{item.compare.query}”.</p>
                  )}
                  <p className="text-xs text-muted">
                    Searched “{item.compare.query}” {item.comparedAt && relativeTime(item.comparedAt)}
                    {item.compare.skipped > 0 && <> · {item.compare.skipped} results from other sellers hidden</>}
                  </p>
                </>
              )}
              <CompareButton action={actions.compareAction.bind(null, id)} label={item.compare ? "Search again" : "Find prices at other stores"} />
            </div>
          ) : (
            <p className="mb-3 text-sm text-muted">Search for the same product elsewhere:</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {links.map((l) => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="btn-ghost min-h-10 text-sm">
                {l.name}
                <ExternalLink aria-hidden className="size-3.5 text-muted" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ---------- details ---------- */}
      {(item.features.length > 0 || item.specs.length > 0 || item.description) && (
        <section aria-labelledby="specs-h" className="card p-5 sm:p-6">
          <h2 id="specs-h" className="eyebrow mb-4">Details &amp; specs</h2>
          {item.features.length > 0 && (
            <ul className="mb-6 space-y-2 text-sm leading-relaxed">
              {item.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-link" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
          {item.specs.length > 0 && (
            <dl className="grid overflow-hidden rounded-xl border border-line text-sm sm:grid-cols-2">
              {item.specs.map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5 border-b border-line px-4 py-2.5 sm:[&:nth-last-child(-n+2)]:border-b-0">
                  <dt className="text-xs text-muted">{s.label}</dt>
                  <dd className="font-semibold break-words">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {item.features.length === 0 && item.description && <p className="text-sm leading-relaxed text-muted">{item.description}</p>}
        </section>
      )}

      {/* ---------- edit / manage ---------- */}
      <section className="card p-5 sm:p-6">
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold">
            <Pencil aria-hidden className="size-4 text-link" /> Edit details &amp; target price
          </summary>
          <div className="mt-4">
            <EditItemForm action={actions.updateItem.bind(null, id)} item={item} />
          </div>
        </details>
        {item.notes && <p className="mt-3 text-sm whitespace-pre-line text-muted">{item.notes}</p>}
        <div className="mt-5 border-t border-line pt-5">
          <StatusButtons
            status={item.status}
            archive={actions.setItemStatusAction.bind(null, id, "archived")}
            restore={actions.setItemStatusAction.bind(null, id, "wishlist")}
            remove={actions.deleteItemAction.bind(null, id)}
          />
        </div>
      </section>
    </div>
  );
}
