"use client";

import { useMemo, useState } from "react";
import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr, inrShort } from "@/lib/format";
import type { ProjectionPoint } from "@/lib/outlook";
import { useThemeColors } from "./useThemeColors";

type Point = { t: number; price?: number; mid?: number; band?: [number, number] };

const dateFmt = (t: number) =>
  new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

const MONO = "var(--font-plex-mono), ui-monospace, monospace";

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
    const proj = projection.map((p) => ({
      t: Date.parse(p.date),
      mid: Math.round(p.mid),
      band: [Math.round(p.lo), Math.round(p.hi)] as [number, number],
    }));
    return [...h, bridge, ...proj];
  }, [history, projection, showProjection]);

  const tick = { fill: c.muted, fontSize: 11, fontFamily: MONO };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2" aria-label="Legend">
          <li className="flex items-center gap-2">
            <svg width="20" height="6" aria-hidden><line x1="0" y1="3" x2="20" y2="3" stroke={c.chart} strokeWidth="1.75" /></svg>
            Price
          </li>
          {showProjection && projection.length > 0 && (
            <li className="flex items-center gap-2">
              <svg width="20" height="6" aria-hidden><line x1="0" y1="3" x2="20" y2="3" stroke={c.forecast} strokeWidth="1.75" strokeDasharray="4 3" /></svg>
              Projection, with likely range
            </li>
          )}
          {target != null && (
            <li className="flex items-center gap-2">
              <svg width="20" height="6" aria-hidden><line x1="0" y1="3" x2="20" y2="3" stroke={c.down} strokeWidth="1.5" strokeDasharray="1 3" /></svg>
              Your target
            </li>
          )}
        </ul>
        {projection.length > 0 && (
          <button type="button" aria-pressed={showProjection} onClick={() => setShowProjection((s) => !s)} className="btn-text min-h-9 text-[13px]">
            {showProjection ? "Hide projection" : "Show projection"}
          </button>
        )}
      </div>
      <div className="h-60 sm:h-72" role="img" aria-label="Price history chart. A table version is below.">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={dateFmt}
              tick={tick}
              axisLine={{ stroke: c.rule }}
              tickLine={false}
              minTickGap={48}
              tickMargin={10}
            />
            <YAxis
              width={48}
              orientation="right"
              domain={[(min: number) => Math.floor(min * 0.95), (max: number) => Math.ceil(max * 1.03)]}
              tickFormatter={inrShort}
              tick={tick}
              axisLine={false}
              tickLine={false}
              tickCount={4}
            />
            <Tooltip
              cursor={{ stroke: c.muted, strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as Point;
                return (
                  <div className="border border-rule bg-paper px-3 py-2 text-[13px]">
                    <p className="meta">{dateFmt(Number(label))}</p>
                    {p.price != null && <p className="tabular mt-0.5 text-ink">{inr(p.price)}</p>}
                    {p.price == null && p.mid != null && (
                      <>
                        <p className="tabular mt-0.5 text-forecast">~{inr(p.mid)} projected</p>
                        {p.band && <p className="tabular text-muted">likely {inr(p.band[0])}–{inr(p.band[1])}</p>}
                      </>
                    )}
                  </div>
                );
              }}
            />
            {showProjection && <Area dataKey="band" stroke="none" fill={c.forecast} fillOpacity={0.1} isAnimationActive={false} />}
            <Area
              dataKey="price"
              type="stepAfter"
              stroke={c.chart}
              strokeWidth={1.75}
              fill={c.chart}
              fillOpacity={0.025}
              dot={false}
              activeDot={{ r: 3.5, fill: c.chart, strokeWidth: 0 }}
              isAnimationActive={false}
              connectNulls
            />
            {showProjection && (
              <Line dataKey="mid" stroke={c.forecast} strokeWidth={1.75} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            )}
            {target != null && <ReferenceLine y={target} stroke={c.down} strokeDasharray="1 4" strokeWidth={1.5} ifOverflow="extendDomain" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
