import { ViewTransition, type ReactNode } from "react";

/**
 * Wraps a page so navigations animate by meaning: `nav-forward` / `nav-back` slide (list ↔ item),
 * `nav-section` lifts (top nav). Untyped transitions (browser back, refreshes, server actions)
 * don't move the page. Lives in each page.tsx, since layouts persist across navigations.
 */
const BY_TYPE = { "nav-forward": "vt-forward", "nav-back": "vt-back", "nav-section": "vt-section", default: "none" };

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={BY_TYPE} exit={BY_TYPE} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
