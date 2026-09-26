"use client";

import { ImageOff, Loader2 } from "lucide-react";
import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/actions";

/**
 * Like useActionState, but submits via onSubmit so React 19 doesn't auto-reset the form:
 * on a validation error the user keeps what they typed. Reset on success yourself.
 */
export function useFormAction(action: (state: FormState, fd: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, null);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return { state, onSubmit, pending };
}

export function SubmitButton({
  children,
  pendingText,
  className = "btn-primary",
  pending: pendingProp,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

/** Store images come from many CDNs, so a plain <img> with a graceful fallback. */
export function ProductImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative overflow-hidden rounded-xl bg-white ${className}`}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-contain p-2"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-surface-2 text-muted">
          <ImageOff aria-hidden className="size-6" />
        </div>
      )}
    </div>
  );
}

export function FormMessage({ state }: { state: { error?: string; message?: string } | null }) {
  if (!state) return null;
  if (state.error)
    return (
      <p role="alert" className="text-sm font-semibold text-up">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="text-sm font-semibold text-down">
        {state.message}
      </p>
    );
  return null;
}
