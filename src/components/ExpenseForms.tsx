"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createExpenseAction, deleteExpenseAction, updateExpenseAction, type FormState } from "@/lib/actions";
import { CATEGORIES, categoryOf } from "@/lib/categories";
import { inr } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { FormMessage, SubmitButton, useFormAction } from "./client-ui";

function Fields({ e, today, idPrefix }: { e?: Expense; today: string; idPrefix: string }) {
  return (
    <>
      <div className="sm:col-span-2 lg:col-span-4">
        <label htmlFor={`${idPrefix}-title`} className="label">What for</label>
        <input id={`${idPrefix}-title`} name="title" defaultValue={e?.title} placeholder="Lunch, auto, headphones…" className="field" required />
      </div>
      <div className="lg:col-span-2">
        <label htmlFor={`${idPrefix}-amount`} className="label">Amount (₹)</label>
        <input id={`${idPrefix}-amount`} name="amount" inputMode="decimal" defaultValue={e?.amount} placeholder="250" className="field tabular" required />
      </div>
      <div className="lg:col-span-2">
        <label htmlFor={`${idPrefix}-date`} className="label">Date</label>
        <input id={`${idPrefix}-date`} name="spentOn" type="date" defaultValue={e?.spentOn ?? today} max={today} className="field" required />
      </div>
      <div className="lg:col-span-3">
        <label htmlFor={`${idPrefix}-cat`} className="label">Category</label>
        <select id={`${idPrefix}-cat`} name="category" defaultValue={e?.category ?? "food"} className="field">
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-5">
        <label htmlFor={`${idPrefix}-note`} className="label">
          Note <span className="font-normal text-muted">(optional)</span>
        </label>
        <input id={`${idPrefix}-note`} name="note" defaultValue={e?.note ?? ""} className="field" />
      </div>
    </>
  );
}

export function NewExpenseForm({ today }: { today: string }) {
  const { state, onSubmit, pending } = useFormAction(createExpenseAction);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      ref.current?.querySelector<HTMLInputElement>("input[name=title]")?.focus();
    }
  }, [state]);
  return (
    <form ref={ref} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-8">
      <Fields today={today} idPrefix="new" />
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-8">
        <SubmitButton pending={pending} pendingText="Adding…">
          Add to ledger
        </SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function ExpenseRow({ e, today }: { e: Expense; today: string }) {
  const [editing, setEditing] = useState(false);
  const edit = useFormAction(async (prev: FormState, fd: FormData) => {
    const result = await updateExpenseAction(e.id, prev, fd);
    if (result?.ok) setEditing(false);
    return result;
  });
  const [pending, start] = useTransition();

  if (editing)
    return (
      <li className="border-b border-rule py-5">
        <form onSubmit={edit.onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-8">
          <Fields e={e} today={today} idPrefix={`e${e.id}`} />
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-8">
            <SubmitButton pending={edit.pending} pendingText="Saving…">
              Save
            </SubmitButton>
            <button type="button" className="btn-text" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <FormMessage state={edit.state} />
          </div>
        </form>
      </li>
    );

  return (
    <li className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-rule py-3 ${pending ? "opacity-40" : ""}`}>
      <div className="min-w-0">
        <p className="truncate text-[15px]">{e.title}</p>
        <p className="truncate text-[13px] text-muted">
          {categoryOf(e.category).label}
          {e.note && <> · {e.note}</>}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <span className="display tabular mr-2 text-[20px]">{inr(e.amount)}</span>
        <button
          type="button"
          className="min-h-10 cursor-pointer px-1.5 font-mono text-[12px] text-muted transition-colors duration-200 hover:text-ink"
          aria-label={`Edit ${e.title}`}
          onClick={() => setEditing(true)}
        >
          edit
        </button>
        <button
          type="button"
          className="min-h-10 cursor-pointer px-1.5 font-mono text-[12px] text-muted transition-colors duration-200 hover:text-up"
          aria-label={`Delete ${e.title}`}
          disabled={pending}
          onClick={() => {
            if (confirm(`Delete "${e.title}" (${inr(e.amount)})?`)) start(() => deleteExpenseAction(e.id));
          }}
        >
          delete
        </button>
      </div>
    </li>
  );
}
