"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

const REDUCE = "(prefers-reduced-motion: reduce)";

function subscribeReduce(cb: () => void) {
  const mq = matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduce, () => matchMedia(REDUCE).matches, () => false);
}

/** True once the element has been on screen. Animations wait for it so they aren't spent below the fold. */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}

/** Holds `.bar-grow` children paused until the block scrolls into view. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  return (
    <div ref={ref} data-shown={seen} className={className}>
      {children}
    </div>
  );
}

const DIGITS = [..."01234567890123456789"];

/**
 * A figure that rolls into place on number wheels, like a price-tag gun. Server-rendered at
 * its final value with a CSS roll from zero; later changes roll each wheel from its old digit,
 * up when the number grows and down when it shrinks.
 */
export function Odometer({ text, className = "" }: { text: string; className?: string }) {
  const chars = [...text];
  const root = useRef<HTMLSpanElement>(null);
  const prev = useRef(text);
  const prevNum = useRef(parse(text));

  useLayoutEffect(() => {
    const before = prev.current;
    const from = prevNum.current;
    prev.current = text;
    prevNum.current = parse(text);
    if (before === text || !root.current || matchMedia(REDUCE).matches) return;
    const up = prevNum.current >= from;
    root.current.querySelectorAll<HTMLElement>("[data-k]").forEach((strip) => {
      const k = Number(strip.dataset.k);
      const old = Number(before[before.length - k]);
      const now = Number(strip.dataset.d);
      if (Number.isNaN(old) || old === now) return;
      const pos = (n: number) => `translateY(${n * -5}%)`;
      strip.animate(
        [
          { transform: pos(up ? old : 10 + old), filter: "blur(0)" },
          { filter: "blur(0.8px)", offset: 0.35 },
          { transform: pos(up ? 10 + now : now), filter: "blur(0)" },
        ],
        { duration: 620 + (k < 4 ? (4 - k) * 60 : 0), easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    });
  }, [text]);

  let col = 0;
  return (
    <span ref={root} className={`odo ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {chars.map((ch, i) => {
          const k = chars.length - i; // keyed from the right so wheels persist when the number grows
          if (!/\d/.test(ch))
            return (
              <span key={`c${k}`} className="odo-char">
                {ch}
              </span>
            );
          const n = col++;
          return (
            <span key={`d${k}`} className="odo-col">
              <span className="odo-strip" data-k={k} data-d={ch} style={{ "--d": ch, "--n": n } as CSSProperties}>
                {DIGITS.map((d, j) => (
                  <span key={j}>{d}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

function parse(text: string) {
  return Number(text.replace(/[^\d.]/g, "")) || 0;
}
