"use client";

import { useSyncExternalStore, type MouseEvent } from "react";

const media = () => matchMedia("(prefers-color-scheme: dark)");

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = media();
  mq.addEventListener("change", cb);
  return () => {
    obs.disconnect();
    mq.removeEventListener("change", cb);
  };
}

/** The theme actually showing: an explicit choice, else the system setting. */
function current(): "light" | "dark" {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return media().matches ? "dark" : "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, current, () => "light" as const);
  const next = theme === "dark" ? "light" : "dark";

  const flip = (e: MouseEvent<HTMLButtonElement>) => {
    const root = document.documentElement;
    const apply = () => {
      root.dataset.theme = next;
      try {
        localStorage.setItem("wl-theme", next);
      } catch {
        /* private mode: the choice just won't persist */
      }
    };
    if (!document.startViewTransition) return apply();
    // The new theme spreads out from the toggle itself.
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    root.style.setProperty("--vt-cx", `${x}px`);
    root.style.setProperty("--vt-cy", `${y}px`);
    root.style.setProperty("--vt-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
    root.dataset.vt = "theme";
    const t = document.startViewTransition(apply);
    t.finished.finally(() => delete root.dataset.vt);
  };

  return (
    <button
      type="button"
      className="meta min-h-11 cursor-pointer px-2 transition-colors duration-200 hover:text-ink"
      aria-label={`Switch to ${next} theme`}
      onClick={flip}
    >
      {next}
    </button>
  );
}
