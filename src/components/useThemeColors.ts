"use client";

import { useMemo, useSyncExternalStore } from "react";

const KEYS = ["chart", "forecast", "down", "up", "muted", "rule", "ink", "paper", "bg"] as const;
type Colors = Record<(typeof KEYS)[number], string>;

const FALLBACK: Colors = {
  chart: "#1d1b18",
  forecast: "#c2410c",
  down: "#2f7d4f",
  up: "#b3261e",
  muted: "#6f6a62",
  rule: "#ddd8d0",
  ink: "#1d1b18",
  paper: "#ffffff",
  bg: "#f2efea",
};
const FALLBACK_KEY = JSON.stringify(FALLBACK);

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => {
    obs.disconnect();
    mq.removeEventListener("change", cb);
  };
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
