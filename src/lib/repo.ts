import "server-only";
import { iso, isoOrNull, num, query } from "./db";
import type {
  CompareResult,
  Expense,
  Item,
  ItemStatus,
  ItemSummary,
  PricePoint,
  PriceSource,
  ProductData,
} from "./types";

type Row = Record<string, unknown>;

function toItem(r: Row): Item {
  return {
    id: Number(r.id),
    url: String(r.url),
    store: String(r.store),
    title: String(r.title),
    brand: (r.brand as string) ?? null,
    image: (r.image as string) ?? null,
    description: (r.description as string) ?? null,
    specs: (r.specs as Item["specs"]) ?? [],
    features: (r.features as string[]) ?? [],
    category: String(r.category),
    currentPrice: num(r.current_price),
    mrp: num(r.mrp),
    targetPrice: num(r.target_price),
    status: r.status as ItemStatus,
    notes: (r.notes as string) ?? null,
    fetchError: (r.fetch_error as string) ?? null,
    lastCheckedAt: isoOrNull(r.last_checked_at),
    compare: (r.compare as CompareResult) ?? null,
    comparedAt: isoOrNull(r.compared_at),
    boughtPrice: num(r.bought_price),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function toSummary(r: Row): ItemSummary {
  return {
    ...toItem(r),
    lowPrice: num(r.low_price),
    prevPrice: num(r.prev_price),
    pointCount: Number(r.point_count ?? 0),
    spark: ((r.spark as number[] | null) ?? []).map(Number),
  };
}

const SUMMARY_COLUMNS = `
  i.*,
  (SELECT min(price) FROM price_points p WHERE p.item_id = i.id) AS low_price,
  (SELECT price FROM price_points p WHERE p.item_id = i.id ORDER BY recorded_at DESC OFFSET 1 LIMIT 1) AS prev_price,
  (SELECT count(*)::int FROM price_points p WHERE p.item_id = i.id) AS point_count,
  (SELECT json_agg(s.price ORDER BY s.recorded_at) FROM (
     SELECT price, recorded_at FROM price_points p WHERE p.item_id = i.id ORDER BY recorded_at DESC LIMIT 30
   ) s) AS spark`;

// ---------- items ----------

export async function listItems(status: ItemStatus | "all" = "all"): Promise<ItemSummary[]> {
  const rows =
    status === "all"
      ? await query(`SELECT ${SUMMARY_COLUMNS} FROM items i ORDER BY i.updated_at DESC`)
      : await query(`SELECT ${SUMMARY_COLUMNS} FROM items i WHERE i.status = $1 ORDER BY i.updated_at DESC`, [
          status,
        ]);
  return rows.map(toSummary);
}

export async function getItem(id: number): Promise<Item | null> {
  const [row] = await query(`SELECT * FROM items WHERE id = $1`, [id]);
  return row ? toItem(row) : null;
}

export async function findItemByUrl(url: string): Promise<Item | null> {
  const [row] = await query(`SELECT * FROM items WHERE url = $1`, [url]);
  return row ? toItem(row) : null;
}

export async function createItem(input: {
  url: string;
  store: string;
  category: string;
  product: ProductData;
  fetchError?: string | null;
}): Promise<Item> {
  const p = input.product;
  const [row] = await query(
    `INSERT INTO items (url, store, title, brand, image, description, specs, features, category,
                        current_price, mrp, fetch_error, last_checked_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12, now())
     RETURNING *`,
    [
      input.url,
      input.store,
      p.title,
      p.brand ?? null,
      p.image ?? null,
      p.description ?? null,
      JSON.stringify(p.specs),
      JSON.stringify(p.features),
      input.category,
      p.price ?? null,
      p.mrp ?? null,
      input.fetchError ?? null,
    ],
  );
  return toItem(row);
}

/**
 * Merge freshly-scraped data into an item. Price always updates; descriptive fields only
 * fill gaps or replace clearly-worse data, so manual edits aren't clobbered by a re-scrape.
 */
export async function mergeProduct(item: Item, p: ProductData): Promise<void> {
  const placeholderTitle = item.title === item.url || item.title.startsWith("Untitled");
  await query(
    `UPDATE items SET
       title = $2, brand = $3, image = $4, description = $5,
       specs = $6::jsonb, features = $7::jsonb,
       current_price = COALESCE($8, current_price), mrp = COALESCE($9, mrp),
       fetch_error = NULL, last_checked_at = now(), updated_at = now()
     WHERE id = $1`,
    [
      item.id,
      placeholderTitle ? p.title : item.title,
      item.brand ?? p.brand ?? null,
      item.image ?? p.image ?? null,
      item.description ?? p.description ?? null,
      JSON.stringify(p.specs.length > item.specs.length ? p.specs : item.specs),
      JSON.stringify(p.features.length > item.features.length ? p.features : item.features),
      p.price ?? null,
      p.mrp ?? null,
    ],
  );
}

export async function markFetchError(id: number, error: string): Promise<void> {
  await query(`UPDATE items SET fetch_error = $2, last_checked_at = now() WHERE id = $1`, [id, error]);
}

export async function updateItemFields(
  id: number,
  f: {
    title: string;
    brand: string | null;
    image: string | null;
    category: string;
    targetPrice: number | null;
    mrp: number | null;
    notes: string | null;
  },
): Promise<void> {
  await query(
    `UPDATE items SET title=$2, brand=$3, image=$4, category=$5, target_price=$6, mrp=$7, notes=$8,
                      updated_at = now()
     WHERE id=$1`,
    [id, f.title, f.brand, f.image, f.category, f.targetPrice, f.mrp, f.notes],
  );
}

export async function setItemStatus(id: number, status: ItemStatus, boughtPrice: number | null = null) {
  await query(`UPDATE items SET status=$2, bought_price=$3, updated_at=now() WHERE id=$1`, [
    id,
    status,
    boughtPrice,
  ]);
}

export async function setCompare(id: number, compare: CompareResult): Promise<void> {
  await query(`UPDATE items SET compare=$2::jsonb, compared_at=now() WHERE id=$1`, [id, JSON.stringify(compare)]);
}

export async function deleteItem(id: number): Promise<void> {
  await query(`DELETE FROM items WHERE id=$1`, [id]);
}

// ---------- price history ----------

export async function listPrices(itemId: number): Promise<PricePoint[]> {
  const rows = await query(`SELECT * FROM price_points WHERE item_id=$1 ORDER BY recorded_at`, [itemId]);
  return rows.map((r) => ({
    id: Number(r.id),
    itemId: Number(r.item_id),
    price: Number(r.price),
    source: r.source as PriceSource,
    recordedAt: iso(r.recorded_at),
  }));
}

/**
 * Record a price observation. Repeat observations of an unchanged price within 12 hours
 * are dropped so refreshing a page ten times doesn't flatten the graph into noise.
 */
export async function addPrice(itemId: number, price: number, source: PriceSource): Promise<boolean> {
  const [last] = await query<{ price: number; recent: boolean }>(
    `SELECT price, recorded_at > now() - interval '12 hours' AS recent
     FROM price_points WHERE item_id=$1 ORDER BY recorded_at DESC LIMIT 1`,
    [itemId],
  );
  if (last && last.recent && Number(last.price) === price) return false;
  await query(`INSERT INTO price_points (item_id, price, source) VALUES ($1,$2,$3)`, [itemId, price, source]);
  await query(`UPDATE items SET current_price=$2, updated_at=now() WHERE id=$1`, [itemId, price]);
  return true;
}

export async function deletePrice(id: number): Promise<void> {
  const [row] = await query<{ item_id: number }>(`DELETE FROM price_points WHERE id=$1 RETURNING item_id`, [id]);
  if (!row) return;
  // Keep current_price in sync with whatever is now the latest observation.
  await query(
    `UPDATE items SET current_price = COALESCE(
       (SELECT price FROM price_points WHERE item_id=$1 ORDER BY recorded_at DESC LIMIT 1), current_price)
     WHERE id=$1`,
    [row.item_id],
  );
}

// ---------- expenses ----------

function toExpense(r: Row): Expense {
  return {
    id: Number(r.id),
    title: String(r.title),
    amount: Number(r.amount),
    category: String(r.category),
    spentOn: String(r.spent_on_text),
    note: (r.note as string) ?? null,
    itemId: r.item_id == null ? null : Number(r.item_id),
    createdAt: iso(r.created_at),
  };
}

const EXPENSE_COLUMNS = `*, to_char(spent_on, 'YYYY-MM-DD') AS spent_on_text`;

/** month is "YYYY-MM". */
export async function listExpenses(month?: string): Promise<Expense[]> {
  const rows = month
    ? await query(
        `SELECT ${EXPENSE_COLUMNS} FROM expenses
         WHERE to_char(spent_on, 'YYYY-MM') = $1 ORDER BY spent_on DESC, id DESC`,
        [month],
      )
    : await query(`SELECT ${EXPENSE_COLUMNS} FROM expenses ORDER BY spent_on DESC, id DESC LIMIT 200`);
  return rows.map(toExpense);
}

export async function recentExpenses(limit = 6): Promise<Expense[]> {
  const rows = await query(`SELECT ${EXPENSE_COLUMNS} FROM expenses ORDER BY spent_on DESC, id DESC LIMIT $1`, [
    limit,
  ]);
  return rows.map(toExpense);
}

export async function monthlyTotals(months: number): Promise<{ month: string; total: number }[]> {
  const rows = await query<{ month: string; total: number }>(
    `SELECT to_char(spent_on, 'YYYY-MM') AS month, sum(amount) AS total
     FROM expenses
     WHERE spent_on >= (date_trunc('month', (now() AT TIME ZONE 'Asia/Kolkata')) - make_interval(months => $1 - 1))::date
     GROUP BY 1 ORDER BY 1`,
    [months],
  );
  return rows.map((r) => ({ month: r.month, total: Number(r.total) }));
}

export async function createExpense(e: {
  title: string;
  amount: number;
  category: string;
  spentOn: string;
  note: string | null;
  itemId?: number | null;
}): Promise<void> {
  await query(`INSERT INTO expenses (title, amount, category, spent_on, note, item_id) VALUES ($1,$2,$3,$4,$5,$6)`, [
    e.title,
    e.amount,
    e.category,
    e.spentOn,
    e.note,
    e.itemId ?? null,
  ]);
}

export async function updateExpense(
  id: number,
  e: { title: string; amount: number; category: string; spentOn: string; note: string | null },
): Promise<void> {
  await query(`UPDATE expenses SET title=$2, amount=$3, category=$4, spent_on=$5, note=$6 WHERE id=$1`, [
    id,
    e.title,
    e.amount,
    e.category,
    e.spentOn,
    e.note,
  ]);
}

export async function deleteExpense(id: number): Promise<void> {
  await query(`DELETE FROM expenses WHERE id=$1`, [id]);
}
