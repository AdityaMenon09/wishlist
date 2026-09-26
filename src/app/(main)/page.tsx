import Link from "next/link";
import { ArrowRight, Heart, TrendingDown } from "lucide-react";
import { AddItemForm } from "@/components/AddItemForm";
import { ProductImage } from "@/components/client-ui";
import { SpendingChart } from "@/components/SpendingChart";
import { Delta, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { categoryOf } from "@/lib/categories";
import { dayLabel, inr, monthLabel, shiftMonth, thisMonthIST } from "@/lib/format";
import { findSale } from "@/lib/outlook";
import { listItems, monthlyTotals, recentExpenses } from "@/lib/repo";
import { storeName } from "@/lib/stores";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function Dashboard() {
  const [items, totals, recent] = await Promise.all([listItems("wishlist"), monthlyTotals(6), recentExpenses(6)]);
  const month = thisMonthIST();
  const spent = totals.find((t) => t.month === month)?.total ?? 0;
  const lastMonth = totals.find((t) => t.month === shiftMonth(month, -1))?.total ?? 0;
  const value = items.reduce((s, i) => s + (i.currentPrice ?? 0), 0);
  const drops = items.filter((i) => i.prevPrice != null && i.currentPrice != null && i.currentPrice < i.prevPrice);
  const hits = items.filter(
    (i) =>
      i.currentPrice != null &&
      ((i.targetPrice != null && i.currentPrice <= i.targetPrice) || (i.pointCount >= 3 && i.currentPrice === i.lowPrice)),
  );
  const movers = items
    .filter((i) => i.prevPrice != null && i.currentPrice != null && i.prevPrice !== i.currentPrice)
    .sort((a, b) => (a.currentPrice! - a.prevPrice!) / a.prevPrice! - (b.currentPrice! - b.prevPrice!) / b.prevPrice!)
    .slice(0, 5);
  const sale = findSale(new Date(), "electronics");
  const chart = Array.from({ length: 6 }, (_, i) => {
    const mm = shiftMonth(month, i - 5);
    return { month: mm, label: monthLabel(mm, "short"), total: totals.find((t) => t.month === mm)?.total ?? 0 };
  });

  return (
    <>
      <PageHeader
        title={greeting()}
        subtitle={
          sale?.inProgress
            ? `${sale.name} are on. A good week to check your list.`
            : sale && sale.daysAway <= 30
              ? `${sale.name} usually start in about ${sale.daysAway} days.`
              : "Here's where your wishlist and spending stand."
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Spent this month"
          value={inr(spent)}
          hint={lastMonth ? `${inr(lastMonth)} last month` : monthLabel(month)}
        />
        <StatCard label="Wishlist value" value={inr(value)} hint={`${items.length} item${items.length === 1 ? "" : "s"}`} />
        <StatCard label="Price drops" value={drops.length} tone={drops.length ? "down" : "default"} hint="since the last check" />
        <StatCard label="Good to buy" value={hits.length} tone={hits.length ? "down" : "default"} hint="at target or all-time low" />
      </div>

      {items.length === 0 ? (
        <div className="mt-6 space-y-6">
          <AddItemForm />
          <EmptyState icon={<Heart aria-hidden className="size-6" />} title="Start your wishlist">
            Add a product link and WishList keeps an eye on its price, compares trusted stores, and tells you when it&apos;s worth
            buying.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-labelledby="watch-h" className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="watch-h" className="eyebrow">{movers.length ? "Price moves" : "On your list"}</h2>
              <Link href="/wishlist" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link">
                All items <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <ul className="divide-y divide-line">
              {(movers.length ? movers : items.slice(0, 5)).map((i) => (
                <li key={i.id}>
                  <Link href={`/item/${i.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-surface-2">
                    <ProductImage src={i.image} alt="" className="size-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{i.title}</p>
                      <p className="text-xs text-muted">{storeName(i.store)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="tabular text-sm font-semibold">{inr(i.currentPrice)}</span>
                      <Delta from={i.prevPrice} to={i.currentPrice} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {hits.length > 0 && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-down-bg px-3 py-2.5 text-sm font-semibold text-down">
                <TrendingDown aria-hidden className="size-4" />
                {hits.length === 1 ? `${hits[0].title.slice(0, 50)} is` : `${hits.length} items are`} at a price worth buying.
              </p>
            )}
          </section>

          <div className="space-y-6">
            <section aria-labelledby="spend-h" className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="spend-h" className="eyebrow">Spending</h2>
                <Link href="/expenses" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link">
                  Expenses <ArrowRight aria-hidden className="size-4" />
                </Link>
              </div>
              <SpendingChart data={chart} highlight={month} />
            </section>
            {recent.length > 0 && (
              <section aria-labelledby="recent-h" className="card p-5">
                <h2 id="recent-h" className="eyebrow mb-2">Recent</h2>
                <ul className="divide-y divide-line">
                  {recent.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{e.title}</p>
                        <p className="text-xs text-muted">
                          {dayLabel(e.spentOn)} · {categoryOf(e.category).label}
                        </p>
                      </div>
                      <span className="tabular text-sm font-semibold">{inr(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </>
  );
}
