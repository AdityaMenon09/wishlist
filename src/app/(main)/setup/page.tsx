import type { Metadata } from "next";
import { headers } from "next/headers";
import { CircleCheck, CircleDashed, LogOut, MonitorSmartphone, MousePointerClick, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import { BookmarkletLink } from "@/components/BookmarkletLink";
import { PageHeader } from "@/components/ui";
import { logout } from "@/lib/actions";
import { authEnabled } from "@/lib/auth";
import { bookmarkletHref } from "@/lib/bookmarklet";

export const metadata: Metadata = { title: "Setup" };

function Status({ ok, label, children }: { ok: boolean; label: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 py-3">
      {ok ? (
        <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-down" />
      ) : (
        <CircleDashed aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" />
      )}
      <div>
        <p className="font-semibold">
          {label} <span className="sr-only">{ok ? "(configured)" : "(not configured)"}</span>
        </p>
        <p className="text-sm text-muted">{children}</p>
      </div>
    </li>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-link">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

export default async function SetupPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const env = {
    db: Boolean(process.env.DATABASE_URL),
    auth: authEnabled(),
    cron: Boolean(process.env.CRON_SECRET),
    serp: Boolean(process.env.SERPAPI_KEY),
  };

  return (
    <>
      <PageHeader title="Setup" subtitle="Capture products from any store, even the ones that block automatic checks." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="bm-h" className="card p-5 sm:p-6 lg:col-span-2">
          <h2 id="bm-h" className="flex items-center gap-2 font-display text-lg font-semibold">
            <MousePointerClick aria-hidden className="size-5 text-link" /> The bookmarklet
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Amazon and Flipkart often block servers from reading their pages. The bookmarklet runs in <em>your</em> browser on the product
            page you already have open, so nothing gets blocked. Use it to add a product or to record today&apos;s price.
          </p>
          <div className="mt-5">
            <BookmarkletLink href={bookmarkletHref(origin)} />
          </div>
          <ol className="mt-5 space-y-2.5 text-sm">
            <Step n={1}>Show your bookmarks bar (Ctrl+Shift+B in Chrome and Edge).</Step>
            <Step n={2}>Drag the blue <strong>+ WishList</strong> button onto it.</Step>
            <Step n={3}>Open any product page and click the bookmark. A WishList tab opens with the product saved.</Step>
          </ol>
          {origin.startsWith("http://localhost") && (
            <p className="mt-4 rounded-xl bg-warn-bg px-3 py-2 text-sm text-fg">
              This bookmarklet points at <code>localhost</code>. Once the site is deployed, reinstall it from the live site.
            </p>
          )}
        </section>

        <section aria-labelledby="phone-h" className="card p-5 sm:p-6">
          <h2 id="phone-h" className="flex items-center gap-2 font-display text-lg font-semibold">
            <Smartphone aria-hidden className="size-5 text-link" /> On your phone
          </h2>
          <p className="mt-3 text-sm font-semibold">Option A: share links to the app</p>
          <ol className="mt-2 space-y-2.5 text-sm">
            <Step n={1}>Open this site in Chrome and choose <strong>Add to Home screen</strong> (or Install app).</Step>
            <Step n={2}>In the Amazon or Flipkart app, tap Share on a product and pick <strong>WishList</strong>.</Step>
          </ol>
          <p className="mt-2 text-xs text-muted">The server then fetches the page. If the store blocks it, the item is saved and you can add the price later.</p>
          <p className="mt-5 text-sm font-semibold">Option B: bookmarklet in Chrome for Android</p>
          <ol className="mt-2 space-y-2.5 text-sm">
            <Step n={1}>Tap <strong>Copy code</strong> above.</Step>
            <Step n={2}>Bookmark any page, then edit that bookmark: name it <strong>wl</strong> and paste the code as its URL.</Step>
            <Step n={3}>On a product page in Chrome, type <strong>wl</strong> in the address bar and tap the bookmark.</Step>
          </ol>
        </section>

        <section aria-labelledby="status-h" className="card p-5 sm:p-6">
          <h2 id="status-h" className="flex items-center gap-2 font-display text-lg font-semibold">
            <MonitorSmartphone aria-hidden className="size-5 text-link" /> Status
          </h2>
          <ul className="mt-2 divide-y divide-line">
            <Status ok={env.db} label="Cloud database">
              {env.db ? "Connected to Postgres." : "Using the local database in .data/. On Vercel, add a Neon database (Storage tab)."}
            </Status>
            <Status ok={env.auth} label="Password">
              {env.auth ? "The site is locked with APP_PASSWORD." : "No APP_PASSWORD set. Fine locally; the deployed site stays locked until you set one."}
            </Status>
            <Status ok={env.cron} label="Daily price checks">
              {env.cron ? "Runs every morning at 8:00 IST." : "Set CRON_SECRET on Vercel to enable the 8:00 IST daily check."}
            </Status>
            <Status ok={env.serp} label="Live price comparison">
              {env.serp
                ? "SerpApi key found. The Compare panel can fetch real prices."
                : "Optional. Add a free SERPAPI_KEY for real prices from other stores; otherwise you get search links."}
            </Status>
          </ul>
          {env.auth && (
            <form action={logout} className="mt-4">
              <button type="submit" className="btn-ghost">
                <LogOut aria-hidden className="size-4" /> Sign out
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
