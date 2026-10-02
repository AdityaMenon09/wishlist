import Link from "next/link";
import { ViewTransition } from "react";
import { inr } from "@/lib/format";
import { storeName } from "@/lib/stores";
import type { ItemSummary } from "@/lib/types";
import { ProductImage } from "./client-ui";
import { Delta } from "./ui";

export function catalogueNo(id: number) {
  return `No. ${String(id).padStart(3, "0")}`;
}

/** The product photo, named so it travels between its tile and the item page. */
export function ItemPhoto({ id, src, alt, className, zoom }: { id: number; src: string | null; alt: string; className: string; zoom?: boolean }) {
  return (
    <ViewTransition name={`item-photo-${id}`} share="morph" default="none">
      <ProductImage src={src} alt={alt} className={className} zoom={zoom} />
    </ViewTransition>
  );
}

/** Catalogue tile: plate, mono meta, name, price. No container, no badge soup. */
export function ItemCard({ item }: { item: ItemSummary }) {
  const atTarget = item.targetPrice != null && item.currentPrice != null && item.currentPrice <= item.targetPrice;
  const atLow = item.pointCount >= 3 && item.lowPrice != null && item.currentPrice === item.lowPrice;
  const price = item.status === "bought" ? item.boughtPrice ?? item.currentPrice : item.currentPrice;
  const note =
    item.status === "bought"
      ? "Bought"
      : item.currentPrice == null
        ? "Needs a price"
        : atTarget
          ? "At your target"
          : atLow
            ? "Lowest yet"
            : null;

  return (
    <Link href={`/item/${item.id}`} transitionTypes={["nav-forward"]} className="group block cursor-pointer">
      <ItemPhoto id={item.id} src={item.image} alt="" className="aspect-[4/5] w-full" zoom />
      <div className="pt-3">
        <p className="meta flex justify-between gap-2">
          <span className="transition-colors duration-200 group-hover:text-ink">{catalogueNo(item.id)}</span>
          <span className="truncate">{storeName(item.store)}</span>
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-[15px] leading-snug text-ink underline-offset-4 group-hover:underline">{item.title}</h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="display tabular text-[22px]">{inr(price)}</span>
          {item.status === "wishlist" && <Delta from={item.prevPrice} to={item.currentPrice} />}
        </div>
        {note && (
          <p className={`mt-1 text-[13px] ${note === "Needs a price" ? "text-warn" : note === "Bought" ? "text-muted" : "text-down"}`}>{note}</p>
        )}
      </div>
    </Link>
  );
}
