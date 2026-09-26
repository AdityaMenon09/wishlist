"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import type { FormState } from "@/lib/actions";
import { CATEGORIES, PRODUCT_CATEGORIES } from "@/lib/categories";
import type { Item } from "@/lib/types";
import { FormMessage, SubmitButton, useFormAction } from "./client-ui";

type BoundAction = (state: FormState, fd: FormData) => Promise<FormState>;

export function RefreshButton({ action }: { action: () => Promise<FormState> }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(null);
  return (
    <span className="inline-flex flex-col">
      <button type="button" className="btn-text" disabled={pending} onClick={() => start(async () => setState(await action()))}>
        {pending && <Loader2 aria-hidden className="size-3.5 animate-spin" />}
        {pending ? "Checking…" : "Check price now"}
      </button>
      <span aria-live="polite">
        <FormMessage state={state} />
      </span>
    </span>
  );
}

export function CompareButton({ action, label }: { action: () => Promise<FormState>; label: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(null);
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn-outline w-fit" disabled={pending} onClick={() => start(async () => setState(await action()))}>
        {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {pending ? "Searching stores…" : label}
      </button>
      <FormMessage state={state?.error ? state : null} />
    </div>
  );
}

export function ManualPriceForm({ action }: { action: BoundAction }) {
  const { state, onSubmit, pending } = useFormAction(action);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="manual-price" className="label">
        Seen a different price? Log it
      </label>
      <div className="flex gap-2">
        <input id="manual-price" name="price" inputMode="decimal" placeholder="₹" className="field max-w-36 rounded-full px-4" required />
        <SubmitButton className="btn-outline" pending={pending} pendingText="Saving…">
          Log price
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function BuyForm({ action, item, today }: { action: BoundAction; item: Item; today: string }) {
  const [open, setOpen] = useState(false);
  const { state, onSubmit, pending } = useFormAction(action);
  if (!open)
    return (
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        I bought this
      </button>
    );
  return (
    <form onSubmit={onSubmit} className="w-full border-t border-rule pt-5">
      <p className="meta mb-4 text-ink">Log the purchase</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="buy-price" className="label">Paid (₹)</label>
          <input id="buy-price" name="price" inputMode="decimal" defaultValue={item.currentPrice ?? ""} className="field tabular" required />
        </div>
        <div>
          <label htmlFor="buy-date" className="label">On</label>
          <input id="buy-date" name="date" type="date" defaultValue={today} max={today} className="field" required />
        </div>
        <div>
          <label htmlFor="buy-cat" className="label">Category</label>
          <select id="buy-cat" name="category" defaultValue={item.category} className="field">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="mt-3 text-[13px] text-muted">Moves it to Bought and adds it to Spending.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending} pendingText="Saving…">
          Save purchase
        </SubmitButton>
        <button type="button" className="btn-text" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function EditItemForm({ action, item }: { action: BoundAction; item: Item }) {
  const { state, onSubmit, pending } = useFormAction(action);
  return (
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="e-title" className="label">Name</label>
        <input id="e-title" name="title" defaultValue={item.title} className="field" required />
      </div>
      <div>
        <label htmlFor="e-target" className="label">Target price (₹)</label>
        <input id="e-target" name="targetPrice" inputMode="decimal" defaultValue={item.targetPrice ?? ""} placeholder="Tell me when it hits…" className="field tabular" />
      </div>
      <div>
        <label htmlFor="e-cat" className="label">Category</label>
        <select id="e-cat" name="category" defaultValue={item.category} className="field">
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <p className="mt-1.5 text-[12.5px] text-muted">Picks which sale calendar the outlook uses.</p>
      </div>
      <div>
        <label htmlFor="e-brand" className="label">Brand</label>
        <input id="e-brand" name="brand" defaultValue={item.brand ?? ""} className="field" />
      </div>
      <div>
        <label htmlFor="e-mrp" className="label">MRP (₹)</label>
        <input id="e-mrp" name="mrp" inputMode="decimal" defaultValue={item.mrp ?? ""} className="field tabular" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="e-image" className="label">Image link</label>
        <input id="e-image" name="image" type="url" defaultValue={item.image ?? ""} className="field" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="e-notes" className="label">Notes</label>
        <textarea id="e-notes" name="notes" rows={3} defaultValue={item.notes ?? ""} className="field py-2.5" placeholder="Size, colour, why you want it…" />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton pending={pending} pendingText="Saving…">
          Save changes
        </SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function StatusButtons({
  status,
  archive,
  restore,
  remove,
}: {
  status: Item["status"];
  archive: () => Promise<void>;
  restore: () => Promise<void>;
  remove: () => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-x-6">
      {status === "wishlist" ? (
        <button type="button" className="btn-text" disabled={pending} onClick={() => start(archive)}>
          Archive
        </button>
      ) : (
        <button type="button" className="btn-text" disabled={pending} onClick={() => start(restore)}>
          Move back to wishlist
        </button>
      )}
      <button
        type="button"
        className="btn-text text-up decoration-up/40 hover:decoration-up"
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this item and its whole price history? Linked expenses are kept.")) start(remove);
        }}
      >
        Delete
      </button>
    </div>
  );
}

export function DeletePointButton({ action }: { action: () => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="min-h-9 cursor-pointer px-2 font-mono text-[12px] text-muted transition-colors duration-200 hover:text-up"
      aria-label="Remove this price point"
      disabled={pending}
      onClick={() => start(action)}
    >
      remove
    </button>
  );
}
