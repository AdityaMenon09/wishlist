import type { Metadata } from "next";
import Link from "next/link";
import { AddItemForm } from "@/components/AddItemForm";
import { ItemCard } from "@/components/ItemCard";
import { Empty, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";
import { listItems } from "@/lib/repo";
import type { ItemStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Wishlist" };

const TABS: { id: ItemStatus; label: string }[] = [
  { id: "wishlist", label: "Wanted" },
  { id: "bought", label: "Bought" },
  { id: "archived", label: "Archived" },
];

export default async function WishlistPage({ searchParams }: PageProps<"/wishlist">) {
  const { tab } = await searchParams;
  const active = TABS.find((t) => t.id === tab)?.id ?? "wishlist";
  const all = await listItems();
  const items = all.filter((i) => i.status === active);
  const counts = Object.fromEntries(TABS.map((t) => [t.id, all.filter((i) => i.status === t.id).length]));
  const total = items.reduce((s, i) => s + ((active === "bought" ? i.boughtPrice : i.currentPrice) ?? 0), 0);

  return (
    <>
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
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "wishlist" ? "/wishlist" : `/wishlist?tab=${t.id}`}
            aria-current={t.id === active ? "page" : undefined}
            className={`relative -mb-px flex min-h-11 items-center gap-2 border-b-2 text-[15px] transition-colors duration-200 ${
              t.id === active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
            <span className="tabular font-mono text-[12px] text-muted">{counts[t.id]}</span>
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <Empty title={active === "wishlist" ? "Nothing wanted yet." : `Nothing ${active} yet.`}>
          {active === "wishlist"
            ? "Paste a link above. WishList reads the product, starts a price history, and tells you whether to buy or wait."
            : active === "bought"
              ? "Mark something as bought and it lands here, and in Spending."
              : "Archived items keep their history but stop getting checked."}
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 pt-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
