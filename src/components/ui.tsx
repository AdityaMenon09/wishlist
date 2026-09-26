import type { ReactNode } from "react";
import { inr } from "@/lib/format";

/** Big editorial page title. `kicker` is the small mono line above it. */
export function PageHeader({
  kicker,
  title,
  children,
  action,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 sm:mb-14">
      <div className="min-w-0 max-w-3xl">
        {kicker && <p className="meta mb-3">{kicker}</p>}
        <h1 className="display text-[40px] sm:text-[56px]">{title}</h1>
        {children && <div className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-2">{children}</div>}
      </div>
      {action}
    </header>
  );
}

/**
 * A spec-sheet section: numbered mono label in a narrow left column, content on the right,
 * separated from the previous section by a hairline. Replaces boxed "cards".
 */
export function Section({
  index,
  title,
  aside,
  children,
  id,
}: {
  index?: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  const headingId = id ?? `s-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className="grid gap-x-10 gap-y-4 border-t border-rule py-8 sm:py-10 md:grid-cols-[180px_minmax(0,1fr)]">
      <div>
        <h2 id={headingId} className="meta flex gap-3 text-ink">
          {index && <span className="text-muted">{index}</span>}
          {title}
        </h2>
        {aside && <div className="mt-2 text-[13px] text-muted">{aside}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** A figure with a small mono label, for key numbers. No box. */
export function Figure({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: "down" | "up" }) {
  return (
    <div className="min-w-0">
      <p className="meta">{label}</p>
      <p className={`display tabular mt-2 text-[32px] sm:text-[36px] ${tone === "down" ? "text-down" : tone === "up" ? "text-up" : ""}`}>{value}</p>
      {note && <p className="mt-1 text-[13px] text-muted">{note}</p>}
    </div>
  );
}

/** Price change as text: "↓ 1.8%". Direction is carried by the arrow and a word for screen readers. */
export function Delta({ from, to, className = "" }: { from: number | null; to: number | null; className?: string }) {
  if (from == null || to == null || from === to) return null;
  const down = to < from;
  const pct = Math.abs(((to - from) / from) * 100);
  return (
    <span className={`tabular font-mono text-[12.5px] ${down ? "text-down" : "text-up"} ${className}`} title={`${down ? "Down" : "Up"} from ${inr(from)}`}>
      <span aria-hidden>{down ? "↓" : "↑"}</span>
      <span className="sr-only">{down ? "down" : "up"}</span> {pct < 10 ? pct.toFixed(1) : pct.toFixed(0)}%
    </span>
  );
}

/** Tiny trend line, drawn in ink. */
export function Sparkline({ values, className = "" }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const w = 64;
  const h = 18;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 1.5 - ((v - min) / span) * (h - 3)}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-[18px] w-16 ${className}`} aria-hidden preserveAspectRatio="none">
      <polyline points={pts.join(" ")} fill="none" strokeWidth="1.25" className="stroke-ink-2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Inline message. A left rule and a tinted wash, never a floating box. */
export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "success"; children: ReactNode }) {
  const styles = {
    info: "border-ink bg-paper/60",
    warn: "border-warn bg-warn-soft",
    success: "border-down bg-down-soft",
  }[tone];
  return (
    <div role={tone === "warn" ? "alert" : "status"} className={`border-l-2 px-4 py-3 text-[14px] leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border-t border-rule py-16 text-center sm:py-24">
      <p className="display text-[28px] sm:text-[32px]">{title}</p>
      {children && <div className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">{children}</div>}
    </div>
  );
}
