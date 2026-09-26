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
        <Logo className="size-8" />
        <h1 className="display mt-8 text-[44px]">WishList</h1>
        <p className="mt-2 text-[15px] text-ink-2">Things you want, what they cost, what you spent.</p>
        <div className="mt-10 border-t border-rule pt-8">
          {authMisconfigured() ? (
            <div role="alert" className="space-y-2 text-[14px] leading-relaxed">
              <p className="text-ink">Set a password to open the site</p>
              <p className="text-muted">
                In Vercel, open the project → Settings → Environment Variables, add <code className="text-ink">APP_PASSWORD</code>, then redeploy.
                It stays locked until then so your spending isn&apos;t public.
              </p>
            </div>
          ) : (
            <LoginForm />
          )}
        </div>
      </div>
    </main>
  );
}
