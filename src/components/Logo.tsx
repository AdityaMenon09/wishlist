/** A price tag, cut from ink, with a vermilion eyelet. Same shapes as the app icons. It hangs from the eyelet. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`overflow-visible ${className}`} aria-hidden>
      <g className="logo-tag">
        <path
          d="M4 6.5A2.5 2.5 0 0 1 6.5 4h10.1a2.5 2.5 0 0 1 1.77.73l9.4 9.4a2.5 2.5 0 0 1 0 3.54l-10.1 10.1a2.5 2.5 0 0 1-3.54 0l-9.4-9.4A2.5 2.5 0 0 1 4 16.6z"
          className="fill-ink"
        />
        <circle cx="10.5" cy="10.5" r="2.6" className="fill-accent" />
      </g>
    </svg>
  );
}

/** Swing the tag once (from a hover or tap), without cutting off a swing already in progress. */
export function swingTag(root: Element | null) {
  const tag = root?.querySelector<SVGGElement>(".logo-tag");
  if (!tag || tag.getAnimations().length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  tag.animate(
    [
      { rotate: "0deg" },
      { rotate: "16deg", offset: 0.18 },
      { rotate: "-10deg", offset: 0.38 },
      { rotate: "6deg", offset: 0.56 },
      { rotate: "-3deg", offset: 0.72 },
      { rotate: "1.2deg", offset: 0.86 },
      { rotate: "0deg" },
    ],
    { duration: 1400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  );
}
