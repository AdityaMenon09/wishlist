import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { AddItemForm } from "@/components/AddItemForm";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState, PageHeader } from "@/components/ui";
import { inr } from "@/lib/format";
import { listItems } from "@/lib/repo";
import type { ItemStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Wishlist" };

const TABS: { id: ItemStatus; label: string }[] = [
  { id: "wishlist", label: "Wishing" },
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
        title="Wishlist"
        subtitle={
          items.length
            ? `${items.length} item${items.length === 1 ? "" : "s"} · ${inr(total)} ${active === "bought" ? "spent" : "total"}`
            : "Everything you're eyeing, with prices checked daily."
        }
      />
      <AddItemForm autoFocus={all.length === 0} />

      <nav aria-label="Filter" className="mt-8 mb-5 flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1 sm:w-fit">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "wishlist" ? "/wishlist" : `/wishlist?tab=${t.id}`}
            aria-current={t.id === active ? "page" : undefined}
            className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-200 sm:flex-none ${
              t.id === active ? "bg-surface text-fg shadow-soft" : "text-muted hover:text-fg"
            }`}
          >
            {t.label}
            <span className="tabular text-xs text-muted">{counts[t.id]}</span>
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState icon={<Heart aria-hidden className="size-6" />} title={active === "wishlist" ? "Nothing here yet" : `No ${active} items`}>
          {active === "wishlist"
            ? "Paste a product link above. WishList pulls the details, starts a price history, and tells you whether to buy now or wait."
            : active === "bought"
              ? "When you buy something from your wishlist, mark it as bought and it moves here (and into Expenses)."
              : "Archived items stop getting price checks but keep their history."}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
