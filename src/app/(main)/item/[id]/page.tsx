import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImage } from "@/components/client-ui";
import { catalogueNo } from "@/components/ItemCard";
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
import { Delta, Notice, Section } from "@/components/ui";
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

const VERDICT: Record<Verdict, { label: string; className: string }> = {
  buy: { label: "Buy now", className: "text-down" },
  good: { label: "Good time to buy", className: "text-down" },
  wait: { label: "Wait", className: "text-accent" },
  watch: { label: "Keep watching", className: "text-ink" },
  unknown: { label: "Too early to tell", className: "text-ink" },
};

const SOURCE_LABEL = { server: "Auto check", bookmarklet: "Bookmarklet", manual: "You", share: "Shared link" };
const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"];

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
  let n = 0;
  const idx = () => String(++n).padStart(2, "0");

  return (
    <article>
      <Link href="/wishlist" className="meta inline-flex min-h-11 items-center gap-2 transition-colors duration-200 hover:text-ink">
        <span aria-hidden>←</span> Wishlist
      </Link>

      <div className="mt-4 space-y-3 empty:hidden">
        {sp.exists && <Notice>You were already tracking this. Here it is.</Notice>}
        {sp.added && !item.fetchError && <Notice tone="success">Tracking started. The price gets checked every morning from now on.</Notice>}
        {(sp.captured || sp.partial) && item.currentPrice != null && !item.fetchError && (
          <Notice tone="success">Captured from the product page, price recorded.</Notice>
        )}
        {item.fetchError && wishing && (
          <Notice tone="warn">
            <strong className="font-medium">{item.fetchError}</strong> Big stores often block automatic checks. Open the product page and
            click the{" "}
            <Link href="/setup" className="underline underline-offset-4">
              bookmarklet
            </Link>
            , or log the price below.
          </Notice>
        )}
      </div>

      {/* ---------- hero ---------- */}
      <div className="mt-6 grid gap-8 pb-10 md:grid-cols-2 md:gap-14 lg:gap-20">
        <ProductImage src={item.image} alt={item.title} className="aspect-[4/3] w-full md:aspect-square" />
        <div className="flex min-w-0 flex-col md:py-4">
          <p className="meta flex flex-wrap gap-x-3">
            <span>{catalogueNo(item.id)}</span>
            <span aria-hidden>—</span>
            <span>{storeName(item.store)}</span>
            <span aria-hidden>—</span>
            <span>{categoryOf(item.category).label}</span>
            {item.status !== "wishlist" && (
              <>
                <span aria-hidden>—</span>
                <span className="text-ink">{item.status}</span>
              </>
            )}
          </p>
          <h1 title={item.title} className="display mt-4 line-clamp-4 text-[30px] sm:text-[38px] md:line-clamp-5">
            {item.title}
          </h1>
          {item.brand && <p className="mt-3 text-[15px] text-ink-2">{item.brand}</p>}

          <div className="mt-8 border-t border-rule pt-6">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="display tabular text-[52px] sm:text-[60px]">{inr(item.status === "bought" ? item.boughtPrice : item.currentPrice)}</span>
              {wishing && <Delta from={prev} to={item.currentPrice} className="text-[14px]" />}
            </div>
            <p className="mt-2 text-[14px] text-muted">
              {item.status === "bought" ? (
                "What you paid."
              ) : (
                <>
                  {item.mrp != null && item.currentPrice != null && item.mrp > item.currentPrice && (
                    <>
                      MRP <s className="tabular">{inr(item.mrp)}</s>, {Math.round(((item.mrp - item.currentPrice) / item.mrp) * 100)}% off ·{" "}
                    </>
                  )}
                  {item.lastCheckedAt ? `checked ${relativeTime(item.lastCheckedAt)}` : "not checked yet"}
                  {item.targetPrice != null && <> · target {inr(item.targetPrice)}</>}
                </>
              )}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {wishing && <BuyForm action={actions.markBought.bind(null, id)} item={item} today={todayIST()} />}
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-outline">
              Open on {storeName(item.store)} <span aria-hidden>↗</span>
            </a>
          </div>
          {wishing && (
            <div className="mt-3">
              <RefreshButton action={actions.refreshItemAction.bind(null, id)} />
            </div>
          )}
        </div>
      </div>

      {/* ---------- outlook ---------- */}
      {wishing && (
        <Section index={idx()} title="Outlook" aside={<>Confidence: {outlook.confidence}</>}>
          <p className={`display text-[40px] sm:text-[48px] ${v.className}`}>{v.label}.</p>
          <p className="mt-2 text-[18px] text-ink-2">{outlook.headline}.</p>
          {outlook.projectedLow && (
            <p className="mt-5 border-l-2 border-forecast pl-4 text-[15px]">
              Could reach about <span className="tabular font-medium">{inr(outlook.projectedLow.price)}</span> around{" "}
              {shortDate(outlook.projectedLow.date)}, {outlook.projectedLow.why}.
            </p>
          )}
          <ol className="mt-7 max-w-2xl space-y-2.5">
            {outlook.reasons.map((r, i) => (
              <li key={r} className="grid grid-cols-[2rem_1fr] text-[15px] leading-relaxed text-ink-2">
                <span className="font-mono text-[12px] leading-[1.9] text-muted">{ROMAN[i] ?? i + 1}.</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[13px] text-muted">Estimated from this item&apos;s price history and the usual Indian sale calendar. Not a promise.</p>
        </Section>
      )}

      {/* ---------- history ---------- */}
      <Section index={idx()} title="Price history" aside={points.length ? `${points.length} check${points.length === 1 ? "" : "s"}` : undefined}>
        {points.length >= 2 ? (
          <PriceChart
            history={points.map((p) => ({ t: p.recordedAt, price: p.price }))}
            projection={wishing ? outlook.projection : []}
            target={wishing ? item.targetPrice : null}
          />
        ) : (
          <p className="text-[15px] text-ink-2">
            {points.length === 1
              ? `First price logged ${relativeTime(points[0].recordedAt)}. The graph draws itself after the next check.`
              : "No prices logged yet."}
          </p>
        )}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          {points.length > 0 && (
            <details>
              <summary className="btn-text cursor-pointer">View as table</summary>
              <table className="mt-3 w-full text-[14px]">
                <thead>
                  <tr className="border-b border-rule text-left">
                    <th className="meta py-2 font-normal">Date</th>
                    <th className="meta py-2 font-normal">Price</th>
                    <th className="meta py-2 font-normal">Source</th>
                    <th className="py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {[...points].reverse().map((p) => (
                    <tr key={p.id} className="border-b border-rule">
                      <td className="py-2 text-ink-2">
                        {new Date(p.recordedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
                      </td>
                      <td className="tabular py-2">{inr(p.price)}</td>
                      <td className="py-2 text-muted">{SOURCE_LABEL[p.source]}</td>
                      <td className="py-1 text-right">
                        <DeletePointButton action={actions.deletePriceAction.bind(null, id, p.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
          {wishing && <ManualPriceForm action={actions.addManualPrice.bind(null, id)} />}
        </div>
      </Section>

      {/* ---------- elsewhere ---------- */}
      {wishing && (
        <Section index={idx()} title="Elsewhere" aside="Trusted stores only">
          {compareEnabled() && (
            <div className="mb-8 space-y-4">
              {item.compare && (
                <>
                  {cheaper.length > 0 && (
                    <Notice tone="success">
                      Cheaper at {cheaper[0].storeName}: <span className="tabular font-medium">{inr(cheaper[0].price)}</span>
                      {item.currentPrice != null && <> (you&apos;d save {inr(item.currentPrice - cheaper[0].price)})</>}. Check it&apos;s the same
                      model and seller.
                    </Notice>
                  )}
                  {item.compare.offers.length > 0 ? (
                    <ul className="-mt-3">
                      {item.compare.offers.map((o) => (
                        <li key={o.store + o.link} className="border-b border-rule">
                          <a href={o.link} target="_blank" rel="noopener noreferrer" className="group flex min-h-14 items-center gap-4 py-3">
                            <span className="w-32 shrink-0 text-[15px]">{o.storeName}</span>
                            <span className="min-w-0 flex-1 truncate text-[14px] text-muted">{o.title}</span>
                            <span className={`display tabular text-[20px] ${item.currentPrice != null && o.price < item.currentPrice ? "text-down" : ""}`}>
                              {inr(o.price)}
                            </span>
                            <span aria-hidden className="text-muted transition-colors duration-200 group-hover:text-ink">↗</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[15px] text-ink-2">No trusted store listed “{item.compare.query}”.</p>
                  )}
                  <p className="text-[13px] text-muted">
                    Searched “{item.compare.query}” {item.comparedAt && relativeTime(item.comparedAt)}
                    {item.compare.skipped > 0 && <> · {item.compare.skipped} results from other sellers hidden</>}
                  </p>
                </>
              )}
              <CompareButton action={actions.compareAction.bind(null, id)} label={item.compare ? "Search again" : "Find prices at other stores"} />
            </div>
          )}
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {links.map((l) => (
              <li key={l.id} className="border-b border-rule">
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="group flex min-h-12 items-center justify-between gap-4 text-[15px]">
                  Search {l.name}
                  <span aria-hidden className="text-muted transition-colors duration-200 group-hover:text-ink">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---------- specs ---------- */}
      {(item.features.length > 0 || item.specs.length > 0 || item.description) && (
        <Section index={idx()} title="Specifications" aside={item.specs.length ? `${item.specs.length} listed` : undefined}>
          {item.features.length > 0 && (
            <ul className="mb-8 max-w-3xl space-y-2.5">
              {item.features.map((f) => (
                <li key={f} className="grid grid-cols-[1.25rem_1fr] text-[15px] leading-relaxed text-ink-2">
                  <span aria-hidden className="text-muted">–</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
          {item.specs.length > 0 && (
            <dl className="grid gap-x-10 sm:grid-cols-2">
              {item.specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 border-b border-rule py-2.5 text-[14px]">
                  <dt className="text-muted">{s.label}</dt>
                  <dd className="break-words text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {item.features.length === 0 && item.description && <p className="max-w-3xl text-[15px] leading-relaxed text-ink-2">{item.description}</p>}
        </Section>
      )}

      {/* ---------- manage ---------- */}
      <Section index={idx()} title="Your notes">
        {item.notes && <p className="mb-6 max-w-2xl text-[15px] leading-relaxed whitespace-pre-line text-ink-2">{item.notes}</p>}
        <details className="group">
          <summary className="btn-text cursor-pointer">Edit details and target price</summary>
          <div className="mt-6 max-w-2xl">
            <EditItemForm action={actions.updateItem.bind(null, id)} item={item} />
          </div>
        </details>
        <div className="mt-6">
          <StatusButtons
            status={item.status}
            archive={actions.setItemStatusAction.bind(null, id, "archived")}
            restore={actions.setItemStatusAction.bind(null, id, "wishlist")}
            remove={actions.deleteItemAction.bind(null, id)}
          />
        </div>
      </Section>
    </article>
  );
}
