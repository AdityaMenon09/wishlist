import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { BookmarkletLink } from "@/components/BookmarkletLink";
import { PageTransition } from "@/components/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageHeader, Section } from "@/components/ui";
import { logout } from "@/lib/actions";
import { authEnabled } from "@/lib/auth";
import { bookmarkletHref } from "@/lib/bookmarklet";

export const metadata: Metadata = { title: "Setup" };

function Steps({ children }: { children: ReactNode }) {
  return <ol className="mt-4 max-w-2xl space-y-3 text-[15px] leading-relaxed text-ink-2 [counter-reset:step]">{children}</ol>;
}

function Step({ children }: { children: ReactNode }) {
  return (
    <li className="grid grid-cols-[2rem_1fr] [counter-increment:step] before:font-mono before:text-[12px] before:leading-[1.9] before:text-muted before:content-[counter(step,decimal-leading-zero)]">
      <span>{children}</span>
    </li>
  );
}

function Status({ ok, label, children }: { ok: boolean; label: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1 border-b border-rule py-4 sm:grid-cols-[200px_minmax(0,1fr)_auto]">
      <p className="text-[15px]">{label}</p>
      <p className="order-3 col-span-2 text-[14px] text-muted sm:order-none sm:col-span-1">{children}</p>
      <p className={`meta ${ok ? "text-down" : ""}`}>{ok ? "On" : "Off"}</p>
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
    <PageTransition>
      <PageHeader kicker="Setup" title="Capture from anywhere.">
        Amazon and Flipkart often block servers from reading their pages. These run from <em>your</em> browser or phone instead.
      </PageHeader>

      <Section index="01" title="Bookmarklet" aside="Desktop">
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-2">
          A bookmark that reads the product page you already have open and saves it here. Use it to add something, or to log today&apos;s
          price.
        </p>
        <div className="mt-6">
          <BookmarkletLink href={bookmarkletHref(origin)} />
        </div>
        <Steps>
          <Step>Show your bookmarks bar (Ctrl+Shift+B in Chrome and Edge).</Step>
          <Step>
            Drag <span className="text-ink">+ WishList</span> onto it.
          </Step>
          <Step>On any product page, click it. A WishList tab opens with the product saved.</Step>
        </Steps>
        {origin.startsWith("http://localhost") && (
          <p className="mt-6 border-l-2 border-warn bg-warn-soft px-4 py-3 text-[14px]">
            This one points at <code>localhost</code>. Reinstall it from the live site once deployed.
          </p>
        )}
      </Section>

      <Section index="02" title="Phone" aside="Android">
        <p className="text-[15px] text-ink">Share from the store app</p>
        <Steps>
          <Step>
            Open this site in Chrome, then <span className="text-ink">Add to Home screen</span>.
          </Step>
          <Step>
            In the Amazon or Flipkart app, tap Share on a product and choose <span className="text-ink">WishList</span>.
          </Step>
        </Steps>
        <p className="mt-3 max-w-2xl text-[13px] text-muted">The server then fetches the page. If the store blocks it, the item still saves and you can add the price later.</p>
        <p className="mt-8 text-[15px] text-ink">Or use the bookmarklet in Chrome</p>
        <Steps>
          <Step>
            Tap <span className="text-ink">Copy code</span> above.
          </Step>
          <Step>
            Bookmark any page, edit it, name it <span className="text-ink">wl</span> and paste the code as the URL.
          </Step>
          <Step>
            On a product page, type <span className="text-ink">wl</span> in the address bar and tap the bookmark.
          </Step>
        </Steps>
      </Section>

      <Section index="03" title="Status">
        <ul className="-mt-4">
          <Status ok={env.db} label="Cloud database">
            {env.db ? "Connected to Postgres." : "Using the local database in .data/."}
          </Status>
          <Status ok={env.auth} label="Password">
            {env.auth ? "The site is locked with APP_PASSWORD." : "No APP_PASSWORD. Fine locally; a deployed site stays locked without one."}
          </Status>
          <Status ok={env.cron} label="Daily price check">
            {env.cron ? "Runs every morning at 08:00 IST." : "Set CRON_SECRET on Vercel to turn it on."}
          </Status>
          <Status ok={env.serp} label="Live price comparison">
            {env.serp ? "SerpApi key found; Elsewhere can fetch real prices." : "Optional. A free SERPAPI_KEY adds real prices from other stores."}
          </Status>
        </ul>
      </Section>

      <Section index="04" title="Preferences">
        <div className="flex flex-wrap items-center gap-6">
          <span className="flex items-center gap-2 text-[15px] text-ink-2">
            Theme: <ThemeToggle />
          </span>
          {env.auth && (
            <form action={logout}>
              <button type="submit" className="btn-outline">
                Sign out
              </button>
            </form>
          )}
        </div>
      </Section>
    </PageTransition>
  );
}
