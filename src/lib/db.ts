import "server-only";

/**
 * One tiny interface over two Postgres drivers:
 *  - Neon (serverless HTTP) when DATABASE_URL is set — used on Vercel.
 *  - PGlite (Postgres compiled to WASM, stored in ./.data) otherwise — zero-setup local dev.
 * All queries in the app are plain parameterised SQL, so both behave identically.
 */
type Row = Record<string, unknown>;
type Driver = { query: (text: string, params?: unknown[]) => Promise<Row[]> };

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    store TEXT NOT NULL,
    title TEXT NOT NULL,
    brand TEXT,
    image TEXT,
    description TEXT,
    specs JSONB NOT NULL DEFAULT '[]',
    features JSONB NOT NULL DEFAULT '[]',
    category TEXT NOT NULL DEFAULT 'other',
    current_price DOUBLE PRECISION,
    mrp DOUBLE PRECISION,
    target_price DOUBLE PRECISION,
    status TEXT NOT NULL DEFAULT 'wishlist',
    notes TEXT,
    fetch_error TEXT,
    last_checked_at TIMESTAMPTZ,
    compare JSONB,
    compared_at TIMESTAMPTZ,
    bought_price DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS price_points (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    price DOUBLE PRECISION NOT NULL,
    source TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS price_points_item_time ON price_points (item_id, recorded_at)`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    category TEXT NOT NULL,
    spent_on DATE NOT NULL,
    note TEXT,
    item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS expenses_spent_on ON expenses (spent_on)`,
];

async function createDriver(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return { query: (text, params = []) => sql.query(text, params) as Promise<Row[]> };
  }
  if (process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL is not set. In Vercel, open the project → Storage → create a Neon database, then redeploy.",
    );
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync(".data", { recursive: true });
  const pg = new PGlite(".data/pglite");
  return { query: async (text, params = []) => (await pg.query<Row>(text, params)).rows };
}

// Keep one connection across hot reloads in dev and across requests on a warm lambda.
const g = globalThis as unknown as { __wlDb?: Promise<Driver> };

function db(): Promise<Driver> {
  g.__wlDb ??= (async () => {
    const driver = await createDriver();
    for (const stmt of SCHEMA) await driver.query(stmt);
    return driver;
  })().catch((err) => {
    g.__wlDb = undefined; // let the next request retry
    throw err;
  });
  return g.__wlDb;
}

export async function query<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const driver = await db();
  return (await driver.query(text, params)) as T[];
}

/** Drivers disagree on whether timestamps arrive as Date or string; normalise to ISO. */
export function iso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return new Date(String(v).replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00")).toISOString();
}

export function isoOrNull(v: unknown): string | null {
  return v == null ? null : iso(v);
}

export function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
