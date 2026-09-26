"use client";

import { Bookmark, Check, Copy } from "lucide-react";
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
    <div className="flex flex-wrap items-center gap-3">
      <a
        ref={ref}
        onClick={(e) => e.preventDefault()}
        className="btn-primary cursor-grab active:cursor-grabbing"
        title="Drag me to your bookmarks bar"
      >
        <Bookmark aria-hidden className="size-4" /> + WishList
      </a>
      <button
        type="button"
        className="btn-ghost"
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
        {copied ? <Check aria-hidden className="size-4 text-down" /> : <Copy aria-hidden className="size-4" />}
        {copied ? "Copied" : "Copy code (for phones)"}
      </button>
    </div>
  );
}
