import Link from "next/link";
import type { CSSProperties } from "react";
import { AddItemForm } from "@/components/AddItemForm";
import { ItemPhoto } from "@/components/ItemCard";
import { Odometer } from "@/components/motion";
import { PageTransition } from "@/components/PageTransition";
import { SpendingChart } from "@/components/SpendingChart";
import { Delta, Empty, PageHeader, Section } from "@/components/ui";
import { categoryOf } from "@/lib/categories";
import { dayLabel, inr, monthLabel, shiftMonth, thisMonthIST } from "@/lib/format";
import { findSale } from "@/lib/outlook";
import { listItems, monthlyTotals, recentExpenses } from "@/lib/repo";
import { storeName } from "@/lib/stores";

function today() {
  return new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
}

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const count = (n: number) => WORDS[n] ?? String(n);

export default async function Home() {
  const [items, totals, recent] = await Promise.all([listItems("wishlist"), monthlyTotals(6), recentExpenses(6)]);
  const month = thisMonthIST();
  const spent = totals.find((t) => t.month === month)?.total ?? 0;
  const value = items.reduce((s, i) => s + (i.currentPrice ?? 0), 0);
  const worthIt = items.filter(
    (i) =>
      i.currentPrice != null &&
      ((i.targetPrice != null && i.currentPrice <= i.targetPrice) || (i.pointCount >= 3 && i.currentPrice === i.lowPrice)),
  );
  const movers = items
    .filter((i) => i.prevPrice != null && i.currentPrice != null && i.prevPrice !== i.currentPrice)
    .sort((a, b) => (a.currentPrice! - a.prevPrice!) / a.prevPrice! - (b.currentPrice! - b.prevPrice!) / b.prevPrice!);
  const shown = [...new Set([...worthIt, ...movers, ...items])].slice(0, 5);
  const sale = findSale(new Date(), "electronics");
  const chart = Array.from({ length: 6 }, (_, i) => {
    const mm = shiftMonth(month, i - 5);
    return { month: mm, label: monthLabel(mm, "short"), total: totals.find((t) => t.month === mm)?.total ?? 0 };
  });
  const saleLine = sale?.inProgress
    ? `${sale.name.split(" (")[0]} are on right now.`
    : sale && sale.daysAway <= 30
      ? `${sale.name.split(" (")[0]} usually start in about ${sale.daysAway} days.`
      : null;

  return (
    <PageTransition>
      <PageHeader
        kicker={today()}
        title={
          <>
            <Odometer text={inr(spent)} /> spent in {monthLabel(month, "long").split(" ")[0]}.
          </>
        }
      >
        {items.length === 0 ? (
          "Your wishlist is empty. Paste a link below to start tracking something."
        ) : (
          <>
            Your list is worth <span className="tabular text-ink">{inr(value)}</span> across {items.length} item{items.length === 1 ? "" : "s"}.{" "}
            {worthIt.length > 0
              ? `${count(worthIt.length)} ${worthIt.length === 1 ? "is" : "are"} at a price worth buying.`
              : "Nothing has hit a buying price yet."}{" "}
            {saleLine}
          </>
        )}
      </PageHeader>

      {items.length === 0 ? (
        <>
          <div className="max-w-2xl">
            <AddItemForm />
          </div>
          <Empty title="Start with one thing you want.">
            WishList keeps an eye on its price, checks trusted stores, and tells you when it&apos;s worth buying.
          </Empty>
        </>
      ) : (
        <Section
          index="01"
          title="On your list"
          aside={
            <Link href="/wishlist" transitionTypes={["nav-section"]} className="underline decoration-rule-strong underline-offset-4 hover:text-ink hover:decoration-ink">
              See all {items.length}
            </Link>
          }
        >
          <ul className="-mt-3">
            {shown.map((i, n) => {
              const good = worthIt.includes(i);
              return (
                <li key={i.id} className="boot-rise border-b border-rule" style={{ "--i": n + 4 } as CSSProperties}>
                  <Link
                    href={`/item/${i.id}`}
                    transitionTypes={["nav-forward"]}
                    className="group grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 py-3 sm:grid-cols-[72px_minmax(0,1fr)_auto]"
                  >
                    <ItemPhoto id={i.id} src={i.image} alt="" className="aspect-square w-full" zoom />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] underline-offset-4 group-hover:underline">{i.title}</p>
                      <p className="meta mt-1">
                        {storeName(i.store)}
                        {good && <span className="text-down"> · worth buying</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="display tabular text-[22px]">{inr(i.currentPrice)}</p>
                      <Delta from={i.prevPrice} to={i.currentPrice} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section
        index={items.length === 0 ? "01" : "02"}
        title="Spending"
        aside={
          <Link href="/expenses" transitionTypes={["nav-section"]} className="underline decoration-rule-strong underline-offset-4 hover:text-ink hover:decoration-ink">
            Open ledger
          </Link>
        }
      >
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="meta mb-4">Last six months</p>
            <SpendingChart data={chart} highlight={month} />
          </div>
          <div>
            <p className="meta mb-2">Recent</p>
            {recent.length === 0 ? (
              <p className="text-[15px] text-muted">Nothing logged yet.</p>
            ) : (
              <ul>
                {recent.map((e) => (
                  <li key={e.id} className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[15px]">{e.title}</p>
                      <p className="text-[13px] text-muted">
                        {dayLabel(e.spentOn)} · {categoryOf(e.category).label}
                      </p>
                    </div>
                    <span className="display tabular text-[20px]">{inr(e.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>
    </PageTransition>
  );
}
