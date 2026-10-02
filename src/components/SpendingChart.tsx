"use client";

import type { CSSProperties } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { inr } from "@/lib/format";
import { useInView } from "./motion";
import { useThemeColors } from "./useThemeColors";

const MONO = "var(--font-plex-mono), ui-monospace, monospace";

/** Six thin monthly bars; the selected month in ink, the rest in a quiet rule tone. */
export function SpendingChart({ data, highlight }: { data: { label: string; month: string; total: number }[]; highlight?: string }) {
  const c = useThemeColors();
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  return (
    <div ref={ref} data-shown={seen} className="h-40" role="img" aria-label={`Monthly spending: ${data.map((d) => `${d.label} ${inr(d.total)}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tick={{ fill: c.muted, fontSize: 11, fontFamily: MONO }} axisLine={{ stroke: c.rule }} tickLine={false} tickMargin={8} />
          <Tooltip
            cursor={false}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="border border-rule bg-paper px-3 py-2 text-[13px]">
                  <p className="meta">{payload[0].payload.label}</p>
                  <p className="tabular mt-0.5">{inr(Number(payload[0].value))}</p>
                </div>
              ) : null
            }
          />
          <Bar
            dataKey="total"
            maxBarSize={28}
            isAnimationActive={false}
            shape={(props: { x?: number; y?: number; width?: number; height?: number; index?: number; payload?: { month: string } }) => (
              <rect
                x={props.x}
                y={props.y}
                width={props.width}
                height={Math.max(0, props.height ?? 0)}
                fill={props.payload?.month === highlight ? c.ink : c.rule}
                className="bar-rise"
                style={{ "--i": props.index ?? 0 } as CSSProperties}
              />
            )}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
