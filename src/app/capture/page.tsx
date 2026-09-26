import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Capture } from "./Capture";

export const metadata: Metadata = { title: "Saving…" };

export default function CapturePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <Logo className="size-8" />
        <Capture />
      </div>
    </main>
  );
}
