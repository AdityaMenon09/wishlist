"use client";

import { Search, X } from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useRef, useState, ViewTransition, type CSSProperties } from "react";
import { storeName } from "@/lib/stores";
import type { ItemSummary } from "@/lib/types";
import { ItemCard } from "./ItemCard";
import { Empty } from "./ui";

const SORTS = [
  { id: "recent", label: "Recent" },
  { id: "cheapest", label: "Cheapest" },
  { id: "dropping", label: "Dropping" },
  { id: "az", label: "A–Z" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

const change = (i: ItemSummary) =>
  i.prevPrice != null && i.currentPrice != null && i.prevPrice !== i.currentPrice ? (i.currentPrice - i.prevPrice) / i.prevPrice : 0;

function sorted(items: ItemSummary[], by: SortId) {
  if (by === "recent") return items;
  const out = [...items];
  if (by === "cheapest") out.sort((a, b) => (a.currentPrice ?? Infinity) - (b.currentPrice ?? Infinity));
  if (by === "dropping") out.sort((a, b) => change(a) - change(b));
  if (by === "az") out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
}

/**
 * The catalogue grid. Sorting and searching run in transitions, so each tile glides to its new
 * place (or steps out) through a view transition instead of the grid jumping.
 */
export function WishlistGrid({ items, emptyTitle, emptyText }: { items: ItemSummary[]; emptyTitle: string; emptyText: string }) {
  const [sort, setSort] = useState<SortId>("recent");
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim().toLowerCase());
  const input = useRef<HTMLInputElement>(null);

  // "/" jumps to search, as in most catalogues with a search field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || t.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      input.current?.focus();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  if (items.length === 0) return <Empty title={emptyTitle}>{emptyText}</Empty>;

  const shown = sorted(items, sort).filter(
    (i) => !q || i.title.toLowerCase().includes(q) || (i.brand ?? "").toLowerCase().includes(q) || storeName(i.store).toLowerCase().includes(q),
  );

  return (
    <>
      {items.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 pt-6">
          <label className="group flex min-h-11 w-full min-w-0 items-center gap-2.5 border-b border-rule transition-colors duration-200 focus-within:border-ink sm:w-auto sm:max-w-xs sm:flex-1">
            <Search aria-hidden className="size-4 shrink-0 text-muted transition-colors duration-200 group-focus-within:text-ink" />
            <span className="sr-only">Search this list</span>
            <input
              ref={input}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              placeholder={`Search ${items.length} items`}
              className="min-h-10 min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  input.current?.focus();
                }}
                className="anim-fade -mr-2 grid size-9 cursor-pointer place-items-center text-muted transition-colors duration-200 hover:text-ink"
                aria-label="Clear search"
              >
                <X aria-hidden className="size-4" />
              </button>
            ) : (
              <kbd className="meta hidden rounded border border-rule px-1.5 leading-5 sm:inline">/</kbd>
            )}
          </label>

          <div role="radiogroup" aria-label="Sort by" className="-ml-2 flex items-center gap-1 sm:ml-0">
            <span className="meta mr-2 hidden sm:inline">Sort</span>
            {SORTS.map((s) => {
              const on = s.id === sort;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => startTransition(() => setSort(s.id))}
                  className={`relative min-h-11 cursor-pointer px-2 text-[14px] transition-colors duration-200 ${on ? "text-ink" : "text-muted hover:text-ink"}`}
                >
                  {s.label}
                  {on && (
                    <span aria-hidden className="vt-ink absolute inset-x-2 bottom-1.5 h-px bg-ink" style={{ viewTransitionName: "sort-ink" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {q ? `${shown.length} of ${items.length} shown` : ""}
      </p>

      {shown.length === 0 ? (
        <div className="anim-fade border-b border-rule py-16 text-center">
          <p className="display text-[26px]">Nothing matches “{query.trim()}”.</p>
          <button type="button" onClick={() => setQuery("")} className="btn-text mt-2 text-muted">
            Clear the search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 pt-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((item, i) => (
            <ViewTransition key={item.id} enter="tile-in" exit="tile-out" update="tile-move" default="none">
              <div className="boot-rise" style={{ "--i": i + 2 } as CSSProperties}>
                <ItemCard item={item} />
              </div>
            </ViewTransition>
          ))}
        </div>
      )}
    </>
  );
}
