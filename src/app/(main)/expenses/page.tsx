import type { Metadata } from "next";
import Link from "next/link";
import { ExpenseRow, NewExpenseForm } from "@/components/ExpenseForms";
import { SpendingChart } from "@/components/SpendingChart";
import { Figure, PageHeader, Section } from "@/components/ui";
import { categoryOf } from "@/lib/categories";
import { dayLabel, inr, monthLabel, shiftMonth, thisMonthIST, todayIST } from "@/lib/format";
import { listExpenses, monthlyTotals } from "@/lib/repo";
import type { Expense } from "@/lib/types";

export const metadata: Metadata = { title: "Spending" };

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
    <>
      <PageHeader
        kicker={
          <span className="flex items-center gap-3">
            <Link href={`/expenses?m=${shiftMonth(month, -1)}`} className="inline-flex min-h-11 items-center hover:text-ink" aria-label="Previous month">
              ←
            </Link>
            <span aria-live="polite">{monthLabel(month)}</span>
            {month < current ? (
              <Link href={`/expenses?m=${shiftMonth(month, 1)}`} className="inline-flex min-h-11 items-center hover:text-ink" aria-label="Next month">
                →
              </Link>
            ) : (
              <span aria-hidden className="opacity-30">→</span>
            )}
          </span>
        }
        title={<span className="tabular">{inr(total)}</span>}
      >
        {expenses.length === 0
          ? "Nothing logged this month yet."
          : change == null
            ? `Across ${expenses.length} entr${expenses.length === 1 ? "y" : "ies"}.`
            : `${Math.abs(change).toFixed(0)}% ${change > 0 ? "more" : "less"} than ${prevLabel}, across ${expenses.length} entr${expenses.length === 1 ? "y" : "ies"}.`}
      </PageHeader>

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
              <section key={day} aria-label={dayLabel(day)}>
                <div className="flex items-baseline justify-between border-b border-ink pb-2">
                  <h3 className="meta text-ink">{dayLabel(day)}</h3>
                  <span className="tabular font-mono text-[12px] text-muted">{inr(list.reduce((s, e) => s + e.amount, 0))}</span>
                </div>
                <ul>
                  {list.map((e) => (
                    <ExpenseRow key={e.id} e={e} today={today} />
                  ))}
                </ul>
              </section>
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
              <ul className="space-y-4">
                {byCategory.map(([cat, amt]) => (
                  <li key={cat}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-4 text-[14px]">
                      <span>{categoryOf(cat).label}</span>
                      <span className="tabular font-mono text-[12px] text-muted">
                        {inr(amt)} · {Math.round((amt / total) * 100)}%
                      </span>
                    </div>
                    <div className="h-[3px] bg-rule" aria-hidden>
                      <div className="h-full bg-ink" style={{ width: `${Math.max(1.5, (amt / byCategory[0][1]) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

    </>
  );
}
