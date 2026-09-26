import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { ExpenseRow, NewExpenseForm } from "@/components/ExpenseForms";
import { SpendingChart } from "@/components/SpendingChart";
import { EmptyState, PageHeader, StatCard } from "@/components/ui";
import { categoryOf } from "@/lib/categories";
import { dayLabel, inr, monthLabel, shiftMonth, thisMonthIST, todayIST } from "@/lib/format";
import { listExpenses, monthlyTotals } from "@/lib/repo";
import type { Expense } from "@/lib/types";

export const metadata: Metadata = { title: "Expenses" };

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
  const daysElapsed = month === current ? Number(today.slice(8, 10)) : new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).getUTCDate();
  const change = prevTotal ? ((total - prevTotal) / prevTotal) * 100 : null;

  const byCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => ((acc[e.category] = (acc[e.category] ?? 0) + e.amount), acc), {}),
  ).sort((a, b) => b[1] - a[1]);

  const byDay = expenses.reduce<Map<string, Expense[]>>((acc, e) => acc.set(e.spentOn, [...(acc.get(e.spentOn) ?? []), e]), new Map());

  // Last 6 months ending at the selected month, including empty months.
  const chart = Array.from({ length: 6 }, (_, i) => {
    const mm = shiftMonth(month, i - 5);
    return { month: mm, label: monthLabel(mm, "short"), total: totals.find((t) => t.month === mm)?.total ?? 0 };
  });

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Everything you spend, wishlist purchases included."
        action={
          <nav aria-label="Month" className="flex items-center gap-1 rounded-xl bg-surface-2 p-1">
            <Link href={`/expenses?m=${shiftMonth(month, -1)}`} className="grid size-10 place-items-center rounded-lg text-muted transition-colors duration-200 hover:bg-surface hover:text-fg" aria-label="Previous month">
              <ChevronLeft aria-hidden className="size-4" />
            </Link>
            <span className="min-w-36 text-center text-sm font-semibold" aria-live="polite">{monthLabel(month)}</span>
            {month < current ? (
              <Link href={`/expenses?m=${shiftMonth(month, 1)}`} className="grid size-10 place-items-center rounded-lg text-muted transition-colors duration-200 hover:bg-surface hover:text-fg" aria-label="Next month">
                <ChevronRight aria-hidden className="size-4" />
              </Link>
            ) : (
              <span className="grid size-10 place-items-center text-muted/40" aria-hidden>
                <ChevronRight className="size-4" />
              </span>
            )}
          </nav>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label={month === current ? "Spent this month" : "Spent"}
          value={inr(total)}
          hint={
            change == null ? "No data for the month before" : (
              <span className={change > 0 ? "text-up" : "text-down"}>
                {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(0)}% vs {monthLabel(shiftMonth(month, -1), "short")}
              </span>
            )
          }
        />
        <StatCard label="Daily average" value={inr(Math.round(total / Math.max(1, daysElapsed)))} hint={`over ${daysElapsed} day${daysElapsed === 1 ? "" : "s"}`} />
        <StatCard label="Transactions" value={expenses.length} />
        <StatCard label="Top category" value={byCategory[0] ? categoryOf(byCategory[0][0]).label : "—"} hint={byCategory[0] ? inr(byCategory[0][1]) : undefined} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <NewExpenseForm today={today} />

          {expenses.length === 0 ? (
            <EmptyState icon={<Wallet aria-hidden className="size-6" />} title={`Nothing logged for ${monthLabel(month)}`}>
              Add expenses above. Wishlist items you mark as bought show up here automatically.
            </EmptyState>
          ) : (
            [...byDay.entries()].map(([day, list]) => (
              <section key={day} aria-label={dayLabel(day)}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-semibold">{dayLabel(day)}</h2>
                  <span className="tabular text-sm text-muted">{inr(list.reduce((s, e) => s + e.amount, 0))}</span>
                </div>
                <ul className="card divide-y divide-line">
                  {list.map((e) => (
                    <ExpenseRow key={e.id} e={e} today={today} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="trend-h" className="card p-5">
            <h2 id="trend-h" className="eyebrow mb-4">Last 6 months</h2>
            <SpendingChart data={chart} highlight={month} />
          </section>
          {byCategory.length > 0 && (
            <section aria-labelledby="cat-h" className="card p-5">
              <h2 id="cat-h" className="eyebrow mb-4">By category</h2>
              <ul className="space-y-3">
                {byCategory.map(([cat, amt]) => (
                  <li key={cat}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold">{categoryOf(cat).label}</span>
                      <span className="tabular text-muted">
                        {inr(amt)} · {Math.round((amt / total) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                      <div className="h-full rounded-full bg-chart" style={{ width: `${Math.max(2, (amt / byCategory[0][1]) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
