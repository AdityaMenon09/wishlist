import { revalidatePath } from "next/cache";
import { listItems } from "@/lib/repo";
import { refreshItem } from "@/lib/tracker";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Daily price check (vercel.json schedules it for 02:30 UTC = 08:00 IST).
 * Vercel sends `Authorization: Bearer $CRON_SECRET` automatically once that env var exists.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await listItems("wishlist");
  const deadline = Date.now() + 50_000; // stay inside the function time limit
  const results: { id: number; ok: boolean; message: string }[] = [];
  const queue = [...items].sort((a, b) => Date.parse(a.lastCheckedAt ?? "1970") - Date.parse(b.lastCheckedAt ?? "1970"));

  // A few at a time: fast enough, and gentle on the stores.
  async function worker() {
    for (let item = queue.shift(); item && Date.now() < deadline; item = queue.shift()) {
      try {
        results.push({ id: item.id, ...(await refreshItem(item)) });
      } catch (err) {
        results.push({ id: item.id, ok: false, message: err instanceof Error ? err.message : "failed" });
      }
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  revalidatePath("/", "layout");

  return Response.json({
    checked: results.length,
    updated: results.filter((r) => r.ok).length,
    skippedForTime: queue.length,
    results,
  });
}
