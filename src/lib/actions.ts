"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { gunzipSync } from "node:zlib";
import { SESSION_COOKIE, SESSION_MAX_AGE, isValidSession, passwordMatches, sessionToken } from "./auth";
import { CATEGORIES, categoryOf } from "./categories";
import { fetchOffers } from "./compare";
import { todayIST } from "./format";
import * as repo from "./repo";
import { parseProduct } from "./scrape/parse";
import { storeName } from "./stores";
import { refreshItem, trackUrl, upsertProduct } from "./tracker";

export type FormState = { error?: string; ok?: boolean; message?: string } | null;

/** Proxy already guards routes, but server actions must check for themselves too. */
async function requireAuth() {
  const jar = await cookies();
  if (!(await isValidSession(jar.get(SESSION_COOKIE)?.value))) throw new Error("Not signed in.");
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function money(fd: FormData, key: string): number | null {
  const raw = str(fd, key).replace(/[₹,\s]|rs\.?/gi, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

function validCategory(id: string, fallback = "other"): string {
  return CATEGORIES.some((c) => c.id === id) ? id : fallback;
}

function isDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

function firstUrl(text: string): string | null {
  return text.match(/https?:\/\/[^\s"'<>]+/i)?.[0] ?? null;
}

function refreshAll(id?: number) {
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/item/${id}`);
}

// ---------- auth ----------

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!(await passwordMatches(str(fd, "password")))) return { error: "That password isn't right." };
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return { ok: true };
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// ---------- wishlist items ----------

export async function addItem(_: FormState, fd: FormData): Promise<FormState> {
  await requireAuth();
  const url = firstUrl(str(fd, "url"));
  if (!url) return { error: "Paste a full product link starting with https://" };
  let id: number;
  let flag = "added";
  try {
    const outcome = await trackUrl(url);
    id = outcome.item.id;
    if (!outcome.created) flag = "exists";
    else if (outcome.warning) flag = "partial";
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong adding that link." };
  }
  refreshAll();
  redirect(`/item/${id}?${flag}=1`);
}

/** Called by /capture with the bookmarklet's snapshot (base64url, optionally gzipped). */
export async function captureSnapshot(kind: string, data: string): Promise<{ id?: number; error?: string; created?: boolean }> {
  await requireAuth();
  let payload: { u: string; h: string };
  try {
    const bytes = Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    payload = JSON.parse((kind === "g" ? gunzipSync(bytes) : bytes).toString("utf8"));
  } catch {
    return { error: "The page snapshot was damaged in transit. Try the bookmarklet again." };
  }
  if (!/^https?:\/\//.test(payload.u ?? "")) return { error: "The snapshot didn't include a page address." };
  const product = parseProduct(payload.h ?? "", payload.u);
  if (!product) return { error: "Couldn't find a product on that page. Open the product itself, not a search page." };
  const outcome = await upsertProduct(payload.u, product, "bookmarklet");
  refreshAll(outcome.item.id);
  return { id: outcome.item.id, created: outcome.created };
}

/** Called by /capture when a link is shared to the installed app (Android share sheet). */
export async function captureShared(text: string, title: string): Promise<{ id?: number; error?: string }> {
  await requireAuth();
  const url = firstUrl(text);
  if (!url) return { error: "No link found in what was shared." };
  const outcome = await trackUrl(url, title || undefined);
  refreshAll(outcome.item.id);
  return { id: outcome.item.id };
}

export async function refreshItemAction(id: number): Promise<FormState> {
  await requireAuth();
  const item = await repo.getItem(id);
  if (!item) return { error: "Item not found." };
  const r = await refreshItem(item);
  refreshAll(id);
  return r.ok ? { ok: true, message: r.message } : { error: r.message };
}

export async function updateItem(id: number, _: FormState, fd: FormData): Promise<FormState> {
  await requireAuth();
  const title = str(fd, "title");
  if (!title) return { error: "Give it a name." };
  const targetPrice = money(fd, "targetPrice");
  const mrp = money(fd, "mrp");
  if (Number.isNaN(targetPrice) || Number.isNaN(mrp)) return { error: "Prices should be plain numbers, like 1499." };
  const image = str(fd, "image");
  if (image && !/^https?:\/\//.test(image)) return { error: "Image should be a full https:// link." };
  await repo.updateItemFields(id, {
    title,
    brand: str(fd, "brand") || null,
    image: image || null,
    category: validCategory(str(fd, "category")),
    targetPrice,
    mrp,
    notes: str(fd, "notes") || null,
  });
  refreshAll(id);
  return { ok: true, message: "Saved." };
}

export async function addManualPrice(id: number, _: FormState, fd: FormData): Promise<FormState> {
  await requireAuth();
  const price = money(fd, "price");
  if (price == null || Number.isNaN(price) || price <= 0) return { error: "Enter the price you see, like 1499." };
  await repo.addPrice(id, price, "manual");
  refreshAll(id);
  return { ok: true, message: "Price recorded." };
}

export async function deletePriceAction(itemId: number, pointId: number) {
  await requireAuth();
  await repo.deletePrice(pointId);
  refreshAll(itemId);
}

export async function markBought(id: number, _: FormState, fd: FormData): Promise<FormState> {
  await requireAuth();
  const item = await repo.getItem(id);
  if (!item) return { error: "Item not found." };
  const price = money(fd, "price");
  if (price == null || Number.isNaN(price) || price <= 0) return { error: "Enter what you paid." };
  const date = str(fd, "date") || todayIST();
  if (!isDate(date)) return { error: "Pick a valid date." };
  await repo.createExpense({
    title: item.title.slice(0, 120),
    amount: price,
    category: validCategory(str(fd, "category"), categoryOf(item.category).id),
    spentOn: date,
    note: `Bought from ${storeName(item.store)}`,
    itemId: item.id,
  });
  await repo.setItemStatus(id, "bought", price);
  refreshAll(id);
  return { ok: true, message: "Marked as bought and added to expenses." };
}

export async function setItemStatusAction(id: number, status: "wishlist" | "archived") {
  await requireAuth();
  await repo.setItemStatus(id, status);
  refreshAll(id);
}

export async function deleteItemAction(id: number) {
  await requireAuth();
  await repo.deleteItem(id);
  refreshAll();
  redirect("/wishlist");
}

export async function compareAction(id: number): Promise<FormState> {
  await requireAuth();
  const item = await repo.getItem(id);
  if (!item) return { error: "Item not found." };
  try {
    await repo.setCompare(id, await fetchOffers(item));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Price search failed." };
  }
  refreshAll(id);
  return { ok: true };
}

// ---------- expenses ----------

function readExpense(fd: FormData) {
  const title = str(fd, "title");
  const amount = money(fd, "amount");
  const spentOn = str(fd, "spentOn") || todayIST();
  if (!title) return { error: "What was it for?" } as const;
  if (amount == null || Number.isNaN(amount) || amount <= 0) return { error: "Enter an amount, like 250." } as const;
  if (!isDate(spentOn)) return { error: "Pick a valid date." } as const;
  return {
    value: { title: title.slice(0, 120), amount, category: validCategory(str(fd, "category")), spentOn, note: str(fd, "note") || null },
  } as const;
}

export async function createExpenseAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAuth();
  const r = readExpense(fd);
  if ("error" in r) return { error: r.error };
  await repo.createExpense(r.value);
  refreshAll();
  return { ok: true, message: `Added ${r.value.title}.` };
}

export async function updateExpenseAction(id: number, _: FormState, fd: FormData): Promise<FormState> {
  await requireAuth();
  const r = readExpense(fd);
  if ("error" in r) return { error: r.error };
  await repo.updateExpense(id, r.value);
  refreshAll();
  return { ok: true, message: "Saved." };
}

export async function deleteExpenseAction(id: number) {
  await requireAuth();
  await repo.deleteExpense(id);
  refreshAll();
}
