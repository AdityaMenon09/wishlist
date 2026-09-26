const inr0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

/** ₹1,29,999 (Indian digit grouping); paise only when present. */
export function inr(n: number | null | undefined): string {
  if (n == null) return "—";
  return (Number.isInteger(Math.round(n * 100) / 100) ? inr0 : inr2).format(n);
}

/** ₹1.2L / ₹12.5k for tight spaces like chart axes. */
export function inrShort(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1).replace(/\.0$/, "")}k`;
  return `₹${Math.round(n)}`;
}

const TZ = "Asia/Kolkata";

/** Today's date in India as YYYY-MM-DD (servers run in UTC). */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function thisMonthIST(): string {
  return todayIST().slice(0, 7);
}

export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string, style: "long" | "short" = "long"): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month: style,
    year: style === "long" ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

export function dayLabel(ymd: string): string {
  const today = todayIST();
  if (ymd === today) return "Today";
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const yesterday = new Date(Date.parse(today + "T00:00:00Z") - 86_400_000).toISOString().slice(0, 10);
  if (ymd === yesterday) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export function relativeTime(isoStr: string): string {
  const diff = Date.now() - Date.parse(isoStr);
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(isoStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}

export function shortDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: TZ });
}
