"use client";

import { useSyncExternalStore } from "react";

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
  return (
    <button
      type="button"
      className="meta min-h-11 cursor-pointer px-2 transition-colors duration-200 hover:text-ink"
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("wl-theme", next);
        } catch {
          /* private mode: the choice just won't persist */
        }
      }}
    >
      {next}
    </button>
  );
}
