import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Capture } from "./Capture";

export const metadata: Metadata = { title: "Saving…" };

export default function CapturePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="card w-full max-w-md p-6 text-center">
        <Logo className="mx-auto size-10" />
        <Capture />
      </div>
    </main>
  );
}
