import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { authMisconfigured } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="size-12" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">WishList</h1>
          <p className="mt-1 text-sm text-muted">Your wishlist, prices and spending.</p>
        </div>
        {authMisconfigured() ? (
          <div role="alert" className="card space-y-2 p-5 text-sm">
            <p className="font-semibold">Set a password to open the site</p>
            <p className="text-muted">
              In Vercel, open the project → Settings → Environment Variables, add <code className="text-fg">APP_PASSWORD</code>, then
              redeploy. The site stays locked until then so your spending isn&apos;t public.
            </p>
          </div>
        ) : (
          <LoginForm />
        )}
      </div>
    </main>
  );
}
