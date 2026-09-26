"use client";

import { ArrowRight } from "lucide-react";
import { addItem } from "@/lib/actions";
import { FormMessage, SubmitButton, useFormAction } from "./client-ui";

/** One quiet line: paste, press enter. */
export function AddItemForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const { state, onSubmit, pending } = useFormAction(addItem);
  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="url" className="sr-only">
        Product link
      </label>
      <div className="flex items-center gap-2 rounded-full border border-rule-strong bg-paper py-1.5 pr-1.5 pl-5 transition-colors duration-200 focus-within:border-ink">
        <input
          id="url"
          name="url"
          type="url"
          inputMode="url"
          required
          autoFocus={autoFocus}
          placeholder="Paste a product link from any store"
          className="min-h-10 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-muted focus:outline-none"
          aria-describedby="url-help"
        />
        <SubmitButton pending={pending} pendingText="Reading…" className="btn-primary min-h-10 px-4">
          <span className="hidden sm:inline">Track</span>
          <ArrowRight aria-hidden className="size-4" />
          <span className="sr-only sm:hidden">Track</span>
        </SubmitButton>
      </div>
      <p id="url-help" className="mt-3 pl-5 text-[13px] text-muted">
        Store blocking it? Use the{" "}
        <a href="/setup" className="text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
          bookmarklet
        </a>{" "}
        on the product page instead.
      </p>
      <div className="mt-2 pl-5" aria-live="polite">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
