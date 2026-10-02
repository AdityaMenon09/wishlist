import type { Metadata } from "next";
import Link from "next/link";
import { AddItemForm } from "@/components/AddItemForm";
import { PageTransition } from "@/components/PageTransition";
import { PageHeader } from "@/components/ui";
import { WishlistGrid } from "@/components/WishlistGrid";
import { inr } from "@/lib/format";
import { listItems } from "@/lib/repo";
import type { ItemStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Wishlist" };

const TABS: { id: ItemStatus; label: string }[] = [
  { id: "wishlist", label: "Wanted" },
  { id: "bought", label: "Bought" },
  { id: "archived", label: "Archived" },
];

const EMPTY: Record<ItemStatus, [string, string]> = {
  wishlist: ["Nothing wanted yet.", "Paste a link above. WishList reads the product, starts a price history, and tells you whether to buy or wait."],
  bought: ["Nothing bought yet.", "Mark something as bought and it lands here, and in Spending."],
  archived: ["Nothing archived yet.", "Archived items keep their history but stop getting checked."],
};

export default async function WishlistPage({ searchParams }: PageProps<"/wishlist">) {
  const { tab } = await searchParams;
  const active = TABS.find((t) => t.id === tab)?.id ?? "wishlist";
  const all = await listItems();
  const items = all.filter((i) => i.status === active);
  const counts = Object.fromEntries(TABS.map((t) => [t.id, all.filter((i) => i.status === t.id).length]));
  const total = items.reduce((s, i) => s + ((active === "bought" ? i.boughtPrice : i.currentPrice) ?? 0), 0);

  return (
    <PageTransition>
      <PageHeader
        kicker={items.length ? `${items.length} item${items.length === 1 ? "" : "s"} · ${inr(total)} ${active === "bought" ? "spent" : "in total"}` : "The catalogue"}
        title="Wishlist"
      >
        Things you want, with the price checked every morning.
      </PageHeader>

      <div className="max-w-2xl">
        <AddItemForm autoFocus={all.length === 0} />
      </div>

      <nav aria-label="Filter" className="mt-12 flex gap-6 border-b border-rule">
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <Link
              key={t.id}
              href={t.id === "wishlist" ? "/wishlist" : `/wishlist?tab=${t.id}`}
              scroll={false}
              aria-current={on ? "page" : undefined}
              className={`group relative -mb-px flex min-h-11 items-center gap-2 text-[15px] transition-colors duration-200 ${
                on ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
              <span className="tabular font-mono text-[12px] text-muted">{counts[t.id]}</span>
              {on ? (
                <span aria-hidden className="vt-ink absolute inset-x-0 bottom-0 h-[2px] bg-ink" style={{ viewTransitionName: "tab-ink" }} />
              ) : (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-rule-strong transition-transform duration-300 ease-(--ease-out) group-hover:scale-x-100"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <WishlistGrid key={active} items={items} emptyTitle={EMPTY[active][0]} emptyText={EMPTY[active][1]} />
    </PageTransition>
  );
}
