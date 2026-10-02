import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import { ExpenseRow, NewExpenseForm } from "@/components/ExpenseForms";
import { Odometer, Reveal } from "@/components/motion";
import { PageTransition } from "@/components/PageTransition";
import { SpendingChart } from "@/components/SpendingChart";
import { Figure, PageHeader, Section } from "@/components/ui";
import { categoryOf } from "@/lib/categories";
import { dayLabel, inr, monthLabel, shiftMonth, thisMonthIST, todayIST } from "@/lib/format";
import { listExpenses, monthlyTotals } from "@/lib/repo";
import type { Expense } from "@/lib/types";

export const metadata: Metadata = { title: "Spending" };

// Paging through months slides the ledger the way you moved; the total stays put and rolls.
const MONTH_VT = { "month-next": "vt-month-next", "month-prev": "vt-month-prev", default: "none" };
const ARROW = "group inline-flex min-h-11 items-center hover:text-ink";

export default async function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  const { m } = await searchParams;
  const current = thisMonthIST();
  const month = typeof m === "string" && /^\d{4}-\d{2}$/.test(m) && m <= current ? m : current;
  const [expenses, prevExpenses, totals] = await Promise.all([
    listExpenses(month),
    listExpenses(shiftMonth(month, -1)),
    monthlyTotals(12),
  ]);
  const today = todayIST();

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
  const daysElapsed =
    month === current ? Number(today.slice(8, 10)) : new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).getUTCDate();
  const change = prevTotal ? ((total - prevTotal) / prevTotal) * 100 : null;

  const byCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => ((acc[e.category] = (acc[e.category] ?? 0) + e.amount), acc), {}),
  ).sort((a, b) => b[1] - a[1]);
  const byDay = expenses.reduce<Map<string, Expense[]>>((acc, e) => acc.set(e.spentOn, [...(acc.get(e.spentOn) ?? []), e]), new Map());

  const chart = Array.from({ length: 6 }, (_, i) => {
    const mm = shiftMonth(month, i - 5);
    return { month: mm, label: monthLabel(mm, "short"), total: totals.find((t) => t.month === mm)?.total ?? 0 };
  });
  const prevLabel = monthLabel(shiftMonth(month, -1), "short");

  return (
    <PageTransition>
      <PageHeader
        kicker={
          <span className="flex items-center gap-3">
            <Link
              href={`/expenses?m=${shiftMonth(month, -1)}`}
              transitionTypes={["month-prev"]}
              scroll={false}
              className={ARROW}
              aria-label="Previous month"
            >
              <span className="inline-block transition-transform duration-300 ease-(--ease-out) group-hover:-translate-x-1">←</span>
            </Link>
            <span aria-live="polite" className="min-w-[8.5em] text-center">{monthLabel(month)}</span>
            {month < current ? (
              <Link
                href={`/expenses?m=${shiftMonth(month, 1)}`}
                transitionTypes={["month-next"]}
                scroll={false}
                className={ARROW}
                aria-label="Next month"
              >
                <span className="inline-block transition-transform duration-300 ease-(--ease-out) group-hover:translate-x-1">→</span>
              </Link>
            ) : (
              <span aria-hidden className="opacity-30">→</span>
            )}
          </span>
        }
        title={<Odometer text={inr(total)} />}
      >
        {expenses.length === 0
          ? "Nothing logged this month yet."
          : change == null
            ? `Across ${expenses.length} entr${expenses.length === 1 ? "y" : "ies"}.`
            : `${Math.abs(change).toFixed(0)}% ${change > 0 ? "more" : "less"} than ${prevLabel}, across ${expenses.length} entr${expenses.length === 1 ? "y" : "ies"}.`}
      </PageHeader>

      <ViewTransition key={month} enter={MONTH_VT} exit={MONTH_VT} default="none">
      <div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-8 border-t border-rule py-8 sm:grid-cols-4">
        <Figure label="Per day" value={inr(Math.round(total / Math.max(1, daysElapsed)))} note={`over ${daysElapsed} day${daysElapsed === 1 ? "" : "s"}`} />
        <Figure label={prevLabel} value={inr(prevTotal)} note="the month before" />
        <Figure label="Top category" value={byCategory[0] ? categoryOf(byCategory[0][0]).label : "—"} note={byCategory[0] ? inr(byCategory[0][1]) : undefined} />
        <Figure label="Entries" value={expenses.length} />
      </div>

      <Section index="01" title="Add">
        <NewExpenseForm today={today} />
      </Section>

      <Section index="02" title="Ledger">
        {expenses.length === 0 ? (
          <p className="text-[15px] text-ink-2">Nothing for {monthLabel(month)}. Wishlist items you mark as bought show up here too.</p>
        ) : (
          <div className="space-y-8">
            {[...byDay.entries()].map(([day, list]) => (
              <ViewTransition key={day} enter="row-in" exit="row-out" update="row-move" default="none">
              <section aria-label={dayLabel(day)}>
                <div className="flex items-baseline justify-between border-b border-ink pb-2">
                  <h3 className="meta text-ink">{dayLabel(day)}</h3>
                  <span className="tabular font-mono text-[12px] text-muted">{inr(list.reduce((s, e) => s + e.amount, 0))}</span>
                </div>
                <ul>
                  {list.map((e) => (
                    <ViewTransition key={e.id} enter="row-in" exit="row-out" update="row-move" default="none">
                      <ExpenseRow e={e} today={today} />
                    </ViewTransition>
                  ))}
                </ul>
              </section>
              </ViewTransition>
            ))}
          </div>
        )}
      </Section>

      <Section index="03" title="Breakdown">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="meta mb-4">Last six months</p>
            <SpendingChart data={chart} highlight={month} />
          </div>
          <div>
            <p className="meta mb-4">By category</p>
            {byCategory.length === 0 ? (
              <p className="text-[15px] text-muted">Nothing yet.</p>
            ) : (
              <Reveal>
              <ul className="space-y-4">
                {byCategory.map(([cat, amt], i) => (
                  <li key={cat}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-4 text-[14px]">
                      <span>{categoryOf(cat).label}</span>
                      <span className="tabular font-mono text-[12px] text-muted">
                        {inr(amt)} · {Math.round((amt / total) * 100)}%
                      </span>
                    </div>
                    <div className="h-[3px] bg-rule" aria-hidden>
                      <div
                        className="bar-grow h-full bg-ink"
                        style={{ width: `${Math.max(1.5, (amt / byCategory[0][1]) * 100)}%`, "--i": i } as CSSProperties}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              </Reveal>
            )}
          </div>
        </div>
      </Section>
      </div>
      </ViewTransition>
    </PageTransition>
  );
}
