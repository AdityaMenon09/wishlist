"use client";

import { useEffect, useRef, useState } from "react";

/**
 * React refuses to render `javascript:` hrefs, so the bookmarklet URL is attached after
 * mount. The link is only for dragging to the bookmarks bar; clicking it here does nothing.
 */
export function BookmarkletLink({ href }: { href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    ref.current?.setAttribute("href", href);
  }, [href]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <a ref={ref} onClick={(e) => e.preventDefault()} className="btn-primary cursor-grab active:cursor-grabbing" title="Drag me to your bookmarks bar">
        + WishList
      </a>
      <span className="meta">← drag to bookmarks bar</span>
      <button
        type="button"
        className="btn-text"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            prompt("Copy this code:", href);
          }
        }}
      >
        {copied ? "Copied" : "Copy code"}
      </button>
    </div>
  );
}
