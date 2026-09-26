"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { captureShared, captureSnapshot } from "@/lib/actions";

/**
 * Landing page for two entry points:
 *  - the bookmarklet:  /capture#g=<gzipped snapshot> (the fragment never hits the server logs)
 *  - the Android share sheet (PWA share target):  /capture?text=…&title=…
 */
export function Capture() {
  const router = useRouter();
  const [status, setStatus] = useState("Reading the product page…");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // StrictMode runs effects twice in dev
    started.current = true;
    (async () => {
      const hash = new URLSearchParams(location.hash.slice(1));
      const query = new URLSearchParams(location.search);
      const kind = hash.has("g") ? "g" : hash.has("p") ? "p" : null;
      history.replaceState(null, "", "/capture");

      let result: { id?: number; error?: string };
      if (kind) {
        setStatus("Saving to your wishlist…");
        result = await captureSnapshot(kind, hash.get(kind)!);
      } else if (query.get("text") || query.get("url")) {
        setStatus("Fetching the product…");
        result = await captureShared(`${query.get("url") ?? ""} ${query.get("text") ?? ""}`, query.get("title") ?? "");
      } else {
        result = { error: "Nothing to capture. Use the bookmarklet on a product page." };
      }
      if (result.id) router.replace(`/item/${result.id}?captured=1`);
      else {
        document.title = "Couldn't capture · WishList";
        setError(result.error ?? "Something went wrong.");
      }
    })().catch(() => setError("Couldn't save that. Check you're signed in and try again."));
  }, [router]);

  if (error)
    return (
      <div role="alert" className="mt-4 space-y-4">
        <p className="font-display text-lg font-semibold">Couldn&apos;t capture that page</p>
        <p className="text-sm text-muted">{error}</p>
        <Link href="/wishlist" className="btn-ghost">
          Go to wishlist
        </Link>
      </div>
    );
  return (
    <div role="status" className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
      <Loader2 aria-hidden className="size-4 animate-spin" /> {status}
    </div>
  );
}
