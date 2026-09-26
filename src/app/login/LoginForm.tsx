"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/client-ui";
import { login, type FormState } from "@/lib/actions";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(login, null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!state?.ok) return;
    // Full navigation (not router.push) so the new cookie applies, and the URL fragment
    // survives: the bookmarklet's snapshot lives there when a capture needed a sign-in first.
    const next = new URLSearchParams(location.search).get("next");
    const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    location.replace(safe + location.hash);
  }, [state]);

  return (
    <form action={action} className="card space-y-4 p-5">
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            className="field pr-12"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted hover:text-fg"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
          </button>
        </div>
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
      <FormMessage state={state?.ok ? null : state} />
    </form>
  );
}
