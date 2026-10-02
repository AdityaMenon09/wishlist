"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { addItem } from "@/lib/actions";
import { FormMessage, SubmitButton, useFormAction } from "./client-ui";

/** One quiet line: paste, press enter. While the server reads the page, a hairline scans under it. */
export function AddItemForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const { state, onSubmit, pending } = useFormAction(addItem);
  const pill = useRef<HTMLDivElement>(null);

  // A refused link nudges the field sideways, like a drawer that won't close.
  useEffect(() => {
    if (!state?.error || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    pill.current?.animate(
      [{ translate: "0" }, { translate: "-6px" }, { translate: "5px" }, { translate: "-3px" }, { translate: "1px" }, { translate: "0" }],
      { duration: 420, easing: "ease-out" },
    );
  }, [state]);

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="url" className="sr-only">
        Product link
      </label>
      <div
        ref={pill}
        className={`group/pill relative flex items-center gap-2 overflow-hidden rounded-full border bg-paper py-1.5 pr-1.5 pl-5 transition-colors duration-200 focus-within:border-ink ${
          state?.error ? "border-up" : "border-rule-strong"
        }`}
      >
        <input
          id="url"
          name="url"
          type="url"
          inputMode="url"
          required
          autoFocus={autoFocus}
          readOnly={pending}
          placeholder="Paste a product link from any store"
          className="min-h-10 min-w-0 flex-1 bg-transparent text-base text-ink transition-opacity duration-200 placeholder:text-muted read-only:opacity-60 focus:outline-none"
          aria-describedby="url-help"
        />
        <SubmitButton pending={pending} pendingText="Reading…" className="btn-primary min-h-10 px-4">
          <span className="hidden sm:inline">Track</span>
          <ArrowRight aria-hidden className="size-4 transition-transform duration-300 ease-(--ease-out) group-hover/pill:translate-x-0.5 group-focus-within/pill:translate-x-0.5" />
          <span className="sr-only sm:hidden">Track</span>
        </SubmitButton>
        {pending && <span aria-hidden className="scan-line" />}
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
