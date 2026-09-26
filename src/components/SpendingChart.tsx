"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr, inrShort } from "@/lib/format";
import { useThemeColors } from "./useThemeColors";

export function SpendingChart({ data, highlight }: { data: { label: string; month: string; total: number }[]; highlight?: string }) {
  const c = useThemeColors();
  return (
    <div className="h-56" role="img" aria-label={`Monthly spending: ${data.map((d) => `${d.label} ${inr(d.total)}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={c.line} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: c.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis width={52} tickFormatter={inrShort} tick={{ fill: c.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: c["surface-2"] }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-soft">
                  <p className="text-xs text-muted">{payload[0].payload.label}</p>
                  <p className="tabular font-semibold">{inr(Number(payload[0].value))}</p>
                </div>
              ) : null
            }
          />
          <Bar
            dataKey="total"
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
            isAnimationActive={false}
            shape={(props: { x?: number; y?: number; width?: number; height?: number; payload?: { month: string } }) => (
              <rect
                x={props.x}
                y={props.y}
                width={props.width}
                height={props.height}
                rx={6}
                fill={props.payload?.month === highlight ? c.chart : c.muted}
                fillOpacity={props.payload?.month === highlight ? 1 : 0.35}
              />
            )}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
