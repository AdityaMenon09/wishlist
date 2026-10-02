import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz", "SOFT"] });
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "WishList", template: "%s · WishList" },
  description: "Personal wishlist, price tracker and expense log.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2efea" },
    { media: "(prefers-color-scheme: dark)", color: "#151412" },
  ],
};

// Applies a saved theme choice before paint (no choice saved = follow the system), and flags
// the first paint so entrance choreography runs on a fresh load but not on client navigations.
const themeScript = `(function(d){try{var t=localStorage.getItem("wl-theme");if(t)d.dataset.theme=t}catch(e){}d.dataset.boot="";setTimeout(function(){delete d.dataset.boot},1500)})(document.documentElement)`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${fraunces.variable} ${instrument.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
