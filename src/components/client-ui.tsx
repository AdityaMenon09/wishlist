"use client";

import { Loader2 } from "lucide-react";
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
      {pending && <Loader2 aria-hidden className="anim-fade size-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

/**
 * The product photo is the card (teenage engineering): a plain plate, no border or shadow.
 * Store photos are shot on white, so the plate stays near-white even in dark mode.
 */
export function ProductImage({
  src,
  alt,
  className = "",
  zoom = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  /** Ease the photo in a touch when an ancestor `.group` is hovered. */
  zoom?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-plate ${className}`}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={`absolute inset-0 size-full object-contain p-[9%] mix-blend-multiply ${
            zoom ? "transition-transform duration-700 ease-(--ease-out) group-hover:scale-[1.045] motion-reduce:transition-none" : ""
          }`}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <span className="meta text-[#8a857c]">No image</span>
        </div>
      )}
    </div>
  );
}

export function FormMessage({ state }: { state: { error?: string; message?: string } | null }) {
  if (!state) return null;
  if (state.error)
    return (
      <p key={state.error} role="alert" className="anim-rise text-[14px] text-up">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p key={state.message} role="status" className="anim-rise text-[14px] text-down">
        {state.message}
      </p>
    );
  return null;
}
