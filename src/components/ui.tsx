import { AlertTriangle, CheckCircle2, Info, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { inr } from "@/lib/format";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "down" | "up";
}) {
  const color = tone === "down" ? "text-down" : tone === "up" ? "text-up" : "text-fg";
  return (
    <div className="card p-4 sm:p-5">
      <p className="eyebrow">{label}</p>
      <p className={`tabular mt-2 font-display text-2xl font-semibold tracking-tight ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** Price change badge. Direction is shown by icon + sign, not colour alone. */
export function Delta({ from, to, size = "sm" }: { from: number | null; to: number | null; size?: "sm" | "md" }) {
  if (from == null || to == null || from === to) return null;
  const down = to < from;
  const pct = Math.abs(((to - from) / from) * 100);
  const Icon = down ? TrendingDown : TrendingUp;
  return (
    <span
      className={`tabular inline-flex items-center gap-1 rounded-full font-semibold ${
        size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs"
      } ${down ? "bg-down-bg text-down" : "bg-up-bg text-up"}`}
      title={`${down ? "Down" : "Up"} from ${inr(from)}`}
    >
      <Icon aria-hidden className="size-3.5" />
      <span className="sr-only">{down ? "Down" : "Up"}</span>
      {down ? "−" : "+"}
      {pct < 10 ? pct.toFixed(1) : pct.toFixed(0)}%
    </span>
  );
}

/** Tiny inline trend line, rendered on the server. */
export function Sparkline({ values, className = "" }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const w = 96;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - min) / span) * (h - 4)}`);
  const falling = values[values.length - 1] < values[0];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-7 w-24 ${className}`} aria-hidden preserveAspectRatio="none">
      <polyline
        points={pts.join(" ")}
        fill="none"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        className={falling ? "stroke-down" : "stroke-chart"}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "success"; children: ReactNode }) {
  const styles = {
    info: "border-link/30 bg-surface-2 text-fg",
    warn: "border-warn/30 bg-warn-bg text-fg",
    success: "border-down/30 bg-down-bg text-fg",
  }[tone];
  const Icon = tone === "warn" ? AlertTriangle : tone === "success" ? CheckCircle2 : Info;
  const iconColor = tone === "warn" ? "text-warn" : tone === "success" ? "text-down" : "text-link";
  return (
    <div role={tone === "warn" ? "alert" : "status"} className={`flex gap-3 rounded-xl border p-4 text-sm ${styles}`}>
      <Icon aria-hidden className={`mt-0.5 size-4 shrink-0 ${iconColor}`} />
      <div className="min-w-0 space-y-1">{children}</div>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface-2 text-link">{icon}</div>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children && <div className="mt-2 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}
