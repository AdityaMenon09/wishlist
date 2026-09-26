import { ImageResponse } from "next/og";

const SIZES = new Set([192, 512]);

/** PNG app icons for the PWA manifest, drawn from the same shapes as <Logo />. */
export async function GET(_: Request, { params }: RouteContext<"/icons/[size]">) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f2efea" }}>
        <svg viewBox="0 0 32 32" width={size} height={size}>
          <g transform="translate(16 16) scale(0.72) translate(-16 -16)">
            <path
              d="M4 6.5A2.5 2.5 0 0 1 6.5 4h10.1a2.5 2.5 0 0 1 1.77.73l9.4 9.4a2.5 2.5 0 0 1 0 3.54l-10.1 10.1a2.5 2.5 0 0 1-3.54 0l-9.4-9.4A2.5 2.5 0 0 1 4 16.6z"
              fill="#1d1b18"
            />
            <circle cx="10.5" cy="10.5" r="2.6" fill="#c2410c" />
          </g>
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
