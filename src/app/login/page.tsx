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
        <span className="logo-swing-once inline-block">
          <Logo className="size-8" />
        </span>
        <h1 className="display anim-rise mt-8 text-[44px]">WishList</h1>
        <p className="anim-rise mt-2 text-[15px] text-ink-2 [animation-delay:80ms]">Things you want, what they cost, what you spent.</p>
        <div className="anim-rise mt-10 border-t border-rule pt-8 [animation-delay:160ms]">
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
