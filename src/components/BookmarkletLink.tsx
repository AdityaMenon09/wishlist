"use client";

import { Check } from "lucide-react";
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
      <a
        ref={ref}
        onClick={(e) => e.preventDefault()}
        className="btn-primary cursor-grab transition-[rotate,opacity,scale] duration-300 ease-(--ease-out) hover:-rotate-3 active:cursor-grabbing motion-reduce:hover:rotate-0"
        title="Drag me to your bookmarks bar"
      >
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
        {copied ? (
          <span key="done" className="anim-rise inline-flex items-center gap-1.5 text-down">
            <Check aria-hidden className="size-4" /> Copied
          </span>
        ) : (
          "Copy code"
        )}
      </button>
    </div>
  );
}
