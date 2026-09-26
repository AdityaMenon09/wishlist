import { categoryOf } from "./categories";
import { inr } from "./format";
import type { PricePoint } from "./types";

/**
 * Price outlook: a transparent, rule-based estimate — deliberately not machine learning.
 * One product's price history is far too sparse to train on; what actually moves Indian
 * e-commerce prices is the sale calendar, recent trend, and where the price sits relative
 * to its own history. Every conclusion below comes with the reason that produced it.
 */

type Group = "electronics" | "fashion" | "general";

type SaleWindow = {
  name: string;
  start: [number, number]; // [month, day], approximate, India
  end: [number, number];
  /** Typical extra drop vs the usual price, by product group (0 = not relevant). */
  drop: Record<Group, number>;
};

const SALES: SaleWindow[] = [
  { name: "Republic Day sales", start: [1, 13], end: [1, 20], drop: { electronics: 0.1, fashion: 0.2, general: 0.12 } },
  { name: "End of Reason Sale (summer)", start: [6, 1], end: [6, 15], drop: { electronics: 0, fashion: 0.3, general: 0 } },
  { name: "Prime Day & July sales", start: [7, 10], end: [7, 20], drop: { electronics: 0.12, fashion: 0.2, general: 0.12 } },
  { name: "Independence Day sales", start: [8, 5], end: [8, 15], drop: { electronics: 0.1, fashion: 0.15, general: 0.1 } },
  {
    name: "Festive sales (Big Billion Days / Great Indian Festival)",
    start: [9, 20],
    end: [10, 31],
    drop: { electronics: 0.15, fashion: 0.3, general: 0.15 },
  },
  { name: "Black Friday deals", start: [11, 24], end: [12, 1], drop: { electronics: 0.08, fashion: 0.15, general: 0.08 } },
  { name: "End of Reason Sale (winter)", start: [12, 5], end: [12, 20], drop: { electronics: 0, fashion: 0.3, general: 0 } },
];

export type Verdict = "buy" | "good" | "wait" | "watch" | "unknown";

export type ProjectionPoint = { date: string; mid: number; lo: number; hi: number };

export type Outlook = {
  verdict: Verdict;
  headline: string;
  confidence: "low" | "medium" | "high";
  reasons: string[];
  projection: ProjectionPoint[];
  projectedLow: { price: number; date: string; why: string } | null;
  sale: { name: string; start: string; end: string; daysAway: number; inProgress: boolean; drop: number } | null;
  stats: {
    points: number;
    days: number;
    low: number | null;
    lowAt: string | null;
    high: number | null;
    typical: number | null;
    trendPerWeekPct: number | null;
    mrpOffPct: number | null;
  };
};

const DAY = 86_400_000;
const HORIZON = 30;

function istDate(y: number, m: number, d: number) {
  return new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+05:30`);
}

function istYear(now: Date) {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric" }).format(now));
}

export function findSale(now: Date, group: Group) {
  const y = istYear(now);
  const windows = [y - 1, y, y + 1].flatMap((year) =>
    SALES.filter((s) => s.drop[group] > 0).map((s) => ({
      name: s.name,
      start: istDate(year, ...s.start),
      end: new Date(istDate(year, ...s.end).getTime() + DAY - 1),
      drop: s.drop[group],
    })),
  );
  const current = windows.find((w) => w.start <= now && now <= w.end);
  if (current) return { ...current, inProgress: true, daysAway: 0 };
  const next = windows.filter((w) => w.start > now).sort((a, b) => +a.start - +b.start)[0];
  return next ? { ...next, inProgress: false, daysAway: Math.ceil((+next.start - +now) / DAY) } : null;
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const pct = (x: number) => `${Math.abs(x).toFixed(Math.abs(x) < 10 ? 1 : 0)}%`;
const shortDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export function computeOutlook(input: {
  points: PricePoint[];
  currentPrice: number | null;
  mrp: number | null;
  targetPrice: number | null;
  category: string;
  now?: Date;
}): Outlook {
  const now = input.now ?? new Date();
  const group = categoryOf(input.category).saleGroup;
  const current = input.currentPrice;
  const pts = input.points.map((p) => ({ t: +new Date(p.recordedAt), price: p.price })).sort((a, b) => a.t - b.t);
  if (current != null && pts.length === 0) pts.push({ t: +now, price: current });

  const n = pts.length;
  const days = n ? Math.max(0, Math.round((+now - pts[0].t) / DAY)) : 0;
  const prices = pts.map((p) => p.price);
  const low = n ? Math.min(...prices) : null;
  const lowPoint = n ? pts.find((p) => p.price === low)! : null;
  const high = n ? Math.max(...prices) : null;
  const recent90 = pts.filter((p) => p.t >= +now - 90 * DAY).map((p) => p.price);
  const typical = recent90.length >= 3 ? median(recent90) : null;

  // Linear trend over the last 30 days, only when there's enough spread to mean something.
  const last30 = pts.filter((p) => p.t >= +now - 30 * DAY);
  let slopePerDay = 0;
  let trendPerWeekPct: number | null = null;
  const trendSpan = last30.length ? (last30[last30.length - 1].t - last30[0].t) / DAY : 0;
  if (last30.length >= 4 && trendSpan >= 7 && current) {
    const xs = last30.map((p) => (p.t - last30[0].t) / DAY);
    const ys = last30.map((p) => p.price);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = ys.reduce((a, b) => a + b, 0) / ys.length;
    const cov = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
    const vx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    slopePerDay = vx ? cov / vx : 0;
    trendPerWeekPct = ((slopePerDay * 7) / current) * 100;
  }

  const mean30 = last30.length ? last30.reduce((a, p) => a + p.price, 0) / last30.length : current ?? 0;
  const sd30 = last30.length > 1 ? Math.sqrt(last30.reduce((a, p) => a + (p.price - mean30) ** 2, 0) / last30.length) : 0;
  const baseBand = Math.min(0.15, Math.max(0.03, mean30 ? (sd30 / mean30) * 1.5 : 0.05));

  const sale = findSale(now, group);
  const saleInfo = sale
    ? {
        name: sale.name,
        start: sale.start.toISOString(),
        end: sale.end.toISOString(),
        daysAway: sale.daysAway,
        inProgress: sale.inProgress,
        drop: sale.drop,
      }
    : null;
  const mrpOffPct = current && input.mrp && input.mrp > current ? ((input.mrp - current) / input.mrp) * 100 : null;
  const confidence: Outlook["confidence"] = n >= 20 && days >= 45 ? "high" : n >= 7 && days >= 14 ? "medium" : "low";

  const stats: Outlook["stats"] = {
    points: n,
    days,
    low,
    lowAt: lowPoint ? new Date(lowPoint.t).toISOString() : null,
    high,
    typical,
    trendPerWeekPct,
    mrpOffPct,
  };

  if (current == null) {
    return {
      verdict: "unknown",
      headline: "Add a price to get an outlook",
      confidence: "low",
      reasons: ["No price has been recorded for this item yet."],
      projection: [],
      projectedLow: null,
      sale: saleInfo,
      stats,
    };
  }

  // ----- projection -----
  const trendWeight = n >= 5 && days >= 10 ? 0.5 : 0; // damp the trend; it rarely continues linearly
  const floor = n >= 3 && low != null ? low * 0.95 : current * 0.9;
  const ceil = n >= 3 && high != null ? Math.max(high, current) * 1.05 : current * 1.1;
  const saleStartDay = sale ? (sale.inProgress ? 0 : sale.daysAway) : Infinity;
  const saleEndDay = sale ? Math.ceil((+sale.end - +now) / DAY) : -Infinity;
  const usual = typical ?? current;
  // In a sale, the drop is measured from the usual (non-sale) price, but never below
  // a little under the historical low if we have enough history to know it.
  const salePrice = sale
    ? Math.min(current, Math.max(usual * (1 - sale.drop), n >= 5 && low != null ? low * 0.95 : 0))
    : current;

  const projection: ProjectionPoint[] = [];
  for (let d = 1; d <= HORIZON; d++) {
    let mid = Math.min(ceil, Math.max(floor, current + slopePerDay * d * trendWeight));
    if (sale && !sale.inProgress && d >= saleStartDay - 2 && d <= saleEndDay) {
      const ease = Math.min(1, (d - (saleStartDay - 2)) / 2);
      mid = Math.min(mid, current - (current - salePrice) * ease);
    }
    if (sale?.inProgress && d > saleEndDay && usual > current) {
      const ease = Math.min(1, (d - saleEndDay) / 5);
      mid = current + (usual - current) * ease; // prices usually bounce back after a sale ends
    }
    const band = baseBand * Math.sqrt(d / HORIZON) + 0.01;
    projection.push({ date: new Date(+now + d * DAY).toISOString(), mid, lo: mid * (1 - band), hi: mid * (1 + band) });
  }
  const minPoint = projection.reduce((a, b) => (b.mid < a.mid ? b : a), projection[0]);
  const projectedLow =
    minPoint.mid < current * 0.985
      ? {
          price: Math.round(minPoint.mid),
          date: minPoint.date,
          why:
            sale && !sale.inProgress && +new Date(minPoint.date) >= +sale.start - 2 * DAY
              ? `during ${sale.name}`
              : "if the recent downward trend continues",
        }
      : null;

  // ----- reasons (always shown, whatever the verdict) -----
  const reasons: string[] = [];
  if (n <= 1) reasons.push("Tracking just started. The outlook gets sharper as daily checks build up history.");
  else reasons.push(`Tracked for ${days} day${days === 1 ? "" : "s"} across ${n} price checks.`);
  if (n >= 2 && low != null && high != null && low !== high)
    reasons.push(`Lowest seen ${inr(low)} (${shortDate(new Date(lowPoint!.t))}), highest ${inr(high)}.`);
  if (typical && Math.abs(current - typical) / typical > 0.02)
    reasons.push(
      `Now ${pct(((current - typical) / typical) * 100)} ${current < typical ? "below" : "above"} its usual price of ${inr(typical)}.`,
    );
  if (trendPerWeekPct != null && Math.abs(trendPerWeekPct) >= 0.5)
    reasons.push(`Trending ${trendPerWeekPct < 0 ? "down" : "up"} about ${pct(trendPerWeekPct)} a week over the last month.`);
  if (mrpOffPct != null && mrpOffPct >= 5) reasons.push(`${pct(mrpOffPct)} off the listed MRP of ${inr(input.mrp!)}.`);
  if (sale) {
    const range = `${pct(sale.drop * 100)}`;
    reasons.push(
      sale.inProgress
        ? `${sale.name} are on until about ${shortDate(sale.end)}. Prices in this category typically dip around ${range} during them, then recover.`
        : `${sale.name} typically start around ${shortDate(sale.start)} (in ~${sale.daysAway} days); this category usually dips around ${range}.`,
    );
  }
  if (input.targetPrice && current > input.targetPrice)
    reasons.push(`${inr(current - input.targetPrice)} above your target of ${inr(input.targetPrice)}.`);

  // ----- verdict -----
  const out = (verdict: Verdict, headline: string): Outlook => ({
    verdict,
    headline,
    confidence,
    reasons,
    projection,
    projectedLow,
    sale: saleInfo,
    stats,
  });

  if (input.targetPrice && current <= input.targetPrice) return out("buy", "Your target price is hit");
  if (n >= 5 && low != null && current <= low * 1.01) return out("buy", "Lowest price since tracking began");
  if (sale?.inProgress && typical != null && current <= typical * 0.97)
    return out("good", "Sale price. Unlikely to be much lower soon");
  if (sale?.inProgress && typical == null) {
    // No history yet, so we can't tell a real sale price from a fake "deal".
    if (mrpOffPct != null && mrpOffPct >= 20) return out("good", "Sale season, and a solid discount off MRP");
    return out("watch", "Sale season, but no proof yet that this is a deal");
  }
  if (sale && !sale.inProgress && sale.daysAway <= 21 && salePrice < current * 0.95)
    return out("wait", `Worth waiting ~${sale.daysAway} days for ${sale.name.split(" (")[0]}`);
  if (trendPerWeekPct != null && trendPerWeekPct <= -1.5 && n >= 5) return out("wait", "Price is sliding. Give it a week");
  if (typical && current >= typical * 1.05) return out("wait", "Above its usual price right now");
  if (mrpOffPct != null && mrpOffPct >= 40) return out("good", "Deep discount off MRP");
  return out("watch", n < 5 ? "Fair price, but little history yet" : "Fair price, no strong reason to wait");
}
