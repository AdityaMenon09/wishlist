import { BottomNav, MobileTopBar, Sidebar } from "@/components/Nav";
import { authEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar showLogout={authEnabled()} />
      <div className="min-w-0 flex-1">
        <MobileTopBar />
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
