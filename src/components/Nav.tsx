"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, Puzzle, Wallet } from "lucide-react";
import { logout } from "@/lib/actions";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/setup", label: "Setup", icon: Puzzle },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/wishlist") return pathname.startsWith("/wishlist") || pathname.startsWith("/item");
  return pathname.startsWith(href);
}

export function Sidebar({ showLogout }: { showLogout: boolean }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface/60 px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
        <Logo className="size-8" />
        <span className="font-display text-lg font-semibold tracking-tight">WishList</span>
      </Link>
      <nav aria-label="Main" className="flex flex-col gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-200 ${
                active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2/60 hover:text-fg"
              }`}
            >
              <Icon aria-hidden className={`size-[18px] ${active ? "text-link" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-2 px-1">
        <ThemeToggle />
        {showLogout && (
          <form action={logout}>
            <button type="submit" className="btn-ghost px-3" aria-label="Sign out">
              <LogOut aria-hidden className="size-4" />
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur lg:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="size-7" />
        <span className="font-display text-base font-semibold">WishList</span>
      </Link>
      <ThemeToggle />
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors duration-200 ${
              active ? "text-link" : "text-muted"
            }`}
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
