import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({ variable: "--font-rubik", subsets: ["latin"], weight: ["500", "600", "700"] });
const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "WishList", template: "%s · WishList" },
  description: "Personal wishlist, price tracker and expense log.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1222" },
    { media: "(prefers-color-scheme: light)", color: "#f3f5fa" },
  ],
};

// Runs before paint so the saved/system theme never flashes the wrong colours.
const themeScript = `try{var t=localStorage.getItem("wl-theme");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${rubik.variable} ${nunito.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
