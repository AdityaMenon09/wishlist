"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { inr, inrShort } from "@/lib/format";
import type { ProjectionPoint } from "@/lib/outlook";
import { useThemeColors } from "./useThemeColors";

type Point = { t: number; price?: number; mid?: number; band?: [number, number] };

const dateFmt = (t: number) =>
  new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export function PriceChart({
  history,
  projection,
  target,
}: {
  history: { t: string; price: number }[];
  projection: ProjectionPoint[];
  target: number | null;
}) {
  const c = useThemeColors();
  const [showProjection, setShowProjection] = useState(true);

  const data = useMemo<Point[]>(() => {
    const h = history.map((p) => ({ t: Date.parse(p.t), price: p.price }));
    if (!showProjection || projection.length === 0 || h.length === 0) return h as Point[];
    const last = h[h.length - 1];
    // Extend the actual line to "now" and start the projection from the same spot so they join.
    const now = Date.parse(projection[0].date) - 86_400_000;
    const bridge: Point = { t: Math.max(now, last.t), price: last.price, mid: last.price, band: [last.price, last.price] };
    const proj = projection.map((p) => ({ t: Date.parse(p.date), mid: Math.round(p.mid), band: [Math.round(p.lo), Math.round(p.hi)] as [number, number] }));
    return [...h, bridge, ...proj];
  }, [history, projection, showProjection]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-4 text-xs text-muted" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <svg width="18" height="6" aria-hidden><line x1="0" y1="3" x2="18" y2="3" stroke={c.chart} strokeWidth="2.5" /></svg>
            Actual price (solid)
          </li>
          {showProjection && projection.length > 0 && (
            <li className="flex items-center gap-1.5">
              <svg width="18" height="6" aria-hidden><line x1="0" y1="3" x2="18" y2="3" stroke={c.forecast} strokeWidth="2.5" strokeDasharray="4 3" /></svg>
              Projection (dashed, shaded = likely range)
            </li>
          )}
          {target != null && (
            <li className="flex items-center gap-1.5">
              <svg width="18" height="6" aria-hidden><line x1="0" y1="3" x2="18" y2="3" stroke={c.down} strokeWidth="2" strokeDasharray="2 3" /></svg>
              Your target
            </li>
          )}
        </ul>
        {projection.length > 0 && (
          <button
            type="button"
            aria-pressed={showProjection}
            onClick={() => setShowProjection((s) => !s)}
            className="btn-ghost min-h-9 rounded-lg px-3 text-xs"
          >
            {showProjection ? "Hide projection" : "Show projection"}
          </button>
        )}
      </div>
      <div className="h-64 sm:h-72" role="img" aria-label="Price history chart. A table version is available below.">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={c.line} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={dateFmt}
              tick={{ fill: c.muted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              width={56}
              domain={[(min: number) => Math.floor(min * 0.95), (max: number) => Math.ceil(max * 1.03)]}
              tickFormatter={inrShort}
              tick={{ fill: c.muted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ stroke: c.muted, strokeDasharray: "3 3" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as Point;
                return (
                  <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-soft">
                    <p className="text-xs text-muted">{dateFmt(Number(label))}</p>
                    {p.price != null && <p className="tabular font-semibold">{inr(p.price)}</p>}
                    {p.price == null && p.mid != null && (
                      <>
                        <p className="tabular font-semibold text-forecast">~{inr(p.mid)} projected</p>
                        {p.band && (
                          <p className="tabular text-xs text-muted">
                            likely {inr(p.band[0])} – {inr(p.band[1])}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              }}
            />
            {showProjection && (
              <Area dataKey="band" stroke="none" fill={c.forecast} fillOpacity={0.15} isAnimationActive={false} connectNulls={false} />
            )}
            <Area
              dataKey="price"
              type="stepAfter"
              stroke={c.chart}
              strokeWidth={2.5}
              fill={c.chart}
              fillOpacity={0.12}
              dot={data.length < 12 ? { r: 3, fill: c.chart, strokeWidth: 0 } : false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              connectNulls
            />
            {showProjection && (
              <Line dataKey="mid" stroke={c.forecast} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
            )}
            {target != null && <ReferenceLine y={target} stroke={c.down} strokeDasharray="2 4" strokeWidth={1.5} ifOverflow="extendDomain" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
