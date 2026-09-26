# WishList

A personal wishlist, price tracker and expense log.

- **Paste a product link** (Amazon, Flipkart, Myntra, anything) → title, image, price, MRP and specs.
- **Daily price checks** build a price history graph.
- **Price outlook**: buy now / wait / keep watching, with the reasons, a 30-day projection and a likely range.
  Rule-based on purpose (trend, history, the Indian sale calendar); one product's history is too sparse for ML.
- **Other trusted stores**: search links to Croma, Reliance Digital, Myntra, AJIO…, or real prices with a free SerpApi key.
- **Expenses**: log spending by category; "I bought this" on a wishlist item logs it automatically.

## How product data gets in

Amazon and Flipkart often block requests from servers (Vercel runs on AWS). So there are three ways in:

| Way | Where it runs | Blocked? |
| --- | --- | --- |
| Paste a link / daily check | Vercel server | Sometimes. Item is still saved, with a warning |
| **Bookmarklet** (Setup page) | Your own browser, on the product page | Never |
| Share from the Amazon/Flipkart app | Server (via the installed PWA) | Sometimes |

If an item says **Needs price**, open the product page and click the bookmarklet, or type the price in.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no `DATABASE_URL`, data goes to an embedded Postgres (PGlite) in `./.data`.
With no `APP_PASSWORD`, there's no login locally.

## Deploy (free)

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo → Deploy.
3. In the project → **Storage** → **Create Database** → **Neon** (free) → connect it. This sets `DATABASE_URL`.
4. **Settings → Environment Variables**:
   - `APP_PASSWORD`: your login password (required; the site stays locked without it)
   - `CRON_SECRET`: any long random string (enables the 8:00 IST daily price check)
   - `SERPAPI_KEY`: optional, from [serpapi.com](https://serpapi.com) (free tier), for real prices from other stores
5. **Deployments → Redeploy** so the variables apply.
6. Open the live site → **Setup** → drag the bookmarklet to your bookmarks bar (reinstall it from the live site, not localhost).

The daily check is set in `vercel.json` (`30 2 * * *` UTC = 08:00 IST). Vercel's free plan allows one run per day.

## Code map

| Path | What |
| --- | --- |
| `src/lib/scrape/parse.ts` | Product extraction: JSON-LD, Amazon, Flipkart's embedded state, meta tags, bookmarklet hints |
| `src/lib/scrape/fetch.ts` | Server-side page fetch + bot-wall detection |
| `src/lib/bookmarklet.ts` | The bookmarklet source |
| `src/lib/outlook.ts` | Price outlook: verdict, reasons, projection, sale calendar |
| `src/lib/stores.ts` | Trusted store list, URL canonicalisation |
| `src/lib/db.ts`, `repo.ts` | Postgres (Neon or PGlite) and all queries |
| `src/lib/actions.ts` | Server actions (every one checks the session) |
| `src/proxy.ts` | Login gate for every page |
| `src/app/api/cron/refresh` | Daily price check |
