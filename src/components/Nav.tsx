"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";
import { Logo, swingTag } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/expenses", label: "Spending" },
  { href: "/setup", label: "Setup" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/wishlist") return pathname.startsWith("/wishlist") || pathname.startsWith("/item");
  return pathname.startsWith(href);
}

export function TopNav({ showLogout }: { showLogout: boolean }) {
  const pathname = usePathname();
  return (
    <header className="site-header sticky top-0 z-20 border-b border-rule bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:h-16 sm:px-8">
        <Link
          href="/"
          transitionTypes={["nav-section"]}
          className="flex shrink-0 items-center gap-2"
          aria-label="WishList home"
          onPointerEnter={(e) => swingTag(e.currentTarget)}
          onFocus={(e) => swingTag(e.currentTarget)}
        >
          <Logo className="size-6" />
          <span className="display hidden text-[22px] sm:inline">WishList</span>
        </Link>
        <nav aria-label="Main" className="ml-auto flex items-center gap-4 sm:gap-7">
          {LINKS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                transitionTypes={["nav-section"]}
                aria-current={active ? "page" : undefined}
                className={`group relative flex h-14 items-center text-[14px] transition-colors duration-200 sm:h-16 sm:text-[15px] ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {label}
                {active ? (
                  <span aria-hidden className="vt-ink absolute inset-x-0 bottom-0 h-[2px] bg-ink" style={{ viewTransitionName: "nav-ink" }} />
                ) : (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-rule-strong transition-transform duration-300 ease-(--ease-out) group-hover:scale-x-100"
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-1 border-l border-rule pl-4 sm:flex">
          <ThemeToggle />
          {showLogout && (
            <form action={logout}>
              <button type="submit" className="meta min-h-11 cursor-pointer px-2 transition-colors duration-200 hover:text-ink">
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
