import Link from "next/link";
import { AlertTriangle, Target } from "lucide-react";
import { inr } from "@/lib/format";
import { storeName } from "@/lib/stores";
import type { ItemSummary } from "@/lib/types";
import { ProductImage } from "./client-ui";
import { Delta, Sparkline } from "./ui";

export function ItemCard({ item }: { item: ItemSummary }) {
  const atTarget = item.targetPrice != null && item.currentPrice != null && item.currentPrice <= item.targetPrice;
  const atLow = item.pointCount >= 3 && item.lowPrice != null && item.currentPrice === item.lowPrice;
  const price = item.status === "bought" ? item.boughtPrice ?? item.currentPrice : item.currentPrice;
  return (
    <Link
      href={`/item/${item.id}`}
      className="card group flex cursor-pointer flex-col overflow-hidden p-3 transition-colors duration-200 hover:border-line-strong"
    >
      <ProductImage src={item.image} alt="" className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col px-1 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow">{storeName(item.store)}</span>
          {item.fetchError && item.currentPrice == null ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-warn">
              <AlertTriangle aria-hidden className="size-3.5" /> Needs price
            </span>
          ) : (
            <Sparkline values={item.spark} />
          )}
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-[15px] leading-snug font-semibold group-hover:text-link">{item.title}</h3>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <span className="tabular font-display text-xl font-semibold">{inr(price)}</span>
          {item.status === "wishlist" && <Delta from={item.prevPrice} to={item.currentPrice} />}
          {item.status === "bought" && <span className="text-xs font-semibold text-muted">paid</span>}
        </div>
        {item.status === "wishlist" && (atTarget || atLow) && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-down">
            <Target aria-hidden className="size-3.5" />
            {atTarget ? "Target price hit" : "Lowest price tracked"}
          </p>
        )}
      </div>
    </Link>
  );
}
