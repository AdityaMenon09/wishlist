/** Price tag with a heart punched in it. Also used (as markup) for the app icons. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#2563eb" />
      <path
        d="M8 9.5A1.5 1.5 0 0 1 9.5 8h6.38a1.5 1.5 0 0 1 1.06.44l6.62 6.62a1.5 1.5 0 0 1 0 2.12l-6.38 6.38a1.5 1.5 0 0 1-2.12 0l-6.62-6.62A1.5 1.5 0 0 1 8 15.88z"
        fill="#fff"
      />
      <path
        d="M15.5 19.2l-2.6-2.5a1.55 1.55 0 0 1 2.2-2.2l.4.4.4-.4a1.55 1.55 0 0 1 2.2 2.2z"
        fill="#10b981"
      />
      <circle cx="11.5" cy="11.5" r="1.3" fill="#2563eb" />
    </svg>
  );
}
