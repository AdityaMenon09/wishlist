import { TopNav } from "@/components/Nav";
import { authEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav showLogout={authEnabled()} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-20 sm:px-8 sm:pt-14">{children}</main>
    </div>
  );
}
