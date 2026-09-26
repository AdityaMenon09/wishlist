/** A price tag, cut from ink, with a vermilion eyelet. Same shapes as the app icons. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h10.1a2.5 2.5 0 0 1 1.77.73l9.4 9.4a2.5 2.5 0 0 1 0 3.54l-10.1 10.1a2.5 2.5 0 0 1-3.54 0l-9.4-9.4A2.5 2.5 0 0 1 4 16.6z"
        className="fill-ink"
      />
      <circle cx="10.5" cy="10.5" r="2.6" className="fill-accent" />
    </svg>
  );
}
