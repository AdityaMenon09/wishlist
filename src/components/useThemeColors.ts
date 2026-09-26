"use client";

import { useMemo, useSyncExternalStore } from "react";

const KEYS = ["chart", "forecast", "down", "up", "muted", "line", "fg", "surface", "surface-2", "link"] as const;
type Colors = Record<(typeof KEYS)[number], string>;

const FALLBACK: Colors = {
  chart: "#60a5fa",
  forecast: "#fb923c",
  down: "#34d399",
  up: "#f87171",
  muted: "#94a3b8",
  line: "rgba(255,255,255,0.08)",
  fg: "#f1f5f9",
  surface: "#121b2f",
  "surface-2": "#1a2540",
  link: "#7aa7ff",
};
const FALLBACK_KEY = JSON.stringify(FALLBACK);

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

// Snapshots must be stable between calls, so compare as a string.
function snapshot(): string {
  const cs = getComputedStyle(document.documentElement);
  return JSON.stringify(Object.fromEntries(KEYS.map((k) => [k, cs.getPropertyValue(`--${k}`).trim() || FALLBACK[k]])));
}

/** SVG chart libraries need concrete colours, so resolve the CSS tokens (and follow theme switches). */
export function useThemeColors(): Colors {
  const key = useSyncExternalStore(subscribe, snapshot, () => FALLBACK_KEY);
  return useMemo(() => JSON.parse(key) as Colors, [key]);
}
