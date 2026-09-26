"use client";

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
    <form action={action} className="space-y-5">
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="label">
            Password
          </label>
          <button type="button" onClick={() => setShow((s) => !s)} className="meta min-h-8 cursor-pointer hover:text-ink">
            {show ? "hide" : "show"}
          </button>
        </div>
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          autoFocus
          required
          className="field"
        />
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
      <FormMessage state={state?.ok ? null : state} />
    </form>
  );
}
