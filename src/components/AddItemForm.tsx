"use client";

import { Link2 } from "lucide-react";
import { addItem } from "@/lib/actions";
import { FormMessage, SubmitButton, useFormAction } from "./client-ui";

export function AddItemForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const { state, onSubmit, pending } = useFormAction(addItem);
  return (
    <form onSubmit={onSubmit} className="card p-4 sm:p-5">
      <label htmlFor="url" className="label">
        Add a product
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Link2 aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            required
            autoFocus={autoFocus}
            placeholder="https://www.amazon.in/dp/…"
            className="field pl-9"
            aria-describedby="url-help"
          />
        </div>
        <SubmitButton pending={pending} pendingText="Fetching…">
          Track it
        </SubmitButton>
      </div>
      <p id="url-help" className="mt-2 text-sm text-muted">
        Paste a link from Amazon, Flipkart, Myntra or any store. If the store blocks the check, use the{" "}
        <a href="/setup" className="font-semibold text-link underline-offset-2 hover:underline">
          bookmarklet
        </a>{" "}
        on the product page instead.
      </p>
      <div className="mt-2">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
