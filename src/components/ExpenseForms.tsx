"use client";

import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { createExpenseAction, deleteExpenseAction, updateExpenseAction, type FormState } from "@/lib/actions";
import { CATEGORIES, categoryOf } from "@/lib/categories";
import { inr } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { FormMessage, SubmitButton, useFormAction } from "./client-ui";

function Fields({ e, today, idPrefix }: { e?: Expense; today: string; idPrefix: string }) {
  return (
    <>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-title`} className="label">What for</label>
        <input id={`${idPrefix}-title`} name="title" defaultValue={e?.title} placeholder="Lunch, Uber, headphones…" className="field" required />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-amount`} className="label">Amount (₹)</label>
        <input id={`${idPrefix}-amount`} name="amount" inputMode="decimal" defaultValue={e?.amount} placeholder="250" className="field tabular" required />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-date`} className="label">Date</label>
        <input id={`${idPrefix}-date`} name="spentOn" type="date" defaultValue={e?.spentOn ?? today} max={today} className="field" required />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-cat`} className="label">Category</label>
        <select id={`${idPrefix}-cat`} name="category" defaultValue={e?.category ?? "food"} className="field">
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
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
    <form ref={ref} onSubmit={onSubmit} className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
      <p className="font-display font-semibold sm:col-span-2">Log an expense</p>
      <Fields today={today} idPrefix="new" />
      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton pending={pending} pendingText="Adding…">
          Add expense
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
      <li className="p-4">
        <form onSubmit={edit.onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Fields e={e} today={today} idPrefix={`e${e.id}`} />
          <div className="flex items-center gap-2 sm:col-span-2">
            <SubmitButton pending={edit.pending} pendingText="Saving…">
              Save
            </SubmitButton>
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
              <X aria-hidden className="size-4" /> Cancel
            </button>
            <FormMessage state={edit.state} />
          </div>
        </form>
      </li>
    );

  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${pending ? "opacity-50" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{e.title}</p>
        <p className="truncate text-xs text-muted">
          {categoryOf(e.category).label}
          {e.note && <> · {e.note}</>}
        </p>
      </div>
      <span className="tabular font-semibold">{inr(e.amount)}</span>
      <div className="flex">
        <button type="button" className="cursor-pointer rounded-lg p-2.5 text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-fg" aria-label={`Edit ${e.title}`} onClick={() => setEditing(true)}>
          <Pencil aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-lg p-2.5 text-muted transition-colors duration-200 hover:bg-up-bg hover:text-up"
          aria-label={`Delete ${e.title}`}
          disabled={pending}
          onClick={() => {
            if (confirm(`Delete "${e.title}" (${inr(e.amount)})?`)) start(() => deleteExpenseAction(e.id));
          }}
        >
          <Trash2 aria-hidden className="size-4" />
        </button>
      </div>
    </li>
  );
}
